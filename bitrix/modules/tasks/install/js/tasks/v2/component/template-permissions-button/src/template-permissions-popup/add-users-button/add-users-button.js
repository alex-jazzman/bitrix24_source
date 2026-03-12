import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import 'ui.icon-set.outline';

import { Core } from 'tasks.v2.core';
import { EntitySelectorEntity } from 'tasks.v2.const';
import { EntitySelectorDialog, type Item, type ItemId } from 'tasks.v2.lib.entity-selector-dialog';
import { permissionBuilder } from 'tasks.v2.provider.service.template-service';
import type { TemplatePermission } from 'tasks.v2.provider.service.template-service';

// @vue/component
export const AddUsersButton = {
	name: 'AddUsersButton',
	components: {
		BIcon,
		UiButton,
	},
	props: {
		templateId: {
			type: String,
			required: true,
		},
		/** @type TemplatePermission[] */
		permissions: {
			type: Array,
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
	emits: ['update:permissions'],
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
			Outline,
		};
	},
	computed: {
		preselected(): ItemId[]
		{
			return this.permissions.map((it: TemplatePermission) => permissionBuilder.buildItemId(it));
		},
	},
	unmounted(): void
	{
		this.selector?.destroy();
	},
	methods: {
		showDialog(): void
		{
			const restrictions = Core.getParams().restrictions;
			this.selector ??= new EntitySelectorDialog({
				id: `tasks-template-permissions-${this.templateId}`,
				targetNode: this.$el,
				context: 'tasks-card',
				enableSearch: true,
				width: 387,
				preselectedItems: this.preselected,
				entities: [
					{
						id: EntitySelectorEntity.User,
						options: {
							emailUsers: true,
							analyticsSource: 'tasks',
							lockGuestLink: !restrictions.mailUserIntegration.available,
							lockGuestLinkFeatureId: restrictions.mailUserIntegration.featureId,
						},
					},
					{
						id: EntitySelectorEntity.Department,
						options: {
							selectMode: 'usersAndDepartments',
						},
					},
					{
						id: EntitySelectorEntity.MetaUser,
						options: { 'all-users': true },
					},
					{
						id: EntitySelectorEntity.Project,
						itemOptions: {
							default: {
								entityType: EntitySelectorEntity.Project,
								link: '',
								linkTitle: '',
							},
						},
					},
				],
				events: {
					'Item:onSelect': this.update,
					'Item:onDeselect': this.update,
				},
				popupOptions: {
					events: {
						onClose: this.unfreeze,
					},
				},
			});

			this.selector.selectItemsByIds(this.preselected);
			this.selector.show(this.$el);
			setTimeout(() => this.freeze());
		},
		update(): void
		{
			const permissions = this.selector.getSelectedItems().map((it: Item) => {
				const permission = permissionBuilder.buildFromItem(it);
				const existingPermission = this.permissions.find(({ entityType, entityId }) => {
					return entityType === permission.entityType && entityId === permission.entityId;
				});

				return existingPermission ?? permission;
			});

			this.$emit('update:permissions', permissions);
		},
	},
	template: `
		<div>
			<UiButton
				:text="loc('TASKS_V2_TEMPLATE_PERMISSIONS_POPUP_ADD_USERS_BUTTON')"
				:leftIcon="Outline.PLUS_M"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE"
				noCaps
				@click="showDialog"
			/>
		</div>
	`,
};
