/**
 * @module im/messenger/controller/sidebar/channel/sidebar-controller
 */
jn.define('im/messenger/controller/sidebar/channel/sidebar-controller', (require, exports, module) => {
	/* global InAppNotifier */
	const { ChannelSidebarView } = require('im/messenger/controller/sidebar/channel/sidebar-view');
	const { SidebarService } = require('im/messenger/controller/sidebar/chat/sidebar-service');
	const { SidebarRestService } = require('im/messenger/controller/sidebar/chat/sidebar-rest-service');
	const { SidebarUserService } = require('im/messenger/controller/sidebar/chat/sidebar-user-service');
	const { buttonIcons } = require('im/messenger/assets/common');
	const { ButtonFactory } = require('im/messenger/lib/ui/base/buttons');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Type } = require('type');
	const { Logger } = require('im/messenger/lib/logger');
	const { EventType, DialogType } = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { Loc } = require('loc');
	const { Theme } = require('im/lib/theme');

	class ChannelSidebarController
	{
		/**
		 * @constructor
		 * @param {object} options
		 * @param {string} options.dialogId
		 */
		constructor(options)
		{
			this.options = options;
			this.store = serviceLocator.get('core')
				.getStore();
			this.storeManager = serviceLocator.get('core')
				.getStoreManager();
			this.sidebarService = new SidebarService(this.store, options.dialogId);
			this.sidebarRestService = new SidebarRestService(options.dialogId);
			this.sidebarUserService = null;
			this.dialogId = options.dialogId;
		}

		/**
		 * @desc getter style btn
		 * @return {object}
		 */
		get styleBtn()
		{
			return {
				border: { color: Theme.colors.bgSeparatorSecondary },
				text: { color: Theme.colors.base2 },
			};
		}

		open()
		{
			Logger.log(`${this.constructor.name}.open`);
			this.createWidget();
		}

		createWidget()
		{
			PageManager.openWidget(
				'layout',
				{
					title: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_WIDGET_TITLE_CHANNEL'),
				},
			)
				.then(
					(widget) => {
						this.widget = widget;
						this.onWidgetReady();
					},
				)
				.catch((error) => {
					Logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		async onWidgetReady()
		{
			Logger.log(`${this.constructor.name}.onWidgetReady`);
			this.sidebarService.setStore();
			this.bindListener();
			this.setUserService();
			this.setPermissions();
			this.createView();
			this.widget.showComponent(this.view);
			this.subscribeStoreEvents();
			this.subscribeWidgetEvents();
			this.subscribeBXCustomEvents();
		}

		/**
		 * @desc Method binding this for use in handlers
		 * @void
		 */
		bindListener()
		{
			this.onUpdateStore = this.onUpdateStore.bind(this);
			this.onCloseWidget = this.onCloseWidget.bind(this);
			this.onDestroySidebar = this.onDestroySidebar.bind(this);
		}

		setUserService()
		{
			this.sidebarUserService = new SidebarUserService(this.dialogId, false);
		}

		/**
		 * @desc Method setting permissions
		 * @void
		 */
		setPermissions()
		{
			const dialogState = this.store.getters['dialoguesModel/getById'](this.dialogId);
			if (dialogState)
			{
				this.isGeneral = dialogState.type === DialogType.generalChannel;
			}
			this.isCanLeave = ChatPermission.isCanLeaveFromChat(this.dialogId);
		}

		createView()
		{
			this.view = new ChannelSidebarView(this.preparePropsSidebarView());
		}

		subscribeStoreEvents()
		{
			Logger.log(`${this.constructor.name}.subscribeStoreEvents`);
			this.storeManager.on('sidebarModel/update', this.onUpdateStore);
			this.storeManager.on('dialoguesModel/update', this.onUpdateStore);
		}

		subscribeWidgetEvents()
		{
			Logger.log(`${this.constructor.name}.subscribeWidgetEvents`);
			this.widget.on(EventType.view.close, this.onCloseWidget);
			this.widget.on(EventType.view.hidden, this.onCloseWidget);
		}

		subscribeBXCustomEvents()
		{
			Logger.log(`${this.constructor.name}.subscribeBXCustomEvents`);
			BX.addCustomEvent('onDestroySidebar', this.onDestroySidebar);
		}

		unsubscribeStoreEvents()
		{
			Logger.log(`${this.constructor.name}.unsubscribeStoreEvents`);
			this.storeManager.off('sidebarModel/update', this.onUpdateStore);
			this.storeManager.off('dialoguesModel/update', this.onUpdateStore);
		}

		unsubscribeBXCustomEvents()
		{
			Logger.log(`${this.constructor.name}.unsubscribeBXCustomEvents`);
			BX.removeCustomEvent('onDestroySidebar', this.onDestroySidebar);
		}

		/**
		 * @desc Prepare data props for build view
		 * @return {ChannelSidebarViewProps}
		 */
		preparePropsSidebarView()
		{
			return {
				headData: {
					...this.sidebarUserService.getAvatarDataById(),
					...this.sidebarUserService.getTitleDataById(),
				},
				dialogId: this.dialogId,
				buttonElements: this.createButtons(),
				callbacks: {
					onClickInfoBLock: () => true,
				},
				restService: this.sidebarRestService,
				isSuperEllipseAvatar: this.isSuperEllipseAvatar(),
			};
		}

		/**
		 * @desc Creates layout elements for view block btns under info
		 * @return {Array<IconButton>}
		 */
		createButtons()
		{
			const disable = this.isGeneral || !this.isCanLeave;

			return [
				this.createMuteBtn(),
				ButtonFactory.createIconButton(
					{
						icon: buttonIcons.search(Theme.colors.base7),
						text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_BTN_SEARCH'),
						callback: () => this.onClickSearchBtn(),
						disable: true,
						style: this.styleBtn,
					},
				),
				ButtonFactory.createIconButton(
					{
						icon: buttonIcons.logOutInline(disable ? Theme.colors.base7 : Theme.colors.base1),
						text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_BTN_LEAVE'),
						callback: () => this.onClickLeaveBtn(),
						disable,
						disableClick: disable,
						style: this.styleBtn,
					},
				),
			];
		}

		/**
		 * @desc Returns btn mute layout element ( muteOn or muteOff icon )
		 * @param {boolean} [isMute]
		 * @return {object|null}
		 */
		createMuteBtn(isMute = this.sidebarService.isMuteDialog())
		{
			return isMute ? ButtonFactory.createIconButton(
				{
					icon: buttonIcons.muteOffInline(),
					text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_BTN_MUTE'),
					callback: () => this.onClickMuteBtn(),
					style: this.styleBtn,
				},
			) : ButtonFactory.createIconButton(
				{
					icon: buttonIcons.muteOnInline(),
					text: Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_BTN_MUTE'),
					callback: () => this.onClickMuteBtn(),
					style: this.styleBtn,
				},
			);
		}

		onClickSearchBtn()
		{
			const locValue = Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_NOTICE_COMING_SOON');
			InAppNotifier.showNotification(
				{
					backgroundColor: Theme.colors.baseBlackFixed,
					message: locValue,
				},
			);
		}

		onClickLeaveBtn()
		{
			setTimeout(() => {
				navigator.notification.confirm(
					'',
					(buttonId) => {
						if (buttonId === 2)
						{
							this.onClickYesLeaveChannel();
						}
					},
					Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHANNEL_CONFIRM_TITLE'),
					[
						Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHAT_CONFIRM_NO'),
						Loc.getMessage('IMMOBILE_DIALOG_SIDEBAR_LEAVE_CHANNEL_CONFIRM_YES'),
					],
				);
			}, 10);
		}

		onClickYesLeaveChannel()
		{
			this.sidebarRestService.leaveChat()
				.then(
					(result) => {
						if (result)
						{
							try
							{
								PageManager.getNavigator().popTo('im.tabs')
									// eslint-disable-next-line promise/no-nesting
									.catch((err) => {
										Logger.error(`${this.constructor.name}.onClickYesLeaveChannel.popTo.catch`, err);
										BX.onCustomEvent('onDestroySidebar');
										MessengerEmitter.emit(EventType.messenger.destroyDialog);
									});
							}
							catch (e)
							{
								Logger.error(`${this.constructor.name}.onClickYesLeaveChannel.getNavigator()`, e);
								BX.onCustomEvent('onDestroySidebar');
								MessengerEmitter.emit(EventType.messenger.destroyDialog);
							}
						}
					},
				)
				.catch((err) => Logger.error(`${this.constructor.name}.onClickYesLeaveChannel.sidebarRestService.leaveChat`, err));
		}

		onClickMuteBtn()
		{
			const oldStateMute = this.sidebarService.isMuteDialog();
			this.store.dispatch('sidebarModel/changeMute', { dialogId: this.dialogId, isMute: !oldStateMute });

			if (oldStateMute)
			{
				this.sidebarService.muteService.unmuteChat(this.dialogId);
			}
			else
			{
				this.sidebarService.muteService.muteChat(this.dialogId);
			}
		}

		onUpdateStore(event)
		{
			const { payload } = event;
			Logger.info(`${this.constructor.name}.onUpdateStore---------->`, event);

			if (payload.actionName === 'changeMute' && Type.isBoolean(payload.data.fields.isMute))
			{
				this.changeMuteBtn(payload.data.fields.isMute);
			}
		}

		onDestroySidebar()
		{
			this.widget.back();
		}

		onCloseWidget()
		{
			this.unsubscribeStoreEvents();
			this.unsubscribeBXCustomEvents();
			BX.onCustomEvent('onCloseSidebarWidget');
		}

		/**
		 * @desc Changed icon in btn mute ( muteOn or muteOff )
		 * @param {boolean} [isMute]
		 * @void
		 */
		changeMuteBtn(isMute)
		{
			const res = this.createMuteBtn(isMute);
			BX.onCustomEvent('onChangeMuteBtn', res);
		}

		updateBtn()
		{
			const newStateBtn = this.createButtons();
			BX.onCustomEvent('onUpdateBtn', newStateBtn);
		}

		isSuperEllipseAvatar()
		{
			return true;
		}
	}

	module.exports = { ChannelSidebarController };
});
