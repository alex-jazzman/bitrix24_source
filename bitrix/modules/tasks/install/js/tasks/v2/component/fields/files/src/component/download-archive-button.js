import { SidePanel } from 'main.sidepanel';
import { fileService } from 'tasks.v2.provider.service.file-service';

import { type UploaderFileInfo, formatFileSize } from 'ui.uploader.core';
import { Button as UiButton, ButtonSize, AirButtonStyle, ButtonCounterColor, ButtonState } from 'ui.vue3.components.button';
import { Outline } from 'ui.icon-set.api.vue';

import type { TaskModel } from 'tasks.v2.model.tasks';

// @vue/component
export const DownloadArchiveButton = {
	components: {
		UiButton,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		files: {
			type: Array,
			required: true,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			ButtonSize,
			AirButtonStyle,
			ButtonCounterColor,
			ButtonState,
			Outline,
		};
	},
	data(): Object
	{
		return {
			loading: false,
		};
	},
	computed: {
		archiveLink(): ?string
		{
			return this.task.archiveLink;
		},
		filesSize(): number
		{
			return this.files.reduce((total, file: UploaderFileInfo) => total + file.size, 0);
		},
		formattedFilesSize(): string
		{
			return formatFileSize(this.filesSize);
		},
	},
	methods: {
		async downloadArchive(): void
		{
			if (fileService.get(this.taskId).hasPendingRequests())
			{
				this.loading = true;
				await fileService.get(this.taskId).handleSave();
				this.loading = false;
			}

			SidePanel.Instance.emulateAnchorClick(this.archiveLink);
		},
	},
	template: `
		<div data-task-files-download-archive @click="downloadArchive">
			<UiButton
				:text="loc('TASKS_V2_FILES_DOWNLOAD_ARCHIVE', { '#FILES_SIZE#': formattedFilesSize })"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:state="loading ? ButtonState.WAITING : null"
			/>
		</div>
	`,
};
