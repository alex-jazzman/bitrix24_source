(() => {
	const require = (ext) => jn.require(ext);

	const { describe, it, expect, beforeEach, afterEach } = require('testing');
	const { ReactionPack, OrderType } = require('layout/ui/reaction/picker');
	const { ReactionIcon } = require('ui-system/blocks/reaction/icon');
	const { Type } = require('type');
	const { ReactionStorageManager } = require('layout/ui/reaction/service/storage');

	const mockReactions = [
		{ id: 'like', name: 'like' },
		{ id: 'laugh', name: 'laugh' },
		{ id: 'angry', name: 'angry' },
		{ id: 'cry', name: 'cry' },
		{ id: 'wow', name: 'wow' },
	];

	function putLikeFirstLocal(arr)
	{
		const likeIndex = arr.findIndex((r) => r.id === 'like');
		if (likeIndex <= 0)
		{
			return arr;
		}

		const result = [...arr];
		const [like] = result.splice(likeIndex, 1);
		result.unshift(like);

		return result;
	}

	describe('ReactionPack.getPackByReactionIds', () => {
		beforeEach(() => {
			ReactionStorageManager.getFromCache = () => ({});
			ReactionStorageManager.get = () => Promise.resolve({});
			ReactionStorageManager.isEmptyObject = (obj) => Object.keys(obj).length === 0;
		});

		it('returns ReactionPack.ALL when source is null', () => {
			const all = ReactionIcon.getPackForReactionPicker();

			const result = ReactionPack.getPackByReactionIds(null);

			const expected = putLikeFirstLocal(all);

			expect(result.map((r) => r.id)).toEqual(expected.map((r) => r.id));
		});

		it('accepts ReactionPack instance as source', () => {
			const pack = ReactionPack.BASIC;
			const result = ReactionPack.getPackByReactionIds(pack);

			expect(result.length).toBe(pack.getValue().length);
		});

		it('filters reaction ids', () => {
			const result = ReactionPack.getPackByReactionIds(['like', 'angry']);
			expect(result.map((r) => r.id)).toEqual(['like', 'angry']);
		});

		it('ignores reaction ids that do not exist in ReactionIcon pack', () => {
			// add a non-existent 'he-he-he' reaction
			const ids = ['like', 'he-he-he', 'angry'];

			const result = ReactionPack.getPackByReactionIds(ids);

			expect(result.map((r) => r.id)).toEqual(['like', 'angry']);
		});

		it('keeps original order when order is OrderType.PRESERVE', () => {
			const ids = ['angry', 'like', 'cry'];
			const result = ReactionPack.getPackByReactionIds(ids, OrderType.PRESERVE);

			expect(result.map((r) => r.id)).toEqual(ids);
		});

		it('caches used stats when order is OrderType.CURRENT_USER_FAVORITES', () => {
			ReactionStorageManager.getFromCache = () => ({ laugh: 10 });
			ReactionStorageManager.isEmptyObject = () => false;

			const result = ReactionPack.getPackByReactionIds(
				['like', 'laugh', 'angry'],
				OrderType.CURRENT_USER_FAVORITES,
			);

			expect(result[0].id).toBe('like');
			expect(result[1].id).toBe('laugh');
		});

		it('triggers async branch when cache empty and order is OrderType.CURRENT_USER_FAVORITES', async () => {
			ReactionStorageManager.getFromCache = () => ({});
			ReactionStorageManager.isEmptyObject = () => true;
			ReactionStorageManager.get = () => Promise.resolve({ wow: 5 });

			const result = await ReactionPack.getPackByReactionIds(
				['like', 'angry'],
				OrderType.CURRENT_USER_FAVORITES,
			);

			expect(result.map((r) => r.id)).toEqual(['like', 'angry']);
		});

		it('does not force-add "like" first when forceIncludeLike is false', () => {
			const result = ReactionPack.getPackByReactionIds(
				['angry'],
				OrderType.DEFAULT,
				false,
				false,
			);

			expect(result.map((r) => r.id)).toEqual(['angry']);
		});
	});

	describe('ReactionPack.getCurrentUserFavouritePack', () => {
		const originalGetPack = ReactionIcon.getPackForReactionPicker;

		beforeEach(() => {
			ReactionIcon.getPackForReactionPicker = () => mockReactions;
			ReactionStorageManager.get = () => Promise.resolve({});
			Type.isArrayFilled = (arr) => Array.isArray(arr) && arr.length > 0;
		});
		afterEach(() => {
			ReactionIcon.getPackForReactionPicker = originalGetPack;
		});

		it('returns [] when quantity <= 0', async () => {
			expect(await ReactionPack.getCurrentUserFavouritePack(0)).toEqual([]);
			expect(await ReactionPack.getCurrentUserFavouritePack(-5)).toEqual([]);
		});

		it('fills list if stats empty', async () => {
			const result = await ReactionPack.getCurrentUserFavouritePack(3);
			expect(result.length).toBe(3);
		});

		it('uses stats for sorting', async () => {
			ReactionStorageManager.get = () => Promise.resolve({ wow: 100 });

			const result = await ReactionPack.getCurrentUserFavouritePack(3);

			expect(result[0].id).toBe('like');
			expect(result[1].id).toBe('wow');
		});

		it('does not force-add "like" first when forceIncludeLike is false', async () => {
			ReactionStorageManager.get = () => Promise.resolve({ angry: 33 });

			const result = await ReactionPack.getCurrentUserFavouritePack(1, false);

			expect(result[0].id).not.toBe('like');
			expect(result[0].id).toBe('angry');
		});

		it('inserts "like" first when absent and forceIncludeLike is true', async () => {
			ReactionStorageManager.get = () => Promise.resolve({ angry: 33 });

			const result = await ReactionPack.getCurrentUserFavouritePack(1, true);

			expect(result[0].id).toBe('like');
		});
	});

	describe('ReactionPack.getCurrentUserFavoritePackFromCache', () => {
		const originalGetPack = ReactionIcon.getPackForReactionPicker;

		beforeEach(() => {
			ReactionIcon.getPackForReactionPicker = () => mockReactions;
			ReactionStorageManager.isEmptyObject = (obj) => Object.keys(obj).length === 0;
		});
		afterEach(() => {
			ReactionIcon.getPackForReactionPicker = originalGetPack;
		});

		it('returns [] when cache empty', () => {
			ReactionStorageManager.getFromCache = () => ({});

			const result = ReactionPack.getCurrentUserFavoritePackFromCache(5);

			expect(result).toEqual([]);
		});

		it('sorts by cached stats', () => {
			ReactionStorageManager.getFromCache = () => ({ cry: 100 });
			ReactionStorageManager.isEmptyObject = () => false;

			const result = ReactionPack.getCurrentUserFavoritePackFromCache(3);

			expect(result[0].id).toBe('like');
			expect(result[1].id).toBe('cry');
		});

		it('applies limit', () => {
			ReactionStorageManager.getFromCache = () => ({
				wow: 5, angry: 10, laugh: 7,
			});
			ReactionStorageManager.isEmptyObject = () => false;

			const result = ReactionPack.getCurrentUserFavoritePackFromCache(2);

			expect(result.length).toBe(2);
		});

		it('does not force-add "like" first when it is absent and forceIncludeLike is false', () => {
			ReactionStorageManager.getFromCache = () => ({ wow: 10 });
			ReactionStorageManager.isEmptyObject = () => false;

			const result = ReactionPack.getCurrentUserFavoritePackFromCache(1, false);

			expect(result[0].id).toBe('wow');
		});
	});
})();
