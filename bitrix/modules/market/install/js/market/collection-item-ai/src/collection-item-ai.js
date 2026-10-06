import './collection-item-ai.css';
import 'ui.design-tokens';
import { Extension, Loc } from 'main.core';

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
		itemTitle() {
			return Loc.getMessage(
				'MARKET_COLLECTIONS_ITEM_AI_TITLE_MSGVER_1',
				{
					'#COPILOT_NAME#': Extension.getSettings('market.collection-item-ai')?.copilotName ?? '',
				},
			);
		},
	},
	template: `
		<a class="market-item-ai" href="/sites/ai/?st_section=market_main" target="_parent">
			<div :class="['market-item-ai-title', copilotNameClass]">{{ itemTitle }}</div>
			<div class="market-item-ai-button">{{ $Bitrix.Loc.getMessage('MARKET_COLLECTIONS_ITEM_AI_CREATE_SITE') }}</div>
		</a>
	`,
};
