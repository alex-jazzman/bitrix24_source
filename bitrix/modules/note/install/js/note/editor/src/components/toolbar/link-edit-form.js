import { sanitizeUrl } from '../../utils/url';
import {
	EnterIcon,
	ExternalLinkIcon,
	TrashIcon,
} from '../ui/icons';

export const LinkEditFormComponent = {
	name: 'NoteLinkEditForm',
	components: {
		EnterIcon,
		ExternalLinkIcon,
		TrashIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
		linkValue: {
			type: String,
			default: '',
		},
		linkIsActive: {
			type: Boolean,
			default: false,
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
		showApply: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:linkValue', 'apply', 'unset'],
	computed: {
		safeLinkHref(): string
		{
			const editorTick = this.editorTick;
			void editorTick;
			const currentHref = this.editor?.getAttributes('link')?.href;

			return sanitizeUrl(this.linkValue || currentHref);
		},
		linkActionDisabled(): boolean
		{
			return !this.linkValue && !this.linkIsActive;
		},
	},
	mounted()
	{
		if (this.autofocus)
		{
			this.$nextTick(() => {
				const input = this.$refs.input;
				if (input instanceof HTMLInputElement)
				{
					input.focus();
					input.select();
				}
			});
		}
	},
	methods: {
		emitValue(value: string): void
		{
			this.$emit('update:linkValue', value.trim());
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Enter')
			{
				event.preventDefault();
				this.$emit('apply');
			}
		},
		openLink(): void
		{
			if (!this.safeLinkHref)
			{
				return;
			}

			window.open(this.safeLinkHref, '_blank', 'noopener,noreferrer');
		},
	},
	// language=Vue
	template: `
		<div class="note-editor-popover-row">
			<input
				ref="input"
				:value="linkValue"
				class="note-editor-input note-editor-input-clamp"
				placeholder="https://"
				@input="emitValue($event.target.value)"
				@keydown="handleKeydown"
			/>
			<template v-if="showApply">
				<button type="button" class="note-editor-popover-button" :disabled="linkActionDisabled" @click="$emit('apply')"><EnterIcon /></button>
				<div class="note-editor-popover-separator"></div>
			</template>
			<button type="button" class="note-editor-popover-button" :disabled="!safeLinkHref" @click="openLink"><ExternalLinkIcon /></button>
			<button type="button" class="note-editor-popover-button" :disabled="!linkIsActive" @click="$emit('unset')"><TrashIcon /></button>
		</div>
	`,
};
