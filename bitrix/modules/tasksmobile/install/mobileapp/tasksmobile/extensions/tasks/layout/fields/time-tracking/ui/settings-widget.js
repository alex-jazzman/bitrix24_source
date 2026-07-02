/**
 * @module tasks/layout/fields/time-tracking/ui/settings-widget
 */
jn.define('tasks/layout/fields/time-tracking/ui/settings-widget', (require, exports, module) => {
	const { Loc } = require('tasks/loc');
	const { SettingSelector } = require('ui-system/blocks/setting-selector');
	const { SwitcherSize } = require('ui-system/blocks/switcher');
	const { Card } = require('ui-system/layout/card');
	const { CardList } = require('ui-system/layout/card-list');
	const { StringInput, InputDesign } = require('ui-system/form/inputs/string');
	const { Indent, Color } = require('tokens');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');
	const { BottomSheet } = require('bottom-sheet');
	const { toHours, toMinutes, sumSeconds } = require('tasks/layout/fields/time-tracking/time-utils');
	const { InputSize } = require('ui-system/form/inputs/input');
	const { toNumber } = require('utils/number');
	const { createTestIdGenerator } = require('utils/test');

	const BOTTOM_HEIGHT = 422;

	class TimeTrackingSettingsWidget extends LayoutComponent
	{
		static show({ layout, ...props } = {})
		{
			return new Promise((resolve, reject) => {
				const widget = new TimeTrackingSettingsWidget({
					...props,
					resolvePromise: resolve,
					rejectPromise: reject,
				});

				const bottomSheet = new BottomSheet({
					titleParams: {
						text: Loc.getMessage('M_TASKS_FIELDS_TIME_TRACKING'),
						type: 'dialog',
						useLargeTitleMode: true,
					},
					component: widget,
				});

				bottomSheet
					.setParentWidget(layout)
					.disableShowOnTop()
					.disableOnlyMediumPosition()
					.setMediumPositionHeight(BOTTOM_HEIGHT)
					.enableBounce()
					.enableSwipe()
					.disableHorizontalSwipe()
					.enableResizeContent()
					.enableAdoptHeightByKeyboard()
					.open()
					.then((layoutWidget) => {
						widget.setLayoutWidget(layoutWidget);
					})
					.catch(reject);
			});
		}

		constructor(props)
		{
			super(props);

			this.state = {
				allowTimeTracking: Boolean(props.allowTimeTracking),
				useTimeLimit: Boolean(props.timeEstimate),
				timeEstimateHours: toHours(props.timeEstimate),
				timeEstimateMinutes: toMinutes(props.timeEstimate),
				hasChanges: false,
			};

			this.getTestId = createTestIdGenerator({
				prefix: 'time-tracking-settings-widget',
			});

			/** @type {StringInput} */
			this.hoursRef = null;
			this.scrollRef = null;
		}

		setLayoutWidget(layoutWidget)
		{
			this.layoutWidget = layoutWidget;
		}

		#toggleTimeTracking = () => {
			const allowTimeTracking = !this.state.allowTimeTracking;
			const useTimeLimit = allowTimeTracking === false ? false : this.state.useTimeLimit;

			this.setState({
				allowTimeTracking,
				useTimeLimit,
				hasChanges: true,
			});
		};

		#toggleTimeLimit = () => {
			const useTimeLimit = !this.state.useTimeLimit;
			const allowTimeTracking = useTimeLimit === true ? true : this.state.allowTimeTracking;

			this.setState({
				allowTimeTracking,
				useTimeLimit,
				hasChanges: true,
			}, () => {
				if (useTimeLimit)
				{
					void this.hoursRef?.focus(true);
				}
				else
				{
					Keyboard.dismiss();
				}
			});
		};

		onHoursChanged = (val) => {
			this.setState({
				timeEstimateHours: toNumber(val),
				hasChanges: true,
			});
		};

		onMinutesChanged = (val) => {
			this.setState({
				timeEstimateMinutes: toNumber(val),
				hasChanges: true,
			});
		};

		onSave = () => {
			const { allowTimeTracking, useTimeLimit, timeEstimateHours, timeEstimateMinutes } = this.state;

			const timeEstimate = sumSeconds(timeEstimateHours, timeEstimateMinutes);

			this.props.onChange?.({
				allowTimeTracking,
				timeEstimate: useTimeLimit ? timeEstimate : 0,
			});

			this.layoutWidget?.close();

			this.props.onClose?.();
			this.props.resolvePromise?.();
		};

		render()
		{
			return Box(
				{
					testId: this.getTestId('box'),
					resizableByKeyboard: true,
					backgroundColor: Color.bgSecondary,
					safeArea: {
						bottom: true,
					},
					withScroll: true,
					withPaddingHorizontal: true,
					footer: this.renderFooter(),
					scrollProps: {
						ref: (ref) => {
							this.scrollRef = ref;
						},
						onLayout: () => {
							const { useTimeLimit } = this.state;
							if (useTimeLimit)
							{
								this.scrollRef?.scrollToEnd({ animated: true });
							}
						},
					},
				},
				this.renderBody(),
			);
		}

		renderBody()
		{
			return CardList(
				{
					withScroll: false,
					testId: this.getTestId('card-list'),
				},
				this.renderTimeTrackingOption(),
				this.renderTimeLimitOption(),
			);
		}

		renderTimeTrackingOption()
		{
			return Card(
				{
					border: true,
					testId: this.getTestId('enable-time-tracking-card'),
				},
				SettingSelector({
					testId: this.getTestId('enable-time-tracking'),
					checked: this.state.allowTimeTracking,
					title: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_ENABLE_TIME_TRACKING'),
					subtitle: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_ENABLE_TIME_TRACKING_HINT'),
					switcherSize: SwitcherSize.L,
					onClick: this.#toggleTimeTracking,
				}),
			);
		}

		renderTimeLimitOption()
		{
			const { useTimeLimit } = this.state;

			return Card(
				{
					border: true,
					testId: this.getTestId('time-limit-card'),
				},
				SettingSelector({
					testId: this.getTestId('set-time-limit'),
					checked: useTimeLimit,
					title: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_ENABLE_TIME_LIMIT'),
					subtitle: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_ENABLE_TIME_LIMIT_HINT'),
					switcherSize: SwitcherSize.L,
					onClick: this.#toggleTimeLimit,
					additionalContent: useTimeLimit ? this.renderTimeEditForm() : null,
				}),
			);
		}

		renderTimeEditForm()
		{
			const {
				timeEstimateHours: hours,
				timeEstimateMinutes: minutes,
			} = this.state;

			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'space-between',
						marginTop: Indent.XL.toNumber(),
					},
				},
				this.renderHoursField(hours),
				this.renderMinutesField(minutes),
			);
		}

		renderHoursField(hours)
		{
			return StringInput({
				ref: (ref) => {
					this.hoursRef = ref;
				},
				style: {
					flexGrow: 1,
					paddingRight: Indent.XL.toNumber(),
					width: null,
				},
				testId: this.getTestId('hours'),
				size: InputSize.M,
				keyboardType: 'number-pad',
				value: hours === 0 ? '' : String(hours),
				placeholder: '0',
				label: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_HOURS'),
				onChange: this.onHoursChanged,
				design: InputDesign.GREY,
			});
		}

		renderMinutesField(minutes)
		{
			return StringInput({
				style: {
					flexGrow: 1,
					width: null,
				},
				testId: 'time-tracking-settings-widget-minutes',
				size: InputSize.M,
				keyboardType: 'number-pad',
				value: minutes === 0 ? '' : String(minutes),
				placeholder: '0',
				label: Loc.getMessage('M_TASKS_TIME_TRACKING_WIDGET_MINUTES'),
				onChange: this.onMinutesChanged,
				design: InputDesign.GREY,
			});
		}

		renderFooter()
		{
			return BoxFooter(
				{
					testId: this.getTestId('footer'),
					safeArea: false,
					isShowKeyboard: false,
					keyboardButton: {
						text: Loc.getMessage('M_TASKS_SAVE'),
						color: Color.baseWhiteFixed,
						onClick: this.onSave,
					},
				},
				Button({
					testId: this.getTestId('footer-save-button'),
					text: Loc.getMessage('M_TASKS_SAVE'),
					stretched: true,
					size: ButtonSize.L,
					onClick: this.onSave,
					disabled: !this.state.hasChanges,
				}),
			);
		}
	}

	module.exports = { TimeTrackingSettingsWidget };
});
