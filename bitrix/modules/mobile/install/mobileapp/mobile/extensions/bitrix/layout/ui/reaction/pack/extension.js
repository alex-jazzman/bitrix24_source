/**
 * @module layout/ui/reaction/pack
 */
jn.define('layout/ui/reaction/pack', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');
	const { OrderType, DEFAULT_REACTION } = require('layout/ui/reaction/const');
	const { ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const { ReactionStorageManager } = require('layout/ui/reaction/service/storage');
	const { Type } = require('type');
	const TOP_COUNT = 5;
	const TOP_WEIGHT = 2;

	class ReactionPack extends BaseEnum
	{
		static ALL = new ReactionPack('ALL', ReactionIcon.getPackForReactionPicker());

		static VOTE = new ReactionPack('VOTE', [
			ReactionIcon.LIKE.getValue(),
			ReactionIcon.DISLIKE.getValue(),
		]);

		static BASIC = new ReactionPack('BASIC', [
			ReactionIcon.LIKE.getValue(),
			ReactionIcon.KISS.getValue(),
			ReactionIcon.LAUGH.getValue(),
			ReactionIcon.WONDER.getValue(),
			ReactionIcon.CRY.getValue(),
			ReactionIcon.ANGRY.getValue(),
			ReactionIcon.FACEPALM.getValue(),
		]);

		static QUICK = new ReactionPack('QUICK', [
			ReactionIcon.LIKE.getValue(),
			ReactionIcon.FACE_WITH_TEARS_OF_JOY.getValue(),
			ReactionIcon.RED_HEART.getValue(),
			ReactionIcon.WONDER.getValue(),
			ReactionIcon.FIRE.getValue(),
			ReactionIcon.CRY.getValue(),
		]);

		static BRAINSTORM = new ReactionPack('BRAINSTORM', [
			ReactionIcon.LIKE.getValue(),
			ReactionIcon.DISLIKE.getValue(),
			ReactionIcon.QUESTION_MARK.getValue(),
			ReactionIcon.EXCLAMATION_MARK.getValue(),
			ReactionIcon.LIGHT_BULB.getValue(),
		]);

		/**
		 * @param {Array<string>|ReactionPack|{ids:Array<string>}} [source=ReactionPack.ALL]
		 * @param {String} [order=OrderType.DEFAULT]
		 * @param {boolean} [setPngPadding=false]
		 * @returns {Promise<Array<Object>> | Array<Object>}
		 */
		static getPackByReactionIds(source, order = OrderType.DEFAULT, setPngPadding = false)
		{
			const ids = ReactionPack.#normalizeIds(source ?? ReactionPack.#getAllPack(setPngPadding));
			const allReactions = ReactionPack.#getAllPack(setPngPadding)?.getValue();

			const allowed = new Set(ids);
			const filtered = allReactions.filter(({ id }) => allowed.has(id));

			const result = ReactionPack.#sortByOrder(order, setPngPadding, filtered, ids);

			if (result instanceof Promise)
			{
				return result.then((reactions) => ReactionPack.#putLikeFirst(reactions));
			}

			return ReactionPack.#putLikeFirst(result);
		}

		/**
		 * @static
		 * @param {number} quantity
		 * @param {boolean} [forceIncludeLike=true]
		 * @param {boolean} [setPngPadding=false]
		 * @returns {Promise<Array<Object>>}
		 */
		static async getCurrentUserFavouritePack(quantity, forceIncludeLike = true, setPngPadding = false)
		{
			const stats = await ReactionStorageManager.get?.() ?? {};

			return ReactionPack.#getUserFavoritePack(quantity, forceIncludeLike, stats, setPngPadding);
		}

		static getCurrentUserFavoritePackFromCache(quantity, forceIncludeLike = true, setPngPadding = false)
		{
			const cachedStats = ReactionStorageManager.getFromCache() ?? {};

			if (ReactionStorageManager.isEmptyObject(cachedStats))
			{
				void ReactionStorageManager.syncCacheWithServer();

				return [];
			}

			return ReactionPack.#getUserFavoritePack(quantity, forceIncludeLike, cachedStats, setPngPadding);
		}

		static #getUserFavoritePack(quantity, forceIncludeLike, stats, setPngPadding)
		{
			if (!quantity || quantity <= 0)
			{
				return [];
			}

			const allReactions = ReactionIcon.getPackForReactionPicker(setPngPadding) ?? [];

			if (!Type.isArrayFilled(allReactions))
			{
				return [];
			}

			const limit = Math.min(quantity, allReactions.length);
			const byUser = ReactionPack.#computeTopReactions(allReactions, stats, limit);
			const missing = limit - byUser.length;
			let result = (missing > 0)
				? [...byUser, ...ReactionPack.#getFillReactions(allReactions, byUser, missing)]
				: byUser;

			const hasLike = result.some((reaction) => reaction.id === DEFAULT_REACTION);

			if (hasLike)
			{
				return ReactionPack.#putLikeFirst(result);
			}

			if (forceIncludeLike)
			{
				const likeReaction = allReactions.find((reaction) => reaction.id === DEFAULT_REACTION);
				if (likeReaction)
				{
					result.unshift(likeReaction);
					if (result.length > limit)
					{
						result = result.slice(0, limit);
					}
				}

				return ReactionPack.#putLikeFirst(result);
			}

			return result;
		}

		static #computeTopReactions(allReactions, stats, limit)
		{
			const indexMap = new Map(allReactions.map((reaction, i) => [reaction.id, i]));

			return allReactions
				.map((reaction) => {
					const base = ((indexMap.get(reaction.id) ?? 0) < TOP_COUNT) ? TOP_WEIGHT : 0;
					const score = base + (stats[reaction.id] ?? 0);

					return { reaction, score };
				})
				.filter(({ score }) => score > 0)
				.sort((a, b) => b.score - a.score)
				.map(({ reaction }) => reaction)
				.slice(0, limit);
		}

		/**
		 * @param {String} order
		 * @param {Boolean} setPngPadding
		 * @param {Array<Object>} [reactions=[]]
		 * @param {Array<string>} [ids=[]]
		 * @returns {Array<Object>|Promise<Array<Object>>}
		 */
		static #sortByOrder(order, setPngPadding, reactions = [], ids = [])
		{
			if (order === OrderType.PRESERVE && ids.length > 0)
			{
				return ids
					.map((id) => reactions.find((reaction) => reaction.id === id))
					.filter(Boolean);
			}

			if (order === OrderType.CURRENT_USER_FAVORITES)
			{
				const cachedStats = ReactionStorageManager.getFromCache() ?? {};

				if (ReactionStorageManager.isEmptyObject(cachedStats))
				{
					void ReactionStorageManager.syncCacheWithServer();

					return Promise.resolve(ReactionStorageManager.get?.() ?? {}).then((stats) => {
						return ReactionPack.#sortByCurrentUserFavorites(stats, setPngPadding, reactions);
					});
				}

				return ReactionPack.#sortByCurrentUserFavorites(cachedStats, setPngPadding, reactions);
			}

			return reactions;
		}

		static #sortByCurrentUserFavorites(stats, setPngPadding, reactions)
		{
			const allReactions = ReactionIcon.getPackForReactionPicker(setPngPadding) ?? [];

			const indexMap = new Map(allReactions.map((reaction, i) => [reaction.id, i]));
			reactions.sort((a, b) => {
				const baseA = ((indexMap.get(a.id) ?? 0) < TOP_COUNT) ? TOP_WEIGHT : 0;
				const baseB = ((indexMap.get(b.id) ?? 0) < TOP_COUNT) ? TOP_WEIGHT : 0;
				const scoreA = baseA + (stats?.[a.id] ?? 0);
				const scoreB = baseB + (stats?.[b.id] ?? 0);

				return scoreB - scoreA;
			});

			return reactions;
		}

		static #getFillReactions(allReactions, selected, count)
		{
			const usedIds = new Set(selected.map((reaction) => reaction.id));
			const indexMap = new Map(allReactions.map((reaction, i) => [reaction.id, i]));

			return allReactions
				.filter((reaction) => !usedIds.has(reaction.id))
				.sort((a, b) => (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0))
				.slice(0, count);
		}

		static #putLikeFirst(reactions)
		{
			const likeIndex = reactions.findIndex((reaction) => reaction.id === DEFAULT_REACTION);
			if (likeIndex > 0)
			{
				const [like] = reactions.splice(likeIndex, 1);
				reactions.unshift(like);
			}

			return reactions;
		}

		static #getAllPack(setPngPadding = false)
		{
			return new ReactionPack('ALL', ReactionIcon.getPackForReactionPicker(setPngPadding));
		}

		static #normalizeIds(source)
		{
			if (Type.isArray(source))
			{
				return source;
			}

			if (source instanceof ReactionPack)
			{
				return source.getValue?.().map((reaction) => reaction.name ?? reaction.id) ?? [];
			}

			return [];
		}
	}

	module.exports = {
		ReactionPack,
	};
});
