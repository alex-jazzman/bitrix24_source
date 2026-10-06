import {Dom, Event, Loc, Tag, Text, Type} from 'main.core';
import {type Property, type RenderedControl, type RenderFieldParams, type RenderModeValue} from '../../const/type';
import {RenderMode} from '../../const/const';
import {getControlName, isMultiple, isReadOnly, isRequired, isSelectable, toBool} from '../../lib/property/property';
import {filterInput, type InputSanitizer} from '../../lib/input-filter/input-filter';
import {
	buildTimezoneSelect,
	findTimezoneByOffset,
	readTimezones,
	splitOffsetValue,
	type OffsetValue,
	type Timezone,
	type TimezoneMatch,
} from '../../lib/timezone/timezone';
import {FieldLayout, initFieldHints} from '../field-layout/field-layout';
import {
	applySelectionDecorator,
	canApplySelectionDecorator,
	type SelectionContext,
	type SelectionProvider,
} from '../selection/selection';
import {NullSelectionProvider} from '../selection/null-selection-provider';
import {buildTextControl, type TextControl, type TextControlOptions} from './text-control';

/**
 * Choosing the selection provider belongs to the application layer: the domain must not
 * reach for the automation extension. A field left without one inserts nothing.
 */
export type BaseFieldParams = RenderFieldParams & {
	selectionProvider?: SelectionProvider,
};

/**
 * What a date type declares about the zone select next to its control: the name, the test id
 * and the disabled state come from the field itself.
 */
export type TimezoneSelectOptions = {
	timezones: Timezone[],
	selected: Timezone | undefined,
	ariaLabel: string,
};

export abstract class BaseField
{
	static #instanceCounter: number = 0;

	#property: Property;
	readonly #fieldName: string;
	readonly #renderMode: RenderModeValue;
	readonly #showLabels: boolean;
	readonly #showDescriptions: boolean;
	readonly #documentType: string[] | undefined;
	readonly #selectionProvider: SelectionProvider;
	#value: string | string[] | null;
	#valueNodes: HTMLElement[] = [];
	/**
	 * The announced node of every row of a core-driven multiple, in row order - the list the
	 * row names are numbered from (see #nameRows). Positions match #valueNodes: both are
	 * appended to as a row is built and dropped from together when a row goes.
	 */
	#rowNameNodes: HTMLElement[] = [];
	#valueNodeByRoot: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
	#captionRendered: boolean = false;
	/** Node of the last render, the one a change is announced from - see emitChange(). */
	#rootNode: HTMLElement | null = null;

	readonly #controlId: string;

	readonly #captionId: string;

	constructor(params: BaseFieldParams)
	{
		this.#property = params.property;
		this.#fieldName = params.fieldName;
		this.#value = params.value ?? null;
		this.#selectionProvider = params.selectionProvider ?? new NullSelectionProvider();
		this.#renderMode = params.renderMode ?? RenderMode.NewDesigner;
		this.#showLabels = params.showLabels ?? true;
		this.#showDescriptions = params.showDescriptions ?? true;
		this.#documentType = params.documentType;
		const instanceIndex = ++BaseField.#instanceCounter;
		this.#controlId = `bizproc-field-ctrl-${params.fieldName.replace(/[^a-zA-Z0-9_-]/g, '-')}-${instanceIndex}`;
		this.#captionId = `${this.#controlId}-caption`;
	}

