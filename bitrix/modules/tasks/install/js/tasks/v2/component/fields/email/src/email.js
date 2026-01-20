import { Type } from 'main.core';

import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';
import 'ui.icon-set.outline';

import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { tooltip } from 'tasks.v2.component.elements.hint';
import type { EmailModel, TaskModel } from 'tasks.v2.model.tasks';

import { emailMeta } from './email-meta';
import './email.css';

// @vue/component
export const Email = {
	name: 'TaskEmail',
	directives: { hint },
	components: {
		BIcon,
		HoverPill,
	},
	inject: {
		task: {},
		taskId: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			emailMeta,
			Outline,
		};
	},
	computed: {
		email(): EmailModel | undefined
		{
			return this.task.email;
		},
		emailTitle(): string
		{
			return (Type.isStringFilled(this.email.title) && this.email.title.trim())
				? this.email.title
				: this.loc('TASKS_V2_EMAIL_NO_SUBJECT')
			;
		},
		emailBody(): ?string
		{
			return Type.isStringFilled(this.email.body) ? this.email.body : null;
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.loc('TASKS_V2_EMAIL_TITLE_HINT'),
				popupOptions: {
					offsetLeft: this.$refs.email.$el.offsetWidth / 2,
				},
			});
		},
	},
	methods: {
		handleClick(): void
		{
			BX.SidePanel.Instance.emulateAnchorClick(this.email.link);
		},
	},
	template: `
		<div
			class="tasks-field-email"
			:data-task-id="taskId"
			:data-task-field-id="emailMeta.id"
			:data-task-field-value="email.id"
		>
			<HoverPill v-hint="tooltip" ref="email" @click="handleClick">
				<div class="tasks-field-email-content">
					<BIcon :name="Outline.MAIL"/>
					<div class="tasks-field-email-title">{{ emailTitle }}</div>
				</div>
			</HoverPill>
			<div v-if="emailBody" class="tasks-field-email-subcontent">
				<div class="tasks-field-email-subtitle">{{ emailBody }}</div>
			</div>
		</div>
	`,
};
