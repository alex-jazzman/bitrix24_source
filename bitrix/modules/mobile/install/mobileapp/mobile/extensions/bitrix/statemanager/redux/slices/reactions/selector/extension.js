/**
 * @module statemanager/redux/slices/reactions/selector
 */
jn.define('statemanager/redux/slices/reactions/selector', (require, exports, module) => {
	const { sliceName, reactionsAdapter } = require('statemanager/redux/slices/reactions/meta');
	const { usersSelector } = require('statemanager/redux/slices/users/selector');
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');

	const reactionsSelector = reactionsAdapter.getSelectors((state) => state[sliceName]);

	const selectReactionKey = (entityType, entityId, reactionId) => {
		return `${entityType}_${entityId}_${reactionId}`;
	};

	const selectReactionByItsId = (state, entityType, entityId, reactionId) => {
		const key = selectReactionKey(entityType, entityId, reactionId);

		return state.entities[key] || null;
	};

	const selectUserReaction = createDraftSafeSelector(
		(state, userId, entityType, entityId) => {
			const reactions = reactionsSelector.selectAll(state);

			return reactions.find((reactionEntry) => reactionEntry.userIds.includes(userId)
				&& reactionEntry.entityType === entityType
				&& reactionEntry.entityId === entityId);
		},
		(reactionEntry) => reactionEntry || null,
	);

	const selectReactionsByEntity = (state, entityId, entityType) => reactionsSelector.selectAll(state).filter(
		(reaction) => reaction.entityId === entityId && reaction.entityType === entityType,
	);

	const selectUsersWithReactions = createDraftSafeSelector(
		(state, entityId, entityType) => {
			const reactions = reactionsSelector.selectAll(state).filter(
				(item) => item.entityId === entityId && item.entityType === entityType,
			);
			const allUsers = usersSelector.selectEntities(state);
			const userIdsWithReactions = reactions.flatMap((reaction) => reaction.userIds);

			return userIdsWithReactions.map((userId) => allUsers[userId]).filter(Boolean);
		},
		(usersWithReactions) => usersWithReactions,
	);

	const selectTotalReactionsCountByEntity = createDraftSafeSelector(
		selectReactionsByEntity,
		(reactions) => reactions.reduce((total, reaction) => total + reaction.userIds.length, 0),
	);

	const selectIsOnlyMyReaction = createDraftSafeSelector(
		[selectReactionsByEntity, (state, entityId, entityType, userId) => userId],
		(reactions, userId) => {
			const allUserIds = reactions.flatMap((reaction) => reaction.userIds);

			return allUserIds.length === 1 && allUserIds[0] === userId;
		},
	);

	const selectReactionsCounterWithoutCurrentUser = createDraftSafeSelector(
		(state, entityId, entityType, currentUserId) => ({
			reactions: selectReactionsByEntity(state, entityId, entityType),
			currentUserId,
		}),
		({ reactions, currentUserId }) => {
			let userReactionFound = false;

			const totalReactions = reactions.reduce((total, reaction) => {
				if (reaction.userIds.includes(currentUserId))
				{
					userReactionFound = true;

					return total;
				}

				return total + reaction.userIds.length;
			}, 0);

			return userReactionFound
				? totalReactions
				: reactions.reduce((total, reaction) => total + reaction.userIds.length, 0);
		},
	);

	const selectIsPositive = createDraftSafeSelector(
		(state, userId, entityId, entityType) => {
			const reactions = reactionsSelector.selectAll(state);

			const foundPositiveReaction = reactions.find((entry) => {
				return entry.positiveUserIds?.includes(userId)
					&& entry.entityType === entityType
					&& entry.entityId === entityId;
			});

			if (!foundPositiveReaction)
			{
				return { foundPositiveReaction: null };
			}

			return { foundPositiveReaction };
		},
		({ foundPositiveReaction }) => {
			return Boolean(foundPositiveReaction);
		},
	);

	const selectIsNegative = createDraftSafeSelector(
		(state, userId, entityId, entityType) => {
			const reactions = reactionsSelector.selectAll(state);

			const foundNegativeReaction = reactions.find((entry) => {
				return entry.negativeUserIds?.includes(userId)
					&& entry.entityType === entityType
					&& entry.entityId === entityId;
			});

			if (!foundNegativeReaction)
			{
				return { foundNegativeReaction: null };
			}

			return { foundNegativeReaction };
		},
		({ foundNegativeReaction }) => {
			return Boolean(foundNegativeReaction);
		},
	);

	const selectPositiveCounter = createDraftSafeSelector(
		selectReactionsByEntity,
		(reactions) => {
			return reactions.reduce((count, reaction) => count + reaction.positiveUserIds.length, 0);
		},
	);

	const selectNegativeCounter = createDraftSafeSelector(
		selectReactionsByEntity,
		(reactions) => {
			return reactions.reduce((count, reaction) => count + reaction.negativeUserIds.length, 0);
		},
	);

	const {
		selectAll,
		selectById,
	} = reactionsSelector;

	module.exports = {
		reactionsSelector,
		selectReactionByItsId,
		selectReactionKey,
		selectUserReaction,
		selectReactionsByEntity,
		selectUsersWithReactions,
		selectTotalReactionsCountByEntity,
		selectReactionsCounterWithoutCurrentUser,
		selectIsOnlyMyReaction,

		selectIsPositive,
		selectIsNegative,
		selectPositiveCounter,
		selectNegativeCounter,

		selectAll,
		selectById,
	};
});
