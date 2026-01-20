import { BMenu, type MenuOptions } from 'ui.vue3.components.menu';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { EntitySelectorEntity, PermissionType } from 'tasks.v2.const';
import { UserLabel } from 'tasks.v2.component.elements.user-label';
import type { CoreParams } from 'tasks.v2.core';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { TemplatePermission } from 'tasks.v2.provider.service.template-service';

// @vue/component
export const TemplatePermissionUserRow = {
	name: 'TemplatePermissionUserRow',
	components: {
		BMenu,
		UserLabel,
		BIcon,
	},
	inject: {
		task: {},
		isEdit: {},
		settings: {},
	},
	props: {
		/** @type TemplatePermission */
		permission: {
			type: Object,
			required: true,
		},
		freeze: {
			type: Function,
			required: true,
		},
		unfreeze: {
			type: Function,
			required: true,
		},
	},
	emits: ['update', 'remove'],
	setup(): { task: TaskModel, settings: CoreParams, permission: TemplatePermission }
	{
		return {
			Outline,
		};
	},
	data(): Object
	{
		return {
			isMenuShown: false,
		};
	},
	computed: {
		isGranted(): boolean
		{
			const grantedIds = new Set([this.settings.currentUser.id]);
			if (!this.isEdit)
			{
				grantedIds.add(this.task.creatorId);
			}

			return this.permission.entityType === EntitySelectorEntity.User && grantedIds.has(this.permission.entityId);
		},
		permissionLabel(): string
		{
			if (this.permission.permission === PermissionType.Full)
			{
				return this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS');
			}

			return this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS');
		},
		options(): { permission: string, title: string, description: string }[]
		{
			return [
				{
					permission: PermissionType.Full,
					title: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS'),
					description: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_FULL_ACCESS_DESCRIPTION'),
				},
				!this.isGranted && {
					permission: PermissionType.Read,
					title: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS'),
					description: this.loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_READ_ONLY_ACCESS_DESCRIPTION'),
				},
			].filter(Boolean);
		},
		menuOptions(): MenuOptions
		{
			return {
				id: `template-permission-menu-${this.permission.entityType}-${this.permission.entityId}`,
				className: 'tasks-template-permissions-of-user',
				bindElement: this.$refs.permission,
				minWidth: 238,
				maxWidth: 244,
				padding: 18,
				offsetTop: 8,
				items: this.options.map((option) => ({
					title: option.title,
					subtitle: option.description,
					onClick: () => this.$emit('update', {
						id: this.permission.id,
						permission: option.permission,
					}),
				})),
				targetContainer: document.body,
			};
		},
	},
	watch: {
		isMenuShown(shown: boolean): void
		{
			if (shown)
			{
				setTimeout(() => this.freeze());
			}
			else
			{
				this.unfreeze();
			}
		},
	},
	template: `
		<UserLabel :user="{ name: permission.title, image: permission.image }"/>
		<a
			class="tasks-template-permissions-permission"
			ref="permission"
			@click="isMenuShown = true"
		>
			{{ permissionLabel }}
		</a>
		<div class="tasks-template-permissions-remove" @click="$emit('remove')">
			<BIcon v-if="!isGranted" :name="Outline.CROSS_L"/>
		</div>
		<div class="tasks-template-permissions-separator"/>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
	`,
};
