import { Type } from 'main.core';
import { mapWritableState } from 'ui.vue3.pinia';

import { UsersSelector } from 'socialnetwork.v2.components.selectors.users-selector';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import { InjectionKey } from '../../../../const/index.js';

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
		...mapWritableState(useProjectStore, ['ownerId']),
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
				multiple: false,
				preselectedIds: Type.isNil(this.ownerId) ? [] : [this.ownerId],
				targetContainer: this.getTargetContainer(),
				onSelect: (userId: number) => {
					this.select(userId);
				},
				onDeselect: (userId: number) => {
					this.deselect(userId);
				},
			});
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
		select(userId: number): void
		{
			this.ownerId = userId;
		},
		deselect(userId: number): void
		{
			if (this.ownerId === userId)
			{
				this.ownerId = null;
			}
		},
	},
	template: `
		<UiField
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
