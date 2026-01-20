import type { PopupOptions } from 'main.popup';

import { Popup } from 'ui.vue3.components.popup';
import { HeadlineSm, Text2Xs } from 'ui.system.typography.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { taskService } from 'tasks.v2.provider.service.task-service';
import { permissionBuilder } from 'tasks.v2.provider.service.template-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { TemplatePermission } from 'tasks.v2.provider.service.template-service';

import { TemplatePermissionUserRow } from './row/template-permission-user-row';
import { AddUsersButton } from './add-users-button/add-users-button';

import './template-permissions-popup.css';

// @vue/component
export const TemplatePermissionsPopup = {
	name: 'TemplatePermissionsPopup',
	components: {
		BIcon,
		Popup,
		UiButton,
		TemplatePermissionUserRow,
		AddUsersButton,
		HeadlineSm,
		Text2Xs,
	},
	inject: {
		task: {},
		taskId: {},
	},
	props: {
		bindElement: {
			type: HTMLElement,
			default: null,
		},
	},
	emits: ['close'],
	setup(): { task: TaskModel, permissions: TemplatePermission[] }
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	data(): Object
	{
		return {
			permissions: [],
		};
	},
	computed: {
		options(): PopupOptions
		{
			return {
				id: `tasks-template-permissions-popup-${this.taskId}`,
				bindElement: this.bindElement,
				padding: 14,
				minHeight: 320,
				maxHeight: 600,
				width: 400,
				targetContainer: this.$root.$el.firstElementChild,
			};
		},
	},
	watch: {
		permissions: {
			handler(): void
			{
				void this.$nextTick(() => this.$refs.popup?.adjustPosition());
			},
			deep: true,
		},
	},
	created(): void
	{
		this.permissions = permissionBuilder.getPermissions(this.task);
	},
	methods: {
		removeItem(id: string): void
		{
			this.permissions = this.permissions.filter((it) => it.id !== id);
		},
		updateItem({ id, permission }): void
		{
			this.permissions.find((it) => it.id === id).permission = permission;
		},
		save(): void
		{
			void taskService.update(this.taskId, { permissions: this.permissions });

			this.$emit('close');
		},
	},
	template: `
		<Popup v-slot="{ freeze, unfreeze }" :options ref="popup" @close="$emit('close')">
			<div class="tasks-template-permissions-popup">
				<div class="tasks-template-permissions-popup-title">
					<HeadlineSm>{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_HEADER') }}</HeadlineSm>
					<BIcon
						class="tasks-template-permissions-popup-close"
						:name="Outline.CROSS_L"
						hoverable
						@click="$emit('close')"
					/>
				</div>
				<div class="tasks-template-permissions-popup-content">
					<div class="tasks-template-permissions-separator --header"/>
					<Text2Xs className="tasks-template-permissions-popup-header">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_USERS_COLUMN') }}
					</Text2Xs>
					<Text2Xs className="tasks-template-permissions-popup-header">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_PERMISSIONS_COLUMN') }}
					</Text2Xs>
					<div></div>
					<div class="tasks-template-permissions-separator --header"/>
					<TemplatePermissionUserRow
						v-for="permission of permissions"
						:key="permission.id"
						:permission
						:freeze
						:unfreeze
						@update="updateItem"
						@remove="removeItem(permission.id)"
					/>
				</div>
				<div class="tasks-template-permissions-popup-footer">
					<AddUsersButton v-model:permissions="permissions" :templateId="taskId" :freeze :unfreeze/>
					<UiButton
						:text="loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_SAVE_BUTTON')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						noCaps
						@click="save"
					/>
				</div>
			</div>
		</Popup>
	`,
};
