/**
 * @module crm/timeline/scheduler/providers/go-to-chat
 */
jn.define('crm/timeline/scheduler/providers/go-to-chat', (require, exports, module) => {
	const { Loc } = require('loc');
	const { TimelineSchedulerBaseProvider } = require('crm/timeline/scheduler/providers/base');
	const { MessengerSlider, messengers } = require('crm/timeline/scheduler/providers/go-to-chat/messenger-slider');
	const { SettingsBlock } = require('crm/timeline/scheduler/providers/go-to-chat/settings-block');
	const { Type: CrmType, TypeId } = require('crm/type');
	const { MultiFieldDrawer, MultiFieldType } = require('crm/multi-field-drawer');
	const { withPressed } = require('utils/color');
	const { get } = require('utils/object');
	const { WarningBlock } = require('layout/ui/warning-block');
	const { getEntityMessage } = require('crm/loc');
	const { MessageSendersConnector, SenderTypes } = require('crm/message-senders-connector');
	const { Type } = require('type');
	const { NotifyManager } = require('notify-manager');
	const AppTheme = require('apptheme');
	const { Icon } = require('assets/icons');

	const PATH_TO_EXTENSION = `${currentDomain}/bitrix/mobileapp/crmmobile/extensions/crm/timeline/scheduler/providers/go-to-chat`;

	/**
	 * @class TimelineSchedulerGoToChatProvider
	 */
	class TimelineSchedulerGoToChatProvider extends TimelineSchedulerBaseProvider
	{
		static getId()
		{
			return 'goToChat';
		}

		static getTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_TITLE');
		}

		static getMenuTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_MENU_FULL_TITLE');
		}

		static getMenuShortTitle()
		{
			return Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_MENU_TITLE');
		}

		static getMenuIcon()
		{
			return Icon.ADD_PERSON;
		}

		static getDefaultPosition()
		{
			return 5;
		}

		static isAvailableInMenu(context = {})
		{
			if (!context.detailCard)
			{
				return false;
			}

			const detailCardParams = context.detailCard.getComponentParams();
			const entityTypeId = get(detailCardParams, 'entityTypeId', 0);
			const isCompany = entityTypeId === TypeId.Company;
			const isContact = entityTypeId === TypeId.Contact;
			const isClientEnabled = get(detailCardParams, 'isClientEnabled', false);

			return isCompany || isContact || isClientEnabled;
		}

		static isSupported(context = {})
		{
			return true;
		}

		static getBackdropParams()
		{
			return {
				showOnTop: false,
				onlyMediumPosition: true,
				mediumPositionPercent: this.getMediumPositionPercent(),
				hideNavigationBar: true,
				swipeContentAllowed: true,
				helpUrl: helpdesk.getArticleUrl('17581580'),
			};
		}

		static getMediumPositionPercent()
		{
			const height = this.getScreenHeight();

			return (height > 800 ? 88 : 92);
		}

		static getScreenHeight()
		{
			return get(device.screen, 'height', 0);
		}

		constructor(props)
		{
			super(props);

			this.state = this.getDefaultParams();

			this.isFetchedConfig = false;
			this.isSending = false;

			this.config = {};
			// this.manager = new TelegramConnectorManager();

			this.onChangeClientCallback = this.onChangeClientCallback.bind(this);
			this.onChangeClientWithoutPhoneCallback = this.onChangeClientWithoutPhoneCallback.bind(this);
			this.onChangeProviderCallback = this.onChangeProviderCallback.bind(this);
			this.onChangeProviderPhoneCallback = this.onChangeProviderPhoneCallback.bind(this);
			this.showAddPhoneToContactDrawer = this.showAddPhoneToContactDrawer.bind(this);
			this.onPhoneAddedSuccessCallback = this.onPhoneAddedSuccessCallback.bind(this);
		}

		getDefaultParams()
		{
			return {
				activeMessenger: null,
				currentChannelId: null,
				toName: null,
				toPhoneId: null,
				channels: [],
				communications: [],
				fromPhoneId: null,
				selectedClient: null,
			};
		}

		componentDidMount()
		{
			super.componentDidMount();

			this.fetchSettings();
		}

		fetchSettings()
		{
			const { entity } = this.props;
			const ajaxParameters = {
				entityTypeId: entity.typeId,
				entityId: entity.id,
			};

			this.isFetchedConfig = false;

			BX.ajax.runAction('crm.activity.gotochat.getConfig', { data: ajaxParameters })
				.then(({ data }) => {
					this.isFetchedConfig = true;
					this.setDefaultConfig(data);
				})
				.catch((response) => ErrorNotifier.showError(response.errors[0].message))
			;
		}

		setDefaultConfig(config)
		{
			this.config = config;

			const newState = {
				activeMessenger: messengers.telegram,
				currentChannelId: config.currentChannelId,
				channels: config.channels,
				communications: config.communications,
			};

			this.prepareStateDataFromConfig(newState, config.communications);

			this.setState(newState);
		}

		prepareStateDataFromConfig(data, communications)
		{
			this.appendFirstCommunicationData(data, communications);
			this.appendFromPhoneValue(data);
		}

		appendFirstCommunicationData(data, communications)
		{
			if (communications.length > 0)
			{
				const communication = communications[0];
				if (Array.isArray(communication.phones) && communication.phones.length > 0)
				{
					data.toPhoneId = communication.phones[0].id;
				}

				data.selectedClient = {
					entityId: communication.entityId,
					entityTypeId: communication.entityTypeId,
				};
				data.toName = communication.caption;
			}
		}

		appendFromPhoneValue(data)
		{
			const currentChannel = data.channels.find((channel) => channel.id === data.currentChannelId);
			if (
				currentChannel
				&& Array.isArray(currentChannel.fromList)
				&& currentChannel.fromList.length > 0
			)
			{
				const { fromList } = currentChannel;
				const defaultPhone = fromList.find((item) => item.default);

				data.fromPhoneId = defaultPhone ? defaultPhone.id : fromList[0].id;
			}
		}

		showAddPhoneToContactDrawer()
		{
			const { layout } = this.props;
			const { selectedClient } = this.state;

			const multiFieldDrawer = new MultiFieldDrawer({
				entityTypeId: selectedClient.entityTypeId,
				entityId: selectedClient.entityId,
				fields: [MultiFieldType.PHONE],
				onSuccess: this.onPhoneAddedSuccessCallback,
			});

			return multiFieldDrawer.show(layout);
		}

		onPhoneAddedSuccessCallback()
		{
			this.isFetchedConfig = false;
			this.setState(this.getDefaultParams(), () => this.fetchSettings());
		}

		render()
		{
			return View(
				{
					style: styles.container,
				},
				this.renderHeroScreen(),
				this.renderMessengersSlider(),
				this.renderWarningBlock(),
				this.renderSettingsBlock(),
				this.renderSendButton(),
			);
		}

		renderHeroScreen()
		{
			const { typeId: entityTypeId } = this.props.entity;
			const shouldShowHeroScreenImages = this.shouldShowHeroScreenImages();

			return View(
				{
					style: styles.heroScreenContainer,
				},
				shouldShowHeroScreenImages && View({ style: styles.heroScreenLeftBottomCircle }),
				shouldShowHeroScreenImages && View({ style: styles.heroScreenTopRightCircle }),
				Text({
					style: styles.heroScreenTitle,
					text: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_TITLE_TEXT'),
				}),
				Text({
					style: styles.heroScreenDescription,
					text: getEntityMessage('M_CRM_TIMELINE_SCHEDULER_GTC_DESCRIPTION', entityTypeId),
				}),
				shouldShowHeroScreenImages && View(
					{
						style: styles.heroScreenIconsContainer,
					},
					this.renderIcon('messenger'),
					Image({
						style: styles.heroScreenArrow,
						svg: {
							content: icons.arrow,
						},
					}),
					this.renderIcon('bitrix24'),
				),
				shouldShowHeroScreenImages && View(
					{
						style: styles.heroScreenTextContainer,
					},
					this.renderIconText(Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_ICON_1')),
					this.renderIconText(Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_ICON_2')),
				),
			);
		}

		shouldShowHeroScreenImages()
		{
			const screenHeight = TimelineSchedulerGoToChatProvider.getScreenHeight();
			const backdropCoefficient = (TimelineSchedulerGoToChatProvider.getMediumPositionPercent() / 100);
			const containerHeight = screenHeight * backdropCoefficient;

			let safeContainerHeight = 640;

			if (containerHeight < safeContainerHeight)
			{
				return false;
			}

			if (
				!this.isShowProviderWarningBlock()
				&& !this.shouldShowClientWarningBlock()
				&& !this.shouldShowClientPhoneWarningBlock()
			)
			{
				return true;
			}

			const clientWarningBlockHeight = 80;
			if (this.shouldShowClientWarningBlock())
			{
				const settingsBlockHeight = 74;
				safeContainerHeight += clientWarningBlockHeight;
				safeContainerHeight -= settingsBlockHeight;

				return containerHeight >= safeContainerHeight;
			}

			if (this.shouldShowClientPhoneWarningBlock())
			{
				safeContainerHeight += clientWarningBlockHeight;

				return containerHeight >= safeContainerHeight;
			}

			if (this.isShowProviderWarningBlock())
			{
				const providerWarningBlockHeight = 96;
				safeContainerHeight += providerWarningBlockHeight;

				return containerHeight >= safeContainerHeight;
			}

			return false;
		}

		/**
		 * @param imageName
		 * @return {View}
		 */
		renderIcon(imageName)
		{
			return Image({
				style: styles.heroScreenIcon,
				svg: {
					uri: this.getImagePath(imageName),
				},
			});
		}

		renderIconText(text)
		{
			return Text({
				style: styles.heroScreenIconText,
				text,
			});
		}

		/**
		 * @param imageName
		 * @return {string}
		 */
		getImagePath(imageName)
		{
			return `${PATH_TO_EXTENSION}/images/${AppTheme.id}/${imageName}.svg`;
		}

		renderMessengersSlider()
		{
			const activeId = get(this.state, 'activeMessenger.id', messengers.telegram.id);
			const region = this.getRegion();

			const props = {
				activeId,
				region,
			};

			return new MessengerSlider(props);
		}

		getRegion()
		{
			const region = get(this, 'config.region');
			if (region)
			{
				return region;
			}

			return BX.prop.getString(
				jnExtensionData.get('crm:timeline/scheduler/providers/go-to-chat'),
				'region',
				null,
			);
		}

		renderSettingsBlock()
		{
			const {
				channels,
				currentChannelId,
				communications,
				contactCenterUrl,
				selectedClient,
				toName: name,
				toPhoneId,
			} = this.state;

			if (!selectedClient && this.isFetchedConfig)
			{
				return null;
			}

			const { layout, entity: { typeId, id } } = this.props;
			const ownerInfo = {
				ownerId: id,
				ownerTypeId: typeId,
				ownerTypeName: CrmType.resolveNameById(typeId),
			};

			return new SettingsBlock({
				layout,
				currentChannelId,
				channels,
				selectedClient,
				name,
				toPhoneId,
				communications,
				ownerInfo,
				typeId,
				contactCenterUrl,
				showShimmer: !this.isFetchedConfig,
				onChangeClientCallback: this.onChangeClientCallback,
				onChangeClientWithoutPhoneCallback: this.onChangeClientWithoutPhoneCallback,
				onChangeProviderCallback: this.onChangeProviderCallback,
				onChangeProviderPhoneCallback: this.onChangeProviderPhoneCallback,
				showAddPhoneToContactDrawer: this.showAddPhoneToContactDrawer,
			});
		}

		renderWarningBlock()
		{
			if (this.shouldShowClientWarningBlock())
			{
				return this.renderClientWarningBlock();
			}

			if (this.shouldShowClientPhoneWarningBlock())
			{
				return this.renderClientPhoneWarningBlock();
			}

			if (this.isShowProviderWarningBlock())
			{
				return this.renderProviderWarningBlock();
			}

			return null;
		}

		shouldShowClientPhoneWarningBlock()
		{
			const { toPhoneId } = this.state;

			return (this.isFetchedConfig && !Type.isStringFilled(toPhoneId));
		}

		shouldShowClientWarningBlock()
		{
			const { toName } = this.state;

			return !(!this.isFetchedConfig || Type.isStringFilled(toName));
		}

		renderClientPhoneWarningBlock()
		{
			return View(
				{
					style: styles.clientWarningBlockContainer,
				},
				new WarningBlock({
					title: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_NO_CLIENT_PHONE'),
					description: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_PHONE_DRAWER_WARNING_TEXT'),
				}),
			);
		}

		renderClientWarningBlock()
		{
			const { typeId: entityTypeId } = this.props.entity;

			return View(
				{
					style: styles.clientWarningBlockContainer,
				},
				new WarningBlock({
					title: getEntityMessage('M_CRM_TIMELINE_SCHEDULER_GTC_NO_CLIENT_TITLE', entityTypeId),
					description: getEntityMessage('M_CRM_TIMELINE_SCHEDULER_GTC_NO_CLIENT_TEXT', entityTypeId),
				}),
			);
		}

		isShowProviderWarningBlock()
		{
			const { currentChannelId } = this.state;

			return (this.isFetchedConfig && !currentChannelId);
		}

		renderProviderWarningBlock()
		{
			const { layout } = this.props;

			return View(
				{
					style: styles.clientWarningBlockContainer,
				},
				new WarningBlock({
					title: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_NO_PROVIDER_TITLE'),
					description: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_NO_PROVIDER_TEXT'),
					redirectUrl: this.config.contactCenterUrl,
					analyticsSection: 'crm',
					layout,
				}),
			);
		}

		renderSendButton()
		{
			return View(
				{
					style: styles.sendButtonOuterContainer,
				},
				View(
					{
						testId: 'TimelineGoToChatSendMessageButton',
						style: styles.sendButtonContainer(this.canSend()),
						onClick: () => this.showRegistrarAndSend(),
					},
					Text({
						style: styles.sendButtonText,
						text: Loc.getMessage('M_CRM_TIMELINE_SCHEDULER_GTC_SEND'),
					}),
					Image({
						style: styles.sendButtonImage,
						svg: {
							content: icons.buttonIcon,
						},
					}),
				),
			);
		}

		async showRegistrarAndSend()
		{
			if (this.isSending || !this.canSend())
			{
				return;
			}

			const messageSendersConnector = new MessageSendersConnector({
				layout: this.props.layout,
				senderType: this.getSenderType(),
			});

			const lineId = await messageSendersConnector.checkAndGetLine();

			if (lineId)
			{
				this.send(lineId);
			}
		}

		canSend()
		{
			const { toName, toPhoneId, currentChannelId } = this.state;

			return (Type.isStringFilled(toName) && Type.isStringFilled(toPhoneId) && currentChannelId);
		}

		send(lineId)
		{
			this.isSending = true;
			NotifyManager.showLoadingIndicator();

			const { entity: { typeId: ownerTypeId, id: ownerId }, layout } = this.props;
			const { currentChannelId: senderId, fromPhoneId: from, toPhoneId: to } = this.state;
			const senderType = this.getSenderType();

			const ajaxParameters = {
				ownerTypeId,
				ownerId,
				params: {
					senderType,
					senderId,
					from,
					to,
					lineId,
				},
			};

			BX.ajax.runAction('crm.activity.gotochat.send', { data: ajaxParameters })
				.then(() => {
					NotifyManager.hideLoadingIndicator(true);
					setTimeout(() => layout.close(), 500);
				})
				.catch((response) => {
					NotifyManager.hideLoadingIndicator(false);
					void ErrorNotifier.showError(response.errors[0].message);
				})
				.finally(() => this.isSending = false)
			;
		}

		getSenderType()
		{
			const { currentChannelId } = this.state;

			return (currentChannelId === SenderTypes.bitrix24 ? SenderTypes.bitrix24 : SenderTypes.sms);
		}

		onChangeClientCallback(data)
		{
			const { id, type, title: toName, phone: { id: toPhoneId } } = data;

			this.setState({
				toName,
				toPhoneId,
				selectedClient: {
					entityId: id,
					entityTypeId: CrmType.resolveIdByName(type),
				},
			});

			return Promise.resolve();
		}

		onChangeClientWithoutPhoneCallback({ entityId, entityTypeId, caption: toName })
		{
			return new Promise((resolve) => {
				this.setState({
					toName,
					selectedClient: {
						entityId,
						entityTypeId,
					},
				}, resolve);
			});
		}

		onChangeProviderCallback({ sender, fromId })
		{
			this.setState({
				currentChannelId: sender.id,
				fromPhoneId: fromId,
			});
		}

		onChangeProviderPhoneCallback({ fromId })
		{
			this.setState({
				fromPhoneId: fromId,
			});
		}
	}

	const icons = {
		arrow: `<svg width="79" height="40" viewBox="0 0 79 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M78.4419 17.4419C78.686 17.1979 78.686 16.8021 78.4419 16.5581L74.4645 12.5806C74.2204 12.3365 73.8247 12.3365 73.5806 12.5806C73.3365 12.8247 73.3365 13.2204 73.5806 13.4645L77.1161 17L73.5806 20.5355C73.3365 20.7796 73.3365 21.1753 73.5806 21.4194C73.8247 21.6635 74.2204 21.6635 74.4645 21.4194L78.4419 17.4419ZM0 17.625H78V16.375H0V17.625Z" fill="${AppTheme.colors.base4}"/><circle cx="38.5" cy="16.5" r="16.5" fill="${AppTheme.colors.accentSoftBlue2}"/><g filter="url(#filter0_d_903_264448)"><path d="M32.4248 15.3508L41.6501 16.1936V16.7298L32.4248 17.496L31 26L49 16.7298L31 7L32.4248 15.3508Z" fill="${AppTheme.colors.accentExtraAqua}"/></g><defs><filter id="filter0_d_903_264448" x="22.3077" y="2.65385" width="35.3846" height="36.3846" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4.34615"/><feGaussianBlur stdDeviation="4.34615"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0.184314 0 0 0 0 0.776471 0 0 0 0 0.964706 0 0 0 0.28 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_903_264448"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_903_264448" result="shape"/></filter></defs></svg>`,
		buttonIcon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.4449 13.9895L9.50309 13.2563C9.05148 13.2146 8.68447 12.8742 8.60897 12.427L7.69491 7.01327C7.5559 6.18991 8.42753 5.56889 9.16034 5.96918L23.2061 13.6415C23.9082 14.025 23.8981 15.0368 23.1884 15.4062L9.12742 22.7239C8.39617 23.1045 7.5444 22.4865 7.67923 21.6733L8.60974 16.061C8.6846 15.6094 9.05651 15.2663 9.51264 15.2281L17.4425 14.5626C17.5915 14.5501 17.7061 14.4255 17.7061 14.2759C17.7061 14.1273 17.5929 14.0031 17.4449 13.9895Z" fill="${AppTheme.colors.baseWhiteFixed}"/></svg>`,
	};

	const styles = {
		container: {
			flexDirection: 'column',
			flex: 1,
		},
		containerInner: {
			flex: 1,
			borderRadius: 12,
		},
		heroScreenContainer: {
			backgroundColor: AppTheme.colors.accentSoftBlue2,
			borderRadius: 12,
			paddingVertical: 28,
			paddingHorizontal: 10,
		},
		heroScreenTitle: {
			textAlign: 'center',
			fontSize: 19,
			color: AppTheme.colors.base1,
		},
		heroScreenDescription: {
			textAlign: 'center',
			fontSize: 14,
			color: AppTheme.colors.base2,
			marginTop: 11,
			lineHeightMultiple: 1.2,
		},
		heroScreenLeftBottomCircle: {
			position: 'absolute',
			bottom: -170,
			left: -130,
			width: 260,
			height: 260,
			borderRadius: 130,
			borderWidth: 45,
			borderColor: AppTheme.colors.baseWhiteFixed,
			opacity: 0.4,
		},
		heroScreenTopRightCircle: {
			position: 'absolute',
			top: -110,
			right: -80,
			width: 198,
			height: 198,
			borderRadius: 99,
			borderWidth: 26,
			borderColor: AppTheme.colors.bgSeparatorPrimary,
			opacity: 0.4,
		},
		heroScreenIconsContainer: {
			marginTop: 22,
			justifyContent: 'space-around',
			flexDirection: 'row',
		},
		heroScreenArrow: {
			position: 'absolute',
			width: 79,
			height: 40,
			marginTop: 25,
			left: '50%',
			marginLeft: -40,
		},
		heroScreenTextContainer: {
			marginTop: 10,
			flexDirection: 'row',
		},
		heroScreenIcon: {
			width: 86,
			height: 87,
		},
		heroScreenIconText: {
			fontSize: 12,
			color: AppTheme.colors.base3,
			flex: 1,
			textAlign: 'center',
		},
		clientWarningBlockContainer: {
			marginTop: 12,
		},
		sendButtonOuterContainer: {
			marginTop: 21,
			paddingHorizontal: 47,
			justifyContent: 'center',
			paddingBottom: 10,
		},
		sendButtonContainer: (active) => {
			return {
				borderRadius: 24,
				backgroundColor: (active ? withPressed(AppTheme.colors.accentMainSuccess) : AppTheme.colors.base5),
				paddingVertical: 11,
				paddingHorizontal: 37,
				justifyContent: 'center',
				alignContent: 'center',
				flexDirection: 'row',
			};
		},
		sendButtonText: {
			color: AppTheme.colors.baseWhiteFixed,
			fontWeight: '500',
			fontSize: 17,
			textAlign: 'center',
		},
		sendButtonImage: {
			width: 28,
			height: 28,
			marginLeft: 3,
		},
	};

	module.exports = { TimelineSchedulerGoToChatProvider };
});
