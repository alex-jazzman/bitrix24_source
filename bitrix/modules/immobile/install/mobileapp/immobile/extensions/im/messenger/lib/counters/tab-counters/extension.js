/**
 * @module im/messenger/lib/counters/tab-counters
 */
jn.define('im/messenger/lib/counters/tab-counters', (require, exports, module) => {
	/* global tabs */
	const { Type } = require('type');
	const {
		COUNTER_OVERFLOW_LIMIT,
		EventType,
		RecentTab,
		NavigationTabId,
	} = require('im/messenger/const');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { CounterHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { SetCounterMapAction } = require('im/messenger/lib/counters/update-system/action/counter-map');
	const logger = getLoggerWithContext('counters--tab', 'TabCounters');

	/**
	 * @class TabCounters
	 */
	class TabCounters
	{
		constructor()
		{
			this.updateTimeout = null;
			this.updateInterval = 300;

			this.bindMethods();
			this.initCounters();

			this.subscribeStoreEvents();
			this.subscribeInitMessengerEvent();
		}

		/**
		 * @protected
		 * @return {MessengerCoreStore|null}
		 */
		get store()
		{
			return serviceLocator.get('core')?.getStore();
		}

		/**
		 * @protected
		 * @type {MessengerInitService|null}
		 */
		get messengerInitService()
		{
			return serviceLocator.get('messenger-init-service');
		}

		get ui()
		{
			return tabs;
		}

		bindMethods()
		{
			this.handleCountersGet = this.handleCountersGet.bind(this);
		}

		subscribeInitMessengerEvent()
		{
			this.messengerInitService.onInit(this.handleCountersGet);
		}

		initCounters()
		{
			this.notificationCounters = 0;

			this.lastCounters = {
				chats: null,
				openlines: null,
				copilot: null,
				collab: null,
				tasksTask: null,
			};
		}

		subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('counterModel/set', this.#setCounterHandler)
				.on('counterModel/delete', this.#deleteCounterHandler)
			;
		}

		update()
		{
			this.clearUpdateTimeout();

			const counters = {
				chats: 0,
				openlines: 0,
				copilot: 0,
				collab: 0,
				tasksTask: 0,
			};

			const counterList = this.store.getters['counterModel/getList']();

			/**
			 * @type {Record<string, (CounterModelState, CounterHelper) => number>}
			 */
			const calculateUnmutedTabCounters = {
				chats: (counterState, helper) => {
					if (helper.hasChatTab)
					{
						return helper.tabCounter;
					}

					return helper.isTabsEmpty && !(CounterHelper.createByChatId(counterState.parentChatId)?.isMuted)
						? counterState.counter
						: 0
					;
				},
				openlines: (counterState, helper) => {
					return helper.hasOpenlinesTab ? helper.tabCounter : 0;
				},
				copilot: (counterState, helper) => {
					return helper.hasCopilotTab ? helper.tabCounter : 0;
				},
				collab: (counterState, helper) => {
					return helper.hasCollabTab ? helper.tabCounter : 0;
				},
				tasksTasks: (counterState, helper) => {
					return helper.hasTasksTab ? helper.tabCounter : 0;
				},
			};

			for (const counterState of counterList)
			{
				if (counterState.isMuted)
				{
					continue;
				}

				const helper = CounterHelper.createByModel(counterState);

				counters.chats += calculateUnmutedTabCounters.chats(counterState, helper);
				counters.copilot += calculateUnmutedTabCounters.copilot(counterState, helper);
				counters.collab += calculateUnmutedTabCounters.collab(counterState, helper);
				counters.openlines += calculateUnmutedTabCounters.openlines(counterState, helper);
				counters.tasksTask += calculateUnmutedTabCounters.tasksTasks(counterState, helper);
			}

			logger.log('update', counters);

			this.sendCountersToExternalComponents(counters);
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

		updateUi(counters)
		{
			let isUpdated = false;
			const oldCounters = { ...this.lastCounters };

			Object.entries(counters).forEach(([tabId, counter]) => {
				if (Type.isNumber(this.lastCounters[tabId]) && this.lastCounters[tabId] === counter)
				{
					return;
				}
				this.lastCounters[tabId] = counter;
				const uiTabId = this.#prepareTabId(tabId);
				const label = this.#getLabel(counter);

				this.ui.updateItem(uiTabId, {
					counter,
					label,
				});

				isUpdated = true;
			});

			if (isUpdated)
			{
				const newCounters = { ...this.lastCounters };
				this.updateUiEventEmit({ oldCounters, newCounters });
			}
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

			if (!Type.isArrayFilled(messengerCounters) && notifyCounters > 0)
			{
				this.sendNotificationCounterToCommunicationComponent();
			}

			this.reloadNotifications();
		}

		reloadNotifications()
		{
			MessengerEmitter.emit(EventType.notification.reload);
		}

		/**
		 * @param {object} event
		 */
		updateUiEventEmit(event)
		{
			serviceLocator.get('emitter')?.emit(EventType.counters.updateUi, [event]);
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

		/**
		 * @param {MutationPayload<CounterSetData, CounterSetActions>} payload
		 */
		#setCounterHandler = ({ payload }) => {
			this.update();
		};

		/**
		 * @param {MutationPayload<CounterDeleteData, CounterDeleteActions>} payload
		 */
		#deleteCounterHandler = ({ payload }) => {
			if (payload.actionName === 'clearByType')
			{
				// TODO clearByType
			}

			this.update();
		};

		#prepareTabId(rawTabId)
		{
			if (rawTabId === RecentTab.tasksTask)
			{
				return NavigationTabId.task;
			}

			return rawTabId;
		}

		#getLabel(counter)
		{
			if (!Type.isNumber(counter))
			{
				return '';
			}

			if (counter === 0)
			{
				return '';
			}

			return counter >= COUNTER_OVERFLOW_LIMIT ? '99+' : String(counter);
		}

		updateDelayed()
		{
			logger.log('updateDelayed');

			if (!this.updateTimeout)
			{
				this.updateTimeout = setTimeout(() => this.update(), this.updateInterval);
			}
		}

		clearUpdateTimeout()
		{
			clearTimeout(this.updateTimeout);
			this.updateTimeout = null;
		}
	}

	module.exports = { TabCounters };
});
