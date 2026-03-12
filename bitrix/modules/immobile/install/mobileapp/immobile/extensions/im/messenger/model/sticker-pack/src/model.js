/**
 * @module im/messenger/model/sticker-pack/model
 */
jn.define('im/messenger/model/sticker-pack/model', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');
	const { uniqBy } = require('utils/array');

	const {
		normalizeStickerPack,
		normalizeSticker,
		normalizeRecentSticker,
	} = require('im/messenger/model/sticker-pack/normalizer');

	const {
		stickerDefaultElement,
		packDefaultElement,
		recentStickerDefaultElement,
	} = require('im/messenger/model/sticker-pack/default-element');

	const createPackKey = (packId, packType) => {
		return `${packType}:${packId}`;
	};

	const createStickerKey = (stickerId, packId, packType) => {
		return `${stickerId}:${packType}:${packId}`;
	};

	const RECENT_STICKERS_SIZE = 12;

	/**
	 * @type {StickerPackMessengerModel}
	 */
	const stickerPackModel = {
		namespaced: true,
		state: () => ({
			stickerCollection: new Map(),
			packCollection: new Map(),
			currentPacks: new Set(),
			recentCollection: [],
			isCurrentStickersLoaded: false,
			hasNextPage: false,
			shouldClearState: false,
		}),
		getters: {
			/**
			 * @function stickerPackModel/isCurrentStickersLoaded
			 * @return {Boolean}
			 */
			isCurrentStickersLoaded: (state) => () => {
				return state.isCurrentStickersLoaded;
			},

			/**
			 * @function stickerPackModel/isPackLoaded
			 * @return {Boolean}
			 */
			isPackLoaded: (state) => (packId, packType) => {
				const packKey = createPackKey(packId, packType);

				return state.packCollection.has(packKey);
			},

			/**
			 * @function stickerPackModel/getPack
			 * @return {StickerPackState}
			 */
			getPack: (state) => (packId, packType) => {
				const packKey = createPackKey(packId, packType);

				return state.packCollection.get(packKey);
			},

			/**
			 * @function stickerPackModel/getPackStickers
			 * @return {Array<StickerState>}
			 */
			getPackStickers: (state) => (packId, packType) => {
				return [...state.stickerCollection.values()]
					.filter((sticker) => sticker.packId === packId && sticker.packType === packType)
					.sort((sticker1, sticker2) => sticker1.sort - sticker2.sort)
				;
			},

			/**
			 * @function stickerPackModel/getAllStickers
			 * @return {{recentStickers: Array<StickerState>, packs: Array<PackWithStickers>, hasNextPage: boolean}}
			 */
			getAllStickers: (state, getters) => () => {
				const packList = [...state.currentPacks.values()]
					.map((packKey) => state.packCollection.get(packKey))
				;

				const packs = preparePackListResult(state.stickerCollection, packList);

				return {
					recentStickers: state.recentCollection
						.map((recentItem) => getters.getStickerData(recentItem))
						.filter(Boolean),
					packs,
					hasNextPage: state.hasNextPage,
				};
			},

			/**
			 * @function stickerPackModel/getPageByPacks
			 */
			getPageByPacks: (state) => (rawPack) => {
				const packList = rawPack
					.map((pack) => {
						const packKey = createPackKey(pack.id, pack.type);

						return state.packCollection.get(packKey);
					})
				;
				const packs = preparePackListResult(state.stickerCollection, packList);

				return {
					packs,
					hasNextPage: state.hasNextPage,
				};
			},

			/**
			 * @function stickerPackModel/getStickerData
			 * @return {StickerState | null}
			 */
			getStickerData: (state) => ({ id, packId, packType }) => {
				const stickerKey = createStickerKey(id, packId, packType);

				const sticker = state.stickerCollection.get(stickerKey);

				if (Type.isNil(sticker))
				{
					return null;
				}

				return sticker;
			},

			/**
			 * @function stickerPackModel/shouldClearState
			 * @return {boolean}
			 */
			shouldClearState: (state) => () => {
				return state.shouldClearState;
			},
		},
		actions: {
			/**
			 * @function stickerPackModel/clearCurrentState
			 * @param commit
			 */
			clearCurrentState: ({ commit }) => {
				commit('clearCurrentState', {
					actionName: 'clearCurrentState',
					data: {},
				});
			},

			/**
			 * @function stickerPackModel/markForClear
			 * @param commit
			 */
			markForClear: ({ commit }) => {
				commit('markForClear', {
					actionName: 'markForClear',
					data: {},
				});
			},

			/**
			 * @function stickerPackModel/setState
			 * @param commit
			 * @param {StickerPackActionParams['stickerPackModel/setState']} payload
			 */
			setState: ({ commit }, payload) => {
				if (!Type.isArrayFilled(payload.packs) && !Type.isArrayFilled(payload.recentStickers))
				{
					return;
				}
				const {
					packs,
					stickers,
					recentStickers,
					hasNextPage,
				} = payload;

				/** @type {Partial<StickerPackSetStateData>} */
				const data = {
					hasNextPage: Boolean(hasNextPage),
				};

				if (Type.isArrayFilled(packs))
				{
					data.packs = packs.map((pack) => ({
						...packDefaultElement,
						...normalizeStickerPack(pack),
					}));
				}

				if (Type.isArrayFilled(stickers))
				{
					data.stickers = stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}));
				}

				if (Type.isArrayFilled(recentStickers))
				{
					data.recentStickers = recentStickers.map((recentSticker) => ({
						...recentStickerDefaultElement,
						...normalizeRecentSticker(recentSticker),
					}));
				}

				if (isEmpty(data))
				{
					return;
				}

				commit('setState', {
					actionName: 'setState',
					data,
				});
			},

			/**
			 * @function stickerPackModel/setPage
			 * @param commit
			 * @param {StickerPackTailResult} payload
			 */
			setPage: ({ commit, getters }, payload) => {
				const {
					packs,
					stickers,
					hasNextPage,
				} = payload;

				/** @type {Partial<StickerPackSetStateData>} */
				const data = {
					hasNextPage: Boolean(hasNextPage),
				};

				if (Type.isArrayFilled(packs))
				{
					data.packs = packs.map((pack) => ({
						...packDefaultElement,
						...normalizeStickerPack(pack),
					}));
				}

				if (Type.isArrayFilled(stickers))
				{
					data.stickers = stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}));
				}

				commit('setState', {
					actionName: 'setPage',
					data,
				});

				return getters.getPageByPacks(data.packs);
			},

			/**
			 * @function stickerPackModel/setPack
			 * @param store
			 * @param {StickerPackActionParams['stickerPackModel/setPack']} payload
			 */
			setPack: ({ commit }, payload) => {
				const { pack, stickers } = payload;
				/** @type {StickerPackSetPackData} */
				const data = {
					shouldClearStoredStickers: true,
				};

				if (Type.isPlainObject(pack))
				{
					data.pack = {
						...packDefaultElement,
						...normalizeStickerPack(pack),
					};
				}

				if (Type.isArrayFilled(stickers))
				{
					data.stickers = stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}));
				}

				commit('setPack', {
					actionName: 'setPack',
					data,
				});
			},

			/**
			 * @function stickerPackModel/createPack
			 * @param store
			 * @param {StickerPackActionParams['stickerPackModel/createPack']} payload
			 */
			createPack: async (store, payload) => {
				const { pack, stickers } = payload;
				/** @type {StickerPackSetPackData} */
				const data = {};

				if (Type.isPlainObject(pack))
				{
					data.pack = {
						...packDefaultElement,
						...normalizeStickerPack(pack),
						isAdded: true,
					};
				}

				if (Type.isArrayFilled(stickers))
				{
					data.stickers = stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}));
				}

				store.commit('createPack', {
					actionName: 'createPack',
					data,
				});
			},

			/**
			 * @function stickerPackModel/linkPack
			 * @param store
			 * @param payload
			 */
			linkPack: (store, payload) => {
				const { pack, stickers } = payload;

				const data = {};

				if (Type.isPlainObject(pack))
				{
					data.pack = {
						...packDefaultElement,
						...normalizeStickerPack(pack),
						isAdded: true,
					};
				}

				if (Type.isArrayFilled(stickers))
				{
					data.stickers = stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}));
				}

				store.commit('createPack', {
					actionName: 'linkPack',
					data,
				});
			},

			/**
			 * @function stickerPackModel/deletePack
			 * @param commit
			 * @param {StickerPackActionParams['stickerPackModel/deletePack']} payload
			 */
			deletePack: ({ commit }, payload) => {
				const { packId, packType } = payload;

				commit('deletePack', {
					actionName: 'deletePack',
					data: {
						packId,
						packType,
					},
				});
			},

			/**
			 * @function stickerPackModel/unlinkPack
			 * @param store
			 * @param payload
			 */
			unlinkPack: (store, payload) => {
				const { packId, packType } = payload;

				const key = createPackKey(packId, packType);
				const packData = store.state.packCollection.get(key);
				if (Type.isNil(packData))
				{
					return;
				}

				store.commit('setPack', {
					actionName: 'unlinkPack',
					data: {
						pack: {
							...packData,
							isAdded: false,
						},
					},
				});
			},

			/**
			 * @function stickerPackModel/addStickers
			 * @param commit
			 * @param payload
			 */
			addStickers: ({ commit }, payload) => {
				const { stickers } = payload;
				if (!Type.isArrayFilled(stickers))
				{
					return;
				}

				commit('addStickers', {
					actionName: 'addStickers',
					data: {
						stickers: stickers.map((sticker) => ({
							...stickerDefaultElement,
							...normalizeSticker(sticker),
						})),
					},
				});
			},

			/**
			 * @function stickerPackModel/renamePack
			 * @param commit
			 * @param getters
			 * @param payload
			 */
			renamePack: ({ commit, getters }, payload) => {
				const { packId, packType, name } = payload;
				const pack = getters.getPack(packId, packType);
				if (Type.isNil(pack))
				{
					return;
				}

				commit('setPack', {
					actionName: 'renamePack',
					data: {
						pack: {
							...pack,
							name,
						},
					},
				});
			},

			/**
			 * @function stickerPackModel/deleteStickers
			 * @param commit
			 * @param state
			 * @param payload
			 */
			deleteStickers: ({ commit, state }, payload) => {
				const { packId, packType, ids } = payload;
				if (!Type.isArrayFilled(ids))
				{
					return;
				}

				commit('deleteStickers', {
					actionName: 'deleteStickers',
					data: {
						packId,
						packType,
						ids,
					},
				});
			},

			/**
			 * @function stickerPackModel/addRecentSticker
			 * @param store
			 * @param {StickerPackActionParams['stickerPackModel/addRecentSticker']} payload
			 */
			addRecentSticker: ({ commit }, payload) => {
				const recentStickerData = {
					...recentStickerDefaultElement,
					...normalizeRecentSticker(payload),
				};

				commit('addRecentSticker', {
					actionName: 'addRecentSticker',
					data: {
						recentSticker: recentStickerData,
					},
				});
			},

			/**
			 * @function stickerPackModel/deleteRecentSticker
			 * @param commit
			 * @param {{stickerId, packId, packType}} payload
			 */
			deleteRecentSticker: ({ commit }, payload) => {
				const { stickerId, packId, packType } = payload;

				commit('deleteRecentSticker', {
					actionName: 'deleteRecentSticker',
					data: {
						id: stickerId,
						packId,
						packType,
					},
				});
			},

			/**
			 * @function stickerPackModel/deleteAllRecentStickers
			 * @param commit
			 */
			deleteAllRecentStickers: ({ commit }) => {
				commit('deleteAllRecentStickers', {
					actionName: 'deleteAllRecentStickers',
					data: {},
				});
			},
		},
		mutations: {
			clearCurrentState: (state) => {
				state.isCurrentStickersLoaded = false;
				state.recentCollection = [];
				state.currentPacks.clear();
				state.packCollection.clear();
				state.hasNextPage = false;
				state.shouldClearState = false;
			},

			markForClear: (state) => {
				state.shouldClearState = true;
			},

			/**
			 * @param state
			 * @param {MutationPayload<StickerPackSetStateData, StickerPackSetStateActions>} payload
			 */
			setState: (state, payload) => {
				const {
					packs,
					stickers,
					recentStickers,
					hasNextPage,
				} = payload.data;

				state.hasNextPage = hasNextPage;
				state.isCurrentStickersLoaded = true;

				if (Type.isArrayFilled(packs))
				{
					for (const pack of packs)
					{
						const packKey = createPackKey(pack.id, pack.type);
						state.packCollection.set(packKey, pack);
						state.currentPacks.add(packKey);

						for (const [stickerKey, sticker] of state.stickerCollection.entries())
						{
							if (sticker.packId === pack.id && sticker.packType === pack.type)
							{
								state.stickerCollection.delete(stickerKey);
							}
						}
					}
				}

				if (Type.isArrayFilled(stickers))
				{
					for (const sticker of stickers)
					{
						const stickerKey = createStickerKey(sticker.id, sticker.packId, sticker.packType);

						state.stickerCollection.set(stickerKey, sticker);
					}
				}

				if (Type.isArrayFilled(recentStickers))
				{
					state.recentCollection = recentStickers;
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<StickerPackSetPackData, StickerPackSetPackActions>} payload
			 */
			setPack: (state, payload) => {
				const { pack, stickers, shouldClearStoredStickers = false } = payload.data;

				const packKey = createPackKey(pack.id, pack.type);
				state.packCollection.set(packKey, pack);

				if (shouldClearStoredStickers)
				{
					for (const [stickerKey, sticker] of state.stickerCollection.entries())
					{
						if (sticker.packId === pack.id && sticker.packType === pack.type)
						{
							state.stickerCollection.delete(stickerKey);
						}
					}
				}

				if (pack.isAdded === false)
				{
					state.currentPacks.delete(packKey);
				}

				if (Type.isArrayFilled(stickers))
				{
					for (const sticker of stickers)
					{
						const stickerKey = createStickerKey(sticker.id, sticker.packId, sticker.packType);

						state.stickerCollection.set(stickerKey, sticker);
					}
				}
			},

			createPack: (state, payload) => {
				const { pack, stickers } = payload.data;

				const packKey = createPackKey(pack.id, pack.type);
				state.packCollection.set(packKey, pack);

				state.currentPacks = new Set([packKey, ...state.currentPacks.values()]);

				if (Type.isArrayFilled(stickers))
				{
					for (const sticker of stickers)
					{
						const stickerKey = createStickerKey(sticker.id, sticker.packId, sticker.packType);

						state.stickerCollection.set(stickerKey, sticker);
					}
				}
			},

			deletePack: (state, payload) => {
				const { packId, packType } = payload.data;
				const packKey = createPackKey(packId, packType);

				state.packCollection.delete(packKey);
				state.currentPacks.delete(packKey);
				state.recentCollection = state.recentCollection.filter((item) => (
					item.packId !== packId || item.packType !== packType
				));

				for (const [stickerKey, sticker] of state.stickerCollection.entries())
				{
					if (sticker.packId === packId && sticker.packType === packType)
					{
						state.stickerCollection.delete(stickerKey);
					}
				}
			},

			/**
			 * @param state
			 * @param {MutationPayload<StickerPackAddRecentStickerData, StickerPackAddRecentStickerActions>} payload
			 */
			addRecentSticker: (state, payload) => {
				const newRecentSticker = payload.data.recentSticker;

				state.recentCollection = addUniqueToBeginning(state.recentCollection, newRecentSticker);
			},

			/**
			 * @param state
			 * @param {MutationPayload<StickerPackDeleteRecentStickerData, StickerPackDeleteRecentStickerActions>} payload
			 */
			deleteRecentSticker: (state, payload) => {
				const { id, packId, packType } = payload.data;

				state.recentCollection = state.recentCollection.filter((sticker) => {
					if (sticker.id !== id)
					{
						return true;
					}

					if (sticker.packId !== packId)
					{
						return true;
					}

					return sticker.packType !== packType;
				});
			},

			/**
			 * @param state
			 * @param {MutationPayload<
			 * StickerPackDeleteAllRecentStickersData,
			 * StickerPackDeleteAllRecentStickersActions
			 * >} payload
			 */
			deleteAllRecentStickers: (state, payload) => {
				state.recentCollection = [];
			},

			deleteStickers: (state, payload) => {
				const { packId, packType, ids } = payload.data;
				for (const id of ids)
				{
					const key = createStickerKey(id, packId, packType);
					state.stickerCollection.delete(key);

					state.recentCollection = state.recentCollection.filter((recentSticker) => {
						return recentSticker.packId !== packId || recentSticker.packType !== packType || recentSticker.id !== id
					});
				}
			},

			addStickers: (state, payload) => {
				const { stickers } = payload.data;

				for (const sticker of stickers)
				{
					const key = createStickerKey(sticker.id, sticker.packId, sticker.packType);

					state.stickerCollection.set(key, sticker);
				}
			},
		},
	};

	/**
	 * @param {Array<RecentStickerState>} array
	 * @param {RecentStickerState} newItem
	 * @return {Array<RecentStickerState>}
	 */
	function addUniqueToBeginning(array, newItem)
	{
		const filteredArray = array.filter((item) => item.id !== newItem.id
			|| item.packId !== newItem.packId
			|| item.packType !== newItem.packType);

		return [newItem, ...filteredArray].slice(0, RECENT_STICKERS_SIZE);
	}

	/**
	 * @param {Map<string, StickerState>} stickerCollection
	 * @param {Array<StickerPackState>} packList
	 * @return {Array<PackWithStickers>}
	 */
	function preparePackListResult(stickerCollection, packList)
	{
		const stickersByPack = new Map();
		for (const sticker of stickerCollection.values())
		{
			const key = createPackKey(sticker.packId, sticker.packType);
			if (!stickersByPack.has(key))
			{
				stickersByPack.set(key, []);
			}
			stickersByPack.get(key).push(sticker);
		}

		/** @type {Array<PackWithStickers>} */
		const result = [];
		for (const pack of packList)
		{
			const packKey = createPackKey(pack.id, pack.type);
			const packStickers = stickersByPack.get(packKey) ?? [];

			result.push({
				pack,
				stickers: packStickers
					.sort((sticker1, sticker2) => sticker1.sort - sticker2.sort),
			});
		}

		return result;
	}

	module.exports = {
		stickerPackModel,
	};
});
