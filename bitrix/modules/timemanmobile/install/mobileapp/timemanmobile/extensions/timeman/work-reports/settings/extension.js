/**
 * @module timeman/work-reports/settings
 */
jn.define('timeman/work-reports/settings', (require, exports, module) => {
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
		enableWorkReportOption,
		disableWorkReportOption,
	} = require('timeman/work-reports/settings/src/api');
	const { WorkReportsAnalytics } = require('timeman/work-reports/analytics');

	const BACKDROP_HEIGHT = 250;

	/**
	 * @extends {PureComponent<WorkReportsSettingsProps, WorkReportsSettingsState>}
	 */
	class WorkReportsSettings extends PureComponent
	{
		/**
		 * @param {WorkReportsSettingsOpenOptions} [options]
		 * @returns {Promise}
		 */
		static open({ parentWidget = PageManager, onClose = null } = {})
		{
			return new BottomSheet({
				titleParams: {
					text: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_WIDGET_TITLE'),
					type: 'section',
				},
				component: (layoutWidget) => new WorkReportsSettings({ layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.open()
				.then((widget) => {
					if (typeof onClose === 'function')
					{
						widget.on('onViewHidden', onClose);
					}
				});
		}

		/**
		 * @param {WorkReportsSettingsProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'work-reports-settings',
				context: this,
			});

			this.state = {
				isLoading: true,
				isWorkReportOptionEnabledInSettings: false,
				canChangeWorkReportOption: false,
			};

			this.onWorkReportSwitcherClick = this.#onWorkReportSwitcherClick.bind(this);
			this.onWorkReportHelpLinkClick = this.#onWorkReportHelpLinkClick.bind(this);
			this.onWorkReportHelpLinkRef = this.#onWorkReportHelpLinkRef.bind(this);
		}

		async componentDidMount()
		{
			const data = await loadSettings();

			if (data)
			{
				this.setState({
					isLoading: false,
					isWorkReportOptionEnabledInSettings: data.isWorkReportOptionEnabledInSettings,
					canChangeWorkReportOption: data.canChangeWorkReportOption,
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
			const { canChangeWorkReportOption, isWorkReportOptionEnabledInSettings } = this.state;

			return Area(
				{
					title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_MY_DEPARTMENTS_SECTION_TITLE'),
					isFirst: true,
				},
				Card(
					{
						border: true,
						testId: this.getTestId('work-report-container'),
					},
					SettingSelector({
						testId: this.getTestId('work-report'),
						title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_TITLE'),
						subtitle: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_DESCRIPTION'),
						locked: !canChangeWorkReportOption,
						checked: isWorkReportOptionEnabledInSettings,
						onClick: this.onWorkReportSwitcherClick,
						additionalContent: Link4({
							testId: this.getTestId('work-report-help-link'),
							style: {
								alignSelf: 'flex-start',
								paddingVertical: Indent.XS2.toNumber(),
							},
							text: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_HELP_LINK'),
							forwardRef: this.onWorkReportHelpLinkRef,
							onClick: this.onWorkReportHelpLinkClick,
						}),
					}),
				),
			);
		}

		async #onWorkReportSwitcherClick(checked)
		{
			if (!this.state.canChangeWorkReportOption)
			{
				this.#showInfoToast('M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_HEAD_ONLY');

				return;
			}

			this.#showInfoToast(
				checked
					? 'M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_ENABLED'
					: 'M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_DISABLED',
			);
			this.setState({ isWorkReportOptionEnabledInSettings: checked });

			const isSuccess = checked ? await enableWorkReportOption() : await disableWorkReportOption();
			if (isSuccess)
			{
				WorkReportsAnalytics.sendPlanReportsToggle(checked);
			}
			else
			{
				this.#showErrorToast();
				this.setState({ isWorkReportOptionEnabledInSettings: !checked });
			}
		}

		#onWorkReportHelpLinkRef(ref)
		{
			this.workReportHelpLinkRef = ref;
		}

		#onWorkReportHelpLinkClick()
		{
			AhaMoment.show({
				testId: this.getTestId('work-report-help'),
				targetRef: this.workReportHelpLinkRef,
				description: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_SETTINGS_WORK_REPORT_HELP_DESCRIPTION'),
				closeButton: false,
				disableHideByOutsideClick: false,
			});
		}

		#showInfoToast(messageKey)
		{
			Haptics.notifySuccess();
			showToast({ message: Loc.getMessage(messageKey) }, this.#layoutWidget);
		}

		#showErrorToast(messageKey = 'M_TIMEMAN_WORK_REPORTS_SETTINGS_ERROR')
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

	WorkReportsSettings.propTypes = {
		layoutWidget: PropTypes.object.isRequired,
	};

	module.exports = { WorkReportsSettings };
});
