import { Switcher } from 'ui.vue3.components.switcher';

import { HeaderAction, HeaderActionShape, HeaderControlKey } from 'im.v2.component.content.elements';
import { Toggle, ToggleSize } from 'im.v2.component.elements.toggle';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { CommentsService } from 'im.v2.provider.service.comments';

import '../css/follow-toggle.css';

import type { JsonObject } from 'main.core';
import type { ImModelChat } from 'im.v2.model';

/**
 * The saved "subscribed or not" setting, so the control is a switch with one name and one stop. The
 * visual toggle inside is decoration: neither the AIR switcher nor the legacy one renders a native
 * input or button, so nothing under the control takes the focus or handles the activation on its own.
 */
// @vue/component
export const SubscribeToggle = {
	name: 'SubscribeToggle',
	components: { Toggle, Switcher, HeaderAction },
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
	},
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		ToggleSize: () => ToggleSize,
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
		postMessageId(): ?number
		{
			return this.$store.getters['messages/comments/getMessageIdByChatId'](this.dialog.chatId);
		},
		isSubscribed(): boolean
		{
			return this.$store.getters['messages/comments/isUserSubscribed'](this.postMessageId);
		},
	},
	methods:
	{
		onToggleClick(): void
		{
			if (this.isSubscribed)
			{
				CommentsService.unsubscribe(this.postMessageId);

				return;
			}

			CommentsService.subscribe(this.postMessageId);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<HeaderAction
			:controlKey="HeaderControlKey.commentsSubscribe"
			:label="loc('IM_CONTENT_COMMENTS_FOLLOW_TOGGLE_ARIA')"
			:checked="isSubscribed"
			:shape="HeaderActionShape.rounded"
			class="bx-im-comments-header-follow__container"
			:class="{'--air': isAirDesignEnabled}"
			data-testid="im-comments-header-follow-toggle"
			@click="onToggleClick"
		>
			<div class="bx-im-comments-header-follow__text">{{ loc('IM_CONTENT_COMMENTS_FOLLOW_TOGGLE_TEXT') }}</div>
			<Switcher
				v-if="isAirDesignEnabled"
				:is-checked="isSubscribed"
				:options="{ size: 'small', useAirDesign: true }"
				class="bx-im-comments-header-follow__switcher"
			/>
			<Toggle v-else :size="ToggleSize.M" :isEnabled="isSubscribed" />
		</HeaderAction>
	`,
};
