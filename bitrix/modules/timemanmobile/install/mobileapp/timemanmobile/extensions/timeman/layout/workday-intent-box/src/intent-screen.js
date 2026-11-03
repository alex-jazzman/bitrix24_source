/**
 * @module timeman/layout/workday-intent-box/src/intent-screen
 */
jn.define('timeman/layout/workday-intent-box/src/intent-screen', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { PropTypes } = require('utils/validation');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { showToast } = require('toast');
	const { WorkdayIntentId } = require('timeman/workday-intent/workday-intent-id');
	const { StartDayPopupAnalytics, StartDayTypeEnum } = require('timeman/workday-intent/analytics');
	const { IntentSelectionSlide } = require('timeman/layout/workday-intent-box/src/intent-selection-slide');
	const { ShiftSelectionSlide } = require('timeman/layout/workday-intent-box/src/shift-selection-slide');
	const { startWorkday, addAbsence } = require('timeman/layout/workday-intent-box/src/api');

	const INTENT_TO_START_DAY_TYPE = {
		[WorkdayIntentId.WORKDAY]: StartDayTypeEnum.WORK_DAY,
		[WorkdayIntentId.WEEKEND]: StartDayTypeEnum.WEEKEND,
		[WorkdayIntentId.LEAVEUNPAYED]: StartDayTypeEnum.DAY_OFF,
		[WorkdayIntentId.VACATION]: StartDayTypeEnum.VACATION_DAY,
		[WorkdayIntentId.LEAVESICK]: StartDayTypeEnum.SICK_DAY,
	};

	class IntentScreen extends PureComponent
	{
		static getContentHeight()
		{
			return IntentSelectionSlide.getContentHeight();
		}

		constructor(props)
		{
			super(props);

			this.onIntentSent = this.#onIntentSent.bind(this);
			this.onBack = this.#onBack.bind(this);
			this.onShiftSelect = this.#onShiftSelect.bind(this);

			this.state = {
				intentId: props.preselectedIntentId,
				isSending: false,
			};
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
			const { intentList, shifts, parentWidget, preselectedIntentId, testId } = this.props;

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
					testId,
					isSending: this.state.isSending,
					onIntentSent: this.onIntentSent,
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
			// guard against server/client version mismatch: an unknown intent skips analytics, not the action
			const startDayType = INTENT_TO_START_DAY_TYPE[intentId];
			if (startDayType)
			{
				StartDayPopupAnalytics.sendStartDay(startDayType);
			}

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

		#onBack()
		{
			this.sliderRef?.prevSlide();
		}

		#onShiftSelect(shifts)
		{
			void this.#addAbsence(this.state.intentId, shifts);
		}

		async #startWorkday()
		{
			this.setState(
				{ isSending: true },
				async () => {
					if (!await startWorkday())
					{
						this.setState({ isSending: false });
						this.#showToast('TIMEMANMOBILE_WORKDAY_INTENT_BOX_ERROR_START');

						return;
					}

					this.props.onIntentSent(WorkdayIntentId.WORKDAY);
				},
			);
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
		parentWidget: PropTypes.object,
		preselectedIntentId: PropTypes.string,
	};

	module.exports = { IntentScreen };
});
