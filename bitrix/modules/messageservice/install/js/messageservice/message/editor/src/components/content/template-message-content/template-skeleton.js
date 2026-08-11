import { BLine } from 'ui.system.skeleton.vue';

// @vue/component
export const TemplateSkeleton = {
	name: 'TemplateSkeleton',
	components: {
		BLine,
	},
	computed: {
		height(): number
		{
			return 24;
		},
		radius(): number
		{
			return 8;
		},
	},
	template: `
		<div class="messageservice-message-editor__flex-column" style="gap: 6px;">
			<BLine :width="104" :height="height" :radius="radius"/>
			<BLine :width="548" :height="height" :radius="radius"/>
		</div>
	`,
};
