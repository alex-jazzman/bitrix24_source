/**
 * @module timeman/layout/workday-intent-box-v3/src/intent-screen
 */
jn.define('timeman/layout/workday-intent-box-v3/src/intent-screen', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { PropTypes } = require('utils/validation');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { showToast } = require('toast');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { IntentSelectionSlide } = require('timeman/layout/workday-intent-box-v3/src/intent-selection-slide');
	const { ShiftSelectionSlide } = require('timeman/layout/workday-intent-box-v3/src/shift-selection-slide');
	const { startWorkday, addAbsence } = require('timeman/layout/workday-intent-box-v3/src/api');

	class IntentScreen extends PureComponent
	{
		/**
		 * @param {object} params see IntentSelectionSlide.getContentHeight
		 * @return {number}
		 */
		static getContentHeight(params)
		{
			return IntentSelectionSlide.getContentHeight(params);
		}

		/**
		 * @param {number} [intentCount] number of statuses the server sent
		 * @return {number} height the rows of chips take before the layout reports the real one
		 */
		static getChipsContentHeightEstimate(intentCount)
		{
			return IntentSelectionSlide.getChipsContentHeightEstimate(intentCount);
		}

		/**
		 * @param {boolean} isDayStartCheckInEnabled
		 * @return {string} state of the inline check-in block at the first frame
		 */
		static getStartBlockState(isDayStartCheckInEnabled)
		{
			return IntentSelectionSlide.getStartBlockState(isDayStartCheckInEnabled);
		}

		constructor(props)
		{
			super(props);

			this.onIntentSent = this.#onIntentSent.bind(this);
			this.onIntentChanged = this.#onIntentChanged.bind(this);
			this.onBack = this.#onBack.bind(this);
			this.onShiftSelect = this.#onShiftSelect.bind(this);
			this.bindCheckInBlockRef = this.#bindCheckInBlockRef.bind(this);

			// The flag outlives switching the status on the slide. Otherwise a repeated tap
			// after 'work day -> absence -> work day' would start the day again, the server would refuse
			// it, and the employee would see the error of the start instead of the check-in.
			this.isWorkdayStarted = false;

			this.state = {
				intentId: props.preselectedIntentId,
				isSending: false,
			};
		}

		/**
		 * @return {boolean} the check-in block holds input the employee would lose on closing
		 */
		hasUnsavedCheckInInput()
		{
			return this.checkInBlockRef?.hasUnsavedInput() === true;
		}

		fadeOut()
		{
			return new Promise((resolve) => {
				this.sliderRef?.animate({ opacity: 0, duration: 300 });
				setTimeout(() => resolve(), 300);
			});
		}

		render()
		{
			const {
				intentList,
				shifts,
				parentWidget,
				preselectedIntentId,
				isDayStartCheckInEnabled,
				testId,
				onCheckInBlockStateChange,
				onChipsContentHeightChange,
				onDescriptionEditorToggle,
			} = this.props;

			return Slider(
				{
					swipeEnabled: false,
					ref: (ref) => {
						this.sliderRef = ref;
					},
				},
				new IntentSelectionSlide({
					intentList,
					parentWidget,
					preselectedIntentId,
					isDayStartCheckInEnabled,
					testId,
					isSending: this.state.isSending,
					checkInBlockRef: this.bindCheckInBlockRef,
					onIntentSent: this.onIntentSent,
					onIntentChanged: this.onIntentChanged,
					onCheckInBlockStateChange,
					onChipsContentHeightChange,
					onDescriptionEditorToggle,
				}),
				new ShiftSelectionSlide({
					shifts,
					testId,
					onBack: this.onBack,
					onSelect: this.onShiftSelect,
				}),
			);
		}

		async #onIntentSent(intentId)
		{
			const { shifts } = this.props;

			if (intentId === WorkdayIntentId.WORKDAY)
			{
				void this.#startWorkday();
			}
			else if (this.#isPreselectedAbsence(intentId))
			{
				// the absence record already exists (it caused the preselect), confirm without creating a duplicate
				this.props.onIntentSent(intentId);
			}
			else if (shifts.length > 1)
			{
				this.setState({ intentId }, () => this.sliderRef?.nextSlide());
			}
			else
			{
				void this.#addAbsence(intentId, shifts);
			}
		}

		#isPreselectedAbsence(intentId)
		{
			return (
				intentId === this.props.preselectedIntentId
				&& intentId !== WorkdayIntentId.WORKDAY
				&& intentId !== WorkdayIntentId.WEEKEND
			);
		}

		#onIntentChanged(intentId)
		{
			// The box has to learn the selected status before the block reacts to it: the height of
			// the sheet is a function of both, and the answer of the block arrives as onStateChange.
			this.props.onIntentChanged(intentId);
			this.checkInBlockRef?.setIntent(intentId);
		}

		#bindCheckInBlockRef(ref)
		{
			this.checkInBlockRef = ref;
		}

		#onBack()
		{
			this.sliderRef?.prevSlide();
		}

		#onShiftSelect(shifts)
		{
			void this.#addAbsence(this.state.intentId, shifts);
		}

		/**
		 * The work day start and the first check-in run strictly one after another, and the
		 * success-screen waits for both. The button stays blocked for the whole run and comes back
		 * only on an error - it is the outer barrier against a second check-in, which the server
		 * would accept, unlike a second start of the day; the inner one belongs to the block, which
		 * latches the check-in of the day start once it is confirmed.
		 */
		async #startWorkday()
		{
			this.setState(
				{ isSending: true },
				() => {
					void this.#runStartAndCheckIn();
				},
			);
		}

		/**
		 * Nothing throws out of here: an exception of an operation is treated as its refusal and goes
		 * the same way a refusal answered by the server goes. The flag of the started day tells which
		 * of the two operations it belongs to - the flag is raised only after a confirmed start.
		 * @return {Promise<void>}
		 */
		async #runStartAndCheckIn()
		{
			try
			{
				if (!this.isWorkdayStarted)
				{
					if (!await startWorkday())
					{
						this.#refuseSending('TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_START');

						return;
					}

					this.isWorkdayStarted = true;

					// The period is worked off by the started work day alone, and the result of the
					// check-in does not change that. Reporting it after both operations would give
					// the wrong outcome in the real branch 'day started, check-in failed, box
					// closed': the opener would register a dismiss over an open work day.
					this.props.onWorkdayStarted();
				}

				if (!await this.#sendCheckIn())
				{
					this.#refuseSending('TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_CHECK_IN');

					return;
				}

				this.props.onIntentSent(WorkdayIntentId.WORKDAY);
			}
			catch (error)
			{
				console.error(error);

				const messageKey = this.isWorkdayStarted
					? 'TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_CHECK_IN'
					: 'TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_START'
				;

				this.#refuseSending(messageKey);
			}
		}

		/**
		 * Returns the button and reports the failed operation. The slide stays on the screen with
		 * the input the employee has already made.
		 * @param {string} messageKey
		 */
		#refuseSending(messageKey)
		{
			this.setState({ isSending: false });
			this.#showToast(messageKey);
		}

		/**
		 * The first check-in is optional: a block that is hidden or has no geo position yet leaves
		 * the day started without it - the normal course, not an error.
		 * @return {Promise<boolean>} false only when the check-in was sent and did not go through
		 */
		async #sendCheckIn()
		{
			if (this.checkInBlockRef?.isReadyToSend() !== true)
			{
				return true;
			}

			return this.checkInBlockRef.send();
		}

		async #addAbsence(intentId, shifts)
		{
			const { onIntentSent } = this.props;

			if (intentId === WorkdayIntentId.WEEKEND)
			{
				onIntentSent(intentId);

				return;
			}

			const result = await addAbsence(intentId, shifts);

			if (result.errors.some((error) => error.code === 'absence_unavailable'))
			{
				this.#closeWithCommonError();

				return;
			}

			if (!result.isSuccess || Type.isArrayFilled(result.errors))
			{
				this.#showToast('TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_ABSENCE');

				return;
			}

			onIntentSent(intentId);
		}

		#showToast(messageKey, parentWidget = this.props.parentWidget)
		{
			showToast({ message: Loc.getMessage(messageKey) }, parentWidget);
		}

		#closeWithCommonError()
		{
			this.props.parentWidget.close(() => {
				this.#showToast('TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR', null);
			});
		}
	}

	IntentScreen.defaultProps = {
		isDayStartCheckInEnabled: false,
		parentWidget: PageManager,
		preselectedIntentId: WorkdayIntentId.WORKDAY,
	};

	IntentScreen.propTypes = {
		intentList: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
			}),
		).isRequired,
		shifts: PropTypes.arrayOf(
			PropTypes.shape({
				start: PropTypes.string.isRequired,
				stop: PropTypes.string.isRequired,
				startTimestamp: PropTypes.number.isRequired,
				stopTimestamp: PropTypes.number.isRequired,
				scheduleType: PropTypes.string.isRequired,
			}),
		).isRequired,
		testId: PropTypes.string.isRequired,
		onIntentSent: PropTypes.func.isRequired,
		onWorkdayStarted: PropTypes.func.isRequired,
		onIntentChanged: PropTypes.func.isRequired,
		onCheckInBlockStateChange: PropTypes.func.isRequired,
		onChipsContentHeightChange: PropTypes.func.isRequired,
		onDescriptionEditorToggle: PropTypes.func.isRequired,
		isDayStartCheckInEnabled: PropTypes.bool,
		parentWidget: PropTypes.object,
		preselectedIntentId: PropTypes.string,
	};

	module.exports = { IntentScreen };
});
