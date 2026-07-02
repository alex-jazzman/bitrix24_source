/**
 * @module im/messenger/application/lib/channel-pull-watch-manager
 */
jn.define('im/messenger/application/lib/channel-pull-watch-manager', (require, exports, module) => {
	const { Type } = require('type');
	const {
		RestMethod,
		EventType,
		NavigationTabId,
		ROOT_PARENT_CHAT_ID,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { runAction } = require('im/messenger/lib/rest');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('pull--channel-watch-manager', 'PullWatchManager');

	/**
	 * @implements {Unsubscribable}
	 * @class ChannelPullWatchManager
	 */
	class ChannelPullWatchManager
	{
		/**
		 * @returns {NavigationManager|null}
		 */
		get navigationManager()
		{
			return serviceLocator.get('navigation-manager') ?? null;
		}

		get emitter()
		{
			return serviceLocator.get('emitter');
		}

		constructor()
		{
			this.timerId = null;
			/** @type {RecentController} */
			this.controller = null;

			this.subscribeEvents();
		}

		subscribeEvents()
		{
			this.emitter.on(EventType.recentManager.initController, this.initRecentControllerHandler);
			this.emitter.on(EventType.recentManager.resumeController, this.resumeRecentControllerHandler);
		}

		unsubscribeEvents()
		{
			this.emitter.off(EventType.recentManager.initController, this.initRecentControllerHandler);
			this.emitter.off(EventType.recentManager.resumeController, this.resumeRecentControllerHandler);
			this.#clearInterval();
		}

		initRecentControllerHandler = (recentId, controller, parentChatId) => {
			if (recentId !== NavigationTabId.channel || parentChatId !== ROOT_PARENT_CHAT_ID)
			{
				return;
			}
			logger.log('initRecentControllerHandler: extendPullWatch');
			this.controller = controller;

			this.extendPullWatch(false)
				.catch((error) => {
					logger.error('initRecentControllerHandler error', error);
				});
		};

		resumeRecentControllerHandler = (recentId, controller, parentChatId) => {
			if (recentId !== NavigationTabId.channel || parentChatId !== ROOT_PARENT_CHAT_ID)
			{
				return;
			}
			logger.log('resumeRecentControllerHandler: extendPullWatch');

			this.extendPullWatch(false)
				.catch((error) => {
					logger.error('resumeRecentControllerHandler error', error);
				});
		};

		async extendPullWatch(checkActiveTab = false)
		{
			if (checkActiveTab)
			{
				const isCurrentTabChannel = await this.#isTabChannelActive();

				if (!isCurrentTabChannel)
				{
					this.controller.markAsInactive();
					this.#clearInterval();

					return;
				}
			}

			try
			{
				await this.#extendWatch();
			}
			catch (error)
			{
				logger.error('extendPullWatch error', error);
				this.#clearInterval();
			}

			this.#setWatchTimer();
		}

		async #isTabChannelActive()
		{
			if (Type.isNull(this.navigationManager))
			{
				return false;
			}

			const isMessengerActive = await this.navigationManager.isMessengerTabActive();
			const activeTab = await this.navigationManager.getActiveTab();

			return isMessengerActive && activeTab === NavigationTabId.channel;
		}

		#setWatchTimer()
		{
			if (this.timerId)
			{
				return;
			}

			this.timerId = setInterval(() => this.extendPullWatch(), 600_000);
		}

		#clearInterval()
		{
			clearInterval(this.timerId);
			this.timerId = null;
		}

		async #extendWatch()
		{
			return runAction(RestMethod.imV2RecentChannelExtendPullWatch, {
				data: {},
			});
		}
	}

	module.exports = { ChannelPullWatchManager };
});
