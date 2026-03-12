/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,main_core) {
	'use strict';

	const RecentPackId = 0;
	const RecentPackType = 'recent';
	const StickerManager = {
	  getRecentPack() {
	    return {
	      id: RecentPackId,
	      key: `${RecentPackId}:${RecentPackType}`,
	      type: RecentPackType,
	      name: main_core.Loc.getMessage('IM_LIB_STICKER_PACK_RECENT'),
	      authorId: null
	    };
	  },
	  isRecentPack(pack) {
	    return pack.id === RecentPackId && pack.type === RecentPackType;
	  }
	};

	exports.RecentPackId = RecentPackId;
	exports.RecentPackType = RecentPackType;
	exports.StickerManager = StickerManager;

}((this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}),BX));
//# sourceMappingURL=sticker.bundle.js.map
