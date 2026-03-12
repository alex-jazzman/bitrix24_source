/**
 * @module im/messenger/lib/promotion/src/trigger-manager
 */
jn.define('im/messenger/lib/promotion/src/trigger-manager', (require, exports, module) => {
	const { Promo, EventType } = require('im/messenger/const');
	const { Promotion } = require('im/messenger/lib/promotion/src/promotion');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('promotion', 'Promotion');

	const PromotionTriggerType = {
		vuexMutation: 'vuex-mutation',
		eventBx: 'event-bx',
		eventEmitter: 'event-emitter',
	};

	/** @type {PromotionTriggerManager} */
	let instance = null;

	/**
	 * @class PromotionTriggerManager
	 */
	class PromotionTriggerManager
	{
		/**
		 * @return {PromotionTriggerManager}
		 */
		static getInstance()
		{
			instance ??= new this();

			return instance;
		}

		constructor()
		{
			/** @type {PromotionTrigger[]} */
			this.triggers = [];
		}

		unsubscribeAll()
		{
			this.triggers.forEach((trigger) => trigger.unsubscriber?.());
			this.triggers = [];
		}

		/**
		 * @param {string} promoId
		 * @return {PromotionTrigger|undefined}
		 */
		getTriggerByPromoId(promoId)
		{
			return this.triggers.find(
				(registeredTrigger) => registeredTrigger.promoId === promoId,
			);
		}

		/**
		 * @param {PromotionTriggerOptions} options
		 */
		registerTrigger(options)
		{
			switch (options.triggerType)
			{
				case PromotionTriggerType.vuexMutation:
					this.registerTriggerByVuex(options);
					break;
				case PromotionTriggerType.eventBx:
					this.registerTriggerByEventBX(options);
					break;
				case PromotionTriggerType.eventEmitter:
					this.registerTriggerByEventEmitter(options);
					break;
				default:
					logger.error('registerTrigger unknown triggerType:', options.triggerType);
			}
		}

		/**
		 * @param {PromotionTriggerOptions} options
		 */
		registerTriggerByVuex({ eventName, promoId, condition, action })
		{
			logger.log('registerTriggerByVuex', eventName, promoId);
			const store = serviceLocator.get('core').getStoreManager();

			const handler = (payload) => {
				if (payload.type !== eventName)
				{
					return;
				}

				if (condition && condition(payload) === false)
				{
					return;
				}

				const currentRegisteredTrigger = this.getTriggerByPromoId(promoId);
				if (!currentRegisteredTrigger)
				{
					return;
				}

				logger.log('registerTriggerByVuex handler:', promoId, payload);
				this.triggerAction(currentRegisteredTrigger, payload, promoId);
			};

			store.on(eventName, handler);

			this.triggers.push({
				type: PromotionTriggerType.vuexMutation,
				eventName,
				promoId,
				unsubscriber: () => store.off(eventName, handler),
				action,
			});
		}

		/**
		 * @param {PromotionTriggerOptions} options
		 */
		registerTriggerByEventBX({ eventName, promoId, condition, action })
		{
			logger.log('registerTriggerByEventBX', eventName, promoId);
			const handler = (payload) => {
				if (condition && condition(payload) === false)
				{
					return;
				}

				const currentRegisteredTrigger = this.getTriggerByPromoId(promoId);
				if (!currentRegisteredTrigger)
				{
					return;
				}

				logger.log('registerTriggerByEventBX handler:', promoId, payload);
				this.triggerAction(currentRegisteredTrigger, payload, promoId);
			};

			BX.addCustomEvent(eventName, handler);

			this.triggers.push({
				type: PromotionTriggerType.eventBx,
				eventName,
				promoId,
				unsubscriber: () => BX.removeCustomEvent(eventName, handler),
				action,
			});
		}

		/**
		 * @param {PromotionTriggerOptions} options
		 */
		registerTriggerByEventEmitter({ eventName, promoId, condition, action })
		{
			logger.log('registerTriggerByEventEmitter', eventName, promoId);
			const eventEmitter = serviceLocator.get('emitter');
			if (!eventEmitter)
			{
				logger.error('registerTriggerByEventEmitter - eventEmitter is not available');

				return;
			}

			const handler = (payload) => {
				if (condition && condition(payload) === false)
				{
					return;
				}

				const currentRegisteredTrigger = this.getTriggerByPromoId(promoId);
				if (!currentRegisteredTrigger)
				{
					return;
				}

				logger.log('registerTriggerByEventEmitter handler:', promoId, payload);
				this.triggerAction(currentRegisteredTrigger, payload, promoId);
			};

			eventEmitter.on(eventName, handler);

			this.triggers.push({
				type: PromotionTriggerType.eventEmitter,
				eventName,
				promoId,
				action,
				unsubscriber: () => eventEmitter.off(eventName, handler),
			});
		}

		/**
		 * @param {PromotionTrigger} trigger
		 * @param {object} payload
		 * @param {string} promoId
		 */
		triggerAction(trigger, payload, promoId)
		{
			trigger.action?.(payload);
			trigger.unsubscriber?.();
			this.triggers = this.triggers.filter((registeredTrigger) => registeredTrigger.promoId !== promoId);
		}

		/* region setting triggers */

		setTabTasksTrigger()
		{
			this.registerTriggerByEventEmitter({
				eventName: EventType.counters.updateUi,
				promoId: Promo.tasksRecent,
				condition: (payload) => {
					return Boolean(!payload.oldCounters.tasksTask && payload.newCounters.tasksTask > 0);
				},
				action: () => {
					Promotion.getInstance().addToPromoQueue({
						promoId: Promo.tasksRecent,
						callback: () => Promotion.getInstance().showTasksRecentPromotion(),
					});
				},
			});
		}
	}

	module.exports = {
		PromotionTriggerManager,
		PromotionTriggerType,
	};
});
