/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Provider = this.BX.Messenger.v2.Provider || {};
(function (exports, main_core, im_v2_application_core, im_v2_const, im_v2_lib_rest, im_v2_lib_logger, im_v2_lib_notifier) {
	'use strict';

	const PACKS_REQUEST_LIMIT = 10;
	class StickerService {
		#lastPackId = null;
		#lastPackType = '';
		#hasMore = true;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		async initFirstPage() {
			if (this.#lastPackId) {
				return Promise.resolve();
			}
			return this.#requestItems();
		}
		async loadNextPage() {
			if (!this.#hasMore) {
				return Promise.resolve();
			}
			return this.#requestItems();
		}
		async loadPack({
			id,
			type
		}) {
			const hasPack = im_v2_application_core.Core.getStore().getters['stickers/packs/hasPack']({
				id,
				type
			});
			if (hasPack) {
				return Promise.resolve();
			}
			const rawData = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackGet, {
				data: {
					id,
					type
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: pack request error', error);
			});
			const {
				pack,
				stickers
			} = rawData;
			const packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
			const stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
			return Promise.all([stickersPromise, packsPromise]);
		}
		async linkPack({
			id,
			type
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/link', {
				id,
				type
			});
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackLink, {
				data: {
					id,
					type
				}
			}).catch(errors => {
				const [firstError] = errors;
				im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
				im_v2_lib_logger.Logger.warn('StickerService: link pack error', errors);
				im_v2_lib_notifier.Notifier.sticker.onLinkPackError();
			});
		}
		async createPack({
			uuids,
			type,
			name
		}) {
			const rawData = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackAdd, {
				data: {
					uuids,
					type,
					name
				}
			}).catch(errors => {
				const [firstError] = errors;
				im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
				im_v2_lib_logger.Logger.warn('StickerService: pack creation error', errors);
			});
			const {
				pack,
				stickers
			} = rawData;
			const packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
			const stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
			return Promise.all([packsPromise, stickersPromise]);
		}
		async renamePack({
			id,
			type,
			name
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/rename', {
				id,
				type,
				name
			});
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackRename, {
				data: {
					id,
					type,
					name
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: rename pack error', error);
			});
		}
		async addStickers({
			uuids,
			id,
			type
		}) {
			const rawData = await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerAdd, {
				data: {
					uuids,
					packId: id,
					packType: type
				}
			}).catch(errors => {
				const [firstError] = errors;
				im_v2_lib_notifier.Notifier.sticker.handleLimits(firstError);
				im_v2_lib_logger.Logger.warn('StickerService: add stickers error', errors);
				throw errors;
			});
			const {
				pack,
				stickers
			} = rawData;
			const packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', [pack]);
			const stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
			return Promise.all([packsPromise, stickersPromise]);
		}
		async updatePack({
			uuids,
			id,
			type,
			name
		}) {
			const promises = [];
			if (main_core.Type.isArrayFilled(uuids)) {
				promises.push(this.addStickers({
					uuids,
					id,
					type
				}));
			}
			if (this.#wasPackRenamed({
				id,
				type,
				name
			})) {
				promises.push(this.renamePack({
					uuids,
					id,
					type,
					name
				}));
			}
			return Promise.all(promises);
		}
		async deletePack({
			id,
			type
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', {
				id,
				type
			});
			void im_v2_application_core.Core.getStore().dispatch('stickers/deleteByPack', {
				id,
				type
			});
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackDelete, {
				data: {
					id,
					type
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: delete pack error', error);
			});
		}
		async unlinkPack({
			id,
			type
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/packs/unlink', {
				id,
				type
			});
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerPackUnlink, {
				data: {
					id,
					type
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: unlink pack error', error);
			});
		}
		async clearRecent() {
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/clear');
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerRecentDeleteAll, {
				data: {}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: clear recent error', error);
			});
		}
		async removeFromRecent({
			id,
			packType,
			packId
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/recent/delete', {
				id,
				packType,
				packId
			});
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerRecentDelete, {
				data: {
					id,
					packId,
					packType
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: remove sticker from recent error', error);
			});
		}
		async deleteStickerFromPack({
			ids,
			packId,
			packType
		}) {
			void im_v2_application_core.Core.getStore().dispatch('stickers/delete', {
				ids,
				packType,
				packId
			});
			const remainingStickers = im_v2_application_core.Core.getStore().getters['stickers/getByPack']({
				id: packId,
				type: packType
			});
			if (!main_core.Type.isArrayFilled(remainingStickers)) {
				void im_v2_application_core.Core.getStore().dispatch('stickers/packs/delete', {
					id: packId,
					type: packType
				});
			}
			await im_v2_lib_rest.runAction(im_v2_const.RestMethod.imV2StickerDelete, {
				data: {
					ids,
					packId,
					packType
				}
			}).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: remove sticker from pack error', error);
			});
		}
		#getQueryParams() {
			const params = {
				limit: PACKS_REQUEST_LIMIT
			};
			const isFirstPage = !this.#lastPackId && !this.#lastPackType;
			if (!isFirstPage) {
				params.id = this.#lastPackId;
				params.type = this.#lastPackType;
			}
			return params;
		}
		async #requestItems() {
			const query = {
				data: this.#getQueryParams()
			};
			const isFirstPage = !this.#lastPackId && !this.#lastPackType;
			const method = isFirstPage ? im_v2_const.RestMethod.imV2StickerPackLoad : im_v2_const.RestMethod.imV2StickerPackTail;
			const rawData = await im_v2_lib_rest.runAction(method, query).catch(error => {
				im_v2_lib_logger.Logger.warn('StickerService: page request error', error);
			});
			this.#handlePagination(rawData);
			this.#updateModels(rawData);
		}
		#handlePagination(response) {
			this.#hasMore = response.hasNextPage;
			const lastPack = response.packs[response.packs.length - 1];
			if (lastPack) {
				this.#lastPackId = lastPack.id;
				this.#lastPackType = lastPack.type;
			}
		}
		#updateModels(response) {
			const {
				packs,
				stickers,
				recentStickers = []
			} = response;
			const packsPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/set', packs);
			const orderPromise = im_v2_application_core.Core.getStore().dispatch('stickers/packs/addSortOrder', packs);
			const stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/set', stickers);
			const recentPromise = im_v2_application_core.Core.getStore().dispatch('stickers/recent/set', recentStickers);
			return Promise.all([stickersPromise, packsPromise, orderPromise, recentPromise]);
		}
		#wasPackRenamed({
			id,
			type,
			name
		}) {
			const pack = im_v2_application_core.Core.getStore().getters['stickers/packs/getByIdentifier']({
				id,
				type
			});
			if (!pack) {
				return false;
			}
			return pack.name !== name;
		}
	}

	exports.StickerService = StickerService;

})(this.BX.Messenger.v2.Provider.Service = this.BX.Messenger.v2.Provider.Service || {}, BX, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=sticker.bundle.js.map
