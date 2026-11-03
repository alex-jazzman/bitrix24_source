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
export const ModeratorsField = {
	name: 'ProjectWizardModeratorsField',
	components: {
		UiField,
	},
	inject: {
		getWizardBodyContainer: { from: InjectionKey.GetWizardBodyContainer },
	},
	computed: {
		...mapWritableState(useProjectStore, ['moderators']),
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
				context: 'socialnetworkProjectWizardModerators',
				controlId: 'sonet-project-wizard-moderators',
				ariaLabelledBy: 'sonet-project-wizard-moderators-label',
				multiple: true,
				preselectedItems: [],
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
			return (this.moderators || [])
				.filter((moderator) => moderator.type === EntitySelectorEntity.User)
				.map((moderator) => mapProjectMemberToItemOptions(moderator));
		},
		getTargetContainer(): HTMLElement
		{
			return this.getWizardBodyContainer() ?? document.body;
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.moderatorsSelector);
		},
		destroySelector(): void
		{
			this.selector.destroy();
			this.selector = null;
		},
		select(item: Item): void
		{
			const member = mapItemToProjectMember(item);

			if (this.moderators.some((moderator) => (
				moderator.id === member.id && moderator.type === member.type
			)))
			{
				return;
			}

			this.moderators.push(member);
		},
		deselect(item: Item): void
		{
			const member = mapItemToProjectMember(item);

			this.moderators = this.moderators.filter(
				(moderator) => !(moderator.id === member.id && moderator.type === member.type),
			);
		},
	},
	template: `
		<UiField
			data-testid="project-wizard-moderators-field"
			:label="loc('SONET_EXT_PROJECT_WIZARD_MODERATORS_LABEL')"
			labelFor="sonet-project-wizard-moderators"
			:hint="loc('SONET_EXT_PROJECT_WIZARD_MODERATORS_HINT')"
		>
			<div
				ref="moderatorsSelector"
				class="sonet--project-wizard--moderators-selector sonet--project-wizard--user-selector-wrapper --none-border-outer-container"
			></div>
		</UiField>
	`,
};
