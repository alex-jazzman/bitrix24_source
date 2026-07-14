import { BaseMessage } from 'im.v2.component.message.base';
import {
	BuilderContent,
	DefaultMessageContent,
	MessageFooter,
	MessageHeader,
	MessageKeyboard,
	ReactionSelector,
} from 'im.v2.component.message.elements';
import { type ImModelMessage } from 'im.v2.model';

import './css/default.css';

// @vue/component
export const DefaultMessage = {
	name: 'DefaultMessage',
	components: {
		MessageHeader,
		MessageFooter,
		BaseMessage,
		BuilderContent,
		DefaultMessageContent,
		ReactionSelector,
		MessageKeyboard,
	},
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
		withTitle: {
			type: Boolean,
			default: true,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		hasKeyboard(): boolean
		{
			return this.message.keyboard.length > 0;
		},
	},
	template: `
		<BaseMessage :item="item" :dialogId="dialogId" :afterMessageWidthLimit="false">
			<template #before-message v-if="$slots['before-message']">
				<slot name="before-message"></slot>
			</template>
			<div class="bx-im-message-default__container">
				<MessageHeader :withTitle="withTitle" :item="item" />
				<DefaultMessageContent :item="item" :dialogId="dialogId" :withBuilder="true" />
			</div>
			<MessageFooter :item="item" :dialogId="dialogId" />
			<template #after-message v-if="hasKeyboard">
				<MessageKeyboard :item="item" :dialogId="dialogId" />
			</template>
		</BaseMessage>
	`,
};
