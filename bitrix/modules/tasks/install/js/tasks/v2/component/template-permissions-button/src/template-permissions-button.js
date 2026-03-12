import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
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
		HoverPill,
		TextSm,
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
			<HoverPill @click="showPopup">
				<div class="tasks--template-permissions-button--wrapper">
					<BIcon
						:name="Outline.SETTINGS"
						:size="24"
						color="var(--ui-color-base-3)"
					/>
					<TextSm className="tasks--template-permissions-button--text">
						{{ loc('TASKS_V2_TEMPLATE_PERMISSIONS_BUTTON') }}
					</TextSm>
					<BIcon
						v-if="isLocked"
						:name="Outline.LOCK_L"
						:size="24"
						color="var(--ui-color-accent-main-primary-alt-2)"
					/>
					<div
						v-else
						class="tasks--template-permissions-button--counter"
					>
						<BIcon
							:name="Outline.GROUP"
							:size="18"
							color="var(--ui-color-accent-main-primary)"
						/>
						<span class="tasks--template-permissions-button--counter__count">
							{{ permissions.length }}
						</span>
					</div>
				</div>
			</HoverPill>
			<TemplatePermissionsPopup
				v-if="!isLocked && shown"
				:bindElement="$el"
				@close="shown = false"
			/>
		</div>
	`,
};
