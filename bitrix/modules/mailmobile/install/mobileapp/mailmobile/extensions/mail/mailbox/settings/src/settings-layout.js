/**
 * @module mail/mailbox/settings/src/settings-layout
 */
jn.define('mail/mailbox/settings/src/settings-layout', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Indent, Component } = require('tokens');
	const { Text3 } = require('ui-system/typography/text');
	const { DialogFooter } = require('ui-system/layout/dialog-footer');
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { Notify } = require('notify');
	const { SettingsService, DEFAULT_STATE, LOADER_SIZE } = require('mail/mailbox/settings/src/settings-service');
	const { CrmSummaryCard } = require('mail/mailbox/settings/src/crm-summary-card');
	const { CrmSettingsLayout } = require('mail/mailbox/settings/src/crm-settings-layout');
	const { CalendarCard } = require('mail/mailbox/settings/src/calendar-card');
	const { OutgoingCard } = require('mail/mailbox/settings/src/outgoing-card');
	const { SharingCard } = require('mail/mailbox/settings/src/sharing-card');
	const {
		renderSectionDivider,
		renderToggleWithChip,
		getPeriodText,
	} = require('mail/mailbox/settings/src/settings-ui');
	const VIEW_MODE = Object.freeze({
		MAIN: 'main',
		CRM: 'crm',
	});
	const SECTION_DIVIDER_MARGIN = Component.areaPaddingLr.toNumber();

	/**
	 * @class SettingsLayout
	 */
	class SettingsLayout extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.service = new SettingsService();
			this.state = {
				...DEFAULT_STATE,
				...this.service.mapSettingsConfigToState(props.settingsConfig),
				loading: Boolean(props.mailboxId) || Boolean(props.isNewMailbox),
				viewMode: VIEW_MODE.MAIN,
			};

			this.periodLinkRef = null;

			this.handleStateChange = this.handleStateChange.bind(this);
			this.handleCrmStateChange = this.handleCrmStateChange.bind(this);
			this.showCrmSettings = this.showCrmSettings.bind(this);
			this.hideCrmSettings = this.hideCrmSettings.bind(this);
			this.handleBackButton = this.handleBackButton.bind(this);
			this.handleCrmSettingsSave = this.handleCrmSettingsSave.bind(this);
			this.handleCrmSettingsBack = this.handleCrmSettingsBack.bind(this);
			this.showPeriodMenu = this.showPeriodMenu.bind(this);
			this.saveSettings = this.saveSettings.bind(this);
			this.dismissKeyboard = this.dismissKeyboard.bind(this);
			this.handleFolderFetchToggle = this.handleFolderFetchToggle.bind(this);
			this.handleFooterHeightChange = this.handleFooterHeightChange.bind(this);
		}

		componentDidMount()
		{
			this.syncLayoutWidget();

			if (this.props.mailboxId)
			{
				this.service.loadMailboxData(this.props.mailboxId)
					.then((mappedState) => {
						this.setState({
							loading: false,
							...mappedState,
						});
					})
					.catch((response) => {
						const serverMessage = response?.errors?.[0]?.message;
						const loadErrorMessage = serverMessage || Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_LOAD_ERROR');

						this.setState({
							loading: false,
							loadError: true,
							loadErrorMessage,
						});

						Notify.showIndicatorError({
							text: loadErrorMessage,
							hideAfter: 3000,
						});

						this.props.onLoadError?.();
					});

				return;
			}

			if (!this.props.isNewMailbox)
			{
				this.setState({ loading: false });

				return;
			}

			this.service.loadDefaultSettings()
				.then(({ defaultSenderName, currentUser }) => {
					const currentUserId = Number(currentUser?.id || this.service.getCurrentUserId());

					this.setState({
						loading: false,
						senderName: defaultSenderName || this.state.senderName,
						shareAccess: currentUserId > 0 ? [`U${currentUserId}`] : [],
						shareAccessUsers: currentUser ? [currentUser] : [],
						currentUserId,
					});
				})
				.catch(() => {
					this.setState({
						loading: false,
						currentUserId: this.service.getCurrentUserId(),
					});
				});
		}

		componentDidUpdate(prevProps, prevState)
		{
			if (
				prevState.viewMode !== this.state.viewMode
				|| prevProps.titleText !== this.props.titleText
				|| prevProps.layoutWidget !== this.props.layoutWidget
			)
			{
				this.syncLayoutWidget();
			}
		}

		componentWillUnmount()
		{
			const layoutWidget = this.props.layoutWidget;
			if (!layoutWidget)
			{
				return;
			}

			layoutWidget.setBackButtonHandler?.(() => false);
			layoutWidget.setLeftButtons?.([]);

			if (this.props.titleText)
			{
				const titleParams = this.props.titleType
					? { text: this.props.titleText, type: this.props.titleType }
					: { text: this.props.titleText }
				;

				layoutWidget.setTitle(titleParams);
			}
		}

		handleStateChange(partialState)
		{
			this.setState(partialState);
		}

		handleCrmStateChange(partialState)
		{
			if (!this.state.canEditCrmIntegration)
			{
				return;
			}

			this.setState(partialState);
		}

		handleCrmSettingsSave(crmState)
		{
			this.handleCrmStateChange(crmState);
			this.hideCrmSettings();
		}

		handleCrmSettingsBack(crmState)
		{
			this.handleCrmStateChange(crmState);
			this.hideCrmSettings();
		}

		dismissKeyboard()
		{
			Keyboard.dismiss();
		}

		handleFolderFetchToggle(checked)
		{
			this.setState({ folderFetchEnabled: checked });
		}

		handleFooterHeightChange({ height })
		{
			if (this.state.footerHeight !== height)
			{
				this.setState({ footerHeight: height });
			}
		}

		saveSettings()
		{
			if (this.state.saving)
			{
				return;
			}

			const payload = this.service.prepareUpdatePayload(this.state, {
				isNewMailbox: Boolean(this.props.isNewMailbox),
			});

			if (this.props.onConnect)
			{
				this.props.onConnect(payload);

				return;
			}

			this.setState({ saving: true });

			this.service.saveSettings(this.props.mailboxId, payload)
				.then(() => {
					this.setState({ saving: false });

					if (this.props.onSave)
					{
						this.props.onSave();
					}
				})
				.catch((response) => {
					this.setState({ saving: false });

					const serverMessage = response?.errors?.[0]?.message;
					Notify.showIndicatorError({
						text: serverMessage || Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SAVE_ERROR'),
						hideAfter: 3000,
					});
				});
		}

		render()
		{
			if (this.state.loading)
			{
				return View(
					{
						testId: 'mail-connector-settings-loading',
						style: {
							flex: 1,
							backgroundColor: Color.bgContentPrimary.toHex(),
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Loader({
						style: {
							width: LOADER_SIZE,
							height: LOADER_SIZE,
						},
					}),
				);
			}

			if (this.state.loadError)
			{
				return this.renderLoadError();
			}

			if (this.isCrmView())
			{
				return this.renderCrmSettings();
			}

			return View(
				{
					testId: 'mail-connector-settings',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				ScrollView(
					{
						style: {
							flex: 1,
						},
					},
					View(
						{
							style: {
								paddingBottom: this.state.footerHeight + Indent.XL.toNumber(),
							},
							onClick: this.dismissKeyboard,
							onPan: this.dismissKeyboard,
						},
						this.renderContent(),
					),
				),
				this.renderFooter(),
			);
		}

		renderCrmSettings()
		{
			this.crmSettingsLayout = new CrmSettingsLayout({
				...this.getCrmStateProps(),
				isNewMailbox: this.props.isNewMailbox,
				onSave: this.handleCrmSettingsSave,
				onBack: this.handleCrmSettingsBack,
			});

			return View(
				{
					testId: 'mail-connector-settings-crm-view',
					style: {
						flex: 1,
					},
				},
				this.crmSettingsLayout,
			);
		}

		renderContent()
		{
			const sections = [
				this.props.isNewMailbox
					? {
						testId: 'mail-connector-settings-folder-area',
						title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_FOLDER_TITLE'),
						content: this.renderFolderCard(),
					}
					: null,
				this.state.crmAvailable
					? {
						testId: 'mail-connector-settings-crm-area',
						content: new CrmSummaryCard({
							crmEnabled: this.state.crmEnabled,
							onClick: this.showCrmSettings,
						}),
					}
					: null,
				{
					testId: 'mail-connector-settings-outgoing-area',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_OUTGOING_TITLE'),
					content: new OutgoingCard({
						useSenderName: this.state.useSenderName,
						senderName: this.state.senderName,
						smtpUseLimit: this.state.smtpUseLimit,
						smtpLimit: this.state.smtpLimit,
						onStateChange: this.handleStateChange,
					}),
				},
				{
					testId: 'mail-connector-settings-sharing-area',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_SHARING_TITLE'),
					content: new SharingCard({
						shareAccess: this.state.shareAccess,
						shareAccessUsers: this.state.shareAccessUsers,
						currentUserId: this.state.currentUserId,
						onStateChange: this.handleStateChange,
					}),
				},
				{
					testId: 'mail-connector-settings-calendar-area',
					title: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CALENDAR_TITLE'),
					content: new CalendarCard({
						calendarEnabled: this.state.calendarEnabled,
						calendarAutoAdd: this.state.calendarAutoAdd,
						onStateChange: this.handleStateChange,
					}),
				},
			].filter(Boolean);

			return AreaList(
				{
					testId: 'mail-connector-settings-area-list',
					withScroll: false,
				},
				...sections.flatMap((section, index) => {
					const sectionArea = Area(
						{
							testId: section.testId,
							title: section.title,
							isFirst: index === 0,
							divider: false,
						},
						section.content,
					);

					if (index === sections.length - 1)
					{
						return [sectionArea];
					}

					return [
						sectionArea,
						View(
							{
								testId: `${section.testId}-divider-wrap`,
								style: {
									marginLeft: SECTION_DIVIDER_MARGIN,
									marginRight: SECTION_DIVIDER_MARGIN,
								},
							},
							renderSectionDivider({
								testId: `${section.testId}-divider`,
							}),
						),
					];
				}),
			);
		}

		renderLoadError()
		{
			return View(
				{
					testId: 'mail-connector-settings-load-error',
					style: {
						flex: 1,
						backgroundColor: Color.bgContentPrimary.toHex(),
						alignItems: 'center',
						justifyContent: 'center',
						paddingHorizontal: Indent.XL3.toNumber(),
					},
				},
				Text3({
					text: this.state.loadErrorMessage || Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_LOAD_ERROR'),
					color: Color.base2,
				}),
			);
		}

		renderFolderCard()
		{
			return renderToggleWithChip({
				testId: 'mail-connector-settings-folder-fetch',
				checked: this.state.folderFetchEnabled,
				text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_FOLDER_FETCH_PERIOD'),
				chipText: getPeriodText(this.state.messageMaxAge, this.state.mailSyncOptions),
				onToggle: this.handleFolderFetchToggle,
				onChipClick: this.showPeriodMenu,
				chipRef: this.onPeriodLinkRef,
				disabled: false,
			});
		}

		renderFooter()
		{
			return DialogFooter(
				{
					testId: 'mail-connector-settings-footer',
					keyboardButton: {
						text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_DONE_BUTTON'),
						design: ButtonDesign.FILLED,
						onClick: this.dismissKeyboard,
					},
					onLayoutFooterHeight: this.handleFooterHeightChange,
				},
				Button({
					testId: 'mail-connector-settings-save-button',
					text: Loc.getMessage(
						this.props.onConnect
							? 'MAILBOX_CONNECTOR_SETTINGS_CONNECT_BUTTON'
							: 'MAILBOX_CONNECTOR_SETTINGS_SAVE_BUTTON',
					),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					stretched: true,
					disabled: this.state.saving || this.state.loadError,
					loading: this.state.saving,
					onClick: this.saveSettings,
				}),
			);
		}

		showPeriodMenu()
		{
			const actions = this.state.mailSyncOptions.map((option) => ({
				id: String(option.value),
				title: option.label,
				onItemSelected: () => this.setState({ messageMaxAge: option.value }),
			}));

			new PopupMenu(actions).show({ target: this.periodLinkRef });
		}

		showCrmSettings()
		{
			if (this.props.isNewMailbox)
			{
				this.openCrmBackdrop();

				return;
			}

			this.setState({
				viewMode: VIEW_MODE.CRM,
			});
		}

		openCrmBackdrop()
		{
			if (this.crmBackdropWidget)
			{
				return;
			}

			PageManager.openWidget('layout', {
				modal: true,
				backdrop: {
					horizontalSwipeAllowed: false,
					mediumPositionPercent: 90,
					adoptHeightByKeyboard: true,
				},
				titleParams: {
					text: Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_DIALOG_TITLE'),
					type: 'dialog',
				},
			}).then((widget) => {
				this.crmBackdropWidget = widget;

				widget.on('onViewRemoved', () => {
					this.crmBackdropWidget = null;
				});

				const crmLayout = new CrmSettingsLayout({
					...this.getCrmStateProps(),
					isNewMailbox: this.props.isNewMailbox,
					onSave: (crmState) => {
						this.handleCrmStateChange(crmState);
						widget.close();
					},
					onBack: (crmState) => {
						this.handleCrmStateChange(crmState);
						widget.close();
					},
				});

				widget.showComponent(crmLayout);
			});
		}

		hideCrmSettings()
		{
			this.setState({
				viewMode: VIEW_MODE.MAIN,
			});
		}

		handleBackButton()
		{
			if (!this.isCrmView())
			{
				return false;
			}

			this.crmSettingsLayout?.backToMain?.();

			return true;
		}

		syncLayoutWidget()
		{
			const layoutWidget = this.props.layoutWidget;
			if (!layoutWidget)
			{
				return;
			}

			layoutWidget.setBackButtonHandler?.(this.handleBackButton);
			layoutWidget.setLeftButtons?.(
				this.isCrmView()
					? [{
						type: 'back',
						callback: this.handleBackButton,
					}]
					: [],
			);

			const title = this.isCrmView()
				? Loc.getMessage('MAILBOX_CONNECTOR_SETTINGS_CRM_DIALOG_TITLE')
				: this.props.titleText
			;

			if (title)
			{
				const titleParams = this.props.titleType
					? { text: title, type: this.props.titleType }
					: { text: title }
				;

				layoutWidget.setTitle(titleParams);
			}
		}

		isCrmView()
		{
			return this.state.viewMode === VIEW_MODE.CRM;
		}

		getCrmStateProps()
		{
			return {
				crmEnabled: this.state.crmEnabled,
				canEditCrmIntegration: this.state.canEditCrmIntegration,
				crmSyncPeriod: this.state.crmSyncPeriod,
				crmSyncOptions: this.state.crmSyncOptions,
				crmSyncEnabled: this.state.crmSyncEnabled,
				crmAssignKnown: this.state.crmAssignKnown,
				crmIncomingCreate: this.state.crmIncomingCreate,
				crmIncomingEntity: this.state.crmIncomingEntity,
				crmOutgoingCreate: this.state.crmOutgoingCreate,
				crmOutgoingEntity: this.state.crmOutgoingEntity,
				crmVcf: this.state.crmVcf,
				crmEntityOptions: this.state.crmEntityOptions,
				crmSource: this.state.crmSource,
				crmSourceOptions: this.state.crmSourceOptions,
				crmLeadResp: this.state.crmLeadResp,
				crmLeadRespUsers: this.state.crmLeadRespUsers,
				crmNewLeadFor: this.state.crmNewLeadFor,
				showAddressesInput: this.state.showAddressesInput,
			};
		}

		onPeriodLinkRef = (ref) => {
			this.periodLinkRef = ref;
		};
	}

	module.exports = { SettingsLayout };
});
