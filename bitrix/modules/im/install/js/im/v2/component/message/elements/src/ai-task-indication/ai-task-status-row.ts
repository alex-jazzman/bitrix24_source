import { BIcon } from 'ui.icon-set.api.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { type AiTaskOperation, type ImModelMessage } from 'im.v2.model';

import {
	AiTaskIndicationLayout,
	findAiTaskFrame,
	getAiTaskOperation,
	isAiTaskCaptionPlace,
	PROGRESSIVE_FRAMES,
	type AiTaskFrame,
	type AiTaskIndicationLayoutValue,
} from './ai-task-frames';

import './ai-task-indication.css';

/**
 * The caption of the running operation: an icon, the stage and the running dots. Mounted by
 * whoever owns the place it belongs in - the time row of the message for a bubble (map §3.2), the
 * layer around the graphics for media and the round player (§3.3) - which is why it is a component
 * of its own and not a branch of `AiTaskIndication`.
 *
 * It carries no state and speaks to nobody: the visibility of the caption message and the
 * announcements of the operation stay with `AiTaskIndication`, mounted on every indicated message.
 */
// @vue/component
export const AiTaskStatusRow = defineComponent({
	name: 'AiTaskStatusRow',
	components: { BIcon } as { BIcon: typeof BIcon },
	props: {
		message: {
			type: Object as PropType<ImModelMessage>,
			required: true,
		},
		layout: {
			type: String as PropType<AiTaskIndicationLayoutValue>,
			default: AiTaskIndicationLayout.bubble,
		},
	},
	computed: {
		// Every progressive stage is kept in the DOM inside one grid cell, so the row holds the
		// width of the longest caption and a stage change does not resize the message.
		stages: () => PROGRESSIVE_FRAMES,
		operation(): AiTaskOperation | null
		{
			return getAiTaskOperation(this.$store, this.message);
		},
		/**
		 * Every indicated source carries the layer, the caption message alone carries the caption. The
		 * row asks the operation about it rather than being told, so a host that mounts it on every
		 * source of the set still ends up with one caption.
		 */
		isCaptionPlace(): boolean
		{
			return isAiTaskCaptionPlace(this.operation, this.message);
		},
		frame(): AiTaskFrame | null
		{
			return this.isCaptionPlace ? findAiTaskFrame(this.operation) : null;
		},
		layoutModifier(): string
		{
			return `--${this.layout}`;
		},
	},
	methods: {
		isCurrentStage(stage: AiTaskFrame): boolean
		{
			return this.frame?.name === stage.name;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			v-if="frame"
			class="bx-im-message-ai-task__status"
			:class="[layoutModifier, '--' + frame.tone]"
			data-testid="im-message-ai-task-status"
		>
			<BIcon class="bx-im-message-ai-task__icon" :name="frame.icon" aria-hidden="true" />
			<span class="bx-im-message-ai-task__stack">
				<span
					v-for="stage in stages"
					:key="stage.name"
					class="bx-im-message-ai-task__label"
					:class="{ '--current': isCurrentStage(stage) }"
					:aria-hidden="!isCurrentStage(stage)"
				>{{ loc(stage.labelKey) }}</span>
				<span
					v-if="frame.isTerminal"
					:key="frame.name"
					class="bx-im-message-ai-task__label --current --terminal"
					:data-testid="'im-message-ai-task-outcome-' + frame.name"
				>{{ loc(frame.labelKey) }}</span>
			</span>
			<span
				v-if="!frame.isTerminal"
				class="bx-im-message-ai-task__dots"
				aria-hidden="true"
				data-testid="im-message-ai-task-progress"
			>
				<i class="bx-im-message-ai-task__dot"></i>
				<i class="bx-im-message-ai-task__dot"></i>
				<i class="bx-im-message-ai-task__dot"></i>
			</span>
		</div>
	`,
});
