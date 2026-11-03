import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from 'im.v2.component.content.elements';
import { AddToChat } from 'im.v2.component.entity-selector';
import { PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { Analytics } from 'im.v2.lib.analytics';

import { AddToChatHint } from './add-to-chat-hint';

import type { JsonObject } from 'main.core';

const ICON_SIZE = 24;

// @vue/component
export const AddToChatButton = {
	name: 'AddToChatButton',
	components: { AddToChat, AddToChatHint, BIcon, HeaderAction },
	props: {
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
			showAddToChatHint: false,
		};
	},
	computed:
	{
		Outline: () => Outline,
		ICON_SIZE: () => ICON_SIZE,
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
	},
	mounted()
	{
		const needCopilotInRecentTabHint = PromoManager.getInstance().needToShow(PromoId.copilotInRecentTab);
		const needAddUsersToChatHint = PromoManager.getInstance().needToShow(PromoId.addUsersToCopilotChat);

		this.showAddToChatHint = !needCopilotInRecentTabHint && needAddUsersToChatHint;
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
		showHint()
		{
			this.showAddToChatHint = true;
		},
		closeHint()
		{
			this.showAddToChatHint = false;
		},
		onHintHide()
		{
			void PromoManager.getInstance().markAsWatched(PromoId.addUsersToCopilotChat);
			this.closeHint();
		},
		// The popup and the hint bind to the native control, and the ref of a component gives its instance.
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
	// language=Vue
	template: `
		<HeaderAction
			:controlKey="HeaderControlKey.addToChat"
			aria-haspopup="dialog"
			:shape="HeaderActionShape.circle"
			:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_INVITE_POPUP_TITLE')"
			:class="{'--active': showAddToChatPopup}"
			class="bx-im-chat-header__icon --ds-icon"
			data-testid="im-copilot-header-add-btn"
			ref="add-members"
			@click="openAddToChatPopup"
		>
			<BIcon :name="Outline.ADD_PERSON" :size="ICON_SIZE" />
			<slot name="invite-hint" :inviteButtonRef="getPopupBindElement()"></slot>
		</HeaderAction>
		<AddToChat
			v-if="showAddToChatPopup"
			:bindElement="getPopupBindElement()"
			:dialogId="dialogId"
			:popupConfig="{ offsetTop: 15, offsetLeft: -300 }"
			@close="closeAddToChatPopup"
		/>
		<AddToChatHint
			v-if="showAddToChatHint"
			:bindElement="getPopupBindElement()"
			@close="closeHint"
			@hide="onHintHide"
		/>
	`,
};
