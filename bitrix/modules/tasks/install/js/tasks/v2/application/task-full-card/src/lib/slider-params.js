import { Type } from 'main.core';

import { TaskMappers } from 'tasks.v2.provider.service.task-service';
import { type TaskSliderData } from 'tasks.v2.provider.service.task-service';
import { type TaskModel } from 'tasks.v2.model.tasks';

type SliderParams = $Shape<TaskSliderData>;

const uriEncodedSliderParamNames = new Set([
	'TITLE',
	'MAIL_SUBJECT',
	'MAIL_FROM',
]);

export function mapSliderParamsToModel(queryParams: ?SliderParams, requestParams: ?SliderParams): TaskModel
{
	const sliderParams = {
		...(queryParams ?? {}),
		...encodeUriSliderParams(requestParams),
	};

	return TaskMappers.mapSliderDataToModel(sliderParams);
}

function encodeUriSliderParams(params: ?SliderParams): SliderParams
{
	return Object.fromEntries(
		Object.entries(params ?? {}).map(([name, value]) => [
			name,
			shouldEncodeUriSliderParam(name, value) ? encodeURIComponent(value) : value,
		]),
	);
}

function shouldEncodeUriSliderParam(name: string, value: mixed): boolean
{
	return uriEncodedSliderParamNames.has(name) && Type.isStringFilled(value);
}
