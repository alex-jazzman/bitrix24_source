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
		RestMethod,
		RefreshMode,
	} = require('im/messenger/const');
	const { isOnline } = require('device/connection');
	const { RecentEventType } = require('im/messenger/controller/recent/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class RecentController
	 */
	class RecentController
	{
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
				await this.locator.get('filter').applyFilter(filterId);

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
				await this.locator.get('filter').resetFilter();

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

			return this.#getRequestOptions(mode);
		}

		/**
		 * @param {RefreshModeType} mode
		 * @return {(function(*): Promise<void>)}
		 */
		getRefreshHandler(mode)
		{
			return async (refreshResult) => {
				await this.initPromise;

				if (this.locator.has('database-load'))
				{
					try
					{
						await this.locator.get('database-load').loadFirstPage();
					}
					catch (error)
					{
						this.logger.error(`refresh database-load.loadFirstPage error`, error);
					}
				}

				if (this.locator.has('server-load'))
				{
					try
					{
						if (mode === RefreshMode.startUp)
						{
							this.#afterFirstServerPageLoad();
						}

						await this.locator.get('server-load').handleInitResult(mode, refreshResult);
					}
					catch (error)
					{
						this.logger.error(`refresh by mode ${mode} error`, error);
					}
				}

				this.markAsActive();
			};
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

				const options = this.#getRequestOptions(mode);
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

		#getRequestOptions(mode)
		{
			const currentFilterId = this.locator.get('filter')?.getCurrentFilterId();

			return this.locator.get('server-load').getInitRequestOptions(mode, { currentFilterId });
		}
	}

	module.exports = { RecentController };
});
