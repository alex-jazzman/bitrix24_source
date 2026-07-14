import { Outline } from 'ui.icon-set.api.core';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { mapWritableState } from 'ui.vue3.pinia';

import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { UiSelect } from 'socialnetwork.v2.components.elements.ui-select';
import { type ProjectFeature, useProjectStore } from 'socialnetwork.v2.model.project';

import { InjectionKey } from '../../../../const/index.js';

import './base-feature.css';

const whiteList = [
	'chat',
	'tasks',
	'files',
	'calendar',
	'blog',
	'flows',
	'landing_knowledge',
];

const whiteListOrder = new Map(whiteList.map((featureId, index) => [featureId, index]));

const featureIconMap = Object.freeze({
	chat: Outline.CHATS,
	tasks: Outline.TASK,
	files: Outline.ATTACH,
	calendar: Outline.CALENDAR,
	blog: Outline.NEWSFEED,
	flows: Outline.BOTTLENECK,
	landing_knowledge: Outline.KNOWLEDGE_BASE,
});

// @vue/component
export const BaseFeatureField = {
	name: 'ProjectWizardBaseFeatureField',
	components: {
		TextMd,
		TextXs,
		UiField,
		UiSelect,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
		},
	},
	computed: {
		...mapWritableState(useProjectStore, ['baseFeatureId', 'availableFeatures']),
		baseFeatures(): ProjectFeature[]
		{
			if (!this.availableFeatures)
			{
				return [];
			}

			return this.availableFeatures
				.filter((feature) => whiteListOrder.has(feature.id))
				.sort((firstFeature, secondFeature) => {
					return whiteListOrder.get(firstFeature.id) - whiteListOrder.get(secondFeature.id);
				})
				.map((feature) => ({
					id: feature.id,
					title: feature.name,
					icon: featureIconMap[feature.id] ?? Outline.TASK,
				}))
			;
		},
		targetContainer(): ?HTMLElement
		{
			return this.getWizardBodyContainer();
		},
	},
	methods: {
		update(featureId: string): void
		{
			this.baseFeatureId = featureId;
		},
	},
	template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_LABEL')"
			labelFor="sonet-project-wizard-base-feature"
		>
			<div class="sonet--project-wizard--base-feature-field-content">
				<div class="sonet--project-wizard--base-feature-item">
					<UiSelect
						:modelValue="baseFeatureId"
						:label="loc('SONET_EXT_PROJECT_WIZARD_BASE_FEATURE_INFO')"
						:items="baseFeatures"
						inputClassName="socialnetwork--project-wizard--field-shadow"
						:targetContainer
						@update:modelValue="update($event)"
					/>
				</div>
			</div>
		</UiField>
	`,
};
