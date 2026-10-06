/* eslint-disable */
/**
 * Choosing the selection provider belongs to the application layer: the domain must not
 * reach for the automation extension. A field left without one inserts nothing.
 */
type BaseFieldParams = RenderFieldParams & {
	selectionProvider?: SelectionProvider;
};

type RenderFieldParams = {
	property: Property;
	fieldName: string;
	value?: string | string[] | null;
	renderMode?: RenderModeValue;
	showLabels?: boolean;
	showDescriptions?: boolean;
	documentType?: string[];
};

type Property = {
	Type: string;
	Name: string;
	Multiple?: boolean;
	Required?: boolean;
	AllowSelection?: boolean;
	Options?: Record<string, string>;
	Settings?: Record<string, unknown>;
	Description?: string;
	Placeholder?: string;
	ReadOnly?: boolean;
};

type RenderModeValue = typeof BX.Bizproc.Fields.RenderMode[keyof typeof BX.Bizproc.Fields.RenderMode];

interface SelectionProvider {
	isAvailable(): boolean;
	supports(property: Property): boolean;
	/**
	 * Wraps the given control node into the provider's own markup and returns the wrapper.
	 *
	 * The node handed in has to come back inside the result: either that very node, or a copy
	 * that kept its attributes. The core marks the node before the call and finds it again by
	 * that marker, because after decoration it is the copy - not the original - the field's
	 * value is read from and written to. Markup built around neither leaves the core no live
	 * node to work with; such a decoration is dropped rather than let the value drift away from
	 * what is on screen.
	 */
	decorate(controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement;
	decorateByRole(role: string, controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement;
}

type SelectionContext = {
	documentType?: string[];
	extra?: Record<string, unknown>;
};

/**
 * What a field type returns from renderControl().
 *
 * `root` is what the core inserts into the field markup, `valueNode` is what it
 * reads the value from and writes it to, `namedNode` is what it names and focuses
 * (defaults to `valueNode`). `valueNode` is `root` or lives inside it; `namedNode`,
 * when declared, lives inside `root`.
 *
 * `insertAnchor` is where value insertion attaches: the selection provider wraps that
 * node into its own markup - the `...` button included - and the wrapper takes its place.
 * A type declares it when the button belongs somewhere other than at the value node
 * (select points at the input of its insert row); left out, the value node is the anchor.
 * It lives inside `root` and must hold neither the value node nor the named node: the
 * wrapper takes the anchor's place, so anything inside the anchor leaves the document -
 * and the value node has to stay the live one, the named node to keep naming the field.
 */
type RenderedControl = {
	root: HTMLElement;
	valueNode: HTMLElement;
	namedNode?: HTMLElement;
	insertAnchor?: HTMLElement;
};

/**
 * What a type declares about its own text control: everything else (name, placeholder,
 * read-only mode, the insert button) the base field knows about itself and fills in.
 */
type TextControlOptions = {
	blockClass: string;
	value: string | string[] | null;
	/** A <textarea> instead of an <input>: the value then lives in the node content. */
	multiline?: boolean;
	inputMode?: string;
	/** The input never accepts typing, even in edit mode - a date is picked in the calendar. */
	nonEditable?: boolean;
	/** The wrapper row carries data-testid. False only for `string`, which never had one. */
	rowTestId?: boolean;
	/** Type-owned nodes of the row, placed after the control and before the insert button. */
	rowNodes?: Array<HTMLElement | null>;
};

/**
 * The rendered-control pair for a control that is one text node in a bordered row: the row is the root,
 * the input is the value node. `control` is the bordered box around the input and is not part
 * of the pair - a type that owns extra nodes inside the box (a calendar button) appends them
 * there and returns the pair as it is.
 */
type TextControl = {
	root: HTMLElement;
	control: HTMLElement;
	valueNode: HTMLElement;
};

/**
 * A rule that reduces an arbitrary string to what the type accepts. Pure: the same input
 * always yields the same output, so it can be applied twice to compute the caret.
 */
type InputSanitizer = (raw: string) => string;

/** A stored date taken apart: the part a control shows and the offset travelling next to it. */
type OffsetValue = {
	value: string;
	offset: string | null;
};

/**
 * A zone as the backend offers it: `offset` is a number of seconds, or `current` - the zone of
 * whoever is looking, which only the server can turn into a number.
 */
type Timezone = {
	value: string;
	text: string;
	offset: number | string;
};

type TimezoneMatch = {
	/**
	 * At offset 0 the explicit "server time" zone (the one with an empty value) wins over any
	 * zone that merely shares the offset. `datetime` reads a zero offset as server time;
	 * `date` has no such zone and matches by offset alone.
	 */
	preferEmptyZoneAtZeroOffset?: boolean;
};

/**
 * What a date type declares about the zone select next to its control: the name, the test id
 * and the disabled state come from the field itself.
 */
type TimezoneSelectOptions = {
	timezones: Timezone[];
	selected: Timezone | undefined;
	ariaLabel: string;
};

/**
 * Manager options plus the caller's say on value insertion: a provider is used as given,
 * `null` turns insertion off, an omitted field leaves the choice to autodetection. The
 * field is declared here and not in ManagerOptions because the const layer, where that
 * type lives, may not depend on the domain.
 */
type FieldManagerOptions = ManagerOptions & {
	selectionProvider?: SelectionProvider | null;
};

type ManagerOptions = {
	documentType?: string[];
	renderMode?: RenderModeValue;
	showLabels?: boolean;
	showDescriptions?: boolean;
};

/**
 * What the manager returns for one rendered field.
 *
 * `fieldId` is the manager's own handle on the field: it addresses the field for
 * applyProperty() and releaseField() and does not change while the field lives,
 * so it stays valid across re-renders that replace `node`.
 */
type RenderedField = {
	fieldId: string;
	node: HTMLElement;
};

type RenderCollectionItem = {
	property: RenderFieldParams['property'];
	fieldName: string;
	value?: string | string[] | null;
};

declare namespace BX.Bizproc.Fields {
	const FieldRegistry: FieldRegistryClass;

	class FieldRegistryClass {
		register(type: string, FieldClass: typeof BaseField): void;
		get(type: string): typeof BaseField | null;
		has(type: string): boolean;
		getRegisteredTypes(): string[];
		reset(): void;
	}

	abstract class BaseField {
		constructor(params: BaseFieldParams);
		renderControl(value: string | string[] | null): RenderedControl;
		/**
		 * Lower bound a type declares: "whatever the property says, I render a group of
		 * controls". The core raises it with its own rule "a multiple field is always a
		 * group", so a simple type declares nothing.
		 */
		rendersGroup(): boolean;
		/**
		 * Which controls of a type-rendered group carry its requirement, `root` being the assembled
		 * field node. ARIA 1.2 allows `aria-required` on a control, never on the group around it
		 * (nor on the plain wrapper the core builds with the labels hidden), so the flag goes on
		 * the controls themselves and only the type knows which of its nodes those are.
		 * A type that leaves multiplicity to the core is never asked: there every row is announced
		 * on its own.
		 */
		protected getGroupRequiredNodes(root: HTMLElement): HTMLElement[];
		render(): HTMLElement;
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
		protected emitChange(): void;
		/**
		 * Where a type lets go of what outlives its node: a popup registered in PopupManager, a
		 * subscription, a timer. Called before the node is dropped - by the manager when the field
		 * is released, by render() before it draws the next one. The core owns nothing of the kind,
		 * so the base releases nothing.
		 */
		protected release(): void;
		getValue(): string | string[];
		setValue(value: string | string[]): void;
		isMultiple(): boolean;
		isSelectable(): boolean;
		isRequired(): boolean;
		getControlName(): string;
		getRenderMode(): RenderModeValue;
		getProperty(): Property;
		/**
		 * Replaces the property wholesale: merging a partial change belongs to the caller,
		 * otherwise the core would own a second model of what a field property is.
		 * The markup rendered so far still reflects the previous property - the caller
		 * re-renders (see FieldManager.applyProperty).
		 */
		setProperty(property: Property): void;
		getFieldName(): string;
		/**
		 * One rule for every type: the property wins, the type's own default fills the gap.
		 * A type overrides getDefaultPlaceholder(), not this.
		 */
		getPlaceholder(): string;
		/**
		 * The `...` insert button, identical across every type: one markup, one class, one phrase.
		 * The fallback button of a field whose insertion no provider takes over - where one does,
		 * the button comes with the provider's markup and this one must not be drawn on top of it
		 * (see decoratesSelection). Shown by renderTextControl(); a type that keeps the button
		 * elsewhere in its markup (select) places it itself.
		 */
		protected renderInsertButton(): HTMLElement;
		getSelectionContext(): SelectionContext;
		isReadOnly(): boolean;
		protected wrapMultiple(controls: HTMLElement[]): HTMLElement;
		protected renderSelectionControl(control: RenderedControl): RenderedControl;
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
		decoratesSelection(): boolean;
		/**
		 * Value nodes of the current render, in render order. Removing a multiple row
		 * drops its node from the list, so a subclass never has to filter detached nodes.
		 */
		protected getValueNodes(): HTMLElement[];
		/**
		 * Whether a scalar handed to a multiple field is read as a comma-separated list of values.
		 * True for a type whose value cannot hold a comma; a type that takes a comma inside one
		 * value (double reads it as the decimal separator) answers false, and the scalar reaches
		 * such a field as a single value instead of falling apart into digits around the comma.
		 */
		protected splitsScalarValue(): boolean;
		/**
		 * Writes the value into the rendered controls. Split off setValue() so a type whose
		 * value does not live in a node's `.value` (a switch, a checked radio) overrides only
		 * the writing and still lets the core keep the value it will re-render from.
		 */
		protected applyValue(value: string | string[]): void;
		/**
		 * The placeholder a type shows when the property carries none. A legitimate point of
		 * difference: four simple types answer with a localised phrase, the dates with a format
		 * mask. A type that has nothing to show keeps the base answer.
		 */
		protected getDefaultPlaceholder(): string;
		/**
		 * Renders the control every text-shaped type shares: a bordered row holding one input as
		 * the value node, read-only mode, and the insert button when selection is allowed. A type
		 * passes only what it differs by; the rest comes from the field itself.
		 */
		protected renderTextControl(options: TextControlOptions): TextControl;
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
		protected bindInputFilter(root: HTMLElement, inputSelector: string, sanitize: InputSanitizer): void;
		/**
		 * Takes a stored date apart into the value a control shows and the offset its zone select
		 * holds. The two dates share the format, so they share the one reading of it.
		 */
		protected splitOffset(value: string): OffsetValue;
		/**
		 * Zones the field offers, from its own property or from the settings of the extension named
		 * here. The id stays with the type: date and datetime are configured separately.
		 */
		protected getTimezones(extensionId: string): Timezone[];
		protected findTimezone(timezones: Timezone[], offset: string | null, match?: TimezoneMatch): Timezone | undefined;
		/**
		 * Renders the zone select a date type places next to its control, or nothing when the field
		 * offers no zones. Meant for `rowNodes` of renderTextControl(), which drops a null node.
		 */
		protected renderTimezoneSelect(options: TimezoneSelectOptions): HTMLElement | null;
		protected getControlId(): string;
		protected getCaptionId(): string;
		protected showsLabels(): boolean;
		protected showsDescriptions(): boolean;
	}

	const RenderMode: Readonly<{
		Public: "public";
		Designer: "designer";
		NewDesigner: "new-designer";
	}>;

	class FieldManager {
		constructor(options?: FieldManagerOptions);
		renderField(params: RenderFieldParams): RenderedField;
		/**
		 * Renders every item in input order. Unregistered types leave one request per
		 * document type group: BackendRenderer collects the placeholders of this loop and
		 * flushes them together, so the guarantee holds regardless of what the caller does
		 * with the returned list.
		 */
		renderCollection(items: RenderCollectionItem[]): RenderedField[];
		/**
		 * Applies a changed property and returns the markup that replaced the previous one.
		 * Returns null for an id the manager does not know - a caller that already released
		 * the field gets no node back.
		 */
		applyProperty(fieldId: string, property: Property): HTMLElement | null;
		getValue(fieldName: string): string | string[] | null;
		/**
		 * Value of exactly the field the id was issued for. Addressing by name reaches the first
		 * field rendered under it, which is the wrong one as soon as a form shares one manager
		 * between namesakes - a caller that kept its fieldId reads its own field through this.
		 * Null when the id is unknown or when the field came from the backend and has no instance.
		 */
		getFieldValue(fieldId: string): string | string[] | null;
		/**
		 * Writes into exactly the field the id was issued for - the counterpart of getFieldValue().
		 * Addressing by name reaches the first field rendered under it, which is the wrong one as
		 * soon as a form shares one manager between namesakes. A backend-rendered field has no
		 * instance to write into and is left as it is.
		 */
		setFieldValue(fieldId: string, value: string | string[]): void;
		getValues(): Record<string, string | string[]>;
		setValue(fieldName: string, value: string | string[]): void;
		releaseField(fieldId: string): void;
		destroy(): void;
	}

	function initFieldHints(container: HTMLElement): void;

	class AutomationSelectionProvider implements SelectionProvider {
		isAvailable(): boolean;
		supports(_property: Property): boolean;
		decorate(controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement;
		decorateByRole(role: string, controlNode: HTMLElement, _property: Property, context: SelectionContext): HTMLElement;
	}

	class NullSelectionProvider implements SelectionProvider {
		isAvailable(): boolean;
		supports(_property: Property): boolean;
		decorate(controlNode: HTMLElement, _property: Property, _context: SelectionContext): HTMLElement;
		decorateByRole(_role: string, controlNode: HTMLElement, _property: Property, _context: SelectionContext): HTMLElement;
	}

	const EventName: Readonly<{
		BackendRenderFinished: "bizproc.fields:backend:render-finished";
	}>;
}
