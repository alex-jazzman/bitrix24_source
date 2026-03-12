/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_designTokens,main_core) {
	'use strict';

	const CollectionItemAi = {
	  props: ['item'],
	  computed: {
	    copilotNameClass() {
	      var _Extension$getSetting;
	      if (((_Extension$getSetting = main_core.Extension.getSettings('market.collection-item-ai')) == null ? void 0 : _Extension$getSetting.copilotName) === 'BitrixGPT') {
	        return '--bitrix-gpt';
	      }
	      return '--copilot';
	    }
	  },
	  template: `
		<a class="market-item-ai" href="/sites/ai/?st_section=market_main" target="_parent">
			<div :class="['market-item-ai-title', copilotNameClass]">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_TITLE') }}</div>
			<div class="market-item-ai-button">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_CREATE_SITE') }}</div>
		</a>
	`
	};

	exports.CollectionItemAi = CollectionItemAi;

}((this.BX.Market = this.BX.Market || {}),BX,BX));
