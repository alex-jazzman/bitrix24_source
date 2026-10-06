import { Type } from 'main.core';

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

export function prepareCallAssessment(callAssessment: Object): Object
{
	return {
		id: correctCallAssessmentIdOrNull(callAssessment?.id),
		title: correctStringOrNull(callAssessment?.title),
		prompt: correctStringOrNull(callAssessment?.prompt),
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
