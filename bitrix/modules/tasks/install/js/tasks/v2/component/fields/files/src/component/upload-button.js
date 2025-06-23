import { fileService } from 'tasks.v2.provider.service.file-service';
import { Button as UiButton, ButtonSize } from 'ui.vue3.components.button';

// @vue/component
export const UploadButton = {
	components: {
		UiButton,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	setup(): Object
	{
		return {
			ButtonSize,
		};
	},
	methods: {
		handleClick(): void
		{
			fileService.get(this.taskId).browse({
				bindElement: this.$el,
			});
		},
	},
	template: `
		<span data-task-files-upload>
			<UiButton
				:text="loc('TASKS_V2_FILES_UPLOAD')"
				:size="ButtonSize.MEDIUM"
				@click="handleClick"
			/>
		</span>
	`,
};
