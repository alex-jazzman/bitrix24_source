import { mapActions } from 'ui.vue3.pinia';
import {
	ColorMenuTopBtn,
	diagramStore as useDiagramStore,
	FRAME_COLOR_NAMES,
} from '../../../../entities/blocks';

// @vue/component
export const ChangeFrameColorTopBtn = {
	name: 'ChangeFrameColorTopBtn',
	components: {
		ColorMenuTopBtn,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
	},
	emits: ['update:open'],
	computed: {
		colorName(): string
		{
			return this.block.node.frameColorName;
		},
		colorOptions(): Array<string>
		{
			return Object.values(FRAME_COLOR_NAMES);
		},
	},
	methods: {
		...mapActions(useDiagramStore, [
			'updateFrameColorName',
			'publicDraft',
			'updateStatus',
		]),
		async onUpdateFrameColor(colorName: string): Promise<void>
		{
			try
			{
				this.updateFrameColorName(this.block.id, colorName);
				await this.publicDraft();
				this.updateStatus(true);
			}
			catch
			{
				this.updateStatus(false);
			}
		},
	},
	template: `
		<ColorMenuTopBtn
			:colorName="colorName"
			:options="colorOptions"
			@update:colorName="onUpdateFrameColor"
			@update:open="$emit('update:open', $event)"
		/>
	`,
};
