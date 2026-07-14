import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import { mapState } from 'ui.vue3.pinia';

import { useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { UiAccordion, UiAccordionItem } from 'socialnetwork.v2.components.elements.ui-accordion';
import { UiDivider } from 'socialnetwork.v2.components.elements.ui-divider';

import { ProjectDatesField } from './project-dates-field/project-dates-field';
import { ProjectTagsField } from './project-tags-field/project-tags-field';
import { AutoRemoveField } from './auto-remove-field/auto-remove-field';
import { PublicationField } from './publication-field/publication-field';

import './additional-settings-block.css';

// @vue/component
export const AdditionalSettingsBlock = {
	name: 'AdditionalSettingsBlock',
	components: {
		UiAccordion,
		UiAccordionItem,
		ProjectDatesField,
		ProjectTagsField,
		AutoRemoveField,
		PublicationField,
		UiDivider,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): { tabIndex: ?number }
	{
		return {
			tabIndex: null,
		};
	},
	computed: {
		...mapState(useInterfaceStore, ['isActionCreate']),
		...mapState(useProjectStore, ['publication']),
	},
	template: `
		<UiAccordion v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_ADDITIONAL_PROJECT_SETTINGS_LABEL')"
				:iconName="Outline.FILTER_2_LINES"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--additional-settings">
					<ProjectDatesField/>
					<ProjectTagsField/>
					<UiDivider/>
					<AutoRemoveField/>
					<PublicationField v-if="!isActionCreate && publication"/>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`,
};
