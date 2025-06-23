import { TaskModel } from 'tasks.v2.model.tasks';
import { Model } from 'tasks.v2.const';
import { EditButton } from './edit-button';
import { DescriptionPreview } from './description-preview';
import './description.css';

// @vue/component
export const DescriptionField = {
	name: 'TaskDescriptionField',
	components: {
		EditButton,
		DescriptionPreview,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	data(): Object
	{
		return {
			isSlotShown: false,
			doOpenInEditMode: false,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	methods: {
		onPreviewButtonClick(eventData): void
		{
			this.doOpenInEditMode = eventData.doOpenInEditMode === true;
			this.isSlotShown = true;
		},
		closeSlot(): void
		{
			this.isSlotShown = false;
		},
	},
	template: `
		<slot :isShown="isSlotShown" :doOpenInEditMode="doOpenInEditMode" :close="closeSlot"></slot>
		<div
			v-if="!readonly || task.description.length > 0"
			class="tasks-card-description-field"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
		>
			<EditButton v-if="task.description.length === 0" @click="isSlotShown = true"></EditButton>
			<DescriptionPreview
				v-else
				:taskId="taskId"
				@previewButtonClick="onPreviewButtonClick"
			/>
		</div>
	`,
};
