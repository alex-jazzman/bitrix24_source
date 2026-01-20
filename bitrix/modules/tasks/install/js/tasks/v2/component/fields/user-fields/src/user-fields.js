import { mapGetters } from 'ui.vue3.vuex';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import type { BitrixVueComponentProps } from 'ui.vue3';
import 'ui.icon-set.outline';

import { Model, UserFieldType } from 'tasks.v2.const';
import type { UserFieldScheme } from 'tasks.v2.model.interface';
import type { TaskModel } from 'tasks.v2.model.tasks';

import { UserFieldString } from './fields/string';
import { UserFieldDouble } from './fields/double';
import { UserFieldBoolean } from './fields/boolean';
import { UserFieldDate } from './fields/date';
import { userFieldsMeta } from './user-fields-meta';
import { userFieldsManager, type PreparedUserField, type UserField } from './user-fields-manager';

import './user-fields.css';

// @vue/component
export const UserFields = {
	components: {
		BIcon,
		TextMd,
		TextXs,
	},
	inject: {
		task: {},
		taskId: {},
		isTemplate: {},
	},
	emits: ['open'],
	setup(): { task: TaskModel }
	{
		return {
			Outline,
			userFieldsMeta,
		};
	},
	data(): Object
	{
		return {
			isMouseDown: false,
			selectionMade: false,
		};
	},
	computed: {
		...mapGetters({
			taskUserFieldScheme: `${Model.Interface}/taskUserFieldScheme`,
			templateUserFieldScheme: `${Model.Interface}/templateUserFieldScheme`,
		}),
		userFields(): UserField[]
		{
			return this.task.userFields || [];
		},
		readonly(): boolean
		{
			return !this.task.rights.edit;
		},
		userFieldScheme(): UserFieldScheme[]
		{
			return this.isTemplate
				? this.templateUserFieldScheme
				: this.taskUserFieldScheme
			;
		},
		preparedUserFields(): Array<PreparedUserField>
		{
			return userFieldsManager.getPreparedUserFields(this.userFields, this.userFieldScheme);
		},
		preparedUserFieldsLength(): number
		{
			return this.preparedUserFields.length;
		},
		hasUnfilledFields(): boolean
		{
			return userFieldsManager.hasUnfilledFields(this.userFields, this.userFieldScheme);
		},
		hasUnfilledMandatoryFields(): boolean
		{
			return userFieldsManager.hasUnfilledMandatoryFields(this.userFields, this.userFieldScheme);
		},
		footerText(): string
		{
			return this.hasUnfilledMandatoryFields
				? this.loc('TASKS_V2_USER_FIELDS_NOT_FILLED_MANDATORY_FIELDS')
				: this.loc('TASKS_V2_USER_FIELDS_NOT_FILLED_FIELDS')
			;
		},
	},
	methods: {
		handleOpenSlider(): void
		{
			if (this.readonly)
			{
				return;
			}

			this.$emit('open');
		},
		getComponentName(type: string): BitrixVueComponentProps
		{
			return {
				[UserFieldType.String]: UserFieldString,
				[UserFieldType.Double]: UserFieldDouble,
				[UserFieldType.Boolean]: UserFieldBoolean,
				[UserFieldType.Datetime]: UserFieldDate,
			}[type];
		},
		onMouseDown(event): void
		{
			if (event.button === 0)
			{
				this.isMouseDown = true;
				this.selectionMade = false;
			}
		},
		onMouseMove(): void
		{
			if (this.selectionMade || this.opened)
			{
				return;
			}

			if (this.isMouseDown)
			{
				const selection = window.getSelection();
				if (selection.toString().length > 0)
				{
					this.selectionMade = true;
				}
			}
		},
		onMouseUp(event): void
		{
			this.isMouseDown = false;
			if (!this.selectionMade)
			{
				const target = event.target;
				const isLinkClick = target.tagName === 'A' || target.closest('a');

				if (!isLinkClick)
				{
					this.handleOpenSlider();
				}
			}
		},
	},
	template: `
		<div
			class="tasks-field-user-fields"
			:data-task-id="taskId"
			:data-task-field-id="userFieldsMeta.id"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
		>
			<div
				class="tasks-field-user-fields-title"
				:class="{
					'--readonly': readonly,
					'--border-radius': preparedUserFieldsLength === 0,
				}"
			>
				<BIcon
					class="tasks-field-user-fields-title-icon"
					:name="Outline.TOPIC"
				/>
				<TextMd accent>{{ userFieldsMeta.title }}</TextMd>
			</div>
			<template
				v-for="(field, index) in preparedUserFields"
				:key="index"
			>
				<component
					:is="getComponentName(field.type)"
					:title="field.title"
					:value="field.value"
					:mandatory="field.mandatory"
					:isLast="index === preparedUserFieldsLength - 1"
				/>
			</template>
			<div
				v-if="!readonly && hasUnfilledFields"
				class="tasks-field-user-fields-footer"
			>
				<TextXs className="tasks-field-user-fields-footer-text">
					{{ footerText }}
				</TextXs>
				<div class="tasks-field-user-fields-footer-fill">
					<TextXs className="tasks-field-user-fields-footer-fill-text">
						{{ loc('TASKS_V2_USER_FIELDS_FILL') }}
					</TextXs>
					<BIcon
						class="tasks-field-user-fields-footer-fill-icon"
						:name="Outline.CHEVRON_RIGHT_L"
					/>
				</div>
			</div>
		</div>
	`,
};
