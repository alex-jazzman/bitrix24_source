/**
 * @module im/messenger/controller/recent/service/external/chat
 */
jn.define('im/messenger/controller/recent/service/external/chat', (require, exports, module) => {
	const { Type } = require('type');
	const { EventType } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IExternalService}
	 * @class ChatExternalService
	 */
	class ChatExternalService extends BaseRecentService
	{
		#callCollection = new Map();

		onInit()
		{
			this.logger.log('on init');

			this.subscribeEvents();
		}

		callActiveHandler = (call, callStatus) => {
			this.logger.warn('callActiveHandler', call, callStatus);

			let status = callStatus;
			if (
				call.associatedEntity.advanced.entityType === 'VIDEOCONF'
				&& call.associatedEntity.advanced.entityData1 === 'BROADCAST'
			)
			{
				status = 'remote';
			}

			const recentCallItem = {
				type: 'call',
				id: this.#createCallId(call),
				call,
				callStatus: status,
			};

			this.addCall(recentCallItem);
		};

		/**
		 * @param {RecentCallData} call
		 */
		callInactiveHandler = (call) => {
			this.logger.warn('callInactiveHandler', call);

			if (Type.isNil(call.associatedEntity.id))
			{
				return;
			}

			const callId = this.#createCallId(call);

			this.removeCallById(callId);
		};

		/**
		 * @param {RecentCallData} call
		 * @return {string}
		 */
		#createCallId(call)
		{
			return `call${call.associatedEntity.id}`;
		}

		/**
		 * @return {Array<CallItemData>}
		 */
		getCallList()
		{
			return [...this.#callCollection.values()];
		}

		/**
		 * @desc A live external event: the call is marked so an active coalescing scope does not
		 * delay the banner.
		 * @private
		 * @param {CallItemData} recentCallItem
		 */
		addCall(recentCallItem)
		{
			this.#callCollection.set(recentCallItem.id, recentCallItem);

			const renderService = this.recentLocator.get('render');

			renderService.upsertItems([recentCallItem], {
				// findItemMethod: 'findInNative',
			});

			renderService.renderInstant({ force: true });
		}

		/**
		 * @private
		 * @param {string} callId
		 */
		removeCallById(callId)
		{
			this.#callCollection.delete(callId);

			const renderService = this.recentLocator.get('render');

			// the call banner is a service row: it is excluded from the cache snapshot by section
			// and its removal is not a composition change
			renderService.deleteItems([{ id: callId }], { isServiceRow: true });
			renderService.renderInstant({ force: true });
		}

		subscribeEvents()
		{
			BX.addCustomEvent(EventType.call.active, this.callActiveHandler);
			BX.addCustomEvent(EventType.call.inactive, this.callInactiveHandler);
		}

		unsubscribeEvents()
		{
			BX.removeCustomEvent(EventType.call.active, this.callActiveHandler);
			BX.removeCustomEvent(EventType.call.inactive, this.callInactiveHandler);
		}
	}

	module.exports = ChatExternalService;
});
