import { Type } from 'main.core';
import { Dictionary, getCrmMode } from 'crm.integration.analytics';
import { filterOutNilValues, getAnalyticsEntityType } from '../../helpers';
import type {
	ImportCreateEvent,
	ImportCreateEventControl,
	ImportCreateEventStatus,
	Origin,
} from '../../types';

export class CreateEvent
{
	#entityType: number | string;
	#origin: ?Origin = null;
	#importCompleteElement: ?ImportCreateEventControl = null;
	#successCount: ?number = null;
	#errorCount: ?number = null;
	#duplicateCount: ?number = null;
	#status: ?ImportCreateEventStatus = null;

	static createDefault(entityType: number | string): CreateEvent
	{
		const self = new CreateEvent();
		self.#entityType = entityType;

		return self;
	}

	setOrigin(origin: ?Origin): CreateEvent
	{
		this.#origin = origin;

		return this;
	}

	setImportCompleteButton(element: ?ImportCreateEventControl): CreateEvent
	{
		this.#importCompleteElement = element;

		return this;
	}

	setSuccessCount(successCount: ?number): CreateEvent
	{
		this.#successCount = successCount;

		return this;
	}

	setErrorCount(errorCount: ?number): CreateEvent
	{
		this.#errorCount = errorCount;

		return this;
	}

	setDuplicateCount(duplicateCount: ?number): CreateEvent
	{
		this.#duplicateCount = duplicateCount;

		return this;
	}

	setStatus(status: ?ImportCreateEventStatus): CreateEvent
	{
		this.#status = status;

		return this;
	}

	buildData(): ?ImportCreateEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_IMPORT,
			event: Dictionary.EVENT_IMPORT_CREATE,
			type: getAnalyticsEntityType(this.#entityType),
			c_sub_section: this.#origin,
			c_element: this.#importCompleteElement,
			status: this.#status,
			p1: getCrmMode(),
			p2: this.moreZeroOrNull('successCount', this.#successCount),
			p3: this.moreZeroOrNull('errorCount', this.#errorCount),
			p4: this.moreZeroOrNull('duplicateCount', this.#duplicateCount),
		});
	}

	moreZeroOrNull(key: string, value: ?number): ?string
	{
		if (Type.isNumber(value) && value > 0)
		{
			return `${key}_${value}`;
		}

		return null;
	}
}
