import { defineComponent } from 'ui.vue3';

import { CallAvatarColors } from './const';

import './css/avatar.css';

export const CallAvatar = defineComponent({
	name: 'CallAvatar',
	props: {
		testId: {
			type: String,
			default: null,
			required: true,
		},
		testState: {
			type: String,
			default: null,
		},
		testMeta: {
			type: String,
			default: null,
		},
		label: {
			type: String,
			default: null,
		},
		image: {
			type: String,
			default: null,
		},
		size: {
			type: [Number, null],
			default: null,
		},
		corner: {
			type: Boolean,
			default: false,
		},
		caller: {
			type: Boolean,
			default: false,
		},
		speaker: {
			type: Boolean,
			default: false,
		},
		color: {
			type: String,
			default: null,
		},
	},
	data(): { imageError: boolean }
	{
		return {
			imageError: false,
		};
	},
	computed: {
		hashColor(): string
		{
			if (this.color)
			{
				return this.color;
			}

			const colors = [...CallAvatarColors];

			if (this.label)
			{
				let hash = 0;
				for (let i = 0; i < this.label.length; i++)
				{
					hash = (hash << 5) - hash + (this.label.codePointAt(i) ?? 0);
					hash &= hash;
				}
				const index = Math.abs(hash) % colors.length;

				return colors[index];
			}

			const index = Math.floor(Math.random() * colors.length);

			return colors[index];
		},
		abbreviation(): string
		{
			if (!this.label)
			{
				return '';
			}

			if (this.label.length === 1 || this.label.length === 2)
			{
				return this.label;
			}

			const words = this.label.trim().split(/\s+/);

			if (words.length >= 2)
			{
				return (words[0][0] + words[1][0]).toUpperCase();
			}

			return this.label.slice(0, 2).toUpperCase();
		},
		pulseElements(): number
		{
			return this.speaker ? 3 : 2;
		},
		encodedImage(): string | null
		{
			if (!this.image || this.imageError)
			{
				return null;
			}

			return decodeURI(this.image) === this.image ? encodeURI(this.image) : this.image;
		},
		additionalClasses(): string[]
		{
			const classes: string[] = [];

			if (this.corner || this.$slots.corner)
			{
				classes.push('--corner');
			}

			if (this.speaker)
			{
				classes.push('--speaker');
			}

			if (this.caller)
			{
				classes.push('--caller');
			}

			return classes;
		},
		cssVariables(): Record<string, string>
		{
			const variables: Record<string, string> = {
				'--call-avatar-color': this.hashColor,
			};

			if (this.size)
			{
				variables['--call-avatar-size'] = `${this.size}px`;
			}

			return variables;
		},
		computedTestState(): string | null
		{
			const tokens: string[] = this.testState ? this.testState.split(/\s+/).filter(Boolean) : [];

			if (this.speaker && !tokens.includes('speaker'))
			{
				tokens.push('speaker');
			}

			if (this.caller && !tokens.includes('caller'))
			{
				tokens.push('caller');
			}

			return tokens.length > 0 ? tokens.join(' ') : null;
		},
	},
	watch: {
		image(): void
		{
			this.imageError = false;
		},
	},
	methods: {
		handleImageError(): void
		{
			this.imageError = true;
		},
	},
	template: `
		<div :data-testid="testId" :data-test-state="computedTestState" :data-test-meta="testMeta" class="call-avatar" :class="additionalClasses" :style="cssVariables">
			<div v-if="$slots.corner" class="call-avatar-corner">
				<slot name="corner"></slot>
			</div>
			<div class="call-avatar__body">
				<img v-if="encodedImage" :src="encodedImage" alt="" draggable="false" class="call-avatar__image" @error="handleImageError">
				<span v-else class="call-avatar__label">{{ abbreviation }}</span>
			</div>
			<div v-if="caller || speaker" class="call-avatar-pulse" :style="{ '--call-avatar-pulse-elements': pulseElements }">
				<div v-for="i in pulseElements" :key="i" :style="{ '--call-avatar-pulse-i' : i }"></div>
			</div>
		</div>
	`,
});
