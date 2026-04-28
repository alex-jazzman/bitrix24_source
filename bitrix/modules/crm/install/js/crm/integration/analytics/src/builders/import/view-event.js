import { Dictionary, getCrmMode } from 'crm.integration.analytics';
import { filterOutNilValues, getAnalyticsEntityType } from '../../helpers';
import {
	type ImportViewEvent,
	type Origin,
} from '../../types';

export class ViewEvent
{
	#entityType: string | number;
	#origin: ?Origin = null;
	#isMigration: boolean = false;

	static createDefault(entityType: string | number): ViewEvent
	{
		const self = new ViewEvent();
		self.#entityType = entityType;

		return self;
	}

	setOrigin(origin: ?Origin): ViewEvent
	{
		this.#origin = origin;

		return this;
	}

	setIsMigration(isMigration: boolean): ViewEvent
	{
		this.#isMigration = isMigration;

		return this;
	}

	buildData(): ?ImportViewEvent
	{
		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_IMPORT,
			event: Dictionary.EVENT_IMPORT_VIEW,
			type: getAnalyticsEntityType(this.#entityType),
			c_sub_section: this.#origin,
			c_element: this.#isMigration ? 'migration_button' : null,
			p1: getCrmMode(),
		});
	}
}
