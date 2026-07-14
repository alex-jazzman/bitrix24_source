/**
 * @module im/messenger/application/messenger
 */
jn.define('im/messenger/application/messenger', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { RestMethod } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerInitService } = require('im/messenger/provider/services/messenger-init');
	const { ChatAssets } = require('im/messenger/controller/dialog/lib/assets');
	const { SidebarLazyFactory } = require('im/messenger/controller/sidebar-v2/factory');
	const { QueueService } = require('im/messenger/provider/services/queue');
	const { ConnectionService } = require('im/messenger/provider/services/connection');
	const { SendingService } = require('im/messenger/provider/services/sending');
	const { SyncService } = require('im/messenger/provider/services/sync');
	const { ReadMessageService } = require('im/messenger/provider/services/read');
	const { CallManager } = require('im/messenger/lib/integration/callmobile/call-manager');
	const { Communication } = require('im/messenger/lib/integration/mobile/communication');
	const { Promotion, PromotionTriggerManager } = require('im/messenger/lib/promotion');
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');
	const { Anchors } = require('im/messenger/lib/anchors');
	const { CopilotManager } = require('im/messenger/lib/copilot');
	const { Feature } = require('im/messenger/lib/feature');

	const { MessengerCore } = require('im/messenger/core/messenger');
	const { MessengerHeaderManager } = require('im/messenger/controller/messenger-header');
	const { NavigationManager } = require('im/messenger/controller/navigation');
	const { PullHandlerLauncher } = require('im/messenger/application/lib/pull-handler-launcher');
	const { RevisionChecker } = require('im/messenger/application/lib/revision-checker');
	const { waitViewLoaded } = require('im/messenger/lib/wait-view-loaded');
	const { Refresher } = require('im/messenger/application/lib/refresher');
	const { PlanLimitsUpdater } = require('im/messenger/application/lib/plan-limits-updater');
	const { DialogManager } = require('im/messenger/application/lib/dialog-manager');
	const { PushManager } = require('im/messenger/application/lib/push-manager');
	const { StoreEventHandler } = require('im/messenger/application/lib/event-handler/store');
	const { ExternalEventHandler } = require('im/messenger/application/lib/event-handler/external');
	const { MessengerEventHandler } = require('im/messenger/application/lib/event-handler/messenger');
	const { ChannelPullWatchManager } = require('im/messenger/application/lib/channel-pull-watch-manager');
	const { FolderLauncher } = require('im/messenger/application/lib/folder-launcher');
	const { initializeCountersUpdateSystem } = require('im/messenger/application/lib/counters-update-system');
	const { RecentManager } = require('im/messenger/controller/recent/manager');
	const { DialogCreator } = require('im/messenger/controller/dialog-creator');
	const { TabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { MessengerIconLoader } = require('im/messenger/assets/icon');
	const { MessageQueueRequestManager } = require('im/messenger/application/lib/message-queue-request-manager');
	const { showUpdateAppScreenIfNeeded } = require('im/messenger/application/lib/update-notifier');

	const mobileRevision = 25; // sync with im/lib/revision.php. TODO: move value to some config?

	/**
	 * @class Messenger
	 */
	class Messenger
	{
		constructor()
		{
			this.logger = getLoggerWithContext('messenger--application', this);
			this.logger.log('constructor');
			/** @type {MessengerLocator} */
			this.serviceLocator = serviceLocator;
			/** @type {SubscriptionManager} */
			this.subscriptionManager = serviceLocator.get('subscription-manager');
		}

		destructor()
		{
			this.logger.log('destructor');

			try
			{
				const removeAllResult = this.subscriptionManager.removeAll();
				this.serviceLocator.clear();
				this.logger.log('destructor: remove handlers result', removeAllResult);

				this.logger.warn('Messenger: Garbage collection after refresh complete');
			}
			catch (error)
			{
				this.logger.error('destructor error!', error);
			}
		}

		async init()
		{
			this.logger.log('init');

			await this.initBeforeViewLoaded();
			await waitViewLoaded();
			await this.initAfterViewLoaded();

			await this.refresher.refreshOnStartup();

			this.logger.log('init complete');
		}

		async initBeforeViewLoaded()
		{
			this.logger.log('initBeforeViewLoaded');

			try
			{
				await this.initCore();
				await this.initCountersUpdateSystem();
				await this.initFolderLauncher();
				this.initPushManager();
				await this.pushManager.fillDatabaseFromPush();
				this.initServices();
				this.initNavigationManager();
				this.initRevisionChecker();
				this.initPlanLimitsUpdater();
				this.initRefresher();
				await this.initCurrentUser();
				await this.initQueueRequests();
				await this.initCopilotUser();
			}
			catch (error)
			{
				this.logger.error('initBeforeViewLoaded error:', error);
			}

			this.logger.log('initBeforeViewLoaded complete');
		}

		async initAfterViewLoaded()
		{
			this.logger.log('initAfterViewLoaded');

			try
			{
				await this.initComponents();
				this.subscribeEvents();
				this.initPullHandlers();
				this.connectionService.updateStatus();
				void this.pushManager.executeStoredPullEvents();
				this.initManagers();
				this.preloadAssets();
				showUpdateAppScreenIfNeeded();
				this.showPromo();
			}
			catch (error)
			{
				this.logger.error('initAfterViewLoaded error:', error);
			}

			this.logger.log('initAfterViewLoaded complete');
		}

		async initCore()
		{
			/**
			 * @type {CoreApplication}
			 */
			this.core = new MessengerCore({
				localStorage: {
					enable: true,
					readOnly: false,
				},
			});

			try
			{
				await this.core.init();
			}
			catch (error)
			{
				this.logger.error('initCore error: ', error);

				throw error;
			}
			serviceLocator.add('core', this.core);

			this.repository = this.core.getRepository();

			/**
			 * @type {MessengerCoreStore}
			 */
			this.store = this.core.getStore();

			/**
			 * @type {MessengerCoreStoreManager}
			 */
			this.storeManager = this.core.getStoreManager();
		}

		initServices()
		{
			this.chatInitService = new MessengerInitService({ actionName: RestMethod.immobileMessengerLoad });
			serviceLocator.add('messenger-init-service', this.chatInitService);
			this.subscriptionManager.register(this.chatInitService);

			this.folderLauncher.subscribeInitResult();

			this.tabCounters = new TabCounters();
			serviceLocator.add('tab-counters', this.tabCounters);
			this.subscriptionManager.register(this.tabCounters);

			this.connectionService = new ConnectionService();
			serviceLocator.add('connection-service', this.connectionService);
			this.subscriptionManager.register(this.connectionService);

			this.syncService = new SyncService();
			serviceLocator.add('sync-service', this.syncService);
			this.subscriptionManager.register(this.syncService);

			this.sendingService = new SendingService();
			serviceLocator.add('sending-service', this.sendingService);
			this.subscriptionManager.register(this.sendingService);

			this.queueService = new QueueService();
			serviceLocator.add('queue-service', this.queueService);

			this.readMessageService = new ReadMessageService();
			serviceLocator.add('read-service', this.readMessageService);

			this.channelPullWatchManager = new ChannelPullWatchManager();
			serviceLocator.add('channel-pull-watch-manager', this.channelPullWatchManager);
			this.subscriptionManager.register(this.channelPullWatchManager);

			this.recentManager = new RecentManager();
			serviceLocator.add('recent-manager', this.recentManager);
		}

		initNavigationManager()
		{
			this.navigationManager = new NavigationManager();
			serviceLocator.add('navigation-manager', this.navigationManager);
			this.subscriptionManager.register(this.navigationManager);
		}

		initRevisionChecker()
		{
			this.revisionChecker = new RevisionChecker(mobileRevision);
			this.revisionChecker.subscribeInitMessengerEvent();
		}

		initPlanLimitsUpdater()
		{
			this.planLimitsUpdater = new PlanLimitsUpdater();
			this.planLimitsUpdater.subscribeInitMessengerEvent();
		}

		initRefresher()
		{
			this.refresher = Refresher.getInstance();
			serviceLocator.add('refresher', this.refresher);
		}

		async initCountersUpdateSystem()
		{
			this.countersUpdateSystem = initializeCountersUpdateSystem(this.core);
			serviceLocator.add('counters-update-system', this.countersUpdateSystem);

			await this.countersUpdateSystem.restoreCounters();
		}

		async initFolderLauncher()
		{
			this.folderLauncher = new FolderLauncher();
			await this.folderLauncher.restoreModel();
		}


		initPushManager()
		{
			this.pushManager = new PushManager();

			serviceLocator.add('push-manager', this.pushManager);
		}

		async initCurrentUser()
		{
			const currentUser = await this.core.getRepository().user.userTable.getById(this.core.getUserId());
			if (currentUser)
			{
				await this.store.dispatch('usersModel/setFromLocalDatabase', [currentUser]);
			}
		}

		async initQueueRequests()
		{
			await MessageQueueRequestManager.getInstance().initQueueRequests();
		}

		async initCopilotUser()
		{
			await CopilotManager.fillStore();
		}

		initManagers()
		{
			this.visibilityManager = VisibilityManager.getInstance();
			this.callManager = CallManager.getInstance();
			this.callManager.subscribeMessengerInitEvent();

			this.promotion = new Promotion();
			serviceLocator.add('promotion', this.promotion);
			this.subscriptionManager.register(this.promotion);

			this.promotionTriggerManager = new PromotionTriggerManager();
			this.subscriptionManager.register(this.promotionTriggerManager);

			this.communication = new Communication();
			this.anchors = new Anchors();

			this.dialogManager = new DialogManager();
			serviceLocator.add('dialog-manager', this.dialogManager);
		}

		preloadAssets()
		{
			(new ChatAssets()).preloadAssets();
			SidebarLazyFactory.preload();
			MessengerIconLoader.preload();
		}

		async initComponents()
		{
			this.headerManager = new MessengerHeaderManager();
			this.headerManager.initGlobalController(window.tabs);
			serviceLocator.add('messenger-header-manager', this.headerManager);

			this.navigationManager.initGlobalController(window.tabs);
			this.subscriptionManager.register(this.navigationManager);

			this.dialogCreator = new DialogCreator();
			serviceLocator.add('dialog-creator', this.dialogCreator);

			const currentTabId = await this.navigationManager.getActiveTab();
			this.headerManager.redrawRightButtonsIfNeeded(currentTabId);
			this.tabCounters.update();
		}

		initPullHandlers()
		{
			this.pullHandlerLauncher = new PullHandlerLauncher();
			this.pullHandlerLauncher.subscribeEvents();

			this.subscriptionManager.register(this.pullHandlerLauncher);
		}

		subscribeEvents()
		{
			this.storeEventHandler = new StoreEventHandler();
			this.messengerEventHandler = new MessengerEventHandler();
			this.externalEventHandler = new ExternalEventHandler();

			this.storeEventHandler.subscribeEvents();
			this.messengerEventHandler.subscribeEvents();
			this.externalEventHandler.subscribeEvents();

			this.subscriptionManager.register(this.storeEventHandler);
			this.subscriptionManager.register(this.messengerEventHandler);
			this.subscriptionManager.register(this.externalEventHandler);
		}

		showPromo()
		{
			if (Feature.isTasksRecentListAvailable)
			{
				this.promotionTriggerManager.setTabTasksTrigger();
			}
		}

		/* region debug getters */

		/**
		 * @description dialog object reference for debugging purposes only.
		 * @private
		 * @return {Dialog|null}
		 */
		get dialog()
		{
			return serviceLocator.get('dialog-manager')?.getLastOpenDialog() ?? null;
		}

		/**
		 * @description recent manager object reference for debugging purposes only.
		 * @private
		 * @return {RecentManager|null}
		 */
		get recent()
		{
			return serviceLocator.get('recent-manager')?.getActiveRecent() ?? null;
		}

		/**
		 * @description recent array item list reference for debugging purposes only.
		 * @private
		 * @return {Array<RecentItem>|null}
		 */
		get recentList()
		{
			return serviceLocator.get('recent-manager')?.getActiveRecent()?.locator.get('render')?.getItemList() ?? null;
		}

		/* endregion */
	}

	module.exports = { Messenger };
});
