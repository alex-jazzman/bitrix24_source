import { Extension, Loc } from 'main.core';
import { HtmlFormatterComponent } from 'ui.bbcode.formatter.html-formatter';

import { ReportType } from '../const/report-type';
import './gpt-report-card.css';

const settings = Extension.getSettings('timeman.work-time-report');

const AI_TITLE_LOC_KEY_BY_TYPE = {
	[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_DAY',
	[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_WEEK',
	[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_MONTH',
};

const AUTO_TITLE_LOC_KEY_BY_TYPE = {
	[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_DAY',
	[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_WEEK',
	[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_MONTH',
};

const AI_TITLE_PENDING_LOC_KEY_BY_TYPE = {
	[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_DAY_PENDING',
	[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_WEEK_PENDING',
	[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_GPT_TITLE_MONTH_PENDING',
};

const AUTO_TITLE_PENDING_LOC_KEY_BY_TYPE = {
	[ReportType.DAY]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_DAY_PENDING',
	[ReportType.WEEK]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_WEEK_PENDING',
	[ReportType.MONTH]: 'TIMEMAN_WORK_TIME_REPORT_AUTO_TITLE_MONTH_PENDING',
};

// @vue/component
export const GptReportCard = {
	name: 'GptReportCard',
	components: { HtmlFormatterComponent },
	props: {
		report: {
			type: String,
			default: null,
		},
		reportType: {
			type: String,
			default: ReportType.WEEK,
		},
		sourceType: {
			type: String,
			default: 'REPORT',
		},
		isPlan: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		isAiReport(): boolean
		{
			if (this.sourceType === 'AI_REPORT')
			{
				return true;
			}

			if (this.sourceType === 'ROBOT_REPORT')
			{
				return false;
			}

			return Boolean(settings.hasAiReportAccess);
		},
		isInProgress(): boolean
		{
			return !this.report?.length;
		},
		rootClass(): Object
		{
			return {
				'tm-work-time-report-gpt-card--auto': !this.isAiReport,
			};
		},
		titleText(): string
		{
			if (this.isPlan)
			{
				let planKey = '';

				if (this.isInProgress)
				{
					planKey = this.isAiReport
						? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_TITLE_PENDING'
						: 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_TITLE_PENDING';
				}
				else
				{
					planKey = this.isAiReport
						? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_TITLE'
						: 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_TITLE';
				}

				return Loc.getMessage(planKey, { '#COPILOT_NAME#': settings.copilotName });
			}

			let map;
			if (this.isInProgress)
			{
				map = this.isAiReport ? AI_TITLE_PENDING_LOC_KEY_BY_TYPE : AUTO_TITLE_PENDING_LOC_KEY_BY_TYPE;
			}
			else
			{
				map = this.isAiReport ? AI_TITLE_LOC_KEY_BY_TYPE : AUTO_TITLE_LOC_KEY_BY_TYPE;
			}
			const key = map[this.reportType] ?? map[ReportType.WEEK];

			return Loc.getMessage(key, { '#COPILOT_NAME#': settings.copilotName});
		},
		inProgressText(): string
		{
			let key = '';

			if (this.isPlan)
			{
				key = this.isAiReport
					? 'TIMEMAN_WORK_TIME_REPORT_PLAN_GPT_IN_PROGRESS_TEXT'
					: 'TIMEMAN_WORK_TIME_REPORT_PLAN_AUTO_IN_PROGRESS_TEXT';
			}
			else
			{
				key = this.isAiReport
					? 'TIMEMAN_WORK_TIME_REPORT_GPT_IN_PROGRESS_TEXT_MSGVER_1'
					: 'TIMEMAN_WORK_TIME_REPORT_AUTO_IN_PROGRESS_TEXT_MSGVER_1';
			}

			return Loc.getMessage(key, { '#COPILOT_NAME#': settings.copilotName});
		},
	},
	template: `
		<div class="tm-work-time-report-gpt-card" :class="rootClass">
			<div class="tm-work-time-report-gpt-card__title">
				<span class="tm-work-time-report-gpt-card__title-icon"
				      :class="{'--ai-report': isAiReport}"
				></span>
				<span class="tm-work-time-report-gpt-card__title-text"
					  :class="{'--ai-report': isAiReport}"
					>
					{{ titleText }}
				</span>
			</div>
			<div v-if="isInProgress" class="tm-work-time-report-gpt-card__in-progress">
				<div class="tm-work-time-report-gpt-card__in-progress-text" v-html="inProgressText"></div>
			</div>
			<div v-else class="tm-work-time-report-gpt-card__body">
				<HtmlFormatterComponent
					v-if="report"
					:bbcode="report"
				/>
				<template v-else>{{ report }}</template>
			</div>
		</div>
	`,
};
