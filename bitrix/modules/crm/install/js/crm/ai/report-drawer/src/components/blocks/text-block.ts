import { defineComponent, PropType } from 'ui.vue3';
import { Type } from 'main.core';

import { BlockShell } from './block-shell';
import { ScriptName } from '../elements/script-name';

import { type BlockData, type LegacyAssessmentBlockData } from '../../types';
import { formatCreatedAt } from '../../lib/datetime';
import { copyToClipboard } from '../../lib/clipboard';
import { showCopiedInformer } from '../../lib/copied-informer';
import { sendReaction, type ReactionType } from '../../feature/send-reaction/send-reaction';

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
		ownerTypeId: {
			type: Number,
			required: true,
		},
	},

	computed: {
		testIdPrefix(): string
		{
			return `crm-ai-report-drawer-text-block-${this.blockData.blockId}`;
		},

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
			return (
				this.blockData.blockType === 'transcription'
				|| (this.blockData.blockType === 'summary' && this.blockData.preserveWhitespace === true)
			)
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

	methods: {
		handleReactionClick(type: ReactionType): void
		{
			if (this.selectedReaction !== null)
			{
				return;
			}

			this.selectedReaction = type;
			const context = this.blockData.blockType === 'legacyAssessment'
				? 'call_scoring'
				: this.blockData.blockType
			;
			sendReaction(type, context, this.ownerTypeId);
		},

		async copyText(event: MouseEvent): Promise<void>
		{
			// Read before the await: currentTarget is nulled once the event finishes dispatching.
			const icon = event.currentTarget as HTMLElement;

			if (await copyToClipboard(this.blockData.text))
			{
				showCopiedInformer(icon);
			}
		},
	},

	data(): {
		searchArea: null | HTMLElement,
		selectedReaction: ReactionType | null,
	}
	{
		return {
			searchArea: null,
			selectedReaction: null,
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
			:testIdPrefix="testIdPrefix"
			:data-testid="testIdPrefix"
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
				:data-testid="testIdPrefix + '-body'"
				ref="textContainer"
			>
				{{ blockData.text }}
			</p>
			<template v-if="hasAiLanguage" #contentNote>
				<div
					class="crm-ai-report-drawer__content-block-message ui-typography-text-sm"
					:data-testid="testIdPrefix + '-content-note'"
					v-html="blockData.aiLanguage"
				/>
			</template>
			<template v-if="hasCreatedAt" #footer>
				<div class="crm-ai-report-drawer__content-block-actions" :data-testid="testIdPrefix + '-footer'">
					<button
						type="button"
						class="crm-ai-report-drawer__content-block-action --copy"
						:data-testid="testIdPrefix + '-copy-button'"
						:aria-label="loc('CRM_AI_REPORT_DRAWER_ACTION_COPY')"
						@click="copyText"
					/>
					<button
						v-if="selectedReaction !== 'like'"
						type="button"
						:data-testid="testIdPrefix + '-dislike-button'"
						:class="[
							'crm-ai-report-drawer__content-block-action',
							'--dislike',
							{ '--selected': selectedReaction === 'dislike' },
						]"
						:aria-label="loc('CRM_AI_REPORT_DRAWER_ACTION_DISLIKE')"
						:aria-pressed="selectedReaction === 'dislike'"
						:disabled="selectedReaction !== null"
						@click="handleReactionClick('dislike')"
					/>
					<button
						v-if="selectedReaction !== 'dislike'"
						type="button"
						:data-testid="testIdPrefix + '-like-button'"
						:class="[
							'crm-ai-report-drawer__content-block-action',
							'--like',
							{ '--selected': selectedReaction === 'like' },
						]"
						:aria-label="loc('CRM_AI_REPORT_DRAWER_ACTION_LIKE')"
						:aria-pressed="selectedReaction === 'like'"
						:disabled="selectedReaction !== null"
						@click="handleReactionClick('like')"
					/>
				</div>
				<div class="crm-ai-report-drawer__content-block-date ui-typography-text-xs" :data-testid="testIdPrefix + '-date'">
					{{ createdAtText }}
				</div>
			</template>
		</BlockShell>
	`,
});
