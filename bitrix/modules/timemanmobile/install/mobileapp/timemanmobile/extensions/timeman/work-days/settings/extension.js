/**
 * @module timeman/work-days/settings
 */
jn.define('timeman/work-days/settings', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { showToast } = require('toast');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { Area } = require('ui-system/layout/area');
	const { Card } = require('ui-system/layout/card');
	const { Link4 } = require('ui-system/blocks/link');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { SettingSelector } = require('ui-system/blocks/setting-selector');
	const {
		loadSettings,
		enableWorkShiftOption,
		disableWorkShiftOption,
	} = require('timeman/work-days/settings/src/api');
	const { WorkDaysAnalytics } = require('timeman/work-days/analytics');

	const BACKDROP_HEIGHT = 250;

	/**
	 * @extends {PureComponent<WorkDaysSettingsProps, WorkDaysSettingsState>}
	 */
	class WorkDaysSettings extends PureComponent
	{
		static open({ parentWidget = PageManager } = {})
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_WIDGET_TITLE'),
					type: 'section',
				},
				component: (layoutWidget) => new WorkDaysSettings({ layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.open()
			;
		}

		/**
		 * @param {WorkDaysSettingsProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'work-days-settings',
				context: this,
			});

			this.state = {
				isLoading: true,
				isWorkShiftOptionEnabledInSettings: false,
				canChangeWorkShiftOption: false,
			};

			this.onWorkShiftSwitcherClick = this.#onWorkShiftSwitcherClick.bind(this);
			this.onWorkShiftHelpLinkClick = this.#onWorkShiftHelpLinkClick.bind(this);
			this.onWorkShiftHelpLinkRef = this.#onWorkShiftHelpLinkRef.bind(this);
		}

		async componentDidMount()
		{
			const data = await loadSettings();

			if (data)
			{
				this.setState({
					isLoading: false,
					isWorkShiftOptionEnabledInSettings: data.isWorkShiftOptionEnabledInSettings,
					canChangeWorkShiftOption: data.canChangeWorkShiftOption,
				});
			}
			else
			{
				this.#showErrorToast();
				setTimeout(() => this.#layoutWidget.close(), 3000);
			}
		}

		render()
		{
			if (this.state.isLoading)
			{
				return new LoadingScreenComponent();
			}

			return View(
				{},
				this.#renderMyDepartmentsSection(),
			);
		}

		#renderMyDepartmentsSection()
		{
			const { canChangeWorkShiftOption, isWorkShiftOptionEnabledInSettings } = this.state;

			return Area(
				{
					title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_MY_DEPARTMENTS_SECTION_TITLE'),
					isFirst: true,
				},
				Card(
					{
						border: true,
						testId: this.getTestId('work-shift-container'),
					},
					SettingSelector({
						testId: this.getTestId('work-shift'),
						title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_TITLE'),
						subtitle: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_DESCRIPTION'),
						locked: !canChangeWorkShiftOption,
						checked: isWorkShiftOptionEnabledInSettings,
						onClick: this.onWorkShiftSwitcherClick,
						additionalContent: Link4({
							testId: this.getTestId('work-shift-help-link'),
							style: {
								alignSelf: 'flex-start',
								paddingVertical: Indent.XS2.toNumber(),
							},
							text: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_HELP_LINK'),
							forwardRef: this.onWorkShiftHelpLinkRef,
							onClick: this.onWorkShiftHelpLinkClick,
						}),
					}),
				),
			);
		}

		async #onWorkShiftSwitcherClick(checked)
		{
			if (!this.state.canChangeWorkShiftOption)
			{
				this.#showInfoToast('M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_HEAD_ONLY');

				return;
			}

			this.#showInfoToast(
				checked
					? 'M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_ENABLED'
					: 'M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_DISABLED',
			);
			this.setState({ isWorkShiftOptionEnabledInSettings: checked });

			const success = checked
				? await enableWorkShiftOption()
				: await disableWorkShiftOption();

			if (success)
			{
				WorkDaysAnalytics.sendWorkShiftsToggle(checked);
			}
			else
			{
				this.#showErrorToast();
				this.setState({ isWorkShiftOptionEnabledInSettings: !checked });
			}
		}

		#onWorkShiftHelpLinkRef(ref)
		{
			this.workShiftHelpLinkRef = ref;
		}

		#onWorkShiftHelpLinkClick()
		{
			AhaMoment.show({
				testId: this.getTestId('work-shift-help'),
				targetRef: this.workShiftHelpLinkRef,
				description: Loc.getMessage('M_TIMEMAN_WORK_DAYS_SETTINGS_WORK_SHIFT_HELP_DESCRIPTION'),
				closeButton: false,
				disableHideByOutsideClick: false,
			});
		}

		#showInfoToast(messageKey)
		{
			Haptics.notifySuccess();
			showToast({ message: Loc.getMessage(messageKey) }, this.#layoutWidget);
		}

		#showErrorToast(messageKey = 'M_TIMEMAN_WORK_DAYS_SETTINGS_ERROR')
		{
			Haptics.notifyWarning();
			showToast(
				{
					message: Loc.getMessage(messageKey),
					backgroundColor: Color.accentMainAlert.toHex(),
				},
				this.#layoutWidget,
			);
		}

		get #layoutWidget()
		{
			return this.props.layoutWidget;
		}
	}

	WorkDaysSettings.propTypes = {
		layoutWidget: PropTypes.object.isRequired,
	};

	module.exports = { WorkDaysSettings };
});
