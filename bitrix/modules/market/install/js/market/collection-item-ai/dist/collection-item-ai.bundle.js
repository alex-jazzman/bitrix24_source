/* eslint-disable */
this.BX = this.BX || {};
(function (exports, ui_designTokens, main_core) {
	'use strict';

	const CollectionItemAi = {
		props: ['item'],
		computed: {
			copilotNameClass() {
				if (main_core.Extension.getSettings('market.collection-item-ai')?.copilotName === 'BitrixGPT') {
					return '--bitrix-gpt';
				}
				return '--copilot';
			},
			itemTitle() {
				return main_core.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_TITLE_MSGVER_1', {
					'#COPILOT_NAME#': main_core.Extension.getSettings('market.collection-item-ai')?.copilotName ?? ''
				});
			}
		},
		template: `
		<a class="market-item-ai" href="/sites/ai/?st_section=market_main" target="_parent">
			<div :class="['market-item-ai-title', copilotNameClass]">{{ itemTitle }}</div>
			<div class="market-item-ai-button">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_CREATE_SITE') }}</div>
		</a>
	`
	};

	exports.CollectionItemAi = CollectionItemAi;

})(this.BX.Market = this.BX.Market || {}, BX, BX);
