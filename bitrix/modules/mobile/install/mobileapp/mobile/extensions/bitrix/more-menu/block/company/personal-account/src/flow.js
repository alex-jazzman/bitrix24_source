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

	// How the run of the flow reads to the owner of the card. The words are the ones the section of the
	// company spells the state of a card with, so the owner hears of a flow in the vocabulary it already
	// has. Only the run travels this way - never the document, the code or the employee behind them.
	const FlowState = {
		STARTED: 'pending',
		SUCCEEDED: 'success',
		FAILED: 'failed',
	};

	// Height of the sheet on the stepper slide; kept fixed so it does not jump on step change.
	const BACKDROP_HEIGHT = 320;
	// Top gap left above the sheet when it is expanded to show the document (mirrors alwaysOnTop).
	const DOC_TOP_OFFSET = 70;
	// A PIN request stays pending at least this long before a failure may replace it.
	const PIN_REQUEST_MIN_VISIBLE_MS = 1000;
	// An auto-delivered PIN is shown filled for this long before advancing, so its arrival reads as
	// a state change instead of an instant jump.
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
		 * @param {object} params
		 * @param {string} params.type
		 * @param {Array<object>} params.companies
		 * @param {object} [params.parentLayout]
		 * @param {function} [params.onFlowStateChange] how the run of the flow went
		 * @return {Promise<object>}
		 */
		static async open({ type, companies, parentLayout, onFlowStateChange = null })
		{
			onFlowStateChange?.(type, FlowState.STARTED);

			const { steps, showProgress } = PersonalAccountFlow.buildFlow(type, companies);
			const component = new PersonalAccountFlow({
				type,
				companies,
				steps,
				showProgress,
				parentLayout,
				onFlowStateChange,
			});

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
		 * @param {object} props
		 * @param {string} props.type
		 * @param {Array<object>} props.companies
		 * @param {Array<object>} props.steps
		 * @param {boolean} props.showProgress
		 * @param {object} [props.parentLayout]
		 * @param {function} [props.onFlowStateChange] how the run of the flow went
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'personal-account' });
			this.api = new SalaryVacationApi();
			this.layoutWidget = null;
			// Late REST answers must not revive the flow after the sheet is closed.
			this.isUnmounted = false;
			// One terminal per run: whatever ends the run first closes the pair its start opened.
			this.flowTerminalReported = false;

			this.pinHandler = null;
			this.docHandler = null;
			this.pinWaitPoint = null;
			this.docWaitPoint = null;
			this.docRequested = false;
			// Guards the transition a complete code starts: the cells report completion for a code
			// written from the outside too, so the push route would restart its own timer.
			this.pinTransitionStarted = false;
			this.pinRequestStartedAt = null;
			this.pinFailTimer = null;
			this.pinAcceptedTimer = null;

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
				pinFailed: false,
				// The code is complete and the step is advancing: the cells stay frozen until it does.
				pinAccepted: false,
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
			this.#clearPinAcceptedTimer();
			// A sheet closed before the document arrived - on the form or on the code - ends the run all
			// the same, and the run that brought no document has only the failed terminal left to it.
			this.#reportFlowState(FlowState.FAILED);
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
				pinFailed: this.state.pinFailed,
				pinAccepted: this.state.pinAccepted,
				requestPinAt: this.state.requestPinAt,
				primaryButton: this.#getPrimaryButton(step),
				onFormChange: this.handleFormChange,
				onPinChange: this.handlePinChange,
				onPinComplete: this.handlePinComplete,
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

		/**
		 * @return {?object} primary action of the step, absent on the PIN step: a complete code is
		 *   its own confirmation, so the resend control is the only thing that footer carries.
		 */
		#getPrimaryButton(step)
		{
			if (step.type !== StepType.FORM)
			{
				return null;
			}

			return {
				text: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_NEXT'),
				testId: this.getTestId('form-next'),
				disabled: !this.#isFormValid(step),
				onClick: this.handleFormSubmit,
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

		handlePinComplete = (pin) => {
			// Typed by hand, and advancing at once. The code a push delivers is accepted by #onPinReady
			// instead: the cells report completion for it too, and that report must not cut short the
			// beat it is being shown for.
			this.#acceptPin(pin, false);
		};

		handlePinResend = () => {
			const { type } = this.props;
			const { companyId, employeeId } = this.state;

			// Optimistic: drop any prior error and restart the countdown the moment the request starts.
			this.#clearPinFailTimer();
			this.#clearPinAcceptedTimer();
			this.pinTransitionStarted = false;
			this.pinRequestStartedAt = Date.now();
			this.setState({
				pinFailed: false,
				pinAccepted: false,
				requestPinAt: Date.now(),
			});

			this.api
				.requestPin({ companyId, employeeId, type })
				.then(({ taskId }) => {
					if (this.isUnmounted)
					{
						return;
					}

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

			// Optimistic: drop any prior error and restart the countdown the moment the request starts.
			this.#clearPinFailTimer();
			this.#clearPinAcceptedTimer();
			this.pinTransitionStarted = false;
			this.pinRequestStartedAt = Date.now();
			this.setState({
				pinFailed: false,
				pinAccepted: false,
				requestPinAt: Date.now(),
			});

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
				this.setState({ requestPinAt: null, pinFailed: true });

				return;
			}

			this.#acceptPin(pin, true);
		}

		/**
		 * The one route past a complete code, however it got complete: the code stops being editable
		 * and the document is requested. An auto-delivered code waits out a beat first so its arrival
		 * is visible; a hand-typed one goes straight through.
		 * @param {string} pin
		 * @param {boolean} isAutoFilled - the code arrived on its own, and is shown for a beat first
		 */
		#acceptPin(pin, isAutoFilled)
		{
			if (this.pinTransitionStarted)
			{
				return;
			}
			this.pinTransitionStarted = true;

			// The PIN channel is done - silence it.
			this.#stopPinHandler();

			// Everything past the code waits for the cells to be rendered frozen: while they still take
			// input, the input returns the focus to its active cell after the keystroke that completed
			// the code, and a keyboard dropped before that is pulled straight back up.
			this.setState(
				{
					pin,
					pinFailed: false,
					pinAccepted: true,
				},
				() => {
					Keyboard.dismiss();

					if (!isAutoFilled)
					{
						this.#enterDocumentAndRequest(pin);

						return;
					}

					this.pinAcceptedTimer = setTimeout(() => {
						this.pinAcceptedTimer = null;
						this.#enterDocumentAndRequest(pin);
					}, PIN_AUTOFILL_VISIBLE_MS);
				},
			);
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

			// The keyboard is already down: #acceptPin, the only route here, drops it once the cells
			// have stopped taking input.
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
			this.#reportFlowState(FlowState.SUCCEEDED);
		}

		/**
		 * Every terminal of the flow routes through here: a document that came back empty, a failure of
		 * the request and a failure of the wait alike.
		 */
		#failWithToast()
		{
			this.#reportFlowState(FlowState.FAILED);
			this.#stopPinHandler();
			this.#stopDocHandler();
			this.layoutWidget?.close();
			showErrorToast({ message: Loc.getMessage('MORE_MENU_COMPANY_PERSONAL_ACCOUNT_ERROR_TOAST') });
		}

		/**
		 * Only the first terminal travels: the close of the sheet follows every other one, and a second
		 * report would count one run twice.
		 *
		 * @param {string} state one of FlowState
		 */
		#reportFlowState(state)
		{
			if (this.flowTerminalReported)
			{
				return;
			}
			this.flowTerminalReported = true;

			this.props.onFlowStateChange?.(this.props.type, state);
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
			this.setState({ requestPinAt: null, pinFailed: true });
		}

		#handleRequestPinError(response)
		{
			if (this.isUnmounted)
			{
				return;
			}

			// Keep the request pending for a moment so an instant reject still reads as a state change.
			const elapsed = Date.now() - (this.pinRequestStartedAt || 0);
			const delay = Math.max(0, PIN_REQUEST_MIN_VISIBLE_MS - elapsed);

			this.#clearPinFailTimer();
			this.pinFailTimer = setTimeout(() => {
				this.pinFailTimer = null;
				this.setState({ requestPinAt: null, pinFailed: true });
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

		#clearPinAcceptedTimer()
		{
			if (this.pinAcceptedTimer)
			{
				clearTimeout(this.pinAcceptedTimer);
				this.pinAcceptedTimer = null;
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

		#currentStep()
		{
			return this.props.steps[this.state.currentStepIndex];
		}
	}

	module.exports = { PersonalAccountFlow };
});
