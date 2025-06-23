import { Event } from 'main.core';
import type { TextEditorOptions } from 'ui.text-editor';
import { TextEditor, TextEditorComponent } from 'ui.text-editor';

import { TaskModel } from 'tasks.v2.model.tasks';
import { Model } from 'tasks.v2.const';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { fileService } from 'tasks.v2.provider.service.file-service';

import { DefaultEditorOptions } from './default-editor-options';
import './description.css';

// @vue/component
export const DescriptionInline = {
	name: 'TaskDescriptionInline',
	components: {
		TextEditorComponent,
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
			editor: null,
			DefaultEditorOptions,
		};
	},
	data(): Object
	{
		return {
			isFocused: false,
			isScrolledToTop: true,
			isScrolledToBottom: true,
		};
	},
	computed: {
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		taskDescription(): string
		{
			return this.task.description;
		},
	},
	created(): void
	{
		const additionalEditorOptions: TextEditorOptions = {
			minHeight: 20,
			maxHeight: 112,
			placeholder: this.loc('TASKS_V2_DESCRIPTION_INLINE_EDITOR_PLACEHOLDER'),
			content: this.taskDescription,
			events: {
				onFocus: () => this.handleEditorFocus(),
				onBlur: () => this.handleEditorBlur(),
				onChange: () => this.handleEditorChange(),
			},
		};
		this.editor = new TextEditor({ ...DefaultEditorOptions, ...additionalEditorOptions });
		Event.bind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
	},
	beforeUnmount(): void
	{
		Event.unbind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);
	},
	methods: {
		hasScroll(): boolean
		{
			return !this.isScrolledToTop || !this.isScrolledToBottom;
		},
		async handleEditorFocus(): void
		{
			this.isFocused = true;
		},
		async handleEditorBlur(): void
		{
			this.isFocused = false;

			const description = this.editor.getText();
			void taskService.update(
				this.taskId,
				{ description },
			);
		},
		handleEditorChange(): void
		{
			this.handleScroll();
		},
		handleScroll(): void
		{
			const container = this.editor.getScrollerContainer();
			this.isScrolledToTop = container.scrollTop === 0;
			this.isScrolledToBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 5;
		},
		async handlePaste(clipboardEvent: ClipboardEvent): void
		{
			if (!this.isFocused)
			{
				return;
			}

			const service = fileService.get(this.taskId);

			void service.uploadFromClipboard({
				clipboardEvent,
			});
		},
	},
	template: `
		<div
			class="tasks-card-description-inline"
			:class="{ '--bottom-shadow': !isScrolledToBottom, '--top-shadow': !isScrolledToTop }"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
			@paste="handlePaste"
		>
			<div class="tasks-card-description-inline-shadow --revert" :class="{'--shown': !isScrolledToTop}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
			<TextEditorComponent :editor-instance="editor"/>
			<div class="tasks-card-description-inline-shadow" :class="{'--shown': !isScrolledToBottom}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
		</div>
	`,
};
