import { Loc } from 'main.core';

import { EventType, SidebarDetailBlock } from 'im.v2.const';
import { LineLoader } from 'im.v2.component.elements.loader';
import { ChatTitle } from 'im.v2.component.elements.chat-title';
import { HeaderAction, HeaderActionShape, HeaderControlKey } from 'im.v2.component.content.elements';
import { FadeAnimation } from 'im.v2.component.animation';
import { Feature, FeatureManager } from 'im.v2.lib.feature';

import '../css/collab-title.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelChat, ImModelCollabInfo } from 'im.v2.model';

// @vue/component
export const CollabTitle = {
	name: 'CollabTitle',
	components: { ChatTitle, HeaderAction, LineLoader, FadeAnimation },
	inject:
	{
		currentSidebarPanel: 'currentSidebarPanel',
		sidebarAreaId: { default: '' },
	},
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		collabInfo(): ImModelCollabInfo
		{
			return this.$store.getters['chats/collabs/getByChatId'](this.dialog.chatId);
		},
		guestCounter(): number
		{
			return this.collabInfo.guestCount;
		},
		isMembersPanelActive(): boolean
		{
			return this.currentSidebarPanel === SidebarDetailBlock.members;
		},
		userCounterText(): string
		{
			return Loc.getMessagePlural('IM_CONTENT_CHAT_HEADER_USER_COUNT', this.dialog.userCounter, {
				'#COUNT#': this.dialog.userCounter,
			});
		},
		guestCounterText(): string
		{
			return Loc.getMessagePlural('IM_CONTENT_COLLAB_HEADER_GUEST_COUNT', this.guestCounter, {
				'#COUNT#': this.guestCounter,
			});
		},
		// SC 2.5.3: the visible text of the row opens the name of the button, and the purpose of the
		// panel it opens closes it - otherwise the count reaches nobody but the sighted user.
		membersLabel(): string
		{
			return `${this.visibleCounterText}, ${this.loc('IM_CONTENT_CHAT_HEADER_MEMBERS_ARIA')}`;
		},
		visibleCounterText(): string
		{
			return this.guestCounter > 0
				? `${this.userCounterText} ${this.guestCounterText}`
				: this.userCounterText;
		},
	},
	methods:
	{
		onMembersClick()
		{
			if (this.isMembersPanelActive)
			{
				this.getEmitter().emit(EventType.sidebar.close, { panel: SidebarDetailBlock.members });

				return;
			}

			this.getEmitter().emit(EventType.sidebar.open, {
				panel: SidebarDetailBlock.members,
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
	// The counter opens the members panel, which holds the guests of the collab as well, so the whole
	// row is one control named after that panel. The guest count belongs to its text and stays part of
	// the decorative content. The row truncates itself, so the ring is drawn inside to stay whole.
	// language=Vue
	template: `
		<div class="bx-im-collab-header-title__container" :class="{'--air': isAirDesignEnabled}">
			<div class="bx-im-collab-header-title__title-container --ellipsis">
				<ChatTitle :dialogId="dialogId" :withAutoDelete="true" />
			</div>
			<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
			<FadeAnimation :duration="100">
				<div v-if="dialog.inited" class="bx-im-collab-header-title__subtitle_container">
					<HeaderAction
						:controlKey="HeaderControlKey.members"
						:label="membersLabel"
						:expanded="isMembersPanelActive"
						:controls="sidebarAreaId"
						:shape="HeaderActionShape.text"
						:truncate="true"
						:title="loc('IM_CONTENT_CHAT_HEADER_OPEN_MEMBERS')"
						class="bx-im-collab-header-title__subtitle_content"
						data-testid="im-collab-header-user-counter"
						@click="onMembersClick"
					>
						<span class="bx-im-collab-header-title__user-counter">{{ userCounterText }}</span>
						<span
							v-if="guestCounter > 0"
							class="bx-im-collab-header-title__guest-counter"
							data-testid="im-collab-header-guest-counter"
						>
							{{ guestCounterText }}
						</span>
					</HeaderAction>
				</div>
			</FadeAnimation>
		</div>
	`,
};
