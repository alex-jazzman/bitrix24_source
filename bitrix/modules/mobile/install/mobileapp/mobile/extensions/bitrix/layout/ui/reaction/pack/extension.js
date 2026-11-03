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
		 * @param {String} [primaryReactionId] main reaction pinned first. Force-inserted only when
		 *   explicitly passed; omitted keeps the requested ids intact (only reorders "like" first
		 *   when it is already present), so arbitrary packs behave as before the feature.
		 * @returns {Promise<Array<Object>> | Array<Object>}
		 */
		static getPackByReactionIds(source, order = OrderType.DEFAULT, setPngPadding = false, primaryReactionId = null)
		{
			const ids = ReactionPack.#normalizeIds(source ?? ReactionPack.#getAllPack(setPngPadding));
			const allReactions = ReactionPack.#getAllPack(setPngPadding)?.getValue();

			const allowed = new Set(ids);
			const filtered = allReactions.filter(({ id }) => allowed.has(id));

			const result = ReactionPack.#sortByOrder(order, setPngPadding, filtered, ids);

			const forceIncludePrimary = Type.isStringFilled(primaryReactionId);

			if (result instanceof Promise)
			{
				return result.then((reactions) => ReactionPack.#ensurePrimaryFirst(reactions, primaryReactionId, allReactions, forceIncludePrimary));
			}

			if (order !== OrderType.PRESERVE)
			{
				return ReactionPack.#ensurePrimaryFirst(result, primaryReactionId, allReactions, forceIncludePrimary);
			}

			return result;
		}

		/**
		 * @static
		 * @param {number} quantity
		 * @param {boolean} [forceIncludePrimary=true]
		 * @param {boolean} [setPngPadding=false]
		 * @param {String} [primaryReactionId=DEFAULT_REACTION]
		 * @returns {Promise<Array<Object>>}
		 */
		static async getCurrentUserFavouritePack(quantity, forceIncludePrimary = true, setPngPadding = false, primaryReactionId = DEFAULT_REACTION)
		{
			const stats = await ReactionStorageManager.get?.() ?? {};

			return ReactionPack.#prepareUserFavorites(quantity, forceIncludePrimary, stats, setPngPadding, primaryReactionId);
		}

		static getCurrentUserFavoritePackFromCache(quantity, forceIncludePrimary = true, setPngPadding = false, primaryReactionId = DEFAULT_REACTION)
		{
			const cachedStats = ReactionStorageManager.getFromCache() ?? {};

			if (ReactionStorageManager.isEmptyObject(cachedStats))
			{
				void ReactionStorageManager.syncCacheWithServer();

				return [];
			}

			return ReactionPack.#prepareUserFavorites(quantity, forceIncludePrimary, cachedStats, setPngPadding, primaryReactionId);
		}

		static #prepareUserFavorites(quantity, forceIncludePrimary, stats, setPngPadding, primaryReactionId = DEFAULT_REACTION)
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

			let topReactions = ReactionPack.#computeTopReactions(allReactions, stats, limit);

			const missing = limit - topReactions.length;
			if (missing > 0)
			{
				topReactions = [
					...topReactions,
					...ReactionPack.#getFillReactions(allReactions, topReactions, missing),
				];
			}

			return ReactionPack.#ensurePrimaryFirst(topReactions, primaryReactionId, allReactions, forceIncludePrimary, limit);
		}

		static #computeTopReactions(allReactions, stats, limit)
		{
			const indexMap = new Map(allReactions.map((r, i) => [r.id, i]));

			return allReactions
				.map((reaction) => ({
					reaction,
					score: ReactionPack.#getReactionScore(reaction.id, stats, indexMap),
				}))
				.filter(({ score }) => score > 0)
				.sort((a, b) => b.score - a.score)
				.map(({ reaction }) => reaction)
				.slice(0, limit);
		}

		static #getReactionScore(id, stats, indexMap)
		{
			const base = ((indexMap.get(id) ?? 0) < TOP_COUNT) ? TOP_WEIGHT : 0;

			return base + (stats?.[id] ?? 0);
		}

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
			const indexMap = new Map(allReactions.map((r, i) => [r.id, i]));

			reactions.sort((a, b) => {
				const scoreA = ReactionPack.#getReactionScore(a.id, stats, indexMap);
				const scoreB = ReactionPack.#getReactionScore(b.id, stats, indexMap);

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

		static #ensurePrimaryFirst(reactions, primaryId = DEFAULT_REACTION, allReactions = null, forceIncludePrimary = true, limit = null)
		{
			const primaryReactionId = ReactionPack.#resolvePrimaryReactionId(primaryId, allReactions);

			const hasPrimary = reactions.some((r) => r.id === primaryReactionId);

			if (!hasPrimary && forceIncludePrimary && allReactions)
			{
				const primaryReaction = allReactions.find((r) => r.id === primaryReactionId);
				if (primaryReaction)
				{
					reactions.unshift(primaryReaction);
					if (limit)
					{
						reactions.splice(limit);
					}
				}
			}

			const primaryIndex = reactions.findIndex((r) => r.id === primaryReactionId);
			if (primaryIndex > 0)
			{
				const [primary] = reactions.splice(primaryIndex, 1);
				reactions.unshift(primary);
			}

			return reactions;
		}

		/**
		 * @desc Resolves the primary reaction id: falls back to DEFAULT_REACTION when it is empty
		 * or absent from the available reactions.
		 * @param {String} primaryId
		 * @param {Array<Object>|null} allReactions
		 * @returns {String}
		 */
		static #resolvePrimaryReactionId(primaryId, allReactions)
		{
			if (!Type.isStringFilled(primaryId))
			{
				return DEFAULT_REACTION;
			}

			if (Type.isArrayFilled(allReactions) && !allReactions.some((r) => r.id === primaryId))
			{
				return DEFAULT_REACTION;
			}

			return primaryId;
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
