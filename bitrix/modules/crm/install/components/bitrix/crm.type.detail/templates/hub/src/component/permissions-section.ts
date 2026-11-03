import { defineComponent, type Component, type PropType } from 'ui.vue3';
import { locMixin } from 'ui.vue3.mixins.loc-mixin';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { HeadlineSm, TextSm } from 'ui.system.typography.vue';
import {
	CrmHubCard,
	CrmHubControlRenderer,
	CrmHubOptionRow,
	type SettingsRecord,
} from 'crm.settings-hub';

import { PERMISSIONS_ACTION } from '../const/action-keys';
import {
	PERMISSIONS_CARD_ICON,
	PERMISSIONS_LAYOUT_RECORD_IDS,
	PERMISSIONS_RECORD_ID,
} from '../const/permissions-layout';

// Layout of the "Access permissions" section: the section heading sits outside the card
// (the only one of the four designed sections that does), the card holds a single action row.
export const CrmTypeHubPermissionsSection = defineComponent({
	name: 'CrmTypeHubPermissionsSection',
	components: { CrmHubCard, CrmHubControlRenderer, CrmHubOptionRow, UiButton, HeadlineSm, TextSm },
	mixins: [locMixin],
	props: {
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
	},
	emits: ['update', 'action'],
	setup(): Object
	{
		return { AirButtonStyle, ButtonSize, PERMISSIONS_CARD_ICON };
	},
	computed: {
		// Records the layout does not draw itself: kept so raising SUPPLY_STEP cannot silently
		// drop a new record off the screen.
		restRecords(): SettingsRecord[]
		{
			return this.records.filter((record) => !PERMISSIONS_LAYOUT_RECORD_IDS.includes(record.id));
		},
	},
	methods: {
		handleOpen(): void
		{
			this.$emit('action', { id: PERMISSIONS_RECORD_ID, actionKey: PERMISSIONS_ACTION });
		},
	},
	template: `
		<div class="crm-type-hub-permissions" data-testid="crm-type-detail-hub-permissions-section">
			<HeadlineSm tag="h2" class="crm-type-hub-section-title">{{ loc('CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS') }}</HeadlineSm>
			<TextSm class="crm-type-hub-section-intro">{{ loc('CRM_TYPE_DETAIL_HUB_PERMISSIONS_INTRO') }}</TextSm>
			<CrmHubCard
				card-id="permissions"
				:title="'CRM_TYPE_DETAIL_HUB_PERMISSIONS_CARD_TITLE'"
				:icon="PERMISSIONS_CARD_ICON"
				collapsible
			>
				<CrmHubOptionRow
					row-id="permissions-open"
					title="CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_TITLE"
					description="CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_DESCRIPTION"
					:checked="null"
					last
					test-id="crm-type-detail-hub-permissions-row"
				>
					<template #action>
						<UiButton
							:text="loc('CRM_TYPE_DETAIL_HUB_PERMISSIONS_OPEN')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:dataset="{ testid: 'crm-type-detail-hub-permissions-open-btn' }"
							@click="handleOpen"
						/>
					</template>
				</CrmHubOptionRow>
			</CrmHubCard>
			<CrmHubCard v-if="restRecords.length" card-id="permissions-rest">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`,
});
