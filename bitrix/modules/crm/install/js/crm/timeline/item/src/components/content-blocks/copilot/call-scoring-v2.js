import { Router } from 'crm.router';
import { Text, Type } from 'main.core';
import { ProgressRound } from 'ui.progressround';

import { Action } from '../../../action';

const CHART_WIDTH = 65;
const CHART_LINE_SIZE = 9;

// @vue/component
export const CallScoringV2 = {
	props: {
		scriptTitle: {
			type: String,
			required: true,
		},
		score: {
			type: Number,
			required: true,
		},
		scoreDescription: {
			type: String,
			required: true,
		},
		scoreLowBorder: {
			type: Number,
			required: true,
		},
		scoreHighBorder: {
			type: Number,
			required: true,
		},
		action: {
			type: [Object, null],
			default: null,
		},
	},
	chart: null,
	computed: {
		integerScore(): number
		{
			return Text.toInteger(this.score);
		},

		chartColor(): string
		{
			const highBorder = Text.toInteger(this.scoreHighBorder);
			if (this.integerScore >= highBorder)
			{
				return ProgressRound.Color.SUCCESS;
			}

			const lowBorder = Text.toInteger(this.scoreLowBorder);
			if (this.integerScore <= lowBorder)
			{
				return ProgressRound.Color.DANGER;
			}

			return ProgressRound.Color.PRIMARY;
		},
	},

	watch: {
		score(): void
		{
			this.updateChart();
		},
	},

	mounted()
	{
		this.createChart();
	},

	beforeUnmount()
	{
		if (this.chart)
		{
			this.chart.destroy();
		}
	},

	methods: {
		createChart(): void
		{
			this.chart = new ProgressRound({
				width: CHART_WIDTH,
				lineSize: CHART_LINE_SIZE,
				statusType: ProgressRound.Status.INCIRCLE,
				value: this.integerScore,
				color: this.chartColor,
			});

			this.chart.renderTo(this.$refs.chartContainer);
		},

		updateChart(): void
		{
			if (!this.chart)
			{
				this.createChart();

				return;
			}

			this.chart.setColor(this.chartColor);
			this.chart.update(this.integerScore);
		},

		editScript(): void
		{
			const assessmentSettingsId = this.action?.actionParams?.assessmentSettingsId;
			if (!Type.isInteger(assessmentSettingsId))
			{
				return;
			}

			Router.openSlider(
				`/crm/copilot-call-assessment/details/${assessmentSettingsId}/`,
				{
					width: 700,
					cacheable: false,
				},
			);
		},

		showDetails(): void
		{
			if (Type.isObject(this.action))
			{
				void (new Action(this.action)).execute(this);
			}
		},
	},

	// language=Vue
	template: `
		<div class="crm-timeline__call-scoring-v2">
			<div 
				class="crm-timeline__call-scoring-v2-chart"
				ref="chartContainer"
			></div>
			<div class="crm-timeline__call-scoring-v2-content">
				<div class="body">
					<div class="script-layout">
						<div class="script-layout-header">
							{{ $Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_SCRIPT_TITLE') }}
						</div>
						<div 
							class="script-layout-title"
							@click.prevent="editScript"
						>{{ scriptTitle }}</div>
					</div>
					<div>
						<span class="summary-text">{{ scoreDescription }}</span>
						<span
							class="details-link"
							@click.prevent="showDetails"
						>
							{{ $Bitrix.Loc.getMessage('CRM_TIMELINE_ITEM_CALL_SCORING_DETAILS') }}
						</span>
					</div>
				</div>
			</div>
		</div>
	`,
};
