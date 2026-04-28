import { Dictionary, getCrmMode } from 'crm.integration.analytics';
import type { ImportEditEvent, ImportEditEventControl, ImportEditEventStatus, Origin } from '../../types';
import { filterOutNilValues, getAnalyticsEntityType } from '../../helpers';

export class EditEvent
{
	#entityType: string | number;
	#origin: ?Origin = null;
	#control: ?ImportEditEventControl = null;
	#status: ?ImportEditEventStatus = null;
	#duplicateControl: ?string = null;

	static createDefault(entityType: string | number): EditEvent
	{
		const self = new EditEvent();
		self.#entityType = entityType;

		return self;
	}

	setOrigin(origin: ?Origin): EditEvent
	{
		this.#origin = origin;

		return this;
	}

	setIsDefaultOpened(): EditEvent
	{
		this.#control = 'import_default_opened';

		return this;
	}

	setIsImportRequisite(): EditEvent
	{
		this.#control = 'import_requisite';

		return this;
	}

	setIsDeleteButton(): EditEvent
	{
		this.#control = 'delete_button';

		return this;
	}

	setIsCreateButton(): EditEvent
	{
		this.#control = 'create_button';

		return this;
	}

	unsetControl(): EditEvent
	{
		this.#control = null;

		return this;
	}

	setStatus(status: ?ImportEditEventStatus): EditEvent
	{
		this.#status = status;

		return this;
	}

	setDuplicateControl(duplicateControl: ?string): EditEvent
	{
		this.#duplicateControl = duplicateControl?.toLowerCase();

		return this;
	}

	buildData(): ?ImportEditEvent
	{
		let p2 = null;
		if (this.#duplicateControl)
		{
			p2 = `importDuplicateControlType_${this.#duplicateControl}`;
		}

		return filterOutNilValues({
			tool: Dictionary.TOOL_CRM,
			category: Dictionary.CATEGORY_IMPORT,
			event: Dictionary.EVENT_IMPORT_EDIT,
			type: getAnalyticsEntityType(this.#entityType),
			c_sub_section: this.#origin,
			c_element: this.#control,
			status: this.#status,
			p1: getCrmMode(),
			p2,
		});
	}
}
