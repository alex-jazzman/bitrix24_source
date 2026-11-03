/**
 * @module im/messenger/controller/recent/controller
 */
jn.define('im/messenger/controller/recent/controller', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { runAction } = require('im/messenger/lib/rest');
	const {
		AppStatus,
		RestMethod,
		RefreshMode,
	} = require('im/messenger/const');
	const { isOnline } = require('device/connection');
	const { Feature } = require('im/messenger/lib/feature');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * Coalescing scopes of the tab startup. They overlap in time, so the render service keeps them
	 * as a set: closing one does not lift the others.
	 */
	const CoalescingScope = Object.freeze({
		tabInit: 'tab-init',
		startupRefresh: 'startup-refresh',
		primarySync: 'primary-sync',
	});

	/**
	 * @class RecentController
	 */
	class RecentController
	{
		#isSubscribedToAppStatus = false;

		/**
		 * Ticket of the refresh handler created last and not yet paired with a request. The refresher
		 * asks for the handler first and for the request options right after, so the options build
		 * writes the filter of its own request into this ticket and the handler carries it further.
		 *
		 * A workaround for a dispatch defect: a refresh handler can be called with the response of
		 * another request, because the initialization event hands one response to every accumulated
		 * subscriber. The ticket and the doubled context build go away with the fix of that defect.
		 *
		 * @type {{context: ServerLoadRequestContext}|null}
		 */
		#pendingRefreshRequest = null;

		/**
		 * @param {RecentLocator} locator
		 */
		constructor(locator)
		{
			/** @type {RecentLocator} */
			this.locator = locator;
			this.id = locator.get('id');

			const loggerContext = `${locator.get('id')} ${this.constructor.name}`;
			this.logger = getLoggerWithContext('recent--controller', loggerContext);
			this.initPromise = Promise.resolve(null);
			this.isActived = false;
			this.resumeMode = null;
		}

		/**
		 * @return {number}
		 */
		getParentChatId()
		{
			return this.locator.get('parentChatId');
		}

		async init(applicationStartUp = false)
		{
			/** @type {PerfPoint} */
			const initPerfPoint = serviceLocator.get('messenger-init-perf-point');
			initPerfPoint?.startPoint('recent-init');
			this.recentInitPerfPoint = new PerfPoint('recent-init', this.id).start();

			this.locator.get('emitter').emit(RecentEventType.onInit, []);
			const { promise, resolve } = createPromiseWithResolvers();
			this.initPromise = promise;

			if (this.locator.has('quick-recent'))
			{
				this.recentInitPerfPoint.startPoint('quick-recent');
				await this.locator.get('quick-recent').renderList();
				this.recentInitPerfPoint.endPoint('quick-recent');
			}

			// the snapshot pass is over, so it stays the first full update; the first page from the
			// local database leaves with the final pass of this scope
			this.#beginCoalescingScope(CoalescingScope.tabInit);

			try
			{
				if (this.locator.has('database-load'))
				{
					try
					{
						this.recentInitPerfPoint.startPoint('database-load');
						await this.locator.get('database-load').loadFirstPage();
						this.recentInitPerfPoint.endPoint('database-load');
					}
					catch (error)
					{
						this.logger.error('init with load first page from db error', error);
						this.recentInitPerfPoint.endPoint('database-load', { error });
					}
				}

				if (!applicationStartUp && this.locator.has('server-load'))
				{
					try
					{
						this.recentInitPerfPoint.startPoint('server-load');
						await this.#loadFirstPageFromServer(RefreshMode.startUp);
						this.recentInitPerfPoint.endPoint('server-load');
					}
					catch (error)
					{
						this.logger.error('init with load first page from server error', error);
						this.recentInitPerfPoint.endPoint('server-load', { error });
					}
				}

				this.markAsActive();
			}
			finally
			{
				this.#endCoalescingScope(CoalescingScope.tabInit);
			}

			initPerfPoint?.endPoint('recent-init');
			this.recentInitPerfPoint.end();
			resolve();
		}

		async resume()
		{
			if (this.isActive())
			{
				return;
			}

			if (Type.isNull(this.resumeMode))
			{
				return;
			}

			if (!this.locator.has('server-load'))
			{
				return;
			}

			this.logger.log('resume');

			try
			{
				this.isActived = true;
				await this.#loadFirstPageFromServer(this.resumeMode);
			}
			catch (error)
			{
				this.logger.error('resume error', error);
			}
		}

		isActive()
		{
			return this.isActived;
		}

		markAsInactive(mode = RefreshMode.resume)
		{
			if (this.locator.has('database-load'))
			{
				return;
			}
			this.logger.log('mark recent is inactive', this.id);

			this.isActived = false;
			this.resumeMode = mode;
		}

		markAsActive()
		{
			this.isActived = true;
			this.resumeMode = null;
		}

		/**
		 * @desc Called on every return to an already-initialized tab. Does not re-render the
		 * empty-state; only re-checks the empty condition and fires its onActivatedWhenEmpty
		 * callback (e.g. copilot draft auto-open). Deferred until initPromise resolves so the
		 * empty check does not race a still-in-flight first init (db/server load) and auto-open
		 * a draft over a list that is only temporarily empty.
		 */
		reactivate()
		{
			void this.initPromise.then(() => {
				if (this.locator.has('empty-state'))
				{
					this.locator.get('empty-state').notifyActivatedWhenEmpty();
				}
			});
		}

		destroy()
		{
			this.logger.log('destroy');

			// the controller itself is not registered in the subscription manager, and folder and
			// nested project tabs are created and destroyed: a left handler would close the scope
			// of an already destroyed service
			this.#endPrimarySyncScope();

			const subscriptionManager = serviceLocator.get('subscription-manager');
			this.locator.forEach((service) => {
				subscriptionManager.remove(service);
			});

			this.locator.clear();
			this.isActived = false;
			this.resumeMode = null;
		}

		openSearch()
		{
			if (this.locator.has('search'))
			{
				this.locator.get('search').openSearch();
			}
		}

		/**
		 * @returns {boolean}
		 */
		isSupportedFilter()
		{
			return this.locator.has('filter');
		}

		/**
		 * @param {string} filterId
		 * @returns {Promise<void>}
		 */
		async applyFilter(filterId)
		{
			if (this.isSupportedFilter())
			{
				await this.locator.get('filter').applyFilter(filterId, { bySelf: true });

				if (isOnline())
				{
					await this.#loadFirstPageFromServer(RefreshMode.startUp);
				}
			}
		}

		/**
		 * @return {boolean}
		 */
		hasSelectedFilter()
		{
			if (this.isSupportedFilter())
			{
				return this.locator.get('filter').hasSelectedFilter();
			}

			return false;
		}

		/**
		 * @returns {Promise<void>}
		 */
		async resetFilter()
		{
			if (this.isSupportedFilter())
			{
				await this.locator.get('filter').resetFilter({ bySelf: true });

				if (isOnline())
				{
					await this.#loadFirstPageFromServer(RefreshMode.startUp);
				}
			}
		}

		/**
		 * @returns {string}
		 */
		getCurrentFilterId()
		{
			return this.locator.get('filter')?.getCurrentFilterId();
		}

		/**
		 * @param {string} mode
		 * @return {null|string}
		 */
		getRefreshMethod(mode)
		{
			if (this.locator.has('server-load'))
			{
				return this.locator.get('server-load').getInitRequestMethod(mode);
			}

			return null;
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {object}
		 */
		getRefreshOptions(mode)
		{
			if (!this.locator.has('server-load'))
			{
				return {};
			}

			const requestContext = this.#buildInitRequestContext();
			if (this.#pendingRefreshRequest)
			{
				this.#pendingRefreshRequest.context = requestContext;
				this.#pendingRefreshRequest = null;
			}

			return this.locator.get('server-load').getInitRequestOptions(mode, requestContext);
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {(function(*): Promise<void>)}
		 */
		getRefreshHandler(mode)
		{
			// the refresher asks for this handler and builds the request options in the same synchronous
			// step, so the ticket belongs to one request: the options build writes the filter that
			// request carries into it, and the response below is processed with that filter.
			// The context built here is the fallback of that workaround, see #pendingRefreshRequest
			const refreshRequest = { context: this.#buildInitRequestContext() };
			this.#pendingRefreshRequest = refreshRequest;

			return async (refreshResult) => {
				const refreshPerfPoint = new PerfPoint('recent-refresh', `${this.id} ${mode}`).start();
				const isStartUp = mode === RefreshMode.startUp;

				// raised in the handler and not in the factory: the factory runs before the bootstrap
				// request, and on its failure the handler never runs - the scope would stay ownerless
				if (isStartUp)
				{
					this.#beginCoalescingScope(CoalescingScope.startupRefresh);
					this.#beginPrimarySyncScope();
				}

				try
				{
					await this.initPromise;

					// on start up the first page is already read by init()
					if (mode !== RefreshMode.startUp && this.locator.has('database-load'))
					{
						try
						{
							refreshPerfPoint.startPoint('database-load');
							await this.locator.get('database-load').loadFirstPage();
							refreshPerfPoint.endPoint('database-load');
						}
						catch (error)
						{
							this.logger.error(`refresh database-load.loadFirstPage error`, error);
							refreshPerfPoint.endPoint('database-load', { error: error?.message });
						}
					}

					if (this.locator.has('server-load'))
					{
						try
						{
							refreshPerfPoint.startPoint('server-load');
							if (mode === RefreshMode.startUp)
							{
								this.#afterFirstServerPageLoad();
							}

							const serverLoad = this.locator.get('server-load');
							serverLoad.bindInitResultContext?.(refreshResult, refreshRequest.context);
							await serverLoad.handleInitResult(mode, refreshResult);
							refreshPerfPoint.endPoint('server-load');
						}
						catch (error)
						{
							this.logger.error(`refresh by mode ${mode} error`, error);
							refreshPerfPoint.endPoint('server-load', { error: error?.message });
						}
					}

					this.markAsActive();
				}
				finally
				{
					if (isStartUp)
					{
						this.#endCoalescingScope(CoalescingScope.startupRefresh);
					}
					refreshPerfPoint.end();
				}
			};
		}

		// region coalescing scopes

		/**
		 * @param {string} scopeId
		 */
		#beginCoalescingScope(scopeId)
		{
			this.locator.get('render')?.beginCoalescingScope(scopeId);
		}

		/**
		 * @param {string} scopeId
		 */
		#endCoalescingScope(scopeId)
		{
			this.locator.get('render')?.endCoalescingScope(scopeId);
		}

		/**
		 * @desc The scope of the primary synchronization is not raised at all when there will be no
		 * synchronization status to close it by: the local storage is disabled, or a background
		 * synchronization is already running and its status carries another name. In both cases the
		 * order is held by the refresh scope.
		 */
		#beginPrimarySyncScope()
		{
			if (!Feature.isLocalStorageEnabled || this.#isBackgroundSyncInProgress())
			{
				return;
			}

			this.#beginCoalescingScope(CoalescingScope.primarySync);
			this.#subscribeAppStatusMutation();

			// safety net on the subscription race: nothing will signal the end if the startup is over
			if (serviceLocator.get('core').getAppStatus() === AppStatus.running)
			{
				this.#endPrimarySyncScope();
			}
		}

		#endPrimarySyncScope()
		{
			this.#unsubscribeAppStatusMutation();
			this.#endCoalescingScope(CoalescingScope.primarySync);
		}

		/**
		 * @param {MutationPayload<ApplicationSetStatusData, ApplicationSetStatusActions>} payload
		 */
		#appStatusChangeHandler = ({ payload }) => {
			const status = payload?.data?.status;
			if (status?.name !== AppStatus.sync || status?.value !== false)
			{
				return;
			}

			this.logger.log('primary synchronization is over, closing the coalescing scope');
			this.#endPrimarySyncScope();
		};

		#subscribeAppStatusMutation()
		{
			if (this.#isSubscribedToAppStatus)
			{
				return;
			}

			this.#isSubscribedToAppStatus = true;
			serviceLocator.get('core').getStoreManager()
				.on('applicationModel/setStatus', this.#appStatusChangeHandler)
			;
		}

		#unsubscribeAppStatusMutation()
		{
			if (!this.#isSubscribedToAppStatus)
			{
				return;
			}

			this.#isSubscribedToAppStatus = false;
			serviceLocator.get('core').getStoreManager()
				.off('applicationModel/setStatus', this.#appStatusChangeHandler)
			;
		}

		/**
		 * @return {boolean}
		 */
		#isBackgroundSyncInProgress()
		{
			const syncService = serviceLocator.get('sync-service');

			return syncService?.syncInProgress === true && syncService?.appStatus === AppStatus.backgroundSync;
		}

		// endregion coalescing scopes
		/**
		 * Requests the first page from the server again the same way the initial load does.
		 * The reason to start the list over belongs to the caller; without a connection nothing
		 * happens and no error is raised. The caller may hold the controller of a tab that is
		 * still starting up, so the initial load is awaited first and goes uncrossed.
		 *
		 * @returns {Promise<void>}
		 */
		async reloadFirstPage()
		{
			await this.initPromise;

			if (!this.locator.has('server-load'))
			{
				return;
			}

			if (isOnline())
			{
				await this.#loadFirstPageFromServer(RefreshMode.startUp);
			}
		}

		async #loadFirstPageFromServer(mode)
		{
			try
			{
				const method = this.locator.get('server-load').getInitRequestMethod(mode);

				if (Type.isNull(method))
				{
					await this.locator.get('server-load').loadFirstPage?.();
					if (mode === RefreshMode.startUp)
					{
						this.#afterFirstServerPageLoad();
					}

					return;
				}

				const requestContext = this.#buildInitRequestContext();
				const options = this.locator.get('server-load').getInitRequestOptions(mode, requestContext);
				const result = await runAction(RestMethod.immobileMessengerLoad, {
					data: {
						methodList: [method],
						options,
					},
				});

				if (mode === RefreshMode.startUp)
				{
					this.#afterFirstServerPageLoad();
				}

				this.locator.get('server-load').bindInitResultContext?.(result, requestContext);
				await this.locator.get('server-load').handleInitResult(mode, result);
			}
			catch (error)
			{
				this.logger.error('loadFirstPageFromServer error', error);
			}
		}

		#afterFirstServerPageLoad()
		{
			this.locator.get('render').executeAfterRender(() => {
				const emptyState = this.locator.get('empty-state');
				const floatingButton = this.locator.get('floating-button');

				emptyState?.subscribeEvents();
				floatingButton?.subscribeEvents();

				emptyState?.redraw();
				emptyState?.notifyActivatedWhenEmpty();
				floatingButton?.redraw();

				if (this.locator.has('invite-banner'))
				{
					const inviteBanner = this.locator.get('invite-banner');
					inviteBanner.subscribeEvents();
					inviteBanner.redraw();
				}
			});
		}

		/**
		 * The filter a request goes out with belongs to that request: the response is handed over bound
		 * to this context, so a filter switched while the request flew is never read as the filter of
		 * the page it brings back.
		 *
		 * @return {ServerLoadRequestContext}
		 */
		#buildInitRequestContext()
		{
			return { currentFilterId: this.locator.get('filter')?.getCurrentFilterId() };
		}
	}

	module.exports = { RecentController };
});
