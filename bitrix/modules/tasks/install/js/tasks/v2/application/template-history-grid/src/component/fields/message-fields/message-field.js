import type { PopupOptions } from 'main.popup';

import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { Hint } from 'tasks.v2.component.elements.hint';

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
				offsetLeft: this.$refs.errorIcon.$el.offsetWidth / 2,
				maxWidth: 494,
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
			<div v-if="message.link">{{ formattedMessage }}<a :href="message.link">{{ linkText }}</a></div>
			<span v-else>{{ message.message }}</span>
				<BIcon
					v-if="message.errors?.length > 0"
					ref="errorIcon"
					class="tasks-field-replication-error-icon"
					@mouseenter="openHint"
					:name="Outline.ALERT"
				/>
				<Hint
					v-if="showHint"
					:bindElement="$refs.errorIcon.$el"
					:options="popupOptions"
					@close="closeHint"
				>
					<div class="tasks-field-replication-sheet__error-hint-container">
						<div class="tasks-field-replication-sheet__error-hint__error-message">
							{{ errorMessage.replace('#LINK#', '') }}
						</div>
						<div
							v-if="errorLink"
							class="tasks-field-replication-sheet__error-hint__error-link-container"
						>
							<a
								:href="errorLink"
								class="tasks-field-replication-sheet__error-hint__error-link"
							>
								{{ loc('TASKS_V2_TEMPLATE_HISTORY_GRID_ACCESS_RIGHTS_MORE_LINK') }}
							</a>
						</div>
					</div>
				</Hint>
		</div>
	`,
};
