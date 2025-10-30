import { mapGetters } from 'ui.vue3.vuex';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { Model } from 'tasks.v2.const';
import { DropZone } from 'tasks.v2.component.drop-zone';

import { DescriptionEditor } from './description-editor';

import './description.css';

// @vue/component
export const DescriptionSheet = {
	name: 'TaskDescriptionSheet',
	components: {
		BottomSheet,
		DescriptionEditor,
		DropZone,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		isShown: {
			type: Boolean,
			required: true,
		},
		doOpenInEditMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['show', 'close'],
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
	},
	watch: {
		titleFieldOffsetHeight(): void
		{
			this.$refs.bottomSheet?.adjustPosition();
		},
	},
	methods: {
		handleShow(): void
		{
			this.$emit('show');
		},
	},
	template: `
		<BottomSheet :isShown="isShown" :isExpanded="true" ref="bottomSheet">
			<DescriptionEditor
				ref="editorComponent"
				:taskId="taskId"
				:doOpenInEditMode="doOpenInEditMode"
				:isExpanded="true"
				@show="handleShow"
				@close="$emit('close')"
			/>
			<DropZone :taskId="taskId"/>
		</BottomSheet>
	`,
};
