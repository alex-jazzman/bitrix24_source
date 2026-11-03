import { Type } from 'main.core';
import { type CallAssessment } from '../store';

const HINT_VIEW_MODE = 'hint';
const RULES_VIEW_MODE = 'rules';

export function correctCallAssessmentIdOrNull(id: any): ?number
{
	if (Type.isNumber(id) && id > 0)
	{
		return id;
	}

	return null;
}

export function correctStringOrNull(value: any): ?string
{
	if (Type.isStringFilled(value))
	{
		return value;
	}

	return null;
}

export function correctString(value: any): string
{
	return Type.isString(value) ? value : '';
}

export function correctViewModeOrNull(value: any): ?string
{
	return value === HINT_VIEW_MODE || value === RULES_VIEW_MODE ? value : null;
}

export function prepareCallAssessment(callAssessment: Object): CallAssessment
{
	const prompt = correctString(callAssessment?.prompt);
	const isHintEnabled = callAssessment?.isHintEnabled === true;

	return {
		id: correctCallAssessmentIdOrNull(callAssessment?.id),
		title: correctStringOrNull(callAssessment?.title),
		prompt,
		isHintEnabled,
		hasHint: isHintEnabled && callAssessment?.hasHint === true && Type.isStringFilled(prompt),
	};
}

export function prepareCriteria(criteria: any): Array<Object>
{
	if (!Array.isArray(criteria))
	{
		return [];
	}

	return criteria
		.map((row: any) => ({
			id: Number(row?.id),
			title: Type.isString(row?.title) ? row.title : '',
			description: Type.isString(row?.description) ? row.description : '',
			sort: Number(row?.sort) || 0,
		}))
		.sort((a, b) => a.sort - b.sort);
}
