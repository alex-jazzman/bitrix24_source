import { Type } from 'main.core';
import { defineComponent, type PropType } from 'ui.vue3';

import {
	type AiAssistantSearchBlockType,
	MessageBuilderPlainColorToken,
	MessageBuilderGradientColorToken,
} from 'im.v2.const';

import './progress-bar.css';

type ProgressType = NonNullable<AiAssistantSearchBlockType['progress']>;

const MIN_VALUE = 0;
const MAX_VALUE = 100;

// The branded gradient is the look UX gives this bar, so an absent token means the gradient,
// not a plain color. An unknown token falls back to the base color, matching the server normalization.
const DEFAULT_COLOR_TOKEN = MessageBuilderGradientColorToken['ai-assistant'];
const FALLBACK_COLOR_TOKEN = MessageBuilderPlainColorToken.base;

const resolveColorToken = (colorToken?: string): string => {
	if (!colorToken)
	{
		return DEFAULT_COLOR_TOKEN;
	}

	const plainKey = colorToken as keyof typeof MessageBuilderPlainColorToken;
	const gradientKey = colorToken as keyof typeof MessageBuilderGradientColorToken;

	if (!MessageBuilderPlainColorToken[plainKey] && !MessageBuilderGradientColorToken[gradientKey])
	{
		return FALLBACK_COLOR_TOKEN;
	}

	return colorToken;
};

// @vue/component
export const AiAssistantSearchProgressBar = defineComponent({
	name: 'AiAssistantSearchProgressBar',
	props: {
		progress: {
			type: Object as PropType<ProgressType>,
			required: true,
		},
		label: {
			type: String,
			required: true,
		},
	},
	setup(): { MIN_VALUE: number, MAX_VALUE: number }
	{
		return { MIN_VALUE, MAX_VALUE };
	},
	computed: {
		// second line of defence: the server already normalizes the value
		value(): number
		{
			if (!Type.isNumber(this.progress.value))
			{
				return MIN_VALUE;
			}

			return Math.min(MAX_VALUE, Math.max(MIN_VALUE, this.progress.value));
		},
		colorClass(): string
		{
			return `--color-${resolveColorToken(this.progress.colorToken)}`;
		},
		isComplete(): boolean
		{
			return this.value >= MAX_VALUE;
		},
		fillStyle(): { width: string }
		{
			return { width: `${this.value}%` };
		},
	},
	template: `
		<div
			class="bx-im-message-block-ai-assistant-search-progress__container"
			role="progressbar"
			:aria-label="label"
			:aria-valuenow="value"
			:aria-valuemin="MIN_VALUE"
			:aria-valuemax="MAX_VALUE"
			data-testid="im-message-block-ai-assistant-search-progress"
		>
			<div
				class="bx-im-message-block-ai-assistant-search-progress__fill"
				:class="colorClass"
				:style="fillStyle"
			>
				<div
					v-if="!isComplete"
					class="bx-im-message-block-ai-assistant-search-progress__glance"
				></div>
			</div>
		</div>
	`,
});
