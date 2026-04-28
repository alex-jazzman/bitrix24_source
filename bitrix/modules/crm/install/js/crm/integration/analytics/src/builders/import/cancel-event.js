import { Type } from 'main.core';
import { Dictionary, getCrmMode } from 'crm.integration.analytics';
import { filterOutNilValues, getAnalyticsEntityType } from '../../helpers';
import type { ImportCancelEvent, Origin } from '../../types';

export class CancelEvent
{
	#entityType: number | string;
	#origin: ?Origin;
	#step: string;

	static createDefault(entityType: number | string): CancelEvent
	{
		const self = new CancelEvent();
		self.#entityType = entityType;

		return self;
	}

	setOrigin(origin: ?Origin): CancelEvent
	{
		this.#origin = origin;

		return this;
	}

	setStep(step: string): CancelEvent
	{
		this.#step = step;

		return this;
	}

	buildData(): ?ImportCancelEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_IMPORT,
			event: Dictionary.EVENT_IMPORT_CANCEL,
			type: getAnalyticsEntityType(this.#entityType),
			c_sub_section: this.#origin,
			p1: getCrmMode(),
			p2: this.filledStringOrNull('step', this.#step),
		});
	}

	filledStringOrNull(key: string, value: any): ?string
	{
		if (Type.isStringFilled(value))
		{
			return `${key}_${value}`;
		}

		return null;
	}
}
