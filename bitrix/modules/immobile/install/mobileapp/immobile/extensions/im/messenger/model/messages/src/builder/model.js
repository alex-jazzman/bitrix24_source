/* eslint-disable no-param-reassign */

/**
 * @module im/messenger/model/messages/builder/model
 */
jn.define('im/messenger/model/messages/builder/model', (require, exports, module) => {
	const { Type } = require('type');

	const { validateBlock, validateBlocks } = require('im/messenger/model/messages/builder/validator');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('model--messages-builder');

	/** @type {BuilderMessengerModel} */
	const builderModel = {
		namespaced: true,
		state: () => ({
			/** @type {Record<number|string, BuilderModelState>} */
			collection: {},
		}),
		getters: {
			/**
			 * @function messagesModel/builderModel/getByMessageId
			 * @param state
			 * @return {BuilderModelState|null}
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
			 * @function messagesModel/builderModel/set
			 * @param store
			 * @param {BuilderModelSetPayload} payload
			 */
			set: (store, payload) => {
				const { messageId, builder, actionName } = payload;

				if (!builder?.blocks)
				{
					return;
				}

				const blocks = validateBlocks(builder.blocks);

				store.commit('set', {
					actionName: actionName ?? 'set',
					data: {
						messageId,
						blocks,
					},
				});
			},

			/**
			 * @function messagesModel/builderModel/setList
			 * @param store
			 * @param {BuilderModelSetListPayload} payload
			 */
			setList: (store, payload) => {
				const { messages, actionName = 'setList' } = payload;

				const builderList = [];
				for (const message of messages)
				{
					if (!message.builder?.blocks)
					{
						continue;
					}

					const blocks = validateBlocks(message.builder.blocks);
					if (blocks.length === 0)
					{
						continue;
					}

					builderList.push({
						messageId: message.id,
						blocks,
					});
				}

				if (builderList.length === 0)
				{
					return;
				}

				store.commit('setList', {
					actionName,
					data: {
						builderList,
					},
				});
			},

			/**
			 * @function messagesModel/builderModel/appendBlock
			 * @param store
			 * @param {BuilderModelAppendBlockPayload} payload
			 */
			appendBlock: (store, payload) => {
				const { messageId, block, text } = payload;

				if (!validateBlock(block))
				{
					logger.warn('builderModel.appendBlock: invalid block', block);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBuilderText', {
					id: messageId,
					text,
				}, { root: true });

				const current = store.state.collection[messageId];
				const blocks = current ? [...current.blocks, block] : [block];

				store.commit('update', {
					actionName: 'appendBlock',
					data: {
						messageId,
						blockId: block.id ?? null,
						blocks,
					},
				});
			},

			/**
			 * @function messagesModel/builderModel/updateBlock
			 * @param store
			 * @param {BuilderModelUpdateBlockPayload} payload
			 */
			updateBlock: (store, payload) => {
				const { messageId, blockId, block, text } = payload;

				const current = store.state.collection[messageId];
				if (!current)
				{
					logger.warn('builderModel.updateBlock: no builder state for message', messageId);

					return;
				}

				if (!validateBlock(block))
				{
					logger.warn('builderModel.updateBlock: invalid block', block);

					return;
				}

				const hasBlock = current.blocks.some((existingBlock) => existingBlock.id === blockId);
				if (!hasBlock)
				{
					logger.warn('builderModel.updateBlock: block not found', blockId);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBuilderText', {
					id: messageId,
					text,
				}, { root: true });

				const blocks = current.blocks.map((existingBlock) => {
					if (existingBlock.id === blockId)
					{
						return block;
					}

					return existingBlock;
				});

				store.commit('update', {
					actionName: 'updateBlock',
					data: {
						messageId,
						blockId,
						blocks,
					},
				});
			},

			/**
			 * @function messagesModel/builderModel/deleteBlock
			 * @param store
			 * @param {BuilderModelDeleteBlockPayload} payload
			 */
			deleteBlock: (store, payload) => {
				const { messageId, blockId, text } = payload;

				const current = store.state.collection[messageId];
				if (!current)
				{
					logger.warn('builderModel.deleteBlock: no builder state for message', messageId);

					return;
				}

				// silent text update
				store.dispatch('messagesModel/updateBuilderText', {
					id: messageId,
					text,
				}, { root: true });

				const blocks = current.blocks.filter((existingBlock) => existingBlock.id !== blockId);

				store.commit('update', {
					actionName: 'deleteBlock',
					data: {
						messageId,
						blockId,
						blocks,
					},
				});
			},

			/**
			 * @function messagesModel/builderModel/delete
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
			 * @function messagesModel/builderModel/deleteByIdList
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
			 * @function messagesModel/builderModel/deleteByChatId
			 * @param store
			 * @param {BuilderModelDeleteByChatIdPayload} payload
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
			 * @param {MutationPayload<BuilderSetData>} payload
			 */
			set: (state, payload) => {
				logger.log('builderModel: set mutation', payload);

				const { messageId, blocks } = payload.data;
				state.collection[messageId] = { blocks };
			},

			/**
			 * @param state
			 * @param {MutationPayload<BuilderSetListData>} payload
			 */
			setList: (state, payload) => {
				logger.log('builderModel: setList mutation', payload);

				const { builderList } = payload.data;
				for (const item of builderList)
				{
					state.collection[item.messageId] = {
						blocks: item.blocks,
					};
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<BuilderUpdateData>} payload
			 */
			update: (state, payload) => {
				logger.log('builderModel: update mutation', payload);

				const { messageId, blocks } = payload.data;
				state.collection[messageId] = { blocks };
			},

			/**
			 * @param state
			 * @param {MutationPayload<BuilderDeleteData>} payload
			 */
			delete: (state, payload) => {
				logger.log('builderModel: delete mutation', payload);

				const { messageId } = payload.data;
				delete state.collection[messageId];
			},

			/**
			 * @param state
			 * @param {MutationPayload<BuilderDeleteByChatIdData>} payload
			 */
			deleteByIdList: (state, payload) => {
				logger.log('builderModel: deleteByIdList mutation', payload);

				const { messageIdList } = payload.data;
				for (const messageId of messageIdList)
				{
					delete state.collection[messageId];
				}
			},
		},
	};

	module.exports = { builderModel };
});
