/**
 * @module im/messenger/controller/chat-composer/update/group-chat
 */
jn.define('im/messenger/controller/chat-composer/update/group-chat', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');
	const { Haptics } = require('haptics');
	const { unique } = require('utils/array');
	const { confirmClosing } = require('alert');
	const { Icon } = require('ui-system/blocks/icon');
	const { NestedDepartmentSelector } = require('selector/widget/entity/tree-selectors/nested-department-selector');
	const { MemberSelector } = require('im/messenger/controller/selector/member');

	const { WidgetTitleParamsType } = require('im/messenger/const');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { EntitySelectorHelper } = require('im/messenger/lib/helper');
	const { ProjectAccessGuard } = require('im/messenger/lib/project-access-guard');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('chat-composer--group-chat');

	const { GroupChatView } = require('im/messenger/controller/chat-composer/lib/view/group-chat');
	const { ManagersView } = require('im/messenger/controller/chat-composer/lib/view/managers');
	const { RulesListView } = require('im/messenger/controller/chat-composer/lib/view/rules-list');
	const { UserListBuilder } = require('im/messenger/controller/chat-composer/lib/user-list-builder');

	/**
	 * @class UpdateGroupChat
	 */
	class UpdateGroupChat
	{
		/** @type {ChatService} */
		#chatService;

		/**
		 * @constructor
		 * @param {DialogId} dialogId
		 * @param {PageManager} parentWidget
		 */
		constructor({ dialogId, parentWidget = PageManager })
		{
			/** @type {RulesListView | null} */
			this.rulesListView = null;
			this.core = serviceLocator.get('core');
			this.store = this.core.getStore();
			this.dialogId = dialogId;
			/** @type {DialoguesModelState|null} */
			this.dialogModel = null;
			this.permissions = null;
			this.storeManager = serviceLocator.get('core').getStoreManager();
			this.isMainWidgetClosing = false;
			this.parentWidget = parentWidget;

			this.bindMethods();
			this.subscribeStoreEvents();
			this.setDialogModel();
			this.setPermissions();
		}

		/** @type {ChatService} */
		get chatService()
		{
			this.#chatService = this.#chatService ?? new ChatService();

			return this.#chatService;
		}

		/**
		 * @protected
		 * @desc Method binding this for use in handlers
		 * @void
		 */
		bindMethods()
		{
			this.onUpdateDialogStore = this.onUpdateDialogStore.bind(this);
		}

		/** @protected */
		subscribeStoreEvents()
		{
			logger.log(`${this.constructor.name}.subscribeStoreEvents`);
			this.storeManager.on('dialoguesModel/update', this.onUpdateDialogStore);
		}

		/** @protected */
		unsubscribeStoreEvents()
		{
			logger.log(`${this.constructor.name}.unsubscribeStoreEvents`);
			this.storeManager.off('dialoguesModel/update', this.onUpdateDialogStore);
		}

		/**
		 * @protected
		 * @return {DialoguesModelState}
		 */
		getDialogModel()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId);
		}

		/** @protected */
		setDialogModel()
		{
			this.dialogModel = this.getDialogModel();
		}

		/** @protected */
		setPermissions()
		{
			this.permissions = {
				update: ChatPermission.canUpdateDialogByRole(this.dialogModel),
			};
		}

		/**
		 * @param {{ titleType?: string }} [params]
		 */
		openGroupChatView({ titleType = WidgetTitleParamsType.entity } = {})
		{
			this.parentWidget.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_UPDATE_GROUP_CHAT_TITLE'),
					type: titleType,
				},
				modal: true,
			})
				.then((widget) => {
					this.mainWidget = widget;
					this.mainView = GroupChatView.openToEdit(this.getDialogInfoProps());
					this.mainWidget.showComponent(this.mainView);
					this.mainWidget.expandBottomSheet();
					this.mainWidget.setLeftButtons([]);
					this.mainWidget.setRightButtons([
						{
							id: 'cross',
							type: 'cross',
							callback: () => this.checkBeforeCloseWidget(),
						},
					]);
					this.mainWidget.setBackButtonHandler(() => {
						this.checkBeforeCloseWidget();

						return true;
					});
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		/** @protected */
		checkBeforeCloseWidget()
		{
			if (this.mainView.state.isInputChanged && !this.isMainWidgetClosing)
			{
				return this.showConfirmOnWidgetClosing();
			}

			return this.mainWidget.close();
		}

		/** @protected */
		showConfirmOnWidgetClosing()
		{
			Keyboard.dismiss();
			Haptics.impactLight();

			confirmClosing({
				hasSaveAndClose: false,
				title: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_CLOSE_WIDGET_CONFIRM_TITLE'),
				description: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_CLOSE_WIDGET_CONFIRM_DESC'),
				onClose: () => {
					this.isMainWidgetClosing = true;
					this.mainWidget.close();
				},
			});
		}

		/**
		 * @protected
		 * @return {GroupChatViewProps}
		 */
		getDialogInfoProps()
		{
			return {
				dialogId: this.dialogId,
				title: this.dialogModel.name,
				description: this.dialogModel.description,
				avatar: this.dialogModel.avatar,
				type: this.dialogModel.type,
				userCounter: this.dialogModel.userCounter,
				managerCounter: this.dialogModel.managerList.length,
				permissions: this.permissions,
				callbacks:
					{
						onClickDoneButton: this.onClickDoneButton.bind(this),
						onChangeAvatar: this.onChangeAvatar.bind(this),
						onClickParticipantAction: this.onClickParticipantAction.bind(this),
						onClickManagersAction: this.openManagersView.bind(this),
						onClickRulesAction: this.openRulesListView.bind(this),
						onDestroy: () => {
							this.unsubscribeStoreEvents();
						},
					},
			};
		}

		/**
		 * @protected
		 * @param {{ titleType?: string }} [params]
		 */
		openManagersView({ titleType = WidgetTitleParamsType.entity } = {})
		{
			PageManager.openWidget(
				'layout',
				{
					titleParams: {
						text: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_MANAGERS_TITLE'),
						type: titleType,
					},
				},
				this.mainWidget,
			)
				.then((widget) => {
					this.managersView = new ManagersView({
						dialogId: this.dialogId,
						users: this.buildManagerDataList(),
						callbacks: {
							onClickRemoveManager: this.onClickRemoveManager.bind(this),
							onClickAddManager: this.onClickAddManager.bind(this, widget),
							onDestroyView: () => {
								this.managersView = null;
							},
						},
					});
					widget.showComponent(this.managersView);
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		/**
		 * @protected
		 * @param {Array<Number>} addManagersIds
		 * @void
		 */
		onSelectManagers = async (addManagersIds) => {
			const currentManagersIdsList = new Set(this.managersView.state.users.map((user) => user.id));
			const uniqueId = addManagersIds.filter((id) => !currentManagersIdsList.has(id));
			if (uniqueId.length === 0)
			{
				return;
			}

			const parentChatId = this.getDialogModel()?.parentChatId ?? 0;
			const canAdd = await ProjectAccessGuard.canAddUsersToProjectChildChat(parentChatId, uniqueId);
			if (!canAdd)
			{
				return;
			}

			this.onClickManagersSelectorDoneButton(uniqueId);
		};

		/**
		 * @protected
		 * @param {LayoutWidget} widget
		 */
		onClickAddManager(widget)
		{
			logger.log(`${this.constructor.name}.onClickBtnAdd`);

			const memberSelector = new MemberSelector({
				onSelectMembers: this.onSelectManagers,
			});

			memberSelector.open(widget);
		}

		/**
		 * @protected
		 * @param {{ titleType?: string }} [params]
		 */
		async onClickParticipantAction({ titleType = WidgetTitleParamsType.entity } = {})
		{
			const initSelectedIds = await this.getCurrentMemberIds();
			logger.log(`${this.constructor.name}.onClickParticipantAction.initSelectedIds`, initSelectedIds);

			// Capture the selection in onClose, but defer the access guard / REST update
			// until the selector widget is fully removed from the stack. Showing the
			// native confirm while the host widget is being dismissed causes it to be
			// auto-dismissed by the platform.
			let pendingSelectedEntity = null;

			const selector = new NestedDepartmentSelector({
				initSelectedIds,
				undeselectableIds: EntitySelectorHelper.createUserList([serviceLocator.get('core').getUserId()]),
				widgetParams: {
					title: this.getParticipantWidgetTitle(),
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
					sendButtonName: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_USER_SELECTOR_DONE_BUTTON'),
				},
				allowMultipleSelection: true,
				closeOnSelect: true,
				events: {
					onClose: (selectedEntity) => {
						pendingSelectedEntity = selectedEntity;
					},
					onViewRemoved: () => {
						if (pendingSelectedEntity === null)
						{
							return;
						}

						const selectedEntity = pendingSelectedEntity;
						pendingSelectedEntity = null;
						this.onCloseParticipantSelector(selectedEntity, initSelectedIds);
					},
				},
				createOptions: {
					enableCreation: false,
				},
				selectOptions: {
					canUnselectLast: true,
					singleEntityByType: false,
				},
				canUseRecent: false,
				provider: {
					context: 'IMMOBILE_UPDATE_GROUP_CHAT_PARTICIPANT',
					options: {
						useLettersForEmptyAvatar: true,
						allowFlatDepartments: true,
						allowSelectRootDepartment: true,
						addMetaUser: false,
					},
				},
			});

			selector.getSelector().show({}, this.mainWidget)
				.catch((error) => {
					logger.error(`${this.constructor.name}.onClickParticipantAction.selector.show.catch:`, error);
				})
			;
		}

		/**
		 * @protected
		 * @return {string}
		 */
		getParticipantWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_CHAT_COMPOSER_PARTICIPANT_TITLE');
		}

		/**
		 * @protected
		 * @param {{ titleType?: string }} [params]
		 */
		openRulesListView({ titleType = WidgetTitleParamsType.entity } = {})
		{
			PageManager.openWidget(
				'layout',
				{
					titleParams: {
						text: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_RULES_LIST_TITLE'),
						type: titleType,
					},
				},
				this.mainWidget,
			)
				.then((widget) => {
					this.rulesListView = new RulesListView(
						{
							dialogType: this.dialogModel.type,
							permissions: this.dialogModel.permissions,
							callbacks: {
								onChangeUserRoleInRule: this.onChangeUserRoleInRule.bind(this),
								onDestroyView: () => {
									this.rulesListView = null;
								},
							},
						},
					);
					widget.showComponent(this.rulesListView);
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.PageManager.openWidget.catch:`, error);
				});
		}

		/**
		 * @protected
		 * @desc update info
		 * @param {object} event
		 * @param {string?} event.title
		 * @param {string?} event.description
		 * @void
		 */
		onClickDoneButton(event)
		{
			if (this.permissions?.update)
			{
				return this.restChatUpdate(event)
					.then((result) => {
						if (result !== true)
						{
							return false;
						}
						this.showSuccessfullyToast();
						this.sendAnalyticsByClickDialogInfoDone(event);

						return this.updateDialogModel({ name: event.title, description: event.description });
					})
					.catch((error) => logger.log(`${this.constructor.name}.onClickDoneButton.catch:`, error));
			}

			return this.restTitleUpdate(event.title)
				.then((result) => {
					if (result !== true)
					{
						return false;
					}
					this.showSuccessfullyToast();
					this.sendAnalyticsByClickDialogInfoDone(event);

					return this.updateDialogModel({ name: event.title });
				})
				.catch((error) => logger.log(`${this.constructor.name}.restTitleUpdate.catch:`, error));
		}

		/**
		 * @protected
		 * @void
		 */
		sendAnalyticsByClickDialogInfoDone()
		{
			AnalyticsService.getInstance().sendDialogEditButtonDoneDialogInfoClick(this.dialogModel);
		}

		/**
		 * @protected
		 * @desc update avatar
		 * @param {string} avatarBase64str
		 * @param {string} preview
		 * @void
		 */
		onChangeAvatar(avatarBase64str, preview)
		{
			if (this.permissions?.update)
			{
				return this.restChatUpdate({ avatar: avatarBase64str })
					.then((result) => {
						if (result !== true)
						{
							return false;
						}
						this.showSuccessfullyToast();

						return this.updateDialogModel({ avatar: preview });
					})
					.catch((error) => logger.log(`${this.constructor.name}.onChangeAvatar.catch:`, error));
			}

			// this rest for rule manageUI
			return this.restAvatarUpdate(avatarBase64str)
				.then((result) => {
					if (result !== true)
					{
						return false;
					}
					this.showSuccessfullyToast();

					return this.updateDialogModel({ avatar: preview });
				})
				.catch((error) => logger.log(`${this.constructor.name}.onChangeAvatar.catch:`, error));
		}

		/**
		 * @protected
		 * @desc update role by rule
		 * @param {string} rule
		 * @param {UserRole} userRole
		 * @void
		 */
		onChangeUserRoleInRule(rule, userRole)
		{
			this.restChatUpdate({ [rule]: userRole })
				.then((result) => {
					if (result !== true)
					{
						return false;
					}
					this.showSuccessfullyToast();

					return this.updateDialogModelPermissions({ [rule]: userRole });
				})
				.catch((error) => logger.log(`${this.constructor.name}.onChangeDialogType.catch:`, error));

		}

		/**
		 * @protected
		 * @param {Array<number>} addedManagers
		 * @void
		 */
		onClickManagersSelectorDoneButton(addedManagers)
		{
			logger.log(`${this.constructor.name}.onClickManagersSelectorDoneButton`, addedManagers);
			this.restChatUpdate({ addedManagers })
				.then((result) => {
					if (result !== true)
					{
						return false;
					}
					this.showSuccessfullyToast();

					const managerList = unique([...this.getDialogModel().managerList, ...addedManagers]);

					return this.updateDialogModel({ managerList });
				})
				.catch((error) => logger.log(`${this.constructor.name}.onClickManagersSelectorDoneButton.catch:`, error));
		}

		/**
		 * @protected
		 * @param {number} userId
		 * @void
		 */
		onClickRemoveManager(userId)
		{
			logger.log(`${this.constructor.name}.onClickRemoveManager userId:`, userId);
			this.restChatUpdate({ deletedManagers: [userId] })
				.then((result) => {
					if (result !== true)
					{
						return false;
					}
					this.showSuccessfullyToast();

					const managerList = this.getDialogModel().managerList?.filter((id) => id !== userId);

					return this.updateDialogModel({ managerList });
				})
				.catch((error) => logger.log(
					`${this.constructor.name}.onClickRemoveManager.removeManager.catch:`,
					error,
				));
		}

		/**
		 * @protected
		 * @param {Array<Object>} selectedEntity
		 * @param {Array<Array>} initSelectedIds
		 * @void
		 */
		async onCloseParticipantSelector(selectedEntity, initSelectedIds)
		{
			const initTupleSet = new Set(initSelectedIds.map(([type, id]) => `${type}-${id}`));
			const addedEntities = selectedEntity
				.filter(({ type, id }) => !initTupleSet.has(`${type}-${id}`));
			const addedMemberEntities = addedEntities.map(({ type, id }) => [type, id]);

			const selectedSet = new Set(selectedEntity.map(({ type, id }) => `${type}-${id}`));
			const deletedMemberEntities = initSelectedIds.filter(([type, id]) => !selectedSet.has(`${type}-${id}`));

			if (addedMemberEntities.length === 0 && deletedMemberEntities.length === 0)
			{
				return;
			}

			const parentChatId = this.getDialogModel()?.parentChatId ?? 0;
			const canAdd = await ProjectAccessGuard.canAddEntitiesToProjectChildChat(parentChatId, addedEntities);
			if (!canAdd)
			{
				return;
			}

			this.restChatUpdate({ addedMemberEntities, deletedMemberEntities })
				.then((result) => {
					if (result !== true)
					{
						return;
					}
					this.showSuccessfullyToast();
					// the repository is not updated by server because we do not save departments in the model
				})
				.catch((error) => logger.log(`${this.constructor.name}.onCloseParticipantSelector.catch:`, error));
		}

		/**
		 * @protected
		 * @desc rest update chat
		 * @param {object} fields
		 * @return {Promise<{result:boolean}>}
		 */
		restChatUpdate(fields)
		{
			return this.chatService.updateService.updateChat(this.dialogId, fields);
		}

		/**
		 * @protected
		 * @desc rest update avatar
		 * @param {string} avatarBase64str
		 * @return {Promise<{result:boolean}>}
		 */
		restAvatarUpdate(avatarBase64str)
		{
			return this.chatService.updateService.updateAvatar(this.dialogId, avatarBase64str);
		}

		/**
		 * @protected
		 * @desc rest update title
		 * @param {string} title
		 * @return {Promise<{result:boolean}>}
		 */
		restTitleUpdate(title)
		{
			return this.chatService.updateService.updateTitle(this.dialogId, title);
		}

		/** @protected */
		showSuccessfullyToast()
		{
			Keyboard.dismiss();

			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_CHAT_COMPOSER_TOAST_SAVE_SUCCESSFULLY'),
				icon: Icon.CIRCLE_CHECK,
			});
		}

		/**
		 * @protected
		 * @return {Promise<memberEntities:Array<*>>}
		 */
		async getCurrentMemberIds()
		{
			return this.restMemberEntitiesList();
		}

		/**
		 * @protected
		 * @return {Array<Object>}
		 */
		buildManagerDataList()
		{
			return UserListBuilder.getBuildManagersDataListByDialogId(this.dialogId);
		}

		/**
		 * @protected
		 * @desc rest get member entity
		 * @return {Promise<memberEntities:Array<*>>}
		 */
		restMemberEntitiesList()
		{
			return this.chatService.loadService.loadChatMemberEntitiesList(this.dialogId);
		}

		/**
		 * @protected
		 * @param {object} fields
		 * @return {Promise}
		 */
		updateDialogModel(fields)
		{
			return this.store.dispatch('dialoguesModel/update', {
				dialogId: this.dialogId,
				fields,
			});
		}

		/**
		 * @protected
		 * @param {object} fields
		 * @return {Promise}
		 */
		updateDialogModelPermissions(fields)
		{
			return this.store.dispatch('dialoguesModel/updatePermissions', {
				dialogId: this.dialogId,
				fields,
			});
		}

		/**
		 * @protected
		 * @param {MutationPayload<DialoguesUpdateData>} payload
		 * @return {boolean}
		 */
		isOwnDialogPayload(payload)
		{
			return this.dialogId === payload.data.dialogId;
		}

		/**
		 * @protected
		 * @desc Handler dialog store update
		 * @param {MutationPayload<DialoguesUpdateData>} payload
		 * @void
		 */
		onUpdateDialogStore({ payload })
		{
			if (!this.isOwnDialogPayload(payload))
			{
				return;
			}

			logger.log(`${this.constructor.name}.onUpdateDialogStore:`, payload);
			if (payload.actionName === 'removeParticipants'
				|| payload.actionName === 'updateManagerList'
				|| (payload.actionName === 'update' && payload.data?.fields?.managerList)
			)
			{
				this.updateManagersViewState();
			}

			if ((payload.actionName === 'updatePermissions' || payload.actionName === 'update')
				&& payload.data?.fields?.permissions)
			{
				this.updateRulesListState(payload.data?.fields?.permissions);
			}

			this.updateGroupChatViewState(payload);
			this.setDialogModel();
			this.setPermissions();
		}

		/**
		 * @protected
		 * @desc managers view - state update
		 * @void
		 */
		updateManagersViewState()
		{
			if (Type.isNil(this.managersView))
			{
				return;
			}

			const users = this.buildManagerDataList();
			this.managersView.setState({ users });
		}

		/**
		 * @protected
		 * @param {DialogPermissions} newPermissions
		 */
		updateRulesListState(newPermissions)
		{
			if (Type.isNil(this.rulesListView))
			{
				return;
			}

			this.rulesListView.setState(newPermissions);
		}

		/**
		 * @protected
		 * @desc main view - state update
		 * @param {MutationPayload<DialoguesUpdateData>} payload
		 * @void
		 */
		updateGroupChatViewState(payload)
		{
			if (Type.isNil(this.mainView))
			{
				return;
			}

			if (payload.actionName === 'updateManagerList')
			{
				const newManagerCounter = payload.data.fields.managerList.length;
				this.mainView.setState({ managerCounter: newManagerCounter });
			}
			const newFields = payload.data.fields;
			if (payload.data.fields?.managerList)
			{
				newFields.managerCounter = payload.data.fields?.managerList?.length;
			}
			const commonFields = this.getCommonFields(newFields, this.mainView.state);

			if (commonFields)
			{
				this.mainView.setState({ ...commonFields, permissions: this.mainView.state.permissions });
			}
		}

		/**
		 * @protected
		 * @desc get common fields by key object
		 * @param {object} obj1
		 * @param {object} obj2
		 * @return {object|null}
		 */
		getCommonFields(obj1, obj2)
		{
			const keys1 = Object.keys(obj1);
			const keys2 = Object.keys(obj2);

			const commonProperties = keys1.filter((key) => keys2.includes(key));
			if (commonProperties.length === 0)
			{
				return null;
			}

			const result = {};
			commonProperties.forEach((key) => {
				result[key] = obj1[key];
			});

			return result;
		}
	}

	module.exports = { UpdateGroupChat };
});
