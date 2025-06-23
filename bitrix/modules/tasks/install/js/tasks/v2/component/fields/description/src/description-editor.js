import { Dom } from 'main.core';
import type { PopupOptions } from 'main.popup';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Plugins, TextEditor, TextEditorComponent } from 'ui.text-editor';
import { Button, ButtonColor, ButtonSize } from 'ui.vue3.components.button';
import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';
import { Popup } from 'ui.vue3.components.popup';
import type { TextEditorOptions } from 'ui.text-editor';

import { TaskModel } from 'tasks.v2.model.tasks';
import { Model } from 'tasks.v2.const';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';

import { DefaultEditorOptions } from './default-editor-options';
import { Copilot } from './actions/copilot';
import { Attach } from './actions/attach';
import { Mention } from './actions/mention';
import './description.css';

// @vue/component
export const DescriptionEditor = {
	name: 'TaskDescriptionContent',
	components: {
		BIcon,
		TextEditorComponent,
		HtmlFormatterComponent,
		Popup,
		Button,
		Copilot,
		Attach,
		Mention,
	},
	props: {
		taskId: {
			type: [Number, String],
			required: true,
		},
		doOpenInEditMode: {
			type: Boolean,
			default: false,
		},
		isExpanded: {
			type: Boolean,
			default: null,
		},
	},
	emits: ['close', 'editorResize', 'show', 'expand'],
	setup(): Object
	{
		return {
			/** @type TextEditor */
			editor: null,
			ButtonSize,
			ButtonColor,
			Outline,
		};
	},
	data(): Object
	{
		return {
			isEditMode: false,
			isWarningPopupShown: false,
			files: [],
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		popupOptions(): PopupOptions
		{
			return {
				className: 'tasks-card-description-warning-popup',
				width: 380,
				padding: 24,
				autoHide: false,
				closeByEsc: false,
				overlay: true,
			};
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
	},
	async created(): Promise<void>
	{
		const additionalEditorOptions: TextEditorOptions = {
			minHeight: 100,
			placeholder: this.loc('TASKS_V2_DESCRIPTION_EDITOR_PLACEHOLDER'),
			content: this.task.description,
			events: {
				onChange: this.handleChange,
			},
			file: {
				mode: 'disk',
			},
		};

		this.editor = new TextEditor({ ...DefaultEditorOptions, ...additionalEditorOptions });

		this.isEditMode = this.doOpenInEditMode;

		this.files = await fileService.get(this.taskId).list(this.task.fileIds);

		this.editor.dispatchCommand(Plugins.File.ADD_FILES_COMMAND, this.files);
	},
	mounted(): void
	{
		this.$emit('show');

		if (this.task.description.length === 0)
		{
			this.isEditMode = true;
		}
	},
	methods: {
		handleChange(): void
		{
			this.$emit('editorResize');
		},
		handleCloseIconClick(): void
		{
			if (this.isEditMode && this.editor.getText() !== this.task.description)
			{
				this.isWarningPopupShown = true;

				return;
			}

			this.$emit('close');
			this.editor.setText(this.task.description);
		},
		handleSaveButtonClick(): void
		{
			void taskService.update(
				this.taskId,
				{ description: this.editor.getText() },
			);
			this.isEditMode = false;

			if (this.task.description.length === 0)
			{
				this.$emit('close');
			}
		},
		handleCancelButtonClick(): void
		{
			this.isEditMode = false;
			this.editor.setText(this.task.description);

			if (this.task.description.length === 0)
			{
				this.$emit('close');
			}
		},
		handleEditButtonClick(): void
		{
			void this.enableEdit();
		},
		async enableEdit(): void
		{
			this.isEditMode = true;
			await this.$nextTick();
			this.focusToEnd();
		},
		async adjustEditor(): Promise<void>
		{
			if (this.editor.getMaxHeight() !== this.$refs.editorWrapper.offsetHeight)
			{
				this.setMaxHeight(this.$refs.editorWrapper.offsetHeight);
			}
		},
		setMaxHeight(maxHeight: number): void
		{
			this.editor.setMaxHeight(maxHeight);
			Dom.style(this.$refs.htmlFormatterComponent.$el, 'max-height', `${maxHeight}px`);
		},
		showEditor(): void
		{
			Dom.show(this.$refs.editorWrapper);
		},
		hideEditor(): void
		{
			Dom.hide(this.$refs.editorWrapper);
		},
		focusToEnd(): void
		{
			this.editor.focus(null, { defaultSelection: 'rootEnd' });
		},
		handlePopupOkButtonClick(): void
		{
			this.$emit('close');
			this.editor.setText(this.task.description);
		},
		handlePopupCancelButtonClick(): void
		{
			this.isWarningPopupShown = false;
		},
		onExpandClick(): void
		{
			this.$emit('expand', !this.isExpanded);
		},
		onMentionButtonClick(): void
		{
			this.editor.dispatchCommand(BX.UI.TextEditor.Plugins.Mention.INSERT_MENTION_DIALOG_COMMAND);
		},
	},
	template: `
		<div class="tasks-card-description-wrapper">
			<div class="tasks-card-description-header">
				<div class="tasks-card-description-title">
					{{ loc('TASKS_V2_DESCRIPTION_TITLE') }}
				</div>
				<BIcon
					v-if="[true, false].includes(isExpanded)"
					class="tasks-card-description-expand-icon"
					:name="isExpanded ? Outline.COLLAPSE_L : Outline.EXPAND_L"
					@click="onExpandClick"
				/>
				<BIcon :name="Outline.CROSS_L" @click="handleCloseIconClick"/>
			</div>
			<div class="tasks-card-description-editor-wrapper" ref="editorWrapper">
				<TextEditorComponent v-if="isEditMode" :editor-instance="editor"/>
				<HtmlFormatterComponent
					v-show="!isEditMode"
					class="tasks-card-description-view"
					:bbcode="task.description"
					:options="{
						fileMode: 'disk',
					}"
					:formatData="{ files }"
					ref="htmlFormatterComponent"
				/>
			</div>
			<div v-if="!readonly" class="tasks-card-description-footer">
				<div v-if="isEditMode" class="tasks-card-description-action-list">
					<Copilot />
					<Attach/>
					<Mention @click="onMentionButtonClick"/>
				</div>
				<div class="tasks-card-description-footer-buttons">
					<template v-if="isEditMode">
						<Button
							:text="loc('TASKS_V2_DESCRIPTION_BUTTON_CANCEL')"
							:size="ButtonSize.MEDIUM"
							:color="ButtonColor.LINK"
							@click="handleCancelButtonClick"
						/>
						<Button
							:text="loc('TASKS_V2_DESCRIPTION_BUTTON_SAVE')"
							:size="ButtonSize.MEDIUM"
							:color="ButtonColor.PRIMARY"
							@click="handleSaveButtonClick"
						/>
					</template>
					<Button
						v-else
						:text="loc('TASKS_V2_DESCRIPTION_BUTTON_EDIT')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.LINK"
						@click="handleEditButtonClick"
					/>
				</div>
			</div>
			<Popup v-if="isWarningPopupShown" :options="popupOptions">
				<div class="tasks-card-description-warning-popup-content">
					<div class="tasks-card-description-warning-popup-title">
						{{ loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_TITLE') }}
					</div>
					<div class="tasks-card-description-warning-popup-description">
						{{ loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_DESCRIPTION') }}
					</div>
				</div>
				<div class="tasks-card-description-warning-popup-buttons">
					<Button
						:text="loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_BUTTON_CLOSE')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.PRIMARY"
						@click="handlePopupOkButtonClick"
					/>
					<Button
						:text="loc('TASKS_V2_DESCRIPTION_WARNING_POPUP_BUTTON_CANCEL')"
						:size="ButtonSize.MEDIUM"
						:color="ButtonColor.LIGHT_BORDER"
						@click="handlePopupCancelButtonClick"
					/>
				</div>
			</Popup>
		</div>
	`,
};
