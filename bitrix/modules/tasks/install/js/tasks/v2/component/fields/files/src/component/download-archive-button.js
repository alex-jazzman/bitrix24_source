import { SidePanel } from 'main.sidepanel';
import { EntityTypes, fileService } from 'tasks.v2.provider.service.file-service';

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
		archiveLink: {
			type: String,
			default: null,
		},
		entityId: {
			type: [Number, String],
			default: null,
		},
		entityType: {
			type: String,
			default: EntityTypes.Task,
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
		downloadLink(): ?string
		{
			return this.archiveLink ?? this.task.archiveLink;
		},
		fileServiceEntityId(): number | string
		{
			return this.entityId ?? this.taskId;
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
			const service = fileService.get(this.fileServiceEntityId, this.entityType);

			if (service.hasPendingRequests())
			{
				this.loading = true;
				await service.handleSave();
				this.loading = false;
			}

			SidePanel.Instance.emulateAnchorClick(this.downloadLink);
		},
	},
	template: `
		<div data-task-files-download-archive data-testid="task-files-download-archive">
			<UiButton
				:class="'tasks-files-download-archive-button'"
				:text="loc('TASKS_V2_FILES_DOWNLOAD_ARCHIVE', { '#FILES_SIZE#': formattedFilesSize })"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				:state="loading ? ButtonState.WAITING : null"
				data-testid="task-files-download-archive-btn"
				@click="downloadArchive"
			/>
		</div>
	`,
};
