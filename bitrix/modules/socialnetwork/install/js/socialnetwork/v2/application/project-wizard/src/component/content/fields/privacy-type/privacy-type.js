import { mapWritableState } from 'ui.vue3.pinia';
import { TextMd, TextXs } from 'ui.system.typography.vue';

import { PrivacyType, type IPrivacyType } from 'socialnetwork.v2.const';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';
import { UiRadio } from 'socialnetwork.v2.components.elements.ui-radio';

import './privacy-type.css';

// @vue/component
export const PrivacyTypeField = {
	name: 'ProjectWizardPrivacyTypeField',
	components: {
		TextMd,
		TextXs,
		UiField,
		UiRadio,
	},
	computed: {
		...mapWritableState(useProjectStore, ['privacyType']),
		items(): PrivacyTypeItem[]
		{
			return [
				{
					type: PrivacyType.Open,
					title: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_OPEN_LABEL'),
					description: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_OPEN_DESCRIPTION'),
				},
				{
					type: PrivacyType.Closed,
					title: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_CLOSED_LABEL'),
					description: this.loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_CLOSED_DESCRIPTION'),
				},
			];
		},
	},
	template: `
		<UiField
			:label="loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_LABEL')"
			labelFor="sonet-project-wizard-privacy-type"
		>
			<div class="sonet--project-wizard--privacy-type-field-content">
				<label
					v-for="item in items"
					:key="item.type"
					:class="['sonet--project-wizard--privacy-type', {
						'--selected': privacyType === item.type
					}]"
				>
					<UiRadio
						v-model="privacyType"
						:value="item.type"
						class="sonet--project-wizard--privacy-type-radio"
					/>
					<div class="sonet--project-wizard--privacy-type-content">
						<div class="sonet--project-wizard--privacy-type-title">
							<TextMd class="sonet--project-wizard--privacy-type-title-text">
								{{ item.title }}
							</TextMd>
						</div>
						<div class="sonet--project-wizard--privacy-type-description">
							<TextXs class="sonet--project-wizard--privacy-type-description-text">
								{{ item.description }}
							</TextXs>
						</div>
					</div>
				</label>
			</div>
		</UiField>
	`,
};

type PrivacyTypeItem = {
	type: IPrivacyType;
	title: string;
	description: string;
}
