import { defineComponent, type PropType } from 'ui.vue3';

import { CrmSettingsHubEmptyState } from '../empty-state/empty-state';
import { CrmSettingsHubSettingsBlock } from '../settings-block/settings-block';
import { type MatrixSettingAction } from '../setting-row/setting-row';
import { type ConfigTarget } from '../../lib/config-target';
import {
	type BlockRegistration,
	type SettingId,
	type SettingRegistration,
	type SettingsSectionRegistration,
} from '../../model/types';

type SettingAction = ConfigTarget | MatrixSettingAction;

export const CrmSettingsHubSettingsGroupPanel = defineComponent({
	name: 'CrmSettingsHubSettingsGroupPanel',
	components: {
		CrmSettingsHubEmptyState,
		CrmSettingsHubSettingsBlock,
	},
	props: {
		section: {
			type: Object as PropType<SettingsSectionRegistration>,
			required: true,
		},
		visibleSettingIds: {
			type: Set as PropType<ReadonlySet<SettingId>>,
			required: true,
		},
		isNarrowed: {
			type: Boolean,
			required: true,
		},
	},
	emits: ['reset-search', 'activate'],
	computed: {
		titleId(): string
		{
			return `crm-settings-hub-settings-section-${this.section.id}-title`;
		},
		visibleBlocks(): readonly BlockRegistration[]
		{
			return this.section.blocks.filter((block) => this.hasVisibleSettings(block));
		},
	},
	methods: {
		visibleRootSettings(block: BlockRegistration): readonly SettingRegistration[]
		{
			return block.settings.filter((setting) => (
				setting.parentId === undefined && this.visibleSettingIds.has(setting.id)
			));
		},
		hasVisibleSettings(block: BlockRegistration): boolean
		{
			return this.visibleRootSettings(block).length > 0;
		},
		activate(action: SettingAction): void
		{
			this.$emit('activate', action);
		},
		resetSearch(): void
		{
			this.$emit('reset-search');
		},
	},
	template: `
		<div
			class="crm-settings-hub-application__settings-panel"
			data-testid="crm-settings-hub-application-settings-panel"
		>
			<h1 :id="titleId" class="crm-settings-hub-application__title">{{ section.title }}</h1>
			<CrmSettingsHubSettingsBlock
				v-for="block in visibleBlocks"
				:key="block.id"
				:id="block.id"
				:title="block.title"
				:icon="block.icon"
				:visible="true"
			>
				<component
					:is="setting.component"
					v-for="setting in visibleRootSettings(block)"
					:key="setting.id"
					:data-testid="'crm-settings-hub-application-setting-' + setting.id"
					@activate="activate"
				/>
			</CrmSettingsHubSettingsBlock>
			<CrmSettingsHubEmptyState
				v-if="visibleSettingIds.size === 0"
				:narrowed="isNarrowed"
				@reset="resetSearch"
			/>
		</div>
	`,
});
