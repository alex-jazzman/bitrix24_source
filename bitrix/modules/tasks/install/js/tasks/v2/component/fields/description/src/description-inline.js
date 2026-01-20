import { Event } from 'main.core';
import { TextEditor, TextEditorComponent } from 'ui.text-editor';
import type { TextEditorOptions } from 'ui.text-editor';

import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { DefaultEditorOptions } from 'tasks.v2.component.entity-text';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './description.css';

// @vue/component
export const DescriptionInline = {
	name: 'TaskDescriptionInline',
	components: {
		TextEditorComponent,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
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
		taskDescription(): string
		{
			return this.task.description;
		},
		copilotParams(): Object
		{
			if (Core.getParams().features.isCopilotEnabled)
			{
				return {
					copilotOptions: {
						moduleId: 'tasks',
						category: 'tasks',
						contextId: `tasks_${this.taskId}`,
						menuForceTop: false,
					},
					triggerBySpace: true,
				};
			}

			return {};
		},
	},
	created(): void
	{
		const additionalEditorOptions: TextEditorOptions = {
			minHeight: 20,
			maxHeight: 112,
			placeholder: this.loc('TASKS_V2_DESCRIPTION_INLINE_EDITOR_PLACEHOLDER'),
			content: this.taskDescription,
			newLineMode: 'paragraph',
			events: {
				onFocus: this.handleEditorFocus,
				onBlur: this.handleEditorBlur,
				onChange: this.handleEditorChange,
			},
			copilot: this.copilotParams,
		};

		this.editor = new TextEditor({ ...DefaultEditorOptions, ...additionalEditorOptions });
	},
	mounted(): void
	{
		Event.bind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);

		fileService.get(this.taskId).getAdapter().getUploader().assignPaste(this.$refs.description);
	},
	beforeUnmount(): void
	{
		Event.unbind(this.editor.getScrollerContainer(), 'scroll', this.handleScroll);

		fileService.get(this.taskId).getAdapter().getUploader().unassignPaste(this.$refs.description);
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
			void taskService.update(this.taskId, { description });
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
	},
	template: `
		<div
			class="tasks-card-description-inline"
			:class="{ '--bottom-shadow': !isScrolledToBottom, '--top-shadow': !isScrolledToTop }"
			:data-task-id="taskId"
			:data-task-field-id="'description'"
			ref="description"
		>
			<div class="tasks-card-description-inline-shadow --revert" :class="{'--shown': !isScrolledToTop}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
			<TextEditorComponent :editorInstance="editor"/>
			<div class="tasks-card-description-inline-shadow" :class="{'--shown': !isScrolledToBottom}">
				<div class="tasks-card-description-inline-shadow-white"/>
				<div class="tasks-card-description-inline-shadow-black"/>
			</div>
		</div>
	`,
};
