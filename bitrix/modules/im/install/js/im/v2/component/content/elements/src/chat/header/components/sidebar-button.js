import { Type } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { EventType, SidebarDetailBlock } from 'im.v2.const';

import type { EventEmitter } from 'main.core.events';

const ICON_SIZE = 24;

// @vue/component
export const SidebarButton = {
	name: 'SidebarButton',
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
		isSidebarOpened(): boolean
		{
			return Type.isStringFilled(this.currentSidebarPanel);
		},
	},
	methods:
	{
		toggleRightPanel()
		{
			if (this.isSidebarOpened)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: '' });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.main,
				dialogId: this.dialogId,
			});
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
			class="bx-im-chat-header__icon --ds-icon"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_SIDEBAR')"
			:class="{'--active': isSidebarOpened}"
			@click="toggleRightPanel"
		>
			<BIcon :name="Outline.COLUMNS_SIDEBAR_PENDING" :size="ICON_SIZE" />
		</div>
	`,
};
