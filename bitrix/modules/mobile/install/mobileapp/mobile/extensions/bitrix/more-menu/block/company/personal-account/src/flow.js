/**
 * @module more-menu/block/company/personal-account/src/flow
 */
jn.define('more-menu/block/company/personal-account/src/flow', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { BottomSheet } = require('bottom-sheet');
	const { showErrorToast } = require('toast');
	const { createTestIdGenerator } = require('utils/test');
	const { PerfPoint } = require('debug/prism');
	const { SalaryVacationApi } = require('more-menu/block/company/personal-account/src/api/salary-vacation-api');
	const { PullHandler } = require('more-menu/block/company/personal-account/src/pull/pull-handler');
	const { StepperSlide } = require('more-menu/block/company/personal-account/src/slides/stepper-slide');
	const { DocumentSlide, DocStage } = require('more-menu/block/company/personal-account/src/slides/document-slide');

	const StepType = {
		FORM: 'form',
		PIN: 'pin',
	};

	const PullCommand = {
		PIN_READY: 'salaryVacationPinReady',
		DOCUMENT_READY: 'salaryVacationDocumentReady',
	};

	// Height of the sheet on the stepper slide; kept fixed so it does not jump on step change.
	const BACKDROP_HEIGHT = 320;
	// Top gap left above the sheet when it is expanded to show the document (mirrors alwaysOnTop).
	const DOC_TOP_OFFSET = 70;
	// Loader stays at least this long before an error, so a fast reject still shows feedback.
	const PIN_REQUEST_MIN_VISIBLE_MS = 1000;
	// The arrived PIN is shown filled for this long (with the primary button in a loading
	// state) before advancing, so the auto-fill is visible instead of an instant jump.
	const PIN_AUTOFILL_VISIBLE_MS = 2000;

	/**
	 * Personal account flow rendered as a single bottom-sheet that shows one of two
	 * views by state: the stepper (form -> pin) and the document result. It owns the
	 * whole flow state (companyId / employeeId / period / pin and the document stage)
	 * and all async orchestration (requestPin -> PullHandler -> auto-fill ->
	 * requestDocument -> document). The active view is switched via `state.onDocumentSlide`
	 * (a re-render), not by imperative navigation.
	 *
	 * @class PersonalAccountFlow
	 */
	class PersonalAccountFlow extends LayoutComponent
	{
		/**
		 * Builds the ordered step set and whether a progress indicator is shown.
		 *
		 * @param {string} type - 'salary' | 'vacation'
		 * @param {Array<object>} companies
		 * @return {{ steps: Array<{ type: string, company?: boolean, period?: boolean }>, showProgress: boolean }}
		 */
		static buildFlow(type, companies)
		{
			const needCompany = companies.length > 1;
			const steps = [];

			if (type === 'salary')
			{
				steps.push({ type: StepType.FORM, company: needCompany, period: true });
				steps.push({ type: StepType.PIN });
			}
			else
			{
				if (needCompany)
				{
					steps.push({ type: StepType.FORM, company: true, period: false });
				}
				steps.push({ type: StepType.PIN });
			}

			return {
				steps,
				showProgress: steps.length > 1,
			};
		}

		/**
		 * @param {{ type: string, companies: Array<object>, parentLayout?: object }} params
		 * @return {Promise<object>}
		 */
		static async open({ type, companies, parentLayout })
		{
			const { steps, showProgress } = PersonalAccountFlow.buildFlow(type, companies);
			const component = new PersonalAccountFlow({ type, companies, steps, showProgress, parentLayout });

			const bottomSheet = new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: PersonalAccountFlow.#getTitle(type),
				},
				component,
			});

			const openPoint = new PerfPoint('Personal Account Open', type).start();

			const widget = await bottomSheet
				.setParentWidget(parentLayout || PageManager)
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.disableShowOnTop()
				.disableOnlyMediumPosition()
				.enableResizeContent()
				.enableAdoptHeightByKeyboard()
				.disableHorizontalSwipe()
				.setBackgroundColor(Color.bgContentPrimary)
				.open()
				.catch(console.error);

			openPoint.end();

			if (widget)
			{
				component.setLayoutWidget(widget);
			}

			return widget;
		}

		static #getTitle(type)
		{
			return Loc.getMessage(
				type === 'salary'
					? 'MORE_MENU_COMPANY_PERSONAL_ACCOUNT_SALARY'
					: 'MORE_MENU_COMPANY_PERSONAL_ACCOUNT_VACATION',
			);
		}

		static #lastCompletedMonthPeriod()
		{
			const today = new Date();
			// Salary exists only for a finished month, so the newest period is the previous one.
			const lastCompleted = new Date(today.getFullYear(), today.getMonth() - 1, 1);

			return { month: lastCompleted.getMonth() + 1, year: lastCompleted.getFullYear() };
		}

		static #buildProgressSteps(steps)
		{
			const labelByType = {
				[StepType.FORM]: 'MORE_MENU_COMPANY_PERSONAL_ACCOUNT_STEP_FORM',
				[StepType.PIN]: 'MORE_MENU_COMPANY_PERSONAL_ACCOUNT_STEP_PIN',
			};

			return steps.map((step) => ({ label: Loc.getMessage(labelByType[step.type]) }));
		}

		/**
		 * @param {{ type: string, companies: Array<object>, steps: Array<object>, showProgress: boolean, parentLayout?: object }} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'personal-account' });
			this.api = new SalaryVacationApi();
			this.layoutWidget = null;
			// Late REST answers must not revive the flow after the sheet is closed.
			this.isUnmounted = false;

			this.pinHandler = null;
			this.docHandler = null;
			this.pinWaitPoint = null;
			this.docWaitPoint = null;
			this.docRequested = false;
			this.pinRequestStartedAt = null;
			this.pinFailTimer = null;
			this.pinAutoFillTimer = null;

			// Preselect the first company always; salary defaults the period to the current month.
			const defaultCompany = props.companies[0] ?? null;

			this.state = {
				onDocumentSlide: false,
				currentStepIndex: 0,
				companyId: defaultCompany?.companyId ?? null,
				employeeId: defaultCompany?.employees?.[0]?.id ?? null,
				period: props.type === 'salary' ? PersonalAccountFlow.#lastCompletedMonthPeriod() : null,
				pin: '',
				requestPinAt: null,
				pinWaiting: false,
				pinFailed: false,
				pinAutoFilled: false,
				docStage: null,
				documentHtml: null,
			};
		}

		componentDidMount()
		{
			if (this.#currentStep().type === StepType.PIN)
			{
				this.#enterPinStep();
			}
		}

		componentWillUnmount()
		{
			this.isUnmounted = true;
			this.#stopPinHandler();
			this.#stopDocHandler();
			this.#clearPinFailTimer();
			this.#clearPinAutoFillTimer();
		}

		setLayoutWidget(widget)
		{
			this.layoutWidget = widget;
		}

		render()
		{
			return this.state.onDocumentSlide
				? this.#renderDocumentSlide()
				: this.#renderStepperSlide();
		}

		#renderStepperSlide()
		{
			const { companies, steps, showProgress } = this.props;
			const step = this.#currentStep();

			return new StepperSlide({
				testId: this.getTestId(),
				step,
				showProgress,
				currentStepIndex: this.state.currentStepIndex,
				progressSteps: PersonalAccountFlow.#buildProgressSteps(steps),
				companies,
				companyId: this.state.companyId,
				employeeId: this.state.employeeId,
				period: this.state.period,
				pin: this.state.pin,
				pinWaiting: this.state.pinWaiting,
				pinFailed: this.state.pinFailed,
				pinAutoFilled: this.state.pinAutoFilled,
				requestPinAt: this.state.requestPinAt,
				primaryButton: this.#getPrimaryButton(step),
				onFormChange: this.handleFormChange,
				onPinChange: this.handlePinChange,
				onPinResend: this.handlePinResend,
			});
		}

		#renderDocumentSlide()
		{
			return new DocumentSlide({
				testId: this.getTestId(),
				stage: this.state.docStage,
				documentHtml: this.state.documentHtml,
				onClose: this.handleClose,
			});
		}

		#getPrimaryButton(step)
		{
			if (step.type === StepType.FORM)
			{
				return {
					text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_NEXT'),
					testId: this.getTestId('form-next'),
					disabled: !this.#isFormValid(step),
					onClick: this.handleFormSubmit,
				};
			}

			return {
				text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_CONTINUE'),
				testId: this.getTestId('pin-continue'),
				disabled: !this.#isPinFilled(),
				loading: this.state.pinAutoFilled,
				onClick: this.handlePinContinue,
			};
		}

		handleFormChange = (patch) => {
			this.setState(patch);
		};

		handleFormSubmit = () => {
			if (!this.#isFormValid(this.#currentStep()))
			{
				return;
			}

			this.setState(
				{ currentStepIndex: this.state.currentStepIndex + 1 },
				() => {
					this.#enterPinStep();
				},
			);
		};

		handlePinChange = (pin) => {
			this.setState({ pin });
		};

		handlePinContinue = () => {
			// Manual path: user typed the PIN and pressed "Continue" - same route as auto.
			if (this.state.pin)
			{
				this.#enterDocumentAndRequest(this.state.pin);
			}
		};

		handlePinResend = () => {
			const { type } = this.props;
			const { companyId, employeeId } = this.state;

			// Optimistic: show the loader and drop any prior error the moment the request starts.
			this.#clearPinFailTimer();
			this.#clearPinAutoFillTimer();
			this.pinRequestStartedAt = Date.now();
			this.setState({ pinWaiting: true, pinFailed: false, pinAutoFilled: false, requestPinAt: Date.now() });

			this.api
				.requestPin({ companyId, employeeId, type })
				.then(({ taskId }) => {
					if (this.isUnmounted)
					{
						return;
					}

					this.setState({ pinWaiting: true, pinFailed: false });
					this.#startPinHandler(taskId);
				})
				.catch((response) => this.#handleRequestPinError(response));
		};

		handleClose = () => {
			this.layoutWidget?.close();
		};

		#enterPinStep()
		{
			const { type } = this.props;
			const { companyId, employeeId } = this.state;

			// Optimistic: show the loader and drop any prior error the moment the request starts.
			this.#clearPinFailTimer();
			this.#clearPinAutoFillTimer();
			this.pinRequestStartedAt = Date.now();
			this.setState({ pinWaiting: true, pinFailed: false, pinAutoFilled: false, requestPinAt: Date.now() });

			// Idempotent by contract: the server throttles requestPin (60s window per
			// company+employee) and reuses a recent job, so re-entering the PIN step on a
			// reopened sheet reuses the same taskId without issuing a new PIN.
			this.api
				.requestPin({ companyId, employeeId, type })
				.then(({ taskId }) => {
					if (this.isUnmounted)
					{
						return;
					}

					this.setState({ pinWaiting: true, pinFailed: false });
					this.#startPinHandler(taskId);
				})
				.catch((response) => this.#handleRequestPinError(response));
		}

		#startPinHandler(taskId)
		{
			this.#stopPinHandler();

			this.pinWaitPoint = new PerfPoint('Personal Account Await PIN', this.props.type).start();

			const { companyId, employeeId } = this.state;

			this.pinHandler = new PullHandler({
				api: this.api,
				taskId,
				command: PullCommand.PIN_READY,
				companyId,
				employeeId,
				onDone: (result) => this.#onPinReady(result),
				onError: (reason) => this.#onAsyncError(reason, 'pin'),
			});
			this.pinHandler.start();
		}

		#onPinReady(result)
		{
			// PIN wait is over the moment its terminal result arrives (delivered or empty).
			this.pinWaitPoint?.end();

			const pin = result?.pin;

			if (!pin)
			{
				// PIN did not arrive - stop waiting so the user can request it again.
				this.setState({ pinWaiting: false, requestPinAt: null, pinFailed: true });

				return;
			}

			this.#showAutoFilledThenRequest(pin);
		}

		#showAutoFilledThenRequest(pin)
		{
			// Show the PIN filled in for a beat so the auto-fill reads as a state change,
			// then advance. The PIN channel is done - silence it and drop the keyboard.
			this.#stopPinHandler();
			Keyboard.dismiss();
			this.setState({ pin, pinWaiting: false, pinFailed: false, pinAutoFilled: true });

			this.#clearPinAutoFillTimer();
			this.pinAutoFillTimer = setTimeout(() => {
				this.pinAutoFillTimer = null;
				this.#enterDocumentAndRequest(pin);
			}, PIN_AUTOFILL_VISIBLE_MS);
		}

		#enterDocumentAndRequest(pin)
		{
			this.#goToDocumentSlide();
			this.#requestDocument(pin);
		}

		#goToDocumentSlide()
		{
			if (this.state.onDocumentSlide)
			{
				return;
			}

			// Hide the keyboard so it never lingers over the document (incl. the auto-PIN path).
			Keyboard.dismiss();
			this.setState({ onDocumentSlide: true }, () => {
				this.#expandSheet();
			});
		}

		#requestDocument(pin)
		{
			if (this.docRequested)
			{
				return;
			}
			this.docRequested = true;

			// Past the PIN now - silence its channel (the auto path already finished it).
			this.#stopPinHandler();

			const { type } = this.props;
			const { companyId, employeeId, period } = this.state;

			this.setState({
				pin,
				pinWaiting: false,
				docStage: DocStage.LOADING,
				documentHtml: null,
			});

			this.api
				.requestDocument({ companyId, employeeId, type, pin, period })
				.then(({ taskId }) => {
					if (this.isUnmounted)
					{
						return;
					}

					this.#startDocHandler(taskId);
				})
				.catch((response) => this.#handleRequestDocumentError(response));
		}

		#startDocHandler(taskId)
		{
			this.#stopDocHandler();

			this.docWaitPoint = new PerfPoint('Personal Account Await Document', this.props.type).start();

			const { companyId, employeeId } = this.state;

			this.docHandler = new PullHandler({
				api: this.api,
				taskId,
				command: PullCommand.DOCUMENT_READY,
				companyId,
				employeeId,
				onDone: (result) => this.#onDocumentReady(result),
				onError: (reason) => this.#onAsyncError(reason, 'document'),
			});
			this.docHandler.start();
		}

		#onDocumentReady(result)
		{
			this.#stopPinHandler();
			this.#stopDocHandler();

			const documentHtml = result?.documentHtml;
			if (!documentHtml)
			{
				// A DONE document job without a payload is an anomaly - fail the flow.
				this.#failWithToast();

				return;
			}

			// PIN is a short-lived secret - drop it now that the document is ready.
			this.setState({ pin: '', docStage: DocStage.READY, documentHtml });
		}

		#failWithToast()
		{
			this.#stopPinHandler();
			this.#stopDocHandler();
			this.layoutWidget?.close();
			showErrorToast({ message: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_ERROR_TOAST') });
		}

		#onAsyncError(reason, scope)
		{
			if (scope === 'document')
			{
				this.#failWithToast();

				return;
			}

			this.pinWaitPoint?.end();

			// PIN did not arrive - stop waiting so the user can request it again.
			this.setState({ pinWaiting: false, requestPinAt: null, pinFailed: true });
		}

		#handleRequestPinError(response)
		{
			if (this.isUnmounted)
			{
				return;
			}

			// Keep the loader up for a moment so an instant reject still reads as a state change.
			const elapsed = Date.now() - (this.pinRequestStartedAt || 0);
			const delay = Math.max(0, PIN_REQUEST_MIN_VISIBLE_MS - elapsed);

			this.#clearPinFailTimer();
			this.pinFailTimer = setTimeout(() => {
				this.pinFailTimer = null;
				this.setState({ pinWaiting: false, requestPinAt: null, pinFailed: true });
			}, delay);
		}

		#handleRequestDocumentError(response)
		{
			if (this.isUnmounted)
			{
				return;
			}

			this.#failWithToast();
		}

		#expandSheet()
		{
			const screenHeight = device?.screen?.height;
			if (!screenHeight)
			{
				return;
			}

			const height = screenHeight - DOC_TOP_OFFSET;

			this.layoutWidget?.setBottomSheetParams({ mediumPositionHeight: height, onlyMediumPosition: true });
			this.layoutWidget?.setBottomSheetHeight(height);
		}

		#stopPinHandler()
		{
			if (this.pinHandler)
			{
				this.pinHandler.stop();
				this.pinHandler = null;
			}

			// Safety net: closes the wait on abandon (unmount), resend restart and the move past PIN.
			this.pinWaitPoint?.end();
			this.pinWaitPoint = null;
		}

		#stopDocHandler()
		{
			if (this.docHandler)
			{
				this.docHandler.stop();
				this.docHandler = null;
			}

			// Every document terminal (ready, failure, unmount) routes through here - close the wait.
			this.docWaitPoint?.end();
			this.docWaitPoint = null;
		}

		#clearPinFailTimer()
		{
			if (this.pinFailTimer)
			{
				clearTimeout(this.pinFailTimer);
				this.pinFailTimer = null;
			}
		}

		#clearPinAutoFillTimer()
		{
			if (this.pinAutoFillTimer)
			{
				clearTimeout(this.pinAutoFillTimer);
				this.pinAutoFillTimer = null;
			}
		}

		#isFormValid(step)
		{
			if (step.type !== StepType.FORM)
			{
				return true;
			}

			const needPeriod = Boolean(step.period);

			return this.state.companyId !== null && (!needPeriod || this.state.period !== null);
		}

		#isPinFilled()
		{
			const { pin } = this.state;

			return typeof pin === 'string' && pin.length > 0;
		}

		#currentStep()
		{
			return this.props.steps[this.state.currentStepIndex];
		}
	}

	module.exports = { PersonalAccountFlow };
});
