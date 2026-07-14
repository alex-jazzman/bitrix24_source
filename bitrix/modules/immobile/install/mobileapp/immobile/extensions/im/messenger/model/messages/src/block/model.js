/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/messages/block/model
 */
jn.define('im/messenger/model/messages/block/model', (require, exports, module) => {
	const { Type } = require('type');

	const { normalize, isElementValid } = require('im/messenger/model/messages/block/normalizer');

	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const logger = getLoggerWithContext('model--messages-block', 'blockModel');

	/** @type {BlockMessengerModel} */
	const blockModel = {
		namespaced: true,
		state: () => ({
			/** @type {Record<number|string, BlockModelState>} */
			collection: {},
		}),
		getters: {
			/**
			 * @function messagesModel/blockModel/getByMessageId
			 * @param state
			 * @return {BlockModelState|null}
			 */
			getByMessageId: (state) => (messageId) => {
				if (!Type.isNumber(messageId) && !Type.isStringFilled(messageId))
				{
					return null;
				}

				return state.collection[messageId] ?? null;
			},
		},
		actions: {
			/**
			 * @function messagesModel/blockModel/set
			 * @param store
			 * @param {BlockModelSetPayload} payload
			 */
			set: (store, payload) => {
				const { messageId, block, actionName } = payload;

				const normalizedBlock = normalize(block);
				if (!normalizedBlock)
				{
					return;
				}

				store.commit('set', {
					actionName: actionName ?? 'set',
					data: {
						messageId,
						...normalizedBlock,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/setList
			 * @param store
			 * @param {BlockModelSetListPayload} payload
			 */
			setList: (store, payload) => {
				const { messages, actionName = 'setList' } = payload;

				const blockList = [];
				for (const message of messages)
				{
					// fallback on message.builder: SQLite column is named "builder"
					const blockData = message.block ?? message.builder;
					const normalizedBlock = normalize(blockData);
					if (!normalizedBlock)
					{
						continue;
					}

					blockList.push({
						messageId: message.id,
						...normalizedBlock,
					});
				}

				if (blockList.length === 0)
				{
					return;
				}

				store.commit('setList', {
					actionName,
					data: {
						blockList,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/appendElement
			 * @param store
			 * @param {BlockModelAppendBlockPayload} payload
			 */
			appendElement: (store, payload) => {
				const { messageId, element, text } = payload;

				if (!isElementValid(element))
				{
					logger.warn('appendElement: invalid element', element);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBlockText', {
					id: messageId,
					text,
				}, { root: true });

				const current = store.state.collection[messageId];
				const elements = current ? [...current.elements, element] : [element];

				store.commit('update', {
					actionName: 'appendElement',
					data: {
						messageId,
						elementId: element.id ?? null,
						elements,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/updateElement
			 * @param store
			 * @param {BlockModelUpdateElementPayload} payload
			 */
			updateElement: (store, payload) => {
				const { messageId, elementId, element, text } = payload;

				const current = store.state.collection[messageId];
				if (!current)
				{
					logger.warn('updateElement: no block state for message', messageId);

					return;
				}

				if (!isElementValid(element))
				{
					logger.warn('updateElement: invalid element', element);

					return;
				}

				const hasElement = current.elements.some((existing) => existing.id === elementId);
				if (!hasElement)
				{
					logger.warn('updateElement: element not found', elementId);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBlockText', {
					id: messageId,
					text,
				}, { root: true });

				const elements = current.elements.map((existing) => {
					if (existing.id === elementId)
					{
						return element;
					}

					return existing;
				});

				store.commit('update', {
					actionName: 'updateElement',
					data: {
						messageId,
						elementId,
						elements,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/deleteElement
			 * @param store
			 * @param {BlockModelDeleteElementPayload} payload
			 */
			deleteElement: (store, payload) => {
				const { messageId, elementId, text } = payload;

				const current = store.state.collection[messageId];
				if (!current)
				{
					logger.warn('deleteElement: no block state for message', messageId);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBlockText', {
					id: messageId,
					text,
				}, { root: true });

				const deletedElement = current.elements.find((existing) => existing.id === elementId);
				if (deletedElement?.fileIds)
				{
					for (const fileId of deletedElement.fileIds)
					{
						store.dispatch('filesModel/delete', { id: fileId }, { root: true });
					}
				}

				const elements = current.elements.filter((existing) => existing.id !== elementId);

				store.commit('update', {
					actionName: 'deleteElement',
					data: {
						messageId,
						elementId,
						elements,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/delete
			 * @param store
			 * @param {{ messageId: number|string }} payload
			 */
			delete: (store, payload) => {
				const { messageId } = payload;

				if (!store.state.collection[messageId])
				{
					return;
				}

				store.commit('delete', {
					actionName: 'delete',
					data: {
						messageId,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/deleteByIdList
			 * @param store
			 * @param {{ idList: Array<number|string> }} payload
			 */
			deleteByIdList: (store, payload) => {
				const { idList } = payload;

				const messageIdList = idList.filter((id) => store.state.collection[id]);

				if (messageIdList.length === 0)
				{
					return;
				}

				store.commit('deleteByIdList', {
					actionName: 'deleteByIdList',
					data: {
						messageIdList,
					},
				});
			},

			/**
			 * @function messagesModel/blockModel/updateWithId
			 * @param store
			 * @param {{ oldId: number|string, newId: number|string }} payload
			 */
			updateWithId: (store, payload) => {
				const { oldId, newId } = payload;

				if (!store.state.collection[oldId])
				{
					return;
				}

				store.commit('updateWithId', {
					actionName: 'updateWithId',
					data: { oldId, newId },
				});
			},

			/**
			 * @function messagesModel/blockModel/deleteByChatId
			 * @param store
			 * @param {BlockModelDeleteByChatIdPayload} payload
			 */
			deleteByChatId: (store, payload) => {
				const { chatId } = payload;

				const messageIdList = store.rootGetters['messagesModel/getByChatId'](chatId)
					.map((message) => message.id)
				;

				if (messageIdList.length === 0)
				{
					return;
				}

				store.commit('deleteByIdList', {
					actionName: 'deleteByChatId',
					data: {
						messageIdList,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<BlockSetData>} payload
			 */
			set: (state, payload) => {
				logger.log('set mutation', payload);

				const { messageId, ...blockState } = payload.data;
				state.collection[messageId] = blockState;
			},

			/**
			 * @param state
			 * @param {MutationPayload<BlockSetListData>} payload
			 */
			setList: (state, payload) => {
				logger.log('setList mutation', payload);

				const { blockList } = payload.data;
				for (const { messageId, ...blockState } of blockList)
				{
					state.collection[messageId] = blockState;
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<BlockUpdateData>} payload
			 */
			update: (state, payload) => {
				logger.log('update mutation', payload);

				const { messageId, elements } = payload.data;
				const current = state.collection[messageId];
				state.collection[messageId] = {
					...current,
					elements,
				};
			},

			/**
			 * @param state
			 * @param {MutationPayload<BlockDeleteData>} payload
			 */
			delete: (state, payload) => {
				logger.log('delete mutation', payload);

				const { messageId } = payload.data;
				delete state.collection[messageId];
			},

			/**
			 * @param state
			 * @param {MutationPayload<{oldId: number|string, newId: number|string}>} payload
			 */
			updateWithId: (state, payload) => {
				logger.log('updateWithId mutation', payload);

				const { oldId, newId } = payload.data;
				state.collection[newId] = state.collection[oldId];
				delete state.collection[oldId];
			},

			/**
			 * @param state
			 * @param {MutationPayload<BlockDeleteByChatIdData>} payload
			 */
			deleteByIdList: (state, payload) => {
				logger.log('deleteByIdList mutation', payload);

				const { messageIdList } = payload.data;
				for (const messageId of messageIdList)
				{
					delete state.collection[messageId];
				}
			},
		},
	};

	module.exports = { blockModel };
});
