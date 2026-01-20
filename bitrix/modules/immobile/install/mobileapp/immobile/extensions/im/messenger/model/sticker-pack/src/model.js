/**
 * @module im/messenger/model/sticker-pack/model
 */
jn.define('im/messenger/model/sticker-pack/model', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { Type } = require('type');
	const { isEmpty } = require('utils/object');

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

	const RECENT_STICKERS_SIZE = 12;

	/**
	 * @type {StickerPackMessengerModel}
	 */
	const stickerPackModel = {
		namespaced: true,
		state: () => ({
			collection: new Map(),
			currentPacks: new Set(),
			recentCollection: [],
		}),
		getters: {
			/**
			 * @function stickerPackModel/isCurrentStickersLoaded
			 * @return {Boolean}
			 */
			isCurrentStickersLoaded: (state) => () => {
				return state.currentPacks.size > 0;
			},

			/**
			 * @function stickerPackModel/isPackLoaded
			 * @return {Boolean}
			 */
			isPackLoaded: (state) => (packId, packType) => {
				const packKey = createPackKey(packId, packType);

				return state.collection.has(packKey);
			},

			/**
			 * @function stickerPackModel/getPack
			 * @return {StickerPackModelState}
			 */
			getPack: (state) => (packId, packType) => {
				const packKey = createPackKey(packId, packType);

				return state.collection.get(packKey);
			},

			/**
			 * @function stickerPackModel/getAllStickers
			 * @return {{recentStickers: Array<FullStickerData>, packs: Array<StickerPackModelState>}}
			 */
			getAllStickers: (state) => () => {
				return {
					recentStickers: state.recentCollection,
					packs: [...state.currentPacks.values()]
						.map((packKey) => state.collection.get(packKey))
					,
				};
			},

			/**
			 * @function stickerPackModel/getStickerData
			 * @return {FullStickerData | null}
			 */
			getStickerData: (state) => ({ id, packId, packType }) => {
				const packKey = createPackKey(packId, packType);

				const pack = state.collection.get(packKey);

				if (Type.isNil(pack))
				{
					return null;
				}

				const sticker = pack.stickers.find((stickerState) => stickerState.id === id);
				if (Type.isNil(sticker))
				{
					return null;
				}

				return {
					packId,
					packType,
					...sticker,
				};
			},
		},
		actions: {
			/**
			 * @function stickerPackModel/setState
			 * @param commit
			 * @param {{packs: Array<StickerPackModelState>, recentStickers: Array<FullStickerData>}} payload
			 */
			setState: ({ commit }, payload) => {
				if (!Type.isArrayFilled(payload.packs) && !Type.isArrayFilled(payload.recentStickers))
				{
					return;
				}
				const { packs, recentStickers } = payload;

				/** @type {Partial<StickerPackSetStateData>} */
				const data = {};

				if (Type.isArrayFilled(packs))
				{
					data.packs = packs.map((pack) => {
						const packData = normalizeStickerPack(pack);
						packData.stickers = Type.isArrayFilled(pack.stickers)
							? pack.stickers.map((sticker) => ({
								...stickerDefaultElement,
								...normalizeSticker(sticker),
							}))
							: []
						;

						return { ...packDefaultElement, ...packData };
					});
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
			 * @function stickerPackModel/setPack
			 * @param store
			 * @param payload
			 */
			setPack: ({ commit }, payload) => {
				const pack = normalizeStickerPack(payload);
				pack.stickers = Type.isArrayFilled(payload.stickers)
					? payload.stickers.map((sticker) => ({
						...stickerDefaultElement,
						...normalizeSticker(sticker),
					}))
					: []
				;

				commit('setPack', {
					actionName: 'setPack',
					data: {
						pack: {
							...packDefaultElement,
							...pack,
						},
					},
				});
			},

			/**
			 * @function stickerPackModel/addRecentSticker
			 * @param store
			 * @param payload
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
			/**
			 * @param state
			 * @param {MutationPayload<StickerPackSetStateData, StickerPackSetStateActions>} payload
			 */
			setState: (state, payload) => {
				const { packs, recentStickers } = payload.data;
				if (Type.isArrayFilled(packs))
				{
					for (const pack of packs)
					{
						const packKey = createPackKey(pack.id, pack.type);
						state.collection.set(packKey, pack);
						state.currentPacks.add(packKey);
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
				const { pack } = payload.data;

				const packKey = createPackKey(pack.id, pack.type);
				state.collection.set(packKey, pack);
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
		},
	};

	/**
	 * @param {Array<FullStickerData>} array
	 * @param {FullStickerData} newItem
	 * @return {Array<FullStickerData>}
	 */
	function addUniqueToBeginning(array, newItem)
	{
		const filteredArray = array.filter((item) => item.id !== newItem.id
			|| item.packId !== newItem.packId
			|| item.packType !== newItem.packType);

		return [newItem, ...filteredArray].slice(0, RECENT_STICKERS_SIZE);
	}

	module.exports = {
		stickerPackModel,
	};
});
