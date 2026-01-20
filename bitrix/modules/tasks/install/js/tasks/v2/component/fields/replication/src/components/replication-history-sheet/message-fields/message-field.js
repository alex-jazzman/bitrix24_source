import type { PopupOptions } from 'main.popup';

import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Hint } from 'tasks.v2.component.elements.hint';

import { ErrorHint } from '../error-hint/error-hint';

import './message-field.css';

export type Message = {
	message: ?string,
	link: ?string,
	rowId: ?number,
	errors: ?Array<Object>,
};

const pattern = /\(#(\d+)\)(?![\S\s]*\(#\d+\))/;

// @vue/component
export const MessageField = {
	components: {
		BIcon,
		Hint,
		ErrorHint,
	},
	props: {
		/** @type Message */
		message: {
			type: Object,
			required: true,
		},
		activeHintRowId: {
			type: Number,
			default: null,
		},
	},
	emits: ['hintOpen', 'hintClose'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			showHint: false,
		};
	},
	computed: {
		formattedMessage(): ?string
		{
			return this.message.message?.replace(pattern, '').trim();
		},
		linkText(): ?string
		{
			return this.message.message?.match(pattern)[0] ?? null;
		},
		errorMessage(): ?string
		{
			return this.message.errors[0].MESSAGE;
		},
		errorLink(): ?string
		{
			return this.message.errors[0].LINK;
		},
		popupOptions(): PopupOptions
		{
			return {
				offsetLeft: this.$refs.error.$el.offsetWidth / 2,
				maxWidth: 494,
				width: 494,
			};
		},
	},
	methods: {
		openHint(): void
		{
			if (this.activeHintRowId !== null && this.activeHintRowId !== this.message.rowId)
			{
				return;
			}

			if (!this.showHint)
			{
				this.showHint = true;
				this.$emit('hintOpen', this.message.rowId);
			}
		},
		closeHint(): void
		{
			if (this.showHint)
			{
				this.showHint = false;
				this.$emit('hintClose', this.message.rowId);
			}
		},
	},
	template: `
		<div class="tasks-field-replication-message">
			<div v-if="message.link">{{ formattedMessage }} <a :href="message.link">{{ linkText }}</a></div>
			<span v-else>{{ message.message }}</span>
			<BIcon
				v-if="message.errors?.length > 0"
				class="tasks-field-replication-error-icon"
				:name="Outline.ALERT"
				ref="error"
				@mouseenter="openHint"
			/>
			<Hint v-if="showHint" :bindElement="$refs.error.$el" :options="popupOptions" @close="closeHint">
				<ErrorHint :errorMessage :errorLink/>
			</Hint>
		</div>
	`,
};
