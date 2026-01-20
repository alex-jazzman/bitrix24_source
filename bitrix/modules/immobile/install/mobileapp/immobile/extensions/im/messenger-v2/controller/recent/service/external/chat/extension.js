/**
 * @module im/messenger-v2/controller/recent/service/external/chat
 */
jn.define('im/messenger-v2/controller/recent/service/external/chat', (require, exports, module) => {
	const { Type } = require('type');
	const { EventType } = require('im/messenger/const');
	const { BaseRecentService } = require('im/messenger-v2/controller/recent/service/base');

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

			this.#subscribeEvents();
		}

		#subscribeEvents()
		{
			BX.addCustomEvent(EventType.call.active, this.callActiveHandler);
			BX.addCustomEvent(EventType.call.inactive, this.callInactiveHandler);
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

			renderService.renderInstant();
		}

		/**
		 * @private
		 * @param {string} callId
		 */
		removeCallById(callId)
		{
			this.#callCollection.delete(callId);

			const renderService = this.recentLocator.get('render');

			renderService.deleteItems([{ id: callId }]);
			renderService.renderInstant();
		}
	}

	module.exports = ChatExternalService;
});
