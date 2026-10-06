import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { AddToChat } from 'im.v2.component.entity-selector';
import { Analytics } from 'im.v2.lib.analytics';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// @vue/component
export const AddToChatButton = {
	name: 'AddToChatButton',
	components: { AddToChat, BIcon },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
	},
	data(): JsonObject
	{
		return {
			showInviteButton: false,
			showAddToChatPopup: false,
		};
	},
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
	},
	methods:
	{
		openAddToChatPopup(): void
		{
			Analytics.getInstance().userAdd.onChatHeaderClick(this.dialogId);
			this.showAddToChatPopup = true;
		},
		closeAddToChatPopup(): void
		{
			this.showAddToChatPopup = false;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-add-btn"
			@click="openAddToChatPopup"
			ref="add-members"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
		</div>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="$refs['add-members'] ?? {}"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
	`,
};
