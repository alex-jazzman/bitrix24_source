import { NameService } from 'crm.ai.name-service';
import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HeadlineMd, TextSm, TextXs } from 'ui.system.typography.vue';
import { Hint } from 'ui.vue3.components.hint';
import { hint } from 'ui.vue3.directives.hint';
import { RichLoc } from 'ui.vue3.components.rich-loc';
import { defineComponent, type PropType } from 'ui.vue3';
import { type FilterDescriptor, type FilterOption, type MultiFilter, type SingleFilter } from '../../types';
import { createCalloutHint } from '../../utils/callout-hint';
import './script-info-card.css';

export const ScriptInfoCard = defineComponent({
	name: 'CrmCopilotCallAssessmentV2ScriptInfoCard',
	directives: {
		hint,
	},
	components: {
		BIcon,
		HeadlineMd,
		Hint,
		RichLoc,
		TextSm,
		TextXs,
	},
	props: {
		isEditMode: {
			type: Boolean,
			default: false,
		},
		assessmentId: {
			type: Number,
			default: null,
		},
		description: {
			type: String,
			required: true,
		},
		filters: {
			type: Array as PropType<FilterDescriptor[]>,
			required: true,
		},
		updatedAt: {
			type: Number,
			default: null,
		},
		processedCallsCount: {
			type: Number,
			default: 0,
		},
		isGeneratedByCopilot: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	data(): { isClientTypesTruncated: boolean }
	{
		return {
			isClientTypesTruncated: false,
		};
	},
	computed: {
		copilotReplacement(): { [key: string]: string }
		{
			return { '#COPILOT_NAME#': NameService.copilotName() };
		},
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
		clientTypesText(): string
		{
			if (!this.clientFilter || this.clientFilter.values.length === 0)
			{
				return '';
			}

			return this.clientFilter.options
				.filter((option: FilterOption) => this.clientFilter!.values.includes(option.value))
				.map((option: FilterOption) => option.label)
				.join(', ');
		},
		callTypeText(): string
		{
			if (!this.callFilter)
			{
				return '';
			}

			const option = this.callFilter.options.find(
				(entry: FilterOption) => entry.value === this.callFilter!.value,
			);

			return option ? option.label : '';
		},
		processedCallsText(): string
		{
			if (!this.processedCallsCount)
			{
				return '';
			}

			return Loc.getMessagePlural(
				'CRM_CALL_ASSESSMENT_V2_INFO_PROCESSED_CALLS',
				this.processedCallsCount,
				{ '#COUNT#': String(this.processedCallsCount) },
			) ?? '';
		},
		updatedAtLabel(): string
		{
			if (!this.updatedAt)
			{
				return '';
			}

			const relative = DateTimeFormat.formatLastActivityDate(this.updatedAt);

			return this.loc('CRM_CALL_ASSESSMENT_V2_INFO_UPDATED', { '#DATE#': relative });
		},
		clientTypesHint(): Object | null
		{
			return this.isClientTypesTruncated ? { text: this.clientTypesText } : null;
		},
		attributionHint(): Object
		{
			return createCalloutHint({
				variant: 'attribution',
				title: this.loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED_HINT_TITLE', this.copilotReplacement),
				description: this.loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED_HINT_DESCRIPTION'),
			});
		},
		callsListUrl(): string
		{
			if (!this.assessmentId || this.assessmentId <= 0)
			{
				return '';
			}

			return `/crm/copilot-call-assessment/${this.assessmentId}/calls/`;
		},
	},
	watch: {
		isEditMode(value: boolean): void
		{
			if (value)
			{
				this.isClientTypesTruncated = false;
			}
			else
			{
				void this.$nextTick(() => this.checkClientTypesTruncation());
			}
		},
		clientTypesText(): void
		{
			void this.$nextTick(() => this.checkClientTypesTruncation());
		},
	},
	mounted(): void
	{
		if (!this.isEditMode)
		{
			void this.$nextTick(() => this.checkClientTypesTruncation());
		}
	},
	methods: {
		handleCallsListClick(event: MouseEvent): void
		{
			if (!this.callsListUrl)
			{
				return;
			}

			event.preventDefault();

			const sidePanel = (top as any)?.BX?.SidePanel?.Instance;
			sidePanel?.open(this.callsListUrl, {
				width: 1215,
				cacheable: false,
				allowChangeHistory: false,
			});
		},
		checkClientTypesTruncation(): void
		{
			const el = this.$refs.clientTypesTextRef as HTMLElement | undefined;
			if (!el)
			{
				this.isClientTypesTruncated = false;

				return;
			}

			this.isClientTypesTruncated = el.scrollWidth > el.clientWidth;
		},
	},
	template: `
		<section class="crm-call-assessment-v2-info-card">
			<template v-if="!isEditMode">
				<div class="crm-call-assessment-v2-info-card__title-row">
					<BIcon class="crm-call-assessment-v2-info-card__title-icon" :name="Outline.AI_STARS" :size="24"/>
					<HeadlineMd class="crm-call-assessment-v2-info-card__title" tag="h2">
						{{ loc('CRM_CALL_ASSESSMENT_V2_SCRIPT_SECTION_TITLE') }}
					</HeadlineMd>
				</div>
				<TextSm class="crm-call-assessment-v2-info-card__description">
					{{ description }}
				</TextSm>
				<div class="crm-call-assessment-v2-info-card__info-chips">
					<span
						v-if="isGeneratedByCopilot"
						v-hint="attributionHint"
						class="crm-call-assessment-v2-info-card__info-chip --attribution"
					>
						<BIcon
							class="crm-call-assessment-v2-info-card__info-chip-icon --gradient"
							:name="Outline.INFO_CIRCLE"
							:size="20"
						/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text --gradient">
							{{ loc('CRM_CALL_ASSESSMENT_V2_INFO_GENERATED', copilotReplacement) }}
						</span>
					</span>
					<span v-if="processedCallsCount > 0" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.CRM" :size="20"/>
						<RichLoc
							class="crm-call-assessment-v2-info-card__info-chip-text"
							tag="span"
							:text="processedCallsText"
							placeholder="[link]"
						>
							<template #link="{ text }">
								<a
									v-if="callsListUrl"
									class="crm-call-assessment-v2-info-card__info-chip-link"
									:href="callsListUrl"
									@click="handleCallsListClick"
								>{{ text }}</a>
								<span v-else class="crm-call-assessment-v2-info-card__info-chip-link">{{ text }}</span>
							</template>
						</RichLoc>
					</span>
					<span v-if="updatedAt" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.REFRESH" :size="20"/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ updatedAtLabel }}
						</span>
					</span>
					<span
						v-if="clientTypesText"
						v-hint="clientTypesHint"
						class="crm-call-assessment-v2-info-card__info-chip --truncate"
					>
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.THREE_PERSONS" :size="20"/>
						<span ref="clientTypesTextRef" class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ clientTypesText }}
						</span>
					</span>
					<span v-if="callTypeText" class="crm-call-assessment-v2-info-card__info-chip">
						<BIcon class="crm-call-assessment-v2-info-card__info-chip-icon" :name="Outline.PHONE_UP" :size="20"/>
						<span class="crm-call-assessment-v2-info-card__info-chip-text">
							{{ callTypeText }}
						</span>
					</span>
				</div>
			</template>
		</section>
	`,
});
