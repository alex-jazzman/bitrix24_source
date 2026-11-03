/**
 * @module im/messenger/controller/sidebar-v2/controller/collab
 */
jn.define('im/messenger/controller/sidebar-v2/controller/collab', (require, exports, module) => {
	const { SidebarBaseController } = require('im/messenger/controller/sidebar-v2/controller/base');
	const { CollabSidebarView } = require('im/messenger/controller/sidebar-v2/controller/collab/src/view');
	const { CollabSidebarPermissionManager } = require('im/messenger/controller/sidebar-v2/controller/collab/src/permission-manager');
	const { SidebarParticipantsTab } = require('im/messenger/controller/sidebar-v2/tabs/participants');
	const { SidebarMediaTab } = require('im/messenger/controller/sidebar-v2/tabs/media');
	const { SidebarAudioTab } = require('im/messenger/controller/sidebar-v2/tabs/audio');
	const { SidebarLinksTab } = require('im/messenger/controller/sidebar-v2/tabs/links');
	const { Loc } = require('im/messenger/controller/sidebar-v2/loc');
	const { onAddParticipants } = require('im/messenger/controller/sidebar-v2/user-actions/participants');
	const { onDeleteChat, onClearHistoryChat } = require('im/messenger/controller/sidebar-v2/user-actions/chat');
	const { onLeaveChat } = require('im/messenger/controller/sidebar-v2/user-actions/user');
	const {
		SidebarContextMenuActionId,
		SidebarContextMenuActionPosition,
		SIDEBAR_DEFAULT_TOAST_OFFSET,
	} = require('im/messenger/controller/sidebar-v2/const');
	const {
		createSearchButton,
		createMuteButton,
		createAutoDeleteButton,
	} = require('im/messenger/controller/sidebar-v2/ui/primary-button/factory');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { Analytics, CollabEntity, RestMethod, ErrorType } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { Icon } = require('assets/icons');
	const { Haptics } = require('haptics');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');
	const { Color } = require('tokens');
	const { PerfPoint } = require('debug/prism');

	let projectInfoRequestSequence = 0;
	const activeProjectInfoRequests = new Map();

	const isProjectAccessDenied = (rejection) => {
		if (!Array.isArray(rejection))
		{
			return false;
		}

		return rejection.some((error) => error?.code === ErrorType.project.accessDenied);
	};

	const createProjectInfoLoader = ({ dialogId, request, save, hasData = () => false, logger }) => {
		let requestId = null;
		let projectId = null;

		return {
			async load(nextProjectId)
			{
				if (!Type.isNumber(nextProjectId) || nextProjectId <= 0 || nextProjectId === projectId)
				{
					return;
				}

				projectId = nextProjectId;
				// A repeated opening shows the stored fields at once, so the wait is only visible
				// while nothing is stored yet: the two cases cannot share one sample.
				const point = new PerfPoint(
					'IM Project Sidebar Info Load',
					`dialog ${dialogId} ${hasData() ? 'warm' : 'cold'}`,
				).start();
				const currentRequestId = ++projectInfoRequestSequence;
				requestId = currentRequestId;
				activeProjectInfoRequests.set(dialogId, currentRequestId);

				let fields = null;
				let failed = false;
				let accessDenied = false;
				point.startPoint('Server Fetch');
				try
				{
					fields = await request(projectId);
					point.endPoint('Server Fetch', { status: 'ok' });
				}
				catch (error)
				{
					point.endPoint('Server Fetch', { status: 'error' });
					failed = true;
					accessDenied = isProjectAccessDenied(error);
					logger.error('loadProjectInfo', error);
				}

				if (activeProjectInfoRequests.get(dialogId) !== currentRequestId)
				{
					point.end();

					return;
				}

				if (failed)
				{
					if (accessDenied || !hasData())
					{
						await save(null);
					}

					if (!accessDenied && activeProjectInfoRequests.get(dialogId) === currentRequestId)
					{
						projectId = null;
					}

					point.end();

					return;
				}

				point.startPoint('Store Write');
				await save(fields);
				point.endPoint('Store Write', { tags: fields?.tags?.length ?? 0 });
				point.end();
			},
			invalidate()
			{
				if (activeProjectInfoRequests.get(dialogId) === requestId)
				{
					activeProjectInfoRequests.delete(dialogId);
				}
			},
		};
	};

	class CollabSidebarController extends SidebarBaseController
	{
		onWidgetReady()
		{
			this.projectInfoLoader = createProjectInfoLoader({
				dialogId: this.dialogId,
				request: (projectId) => runAction(RestMethod.mobileProjectGetViewInfo, {
					json: { projectId },
				}),
				save: (fields) => this.store.dispatch('sidebarModel/sidebarProjectInfoModel/set', {
					dialogId: this.dialogId,
					fields,
				}),
				hasData: () => this.store.getters['sidebarModel/sidebarProjectInfoModel/hasByDialogId'](this.dialogId),
				logger: this.logger,
			});

			super.onWidgetReady();
		}

		onWidgetClose()
		{
			this.projectInfoLoader?.invalidate();

			super.onWidgetClose();
		}

		bindMethods()
		{
			super.bindMethods();

			this.onUpdateCollabInfo = this.onUpdateCollabInfo.bind(this);
		}

		subscribeStoreEvents()
		{
			super.subscribeStoreEvents();

			this.storeManager.on('dialoguesModel/collabModel/set', this.onUpdateCollabInfo);
			this.storeManager.on('dialoguesModel/collabModel/setEntityCounter', this.onUpdateCollabInfo);
		}

		unsubscribeStoreEvents()
		{
			super.unsubscribeStoreEvents();

			this.storeManager.off('dialoguesModel/collabModel/set', this.onUpdateCollabInfo);
			this.storeManager.off('dialoguesModel/collabModel/setEntityCounter', this.onUpdateCollabInfo);
		}

		onUpdateCollabInfo(mutation)
		{
			const updatedDialogId = mutation?.payload?.data?.dialogId;
			if (this.dialogId === updatedDialogId)
			{
				this.refreshView();
			}
		}

		/**
		 * @return {{
		 *     guestCount: number,
		 *     collabId: number,
		 *     entities: {},
		 * } | undefined }
		 */
		getCollabInfo()
		{
			return this.store.getters['dialoguesModel/collabModel/getByDialogId'](this.dialogId);
		}

		/**
		 * @param {string} entityType
		 * @return {number}
		 */
		getCollabEntityCounter(entityType)
		{
			return this.getCollabInfo()?.entities[entityType]?.counter ?? 0;
		}

		/**
		 * @return {number|undefined}
		 */
		get collabId()
		{
			return this.getCollabInfo()?.collabId;
		}

		get projectOpenParams()
		{
			return {
				projectId: this.collabId,
				hasCollabers: this.dialogHelper?.hasCollaber,
				color: this.dialogHelper?.hasCollaber
					? Color.collabAccentPrimary.toHex()
					: this.dialogHelper?.dialogModel?.color,
			};
		}

		createView(defaultProps)
		{
			return new CollabSidebarView({
				...defaultProps,
				loadProjectInfo: () => this.projectInfoLoader.load(this.collabId),
			});
		}

		createPermissionManager(defaultProps)
		{
			return new CollabSidebarPermissionManager(defaultProps);
		}

		getWidgetTitle()
		{
			return Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_PROJECT_TITLE');
		}

		// region context menu

		getHeaderContextMenuItems()
		{
			const items = [
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
			];

			if (this.#shouldShowCopyProjectLinkItem())
			{
				items.push(this.#getHeaderContextMenuItemCopyProjectLink());
			}

			items.push(...super.getHeaderContextMenuItems());

			return items;
		}

		/**
		 * @return {boolean}
		 */
		#shouldShowCopyProjectLinkItem()
		{
			return this.dialogHelper?.isCollab === true && this.dialogHelper?.isNested === false;
		}

		/**
		 * @return {SidebarContextMenuItem}
		 */
		#getHeaderContextMenuItemCopyProjectLink()
		{
			return {
				id: SidebarContextMenuActionId.COPY_PROJECT_LINK,
				title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_ACTION_COPY_PROJECT_LINK'),
				icon: Icon.COPY,
				testId: 'project-permalink-copy-item',
				sort: SidebarContextMenuActionPosition.MIDDLE,
				onItemSelected: () => this.#handleCopyProjectLinkAction(),
			};
		}

		/**
		 * @return {void}
		 */
		#handleCopyProjectLinkAction()
		{
			const host = serviceLocator.get('core').getHost();
			if (!Type.isStringFilled(host))
			{
				Haptics.notifyWarning();
				this.logger.warn('handleCopyProjectLinkAction: empty host, cannot build absolute link');

				return;
			}

			const link = this.dialogHelper?.chatLink;
			if (!link)
			{
				Haptics.notifyWarning();
				this.logger.error('handleCopyProjectLinkAction: empty chatLink', this.dialogId);

				return;
			}

			DialogTextHelper.copyToClipboard(
				link,
				{
					notificationText: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_COPY_LINK_SUCCESS'),
					notificationIcon: Icon.COPY,
					toastOffset: SIDEBAR_DEFAULT_TOAST_OFFSET,
				},
				true,
			);
			Haptics.notifySuccess();

			this.analyticsService.sendCopyChatLink(this.dialogId, Analytics.SubSection.contextMenu);
		}

		handleDeleteDialogAction()
		{
			onDeleteChat(this.dialogId, {
				onError: (errors) => {
					const message = Array.isArray(errors) && errors.some((error) => error.code === 'TASKS_NOT_EMPTY')
						? Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_PROJECT_DELETE_ERROR_NOT_EMPTY')
						: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_PROJECT_DELETE_ERROR_DEFAULT');

					Notification.showErrorToast({
						message,
						offset: SIDEBAR_DEFAULT_TOAST_OFFSET,
					});
				},
			});
		}

		handleClearHistoryForMeDialogAction()
		{
			onClearHistoryChat({ dialogId: this.dialogId, forAll: false });
		}

		handleClearHistoryForAllDialogAction()
		{
			onClearHistoryChat({ dialogId: this.dialogId, forAll: true });
		}

		async handleEditDialogAction()
		{
			const collabId = this.collabId;

			if (!collabId)
			{
				Haptics.notifyWarning();

				return;
			}

			try
			{
				const { openCollabEdit } = await requireLazy('collab/create');

				await openCollabEdit({
					collabId,
					onUpdate: () => {
						this.analyticsService.sendDialogEditButtonDoneDialogInfoClick(this.dialogId);
					},
				}, this.widget);
				this.analyticsService.sendDialogEditHeaderMenuClick(this.dialogId);
			}
			catch (error)
			{
				this.logger.error('handleEditDialogAction', error);
			}
		}

		handleLeaveDialogAction()
		{
			onLeaveChat(this.dialogId);
		}

		// endregion

		// region primary actions

		/**
		 * @return {SidebarPrimaryActionButton[]}
		 */
		getPrimaryActionButtons()
		{
			const muted = this.dialogHelper.isMuted;

			return [
				{
					id: 'files',
					icon: Icon.FILE,
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_FILES'),
					counter: this.getCollabEntityCounter(CollabEntity.files),
					onClick: () => this.handleOpenFilesAction(),
				},
				{
					id: 'calendar',
					icon: Icon.CALENDAR_WITH_SLOTS,
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_CALENDAR'),
					counter: this.getCollabEntityCounter(CollabEntity.calendar),
					onClick: () => this.handleOpenCalendarAction(),
				},
				{
					id: 'tasks',
					icon: Icon.CIRCLE_CHECK,
					title: Loc.getMessage('IMMOBILE_SIDEBAR_V2_COMMON_BUTTON_TASKS'),
					counter: this.getCollabEntityCounter(CollabEntity.tasks),
					separatorAfter: true,
					onClick: () => this.handleOpenTasksAction(),
				},
				createSearchButton({
					onClick: () => this.handleSearchAction(),
				}),
				createMuteButton({
					onClick: () => this.handleToggleMuteAction(),
					muted,
				}),
				createAutoDeleteButton({
					onClick: (ref) => this.handleToggleAutoDeleteAction(ref),
					selected: this.dialogHelper.isMessagesAutoDeleteDelayEnabled,
				}),
			];
		}

		async handleOpenFilesAction()
		{
			const collabId = this.collabId;

			if (!collabId)
			{
				Haptics.notifyWarning();

				return;
			}

			if (Feature.isNestedChatAvailable)
			{
				await this.#openProjectDisk();

				return;
			}

			try
			{
				const { openCollabFiles } = await requireLazy('disk:opener/collab-files');

				this.analyticsService.sendCollabEntityOpened({
					dialogId: this.dialogId,
					entityType: CollabEntity.files,
				});

				await openCollabFiles({
					collabId,
					onStorageLoadFailure: (response, instance) => {
						instance.parentWidget.back();
					},
				}, this.widget);
			}
			catch (error)
			{
				this.logger.error('handleOpenFilesAction', error);
			}
		}

		async handleOpenCalendarAction()
		{
			const collabId = this.collabId;

			if (!collabId)
			{
				Haptics.notifyWarning();

				return;
			}

			try
			{
				if (Feature.isNestedChatAvailable)
				{
					await this.#openProjectCalendar();

					return;
				}

				const { Entry } = await requireLazy('calendar:entry');

				this.analyticsService.sendCollabEntityOpened({
					dialogId: this.dialogId,
					entityType: CollabEntity.calendar,
				});

				if (Entry)
				{
					void Entry.openGroupCalendarView({
						groupId: collabId,
						layout: this.widget,
					});
				}
			}
			catch (error)
			{
				this.logger.error('handleOpenCalendarAction', error);
			}
		}

		async handleOpenTasksAction()
		{
			const collabId = this.collabId;

			if (!collabId)
			{
				Haptics.notifyWarning();

				return;
			}

			if (Feature.isNestedChatAvailable)
			{
				await this.#openProjectTasks();

				return;
			}

			try
			{
				const { Entry } = await requireLazy('tasks:entry');

				this.analyticsService.sendCollabEntityOpened({
					dialogId: this.dialogId,
					entityType: CollabEntity.tasks,
				});

				void Entry.openTaskList({
					collabId,
				});
			}
			catch (error)
			{
				this.logger.error('handleOpenTasksAction', error);
			}
		}

		// endregion

		// region tabs

		createTabs()
		{
			const props = this.getTabsProps();

			return [
				new SidebarParticipantsTab(props),
				new SidebarMediaTab(props),
				new SidebarLinksTab(props),
				new SidebarAudioTab(props),
			];
		}

		// endregion

		async #openProjectDisk()
		{
			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');

				await ProjectOpener.openDisk(this.projectOpenParams);
			}
			catch (error)
			{
				this.logger.error('openProjectFiles error:', error);

				Notification.showErrorToast();
			}
		}

		async #openProjectTasks()
		{
			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');

				await ProjectOpener.openTasks(this.projectOpenParams);
			}
			catch (error)
			{
				this.logger.error('openProjectFiles error:', error);

				Notification.showErrorToast();
			}
		}

		async #openProjectCalendar()
		{
			try
			{
				const { ProjectOpener } = await requireLazy('project/opener');

				await ProjectOpener.openCalendar(this.projectOpenParams);
			}
			catch (error)
			{
				this.logger.error('openProjectFiles error:', error);

				Notification.showErrorToast();
			}
		}
	}

	module.exports = {
		CollabSidebarController,
		ControllerClass: CollabSidebarController,
		createProjectInfoLoader,
	};
});
