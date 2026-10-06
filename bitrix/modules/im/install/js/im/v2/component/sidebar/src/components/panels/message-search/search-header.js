import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { SearchInput } from 'im.v2.component.elements.search-input';

import './css/search-header.css';

const ICON_SIZE = 24;

// @vue/component
export const SearchHeader = {
	name: 'SearchHeader',
	components: { SearchInput, BIcon },
	props:
	{
		secondLevel: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['back', 'changeQuery'],
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
	},
	template: `
		<div class="bx-im-sidebar-search-header__container bx-im-sidebar-search-header__scope">
			<div class="bx-im-sidebar-search-header__title-container">
				<button
					v-if="secondLevel"
					class="bx-im-sidebar-search-header__ds-icon"
					@click="$emit('back')"
					data-testid="im-sidebar-search-header-back-button"
				>
					<BIcon :name="Outline.CHEVRON_LEFT_L" :size="ICON_SIZE" />
				</button>
				<button
					v-else
					class="bx-im-sidebar-search-header__ds-icon"
					@click="$emit('back')"
					data-testid="im-sidebar-search-header-close-button"
				>
					<BIcon :name="Outline.CROSS_L" :size="ICON_SIZE" />
				</button>
				<SearchInput
					:placeholder="$Bitrix.Loc.getMessage('IM_SIDEBAR_SEARCH_MESSAGE_PLACEHOLDER')"
					:withIcon="false"
					:delayForFocusOnStart="300"
					@queryChange="$emit('changeQuery', $event)"
					@closeByEsc="$emit('back')"
					class="bx-im-sidebar-search-header__input"
				/>
			</div>
		</div>
	`,
};
