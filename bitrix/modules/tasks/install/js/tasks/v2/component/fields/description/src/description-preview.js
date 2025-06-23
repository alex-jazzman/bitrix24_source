import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { BIcon } from 'ui.icon-set.api.vue';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { fileService } from 'tasks.v2.provider.service.file-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import './description.css';

// @vue/component
export const DescriptionPreview = {
	name: 'TaskDescriptionPreview',
	components: {
		HtmlFormatterComponent,
		BIcon,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
	},
	emits: ['previewButtonClick'],
	setup(): Object
	{
		return {
			BIcon,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isOverflowing: false,
			files: [],
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		taskDescription(): string
		{
			return this.task.description ?? '';
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		isMoreButtonShown(): boolean
		{
			return this.isOverflowing || this.readonly;
		},
	},
	watch: {
		async taskDescription(): void
		{
			await this.$nextTick();
			//TODO files can break this logic
			this.updateIsOverflowing();
		},
	},
	async created(): Promise<void>
	{
		this.files = await fileService.get(this.taskId).list(this.task.fileIds);
	},
	async mounted(): Promise<void>
	{
		setTimeout(() => this.updateIsOverflowing(), 200);
	},
	methods: {
		updateIsOverflowing(): void
		{
			this.isOverflowing = this.$el.offsetHeight - 16 < this.$refs.htmlFormatter.$el.offsetHeight;
		},
		onPreviewClick(event): void
		{
			if (event.target.closest('a'))
			{
				return;
			}

			this.$emit('previewButtonClick', { doOpenInEditMode: false });
		},
		onEditButtonClick(): void
		{
			this.$emit('previewButtonClick', { doOpenInEditMode: true });
		},
		onMoreButtonClick(): void
		{
			this.$emit('previewButtonClick', { doOpenInEditMode: false });
		},
	},
	template: `
		<div class="tasks-card-description-preview">
			<HtmlFormatterComponent
				:bbcode="task.description"
				:options="{
					fileMode: 'disk',
				}"
				:formatData="{ files }"
				ref="htmlFormatter"
				@click="onPreviewClick"
			/>
			<div class="tasks-card-description-preview-button" @click="onMoreButtonClick">
				<div v-if="isMoreButtonShown" class="tasks-card-description-preview-button-more">
					<span class="tasks-card-description-preview-button-text">
						{{ loc('TASKS_V2_DESCRIPTION_PREVIEW_BUTTON_MORE') }}
					</span>
				</div>
				<div v-else class="tasks-card-description-preview-button-edit">
					<BIcon
						:size="18"
						:name="Outline.EDIT_L"
					/>
					<span class="tasks-card-description-preview-button-text">
						{{ loc('TASKS_V2_DESCRIPTION_PREVIEW_BUTTON_EDIT') }}
					</span>
				</div>
			</div>
		</div>
	`,
};
