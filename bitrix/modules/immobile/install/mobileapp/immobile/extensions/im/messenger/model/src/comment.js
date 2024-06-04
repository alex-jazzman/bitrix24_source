/**
 * @module im/messenger/model/comment
 */
jn.define('im/messenger/model/comment', (require, exports, module) => {
	const { Type } = require('type');
	const { validate } = require('im/messenger/model/validators/comment');
	const { clone } = require('utils/object');
	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('model--comment');

	const LAST_USERS_TO_SHOW = 3;

	const commentState = {
		chatId: 0,
		dialogId: 0,
		lastUserIds: [],
		messageCount: 0,
		messageId: 0,
	};

	/**
	 *
	 * @type {CommentMessengerModel}
	 */
	const commentModel = {
		namespaced: true,
		state: () => ({
			commentCollection: {},
			countersCollection: {},
		}),

		getters: {
			/**
			 * @function commentModel/getByMessageId
			 * @return {CommentInfo}
			 */
			getByMessageId: (state) => (messageId) => {
				return clone(state.commentCollection[messageId]);
			},

			/** @function commentModel/getCommentsCounter */
			getCommentsCounter: (state) => (payload) => {
				const { channelId, commentChatId } = payload;
				if (!state.countersCollection[channelId])
				{
					return 0;
				}

				return state.countersCollection[channelId][commentChatId] ?? 0;
			},

			/**
			 * @function commentModel/getCommentInfoByCommentChatId
			 * @return {CommentInfo | undefined}
			 */
			getCommentInfoByCommentChatId: (state) => (commentChatId) => {
				return Object.values(state.commentCollection).find((comment) => {
					return comment.chatId === commentChatId;
				});
			},

			/**
			 * @function commentModel/getAllCounters
			 * @param state
			 * @return {number}
			 */
			getAllCounters: (state) => () => {
				let result = 0;

				Object.values(state.countersCollection).forEach((counters) => {
					Object.values(counters).forEach((counter) => {
						result += counter;
					});
				});

				return result;
			},

			/**
			 * @function commentModel/getChannelCounters
			 * @param state
			 * @return {number}
			 */
			getChannelCounters: (state) => (channelId) => {
				let result = 0;
				if (!state.countersCollection[channelId])
				{
					return 0;
				}

				Object.values(state.countersCollection[channelId]).forEach((counters) => {
					result += counters;
				});

				return result;
			},

			/**
			 * @function commentModel/getUnreadPostCount
			 * @param state
			 * @return {number}
			 */
			getUnreadPostCount: (state) => (channelId) => {
				let result = 0;
				if (!state.countersCollection[channelId])
				{
					return 0;
				}

				Object.values(state.countersCollection[channelId]).forEach((counters) => {
					if (counters > 0)
					{
						result += 1;
					}
				});

				return result;
			},
		},
		actions: {
			/** @function commentModel/setComments */
			setComments: (store, payload) => {
				if (!Type.isArray(payload))
				{
					payload = [payload];
				}

				const commentList = payload.map((comment) => validate(comment));
				if (commentList.length === 0)
				{
					return;
				}

				store.commit('setComments', {
					actionName: 'setComments',
					data: {
						commentList,
					},
				});
			},

			/** @function commentModel/updateComment */
			updateComment: (store, payload) => {
				if (!store.state.commentCollection[payload.messageId])
				{
					return;
				}

				const commentInfo = clone(store.state.commentCollection[payload.messageId]);
				commentInfo.messageCount = payload.messageCount;

				store.commit('setComments', {
					actionName: 'updateComment',
					data: {
						commentList: [commentInfo],
					},
				});
			},

			/** @function commentModel/setCommentWithCounter */
			setCommentWithCounter: (store, payload) => {
				const comment = validate(payload);

				const { chatCounterMap } = payload;

				if (!store.state.commentCollection[comment.messageId])
				{
					store.commit('setCommentsWithCounters', {
						actionName: 'setCommentWithCounter',
						data: {
							commentList: [comment],
							chatCounterMap,
						},
					});

					return;
				}

				const { newUserId } = payload;
				const { lastUserIds: currentUsers } = clone(store.state.commentCollection[comment.messageId]);

				comment.lastUserIds = getNewLastUsers(newUserId, currentUsers);

				store.commit('setCommentsWithCounters', {
					actionName: 'setCommentWithCounter',
					data: {
						commentList: [comment],
						chatCounterMap,
					},
				});
			},

			/** @function commentModel/setCounters */
			setCounters: (store, payload) => {
				if (!Type.isPlainObject(payload))
				{
					return;
				}

				store.commit('setCounters', {
					actionName: 'setCounters',
					data: {
						chatCounterMap: payload,
					},
				});
			},

			/** @function commentModel/deleteComments */
			deleteComments: (store, payload) => {

				store.commit('deleteComments', {
					actionName: 'deleteComments',
					data: {},
				});
			},
		},
		mutations: {
			/**
			 *
			 * @param state
			 * @param {MutationPayload<CommentsSetCommentsData, CommentsSetCommentsActions>} payload
			 */
			setComments: (state, payload) => {
				logger.log('commentModel setComments mutation', payload);

				payload.data.commentList.forEach((comment) => {
					state.commentCollection[comment.messageId] = {
						...commentState,
						...comment,
					};
				});
			},

			/**
			 *
			 * @param state
			 * @param {MutationPayload<CommentsSetCountersData, CommentsSetCountersActions>} payload
			 */
			setCounters: (state, payload) => {
				logger.log('commentModel setCounters mutation', payload);

				Object.entries(payload.data.chatCounterMap).forEach(([channelChatId, countersMap]) => {
					if (!state.countersCollection[channelChatId])
					{
						state.countersCollection[channelChatId] = {};
					}

					const channelMap = state.countersCollection[channelChatId];
					Object.entries(countersMap).forEach(([commentChatId, counter]) => {
						if (counter === 0)
						{
							delete channelMap[commentChatId];

							return;
						}

						channelMap[commentChatId] = counter;
					});
				});
			},

			setCommentsWithCounters: (state, payload) => {
				logger.log('commentModel setCommentsWithCounters mutation', payload);
				payload.data.commentList.forEach((comment) => {
					state.commentCollection[comment.messageId] = {
						...commentState,
						...comment,
					};
				});

				Object.entries(payload.data.chatCounterMap).forEach(([channelChatId, countersMap]) => {
					if (!state.countersCollection[channelChatId])
					{
						state.countersCollection[channelChatId] = {};
					}

					const channelMap = state.countersCollection[channelChatId];
					Object.entries(countersMap).forEach(([commentChatId, counter]) => {
						if (counter === 0)
						{
							delete channelMap[commentChatId];

							return;
						}

						channelMap[commentChatId] = counter;
					});
				});
			},

			deleteComments: (state, payload) => {
				logger.log('commentModel deleteComments mutation', payload);

				state.commentCollection = {};
			},
		},
	};

	function getNewLastUsers(newUserId, currentUsers)
	{
		if (currentUsers.includes(newUserId))
		{
			return currentUsers;
		}

		if (currentUsers.length < LAST_USERS_TO_SHOW)
		{
			currentUsers.unshift(newUserId);

			return currentUsers;
		}

		currentUsers.pop();
		currentUsers.unshift(newUserId);

		return currentUsers;
	}

	module.exports = { commentModel };
});
