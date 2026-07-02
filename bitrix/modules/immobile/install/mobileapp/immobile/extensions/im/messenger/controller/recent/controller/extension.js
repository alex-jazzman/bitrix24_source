/**
 * @module im/messenger/controller/recent/controller
 */
jn.define('im/messenger/controller/recent/controller', (require, exports, module) => {
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { createPromiseWithResolvers } = require('im/messenger/lib/utils');
	const { runAction } = require('im/messenger/lib/rest');
	const {
		RestMethod,
		RefreshMode,
		RecentFilterId,
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
			this.locator.get('emitter').emit(RecentEventType.onInit, []);
			const { promise, resolve } = createPromiseWithResolvers();
			this.initPromise = promise;

			if (this.locator.has('quick-recent'))
			{
				await this.locator.get('quick-recent').renderList();
			}

			if (this.locator.has('database-load'))
			{
				try
				{
					await this.locator.get('database-load').loadFirstPage();
				}
				catch (error)
				{
					this.logger.error('init with load first page from db error', error);
				}
			}

			if (!applicationStartUp && this.locator.has('server-load'))
			{
				try
				{
					await this.#loadFirstPageFromServer(RefreshMode.startUp);
				}
				catch (error)
				{
					this.logger.error('init with load first page from server error', error);
				}
			}

			this.markAsActive();

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
		 * @parsm {string} filterId
		 * @returns {Promise<void>}
		 */
		async applyFilter(filterId)
		{
			if (this.isSupportedFilter())
			{
				this.locator.get('filter').applyFilter(filterId);

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
			const currentServerLoadOptions = this.locator.get('server-load').getInitRequestOptions(mode);
			const options = {
				...currentServerLoadOptions,
			};

			if (currentFilterId === RecentFilterId.unread)
			{
				options.unreadOnly = 'Y';
			}

			return options;
		}
	}

	module.exports = { RecentController };
});
