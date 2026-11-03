import { defineComponent, type PropType } from 'ui.vue3';

import { Phrase, TestId } from '../../const';
import { openMessage } from '../../feature/open-message/open-message';
import { loc } from '../../lib/loc/loc';
import { type MessageRow, type SenderAddress } from '../../model/grid/types';
import { SenderAvatar } from '../sender-avatar/sender-avatar';

/**
 * Who the row names: the unread dot, the avatar and one link per address. An address the parser could
 * not read keeps its own text and opens the message all the same.
 *
 * The dot lives here rather than in a column of its own, and it is drawn for every row - the row being
 * unread is what makes it visible.
 */
// @vue/component
export const SenderCell = defineComponent({
	name: 'MailMessageGridSenderCell',

	components: {
		SenderAvatar,
	},

	props: {
		row: {
			type: Object as PropType<MessageRow>,
			required: true,
		},
	},

	setup()
	{
		return {
			dotTestId: TestId.UnseenDot,
			linkTestId: TestId.SenderLink,
		};
	},

	computed: {
		cellClass(): Record<string, boolean>
		{
			return {
				'js-spam': this.row.isSpam,
				'mail-msg-list-sender-block': true,
				[`mail-msg-list-cell-${this.row.messageId}`]: true,
				'mail-msg-list-cell-nowrap': true,
				'mail-msg-list-cell-flex': true,
				'mail-msg-list-cell-unseen': this.row.unseen,
			};
		},

		addresses(): SenderAddress[]
		{
			return this.row.sender.addresses;
		},

		separator(): string
		{
			return loc(Phrase.AddressSeparator);
		},

		dotLabel(): string
		{
			return loc(Phrase.UnseenDotLabel);
		},
	},

	methods: {
		handleOpen(): void
		{
			openMessage(this.row.messageId, this.row.href);
		},
	},

	template: `
		<span :data-message-id="row.messageId" :class="cellClass">
			<span class="mail-msg-list-unseen-slot"><span
				class="mail-msg-list-unseen-dot"
				:data-testid="dotTestId"
			><span class="mail-msg-list-unseen-dot-label">{{ dotLabel }}</span></span></span>
			<SenderAvatar :avatar="row.sender.avatar"/>
			<template v-for="(address, index) in addresses" :key="index">
				<template v-if="index > 0">{{ separator }}</template>
				<a
					class="mail-msg-list-sender"
					:data-testid="linkTestId"
					:title="address.title"
					@click="handleOpen"
				>{{ address.text }}</a>
			</template>
		</span>
	`,
});
