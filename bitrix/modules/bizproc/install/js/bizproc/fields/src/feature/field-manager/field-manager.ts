import { Dom, Type } from 'main.core';
import { type BaseField } from '../../model/base-field/base-field';
import { type CreateFieldParams, FieldFactory, resolveSelectionProvider } from '../field-factory/field-factory';
import { FieldRegistry } from '../field-registry/field-registry';
import { RenderMode } from '../../const/const';
import { type ManagerOptions, type Property, type RenderedField, type RenderFieldParams } from '../../const/type';
import { isMultiple } from '../../lib/property/property';
import { applySelectionDecorator, type SelectionProvider } from '../../model/selection/selection';
import { BackendRenderer } from '../../infrastructure/service/backend-renderer/backend-renderer';

/**
 * Manager options plus the caller's say on value insertion: a provider is used as given,
 * `null` turns insertion off, an omitted field leaves the choice to autodetection. The
 * field is declared here and not in ManagerOptions because the const layer, where that
 * type lives, may not depend on the domain.
 */
export type FieldManagerOptions = ManagerOptions & {
	selectionProvider?: SelectionProvider | null,
};

export type RenderCollectionItem = {
	property: RenderFieldParams['property'],
	fieldName: string,
	value?: string | string[] | null,
};

/**
 * One rendered field in the manager's accounting. `field` is null for a type the
 * registry does not know: such a field is rendered by the backend, so there is no
 * instance to read a value from or to re-render.
 */
type FieldEntry = {
	fieldName: string,
	field: BaseField | null,
	node: HTMLElement,
};

/** The release hook of a field type, as seen from here - see releaseField(). */
type ReleasableField = {
	release: () => void,
};

export class FieldManager
{
	#options: ManagerOptions;
	#entries: Map<string, FieldEntry> = new Map();
	#fieldIdCounter: number = 0;
	#backendRenderer: BackendRenderer;
	readonly #selectionProvider: SelectionProvider;

