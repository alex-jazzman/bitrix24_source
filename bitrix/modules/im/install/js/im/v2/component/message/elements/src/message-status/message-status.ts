import { defineComponent, type PropType } from 'ui.vue3';

import { Core } from 'im.v2.application.core';
import { OwnMessageStatus as StatusType } from 'im.v2.const';
import { DateCode, DateFormatter } from 'im.v2.lib.date-formatter';
import { messageHasError } from 'im.v2.lib.message';
import { type ImModelMessage } from 'im.v2.model';

import './message-status.css';

// @vue/component
export const MessageStatus = defineComponent({
	name: 'MessageStatus',
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		isOverlay: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		formattedDate(): string
		{
			return DateFormatter.formatByCode(this.message.date, (DateCode as { shortTimeFormat: string }).shortTimeFormat);
		},
		isSelfMessage(): boolean
		{
			return this.message.authorId === Core.getUserId();
		},
		// Undelivered by timeout replaces the time with a text label, the way v1 did (it swapped the
		// date for IM_M_NOT_DELIVERED): the state must be readable without relying on colour. A
		// failed send is not labelled - it keeps the time and offers the retry button instead.
		isNotDelivered(): boolean
		{
			return this.message.notDelivered === true && !this.message.error;
		},
		messageStatus(): $Values<typeof StatusType>
		{
			if (messageHasError(this.message))
			{
				return StatusType.error;
			}

			if (this.message.sending)
			{
				return StatusType.sending;
			}

			if (this.message.viewedByOthers)
			{
				return StatusType.viewed;
			}

			return StatusType.sent;
		},
	},
	methods: {
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-message-status__container" :class="{'--overlay': isOverlay}">
			<div v-if="message.isEdited && !message.isDeleted" class="bx-im-message-status__edit-mark">
				{{ loc('IM_MESSENGER_MESSAGE_EDITED') }}
			</div>
			<div
				v-if="isNotDelivered"
				class="bx-im-message-status__date --not-delivered"
				:class="{'--overlay': isOverlay}"
				:title="formattedDate"
				data-testid="im-message-not-delivered-label"
			>
				{{ loc('IM_MESSENGER_MESSAGE_NOT_DELIVERED') }}
			</div>
			<div v-else class="bx-im-message-status__date" :class="{'--overlay': isOverlay}">
				{{ formattedDate }}
			</div>
			<div v-if="isSelfMessage" :class="'--' + messageStatus" class="bx-im-message-status__icon" data-testid="im-message-status-icon"></div>
		</div>
	`,
});
