import { defineComponent } from 'ui.vue3';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './hover-pill.css';

export const HoverPill = defineComponent({
	name: 'HoverPill',
	components: {
		BIcon,
	},
	props: {
		withClear: {
			type: Boolean,
			default: false,
		},
		withSettings: {
			type: Boolean,
			default: false,
		},
		textOnly: {
			type: Boolean,
			default: false,
		},
		noOffset: {
			type: Boolean,
			default: false,
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		active: {
			type: Boolean,
			default: false,
		},
		compact: {
			type: Boolean,
			default: false,
		},
		alert: {
			type: Boolean,
			default: false,
		},
		// The slot brings its own tab stop (a link, a button), so the pill root must not add a second one.
		withFocusableContent: {
			type: Boolean,
			default: false,
		},
		withTabStop: {
			type: Boolean,
			default: true,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		ariaHaspopup: {
			type: String,
			default: '',
		},
		ariaExpanded: {
			type: Boolean,
			default: null,
		},
		clearAriaLabel: {
			type: String,
			default: '',
		},
		settingsAriaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['clear', 'settings'],
	setup(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		classes(): { [key: string]: boolean }
		{
			return {
				'--text-only': this.textOnly,
				'--no-offset': this.noOffset,
				'--readonly': this.readonly,
				'--active': this.active,
				'--compact': this.compact,
				'--alert': this.alert,
			};
		},
		isTrigger(): boolean
		{
			return this.ariaLabel !== '';
		},
		clearLabel(): string
		{
			return this.clearAriaLabel || this.loc('TASKS_V2_HOVER_PILL_CLEAR_ARIA_LABEL');
		},
		settingsLabel(): string
		{
			return this.settingsAriaLabel || this.loc('TASKS_V2_HOVER_PILL_SETTINGS_ARIA_LABEL');
		},
	},
	methods: {
		handleContentKeyDown(event: KeyboardEvent): void
		{
			if (!this.isTrigger || (event.key !== 'Enter' && event.key !== ' '))
			{
				return;
			}

			event.preventDefault();
			this.$refs.content.click();
		},
		async handleClear(): Promise<void>
		{
			this.$emit('clear');

			await this.$nextTick();

			if (document.activeElement !== document.body)
			{
				return;
			}

			const fallback = this.isTrigger ? this.$refs.content : this.$el;
			if (fallback?.isConnected)
			{
				fallback.focus();
			}
		},
	},
	template: `
		<div
			class="b24-hover-pill"
			:class="classes"
			:tabindex="withTabStop && !isTrigger && !withFocusableContent ? 0 : null"
		>
			<div
				ref="content"
				class="b24-hover-pill-content"
				:role="isTrigger ? 'button' : null"
				:tabindex="isTrigger ? 0 : null"
				:aria-label="ariaLabel || null"
				:aria-haspopup="ariaHaspopup || null"
				:aria-expanded="ariaExpanded"
				@keydown="handleContentKeyDown"
			>
				<slot/>
			</div>
			<button
				v-if="withClear && !readonly"
				type="button"
				class="b24-hover-pill-remover"
				:aria-label="clearLabel"
				@click.stop="handleClear"
			>
				<BIcon :name="Outline.CROSS_L" aria-hidden="true"/>
			</button>
			<button
				v-if="withSettings"
				type="button"
				class="b24-hover-pill-remover"
				:aria-label="settingsLabel"
				@click.stop="$emit('settings')"
			>
				<BIcon :name="Outline.FILTER_2_LINES" aria-hidden="true"/>
			</button>
		</div>
	`,
});
