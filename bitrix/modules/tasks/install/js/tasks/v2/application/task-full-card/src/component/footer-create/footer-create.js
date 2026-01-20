import { BitrixVue } from 'ui.vue3';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BLine } from 'ui.system.skeleton.vue';

import { Core } from 'tasks.v2.core';
import { AddTaskButton } from 'tasks.v2.component.add-task-button';

import './footer-create.css';

// @vue/component
export const FooterCreate = {
	components: {
		UiButton,
		AddTaskButton,
		TemplatesButton: BitrixVue.defineAsyncComponent(
			'tasks.v2.component.templates-button',
			'TemplatesButton',
			{
				delay: 0,
				loadingComponent: {
					components: { BLine },
					template: '<BLine :width="131" :height="22"/>',
				},
			},
		),
		TemplatePermissionsButton: BitrixVue.defineAsyncComponent(
			'tasks.v2.component.template-permissions-button',
			'TemplatePermissionsButton',
			{
				delay: 0,
				loadingComponent: {
					components: { BLine },
					template: '<BLine :width="131" :height="22"/>',
				},
			},
		),
	},
	inject: {
		/** @type{boolean} */
		isTemplate: {},
	},
	props: {
		creationError: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['addTask', 'copyTask', 'fromTemplate', 'template', 'update:creationError', 'close'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
		};
	},
	computed: {
		hasError: {
			get(): boolean
			{
				return this.creationError;
			},
			set(creationError: boolean): void
			{
				this.$emit('update:creationError', creationError);
			},
		},
		isTemplateEnabled(): boolean
		{
			return Core.getParams().features.isTemplateEnabled;
		},
	},
	template: `
		<div class="tasks-full-card-footer">
			<div class="tasks-full-card-footer-create">
				<div class="tasks-full-card-footer-main-buttons">
					<AddTaskButton
						v-model:hasError="hasError"
						@addTask="$emit('addTask')"
						@copyTask="$emit('copyTask', $event)"
						@fromTemplate="$emit('fromTemplate', $event)"
					/>
					<UiButton
						:text="loc('TASKS_V2_TASK_FULL_CARD_CANCEL')"
						:size="ButtonSize.LARGE"
						:style="AirButtonStyle.PLAIN"
						:dataset="{ taskButtonId: 'cancel' }"
						@click="$emit('close')"
					/>
				</div>
				<TemplatesButton v-if="!isTemplate && isTemplateEnabled" @template="$emit('template', $event)"/>
				<TemplatePermissionsButton v-if="isTemplate"/>
			</div>
		</div>
	`,
};
