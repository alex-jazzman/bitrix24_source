import { Loc, Text } from 'main.core';
import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BMenu } from 'ui.system.menu.vue';
import { TextSm } from 'ui.system.typography.vue';
import { SenderSelector } from 'ui.mail.sender-selector';

import { type EditorSender as SenderOption, type EditorStore } from '../model/editor-store';

export type EditorSenderInstance = {
	focus(): void;
};

type AddedSender = { name: string; email: string };
type SenderControl = { selector: SenderSelector | null; disposed: boolean };
type SenderMenuOptions = {
	bindElement: HTMLElement;
	className: string;
	maxWidth: number;
	closeOnItemClick: boolean;
	items: {
		id: string;
		title: string;
		isSelected?: boolean;
		onClick(): void;
	}[];
};

export const EditorSender = defineComponent({
	name: 'CrmMailTemplateEditorSender',
	components: { Chip, BMenu, TextSm },
	props: {
		store: {
			type: Object as PropType<EditorStore>,
			required: true,
		},
	},
	expose: ['focus'],
	setup()
	{
		const senderControl: SenderControl = { selector: null, disposed: false };

		return {
			Loc,
			ChipDesign,
			ChipSize,
			fieldId: `crm-mail-template-sender-${Text.getRandom()}`,
			senderControl: markRaw(senderControl),
		};
	},
	data()
	{
		const { emailFrom, senders } = this.store.state;
		const savedSender: SenderOption[] = senders.some((sender) => sender.value === emailFrom)
			? []
			: [{ value: emailFrom, label: emailFrom }]
		;

		return {
			isMenuShown: false,
			addedSenders: savedSender,
		};
	},
	computed: {
		isDisabled(): boolean
		{
			return !this.store.state.canEdit || this.store.state.busy;
		},
		senders(): SenderOption[]
		{
			const senders = new Map<string, SenderOption>();
			senders.set('', { value: '', label: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER_DEFAULT') ?? '' });
			[...this.store.state.senders, ...this.addedSenders].forEach((sender) => {
				if (sender.value !== '')
				{
					senders.set(sender.value, sender);
				}
			});

			const savedValue = this.store.state.emailFrom;
			if (!senders.has(savedValue))
			{
				senders.set(savedValue, { value: savedValue, label: savedValue });
			}

			return [...senders.values()];
		},
		selectedLabel(): string
		{
			return this.senders.find((sender) => sender.value === this.store.state.emailFrom)?.label
				|| this.store.state.emailFrom
			;
		},
		error(): string
		{
			return this.store.state.errors
				.filter((error) => error.field === 'emailFrom')
				.map((error) => error.message)
				.join('\n')
			;
		},
		menuOptions(): SenderMenuOptions
		{
			const items: SenderMenuOptions['items'] = this.senders.map((sender, index) => ({
				id: `crm-mail-template-sender-option-${index}`,
				title: sender.label || sender.value,
				isSelected: sender.value === this.store.state.emailFrom,
				onClick: () => this.handleSelect(sender.value),
			}));
			if (this.store.state.canAddSender)
			{
				items.push({
					id: 'crm-mail-template-sender-add',
					title: Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER_ADD') ?? '',
					onClick: this.handleAddSender,
				});
			}

			return {
				bindElement: (this.$refs.chip as { $el: HTMLElement }).$el,
				className: 'crm-mail-template-editor__choice-menu',
				maxWidth: this.$el.getBoundingClientRect().width,
				closeOnItemClick: true,
				items,
			};
		},
	},
	watch: {
		isDisabled(): void
		{
			this.isMenuShown = false;
		},
	},
	beforeUnmount(): void
	{
		this.senderControl.disposed = true;
		this.senderControl.selector = null;
		this.isMenuShown = false;
	},
	methods: {
		focus(): void
		{
			if (this.senderControl.disposed || this.isDisabled)
			{
				return;
			}

			this.isMenuShown = false;
			(this.$refs.chip as { $el: HTMLElement } | undefined)?.$el.focus();
		},
		handleMenu(): void
		{
			if (!this.isDisabled && !this.senderControl.disposed)
			{
				this.isMenuShown = !this.isMenuShown;
			}
		},
		handleSelect(value: string): void
		{
			if (!this.senderControl.disposed)
			{
				this.store.setField('emailFrom', value);
			}
			this.isMenuShown = false;
		},
		handleAddSender(): void
		{
			if (this.isDisabled || !this.store.state.canAddSender || this.senderControl.disposed)
			{
				return;
			}

			this.isMenuShown = false;
			this.senderControl.selector ??= new SenderSelector({ isSenderAvailable: true });
			this.senderControl.selector.showProviderShowcase(this.handleSenderAdded);
		},
		handleSenderAdded(mailbox: AddedSender): void
		{
			if (this.senderControl.disposed || this.isDisabled || !this.store.state.canAddSender)
			{
				return;
			}

			const value = `${mailbox.name} <${mailbox.email}>`;
			this.addedSenders.push({ value, label: value });
			this.store.setField('emailFrom', value);
		},
	},
	template: `
		<div
			class="crm-mail-template-editor__field crm-mail-template-editor__sender"
			data-testid="crm-mail-template-editor-sender"
		>
			<TextSm :id="fieldId + '-label'" class="crm-mail-template-editor__field-label">
				{{ Loc.getMessage('CRM_MAIL_TEMPLATE_EDITOR_SENDER') }}
			</TextSm>
			<div class="crm-mail-template-editor__field-content">
				<Chip
					ref="chip"
					:id="fieldId"
					class="crm-mail-template-editor__sender_chip"
					:text="selectedLabel"
					:design="isDisabled ? ChipDesign.Disabled : ChipDesign.Tinted"
					:size="ChipSize.Md"
					:dropdown="!isDisabled"
					:aria-labelledby="fieldId + '-label ' + fieldId"
					:aria-disabled="isDisabled"
					aria-expanded="false"
					:tabindex="isDisabled ? -1 : 0"
					aria-haspopup="menu"
					role="button"
					data-testid="crm-mail-template-sender"
					rounded
					@click="handleMenu"
					@keydown.space.prevent="handleMenu"
					@keydown.down.prevent="handleMenu"
				/>
				<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
				<TextSm v-if="error" class="crm-mail-template-editor__field-error" wrap="break-words" role="alert">
					{{ error }}
				</TextSm>
			</div>
		</div>
	`,
});
