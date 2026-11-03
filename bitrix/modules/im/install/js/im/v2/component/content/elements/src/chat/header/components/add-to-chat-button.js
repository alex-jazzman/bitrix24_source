import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { AddToChat } from 'im.v2.component.entity-selector';
import { Analytics } from 'im.v2.lib.analytics';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from './header-action/header-action';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// @vue/component
export const AddToChatButton = {
	name: 'AddToChatButton',
	components: { AddToChat, BIcon, HeaderAction },
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
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
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
		// The popup binds to the native control, and the ref of a component gives its instance.
		getPopupBindElement(): HTMLElement | Object
		{
			return this.$refs['add-members']?.$el ?? {};
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	// The surface behind the action is the selector dialog of the entity selector, not a disclosure of
	// this button, so it announces the type it opens and reports no expanded state of its own.
	template: `
		<HeaderAction
			:controlKey="HeaderControlKey.addToChat"
			aria-haspopup="dialog"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-chat-header-add-btn"
			@click="openAddToChatPopup"
			ref="add-members"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
		</HeaderAction>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="getPopupBindElement()"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
	`,
};
