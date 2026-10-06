import { defineComponent } from 'ui.vue3';
import { mapWritableState } from 'ui.vue3.pinia';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import { Vue as RadioButtonVue, RadioButtonSize } from 'ui.system.radiobutton';

import { PrivacyType, type IPrivacyType } from 'socialnetwork.v2.const';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { UiField } from 'socialnetwork.v2.components.elements.ui-field';

import './privacy-type.css';

// @vue/component
export const PrivacyTypeField = defineComponent({
	name: 'ProjectWizardPrivacyTypeField',
	components: {
		TextMd,
		TextXs,
		UiField,
		RadioButton: RadioButtonVue.RadioButton,
	},
	setup(): { RadioButtonSize: RadioButtonSize }
	{
		return {
			RadioButtonSize,
		};
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
	methods: {
		handleSelect(type: IPrivacyType, event: MouseEvent): void
		{
			if (event.target instanceof HTMLElement && event.target.closest('label'))
			{
				return;
			}

			this.privacyType = type;
		},
	},
	template: `
		<UiField :label="loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_LABEL')">
			<div
				class="sonet--project-wizard--privacy-type-field-content"
				role="radiogroup"
				:aria-label="loc('SONET_EXT_PROJECT_WIZARD_PRIVACY_TYPE_LABEL')"
				data-testid="project-wizard-privacy-type-group"
			>
				<div
					v-for="item in items"
					:key="item.type"
					:class="['sonet--project-wizard--privacy-type', {
						'--selected': privacyType === item.type
					}]"
					:data-testid="'project-wizard-privacy-type-option-' + item.type"
					@click="handleSelect(item.type, $event)"
				>
					<span class="sonet--project-wizard--privacy-type-radio">
						<RadioButton
							group="sonet-project-wizard-privacy-type"
							:size="RadioButtonSize.Sm"
							:modelValue="privacyType === item.type"
							:aria-label="item.title"
							:data-testid="'project-wizard-privacy-type-radio-' + item.type"
							@update:modelValue="privacyType = item.type"
						/>
					</span>
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
				</div>
			</div>
		</UiField>
	`,
});

type PrivacyTypeItem = {
	type: IPrivacyType;
	title: string;
	description: string;
}