	constructor(options: FieldManagerOptions = {})
	{
		this.#options = options;
		this.#selectionProvider = resolveSelectionProvider(options.selectionProvider);
		// Infrastructure gets both the provider and the decorator handed in: it may not
		// import the domain at runtime, so the choice stays on this side of the boundary.
		this.#backendRenderer = new BackendRenderer(options, {
			provider: this.#selectionProvider,
			applyDecorator: applySelectionDecorator,
		});
	}

	renderField(params: RenderFieldParams): RenderedField
	{
		const type = params.property.Type;
		const FieldClass = FieldRegistry.get(type);

		if (!Type.isNull(FieldClass))
		{
			// A manager option outranks the same field in the params: a form speaks for all of
			// its fields at once. The param is what the caller gets where the manager left the
			// choice open - the case of a lone control that built a manager of its own.
			const fieldParams: CreateFieldParams = {
				...params,
				renderMode: this.#options.renderMode ?? params.renderMode ?? RenderMode.NewDesigner,
				showLabels: this.#options.showLabels ?? params.showLabels ?? true,
				showDescriptions: this.#options.showDescriptions ?? params.showDescriptions ?? true,
				documentType: this.#options.documentType ?? params.documentType,
				selectionProvider: this.#selectionProvider,
			};

			const field = FieldFactory.create(type, fieldParams);
			if (!Type.isNull(field))
			{
				return this.#track(params.fieldName, field, field.render());
			}
		}

		// The same rule as above, and for the same reason: a field the registry does not know is
		// still a field of this form, and the mode it is rendered in must not depend on that.
		const placeholderNode = this.#backendRenderer.renderPlaceholder(
			params.fieldName,
			params.property,
			params.value ?? null,
			this.#options.documentType ?? params.documentType,
			this.#options.renderMode ?? params.renderMode,
		);

		return this.#track(params.fieldName, null, placeholderNode);
	}

	/**
	 * Renders every item in input order. Unregistered types leave one request per
	 * document type group: BackendRenderer collects the placeholders of this loop and
	 * flushes them together, so the guarantee holds regardless of what the caller does
	 * with the returned list.
	 */
	renderCollection(items: RenderCollectionItem[]): RenderedField[]
	{
		return items.map((item) => this.renderField({
			property: item.property,
			fieldName: item.fieldName,
			value: item.value ?? null,
		}));
	}

	/**
	 * Applies a changed property and returns the markup that replaced the previous one.
	 * Returns null for an id the manager does not know - a caller that already released
	 * the field gets no node back.
	 */
	applyProperty(fieldId: string, property: Property): HTMLElement | null
	{
		const entry = this.#entries.get(fieldId);

		if (Type.isUndefined(entry))
		{
			return null;
		}

		const field = entry.field;

		// A backend-rendered field has no instance to re-render, and another type is
		// another field: the caller releases this one and renders the new type instead.
		if (Type.isNull(field) || property.Type !== field.getProperty().Type)
		{
			return entry.node;
		}

		const carriedValue = FieldManager.#adaptValue(field.getValue(), property);

		field.setProperty(property);

		// Written back before the rebuild too: render() lays out the rows of a multiple
		// field from the value the field holds, so seeding it first is what keeps every
		// item of the snapshot. Re-applied after the rebuild to reach the fresh controls.
		field.setValue(carriedValue);
		const nextNode = field.render();
		field.setValue(carriedValue);

		Dom.replace(entry.node, nextNode);
		entry.node = nextNode;

		return nextNode;
	}

	getValue(fieldName: string): string | string[] | null
	{
		const field = this.#findFieldByName(fieldName);

		if (Type.isNull(field))
		{
			return null;
		}

		return field.getValue();
	}

	/**
	 * Value of exactly the field the id was issued for. Addressing by name reaches the first
	 * field rendered under it, which is the wrong one as soon as a form shares one manager
	 * between namesakes - a caller that kept its fieldId reads its own field through this.
	 * Null when the id is unknown or when the field came from the backend and has no instance.
	 */
	getFieldValue(fieldId: string): string | string[] | null
	{
		const entry = this.#entries.get(fieldId);

		if (Type.isUndefined(entry) || Type.isNull(entry.field))
		{
			return null;
		}

		return entry.field.getValue();
	}

	/**
	 * Writes into exactly the field the id was issued for - the counterpart of getFieldValue().
	 * Addressing by name reaches the first field rendered under it, which is the wrong one as
	 * soon as a form shares one manager between namesakes. A backend-rendered field has no
	 * instance to write into and is left as it is.
	 */
	setFieldValue(fieldId: string, value: string | string[]): void
	{
		const entry = this.#entries.get(fieldId);

		if (Type.isUndefined(entry) || Type.isNull(entry.field))
		{
			return;
		}

		entry.field.setValue(value);
	}

	getValues(): Record<string, string | string[]>
	{
		const result: Record<string, string | string[]> = {};

		this.#entries.forEach((entry) =>
		{
			if (Type.isNull(entry.field))
			{
				return;
			}

			const value = entry.field.getValue();
			const collected = result[entry.fieldName];

			// Fields sharing a name collapse the way a form submit does: `name[]` controls
			// accumulate into one list, a plain `name` keeps the last rendered value.
			result[entry.fieldName] = Type.isArray<string>(collected) && Type.isArray<string>(value)
				? [...collected, ...value]
				: value;
		});

		return result;
	}

	setValue(fieldName: string, value: string | string[]): void
	{
		const field = this.#findFieldByName(fieldName);

		if (!Type.isNull(field))
		{
			field.setValue(value);
		}
	}

	releaseField(fieldId: string): void
	{
		const entry = this.#entries.get(fieldId);

		if (Type.isUndefined(entry))
		{
			return;
		}

		if (Type.isNull(entry.field))
		{
			// What a backend-rendered field holds instead of an instance: its node is the
			// placeholder queued for render, and a field released before the queue is flushed
			// must not be requested. Only its own item goes - the neighbours keep rendering.
			this.#backendRenderer.cancelPlaceholder(entry.node);
		}
		else
		{
			// Before the node goes: a type may hold something that outlives it - a picker whose
			// popup PopupManager keeps - and removing the node alone would leak it. The hook is
			// protected on purpose (releasing a field is the manager's call, not the consumer's),
			// and the manager is no descendant of BaseField, hence the assertion.
			(entry.field as unknown as ReleasableField).release();
		}

		this.#entries.delete(fieldId);
		Dom.remove(entry.node);
	}

	destroy(): void
	{
		// Backend rendering is queued and flushed on a microtask: without this, a manager
		// destroyed before it ran still sends the request and answers into dead nodes. Only
		// the death of the manager empties the whole queue - releaseField() drops the item of
		// the one field it releases, because a manager shared between callers keeps rendering
		// for the fields that stay.
		this.#backendRenderer.cancelPending();

		[...this.#entries.keys()].forEach((fieldId) => this.releaseField(fieldId));
	}

	#track(fieldName: string, field: BaseField | null, node: HTMLElement): RenderedField
	{
		this.#fieldIdCounter += 1;
		const fieldId = `bizproc-field-${this.#fieldIdCounter}`;

		this.#entries.set(fieldId, { fieldName, field, node });

		return { fieldId, node };
	}

	/**
	 * Addressing by field name keeps working while several fields share a name: it
	 * reaches the first one rendered under that name.
	 */
	#findFieldByName(fieldName: string): BaseField | null
	{
		for (const entry of this.#entries.values())
		{
			if (entry.fieldName === fieldName && !Type.isNull(entry.field))
			{
				return entry.field;
			}
		}

		return null;
	}

	/**
	 * Carries a value across a property change: a scalar becomes a one-item list when the
	 * field turns multiple, and a list collapses to its first filled item when it stops
	 * being multiple, so the value survives the re-render in the shape the field expects.
	 */
	static #adaptValue(value: string | string[], property: Property): string | string[]
	{
		if (isMultiple(property))
		{
			if (Type.isArray<string>(value))
			{
				return value;
			}

			return Type.isStringFilled(value) ? [value] : [];
		}

		if (Type.isArray<string>(value))
		{
			return value.find((item) => Type.isStringFilled(item)) ?? '';
		}

		return value;
	}
}
