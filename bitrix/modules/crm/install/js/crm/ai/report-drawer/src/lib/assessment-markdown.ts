import { Loc, Type } from 'main.core';

import { type AssessmentBlockData, type Criterion } from '../types';

function heading(level: number, text: string): string
{
	return '#'.repeat(level) + ' ' + text;
}

function criteriaSection(title: string, criteria: Array<Criterion>): Array<string>
{
	if (criteria.length === 0)
	{
		return [];
	}

	const conditionsTitle = Loc.getMessage('CRM_AI_REPORT_DRAWER_FAILED_CRITERIA_CONDITIONS_TITLE') ?? '';
	const parts = [heading(2, title)];

	criteria.forEach((criterion: Criterion) => {
		const criterionTitle = criterion.title?.trim() ?? '';
		if (criterionTitle === '')
		{
			return;
		}

		parts.push(heading(3, criterionTitle));

		const summary = criterion.summary?.trim() ?? '';
		if (summary !== '')
		{
			parts.push(summary);
		}

		// `summary` falls back to `description` on the backend when the AI left no comment —
		// in that case the conditions would repeat the verdict word for word.
		const description = criterion.description?.trim() ?? '';
		if (description !== '' && description !== summary && conditionsTitle !== '')
		{
			parts.push(`**${conditionsTitle}:** ${description}`);
		}
	});

	return parts;
}

export function buildAssessmentMarkdown(assessmentBlockData: AssessmentBlockData): string
{
	const blocks = [];

	const title = Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_COPY_TITLE') ?? '';
	if (title !== '')
	{
		blocks.push(heading(1, title));
	}

	const summaryList = [];

	const scriptName = assessmentBlockData.scriptName?.trim() ?? '';
	if (scriptName !== '')
	{
		const scriptLine = Loc.getMessage(
			'CRM_AI_REPORT_DRAWER_ASSESSMENT_COPY_SCRIPT',
			{ '#SCRIPT_NAME#': scriptName },
		)?.trim() ?? '';

		if (scriptLine !== '')
		{
			summaryList.push(`- ${scriptLine}`);
		}
	}

	if (Type.isNumber(assessmentBlockData.callScore))
	{
		const scoreLine = Loc.getMessage(
			'CRM_AI_REPORT_DRAWER_ASSESSMENT_COPY_SCORE',
			{ '#SCORE#': String(Math.round(assessmentBlockData.callScore)) },
		)?.trim() ?? '';

		if (scoreLine !== '')
		{
			summaryList.push(`- ${scoreLine}`);
		}
	}

	if (summaryList.length > 0)
	{
		blocks.push(summaryList.join('\n'));
	}

	const recommendation = assessmentBlockData.recommendation?.trim() ?? '';
	const recommendationTitle = Loc.getMessage('CRM_AI_REPORT_DRAWER_ASSESSMENT_COPY_RECOMMENDATION') ?? '';
	if (recommendation !== '' && recommendationTitle !== '')
	{
		blocks.push(heading(2, recommendationTitle), recommendation);
	}

	const groups = [
		{
			code: 'CRM_AI_REPORT_DRAWER_ASSESSMENT_COPY_FAILED_CRITERIA_TITLE',
			criteria: assessmentBlockData.failedCriteria ?? [],
		},
		{
			code: 'CRM_AI_REPORT_DRAWER_ASSESSMENT_SUCCESS_CRITERIA_TITLE',
			criteria: assessmentBlockData.successCriteria ?? [],
		},
		{
			code: 'CRM_AI_REPORT_DRAWER_ASSESSMENT_UNUSED_CRITERIA_TITLE',
			criteria: assessmentBlockData.unusedCriteria ?? [],
		},
	];

	groups.forEach((group) => {
		const groupTitle = Loc.getMessage(group.code, { '#COUNT#': String(group.criteria.length) })?.trim() ?? '';
		if (groupTitle === '')
		{
			return;
		}

		blocks.push(...criteriaSection(groupTitle, group.criteria));
	});

	return blocks.join('\n\n');
}
