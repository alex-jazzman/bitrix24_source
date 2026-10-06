import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { EventType, SidebarDetailBlock } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';

import type { EventEmitter } from 'main.core.events';

const ICON_SIZE = 24;

// @vue/component
export const SearchButton = {
	name: 'SearchButton',
	components: { BIcon },
	inject: ['currentSidebarPanel'],
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		isMessageSearchActive(): boolean
		{
			return this.currentSidebarPanel === SidebarDetailBlock.messageSearch;
		},
	},
	methods:
	{
		toggleSearchPanel()
		{
			if (this.isMessageSearchActive)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.messageSearch });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.messageSearch,
				dialogId: this.dialogId,
			});
			Analytics.getInstance().messageSearch.onOpenSearchPanel(this.dialogId);
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SEARCH')"
			:class="{'--active': isMessageSearchActive}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-search-btn"
			@click="toggleSearchPanel"
		>
			<BIcon :name="Outline.SEARCH" :size="ICON_SIZE" />
		</div>
	`,
};
