import { defineComponent, PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { BlockShell } from './block-shell';
import { ScriptName } from '../elements/script-name';

import { type BlockData, type LegacyAssessmentBlockData } from '../../types';
import { formatCreatedAt } from '../../lib/datetime';

export const TextBlock = defineComponent({
	name: 'TextBlock',

	components: {
		BlockShell,
		ScriptName,
	},

	props: {
		blockData: {
			type: Object as PropType<BlockData>,
			required: true,
		},
	},

	computed: {
		hasAiLanguage(): boolean
		{
			return Type.isStringFilled(this.blockData.aiLanguage?.trim());
		},

		isLegacyAssessment(): boolean
		{
			return this.blockData.blockType === 'legacyAssessment';
		},

		legacyAssessmentData(): LegacyAssessmentBlockData | null
		{
			return this.isLegacyAssessment ? this.blockData as LegacyAssessmentBlockData : null;
		},

		iconClass(): string
		{
			if (this.isLegacyAssessment)
			{
				return 'crm-ai-report-drawer__content-block-header-legacy-assessment-icon';
			}

			if (this.blockData.blockType === 'summary')
			{
				return 'crm-ai-report-drawer__content-block-header-summary-icon';
			}

			return 'crm-ai-report-drawer__content-block-header-transcription-icon';
		},

		textClass(): string
		{
			return this.blockData.blockType === 'transcription'
				? 'crm-ai-report-drawer__text-transcription'
				: ''
			;
		},

		hasCreatedAt(): boolean
		{
			return Type.isInteger(this.blockData.createdAt) && this.blockData.createdAt > 0;
		},

		createdAtText(): string
		{
			return formatCreatedAt(this.blockData.createdAt);
		},
	},

	data(): { searchArea: null | HTMLElement }
	{
		return {
			searchArea: null,
		};
	},

	mounted(): void
	{
		this.searchArea = this.$refs.textContainer as HTMLElement;
	},

	template: `
		<BlockShell
			:title="blockData.title"
			:iconClass="iconClass"
			:searchArea="searchArea"
			:initiallyMinimized="blockData.minimized"
		>
			<template v-if="legacyAssessmentData" #contentMeta>
				<div class="crm-ai-report-drawer__content-block-legacy-assessment-script-section">
					<ScriptName
						:scriptName="legacyAssessmentData.scriptName"
						:assessmentSettingId="legacyAssessmentData.assessmentSettingId"
						legacy
					/>
				</div>
			</template>
			<p
				:class="textClass"
				ref="textContainer"
			>
				{{ blockData.text }}
			</p>
			<template v-if="hasAiLanguage || hasCreatedAt" #footer>
				<div
					v-if="hasAiLanguage"
					class="crm-ai-report-drawer__content-block-message ui-typography-text-sm"
					v-html="blockData.aiLanguage"
				/>
				<div v-if="hasCreatedAt" class="crm-ai-report-drawer__content-block-date ui-typography-text-xs">
					{{ createdAtText }}
				</div>
			</template>
		</BlockShell>
	`,
});
