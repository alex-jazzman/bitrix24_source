import { TextSm } from 'ui.system.typography.vue';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { tooltip } from 'tasks.v2.component.elements.hint';

import '../entity-text.css';

// @vue/component
export const ActionButton = {
	components: {
		BIcon,
		TextSm,
	},
	directives: { hint },
	props: {
		title: {
			type: String,
			default: '',
		},
		copilotText: {
			type: String,
			default: '',
		},
		iconName: {
			type: String,
			required: true,
		},
		iconColor: {
			type: String,
			default: '',
		},
		iconSize: {
			type: Number,
			default: null,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		showTooltip(): boolean
		{
			return this.title.length > 0;
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.title,
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
				},
			});
		},
	},
	template: `
		<div
			class="tasks-card-entity-text-action-button-container"
			v-hint="showTooltip ? tooltip : null"
		>
			<button class="tasks-card-entity-text-action-button" type="button">
				<BIcon
					:name="iconName"
					:color="iconColor"
					:size="iconSize"
					hoverable
					class="tasks-card-entity-text-action-button-icon"
				/>
			</button>
			<TextSm
				v-if="copilotText"
				class="tasks-card-entity-text-action-button-text-copilot"
			>
				{{ copilotText }}
			</TextSm>
		</div>
	`,
};
