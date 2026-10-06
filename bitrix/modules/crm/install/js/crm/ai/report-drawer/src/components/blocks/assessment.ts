import { defineComponent, PropType } from 'ui.vue3';
import { ProgressRound } from 'ui.progressround';
import { Type, Dom, Loc, Tag, Text } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import { AirButtonStyle, Button, ButtonIcon, ButtonSize } from 'ui.vue3.components.button';
import { hint } from 'ui.vue3.directives.hint';

import { FailedCriterion } from '../elements/failed-criterion';
import { Criterion } from '../elements/criterion';
import { ScriptName } from '../elements/script-name';

import { type AssessmentBlockData, type AssessmentSettingData } from '../../types';
import { formatAssessmentDate } from '../../lib/datetime';

export const Assessment = defineComponent({
	name: 'Assessment',

	components: {
		FailedCriterion,
		Criterion,
		Button,
		ScriptName,
	},

	directives: { hint },

	props: {
		assessmentBlockData: {
			type: Object as PropType<AssessmentBlockData>,
			required: true,
		},
		assessmentSetting: {
			type: Object as PropType<AssessmentSettingData | null>,
			default: null,
		},
	},

	emits: ['showReassessmentPopup'],

	setup(): Object
	{
		return {
			AirButtonStyle,
			ButtonIcon,
			ButtonSize,
			Outline,
		};
	},

	computed: {
		chartColor(): string
		{
			if (this.assessmentBlockData.callScore <= this.assessmentBlockData.lowerScoreBoundary)
			{
				return ProgressRound.Color.DANGER;
			}

			if (this.assessmentBlockData.callScore >= this.assessmentBlockData.upperScoreBoundary)
			{
				return ProgressRound.Color.SUCCESS;
			}

			return ProgressRound.Color.PRIMARY;
		},

		successCriteriaCount(): number
		{
			return this.assessmentBlockData.successCriteria.length;
		},

		unusedCriteriaCount(): number
		{
			return this.assessmentBlockData.unusedCriteria.length;
		},

		assessmentDate(): string
		{
			return formatAssessmentDate(this.assessmentBlockData.createdAt);
		},

		isHistory(): boolean
		{
			return this.assessmentBlockData.isHistory && Type.isStringFilled(this.assessmentDate);
		},

		headerTitle(): string
		{
			if (!this.isHistory)
			{
				return Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_BLOCK_TITLE') ?? '';
			}

			return Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_ASSESSMENT_HISTORY_BLOCK_TITLE',
				{
					'#DATE#': this.assessmentDate,
					'#SCRIPT_NAME#': this.assessmentBlockData.scriptName,
				},
			) ?? '';
		},

		successCriteriaNameElement(): HTMLElement
		{
			const stringElement = Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_ASSESSMENT_SUCCESS_CRITERIA_TITLE',
				{
					'#COUNT#': `
						<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-counter ui-typography-text-md">
							${this.successCriteriaCount}
						</span>
					`,
				},
			);

			return Tag.render`<span>${stringElement}</span>`;
		},

		unusedCriteriaNameElement(): HTMLElement
		{
			const stringElement = Loc.getMessage(
				'CRM_AI_REPORT_DRAWER_ASSESSMENT_UNUSED_CRITERIA_TITLE',
				{
					'#COUNT#': `
						<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-counter ui-typography-text-md">
							${this.unusedCriteriaCount}
						</span>
					`,
				},
			);

			return Tag.render`<span>${stringElement}</span>`;
		},

		hasChevron(): boolean
		{
			return !this.assessmentBlockData.useInRating;
		},

		showScriptUpdatedBadge(): boolean
		{
			return (
				!Type.isNull(this.assessmentSetting)
				&& this.assessmentBlockData.shouldShowReassessmentBadge
			);
		},

		roundChartHintHtml(): string
		{
			const title = Text.encode(Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_CHART_HINT_TITLE') ?? '');
			const text = Text.encode(Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_CHART_HINT_TEXT') ?? '')
				.replace(/\n/g, '<br>');

			return `
				<div class="ui-typography-text-lg ui-typography-text-bold">${title}</div>
				<br>
				<div class="ui-typography-text-md">${text}</div>
			`;
		},

		roundChartHintOptions(): Object | null
		{
			if (this.hasChevron)
			{
				return null;
			}

			return {
				html: this.roundChartHintHtml,
			};
		},
	},

	data(): { minimized: boolean, isCompletedCriteriaHidden: boolean, isUnusedCriteriaHidden: boolean }
	{
		return {
			minimized: !this.assessmentBlockData.useInRating,
			isCompletedCriteriaHidden: true,
			isUnusedCriteriaHidden: true,
		};
	},

	methods: {
		handleHowItWorksClick(): Object
		{
			const topWindow = window.top as any;
			topWindow?.BX?.Helper?.show('redirect=detail&code=23240682');

			return {};
		},

		toggleContentSpoiler(): void
		{
			this.minimized = !this.minimized;
		},

		toggleCompletedCriteriaSpoiler(canToggle: boolean): void
		{
			if (!canToggle)
			{
				return;
			}

			this.isCompletedCriteriaHidden = !this.isCompletedCriteriaHidden;
		},

		toggleUnusedCriteriaSpoiler(canToggle: boolean): void
		{
			if (!canToggle)
			{
				return;
			}

			this.isUnusedCriteriaHidden = !this.isUnusedCriteriaHidden;
		},

		handleShowReassessmentPopup(): void
		{
			if (Type.isNull(this.assessmentSetting))
			{
				return;
			}

			this.$emit('showReassessmentPopup', this.assessmentSetting);
		},

		createRoundChart(): void
		{
			if (!this.hasChevron)
			{
				const chart = new ProgressRound({
					value: this.assessmentBlockData.callScore,
					maxValue: 100,
					color: this.chartColor,
					width: 76,
					textBefore: '',
					textAfter: '',
					colorTrack: '',
					colorBar: '',
					statusType: ProgressRound.Status.INCIRCLE,
					lineSize: 9,
					fill: true,
					finished: false,
					rotation: false,
					useAirDesign: true,
				});

				chart.renderTo(this.$refs.assessmentChart as HTMLElement);
			}
			else
			{
				const chart = new ProgressRound({
					value: this.assessmentBlockData.callScore,
					maxValue: 100,
					color: ProgressRound.Color.DEFAULT,
					width: 32,
					textBefore: '',
					textAfter: this.assessmentBlockData.callScore + '%',
					colorTrack: 'var(--ui-color-base-8)',
					colorBar: 'var(--ui-color-base-6)',
					statusType: ProgressRound.Status.NONE,
					lineSize: 9,
					fill: true,
					finished: false,
					rotation: false,
					useAirDesign: true,
				});

				const container = Tag.render`
					<span class="crm-ai-report-drawer__content-block-header-chart-disabled" />
				`;
				chart.renderTo(container as HTMLElement);

				const chevron = Tag.render`
					<div class="crm-ai-report-drawer__spoiler-chevron"/>
				`;
				Dom.append(chevron, container);

				Dom.append(container, this.$refs.assessmentChart as HTMLElement);
			}
		},
	},

	mounted(): void
	{
		this.createRoundChart();
		Dom.append(this.successCriteriaNameElement, this.$refs.successCriteriaNameSection as HTMLElement);
		Dom.append(this.unusedCriteriaNameElement, this.$refs.unusedCriteriaNameSection as HTMLElement);
	},

	template: `
		<div :class="['crm-ai-report-drawer__content-block', 'crm-ai-report-drawer__assessment-block', '--ui-context-edge-dark', minimized ? '--minimized' : '']">
			<div
				v-if="hasChevron"
				class="crm-ai-report-drawer__content-block-assessment-header crm-ai-report-drawer__content-block-assessment-header--collapsible"
			>
				<div
					class="crm-ai-report-drawer__content-block-assessment-header-main crm-ai-report-drawer__spoiler-toggle-trigger"
					@click="toggleContentSpoiler"
				>
					<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
						{{ headerTitle }}
					</h4>
					<div
						class="crm-ai-report-drawer__content-block-header-chart"
						ref="assessmentChart"
					/>
				</div>
				<div v-show="!minimized" class="crm-ai-report-drawer__content-block-assessment-header-extra">
					<ScriptName
						v-if="!isHistory"
						:scriptName="assessmentBlockData.scriptName"
						:assessmentSettingId="assessmentBlockData.assessmentSettingId"
						class="crm-ai-report-drawer__content-block-assessment-header-script-name"
					/>
					<Button
						:text="loc('CRM_AI_REPORT_DRAWER_ASSESSMENT_NOT_USED_IN_RATING')"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:size="ButtonSize.SMALL"
						:collapsedIcon="ButtonIcon.DOTS"
						:leftIcon="Outline.QUESTION"
						class="crm-ai-report-drawer__content-block-header-assessment-badge crm-ai-report-drawer__content-block-header-assessment-not-used-in-rating-badge"
						@click="handleHowItWorksClick"
					/>
					<div class="crm-ai-report-drawer__content-block-header-assessment-review ui-typography-text-lg">
						{{ assessmentBlockData.recommendation }}
					</div>
				</div>
			</div>
			<div
				v-else
				class="crm-ai-report-drawer__content-block-assessment-header"
			>
				<div class="crm-ai-report-drawer__content-block-assessment-header-text">
					<h4 class="crm-ai-report-drawer__content-block-header-title ui-typography-heading-h4">
						{{ headerTitle }}
					</h4>
					<ScriptName
						v-if="!isHistory"
						:scriptName="assessmentBlockData.scriptName"
						:assessmentSettingId="assessmentBlockData.assessmentSettingId"
						class="crm-ai-report-drawer__content-block-assessment-header-script-name"
					/>
					<Button
						v-if="showScriptUpdatedBadge"
						:text="loc('CRM_AI_REPORT_DRAWER_ASSESSMENT_SCRIPT_UPDATED_REASSESS')"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:size="ButtonSize.SMALL"
						:collapsedIcon="ButtonIcon.DOTS"
						class="crm-ai-report-drawer__content-block-header-assessment-badge crm-ai-report-drawer__content-block-header-assessment-script-updated-badge"
						@click="handleShowReassessmentPopup"
					/>
					<div class="crm-ai-report-drawer__content-block-header-assessment-review ui-typography-text-lg">
						{{ assessmentBlockData.recommendation }}
					</div>
				</div>
				<div
					class="crm-ai-report-drawer__content-block-header-chart"
					ref="assessmentChart"
					v-hint="roundChartHintOptions"
				/>
			</div>
			<div class="crm-ai-report-drawer__content-block-assessment-criteria">
				<div
					v-show="!minimized"
					class="crm-ai-report-drawer__content-block-assessment-criteria-ai-logo"
				/>
				<div
					:class="[
						'crm-ai-report-drawer__content-block-assessment-criteria-failures-spoiler',
						'crm-ai-report-drawer__spoiler-content',
						minimized ? '--hidden' : '',
					]"
				>
					<div class="crm-ai-report-drawer__spoiler-content-inner">
						<div class="crm-ai-report-drawer__content-block-assessment-criteria-failures-list">
							<FailedCriterion
								v-for="(failedCriterion, index) in assessmentBlockData.failedCriteria"
								:key="index"
								:title="failedCriterion.title"
								:description="failedCriterion.description"
								:summary="failedCriterion.summary"
							/>
							<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer --ui-context-content-light">
								<div
									:class="[
										'crm-ai-report-drawer__content-block-assessment-criteria-footer-cell',
										successCriteriaCount !== 0 ? 'crm-ai-report-drawer__spoiler-toggle-trigger' : '',
									]"
									@click="toggleCompletedCriteriaSpoiler(successCriteriaCount !== 0)"
								>
									<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title">
										<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title-check" />
										<span class="ui-typography-text-lg ui-typography-text-bold" ref="successCriteriaNameSection" />
									</div>
									<div
										v-if="successCriteriaCount !== 0"
										class="crm-ai-report-drawer__spoiler-chevron"
									/>
								</div>
								<div :class="['crm-ai-report-drawer__spoiler-content', isCompletedCriteriaHidden ? '--hidden' : '']">
									<div class="crm-ai-report-drawer__spoiler-content-inner">
										<div class="crm-ai-report-drawer__footer-criteria-container">
											<Criterion
												v-for="(criterion, index) in assessmentBlockData.successCriteria"
												:key="index"
												:status="criterion.status"
												:name="criterion.title"
												:text="criterion.summary"
											/>
										</div>
									</div>
								</div>
								<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-divider" />
								<div
									:class="[
										'crm-ai-report-drawer__content-block-assessment-criteria-footer-cell',
										unusedCriteriaCount !== 0 ? 'crm-ai-report-drawer__spoiler-toggle-trigger' : '',
									]"
									@click="toggleUnusedCriteriaSpoiler(unusedCriteriaCount !== 0)"
								>
									<div class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title">
										<span class="crm-ai-report-drawer__content-block-assessment-criteria-footer-cell-title-circle-minus" />
										<span class="ui-typography-text-lg ui-typography-text-bold" ref="unusedCriteriaNameSection" />
									</div>
									<div
										v-if="unusedCriteriaCount !== 0"
										class="crm-ai-report-drawer__spoiler-chevron"
									/>
								</div>
								<div :class="['crm-ai-report-drawer__spoiler-content', isUnusedCriteriaHidden ? '--hidden' : '']">
									<div class="crm-ai-report-drawer__spoiler-content-inner">
										<div class="crm-ai-report-drawer__footer-criteria-container">
											<Criterion
												v-for="(criterion, index) in assessmentBlockData.unusedCriteria"
												:key="index"
												:status="criterion.status"
												:name="criterion.title"
												:text="criterion.summary"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
})
