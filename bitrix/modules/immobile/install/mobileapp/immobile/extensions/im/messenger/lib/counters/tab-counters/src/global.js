/**
 * @module im/messenger/lib/counters/tab-counters/src/global
 */
jn.define('im/messenger/lib/counters/tab-counters/src/global', (require, exports, module) => {
	/* global tabs */
	const { Type } = require('type');
	const {
		RecentTab,
		NavigationTabId,
		NavigationTabByRecentTab,
		EventType,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { CounterHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { SetCounterMapAction } = require('im/messenger/lib/counters/update-system/action/counter-map');
	const { BaseTabCounters } = require('im/messenger/lib/counters/tab-counters/src/base');

	const logger = getLoggerWithContext('counters--tab', 'TabCounters');

	// The only folder code published under a navigation tab id instead of the folder id: the
	// allowlist of #getFolderCounterKey. Resolving the id from a server-sent code instead would
	// let any folder that comes with a composition take the key of another tab and overwrite the
	// badge counted for it by update().
	const COMPOSITE_FOLDER_CODE = 'all';

	/**
	 * @implements Unsubscribable
	 * @class TabCounters
	 */
	class TabCounters extends BaseTabCounters
	{
		constructor()
		{
			super(tabs);

			this.notificationCounters = 0;

			this.handleCountersGet = this.handleCountersGet.bind(this);

			this.storeManager = serviceLocator.get('core').getStoreManager();

			this.#subscribeStoreEvents();
			this.#subscribeInitMessengerEvent();
			this.#subscribeNavigationEvents();
		}

		/**
		 * @protected
		 * @type {MessengerInitService|null}
		 */
		get messengerInitService()
		{
			return serviceLocator.get('messenger-init-service');
		}

		/** @override */
		prepareTabId(rawTabId)
		{
			return NavigationTabByRecentTab[rawTabId] ?? rawTabId;
		}

		/**
		 * @param {Set<number>|null} [affectedChatIds]
		 * @param {Set<number>|null} [affectedFolderIds]
		 */
		update(affectedChatIds = null, affectedFolderIds = null)
		{
			this.clearUpdateTimeout();

			const counters = {
				chats: 0,
				openlines: 0,
				copilot: 0,
				collab: 0,
				tasksTask: 0,
				vibecodeApp: 0,
			};

			const counterList = this.store.getters['counterModel/getList']();

			/**
			 * @type {Record<string, (CounterModelState, CounterHelper) => number>}
			 */
			const calculateUnmutedTabCounters = {
				chats: (counterState, helper) => this.#calculateInheritableTabCounter(
					counterState,
					helper,
					RecentTab.chat,
					helper.tabCounter,
				),
				openlines: (counterState, helper) => this.#calculateTopLevelTabCounter(helper, RecentTab.openlines),
				copilot: (counterState, helper) => this.#calculateTopLevelTabCounter(helper, RecentTab.copilot),
				collab: (counterState, helper) => this.#calculateInheritableTabCounter(
					counterState,
					helper,
					RecentTab.collab,
					counterState.counter,
				),
				tasksTask: (counterState, helper) => this.#calculateDirectTabCounter(helper, RecentTab.tasksTask),
				vibecodeApp: (counterState, helper) => this.#calculateDirectTabCounter(helper, RecentTab.vibecodeApp),
			};

			for (const counterState of counterList)
			{
				if (counterState.isMuted)
				{
					continue;
				}

				if (!counterState.isMarkedAsUnread && counterState.counter === 0)
				{
					continue;
				}

				const helper = CounterHelper.createByModel(counterState);

				counters.chats += calculateUnmutedTabCounters.chats(counterState, helper);
				counters.copilot += calculateUnmutedTabCounters.copilot(counterState, helper);
				counters.collab += calculateUnmutedTabCounters.collab(counterState, helper);
				counters.openlines += calculateUnmutedTabCounters.openlines(counterState, helper);
				counters.tasksTask += calculateUnmutedTabCounters.tasksTask(counterState, helper);
				counters.vibecodeApp += calculateUnmutedTabCounters.vibecodeApp(counterState, helper);
			}

			const externalCounters = { ...counters };
			Object.assign(counters, this.#calculateFolderCounters(counterList, affectedChatIds, affectedFolderIds));

			logger.log('update', counters);

			this.sendCountersToExternalComponents(externalCounters);
			this.updateUi(counters);
		}

		sendCountersToExternalComponents(counters)
		{
			const communicationCounters = {
				...counters,
				chats: counters.chats - counters.copilot, // for legacy
				notifications: this.notificationCounters,
			};

			BX.postComponentEvent('ImRecent::counter::messages', [counters.chats], 'calls');
			BX.postComponentEvent('ImRecent::counter::list', [communicationCounters], 'communication');
		}

		sendNotificationCounterToCommunicationComponent()
		{
			BX.postComponentEvent('ImRecent::counter::list', [{ notifications: this.notificationCounters }], 'communication');
		}

		setNotificationCounters(counter)
		{
			this.notificationCounters = counter;
		}

		clearNotificationCounters()
		{
			this.notificationCounters = 0;
		}

		clearAll()
		{
			this.update();
		}

		/**
		 * @param {immobileTabChatLoadResult} data
		 */
		async handleCountersGet(data)
		{
			const counters = data?.imCounters;
			logger.log('handleCountersGet', counters);

			const { messengerCounters = [], notifyCounters = 0 } = counters;
			this.notificationCounters = notifyCounters;

			try
			{
				await this.fillCounterStore(messengerCounters);
			}
			catch (error)
			{
				logger.error(error);
			}

			if ((!Array.isArray(messengerCounters) || messengerCounters.length === 0) && notifyCounters > 0)
			{
				this.sendNotificationCounterToCommunicationComponent();
			}

			this.reloadNotifications();
		}

		reloadNotifications()
		{
			MessengerEmitter.emit(EventType.notification.reload);
		}

		async fillCounterStore(counterList)
		{
			serviceLocator.get('counters-update-system')
				.dispatch(new SetCounterMapAction(counterList))
				.catch((error) => {
					logger.error('fillCounterStore error', error);
				})
			;
		}

		#subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('counterModel/set', this.#setCounterHandler)
				.on('counterModel/delete', this.#deleteCounterHandler)
				.on('folderModel/add', this.#folderModelHandler)
				.on('folderModel/update', this.#folderModelHandler)
				.on('folderModel/delete', this.#folderModelHandler)
				.on('folderModel/sort', this.#folderModelHandler)
				.on('folderModel/setChats', this.#folderChatsHandler)
				.on('folderModel/setState', this.#folderModelHandler)
			;
		}

		#subscribeInitMessengerEvent()
		{
			this.messengerInitService.onInit(this.handleCountersGet);
		}

		#subscribeNavigationEvents()
		{
			serviceLocator.get('emitter')
				?.on(EventType.navigation.tabRegistered, this.#tabRegisteredHandler)
			;
		}

		// Counter mutations that fire on `folderModel/add` reach this class before
		// the native tab is registered by NavigationManager (async addItems). The
		// initial updateItem call no-ops at the widget level but still caches the
		// value, so subsequent same-value updates are skipped. Re-emit once the
		// tab is actually on screen. `updateDelayed` coalesces bursts (e.g.
		// `#reconcileFolderTabs`) into a single recompute via the 300ms throttle.
		#tabRegisteredHandler = (payload) => {
			const tabId = payload?.tabId;
			if (!tabId)
			{
				return;
			}

			this.invalidateTabCache(tabId);
			this.updateDelayed();
		};

		#setCounterHandler = ({ payload }) => {
			const affectedChatIds = this.#getAffectedCounterChatIds(payload);
			this.update(affectedChatIds);
		};

		#deleteCounterHandler = () => {
			this.update();
		};

		#folderModelHandler = () => {
			this.update();
		};

		#folderChatsHandler = ({ payload }) => {
			const folderId = payload?.data?.folderId;
			if (!Type.isNumber(folderId))
			{
				this.update();

				return;
			}

			this.update(null, new Set([folderId]));
		};

		unsubscribeEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('counterModel/set', this.#setCounterHandler)
				.off('counterModel/delete', this.#deleteCounterHandler)
				.off('folderModel/add', this.#folderModelHandler)
				.off('folderModel/update', this.#folderModelHandler)
				.off('folderModel/delete', this.#folderModelHandler)
				.off('folderModel/sort', this.#folderModelHandler)
				.off('folderModel/setChats', this.#folderChatsHandler)
				.off('folderModel/setState', this.#folderModelHandler)
			;
			serviceLocator.get('emitter')
				?.off(EventType.navigation.tabRegistered, this.#tabRegisteredHandler)
			;
		}

		/**
		 * @param {CounterHelper} helper
		 * @param {string} tabName
		 * @return {number}
		 */
		#calculateDirectTabCounter(helper, tabName)
		{
			return helper.hasTab(tabName) ? helper.tabCounter : 0;
		}

		/**
		 * @param {CounterHelper} helper
		 * @param {string} tabName
		 * @return {number}
		 */
		#calculateTopLevelTabCounter(helper, tabName)
		{
			if (helper.isChildCounter)
			{
				return 0;
			}

			return this.#calculateDirectTabCounter(helper, tabName);
		}

		/**
		 * @param {CounterModelState} counterState
		 * @param {CounterHelper} helper
		 * @param {string} tabName
		 * @param {number} childCounter
		 * @return {number}
		 */
		#calculateInheritableTabCounter(counterState, helper, tabName, childCounter)
		{
			// Backend puts the inherited section into recentSections of every nested chat,
			// so hasTab alone cannot see that the chat lives under a muted parent chain.
			if (helper.isChildCounter && this.#hasMutedAncestor(counterState.chatId))
			{
				return 0;
			}

			if (helper.hasTab(tabName))
			{
				return helper.tabCounter;
			}

			if (!helper.isChildCounter)
			{
				return 0;
			}

			const parentHelper = CounterHelper.createByChatId(counterState.parentChatId);
			if (Type.isNull(parentHelper))
			{
				logger.error(`calculateUnmutedTabCounters ${tabName} tab: unknown parentChatId`, counterState.parentChatId, counterState);

				return 0;
			}

			if (parentHelper.isMuted)
			{
				return 0;
			}

			return parentHelper.hasTab(tabName) ? childCounter : 0;
		}

		/**
		 * @param {Array<CounterModelState>} counterList
		 * @param {Set<number>|null} affectedChatIds
		 * @param {Set<number>|null} affectedFolderIds
		 * @return {Record<string, number>}
		 */
		#calculateFolderCounters(counterList, affectedChatIds, affectedFolderIds)
		{
			const folders = this.store.getters['folderModel/getList']();
			if (!Type.isArrayFilled(folders))
			{
				return {};
			}

			const countersByChatId = new Map();
			for (const counterState of counterList)
			{
				countersByChatId.set(counterState.chatId, this.#getCounterValue(counterState));
			}

			const folderCounters = {};
			for (const folder of folders)
			{
				if (!this.#shouldRecalculateFolder(folder, counterList, affectedChatIds, affectedFolderIds))
				{
					continue;
				}

				folderCounters[this.#getFolderCounterKey(folder)] = folder.type === 'system'
					? this.#calculateSystemFolderCounter(folder)
					: this.#calculatePersonalFolderCounter(folder, countersByChatId)
				;
			}

			return folderCounters;
		}

		/**
		 * Key the badge of a folder is published under: it has to be the id the tab is registered
		 * in the widget with. A personal tab is registered by the id of its folder, but a native tab
		 * of a composite folder comes with its navigation code ('all'), so the numeric id would
		 * never be found in the widget.
		 *
		 * A plain system folder keeps the numeric key on purpose: its badge is counted by the
		 * singular path of `update()` under keys of its own ('chats', 'copilot', ...), and publishing
		 * the folder value under the same key would overwrite that count.
		 *
		 * @param {FolderModelState} folder
		 * @return {string}
		 */
		#getFolderCounterKey(folder)
		{
			if (this.#isCompositeFolder(folder) && folder.code === COMPOSITE_FOLDER_CODE)
			{
				return NavigationTabId.all;
			}

			return String(folder.id);
		}

		/**
		 * @param {FolderModelState} folder
		 * @param {Map<number, number>} countersByChatId
		 * @return {number}
		 */
		#calculatePersonalFolderCounter(folder, countersByChatId)
		{
			return folder.chatIds.reduce((sum, chatId) => {
				return sum + (countersByChatId.get(chatId) ?? 0);
			}, 0);
		}

		/**
		 * @param {FolderModelState} folder
		 * @return {number}
		 */
		#calculateSystemFolderCounter(folder)
		{
			if (this.#isCompositeFolder(folder))
			{
				return this.#calculateCompositeFolderCounter(folder);
			}

			if (!Type.isStringFilled(folder.recentSection))
			{
				return 0;
			}

			const counters = this.store.getters['counterModel/getByRecentSection'](folder.recentSection);

			return counters.reduce((sum, counterState) => {
				return sum + this.#getCounterValue(counterState);
			}, 0);
		}

		/**
		 * A folder built from other folders (the "All" folder) has no section of its own: the badge
		 * is the sum over every counter in its member sections, including nested chats. A chat that
		 * belongs to two of those sections is counted once, and section membership follows the
		 * counter model's ancestor inheritance rules.
		 *
		 * @param {FolderModelState} folder
		 * @return {number}
		 */
		#calculateCompositeFolderCounter(folder)
		{
			const sections = this.#getSystemFolderSections(folder);
			if (sections.size === 0)
			{
				return 0;
			}

			const countedChatIds = new Set();

			return this.store.getters['counterModel/getList']().reduce((sum, counterState) => {
				if (countedChatIds.has(counterState.chatId))
				{
					return sum;
				}

				if (!this.#belongsToSections(counterState, sections))
				{
					return sum;
				}

				countedChatIds.add(counterState.chatId);

				return sum + this.#getCounterValue(counterState);
			}, 0);
		}

		/**
		 * @param {FolderModelState} folder
		 * @return {boolean}
		 */
		#isCompositeFolder(folder)
		{
			return Type.isArrayFilled(folder.sourceFolders);
		}

		/**
		 * Sections a system folder collects its badge from: the composition of a composite folder
		 * or the single section of a plain one.
		 *
		 * @param {FolderModelState} folder
		 * @return {Set<string>}
		 */
		#getSystemFolderSections(folder)
		{
			if (this.#isCompositeFolder(folder))
			{
				return this.store.getters['folderModel/getSourceSections'](folder.id);
			}

			return Type.isStringFilled(folder.recentSection) ? new Set([folder.recentSection]) : new Set();
		}

		/**
		 * @param {CounterModelState} counterState
		 * @param {Set<string>} sections
		 * @return {boolean}
		 */
		#belongsToSections(counterState, sections)
		{
			const belongsToRecentSection = this.store.getters['counterModel/belongsToRecentSection'];
			for (const section of sections)
			{
				if (belongsToRecentSection(counterState, section))
				{
					return true;
				}
			}

			return false;
		}

		/**
		 * @param {number} chatId
		 * @return {boolean}
		 */
		#hasMutedAncestor(chatId)
		{
			return this.store.getters['counterModel/hasMutedAncestor'](chatId);
		}

		/**
		 * @param {CounterModelState} counterState
		 * @return {number}
		 */
		#getCounterValue(counterState)
		{
			if (counterState.isMuted || this.#hasMutedAncestor(counterState.chatId))
			{
				return 0;
			}

			if (counterState.counter > 0)
			{
				return counterState.counter;
			}

			return counterState.isMarkedAsUnread ? 1 : 0;
		}

		/**
		 * @param {FolderModelState} folder
		 * @param {Array<CounterModelState>} counterList
		 * @param {Set<number>|null} affectedChatIds
		 * @param {Set<number>|null} affectedFolderIds
		 * @return {boolean}
		 */
		#shouldRecalculateFolder(folder, counterList, affectedChatIds, affectedFolderIds)
		{
			if (affectedFolderIds?.has(folder.id))
			{
				return true;
			}

			if (!affectedChatIds)
			{
				return true;
			}

			if (folder.type === 'personal')
			{
				return folder.chatIds.some((chatId) => affectedChatIds.has(chatId));
			}

			const sections = this.#getSystemFolderSections(folder);

			return counterList.some((counterState) => {
				return affectedChatIds.has(counterState.chatId)
					&& this.#belongsToSections(counterState, sections)
				;
			});
		}

		/**
		 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
		 * @return {Set<number>|null}
		 */
		#getAffectedCounterChatIds(payload)
		{
			const counterList = payload?.data?.counterList;
			if (!Type.isArrayFilled(counterList))
			{
				return null;
			}

			return new Set(
				counterList
					.map((counterState) => counterState.chatId)
					.filter((chatId) => Type.isNumber(chatId)),
			);
		}
	}

	module.exports = { TabCounters };
});
