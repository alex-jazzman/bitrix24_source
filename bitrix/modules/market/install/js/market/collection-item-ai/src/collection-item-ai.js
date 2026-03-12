import './collection-item-ai.css';
import 'ui.design-tokens';
import { Extension } from 'main.core';

export const CollectionItemAi = {
	props: [
		'item',
	],
	computed: {
		copilotNameClass() {
			if (Extension.getSettings('market.collection-item-ai')?.copilotName === 'BitrixGPT')
			{
				return '--bitrix-gpt';
			}

			return '--copilot';
		},
	},
	template: `
		<a class="market-item-ai" href="/sites/ai/?st_section=market_main" target="_parent">
			<div :class="['market-item-ai-title', copilotNameClass]">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_TITLE') }}</div>
			<div class="market-item-ai-button">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_CREATE_SITE') }}</div>
		</a>
	`,
};
