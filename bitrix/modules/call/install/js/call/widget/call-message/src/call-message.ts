import { Loc } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';
import { hint } from 'ui.vue3.directives.hint';

import { Messenger } from 'im.public';
import { BaseMessage } from 'im.v2.component.message.base';
import { MessageHeader } from 'im.v2.component.message.elements';
import { ChatType } from 'im.v2.const';
import { DateCode, DateFormatter } from 'im.v2.lib.date-formatter';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';

import { Analytics } from 'call.lib.analytics';
import { CallManager } from 'call.lib.call-manager';

import { CallMessageBody } from './call-message-body';

import './css/call-message.css';

const MESSAGE_TYPE = {
	start: 'START',
	finish: 'FINISH',
	declined: 'DECLINED',
	busy: 'BUSY',
	missed: 'MISSED',
	cancelled: 'CANCELLED',
} as const;

type MessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE];

type ComponentParams = {
	messageType: MessageType;
	messageText: string;
	callId: number;
	initiatorId: number;
};

type HintContent = {
	text: string;
	popupOptions: {
		bindOptions: { position: string };
		angle: { position: string };
		targetContainer: HTMLElement;
		offsetLeft: number;
		offsetTop: number;
	};
};

// @vue/component
export const CallMessage = defineComponent({
	name: 'CallMessage',
	components: { BaseMessage, MessageHeader, CallMessageBody },
	directives: { hint },
	props: {
		item: {
			type: Object as PropType<ImModelMessage>,
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
	setup(): { hintTimeout: ReturnType<typeof setTimeout> | null }
	{
		return { hintTimeout: null };
	},
	data()
	{
		return {
			showHint: false,
		};
	},
	computed: {
		message(): ImModelMessage
		{
			return this.item;
		},
		componentParams(): ComponentParams
		{
			return this.item.componentParams as ComponentParams;
		},
		messageIconClasses(): string[]
		{
			const result = ['bx-call-message__icon'];

			switch (this.componentParams.messageType)
			{
				case MESSAGE_TYPE.start:
					result.push('bx-call-message__icon--secondary');
					break;
				case MESSAGE_TYPE.finish:
					result.push('bx-call-message__icon--primary');
					break;
				case MESSAGE_TYPE.declined:
				case MESSAGE_TYPE.busy:
				case MESSAGE_TYPE.missed:
				case MESSAGE_TYPE.cancelled:
					result.push('bx-call-message__icon--danger');
					break;
				default:
					result.push('bx-call-message__icon--secondary');
					break;
			}

			return result;
		},
		messageText(): string
		{
			return this.componentParams.messageText;
		},
		formattedDate(): string
		{
			// DateCode comes from a Flow module and resolves to `{}` in TS; it is a string map at runtime
			return DateFormatter.formatByCode(this.message.date, (DateCode as Record<string, string>).shortTimeFormat);
		},
		hasActiveCurrentCall(): boolean
		{
			return CallManager.getInstance().hasActiveCurrentCall(this.dialogId);
		},
		hasActiveAnotherCall(): boolean
		{
			return CallManager.getInstance().hasActiveAnotherCall(this.dialogId);
		},
		hasActiveCallInDialog(): boolean
		{
			return CallManager.getInstance().hasActiveCallInDialog(this.dialogId);
		},
		dialog(): ImModelChat
		{
			return this.$store.getters['chats/get'](this.dialogId, true);
		},
		isConference(): boolean
		{
			return this.dialog.type === ChatType.videoconf;
		},
		isInteractive(): boolean
		{
			return !this.hasActiveAnotherCall && this.hasActiveCallInDialog;
		},
		isBusy(): boolean
		{
			return this.hasActiveAnotherCall;
		},
		isActionable(): boolean
		{
			return this.isInteractive || this.isBusy;
		},
		accessibleName(): string
		{
			if (this.isBusy)
			{
				return this.messageText;
			}

			const action = this.hasActiveCurrentCall
				? this.loc('CALL_MESSAGE_RETURN_TO_CALL_ARIA')
				: this.loc('CALL_MESSAGE_JOIN_CALL_ARIA');

			return `${this.messageText}. ${action}`;
		},
		hintTargetId(): string
		{
			return `bx-call-message-hint-${this.message.id}`;
		},
		activeCallHintText(): string
		{
			return this.loc('CALL_MESSAGE_HAS_ACTIVE_CALL_HINT');
		},
		hintContent(): HintContent | null
		{
			if (!this.showHint)
			{
				return null;
			}

			return {
				text: this.activeCallHintText,
				popupOptions: {
					bindOptions: {
						position: 'top',
					},
					angle: { position: 'bottom' },
					targetContainer: document.body,
					offsetLeft: 65,
					offsetTop: 0,
				},
			};
		},
	},
	beforeUnmount()
	{
		clearTimeout(this.hintTimeout ?? undefined);
	},
	methods: {
		loc(phraseCode: string, replacements: { [p: string]: string } = {}): string
		{
			return Loc.getMessage(phraseCode, replacements) ?? '';
		},
		onMessageClick()
		{
			if (this.hasActiveAnotherCall)
			{
				this.showHint = true;
				clearTimeout(this.hintTimeout ?? undefined);
				this.hintTimeout = setTimeout(() => {
					this.showHint = false;
				}, 10000);

				return;
			}

			if (!this.hasActiveCallInDialog)
			{
				return;
			}

			if (this.componentParams.messageType === MESSAGE_TYPE.start)
			{
				Analytics.getInstance().onStartCallMessageClick({ dialog: this.dialog });
			}
			else
			{
				Analytics.getInstance().onFinishCallMessageClick({ dialog: this.dialog });
			}

			if (this.isConference)
			{
				void Messenger.openConference({ code: this.dialog.public.code });
			}
			else
			{
				void Messenger.startVideoCall(this.dialogId);
			}
		},
	},
	template: `
		<BaseMessage
			:dialogId="dialogId"
			:item="item"
			:withContextMenu="false"
			:withBackground="true"
			:withReactions="false"
			class="bx-call-message__scope"
		>
			<div class="bx-call-message__container">
				<div class="bx-call-message__content-wrapper">
					<MessageHeader :withTitle="withTitle" :item="item" />
					<button
						v-if="isActionable"
						type="button"
						class="bx-call-message__button"
						:aria-label="accessibleName"
						:aria-disabled="isBusy ? 'true' : null"
						:aria-describedby="isBusy ? hintTargetId : null"
						@click="onMessageClick"
					>
						<span :key="showHint" v-hint="hintContent" class="bx-call-message__content">
							<CallMessageBody :iconClasses="messageIconClasses" :text="messageText" :date="formattedDate" />
						</span>
						<span v-if="isBusy" :id="hintTargetId" class="bx-call-message__sr-only">
							{{ activeCallHintText }}
						</span>
					</button>
					<div v-else class="bx-call-message__content">
						<CallMessageBody :iconClasses="messageIconClasses" :text="messageText" :date="formattedDate" />
					</div>
				</div>
			</div>
		</BaseMessage>
	`,
});
