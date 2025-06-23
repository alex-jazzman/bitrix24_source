import { mapGetters } from 'ui.vue3.vuex';
import { BottomSheet } from 'tasks.v2.component.elements.bottom-sheet';
import { Model } from 'tasks.v2.const';
import { DescriptionEditor } from './description-editor';
import './description.css';

// @vue/component
export const DescriptionSheet = {
	name: 'TaskDescriptionSheet',
	components: {
		BottomSheet,
		DescriptionEditor,
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
	data(): Object
	{
		return {
			isExpanded: false,
		};
	},
	computed: {
		...mapGetters({
			titleFieldOffsetHeight: `${Model.Interface}/titleFieldOffsetHeight`,
		}),
	},
	watch: {
		titleFieldOffsetHeight(): void
		{
			this.$refs.bottomSheet?.adjustPosition();
			void this.$refs.editorComponent?.adjustEditor();
		},
	},
	methods: {
		onAfterEnter(): void
		{
			this.$refs.editorComponent.focusToEnd();
		},
		handleShow(): void
		{
			void this.$refs.editorComponent.adjustEditor();

			this.$emit('show');
		},
	},
	template: `
		<BottomSheet :isShown="isShown" :isExpanded="isExpanded" @after-enter="onAfterEnter" ref="bottomSheet">
			<DescriptionEditor
				ref="editorComponent"
				:taskId="taskId"
				:doOpenInEditMode="doOpenInEditMode"
				:isExpanded="isExpanded"
				@expand="isExpanded = !isExpanded"
				@show="handleShow"
				@close="$emit('close')"
			></DescriptionEditor>
		</BottomSheet>
	`,
};
