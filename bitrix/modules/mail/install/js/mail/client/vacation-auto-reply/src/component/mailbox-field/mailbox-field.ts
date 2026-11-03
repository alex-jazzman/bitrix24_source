import { Loc, Type } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';

import {
	MailboxInputId,
	MailboxSelectAdapter,
	type MailboxSelectAdapterOptions,
} from '../../infrastructure/adapter/mailbox-select-adapter';
import { type MailboxOption } from '../../types';

const TestId = Object.freeze({
	field: 'mail-vacation-auto-reply-mailbox',
	error: 'mail-vacation-auto-reply-error-mailbox',
});

function loc(phrase: string): string
{
	return Loc.getMessage(phrase) ?? '';
}

// @vue/component
export const MailboxField = defineComponent({
	name: 'MailVacationAutoReplyMailboxField',
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		mailboxes: {
			type: Array as PropType<MailboxOption[]>,
			required: true,
		},
		error: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup()
	{
		return {
			inputId: MailboxInputId,
			testId: TestId,
		};
	},
	data(): { adapter: MailboxSelectAdapter | null }
	{
		return {
			adapter: null,
		};
	},
	computed: {
		label(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_MAILBOX_LABEL');
		},

		placeholder(): string
		{
			return loc('MAIL_VACATION_AUTO_REPLY_MAILBOX_PLACEHOLDER');
		},

		normalizedMailboxes(): MailboxOption[]
		{
			return this.mailboxes.filter((mailbox: MailboxOption): boolean => mailbox.id > 0);
		},
	},
	watch: {
		modelValue(): void
		{
			this.syncAdapter();
		},

		mailboxes(): void
		{
			this.syncAdapter();
		},
	},
	mounted(): void
	{
		this.syncAdapter();
	},
	beforeUnmount(): void
	{
		this.destroyAdapter();
	},
	methods: {
		syncAdapter(): void
		{
			const container = this.$refs.field;
			if (!Type.isElementNode(container))
			{
				return;
			}

			if (this.normalizedMailboxes.length === 0)
			{
				this.destroyAdapter();

				return;
			}

			if (this.adapter === null)
			{
				this.createAdapter(container as HTMLElement);

				return;
			}

			this.adapter.setSelectedId(this.modelValue);
		},

		createAdapter(container: HTMLElement): void
		{
			const options: MailboxSelectAdapterOptions = {
				container,
				mailboxes: this.normalizedMailboxes,
				selectedId: this.modelValue,
				placeholder: this.placeholder,
				onSelect: (mailboxId: number): void => {
					this.$emit('update:modelValue', mailboxId);
				},
			};

			this.adapter = markRaw(new MailboxSelectAdapter(options));
		},

		destroyAdapter(): void
		{
			this.adapter?.destroy();
			this.adapter = null;
		},
	},
	template: `
		<div class="mail-vacation-auto-reply-form__row">
			<label class="mail-vacation-auto-reply-form__label" :for="inputId">
				{{ label }}
			</label>
			<div
				ref="field"
				class="mail-vacation-auto-reply-form__control"
				:data-testid="testId.field"
			></div>
			<div
				:id="testId.error"
				class="mail-vacation-auto-reply-form__error"
				data-role="error-mailbox"
				:data-testid="testId.error"
			>{{ error }}</div>
		</div>
	`,
});
