import { HelpDesk, Model } from 'booking.const';
import { HelpDeskLoc } from 'booking.component.help-desk-loc';
import { RcwAnalytics } from 'booking.lib.analytics';
import type { ResourceCreationType } from 'booking.model.resource-creation-wizard';

import { ResourceType } from './resource-type/resource-type';
import './resource-category-card.css';

export const ResourceCategoryCard = {
	name: 'ResourceCategoryCard',
	setup(): { code: string, anchorCode: string }
	{
		return {
			code: HelpDesk.ResourceType.code,
			anchorCode: HelpDesk.ResourceType.anchorCode,
		};
	},
	computed: {
		resourceTypes(): ResourceCreationType[]
		{
			return this.$store.state[Model.ResourceCreationWizard].advertisingResourceTypes;
		},
	},
	methods: {
		async selectResourceType({ relatedResourceTypeId }: ResourceCreationType): Promise<void>
		{
			await this.$store.dispatch(`${Model.ResourceCreationWizard}/updateResource`, {
				typeId: relatedResourceTypeId,
			});

			await this.$store.dispatch(`${Model.ResourceCreationWizard}/nextStep`);
			RcwAnalytics.sendAddResourceStep1();
		},
	},
	components: {
		HelpDeskLoc,
		ResourceType,
	},
	template: `
		<div class="resource-category-card">
			<div class="resource-category-card__header">
				<div class="resource-category-card__header__title">
					{{ loc('BRCW_CHOOSE_CATEGORY_MSGVER_1') }}
				</div>
				<HelpDeskLoc
					:message="loc('BRCW_CHOOSE_CATEGORY_DESCRIPTION_MSGVER_2')"
					:code="code"
					:anchor="anchorCode"
				/>
			</div>
			<div class="resource-category-card__content resource-creation-wizard__form">
				<ResourceType
					v-for="resourceType in resourceTypes"
					:key="resourceType.code"
					:resource-type
					:data-id="'brcw-resource-type-list-' + resourceType.code"
					@selected="selectResourceType"
				/>
			</div>
		</div>
	`,
};
