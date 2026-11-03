import { Type } from 'main.core';
import { type ItemOptions } from 'ui.entity-selector';
import { mapState, mapWritableState } from 'ui.vue3.pinia';

import { Core } from 'socialnetwork.v2.core';
import { EntitySelectorEntity } from 'socialnetwork.v2.const';
import { UsersSelector, type Item } from 'socialnetwork.v2.components.selectors.users-selector';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import { InjectionKey } from '../../../../const/index.js';
import { mapItemToProjectMember, mapProjectMemberToItemOptions } from '../user-selector-item';

// @vue/component
export const OwnerField = {
	name: 'ProjectWizardOwnerField',
	components: {
		UiField,
	},
	inject: {
		getWizardBodyContainer: { from: InjectionKey.GetWizardBodyContainer },
	},
	computed: {
		...mapWritableState(useProjectStore, ['ownerId', 'owner']),
		...mapState(useInterfaceStore, ['isActionUpdate']),
	},
	mounted(): void
	{
		this.selector = this.createSelector();
		this.mountSelector();
	},
	beforeUnmount(): void
	{
		this.destroySelector();
	},
	methods: {
		createSelector(): UsersSelector
		{
			return new UsersSelector({
				context: 'socialnetworkProjectWizardOwner',
				controlId: 'sonet-project-wizard-owner',
				ariaLabelledBy: 'sonet-project-wizard-owner-label',
				multiple: false,
				preselectedIds: [],
				selectedItems: this.getSelectedItems(),
				intranetUsersOnly: !this.isActionUpdate && Core.getSettings().isExtranetConfigured === false,
				targetContainer: this.getTargetContainer(),
				onSelect: (userId: number, item: Item) => {
					this.select(item);
				},
				onDeselect: (userId: number, item: Item) => {
					this.deselect(item);
				},
			});
		},
		getSelectedItems(): ItemOptions[]
		{
			if (Type.isNil(this.ownerId))
			{
				return [];
			}

			return [
				mapProjectMemberToItemOptions({
					id: this.ownerId,
					type: EntitySelectorEntity.User,
					name: this.owner?.name,
					image: this.owner?.image,
				}),
			];
		},
		getTargetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.ownerSelector);
		},
		destroySelector(): void
		{
			this.selector.destroy();
			this.selector = null;
		},
		select(item: Item): void
		{
			const member = mapItemToProjectMember(item);

			this.ownerId = member.id;
			this.owner = {
				name: member.name,
				image: member.image,
			};
		},
		deselect(item: Item): void
		{
			if (this.ownerId === mapItemToProjectMember(item).id)
			{
				this.ownerId = null;
				this.owner = null;
			}
		},
	},
	template: `
		<UiField
			data-testid="project-wizard-owner-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_OWNER_LABEL')"
			labelFor="sonet-project-wizard-owner"
		>
			<div
				ref="ownerSelector"
				class="sonet--project-wizard--owner-selector sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`,
};
