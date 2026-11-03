import { defineComponent, type PropType } from 'ui.vue3';

import {
	ScreenContent,
	type PeriodRequest,
	type ScreenContentControl,
} from '../component/screen-content/screen-content';
import { type FieldErrorTargets, type ScreenStateData } from '../state';
import { type SignatureTransport } from '../transport';
import { type VacationAutoReplySetting } from '../types';

export const LegacyHostRole = 'mail-vacation-auto-reply-legacy-host';

type RetryHandler = () => void;
type MailboxSelectHandler = (mailboxId: number) => void;
type ActiveChangeHandler = (active: boolean) => void;

export type VacationAutoReplyAppControl = {
	getActive(): boolean,
	getPeriodRequest(setting?: VacationAutoReplySetting | null): PeriodRequest,
	getEditorBody(): string,
	saveEditor(): boolean,
	showEditorError(text: string): void,
	clearEditorError(): void,
	applySetting(setting: VacationAutoReplySetting): boolean,
	setReadonly(readonly: boolean): void,
	getFieldErrorTargets(): FieldErrorTargets,
	getReadonlyNoteId(): string,
};

// @vue/component
export const App = defineComponent({
	name: 'MailVacationAutoReplyApp',
	components: {
		ScreenContent,
	},
	props: {
		state: {
			type: Object as PropType<ScreenStateData>,
			required: true,
		},
		mailboxListPath: {
			type: String,
			default: '',
		},
		timezoneId: {
			type: String,
			default: '',
		},
		editorId: {
			type: String,
			default: '',
		},
		editorNode: {
			type: Object as PropType<HTMLElement | null>,
			default: null,
		},
		transport: {
			type: Object as PropType<SignatureTransport | null>,
			default: null,
		},
		retryHandler: {
			type: Function as unknown as PropType<RetryHandler | null>,
			default: null,
		},
		selectMailboxHandler: {
			type: Function as unknown as PropType<MailboxSelectHandler | null>,
			default: null,
		},
		activeChangeHandler: {
			type: Function as unknown as PropType<ActiveChangeHandler | null>,
			default: null,
		},
	},
	emits: ['retry', 'selectMailbox', 'changeActive'],
	setup()
	{
		return {
			legacyHostRole: LegacyHostRole,
		};
	},
	methods: {
		content(): ScreenContentControl
		{
			return this.$refs.content as ScreenContentControl;
		},

		handleRetry(): void
		{
			this.$emit('retry');
			this.retryHandler?.();
		},

		handleSelectMailbox(mailboxId: number): void
		{
			this.$emit('selectMailbox', mailboxId);
			this.selectMailboxHandler?.(mailboxId);
		},

		handleActiveChange(active: boolean): void
		{
			this.$emit('changeActive', active);
			this.activeChangeHandler?.(active);
		},

		getActive(): boolean
		{
			return this.content().getActive();
		},

		getPeriodRequest(setting?: VacationAutoReplySetting | null): PeriodRequest
		{
			return this.content().getPeriodRequest(setting);
		},

		getEditorBody(): string
		{
			return this.content().getEditorBody();
		},

		saveEditor(): boolean
		{
			return this.content().saveEditor();
		},

		showEditorError(text: string): void
		{
			this.content().showEditorError(text);
		},

		clearEditorError(): void
		{
			this.content().clearEditorError();
		},

		applySetting(setting: VacationAutoReplySetting): boolean
		{
			return this.content().applySetting(setting);
		},

		setReadonly(readonly: boolean): void
		{
			this.content().setReadonly(readonly);
		},

		getFieldErrorTargets(): FieldErrorTargets
		{
			return this.content().getFieldErrorTargets();
		},

		getReadonlyNoteId(): string
		{
			return this.content().getReadonlyNoteId();
		},
	},
	template: `
		<div
			class="mail-vacation-auto-reply-form"
			:data-role="legacyHostRole"
			:data-status="state.status"
			:data-saving="state.saving ? 'true' : 'false'"
		>
			<ScreenContent
				ref="content"
				:state="state"
				:mailbox-list-path="mailboxListPath"
				:timezone-id="timezoneId"
				:editor-id="editorId"
				:editor-node="editorNode"
				:transport="transport"
				@retry="handleRetry"
				@select-mailbox="handleSelectMailbox"
				@change-active="handleActiveChange"
			/>
		</div>
	`,
});
