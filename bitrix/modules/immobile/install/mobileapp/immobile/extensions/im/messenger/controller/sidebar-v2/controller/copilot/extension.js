/**
 * @module im/messenger/controller/sidebar-v2/controller/copilot
 */
jn.define('im/messenger/controller/sidebar-v2/controller/copilot', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color, Typography } = require('tokens');
	const { isOnline } = require('device/connection');
	const { UIMenu } = require('layout/ui/menu');

	const { Feature } = require('im/messenger/lib/feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { Promo } = require('im/messenger/const');
	const { Promotion } = require('im/messenger/lib/promotion');

	const { SidebarBaseController } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { CopilotSidebarView } = require('im/messenger/controller/sidebar-v2/controller/copilot/src/view');
	const { CopilotSidebarPermissionManager } = require('im/messenger/controller/sidebar-v2/controller/copilot/src/permission-manager');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { SidebarParticipantsTab } = require('im/messenger/controller/sidebar-v2/tabs/participants');
	const { onAddParticipants } = require('im/messenger/controller/sidebar-v2/user-actions/participants');
	const { onDeleteChat } = require('im/messenger/controller/sidebar-v2/user-actions/chat');
	const {
		SidebarContextMenuActionId,
		SidebarContextMenuActionPosition,
		SidebarContextMenuActionSection,
	} = require('im/messenger/controller/sidebar-v2/const');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const {
		createSearchButton,
		createMuteButton,
		createCopilotRoleButton,
		createCopilotModelButton,
		createCopilotChangeModelStateButton,
	} = require('im/messenger/controller/sidebar-v2/ui/primary-button/factory');

	class CopilotSidebarController extends SidebarBaseController
	{
		async init(props)
		{
			await super.init(props);

			this.isChangeEngineProcessing = false;
			this.ahaMomentRoleButton = null;

			this.#setAhaMoments();
			this.#setChangeEngineProcess();

			return this;
		}

		#setAhaMoments()
		{
			if (Feature.isCopilotSelectModelEnabled)
			{
				this.ahaMomentRoleButton = this.#checkPromoForAhaMoment(Promo.copilotSidebarEngine);
			}
		}

		/**
		 * @param {string} promoId
		 * @return {string|null}
		 */
		#checkPromoForAhaMoment(promoId)
		{
			if (Promotion.getInstance()?.shouldShowPromo(promoId))
			{
				return promoId;
			}

			return null;
		}

		/**
		 * @override
		 */
		bindMethods()
		{
			super.bindMethods();
			this.handleCopilotUpdate = this.handleCopilotUpdate.bind(this);
		}

		/**
		 * @override
		 */
		subscribeStoreEvents()
		{
			super.subscribeStoreEvents();
			this.storeManager.on('dialoguesModel/copilotModel/update', this.handleCopilotUpdate);
		}

		/**
		 * @override
		 */
		unsubscribeStoreEvents()
		{
			super.unsubscribeStoreEvents();
			this.storeManager.off('dialoguesModel/copilotModel/update', this.handleCopilotUpdate);
		}

		/**
		 * @override
		 * @param {SidebarViewDefaultProps} defaultProps
		 * @return {CopilotSidebarView}
		 */
		createView(defaultProps)
		{
			return new CopilotSidebarView(defaultProps);
		}

		/**
		 * @override
		 * @param {SidebarPermissionManagerDefaultProps} defaultProps
		 * @return {CopilotSidebarPermissionManager}
		 */
		createPermissionManager(defaultProps)
		{
			return new CopilotSidebarPermissionManager(defaultProps);
		}

		/**
		 * @override
		 * @return {string}
		 */
		getWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_CHAT_TITLE');
		}

		// region context menu

		/**
		 * @override
		 * @return {SidebarContextMenuItem[]}
		 */
		getHeaderContextMenuItems()
		{
			return [
				{
					id: SidebarContextMenuActionId.ADD_PARTICIPANTS,
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_ADD_PARTICIPANTS'),
					icon: Icon.ADD_PERSON,
					testId: 'sidebar-context-menu-add-participants',
					sort: SidebarContextMenuActionPosition.MIDDLE,
					onItemSelected: () => {
						onAddParticipants({
							dialogId: this.dialogId,
							store: this.store,
						}).catch((error) => {
							this.logger.error('onAddParticipants', error);
						});
					},
				},
				...super.getHeaderContextMenuItems(),
			];
		}

		/**
		 * @override
		 */
		handleDeleteDialogAction()
		{
			onDeleteChat(this.dialogId);
		}

		/**
		 * @param {LayoutComponent} target
		 */
		handleSelectCopilotModelAction(target)
		{
			this.#showModelContextMenu(target);
		}

		/**
		 * @async
		 * @override
		 */
		async handleEditDialogAction()
		{
			this.logger.info('handleEditDialogAction');
			const { UpdateGroupChat } = await requireLazy('im:messenger/controller/chat-composer');

			try
			{
				new UpdateGroupChat({ dialogId: this.dialogId, parentWidget: this.widget }).openGroupChatView();
				this.analyticsService.sendDialogEditHeaderMenuClick(this.dialogId);
			}
			catch (error)
			{
				this.logger.error('handleEditDialogAction', error);
			}
		}

		// endregion

		// region primary button actions

		/**
		 * @override
		 * @return {SidebarPrimaryActionButton[]}
		 */
		getPrimaryActionButtons()
		{
			const muted = this.dialogHelper.isMuted;
			const dialogId = this.dialogHelper.dialogId;

			const buttons = [
				createCopilotRoleButton({
					dialogId,
					ahaMoment: this.ahaMomentRoleButton,
					onClick: () => this.handleSelectCopilotRoleAction(),
				}),
				createSearchButton({
					onClick: () => this.handleSearchAction(),
				}),
				createMuteButton({
					onClick: () => this.handleToggleMuteAction(),
					muted,
				}),
			];

			if (Feature.isCopilotSelectModelEnabled)
			{
				const modelButton = this.isChangeEngineProcessing
					? createCopilotChangeModelStateButton({
						dialogId,
					})
					: createCopilotModelButton({
						dialogId,
						onClick: (targetRef) => this.handleSelectCopilotModelAction(targetRef),
					});

				buttons.splice(1, 0, modelButton);
			}

			return buttons;
		}

		handleCopilotUpdate()
		{
			this.#updateChangeEngineProcess();
			this.refreshView();
		}

		// endregion

		// region tabs

		/**
		 * @override
		 * @return {SidebarParticipantsTab[]}
		 */
		createTabs()
		{
			const props = this.getTabsProps();

			return [
				new SidebarParticipantsTab(props),
			];
		}

		// endregion

		// region copilot model actions

		/**
		 * @return {Array<AvailableCopilotEngine>}
		 */
		getAvailableEngines()
		{
			return MessengerParams.getCopilotAvailableEngines();
		}

		/**
		 * @return {CopilotModelState|null}
		 */
		getCopilotModelState()
		{
			const copilotData = this.store.getters['dialoguesModel/copilotModel/getByDialogId'](this.dialogId);
			if (copilotData)
			{
				return copilotData;
			}

			return null;
		}

		/**
		 * @return {?CopilotEngine}
		 */
		getCurrentCopilotEngine()
		{
			const copilotModelState = this.getCopilotModelState();
			if (!copilotModelState)
			{
				return null;
			}

			return copilotModelState.engine;
		}

		/**
		 * @async
		 * @param {CopilotEngine} engine
		 * @return {Promise<void>}
		 */
		async contextMenuItemModelSelected(engine)
		{
			this.logger.log('contextMenuItemModelSelected engine:', engine);
			const currentEngine = this.getCurrentCopilotEngine();
			try
			{
				this.modelContextMenu?.hide();

				if (!isOnline())
				{
					Notification.showOfflineToast();

					return;
				}

				if (currentEngine.code === engine.code)
				{
					this.logger.warn('contextMenuItemModelSelected skipped - select current engine:', engine.code);

					return;
				}

				await this.#setChangeEngineToStore(engine, true);

				await this.handleSelectCopilotEngineAction(engine.code);
			}
			catch (error)
			{
				this.logger.error('handleSelectCopilotEngineAction catch:', error);
				this.isChangeEngineProcessing = false;
				await this.#setChangeEngineToStore(currentEngine);
			}
		}

		/**
		 * @return {void}
		 */
		contextMenuItemHelpSelected()
		{
			const articleCode = '25282852';
			this.logger.log('contextMenuItemHelpSelected articleCode:', articleCode);
			this.modelContextMenu?.hide();

			try
			{
				helpdesk.openHelpArticle(articleCode, 'helpdesk');
			}
			catch (error)
			{
				this.logger.error('helpdesk.openHelpArticle catch:', error);
			}
		}

		/**
		 * @private
		 * @param {LayoutComponent} target
		 * @return {void}
		 */
		#showModelContextMenu(target)
		{
			const modelContextMenuItems = this.#prepareModelContextMenuItems();

			if (modelContextMenuItems.length === 0)
			{
				return;
			}

			if (this.modelContextMenu)
			{
				this.modelContextMenu.setProvider(() => modelContextMenuItems);
			}
			else
			{
				this.modelContextMenu = new UIMenu(modelContextMenuItems);
			}

			this.modelContextMenu.show({ target });
		}

		/**
		 * @private
		 * @return {UIMenuActionProps[]}
		 */
		#prepareModelContextMenuItems()
		{
			const engines = this.getAvailableEngines();
			const currentEngine = this.getCurrentCopilotEngine();
			const recommendBadgeText = Loc.getMessage('IMMOBILE_SIDEBAR_V2_COPILOT_MODEL_CONTEXT_MENU_ITEM_TITLE_BADGE_RECOMMENDED');

			const modelItems = engines.map((engine) => ({
				id: engine.code,
				testId: `copilot-models-item-${engine.code}`,
				title: engine.name,
				titleBadgeValue: engine.recommended ? recommendBadgeText : null,
				sectionCode: SidebarContextMenuActionSection.COPILOT_MODELS,
				checked: engine.code === currentEngine?.code,
				disable: false,
				onItemSelected: () => {
					return this.contextMenuItemModelSelected(engine);
				},
				styles: {
					titleBadge: {
						font: {
							color: Color.accentMainSuccess,
							fontSize: Typography.text6,
						},
					},
				},
			}));

			const helpItemTitle = Loc.getMessage('IMMOBILE_SIDEBAR_V2_COPILOT_MODEL_CONTEXT_MENU_ITEM_HELP');
			const helpItem = {
				id: SidebarContextMenuActionId.COPILOT_HELP,
				testId: 'copilot-models-item-help',
				title: helpItemTitle,
				sectionCode: SidebarContextMenuActionSection.COPILOT_HELP,
				iconName: Icon.QUESTION,
				disable: true,
				onItemSelected: () => {
					return this.contextMenuItemHelpSelected();
				},
			};

			return [
				helpItem,
				...modelItems,
			];
		}

		/**
		 * @private
		 * @param {CopilotEngine} engine
		 * @param {boolean} [changeEngine=false]
		 */
		#setChangeEngineToStore(engine, changeEngine = false)
		{
			this.store.dispatch('dialoguesModel/copilotModel/update', {
				dialogId: this.dialogId,
				fields: {
					engine: { code: engine.code, name: engine.name },
					changeEngine,
				},
			});
		}

		/**
		 * @private
		 * @return void
		 */
		#updateChangeEngineProcess()
		{
			const currentModel = this.getCopilotModelState();
			const newState = currentModel?.changeEngine;
			this.#checkShowToastByChangeEngineState(newState);

			this.isChangeEngineProcessing = newState;
		}

		/**
		 * @private
		 * @return void
		 */
		#setChangeEngineProcess()
		{
			const currentModel = this.getCopilotModelState();

			this.isChangeEngineProcessing = currentModel?.changeEngine ?? false;
		}

		/**
		 * @private
		 * @param {boolean} newChangeState
		 */
		#checkShowToastByChangeEngineState(newChangeState = false)
		{
			if (this.isChangeEngineProcessing === true && newChangeState === false)
			{
				this.#showToastChangeEngine();
			}
		}

		/**
		 * @private
		 */
		#showToastChangeEngine()
		{
			Notification.showToast(ToastType.copilotEngineChanged, this.widget);
		}

		/**
		 * @async
		 * @param {string} engineCode
		 * @return {Promise}
		 */
		async handleSelectCopilotEngineAction(engineCode)
		{
			this.logger.log('handleSelectCopilotEngineAction', engineCode);

			try
			{
				const { CopilotRest } = await requireLazy('im:messenger/provider/rest');

				return CopilotRest.changeEngine({ dialogId: this.dialogId, engineCode });
			}
			catch (error)
			{
				this.logger.error('handleSelectCopilotEngineAction copilotRest.changeEngine catch:', error);

				throw error;
			}
		}

		// endregion

		// region copilot role actions

		/**
		 * @async
		 * @return {Promise<void>}
		 */
		async handleSelectCopilotRoleAction()
		{
			this.logger.info('handleSelectCopilotRoleAction');

			const { CopilotRoleSelector } = await requireLazy('layout/ui/copilot-role-selector');
			const { CopilotRest } = await requireLazy('im:messenger/provider/rest');

			try
			{
				const result = await CopilotRoleSelector.open({
					showOpenFeedbackItem: true,
					openWidgetConfig: {
						backdrop: {
							mediumPositionPercent: 75,
							horizontalSwipeAllowed: false,
							onlyMediumPosition: false,
						},
					},
					skipButtonText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_CLOSE'),
				});

				if (result?.role?.code)
				{
					CopilotRest.changeRole({ dialogId: this.dialogId, roleCode: result.role.code });
				}
			}
			catch (error)
			{
				this.logger.error('handleSelectCopilotRoleAction', error);
			}
		}

		// endregion
	}

	module.exports = {
		CopilotSidebarController,
		ControllerClass: CopilotSidebarController,
	};
});
