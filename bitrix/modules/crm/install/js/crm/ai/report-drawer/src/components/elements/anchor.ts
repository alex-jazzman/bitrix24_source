import { defineComponent } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';

export const Anchor = defineComponent({
	name: 'Anchor',

	components: {
		Button,
	},

	emits: ['activated'],

	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
		};
	},

	props: {
		text: {
			type: String,
			required: true,
		},
		blockId: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
		},
	},

	methods: {
		handleClick(): Object
		{
			this.$emit('activated', this.blockId);

			return {};
		},
	},

	template: `
		<div :class="['crm-ai-report-drawer__anchor-wrapper', { active: isActive }]">
			<Button
				:text="text"
				:style="AirButtonStyle.OUTLINE"
				:size="ButtonSize.SMALL"
				:collapsedIcon="ButtonIcon.DOTS"
				class="crm-ai-report-drawer__anchor"
				@click="handleClick"
			/>
			<span class="crm-ai-report-drawer__arrow"></span>
		</div>
	`,
});
