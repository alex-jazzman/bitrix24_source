import { LineLoader } from 'im.v2.component.elements.loader';
import { EditableChatTitle } from 'im.v2.component.elements.chat-title';
import { FadeAnimation } from 'im.v2.component.animation';
import { PhraseByLinkType, hasEntityLink } from 'im.v2.component.elements.entity-link';

import { EntityControl } from '../entity-control/entity-control';
import { UserCounter } from './user-counter';

import type { ImModelChat } from 'im.v2.model';

// @vue/component
export const GroupChatTitle = {
	name: 'GroupChatTitle',
	components: { EditableChatTitle, EntityControl, LineLoader, FadeAnimation, UserCounter },
	inject: ['withSidebar'],
	props:
	{
		dialogId: {
			type: String,
			required: true,
		},
		withEntityLink: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['newTitle'],
	computed:
	{
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		showEntityLink(): boolean
		{
			return this.withEntityLink && hasEntityLink(this.dialog);
		},
		entityText(): string
		{
			return PhraseByLinkType[this.dialog.entityLink?.type] ?? PhraseByLinkType.default;
		},
		entityUrl(): string
		{
			return this.dialog.entityLink?.url ?? '';
		},
	},
	template: `
		<div class="bx-im-chat-header__info">
			<EditableChatTitle :dialogId="dialogId" @newTitleSubmit="$emit('newTitle', $event)" />
			<LineLoader v-if="!dialog.inited" :width="50" :height="16" />
			<FadeAnimation :duration="100">
				<div v-if="dialog.inited" class="bx-im-chat-header__subtitle_container">
					<UserCounter :dialogId="dialogId" />
					<slot name="after-user-counter">
						<EntityControl
							v-if="showEntityLink"
							:text="entityText"
							:url="entityUrl"
							data-testid="im-chat-header-entity-btn"
						/>
					</slot>
				</div>
			</FadeAnimation>
		</div>
	`,
};
