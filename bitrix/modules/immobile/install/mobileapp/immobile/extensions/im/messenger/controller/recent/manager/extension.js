/**
 * @module im/messenger/controller/recent/manager
 */
jn.define('im/messenger/controller/recent/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { EventType, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');

	const { RecentUiGetter } = require('im/messenger/controller/recent/recent-ui-getter');
	const { RecentConfigurator } = require('im/messenger/controller/recent/configurator');
	const { RecentConfig, NestedRecentConfig, resolveFolderConfig } = require('im/messenger/controller/recent/config');
	const { createLocator } = require('im/messenger/controller/recent/locator');
	const { waitViewLoaded } = require('im/messenger/lib/wait-view-loaded');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('recent--manager', 'RecentManager');

	/**
	 * @class RecentManager
	 */
	class RecentManager
	{
		#recentGetter = null;
		/** @type {Map<string, Map<string, RecentController>>} */
		#nestedControllersMap = new Map();
		/** @type {string|null} sessionId of the currently active nested navigation, null for global tabs */
		currentNestedSessionId = null;
		/** @type {string|null} recentId of the last active tab within the current nested navigation */
		currentNestedRecentId = null;

		constructor()
		{
			this.initializedLists = new Set();
			/** @type {string} */
			this.currentListId = MessengerParams.get('FIRST_TAB_ID', 'chats');
			/** @type {Map<string, RecentController>} */
			this.controllerCollection = new Map();

			this.setActiveRecent(this.currentListId, true);
		}

		/**
		 * @return {RecentUiGetter}
		 */
		get recentGetter()
		{
			this.#recentGetter = this.#recentGetter ?? new RecentUiGetter();

			return this.#recentGetter;
		}

		/**
		 * Returns the currently visible recent controller — nested if one is open, global otherwise.
		 * @return {RecentController}
		 */
		getActiveRecent()
		{
			return this.getActiveNestedRecent() ?? this.getActiveGlobalRecent();
		}

		/**
		 * @return {RecentController}
		 */
		getActiveGlobalRecent()
		{
			return this.controllerCollection.get(this.currentListId);
		}

		/**
		 * @param {string} recentId
		 * @return {RecentController|undefined}
		 */
		getRecentById(recentId)
		{
			return this.controllerCollection.get(recentId);
		}

		/**
		 * @return {string}
		 */
		getActiveRecentId()
		{
			return this.getActiveRecent().id;
		}

		setActiveRecent(recentId, applicationStartUp = false)
		{
			logger.warn(`setActiveRecent: ${recentId}; applicationStartUp: ${applicationStartUp}`);
			this.currentNestedSessionId = null;
			this.currentNestedRecentId = null;

			if (!this.initializedLists.has(recentId))
			{
				const controller = this.#initController(recentId, applicationStartUp);

				this.emit(EventType.recentManager.initController, recentId, controller, ROOT_PARENT_CHAT_ID);

				return controller;
			}

			const controller = this.#resumeController(recentId);

			this.emit(EventType.recentManager.resumeController, recentId, controller, ROOT_PARENT_CHAT_ID);

			return controller;
		}

		/**
		 * Initializes a recent list controller for a nested navigation widget.
		 * Used instead of setActiveRecent when the UI comes from PageManager.openWidget
		 * rather than the global tabs.
		 *
		 * Controllers are stored in a per-session map (#nestedControllersMap) rather than
		 * the shared controllerCollection, so concurrent nested navigations with identical
		 * tab IDs do not overwrite each other's controllers.
		 *
		 * @param {string} recentId
		 * @param {object} widget       — tabs widget returned by PageManager.openWidget
		 * @param {number} parentChatId — chatId of the parent collab chat
		 * @param {string} sessionId    — UUID that identifies this particular open session
		 * @returns {RecentController}
		 */
		initControllerForWidget(recentId, widget, parentChatId, sessionId)
		{
			logger.warn(`initControllerForWidget: ${recentId} session: ${sessionId}`);

			this.currentNestedSessionId = sessionId;
			this.currentNestedRecentId = recentId;

			if (!this.#nestedControllersMap.has(sessionId))
			{
				this.#nestedControllersMap.set(sessionId, new Map());
			}

			const existingController = this.#nestedControllersMap.get(sessionId).get(recentId);
			if (existingController)
			{
				logger.warn(`initControllerForWidget: controller ${recentId} already exists for session ${sessionId}, resuming`);

				return this.resumeNestedController(recentId, sessionId, parentChatId);
			}

			const uiPromise = Promise.resolve(widget.nestedWidgets?.()?.[recentId] ?? null);
			const controller = this.#createNestedController(recentId, uiPromise, parentChatId);

			this.#nestedControllersMap.get(sessionId).set(recentId, controller);

			controller.init(false)
				.catch((error) => {
					logger.error(`initControllerForWidget: controller ${recentId} init error`, error);
				})
			;

			this.emit(EventType.recentManager.initController, recentId, controller, parentChatId);

			return controller;
		}

		/**
		 * Returns a nested controller by recentId within the given session.
		 * @param {string} recentId
		 * @param {string} sessionId
		 * @returns {RecentController|null}
		 */
		getControllerById(recentId, sessionId)
		{
			return this.#nestedControllersMap.get(sessionId)?.get(recentId) ?? null;
		}

		/**
		 * Returns the controller of the currently active tab in the topmost nested navigation.
		 * Analogous to getActiveRecent() for global tabs.
		 * @returns {RecentController|null}
		 */
		getActiveNestedRecent()
		{
			if (!this.currentNestedSessionId || !this.currentNestedRecentId)
			{
				return null;
			}

			return this.getControllerById(this.currentNestedRecentId, this.currentNestedSessionId);
		}

		/**
		 * Resumes a nested controller by recentId and sessionId.
		 * Emits resumeController event for external subscribers.
		 *
		 * @param {string} recentId
		 * @param {string} sessionId
		 * @param {number} parentChatId
		 */
		resumeNestedController(recentId, sessionId, parentChatId)
		{
			this.currentNestedRecentId = recentId;

			const controller = this.getControllerById(recentId, sessionId);
			if (!controller)
			{
				logger.error(`resumeNestedController: controller not found for ${recentId} session: ${sessionId}`);

				return;
			}

			controller.resume()
				.catch((error) => {
					logger.error(`resumeNestedController: resume error for ${recentId}`, error);
				})
			;

			this.emit(EventType.recentManager.resumeController, recentId, controller, parentChatId);
		}

		/**
		 * Restores the active recent after a nested navigation is closed.
		 *
		 * If previousRecentId belongs to another nested session (stack model: closing B
		 * returns to A), resumes the nested controller within that session.
		 * Otherwise delegates to setActiveRecent for global tabs.
		 *
		 * @param {string} previousRecentId
		 * @param {string} previousSessionId — sessionId that owned previousRecentId, or null for global tabs
		 */
		restorePreviousRecent(previousRecentId, previousSessionId)
		{
			if (previousSessionId !== null)
			{
				const controller = this.getControllerById(previousRecentId, previousSessionId);
				if (controller)
				{
					logger.warn(`restorePreviousRecent: resume nested ${previousRecentId} session: ${previousSessionId}`);
					this.currentNestedSessionId = previousSessionId;
					const parentChatId = controller.locator.get('parentChatId');
					this.resumeNestedController(previousRecentId, previousSessionId, parentChatId);

					return;
				}

					logger.warn(
						`restorePreviousRecent: nested controller not found, falling back to setActiveRecent ${previousRecentId}`,
					);
			}

			this.setActiveRecent(previousRecentId);
		}

		/**
		 * Destroys all nested recent list controllers that belong to the given session.
		 * Controllers from other sessions are not affected.
		 * @param {string[]} recentIds
		 * @param {string}   sessionId
		 */
		destroyNestedControllers(recentIds, sessionId)
		{
			logger.warn('destroyNestedControllers', recentIds, sessionId);

			const sessionControllers = this.#nestedControllersMap.get(sessionId);
			if (!sessionControllers)
			{
				logger.log('destroyNestedControllers: no controllers for session', sessionId);

				return;
			}

			for (const recentId of recentIds)
			{
				const controller = sessionControllers.get(recentId);
				if (controller)
				{
					controller.destroy();
				}

				sessionControllers.delete(recentId);
			}

			if (sessionControllers.size === 0)
			{
				this.#nestedControllersMap.delete(sessionId);
			}
		}

		inactiveRecents(mode)
		{
			for (const controller of this.controllerCollection.values())
			{
				controller.markAsInactive(mode);
			}

			for (const sessionControllers of this.#nestedControllersMap.values())
			{
				for (const controller of sessionControllers.values())
				{
					controller.markAsInactive(mode);
				}
			}
		}

		#initController(recentId, applicationStartUp)
		{
			const uiPromise = this.#getRecentWidgetPromise(recentId);

			const controller = this.#initializeRecentList(recentId, uiPromise);

			controller.init(applicationStartUp)
				.catch((error) => {
					logger.error(`setActiveRecent: controller ${recentId} init error`, error);
				})
			;

			return controller;
		}

		#resumeController(recentId)
		{
			this.currentListId = recentId;
			const controller = this.controllerCollection.get(recentId);

			controller.resume()
				.catch((error) => {
					logger.error(`setActiveRecent: controller ${recentId} resume error`, error);
				})
			;

			return controller;
		}

		#initializeRecentList(recentId, ui)
		{
			let config = RecentConfig[recentId];
			if (!Type.isPlainObject(config))
			{
				config = resolveFolderConfig(recentId);
			}

			if (!Type.isPlainObject(config))
			{
				throw new TypeError(`undefined recentId: ${recentId}`);
			}

			const locator = createLocator(recentId, ui, ROOT_PARENT_CHAT_ID);
			const controller = RecentConfigurator.createRecentController(config, locator);
			this.initializedLists.add(recentId);
			this.controllerCollection.set(recentId, controller);
			this.currentListId = recentId;

			return controller;
		}

		/**
		 * Creates a RecentController for a nested widget without touching
		 * controllerCollection, initializedLists, or currentListId.
		 * @param {string}          recentId
		 * @param {Promise<object>} uiPromise
		 * @param {number}          parentChatId
		 * @returns {RecentController}
		 */
		#createNestedController(recentId, uiPromise, parentChatId)
		{
			const config = NestedRecentConfig[recentId];
			if (!Type.isPlainObject(config))
			{
				throw new TypeError(`undefined recentId: ${recentId}`);
			}

			const locator = createLocator(recentId, uiPromise, parentChatId);

			return RecentConfigurator.createRecentController(config, locator);
		}

		#getRecentWidgetPromise(recentId)
		{
			return new Promise((resolve) => {
				waitViewLoaded()
					.then(() => {
						const widget = this.recentGetter.getRecentListByTabId(recentId);

						resolve(widget);
					})
					.catch((error) => {
						logger.error(`getRecentWidgetPromise ${recentId} error`, error);
					});
			});
		}

		emit(eventName, ...args)
		{
			serviceLocator.get('emitter').emit(eventName, args);
		}
	}

	module.exports = { RecentManager };
});
