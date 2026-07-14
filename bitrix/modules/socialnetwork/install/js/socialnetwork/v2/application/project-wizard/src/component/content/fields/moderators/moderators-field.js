import { mapWritableState } from 'ui.vue3.pinia';

import { EntitySelectorEntity } from 'socialnetwork.v2.const';
import { UsersSelector } from 'socialnetwork.v2.components.selectors.users-selector';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import { InjectionKey } from '../../../../const/index.js';

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
				multiple: true,
				preselectedItems: (this.moderators || []).map((m) => [m.type, m.id]),
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
			this.selector.renderTo(this.$refs.moderatorsSelector);
		},
		destroySelector(): void
		{
			this.selector.destroy();
			this.selector = null;
		},
		select(userId: number): void
		{
			if (this.moderators.some((m) => m.id === userId))
			{
				return;
			}

			this.moderators.push({ id: userId, type: EntitySelectorEntity.User });
		},
		deselect(userId: number): void
		{
			this.moderators = this.moderators.filter((m) => m.id !== userId);
		},
	},
	template: `
		<UiField
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
