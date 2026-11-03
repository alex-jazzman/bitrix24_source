import { mapState, mapActions } from 'ui.vue3.pinia';
import { Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.solid';
import { SwitcherSize, type SwitcherOptions } from 'ui.switcher';
import { TextMd, TextSm } from 'ui.system.typography.vue';

import { AccessibleSwitcher } from 'socialnetwork.v2.components.elements.accessible-switcher';
import { UiAccordion, UiAccordionItem } from 'socialnetwork.v2.components.elements.ui-accordion';
import { useProjectStore } from 'socialnetwork.v2.model.project';

import './legacy-tools-block.css';

const toggleableFeatureIds = Object.freeze([
	'forum',
	'wiki',
	'photo',
	'landingKnowledge',
]);

const toggleableFeatureLabels = Object.freeze({
	forum: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_FORUM_LABEL_MSGVER_1',
	wiki: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_WIKI_LABEL',
	photo: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_PHOTO_LABEL',
	landingKnowledge: 'SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_LANDING_KNOWLEDGE_LABEL',
});

// @vue/component
export const LegacyToolsBlock = {
	name: 'LegacyToolsBlock',
	components: {
		TextMd,
		TextSm,
		UiAccordion,
		UiAccordionItem,
		AccessibleSwitcher,
	},
	setup(): Object
	{
		return {
			Solid,
		};
	},
	data(): { tabIndex: ?number }
	{
		return {
			tabIndex: null,
		};
	},
	computed: {
		...mapState(useProjectStore, ['features', 'toggleableFeatures']),
		items(): Array<{ id: string, label: string }>
		{
			return toggleableFeatureIds
				.filter((toggleableFeatureId) => this.toggleableFeatures.includes(toggleableFeatureId))
				.map((toggleableFeatureId) => ({
					id: toggleableFeatureId,
					label: this.loc(toggleableFeatureLabels[toggleableFeatureId]),
				}))
			;
		},
		switcherOptions(): SwitcherOptions
		{
			return {
				size: SwitcherSize.extraSmall,
				showStateTitle: false,
				useAirDesign: true,
			};
		},
	},
	methods: {
		...mapActions(useProjectStore, ['updateFeature']),
	},
	template: `
		<UiAccordion v-if="items.length > 0" v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_TITLE')"
				:iconName="Solid.SERVICE"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--legacy-tools">
					<TextSm
						tag="p"
						class="sonet--project-wizard--legacy-tools-description"
					>
						{{ loc('SONET_EXT_PROJECT_WIZARD_LEGACY_TOOLS_DESCRIPTION') }}
					</TextSm>
					<div class="sonet--project-wizard--legacy-tools-list">
						<div
							v-for="item in items"
							:key="item.id"
							class="sonet--project-wizard--legacy-tools-item"
						>
							<AccessibleSwitcher
								:modelValue="Boolean(features[item.id])"
								:ariaLabel="item.label"
								:data-testid="'project-legacy-tools-toggle-' + item.id"
								:options="switcherOptions"
								@update:modelValue="updateFeature(item.id, $event)"
							/>
							<TextMd>
								{{ item.label }}
							</TextMd>
						</div>
					</div>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`,
};
