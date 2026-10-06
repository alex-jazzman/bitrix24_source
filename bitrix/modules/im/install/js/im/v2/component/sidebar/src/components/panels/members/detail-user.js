import { Text } from 'main.core';

import { ChatTitle, ChatTitleWithHighlighting } from 'im.v2.component.elements.chat-title';
import { ChatAvatar, AvatarSize } from 'im.v2.component.elements.avatar';
import { Utils } from 'im.v2.lib.utils';
import { CopilotManager } from 'im.v2.lib.copilot';
import { highlightText } from 'im.v2.lib.text-highlighter';

import type { ImModelUser } from 'im.v2.model';

// @vue/component
export const DetailUser = {
	name: 'DetailUser',
	components: { ChatAvatar, ChatTitle, ChatTitleWithHighlighting },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
		contextDialogId: {
			type: String,
			required: true,
		},
		isOwner: {
			type: Boolean,
			default: false,
		},
		isManager: {
			type: Boolean,
			default: false,
		},
		highlightQuery: {
			type: String,
			default: '',
		},
	},
	data(): {showContextButton: boolean}
	{
		return {
			showContextButton: false,
		};
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		position(): string
		{
			if (this.isCopilot)
			{
				return (new CopilotManager()).getAIModelName(this.contextDialogId);
			}

			return this.$store.getters['users/getPosition'](this.dialogId);
		},
		user(): ImModelUser
		{
			return this.$store.getters['users/get'](this.dialogId, true);
		},
		userLink(): string
		{
			return Utils.user.getProfileLink(this.dialogId);
		},
		needContextMenu(): boolean
		{
			return !this.isAiAssistant && !this.isCopilot;
		},
		isCopilot(): boolean
		{
			const userId = Number.parseInt(this.dialogId, 10);

			return this.$store.getters['users/bots/isCopilot'](userId);
		},
		hasLink(): boolean
		{
			return !this.isCopilot;
		},
		isAiAssistant(): boolean
		{
			return this.$store.getters['users/bots/isAiAssistant'](this.dialogId);
		},
		isHighlighting(): boolean
		{
			return this.highlightQuery.length > 0;
		},
		titleComponent(): Object
		{
			return this.isHighlighting ? ChatTitleWithHighlighting : ChatTitle;
		},
		titleProps(): Object
		{
			const props = {
				dialogId: this.dialogId,
				withLeftIcon: !this.isCopilot,
			};

			if (this.isHighlighting)
			{
				props.textToHighlight = this.highlightQuery;
			}

			return props;
		},
		highlightedPosition(): ?string
		{
			if (!this.isHighlighting)
			{
				return null;
			}

			return highlightText(Text.encode(this.position), this.highlightQuery);
		},
	},
	methods:
	{
		onClickContextMenu(event)
		{
			this.$emit('contextMenuClick', {
				userDialogId: this.dialogId,
				target: event.currentTarget,
			});
		},
	},
	template: `
		<div
			class="bx-im-sidebar-main-detail__user"
			@mouseover="showContextButton = true"
			@mouseleave="showContextButton = false"
		>
			<div class="bx-im-sidebar-main-detail__avatar-container">
				<ChatAvatar 
					:size="AvatarSize.L"
					:avatarDialogId="dialogId"
					:contextDialogId="contextDialogId"
				/>
				<span v-if="isOwner" class="bx-im-sidebar-main-detail__avatar-owner-icon"></span>
				<span v-else-if="isManager" class="bx-im-sidebar-main-detail__avatar-manager-icon"></span>
			</div>
			<div class="bx-im-sidebar-main-detail__user-info-container">
				<div class="bx-im-sidebar-main-detail__user-title-container">
					<a v-if="hasLink" :href="userLink" target="_blank" class="bx-im-sidebar-main-detail__user-title-link">
						<component :is="titleComponent" v-bind="titleProps" />
					</a>
					<div v-else class="bx-im-sidebar-main-detail__user-title-link">
						<component :is="titleComponent" v-bind="titleProps" />
					</div>
					<div
						v-if="needContextMenu && showContextButton"
						class="bx-im-sidebar-main-detail__context-menu-icon bx-im-messenger__context-menu-icon"
						@click="onClickContextMenu"
					></div>
				</div>
				<div v-if="isHighlighting" class="bx-im-sidebar-main-detail__position-text" :title="position" v-html="highlightedPosition"></div>
				<div v-else class="bx-im-sidebar-main-detail__position-text" :title="position">
					{{ position }}
				</div>
			</div>
		</div>	
	`,
};