	renderControl(value: string | string[] | null): RenderedControl
	{
		const type = Text.encode(this.#property.Type);
		const name = Text.encode(this.getControlName());
		const placeholder = Text.encode(this.getPlaceholder());

		const fieldTestId = Text.encode(`bizproc-field-control-${this.#fieldName}`);

		const node = Tag.render`
			<input
				type="text"
				class="bizproc-type-control"
				name="${name}"
				title="${type}"
				disabled="disabled"
				placeholder="${placeholder}"
				data-role="${this.isSelectable() ? 'inline-selector-target' : ''}"
				data-testid="${fieldTestId}"
			/>
		`;

		return {root: node, valueNode: node};
	}

	/**
	 * Lower bound a type declares: "whatever the property says, I render a group of
	 * controls". The core raises it with its own rule "a multiple field is always a
	 * group", so a simple type declares nothing.
	 */
	rendersGroup(): boolean
	{
		return false;
	}

	/**
	 * Which controls of a type-rendered group carry its requirement, `root` being the assembled
	 * field node. ARIA 1.2 allows `aria-required` on a control, never on the group around it
	 * (nor on the plain wrapper the core builds with the labels hidden), so the flag goes on
	 * the controls themselves and only the type knows which of its nodes those are.
	 * A type that leaves multiplicity to the core is never asked: there every row is announced
	 * on its own.
	 */
	protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[]
	{
		return [];
	}

	render(): HTMLElement
	{
		// The nodes of the previous render are about to be dropped, so whatever a type holds
		// beyond them is let go first - here rather than in every type's own render().
		this.release();

		this.#valueNodes = [];
		this.#rowNameNodes = [];
		this.#valueNodeByRoot = new WeakMap();

		const captionNode = this.#showLabels && this.#showDescriptions
			? FieldLayout.renderCaption(this.#property, this.#captionId)
			: null;
		this.#captionRendered = !Type.isNull(captionNode);

		const multiple = isMultiple(this.#property);
		const rendersOwnGroup = this.rendersGroup();
		const isGroup = rendersOwnGroup || multiple;

		let controlNode: HTMLElement;
		let nameTarget: HTMLElement | null = null;

		// A type that declares itself a group renders every control it owns, the multiple
		// case included (select is one list control in both modes), so the core's row
		// machinery applies only to types that leave multiplicity to the core.
		if (multiple && !rendersOwnGroup)
		{
			const values = this.#toValueList(this.#value);
			const seed = values.length > 0 ? values : [null];
			// Every row of a core-driven multiple announces itself as a field of its own, so
			// the ARIA goes on each row rather than on the wrapper above them (see onAddClick
			// in wrapMultiple, which does the same for a row added later). It goes on the named
			// node of the row for the same reason as in the single case below: for bool the
			// value node is a hidden input, which is not in the accessibility tree at all.
			const roots = seed.map((presetValue) => {
				const control = this.#buildControl(presetValue);
				this.#applyRowAria(control);

				return control.root;
			});

			controlNode = this.wrapMultiple(roots);
			this.#nameRows();
		}
		else
		{
			const control = this.#buildControl(this.#value);
			controlNode = control.root;
			nameTarget = control.namedNode ?? control.valueNode;
		}

		// The named node is what the <label> points at and what the screen reader announces,
		// so the ARIA of a single field goes there too - for bool that is the visible switcher
		// rather than the hidden input holding the value.
		if (!isGroup && !Type.isNull(nameTarget))
		{
			Dom.attr(nameTarget, 'id', this.#controlId);
			this.#applyAria(nameTarget);
		}

		const nameBlockNode = this.#showLabels
			? FieldLayout.renderNameBlock({
				property: this.#property,
				isGroup,
				showDescription: this.#showDescriptions,
				controlId: this.#controlId,
			})
			: null;

		const assembled = FieldLayout.assemble({
			nameBlockNode,
			captionNode,
			controlNode,
			showLabels: this.#showLabels,
			isGroup,
		});

		// A type that renders its own group (select) exposes no single node to carry the ARIA of
		// the group, so it is split: the description goes on the group node, the requirement on
		// the controls the type names. Not applied to a core-driven multiple - there each row
		// already carries its own.
		if (rendersOwnGroup)
		{
			this.#applyGroupAria(assembled);
		}

		initFieldHints(assembled);

		// Dom.attr wraps setAttribute (a DOM API, not an HTML sink), so the value goes in raw.
		Dom.attr(assembled, 'data-testid', `bizproc-field-${this.#fieldName}`);

		this.#rootNode = assembled;

		return assembled;
	}

	/**
	 * Announces that the value changed where no native event says so: a switch toggled, a moment
	 * picked in a calendar, an expression inserted, a row of a multiple added or removed. A
	 * consumer listening for `change` on the container above the field then hears those the same
	 * way it hears a typed-in one, instead of silently keeping a stale value.
	 *
	 * Never called from setValue()/applyValue(): a programmatic write belongs to the caller, and
	 * echoing it back would loop against a consumer that writes on every change it hears.
	 *
	 * Dispatched natively because main.core binds and unbinds listeners but exposes no dispatch,
	 * and qualified through globalThis because `Event` here is the main.core helper.
	 */
	protected emitChange(): void
	{
		if (Type.isNull(this.#rootNode))
		{
			return;
		}

		this.#rootNode.dispatchEvent(new globalThis.Event('change', {bubbles: true}));
	}

	/**
	 * Where a type lets go of what outlives its node: a popup registered in PopupManager, a
	 * subscription, a timer. Called before the node is dropped - by the manager when the field
	 * is released, by render() before it draws the next one. The core owns nothing of the kind,
	 * so the base releases nothing.
	 */
	protected release(): void
	{
	}

	getValue(): string | string[]
	{
		if (this.isMultiple())
		{
			return this.#valueNodes
				.map((node) => (node as HTMLInputElement).value ?? '')
				.filter((item) => item !== '');
		}

		const node = this.#valueNodes[0];

		if (Type.isUndefined(node))
		{
			return '';
		}

		return (node as HTMLInputElement).value ?? '';
	}

	setValue(value: string | string[]): void
	{
		this.#value = value;
		this.applyValue(value);
	}

	isMultiple(): boolean
	{
		return isMultiple(this.#property);
	}

	isSelectable(): boolean
	{
		return isSelectable(this.#property);
	}

	isRequired(): boolean
	{
		return isRequired(this.#property);
	}

	getControlName(): string
	{
		return getControlName(this.#fieldName, this.#property);
	}

	getRenderMode(): RenderModeValue
	{
		return this.#renderMode;
	}

	getProperty(): Property
	{
		return this.#property;
	}

	/**
	 * Replaces the property wholesale: merging a partial change belongs to the caller,
	 * otherwise the core would own a second model of what a field property is.
	 * The markup rendered so far still reflects the previous property - the caller
	 * re-renders (see FieldManager.applyProperty).
	 */
	setProperty(property: Property): void
	{
		this.#property = property;
	}

	getFieldName(): string
	{
		return this.#fieldName;
	}

	/**
	 * One rule for every type: the property wins, the type's own default fills the gap.
	 * A type overrides getDefaultPlaceholder(), not this.
	 */
	getPlaceholder(): string
	{
		const placeholder = this.#property.Placeholder;
		const own = Type.isUndefined(placeholder) ? '' : String(placeholder);

		return own === '' ? this.getDefaultPlaceholder() : own;
	}

	/**
	 * The `...` insert button, identical across every type: one markup, one class, one phrase.
	 * The fallback button of a field whose insertion no provider takes over - where one does,
	 * the button comes with the provider's markup and this one must not be drawn on top of it
	 * (see decoratesSelection). Shown by renderTextControl(); a type that keeps the button
	 * elsewhere in its markup (select) places it itself.
	 */
	protected renderInsertButton(): HTMLElement
	{
		const button: HTMLElement = Tag.render`
			<button
				type="button"
				class="bizproc-fields-insert"
				aria-label="${Text.encode(Loc.getMessage('BIZPROC_FIELDS_INSERT_VALUE') ?? '')}"
				data-testid="${Text.encode(`bizproc-field-insert-${this.#fieldName}`)}"
			>
				<div class="ui-icon-set --more-l" aria-hidden="true"></div>
			</button>
		`;

		return button;
	}

	getSelectionContext(): SelectionContext
	{
		if (!Type.isUndefined(this.#documentType))
		{
			return { documentType: this.#documentType };
		}

		return {};
	}

	isReadOnly(): boolean
	{
		return isReadOnly(this.#property);
	}

	protected wrapMultiple(controls: HTMLElement[]): HTMLElement
	{
		const readOnly = this.isReadOnly();
		const fieldName = this.getFieldName();
		const removeLabel = Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_REMOVE') ?? '';
		const addLabel = Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ADD') ?? '';

		const onRemove = (control: HTMLElement): void =>
		{
			this.#forgetRow(this.#valueNodeByRoot.get(control));
			// Dropping a row drops its value from getValue(), and no native event says so.
			this.emitChange();
		};

		const onAddClick = (wrapper: HTMLElement): void =>
		{
			const control = this.#buildControl(null);
			this.#applyRowAria(control);
			this.#nameRows();
			const row = FieldLayout.buildMultipleRow(control.root, {readOnly, onRemove, removeLabel, fieldName});

			const addButton = wrapper.querySelector<HTMLElement>('.bizproc-fields-multiple__add');
			if (Type.isNull(addButton))
			{
				Dom.append(row, wrapper);
			}
			else
			{
				Dom.insertBefore(row, addButton);
			}

			// A new row is a new slot in getValue(), and no native event says so.
			this.emitChange();
		};

		return FieldLayout.wrapMultiple(controls, {readOnly, onAddClick, onRemove, removeLabel, addLabel, fieldName});
	}

	protected renderSelectionControl(control: RenderedControl): RenderedControl
	{
		if (!this.decoratesSelection())
		{
			return control;
		}

		return applySelectionDecorator(
			control,
			this.#property,
			this.#selectionProvider,
			this.getSelectionContext(),
		);
	}

	/**
	 * Whether the selection provider will take value insertion over for this field, and with
	 * it the `...` button. Every gate is a property of the field, not of its markup, so the
	 * answer holds before renderControl() runs - which is what lets a type decide there
	 * whether to draw its own button (see renderInsertButton).
	 *
	 * Public mode is where a field inserts nothing unless the property asks for it: that mode
	 * is the live document, not the designer. The flag arrives in legacy shapes as well, hence
	 * the same normalizer isSelectable() reads it through - only the default is stricter here.
	 */
	decoratesSelection(): boolean
	{
		if (this.#renderMode === RenderMode.Public && !toBool(this.#property.AllowSelection))
		{
			return false;
		}

		if (this.isReadOnly())
		{
			return false;
		}

		return canApplySelectionDecorator(this.#property, this.#selectionProvider);
	}

	/**
	 * Value nodes of the current render, in render order. Removing a multiple row
	 * drops its node from the list, so a subclass never has to filter detached nodes.
	 */
	protected getValueNodes(): HTMLElement[]
	{
		return [...this.#valueNodes];
	}

	/**
	 * Whether a scalar handed to a multiple field is read as a comma-separated list of values.
	 * True for a type whose value cannot hold a comma; a type that takes a comma inside one
	 * value (double reads it as the decimal separator) answers false, and the scalar reaches
	 * such a field as a single value instead of falling apart into digits around the comma.
	 */
	protected splitsScalarValue(): boolean
	{
		return true;
	}

	/**
	 * Writes the value into the rendered controls. Split off setValue() so a type whose
	 * value does not live in a node's `.value` (a switch, a checked radio) overrides only
	 * the writing and still lets the core keep the value it will re-render from.
	 */
	protected applyValue(value: string | string[]): void
	{
		if (this.isMultiple())
		{
			const values = this.#toValueList(value);
			this.#valueNodes.forEach((node, index) =>
			{
				(node as HTMLInputElement).value = values[index] ?? '';
			});

			return;
		}

		const node = this.#valueNodes[0];

		if (!Type.isUndefined(node))
		{
			(node as HTMLInputElement).value = Type.isArray<string>(value) ? value.join(',') : value;
		}
	}

	/**
	 * The placeholder a type shows when the property carries none. A legitimate point of
	 * difference: four simple types answer with a localised phrase, the dates with a format
	 * mask. A type that has nothing to show keeps the base answer.
	 */
	protected getDefaultPlaceholder(): string
	{
		return '';
	}

	/**
	 * Renders the control every text-shaped type shares: a bordered row holding one input as
	 * the value node, read-only mode, and the insert button when selection is allowed. A type
	 * passes only what it differs by; the rest comes from the field itself.
	 */
	protected renderTextControl(options: TextControlOptions): TextControl
	{
		const readOnly = this.isReadOnly();
		const selectable = this.isSelectable();
		// Where the provider decorates the control it brings its own button into the same row,
		// so the field's own one would be the second `...` of the field.
		const ownInsertButton = selectable && !readOnly && !this.decoratesSelection();

		return buildTextControl({
			...options,
			fieldName: this.#fieldName,
			name: this.getControlName(),
			placeholder: this.getPlaceholder(),
			readOnly,
			selectable,
			insertButton: ownInsertButton ? this.renderInsertButton() : null,
		});
	}

	/**
	 * Keeps typed-in text within what the type accepts, caret included.
	 *
	 * The listener sits on the row and resolves the input at event time instead of capturing it:
	 * the selection decorator replaces the value node with a clone, and cloneNode drops listeners,
	 * so a listener bound to the node itself would die together with the original.
	 *
	 * Bound to the interactive `input` event only, which is what keeps the value model tolerant of
	 * strings: setValue() writes `.value` without dispatching `input`, so a programmatic value
	 * (a macro string like `{{Document:PROPERTY}}`) passes through unfiltered.
	 */
	protected bindInputFilter(root: HTMLElement, inputSelector: string, sanitize: InputSanitizer): void
	{
		if (this.isReadOnly())
		{
			return;
		}

		Event.bind(root, 'input', (event) => {
			const input = Type.isElementNode(event.target)
				? event.target.closest<HTMLInputElement>(inputSelector)
				: null;

			if (!Type.isNull(input))
			{
				this.#applyInputFilter(input, sanitize);
			}
		});
	}

	/**
	 * Takes a stored date apart into the value a control shows and the offset its zone select
	 * holds. The two dates share the format, so they share the one reading of it.
	 */
	protected splitOffset(value: string): OffsetValue
	{
		return splitOffsetValue(value);
	}

	/**
	 * Zones the field offers, from its own property or from the settings of the extension named
	 * here. The id stays with the type: date and datetime are configured separately.
	 */
	protected getTimezones(extensionId: string): Timezone[]
	{
		return readTimezones(this.#property.Settings, extensionId);
	}

	protected findTimezone(timezones: Timezone[], offset: string | null, match?: TimezoneMatch): Timezone | undefined
	{
		return findTimezoneByOffset(timezones, offset, match);
	}

	/**
	 * Renders the zone select a date type places next to its control, or nothing when the field
	 * offers no zones. Meant for `rowNodes` of renderTextControl(), which drops a null node.
	 */
	protected renderTimezoneSelect(options: TimezoneSelectOptions): HTMLElement | null
	{
		return buildTimezoneSelect({
			...options,
			name: this.getControlName(),
			testId: `bizproc-field-timezone-${this.#fieldName}`,
			disabled: this.isReadOnly(),
		});
	}

	protected getControlId(): string
	{
		return this.#controlId;
	}

	protected getCaptionId(): string
	{
		return this.#captionId;
	}

	protected showsLabels(): boolean
	{
		return this.#showLabels;
	}

	protected showsDescriptions(): boolean
	{
		return this.#showDescriptions;
	}

	/**
	 * The values a multiple field spreads over its rows, from whatever shape the caller handed in:
	 * a list stays as it is, a scalar is read through splitsScalarValue().
	 */
	#toValueList(value: string | string[] | null): string[]
	{
		if (Type.isArray<string>(value))
		{
			return value;
		}

		if (!Type.isStringFilled(value))
		{
			return [];
		}

		return this.splitsScalarValue() ? value.split(',') : [value];
	}

	#buildControl(value: string | string[] | null): RenderedControl
	{
		const control = this.renderSelectionControl(this.renderControl(value));

		this.#valueNodes.push(control.valueNode);
		this.#valueNodeByRoot.set(control.root, control.valueNode);

		return control;
	}

	#applyInputFilter(input: HTMLInputElement, sanitize: InputSanitizer): void
	{
		const filtered = filterInput(input.value, input.selectionStart ?? input.value.length, sanitize);

		if (Type.isNull(filtered))
		{
			return;
		}

		input.value = filtered.value;
		input.setSelectionRange(filtered.caret, filtered.caret);
	}

	/**
	 * Wires the ARIA of one announced unit onto the node render() picked for it: the named node
	 * of a single field, each row of a core-driven multiple. Where that node sits is the core's
	 * decision alone - a type never compensates for it.
	 */
	#applyAria(target: HTMLElement): void
	{
		if (isRequired(this.#property))
		{
			Dom.attr(target, 'aria-required', 'true');
		}

		if (this.#captionRendered)
		{
			Dom.attr(target, 'aria-describedby', this.#captionId);
		}
	}

	/**
	 * The same wiring for a type that renders its own group, split in two because the group node
	 * cannot carry both: the description belongs to the group the <legend> names, the requirement
	 * only to a control (see getGroupRequiredNodes).
	 */
	#applyGroupAria(groupNode: HTMLElement): void
	{
		this.#nameGroup(groupNode);

		if (this.#captionRendered)
		{
			Dom.attr(groupNode, 'aria-describedby', this.#captionId);
		}

		if (!isRequired(this.#property))
		{
			return;
		}

		this.getGroupRequiredNodes(groupNode).forEach((node) => {
			Dom.attr(node, 'aria-required', 'true');
		});
	}

	/**
	 * A group nothing names needs a name of its own, and that happens three ways: with the labels
	 * hidden no <fieldset> is built at all, a property with no name leaves the <fieldset> without
	 * a <legend>, and a nameless property that does carry a description gets a <legend> built for
	 * the hint alone - text-free, so it names nothing either. Any of the three has a screen reader
	 * announce the options without ever saying which field the list belongs to. The role is added
	 * only where the node groups nothing by itself - a <fieldset> already does. It is the generic
	 * one: the core tells no radios from checkboxes, and a radiogroup could only come from the
	 * type, which does not compensate for the core's accessibility decisions.
	 */
	#nameGroup(groupNode: HTMLElement): void
	{
		if (this.#isNamedByLegend(groupNode))
		{
			return;
		}

		if (groupNode.tagName !== 'FIELDSET')
		{
			Dom.attr(groupNode, 'role', 'group');
		}

		Dom.attr(groupNode, 'aria-label', this.#accessibleName());
	}

	/**
	 * Whether the <legend> of the group says the name out loud. Read off the rendered text rather
	 * than off Property.Name, because the fallback exists to keep the name from being duplicated
	 * by an aria-label - and duplication is only possible where the name is actually on screen.
	 */
	#isNamedByLegend(groupNode: HTMLElement): boolean
	{
		const legend = groupNode.querySelector(':scope > legend');

		return !Type.isNull(legend) && Type.isStringFilled(legend.textContent?.trim());
	}

	/**
	 * What a screen reader calls this field: its own name, or the field name as a fallback. The name
	 * is trimmed for the same reason the legend predicate above trims it - a name of nothing but
	 * whitespace names the field to nobody, so it has to fall through to the field name instead of
	 * ending up in an aria-label assistive technologies throw away.
	 */
	#accessibleName(): string
	{
		const name = Type.isString(this.#property.Name) ? this.#property.Name.trim() : '';

		return Type.isStringFilled(name) ? name : this.#fieldName;
	}

	/**
	 * ARIA of one row of a core-driven multiple: the requirement and the description, plus the
	 * row's place in the list its name is numbered from.
	 */
	#applyRowAria(control: RenderedControl): void
	{
		const target = control.namedNode ?? control.valueNode;

		this.#applyAria(target);
		this.#rowNameNodes.push(target);
	}

	/**
	 * Names every row of a core-driven multiple. A row carries no label of its own - the
	 * <legend> names the whole group and a placeholder is no accessible name - so without this
	 * a screen reader announces several controls that sound exactly alike. The number is the
	 * 1-based position among the rows there are now, so removing one renumbers the rest instead
	 * of leaving a gap or a duplicate behind.
	 */
	#nameRows(): void
	{
		const name = this.#accessibleName();

		this.#rowNameNodes.forEach((node, index) => {
			// Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the
			// screen reader would read literal entities.
			const label = Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ROW_LABEL', {
				'#NAME#': name,
				'#NUMBER#': String(index + 1),
			}) ?? '';

			if (label !== '')
			{
				Dom.attr(node, 'aria-label', label);
			}
		});
	}

	#forgetRow(valueNode: HTMLElement | undefined): void
	{
		if (Type.isUndefined(valueNode))
		{
			return;
		}

		const index = this.#valueNodes.indexOf(valueNode);
		if (index === -1)
		{
			return;
		}

		this.#valueNodes.splice(index, 1);
		this.#rowNameNodes.splice(index, 1);
		this.#nameRows();
	}
}
