/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,ui_vue3_vuex,im_v2_application_core) {
	'use strict';

	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	class StickerManager {
	  constructor() {
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	  }
	  addStickersFromService(packs, recent) {
	    const packsPromise = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/stickers/setPacks', packs);
	    const recentPromise = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/stickers/setRecentStickers', recent);
	    return Promise.all([packsPromise, recentPromise]);
	  }
	  makeStickerKey(id, packId, packType) {
	    return `${packId}:${packType}:${id}`;
	  }
	  makePackKey(packId, packType) {
	    return `${packId}:${packType}`;
	  }
	  parseStickerKey(key) {
	    const [packId, packType, id] = key.split(':');
	    return {
	      id,
	      packId,
	      packType
	    };
	  }
	}

	exports.StickerManager = StickerManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX.Vue3.Vuex,BX.Messenger.v2.Application));
//# sourceMappingURL=sticker-manager.bundle.js.map
