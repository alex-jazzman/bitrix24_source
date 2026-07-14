import { mapState, mapActions } from 'ui.vue3.pinia';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { Button as UiButton, ButtonSize, AirButtonStyle } from 'ui.vue3.components.button';
import { TextMd } from 'ui.system.typography.vue';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import 'ui.icon-set.outline';

import { UiAccordion, UiAccordionItem } from 'socialnetwork.v2.components.elements.ui-accordion';
import { UiSelect } from 'socialnetwork.v2.components.elements.ui-select';
import { UiDivider } from 'socialnetwork.v2.components.elements.ui-divider';
import { useProjectStore } from 'socialnetwork.v2.model.project';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';

import { ResetAccessRights } from '../../../../feature/reset-access-rights';
import { InjectionKey } from '../../../../const/index';
import { AccessRightsMeta } from './access-rights-meta';
import './access-rights.css';

// @vue/component
export const AccessRightsBlock = {
	name: 'AccessRightsBlock',
	components: {
		BIcon,
		TextMd,
		UiAccordion,
		UiAccordionItem,
		UiButton,
		UiDivider,
		UiSelect,
	},
	inject: {
		getWizardBodyContainer: {
			from: InjectionKey.GetWizardBodyContainer,
		},
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonSize,
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
		...mapState(useProjectStore, ['permissions', 'defaultPermissions']),
		...mapState(useInterfaceStore, ['isAccessRestricted']),
		groups(): Array
		{
			return AccessRightsMeta;
		},
		targetContainer(): ?HTMLElement
		{
			return this.getWizardBodyContainer();
		},
		hasResetDefaultButton(): boolean
		{
			return this.defaultPermissions !== null;
		},
	},
	methods: {
		...mapActions(useProjectStore, ['updatePermission']),
		resetAccessRights(): void
		{
			ResetAccessRights.execute();
		},
		showTariffPromoter(): void
		{
			FeaturePromotersRegistry.getPromoter({
				featureId: 'socialnetwork_projects_access_permissions',
			}).show();
		},
	},
	template: `
		<div
			v-if="isAccessRestricted"
			ref="lockedBlock"
			class="sonet--project-wizard--access-rights-locked"
			role="button"
			tabindex="0"
			@click="showTariffPromoter"
			@keydown.enter.prevent="showTariffPromoter"
			@keydown.space.prevent="showTariffPromoter"
		>
			<BIcon
				:size="24"
				:name="Outline.LOCK_L"
				color="var(--ui-color-accent-main-primary)"
			/>
			<TextMd>{{ loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_LABEL') }}</TextMd>
		</div>
		<UiAccordion v-else v-model:value="tabIndex">
			<UiAccordionItem
				:value="1"
				:title="loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_LABEL')"
				:iconName="Outline.PERSON_SETTINGS"
				iconColor="var(--ui-color-base-4)"
			>
				<div class="sonet--project-wizard--access-rights">
					<div
						v-for="group in groups"
						:key="group.id"
						class="sonet--project-wizard--access-rights-item"
					>
						<div class="sonet--project-wizard--access-rights-item-title">{{ group.title }}</div>
						<UiSelect
							v-for="field in group.fields"
							:key="field.id"
							:modelValue="permissions[group.id]?.[field.id]"
							:label="field.label"
							:items="field.items"
							inputClassName="socialnetwork--project-wizard--field-shadow"
							:targetContainer
							@update:modelValue="updatePermission(group.id, field.id, $event)"
						/>
						<UiDivider/>
					</div>
					<UiButton
						v-if="hasResetDefaultButton"
						:text="loc('SONET_EXT_PROJECT_WIZARD_ACCESS_RIGHTS_RESET_BY_DEFAULT_BTN_LABEL')"
						:size="ButtonSize.SMALL"
						:style="AirButtonStyle.OUTLINE"
						class="sonet--project-wizard--access-rights--reset-button"
						@click="resetAccessRights"
					/>
				</div>
			</UiAccordionItem>
		</UiAccordion>
	`,
};
