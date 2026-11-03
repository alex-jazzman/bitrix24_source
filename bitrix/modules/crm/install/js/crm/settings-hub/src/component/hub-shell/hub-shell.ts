import { defineComponent, type Component, type PropType } from 'ui.vue3';

import { SUPPLY_STEP } from '../../const/index';
import { type HubSectionDescriptor, type SettingsRecord } from '../../const/record';
import { filterSectionRecords } from '../../lib/filter-records/filter-records';
import { CrmHubSection } from '../hub-section/hub-section';
import { CrmHubControlRenderer } from '../control-renderer/control-renderer';

import './hub-shell.css';

export const CrmHubShell = defineComponent({
	name: 'CrmHubShell',
	components: { CrmHubSection, CrmHubControlRenderer },
	props: {
		sections: {
			type: Array as PropType<HubSectionDescriptor[]>,
			required: true,
		},
		records: {
			type: Array as PropType<SettingsRecord[]>,
			default: () => [],
		},
		snapshot: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		activeSectionId: {
			type: String,
			required: true,
		},
		readOnly: {
			type: Boolean,
			default: false,
		},
		isPanelFixed: {
			type: Boolean,
			default: false,
		},
		controls: {
			type: Object as PropType<Record<string, Component>>,
			default: null,
		},
	},
	emits: ['update', 'action'],
	watch: {
		activeSectionId(): void
		{
			this.$nextTick(() => {
				this.focusActiveSection();
			});
		},
	},
	methods: {
		recordsForSection(sectionId: string): SettingsRecord[]
		{
			return filterSectionRecords(this.records, sectionId, SUPPLY_STEP);
		},
		focusActiveSection(): void
		{
			const node = this.$el?.querySelector?.(
				`.crm-settings-hub-section[data-section-id="${this.activeSectionId}"]`,
			);
			// preventScroll: the section is focused for screen readers, not to navigate the eye. Without
			// it the browser scrolls the freshly shown section into view on every switch, so each tab
			// opened at its own arbitrary offset and the cards looked like they moved between tabs.
			node?.focus?.({ preventScroll: true });
		},
		handleUpdate(payload: { id: string, valueKey: string, value: unknown }): void
		{
			this.$emit('update', payload);
		},
		handleAction(payload: { id: string, actionKey: string }): void
		{
			this.$emit('action', payload);
		},
	},
	template: `
		<div
			class="crm-settings-hub-shell"
			:class="{ '--panel-fixed': isPanelFixed }"
			data-testid="crm-settings-hub-shell"
		>
			<div v-if="$slots.passport" class="crm-settings-hub-shell__passport">
				<slot name="passport"/>
			</div>
			<div class="crm-settings-hub-shell__sections">
				<CrmHubSection
					v-for="section in sections"
					v-show="section.id === activeSectionId"
					:key="section.id"
					:data-section-id="section.id"
					:section-id="section.id"
					:title="section.title"
					:hide-title="section.hideTitle"
				>
					<slot :name="'section-' + section.id" :records="recordsForSection(section.id)">
						<CrmHubControlRenderer
							v-for="record in recordsForSection(section.id)"
							:key="record.id"
							:descriptor="record"
							:snapshot="snapshot"
							:read-only="readOnly"
							:controls="controls"
							@update="handleUpdate"
							@action="handleAction"
						/>
					</slot>
				</CrmHubSection>
			</div>
			<div v-if="$slots.panel" class="crm-settings-hub-shell__panel">
				<slot name="panel"/>
			</div>
		</div>
	`,
});
