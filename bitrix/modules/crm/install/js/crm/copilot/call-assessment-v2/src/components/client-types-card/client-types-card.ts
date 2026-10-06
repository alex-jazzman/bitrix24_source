import { HeadlineSm, TextXs } from 'ui.system.typography.vue';
import { defineComponent, type PropType } from 'ui.vue3';
import { FilterTagSelector } from '../filter-tag-selector/filter-tag-selector';
import { type FilterDescriptor, type MultiFilter, type SingleFilter, type TagStyling } from '../../types';
import './client-types-card.css';

type ClientTypesCardData = {
	highlightStyle: TagStyling,
};

export const ClientTypesCard = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ClientTypesCard',
	components: {
		FilterTagSelector,
		HeadlineSm,
		TextXs,
	},
	props: {
		filters: {
			type: Array as PropType<FilterDescriptor[]>,
			required: true,
		},
		minSelected: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:filters'],
	data(): ClientTypesCardData
	{
		return {
			highlightStyle: {
				bgColor: 'var(--ui-color-design-tinted-success-bg)',
				textColor: 'var(--ui-color-design-tinted-success-content)',
			},
		};
	},
	computed: {
		clientFilter(): MultiFilter | null
		{
			const filter = this.filters.find((f: FilterDescriptor) => f.code === 'clients');

			return filter && filter.multi ? (filter as MultiFilter) : null;
		},
		callFilter(): SingleFilter | null
		{
			const filter = this.filters.find((f: FilterDescriptor) => f.code === 'calls');

			return filter && !filter.multi ? (filter as SingleFilter) : null;
		},
	},
	methods: {
		handleClientsChange(values: number[]): void
		{
			const next = this.filters.map((filter: FilterDescriptor) => (
				filter.code === 'clients' && filter.multi
					? { ...filter, values }
					: filter
			));
			this.$emit('update:filters', next);
		},
		handleCallChange(value: number | null): void
		{
			const next = this.filters.map((filter: FilterDescriptor) => (
				filter.code === 'calls' && !filter.multi
					? { ...filter, value: value ?? filter.value }
					: filter
			));
			this.$emit('update:filters', next);
		},
	},
	template: `
		<section class="crm-call-assessment-v2-client-types-card">
			<HeadlineSm class="crm-call-assessment-v2-client-types-card__heading" tag="h2" accent>
				{{ loc('CRM_CALL_ASSESSMENT_V2_AUDIENCE_HEADING') }}
			</HeadlineSm>
			<div class="crm-call-assessment-v2-client-types-card__row">
				<div class="crm-call-assessment-v2-client-types-card__field" v-if="clientFilter">
					<TextXs class="crm-call-assessment-v2-client-types-card__label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CLIENT_TYPES_LABEL') }}
					</TextXs>
					<FilterTagSelector
						multi
						entityIdSuffix="clients"
						:modelValue="clientFilter.values"
						:options="clientFilter.options"
						:highlightValues="clientFilter.highlightValues ?? []"
						:highlightStyle="highlightStyle"
						:minSelected="minSelected"
						@update:modelValue="handleClientsChange"
					/>
				</div>
				<div class="crm-call-assessment-v2-client-types-card__field" v-if="callFilter">
					<TextXs class="crm-call-assessment-v2-client-types-card__label">
						{{ loc('CRM_CALL_ASSESSMENT_V2_CALL_TYPES_LABEL') }}
					</TextXs>
					<FilterTagSelector
						entityIdSuffix="calls"
						:modelValue="callFilter.value"
						:options="callFilter.options"
						:minSelected="minSelected"
						@update:modelValue="handleCallChange"
					/>
				</div>
			</div>
		</section>
	`,
});
