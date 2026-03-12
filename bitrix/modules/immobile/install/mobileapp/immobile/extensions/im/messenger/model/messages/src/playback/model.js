/* eslint-disable no-param-reassign */
/**
 * @module im/messenger/model/messages/playback/model
 */
jn.define('im/messenger/model/messages/playback/model', (require, exports, module) => {
	const { Type } = require('type');

	const { playbackDefaultElement } = require('im/messenger/model/messages/playback/default-element');
	const { validatePlayback } = require('im/messenger/model/messages/playback/validator');

	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('model--messages-playback');

	/** @type {PlaybackMessengerModel} */
	const playbackModel = {
		namespaced: true,
		state: () => ({
			collection: {},
		}),
		getters: {
			/**
			 * @function messagesModel/playbackModel/getPlayback
			 * @param state
			 * @return {PlaybackModelState}
			 */
			getPlayback: (state) => (dialogId, messageId) => {
				return state.collection[dialogId]?.[messageId] || playbackDefaultElement;
			},
		},
		actions: {
			/**
			 * @function messagesModel/playbackModel/set
			 * @param store
			 * @param {PlaybackModelSetPayload} payload
			 */
			set: (store, payload) => {
				const { dialogId, messageId } = payload;

				const isValidDialogId = Type.isNumber(dialogId) || Type.isStringFilled(dialogId);
				const isValidMessageId = Type.isNumber(messageId) || Type.isStringFilled(messageId);
				if (!isValidDialogId || !isValidMessageId)
				{
					return;
				}

				const existingPlayback = store.state.collection[dialogId]?.[messageId];

				if (existingPlayback)
				{
					store.commit('update', {
						actionName: 'set',
						data: {
							messageId,
							dialogId,
							playback: {
								...existingPlayback,
								...validatePlayback(payload),
							},
						},
					});

					return;
				}

				store.commit('add', {
					actionName: 'set',
					data: {
						messageId,
						dialogId,
						playback: {
							...playbackDefaultElement,
							...validatePlayback(payload),
						},
					},
				});
			},

			/**
			 * @function messagesModel/playbackModel/update
			 * @param store
			 * @param {PlaybackModelUpdatePayload} payload
			 */
			update: (store, payload) => {
				const { dialogId, messageId } = payload;

				const isValidDialogId = Type.isNumber(dialogId) || Type.isStringFilled(dialogId);
				const isValidMessageId = Type.isNumber(messageId) || Type.isStringFilled(messageId);
				if (!isValidDialogId || !isValidMessageId)
				{
					return;
				}

				const existingPlayback = store.state.collection[dialogId]?.[messageId];
				if (!existingPlayback)
				{
					return;
				}

				if (!isValidDialogId || !isValidMessageId)
				{
					return;
				}

				store.commit('update', {
					actionName: 'update',
					data: {
						messageId,
						dialogId,
						playback: {
							...existingPlayback,
							...validatePlayback(payload),
						},
					},
				});
			},

			/**
			 * @function messagesModel/playbackModel/delete
			 * @param store
			 * @param {PlaybackModelDeletePayload} payload
			 */
			delete: (store, payload) => {
				const { dialogId, messageId } = payload;

				store.commit('delete', {
					actionName: 'delete',
					data: {
						messageId,
						dialogId,
					},
				});
			},
		},
		mutations: {
			/**
			 * @param state
			 * @param {MutationPayload<PlaybackAddData, PlaybackAddActions>} payload
			 */
			add: (state, payload) => {
				logger.log('playbackModel: set mutation', payload);

				const { messageId, dialogId, playback } = payload.data;

				const collectionByDialog = state.collection[dialogId];
				if (Type.isNil(collectionByDialog))
				{
					state.collection[dialogId] = {
						[messageId]: playback,
					};
				}
				else
				{
					collectionByDialog[messageId] = playback;
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<PlaybackUpdateData, PlaybackUpdateActions>} payload
			 */
			update: (state, payload) => {
				logger.log('playbackModel: update mutation', payload);

				const { messageId, dialogId, playback } = payload.data;

				const collectionByDialog = state.collection[dialogId];
				collectionByDialog[messageId] = playback;
			},

			/**
			 * @param state
			 * @param {MutationPayload<PlaybackDeleteData, PlaybackDeleteActions>} payload
			 */
			delete: (state, payload) => {
				logger.log('playbackModel: delete mutation', payload);

				const { messageId, dialogId } = payload.data;

				delete state.collection[dialogId]?.[messageId];
			},
		},
	};

	module.exports = { playbackModel };
});
