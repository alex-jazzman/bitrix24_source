import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EventType, ActionByRole } from 'im.v2.const';
import { AvatarSize, ChatAvatar } from 'im.v2.component.elements.avatar';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { PermissionManager } from 'im.v2.lib.permission';
import { ChatHeader, HeaderAction, HeaderActionShape, HeaderControlKey } from 'im.v2.component.content.elements';

import { SubscribeToggle } from './subscribe-toggle';

import '../css/header.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const CommentsHeader = {
	name: 'CommentsHeader',
	components: { ChatHeader, ChatAvatar, SubscribeToggle, HeaderAction, BIcon },
	props:
	{
		dialogId: {
			type: String,
			default: '',
		},
		channelId: {
			type: String,
			required: true,
		},
	},
	setup(): Object
	{
		return { Outline };
	},
	computed:
	{
		AvatarSize: () => AvatarSize,
		HeaderActionShape: () => HeaderActionShape,
		HeaderControlKey: () => HeaderControlKey,
		channel(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.channelId, true);
		},
		showSubscribeToggle(): boolean
		{
			return PermissionManager.getInstance().canPerformActionByRole(ActionByRole.subscribeToComments, this.dialogId);
		},
		isAirDesignEnabled(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isAirDesignEnabled);
		},
		/**
		 * Both designs are one and the same control, so the geometry travels to it. The AIR branch shows
		 * a DS glyph and takes the shared icon-button box of the header - the very one the search and the
		 * sidebar buttons wear; the legacy branch keeps its own 24px box with the background image.
		 */
		backControlClasses(): Array<string>
		{
			if (this.isAirDesignEnabled)
			{
				return ['bx-im-chat-header__icon', '--ds-icon', 'bx-im-comment-header__back-icon'];
			}

			return ['bx-im-comment-header__back'];
		},
	},
	created()
	{
		// Not in data(): the gesture is spent once and the template knows nothing of it.
		this.isBackRequested = false;
	},
	methods:
	{
		// ALG-04: the control stays on screen while the layer leaves, so the gesture that closes it is
		// spent the first time - a second activation adds no second close.
		onBackClick()
		{
			if (this.isBackRequested)
			{
				return;
			}
			this.isBackRequested = true;

			this.getEmitter().emit(EventType.dialog.closeComments);
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
		<ChatHeader
			:dialogId="dialogId"
			class="bx-im-comment-header__container"
			:class="{'--air': isAirDesignEnabled}"
		>
			<template #left>
				<HeaderAction
					:controlKey="HeaderControlKey.commentsBack"
					:label="loc('IM_CONTENT_COMMENTS_HEADER_BACK_ARIA')"
					:shape="HeaderActionShape.circle"
					:class="backControlClasses"
					data-testid="im-comments-header-back-btn"
					@click="onBackClick"
				>
					<BIcon v-if="isAirDesignEnabled" :name="Outline.CHEVRON_LEFT_L" :hoverable="true" />
				</HeaderAction>
				<div class="bx-im-comment-header__info">
					<div class="bx-im-comment-header__title">{{ loc('IM_CONTENT_COMMENTS_HEADER_TITLE') }}</div>
					<div class="bx-im-comment-header__subtitle">
						<div class="bx-im-comment-header__subtitle_avatar">
							<ChatAvatar :avatarDialogId="channelId" :size="AvatarSize.XS" />
						</div>
						<div class="bx-im-comment-header__subtitle_text --ellipsis">{{ channel.name }}</div>
					</div>
				</div>
			</template>
			<template v-if="showSubscribeToggle" #before-actions>
				<SubscribeToggle :dialogId="dialogId" />
			</template>
		</ChatHeader>
	`,
};
