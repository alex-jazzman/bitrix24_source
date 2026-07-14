import { mapWritableState } from 'ui.vue3.pinia';

import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { TagsSelector } from 'socialnetwork.v2.components.selectors.tags-selector';

import { InjectionKey } from '../../../../../const/index.js';

// @vue/component
export const ProjectTagsField = {
	name: 'ProjectTagsField',
	components: {
		UiField,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
		},
	},
	computed: {
		...mapWritableState(useProjectStore, ['tags']),
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
		createSelector(): TagsSelector
		{
			return new TagsSelector({
				context: 'socialnetworkProjectWizardTags',
				groupId: 0,
				targetContainer: this.getWizardBodyContainer() ?? document.body,
				onSelect: (item) => {
					this.select(item);
				},
				onDeselect: (item) => {
					this.deselect(item);
				},
			});
		},
		mountSelector(): void
		{
			this.selector.renderTo(this.$refs.tagsSelector, this.tags);
		},
		destroySelector(): void
		{
			this.selector.destroy();
			this.selector = null;
		},
		select(item): void
		{
			const tagNew = item.getId();
			if (!this.tags.includes(tagNew))
			{
				this.tags = [...this.tags, tagNew];
			}
		},
		deselect(item): void
		{
			this.tags = this.tags.filter((tag) => tag !== item.getId());
		},
	},
	template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_PROJECT_TAGS_LABEL')"
			class="socialnetwork--project-wizard--field-shadow"
			labelFor="sonet-project-wizard-tags"
		>
			<div
				ref="tagsSelector"
				class="sonet--project-wizard--tags-selector --none-border-outer-container"
			></div>
		</UiField>
	`,
};
