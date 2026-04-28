import { Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import type { EntityField, FileHeader, PreviewTable } from '../response/configure-import-settings-response';
import { FieldBindings } from './field-bindings';

export type RequisiteDuplicateControlTarget = {
	countryId: number,
	countryCaption: string,
	fields: {
		fieldId: string,
		fieldCaption: string,
	}[],
};

export class ImportSettings
{
	#values: Object = {};
	#fieldBindings: ?FieldBindings = null;

	#entityFields: EntityField[] = [];
	#fileHeaders: FileHeader[] = [];
	#previewTable: PreviewTable = null;
	#filesize: ?number = null;
	#requiredFieldIds: string[] = [];

	#requisiteDuplicateControlTargets: RequisiteDuplicateControlTarget[] = [];

	#eventEmitter: EventEmitter;

	constructor(options: Object)
	{
		this.#eventEmitter = new EventEmitter(this, 'BX.Item.Crm.Import');
		this.#values = options;

		if (Type.isPlainObject(options.fieldBindings))
		{
			this.#fieldBindings = new FieldBindings(options.fieldBindings);
		}
	}

	set(fieldName: string, value: any): Options
	{
		const oldValue = this.#values[fieldName];
		this.#values[fieldName] = value;

		this.#eventEmitter.emit(`crm:import-settings:on-value-changed:${fieldName}`, new BaseEvent({
			data: {
				oldValue,
				newValue: value,
			},
		}));

		return this;
	}

	get(fieldName: string): any
	{
		return this.#values[fieldName] ?? null;
	}

	subscribeValueChanged(fieldName: string, handler: Function<BaseEvent>): void
	{
		this.#eventEmitter.subscribe(`crm:import-settings:on-value-changed:${fieldName}`, handler);
	}

	unsubscribeValueChanged(fieldName: string, handler: Function<BaseEvent>): void
	{
		this.#eventEmitter.unsubscribe(`crm:import-settings:on-value-changed:${fieldName}`, handler);
	}

	setFieldBindings(fieldBindings: FieldBindings): ImportSettings
	{
		this.#fieldBindings = fieldBindings;

		return this;
	}

	getFieldBindings(): FieldBindings
	{
		return this.#fieldBindings;
	}

	setPreviewTable(previewTable: PreviewTable): ImportSettings
	{
		this.#previewTable = previewTable;

		return this;
	}

	getPreviewTable(): ?PreviewTable
	{
		return this.#previewTable;
	}

	setEntityFields(entityFields: EntityField[]): ImportSettings
	{
		this.#entityFields = entityFields;

		return this;
	}

	getEntityFields(): EntityField[]
	{
		return this.#entityFields;
	}

	setFileHeaders(fileHeaders: FileHeader[]): ImportSettings
	{
		this.#fileHeaders = fileHeaders;

		return this;
	}

	getFileHeaders(): FileHeader[]
	{
		return this.#fileHeaders;
	}

	setFilesize(filesize: number): ImportSettings
	{
		this.#filesize = filesize;

		return this;
	}

	getFilesize(): number
	{
		return this.#filesize;
	}

	setRequiredFieldIds(fieldIds: string[]): ImportSettings
	{
		this.#requiredFieldIds = fieldIds;

		return this;
	}

	getRequiredFieldIds(): string[]
	{
		return this.#requiredFieldIds;
	}

	setRequisiteDuplicateControlTargets(
		requisiteDuplicateControlTargets: RequisiteDuplicateControlTarget[],
	): ImportSettings
	{
		this.#requisiteDuplicateControlTargets = requisiteDuplicateControlTargets;

		return this;
	}

	getRequisiteDuplicateControlTargets(): RequisiteDuplicateControlTarget[]
	{
		return this.#requisiteDuplicateControlTargets;
	}

	json(): Object
	{
		const json = this.#values;

		if (this.#fieldBindings)
		{
			json.fieldBindings = this.#fieldBindings.json();
		}

		return json;
	}
}
