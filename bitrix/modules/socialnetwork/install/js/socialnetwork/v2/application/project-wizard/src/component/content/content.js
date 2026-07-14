import { mapState } from 'ui.vue3.pinia';

import { NewProjectBanner } from 'socialnetwork.v2.components.banners.new-project-banner';
import { useInterfaceStore } from 'socialnetwork.v2.model.interface';
import { useProjectStore } from 'socialnetwork.v2.model.project';

import { CopySettingsField } from './fields/copy-settings/copy-settings-field';
import { GoalField } from './fields/goal/goal-field';
import { DescriptionField } from './fields/description/description-field';
import { OwnerField } from './fields/owner/owner-field';
import { ModeratorsField } from './fields/moderators/moderators-field';
import { MembersField } from './fields/members/members-field';
import { PrivacyTypeField } from './fields/privacy-type/privacy-type';
import { BaseFeatureField } from './fields/base-feature/base-feature';
import { LegacyToolsBlock } from './fields/legacy-tools/legacy-tools-block';
import { AccessRightsBlock } from './fields/access-rights/access-rights-block';
import { AdditionalSettingsBlock } from './fields/additional-settings/additional-settings-block';

import './content.css';

// @vue/component
export const ProjectWizardContent = {
	name: 'ProjectWizardContent',
	components: {
		AccessRightsBlock,
		AdditionalSettingsBlock,
		CopySettingsField,
		GoalField,
		DescriptionField,
		MembersField,
		LegacyToolsBlock,
		ModeratorsField,
		OwnerField,
		PrivacyTypeField,
		BaseFeatureField,
		NewProjectBanner,
	},
	data(): { shownBanner: boolean }
	{
		return {
			shownBanner: false,
		};
	},
	computed: {
		...mapState(useInterfaceStore, [
			'isActionCopy',
			'isActionCreate',
			'isOldPortal',
		]),
		...mapState(useProjectStore, [
			'toggleableFeatures',
		]),
	},
	created(): void
	{
		this.shownBanner = this.isActionCreate;
	},
	template: `
		<div class="socialnetwork--project-wizard-content">
			<NewProjectBanner v-if="shownBanner" @close="shownBanner = false" />
			<GoalField />
			<DescriptionField />
			<CopySettingsField
				v-if="isActionCopy"
			/>
			<OwnerField />
			<ModeratorsField />
			<MembersField />
			<PrivacyTypeField />
			<BaseFeatureField v-if="isOldPortal" />
			<AccessRightsBlock />
			<LegacyToolsBlock
				v-if="(toggleableFeatures.length > 0 && !isActionCopy)"
			/>
			<AdditionalSettingsBlock />
		</div>
	`,
};
