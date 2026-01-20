import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { permissionBuilder } from 'tasks.v2.provider.service.template-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { TemplatePermission } from 'tasks.v2.provider.service.template-service';

import { TemplatePermissionsPopup } from './template-permissions-popup/template-permissions-popup';
import './template-permissionts-button.css';

// @vue/component
export const TemplatePermissionsButton = {
	name: 'TemplatePermissionsButton',
	components: {
		BIcon,
		TemplatePermissionsPopup,
		UiButton,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
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
			shown: false,
		};
	},
	computed: {
		permissions(): TemplatePermission[]
		{
			return permissionBuilder.getPermissions(this.task);
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.templatesAccessPermissions.available;
		},
		featureId(): string
		{
			return Core.getParams().restrictions.templatesAccessPermissions.featureId;
		},
		buttonIcon(): string
		{
			return this.isLocked ? Outline.LOCK_M : Outline.SETTINGS_M;
		},
	},
	methods: {
		showPopup(): void
		{
			if (this.isLocked)
			{
				void showLimit({ featureId: this.featureId });

				return;
			}

			this.shown = true;
		},
	},
	template: `
		<div class="tasks--template-permissions-button">
			<div class="tasks--template-permissions-button--wrapper" @click="showPopup">
				<UiButton
					:text="loc('TASKS_V2_TEMPLATE_PERMISSIONS_BUTTON')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:leftIcon="buttonIcon"
					noCaps
				/>
				<div
					v-if="!isLocked"
					class="tasks--template-permissions-button--counter"
				>
					<BIcon :name="Outline.GROUP" :size="18" color="var(--ui-color-accent-main-primary)"/>
					<span class="tasks--template-permissions-button--counter__count">{{ permissions.length }}</span>
				</div>
			</div>
			<TemplatePermissionsPopup
				v-if="!isLocked && shown"
				:bindElement="$el"
				@close="shown = false"
			/>
		</div>
	`,
};
