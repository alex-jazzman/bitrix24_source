import { Text, Type } from 'main.core';
import 'ui.entity-editor';

type UserField = {
	getFieldType(): string;
	isMultiple(): boolean;
};

type ValidationResult = {
	addError(error: unknown): void;
};

type ValidationPromise = PromiseLike<void> & {
	fulfill(): void;
};

type LegacyUserFieldManager = {
	_activeFields: Record<string, UserField>;
	_validationEnabled: boolean;
	_validationResult: ValidationResult | null;
	_validationPromise: ValidationPromise | null;
	initialize(id: string, settings: Record<string, unknown>): void;
	registerActiveField(field: UserField): void;
	unregisterActiveField(field: UserField): void;
	setValidationEnabled(enabled: boolean): void;
	validate(result: ValidationResult): ValidationPromise;
	onValidationComplete(errors: unknown): void;
};

type ValidationCallback = (this: unknown, errors: unknown, ...args: unknown[]) => unknown;
type ValidationRequest = { FIELDS?: unknown };
type UserFieldTransport = {
	query(mode: string, param: ValidationRequest, callback: ValidationCallback): unknown;
	validate(names: string[], callback: ValidationCallback): unknown;
};

type FieldMetadata = Readonly<{ type: string; multiple: boolean }>;
type Metadata = Readonly<Record<string, FieldMetadata>>;
type SubmittedValue = string | readonly string[] | undefined;
type SubmittedValues = Readonly<Record<string, SubmittedValue>>;

declare const BX: {
	UI: {
		EntityUserFieldManager: {
			new(): LegacyUserFieldManager;
			items: Record<string, LegacyUserFieldManager>;
		};
	};
	Main: { UF: { EditManager: UserFieldTransport } };
	Promise: new() => ValidationPromise;
};

export class DateValidationUserFieldManager extends BX.UI.EntityUserFieldManager
{
	static create(id: string, settings: Record<string, unknown>): DateValidationUserFieldManager
	{
		const manager = new DateValidationUserFieldManager();
		manager.initialize(id, settings);
		BX.UI.EntityUserFieldManager.items[id] = manager;

		return manager;
	}

	// Keep the inherited UI manager state contract.
	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	validate(result: ValidationResult): ValidationPromise
	{
		const names = Object.keys(this._activeFields);
		if (!this._validationEnabled || names.length === 0)
		{
			return super.validate(result);
		}

		const metadata: Record<string, FieldMetadata> = Object.create(null);
		for (const name of names)
		{
			const field = this._activeFields[name];
			metadata[name] = Object.freeze({ type: field.getFieldType(), multiple: field.isMultiple() });
		}

		const receiver = DateValidationUserFieldManager.#createReceiver(Object.freeze(metadata));
		this._validationResult = result;
		BX.Main.UF.EditManager.validate.call(receiver, names, this.onValidationComplete.bind(this));
		this._validationPromise = new BX.Promise();

		return this._validationPromise;
	}
	/* eslint-enable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	static #createReceiver(metadata: Metadata): UserFieldTransport
	{
		const original = BX.Main.UF.EditManager;
		const receiver: UserFieldTransport = Object.create(original);
		receiver.query = function(this: UserFieldTransport, mode, param, callback): unknown {
			const values = DateValidationUserFieldManager.#snapshotValues(param.FIELDS);

			return original.query.call(this, mode, param, function(this: unknown, errors, ...args): unknown {
				return callback.call(
					this,
					DateValidationUserFieldManager.#normalizeErrors(errors, metadata, values),
					...args,
				);
			});
		};

		return receiver;
	}

	static #snapshotValues(fields: unknown): SubmittedValues
	{
		const values: Record<string, SubmittedValue> = Object.create(null);
		if (!Type.isArray(fields))
		{
			return Object.freeze(values);
		}

		for (const field of fields)
		{
			if (!Type.isPlainObject(field) || !Type.isString(field.FIELD))
			{
				continue;
			}

			const value = field.VALUE;
			values[field.FIELD] = undefined;
			if (Type.isString(value))
			{
				values[field.FIELD] = value;
			}
			else if (Type.isArray(value))
			{
				const copy = [...value];
				if (copy.every((entry) => Type.isString(entry)))
				{
					values[field.FIELD] = Object.freeze(copy);
				}
			}
		}

		return Object.freeze(values);
	}

	static #normalizeErrors(errors: unknown, metadata: Metadata, values: SubmittedValues): unknown
	{
		if (!Type.isPlainObject(errors) && !Type.isArray(errors))
		{
			return errors;
		}

		const normalized = (Type.isArray(errors) ? [...errors] : {}) as Record<string, unknown>;
		for (const [name, message] of Object.entries(errors))
		{
			Object.defineProperty(normalized, name, {
				value: message,
				enumerable: true,
				configurable: true,
				writable: true,
			});

			const field = metadata[name];
			if (!Type.isString(message) || field?.type !== 'date')
			{
				continue;
			}

			const value = values[name];
			const isFilledSingle = field.multiple === false && Type.isStringFilled(value);
			const isFilledMultiple = field.multiple === true
				&& Type.isArray<string>(value)
				&& value.some((entry) => entry !== '')
			;
			if (isFilledSingle || isFilledMultiple)
			{
				normalized[name] = Text.decode(message);
			}
		}

		return normalized;
	}
}
