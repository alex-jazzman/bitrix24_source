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
	/**
	 * Takes down what the provider holds outside the fields it decorated - markup of its own, a
	 * window standing in the body. Called when the manager is destroyed and not when a single
	 * field is released: one provider serves every field of a manager, so there is nothing here
	 * that belongs to one of them. A provider holding nothing outside the fields declares none.
	 */
	release?(): void;
}

type SelectionContext = {
	documentType?: string[];
	extra?: Record<string, unknown>;
	/**
	 * The name the framework runs this field under. A provider serving a whole form at once tells
	 * a decoration of one field from a decoration of another by it: the markup names nothing that
	 * holds for every type - the dropdown of a list never names the control insertion attaches to -
	 * and the property carries no name of its own.
	 */
	fieldName?: string;
	/**
	 * The node an inserted value goes into: the one the type declared for this very decoration,
	 * the expression companion where it carried one and the value node otherwise. The provider is
	 * told which node that is instead of looking for it in the markup it is handed - the type is
	 * the only one that knows the shape of its own control. Absent where the declared node is none
	 * a selector can write into (see isWriteTarget), and a provider without a target writes nowhere.
	 */
	writeTarget?: WriteTarget;
};

/** A control an inserted value can be written into, whichever of them the type declared. */
type WriteTarget = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * What a field type returns from renderControl().
 *
 * `root` is what the core inserts into the field markup, `valueNode` is what it
 * reads the value from and writes it to, `namedNode` is what it names and focuses
 * (defaults to `valueNode`). `valueNode` is `root` or lives inside it; `namedNode`,
 * when declared, lives inside `root`. The shared insertion row of a multiple field is the
 * one place `valueNode` sits outside `root`: there it is only passed through, because such
 * a pair always takes the anchor branch.
 *
 * `expressionNode` is the input the expression companion of the field travels in, named
 * `{fieldName}_text` by the core. A type declares it when its own control cannot show an
 * expression (a switch, a list of options) and it renders a companion input beside it;
 * left out, the field carries no companion at all.
 *
 * `insertAnchor` is where value insertion attaches: the selection provider wraps that
 * node into its own markup - the `...` button included - and the wrapper takes its place.
 * A type declares it when the button belongs somewhere other than at the value node
 * (select points at the input of its insert row); left out, the value node is the anchor.
 * It lives inside `root` and must hold neither the value node nor the named node: the
 * wrapper takes the anchor's place, so anything inside the anchor leaves the document -
 * and the value node has to stay the live one, the named node to keep naming the field.
 * The expression node is the one exception: the anchor may be it or hold it, and the
 * decorator then hands its live copy back in `expressionNode`.
 *
 * Whichever node the type declared for the decoration - the companion the anchor carries, the
 * anchor itself, or the value node - is what reaches the provider as the node an inserted value
 * is written into (`SelectionContext.writeTarget`), so nothing has to look for it in the markup.
 * A type whose value node holds no text and which renders no companion beside it therefore has
 * nowhere for an inserted value to go, and refuses the decoration outright rather than being
 * handed a node it cannot be written into (`decoratesSelection()`, the way `bool` answers).
 */
type RenderedControl = {
	root: HTMLElement;
	valueNode: HTMLElement;
	namedNode?: HTMLElement;
	insertAnchor?: HTMLElement;
	expressionNode?: HTMLElement;
};

type NameBlockPlacementValue = typeof BX.Bizproc.Fields.NameBlockPlacement[keyof typeof BX.Bizproc.Fields.NameBlockPlacement];

/**
 * What a type calls the two ways it can be filled: its own control, and the expression standing
 * in for a value.
 */
type ValueModeLabels = {
	value: string;
	expression: string;
};

/**
 * The whole of what a field is filled with, and the shape it travels in across a re-render: what
 * the field is filled with, the expression of the companion node, and which of the two carriers is
 * the live one. In the markup exactly one carrier holds something at any moment - the other is kept
 * empty, which is how the backend reads the field back from the side that holds it.
 *
 * `value` is what the field answers with, not what the value node literally holds. A type whose
 * control is never empty answers with the state that control shows even where the node beside it is
 * empty by construction, or a redraw would lose it (see BoolField.getValueState) - so both fields
 * here can be filled at once. The carriers in the markup stay exclusive either way: such a type
 * writes no value node in the expression mode.
 *
 * A type that offers no expression mode fills the value alone and is always in `value` mode.
 */
type FieldValueState = {
	value: string | string[];
	expression: string;
	mode: ValueModeValue;
};

type ValueModeValue = typeof BX.Bizproc.Fields.ValueMode[keyof typeof BX.Bizproc.Fields.ValueMode];

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
	/**
	 * The control holds one whole value rather than text typed into it, so an inserted value
	 * replaces what it shows instead of landing at the caret (`data-select-mode`, read by the
	 * inline selector). Declared by the type: it is the one that knows whether its control shows
	 * a value of its own - a date, a file group - or a string that another one can be typed into.
	 */
	writeOver?: boolean;
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
 * What a type declares about the expression row of its field: nothing but the value the
 * companion input shows. The phrase, the read-only mode and the insert button are the same
 * for every type and come from the field itself.
 */
type ExpressionControlOptions = {
	value: string | string[] | null;
	/**
	 * The companion holds one whole value rather than text typed into it, so an inserted value
	 * replaces what it shows instead of landing at the caret (`data-select-mode`, read by the
	 * inline selector). Declared by the type: a file expression names a group of files and an
	 * expression typed into another one names none, while a plain string takes the caret.
	 */
	writeOver?: boolean;
};

/**
 * The rendered expression row: `node` is the row a type appends below its control, `input` is
 * the companion the expression is typed into - the node the type declares at once as its
 * expression node and as the anchor insertion attaches to.
 */
type ExpressionControl = {
	node: HTMLElement;
	input: HTMLElement;
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

type BoolViewValue = typeof BX.Bizproc.Fields.BoolView[keyof typeof BX.Bizproc.Fields.BoolView];

type SelectViewValue = typeof BX.Bizproc.Fields.SelectView[keyof typeof BX.Bizproc.Fields.SelectView];

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
		 * Where the name block of this field goes. Declared rather than returned with the control,
		 * because render() has to know the placement before it decides what wraps the control.
		 * Answered for a single field only - a group keeps its <legend> first whatever a type says.
		 */
		getNameBlockPlacement(): NameBlockPlacementValue;
		/**
		 * Whether this type is filled two ways - by its own control or by an expression - with the
		 * two standing side by side and a switch above them. Declared by a type whose control cannot
		 * show an expression itself (a switch, a list of options); a type that shows one inside its
		 * own control has nothing to switch between and keeps the answer.
		 *
		 * Says nothing about permission: a field that may insert nothing gets neither the switcher
		 * nor the expression row, whatever the type declares here (see renderExpressionControl).
		 */
		supportsExpressionMode(): boolean;
		/**
		 * What the two tabs above the control are called. The default names the control of the only
		 * type that declares mode support today - a toggle; a type shaped differently answers with
		 * its own word for its own control.
		 */
		getValueModeLabels(): ValueModeLabels;
		/**
		 * Whether the type draws a multiple field as a whole, leaving the core no rows to build.
		 * Kept apart from rendersGroup() because the two coincide only where the controls a type
		 * owns are several: a type may hold the whole selection in one control (user) and then it
		 * is announced as a single field, not as a group of them.
		 */
		rendersOwnMultiple(): boolean;
		/**
		 * Whether the node the core names carries the requirement itself. ARIA 1.2 allows
		 * `aria-required` on the input family of roles alone, so a type whose named node is none of
		 * them - user names the `group` around a whole selector widget - answers false, and the flag
		 * is left off instead of being silently dropped by the accessibility tree. Such a type owes
		 * the user the requirement by other means, the accessible name being one (WCAG H90).
		 * The default is the node every other type names: a control, which does carry it.
		 */
		protected namedNodeCarriesRequired(): boolean;
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
		/**
		 * Lets a type go of what it holds for one row, that row being dropped while the rest of the
		 * field lives on. release() answers for a redraw, which drops every row at once; a row removed
		 * by hand reaches nothing, so a type holding a design-system component per row would hold that
		 * one forever - and a component keeping its instances in a static list of its own (ui.switcher
		 * does) keeps the detached nodes with it. Repeating "add, remove" would then grow without
		 * bound until the whole field is released.
		 */
		protected releaseRow(valueNode: HTMLElement): void;
		/**
		 * What the field holds: the value of its node, or one value per row where the core lays the
		 * multiple case out in rows. A type that owns the multiple case itself may narrow this - user
		 * keeps a whole selection in one node and answers with that one string even when Multiple - so a
		 * consumer must read the answer for what it is instead of deriving its shape from isMultiple().
		 */
		getValue(): string | string[];
		/**
		 * A write fills the field the way a render handed the same value does, and it settles the mode
		 * in both directions. A write shaped like an expression goes to the companion and takes the
		 * field to the expression mode: pushed into the value node instead, it would be read by the
		 * type as a value of its own - bool reads `{=...}` as "not Y" and writes an N over it - and the
		 * write would be lost without a sound. A write of a value takes the field back to the value
		 * mode: left in the expression mode it went into, the field would keep answering with the
		 * expression and the write would be as silently lost the other way round.
		 *
		 * A list is split through the very rule a render splits it by (see #splitItems), so the two
		 * entry points of one field never disagree about one string: a list carrying nothing but an
		 * expression reaches the companion, a list mixing the two keeps the values and drops the
		 * expression. The carrier the mode leaves behind is emptied into the stash rather than dropped,
		 * the way picking a tab empties it: the field switched back gives it up again.
		 */
		setValue(value: string | string[]): void;
		/**
		 * What the field holds now, read as a whole rather than as a value: in the expression mode the
		 * value node is empty by construction, so a caller carrying the value alone would carry that
		 * emptiness and lose the expression with it (see FieldManager.applyProperty). A type that
		 * offers no expression mode answers with the value alone, exactly as it always has.
		 *
		 * The value part goes through getValue(), so a type reading its value its own way (a date
		 * joining its zone back in, a select merging an unmatched expression) is answered for here too.
		 */
		getValueState(): FieldValueState;
		/**
		 * What the field is filled with, read the way the backend reads the pair: the expression where
		 * it stands in for the value, the value of the control otherwise.
		 *
		 * getValue() answers with the control alone, and in the expression mode that control is empty by
		 * construction - a caller reading it would hear that the field holds nothing while the user is
		 * looking at the expression they typed, and a caller writing that answer back (the Vue control
		 * publishes it through `update:modelValue`) would replace the expression with an empty string.
		 *
		 * The shape follows the value rather than isMultiple(): a type owning its multiple case answers
		 * with one string even when Multiple, and the caller reads the answer for what it is.
		 */
		getEffectiveValue(): string | string[];
		/**
		 * Whether what this field submits comes from its companion rather than from its value carrier.
		 * Asked by the application layer, which collapses fields sharing a name the way a form submit
		 * does: `{name}_text` is one input for the whole group of namesakes, so only the last companion
		 * reaches the backend and the expressions of the earlier ones reach nobody (see
		 * FieldManager.getValues). A companion standing empty carries nothing, mode or no mode - and
		 * so does one holding text that is no expression at all (ERR-01).
		 */
		carriesExpression(): boolean;
		/**
		 * Writes back what getValueState() read - the counterpart a re-rendered field is restored from.
		 * The mode is taken only while the field still offers the pair: a property that stopped
		 * allowing insertion takes the expression row away with it, and a field left in a mode whose
		 * carrier is no longer in the markup would report a value nothing holds.
		 *
		 * The value goes in through #writeValue rather than through setValue(): a restore is no write,
		 * its mode comes from the snapshot, and taking the field through the value mode on the way
		 * would have the type fill the carrier the restored mode requires empty.
		 */
		setValueState(state: FieldValueState): void;
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
		/**
		 * What the provider is told about the field it decorates. The name goes in whatever else does:
		 * a provider serving the whole form has no other way of telling this field from its neighbour
		 * (see SelectionContext.fieldName), while the document type is there only where the field
		 * was given one.
		 */
		getSelectionContext(): SelectionContext;
		isReadOnly(): boolean;
		protected wrapMultiple(controls: HTMLElement[]): HTMLElement;
		protected renderSelectionControl(control: RenderedControl): RenderedControl;
		/**
		 * Whether the selection provider will take value insertion over for this field, and with
		 * it the `...` button. Every gate is a property of the field, not of its markup, so the
		 * answer holds before renderControl() runs - which is what lets a type decide there
		 * whether to draw its own button (see renderInsertButton).
		 */
		decoratesSelection(): boolean;
		/**
		 * The same question for the one expression row the core puts beside the rows of a multiple
		 * (see #buildSharedExpressionRow). Asked apart from decoratesSelection() because the two
		 * answers differ for a type whose rows hold no text an inserted value could go into: such a
		 * type keeps the provider off its rows, while that row is the carrier the expression of the
		 * field travels in - insertion has nowhere else to go there. A type answering the same way
		 * for both keeps this default.
		 */
		protected decoratesSharedExpressionRow(): boolean;
		/**
		 * Value nodes of the current render, in render order. Removing a multiple row
		 * drops its node from the list, so a subclass never has to filter detached nodes.
		 */
		protected getValueNodes(): HTMLElement[];
		/**
		 * Expression companions of the current render, in render order - the live nodes, the decorator
		 * having handed its copies back before the list was built. Controls that declared none are not
		 * in the list: a caller reads the companions there are, not one per row.
		 */
		protected getExpressionNodes(): HTMLElement[];
		protected getValueMode(): ValueModeValue;
		/**
		 * Puts the field into a mode without announcing it - what the caller decides, as opposed to
		 * what the user picked in the switcher (see #selectValueMode). Moves no value between the
		 * carriers: the type has just rendered a split that already holds, and a programmatic write
		 * belongs to the caller.
		 */
		protected setValueMode(mode: ValueModeValue): void;
		/**
		 * Where a type puts its own control and the carrier back on one value, the mode having just
		 * been picked and the value already moved to the carrier that mode names.
		 *
		 * That move restores what the carrier coming back had stashed - and a field rendered straight
		 * into the expression mode stashed nothing for its value node, having never held a value there.
		 * A type whose control is never empty (a switch is always on or off) is then left showing a
		 * state no carrier holds: the toggle says "off" while the field carries nothing at all. Only the
		 * type knows what its control means, so it is the type that writes that state back (TPL-13:
		 * exactly one of the two carriers is filled at any moment). The core owns no such control, so
		 * the base writes nothing.
		 *
		 * Called on a picked tab alone, never from render(): a render only ever says that an expression
		 * is standing in for a value (see #adoptRenderedValueMode), and writing the control state then
		 * would fill the value node behind that expression.
		 */
		protected onValueModeChanged(mode: ValueModeValue): void;
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
		 * Renders the expression row a type puts below a control that cannot show an expression
		 * itself (a switch, a list of options): the companion input the `{fieldName}_text` value
		 * travels in, and the `...` button beside it. A type declares the input it gets back as its
		 * expression node and as its insert anchor.
		 *
		 * Nothing is rendered where the field may insert nothing - the effective permission, not the
		 * raw flag, so an AllowSelection left unsaid means "no" in the live document. That is the
		 * symmetry with the backend, which draws the same companion strictly under $allowSelection
		 * (Base::renderControlSingle). A read-only field keeps the row - the expression it already
		 * holds has to stay readable - but nothing is typed or inserted into it.
		 *
		 * Nothing is rendered either where the type declares no mode support: the row is one half of
		 * the pair the switcher moves between, so the two appear and disappear together.
		 */
		protected renderExpressionControl(options: ExpressionControlOptions): ExpressionControl | null;
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
		 * Takes the carrier an expression is typed into by hand under the ERR-01 check, on focus loss
		 * and on commit but never mid-typing. The value constructor announces an inserted value with
		 * `change` and fires no `input` at all, so an insertion clears the mark typing raised.
		 *
		 * The input is named by a selector and resolved at event time: the selection decorator
		 * replaces it with a clone, and cloneNode drops both the listeners and a captured node.
		 */
		protected watchExpressionCarrier(carrier: HTMLElement, inputSelector: string): void;
		/**
		 * Runs the ERR-01 check once and puts the surface where the answer says. Called by the core
		 * after every write into a carrier, and by a type that writes into one itself - a programmatic
		 * write fires no event, so without it the field would keep showing a mark for text no longer
		 * there. Does nothing where the field has no carrier to check.
		 */
		protected checkExpressionCarrier(): void;
		/**
		 * Whether what the carrier holds stands in for a value of the field. One answer for the core:
		 * an expression does, anything else typed by hand does not, and an empty carrier complains
		 * about nothing. The check is the marker alone and no grammar - reading an expression apart
		 * belongs to bizproc, and a broken one inside `{{...}}` is still the backend's to refuse.
		 *
		 * Left open to a type whose carrier legitimately shows more than an expression: the dropdown
		 * view of select shows the caption of the option that was picked.
		 */
		protected isExpressionCarrierValid(input: HTMLInputElement): boolean;
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
		/**
		 * Whether the companion of this field is the shared one the core puts beside the rows. Asked
		 * by a type before it declares an insert anchor: a row of such a field has no companion to
		 * anchor at, and an anchor left undeclared sends the decorator to the value node instead
		 * (see applySelectionDecorator).
		 */
		protected hasSharedExpressionRow(): boolean;
		/**
		 * What a screen reader calls this field: its own name, or the field name as a fallback. The name
		 * is trimmed for the same reason the legend predicate above trims it - a name of nothing but
		 * whitespace names the field to nobody, so it has to fall through to the field name instead of
		 * ending up in an aria-label assistive technologies throw away.
		 *
		 * Left open to a type that has something to add to the name - user spells the requirement into
		 * it, the requirement being an ARIA state its named node may not carry - so that the rule above
		 * is stated once and built upon rather than copied.
		 */
		protected accessibleName(): string;
	}

	const RenderMode: Readonly<{
		Public: "public";
		Designer: "designer";
		NewDesigner: "new-designer";
	}>;

	/**
	 * Where a field type asks the core to put the name block of a single field. `Above` is the
	 * layout every type has always had; `InsideControlRow` moves the block into the control
	 * wrapper, right after the control - a switch names itself to its right.
	 */
	const NameBlockPlacement: Readonly<{
		Above: "above";
		InsideControlRow: "inside-control-row";
	}>;

	/**
	 * How a field that supports both is being filled right now: by its own control, or by an
	 * expression standing in for a value. Exactly one of the two carriers holds a value at any
	 * moment - the other one is kept empty, which is what has the backend read the value back from
	 * the side that holds it (see Base::extractValueSingle).
	 */
	const ValueMode: Readonly<{
		Value: "value";
		Expression: "expression";
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
		/**
		 * Read through getEffectiveValue(), not getValue(): a field filled by an expression keeps its
		 * control empty, and answering with that emptiness would tell the caller the field holds
		 * nothing while the expression is on the screen and on its way to the server.
		 */
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

	function isExpressionValue(value: unknown): value is string;

	/**
	 * Cuts a value string on the commas between its values and on no other. A value may be an
	 * expression rather than a plain one, and an expression carries commas of its own: the arguments
	 * of `{{=if(strlen({=A:x}) > 0, a, b)}}` are one value, not three. So a comma within braces - at
	 * whatever depth, the `{=...}` references nested in a `{{=...}}` included - separates nothing, and
	 * only a comma outside them all ends a value.
	 *
	 * A closing brace that closes nothing takes the depth no lower than zero: an unbalanced string is
	 * still cut the way its top-level commas ask for, rather than turned into one value swallowing the
	 * rest. The opposite half is deliberately not symmetrical - a brace opened and never closed holds
	 * the depth to the end of the string, so everything behind it stays one value. That string is an
	 * expression somebody is still typing, and half an expression is of no use to a reader or a form.
	 */
	function splitTopLevelValues(text: string): string[];

	/**
	 * Which shape a boolean field is drawn in. `Switcher` is the toggle every such field has always
	 * been; `Checkbox` is the flag with its name standing beside it. The values are the wire form -
	 * this is what the backend writes into the property, so they are the contract, not an internal
	 * spelling.
	 */
	const BoolView: Readonly<{
		Switcher: "switcher";
		Checkbox: "checkbox";
	}>;

	/**
	 * The view a property asks for. Nothing writes the key today, so an absent one has to keep every
	 * existing field the toggle it is; an unknown one falls back the same way rather than leaving a
	 * field the core cannot draw at all.
	 */
	function readBoolView(property: Property): BoolViewValue;

	/**
	 * Which shape a list field is drawn in. `List` is the group of radios or checkboxes every such
	 * field has always been; `Dropdown` is the text control whose options are picked in a menu. The
	 * dropdown value is the wire form - `Select::VIEW_TYPE_MENU` is what the backend writes into the
	 * property, so it is the contract, not an internal spelling. The list has no wire value of its
	 * own: the property says nothing where the field stays a list, and the literal here is only the
	 * name in code.
	 */
	const SelectView: Readonly<{
		List: "list";
		Dropdown: "menu";
	}>;

	/**
	 * The view a property asks for. Only the dropdown is ever written, so an absent key has to keep
	 * every existing field the list it is; an unknown one falls back the same way rather than leaving
	 * a field the core cannot draw at all.
	 */
	function readSelectView(property: Property): SelectViewValue;

	/**
	 * The row itself, named here because the core finds it back from the companion input when it
	 * dims the carrier the value mode left behind.
	 */
	const EXPRESSION_ROW_CLASS: string;

	class AutomationSelectionProvider implements SelectionProvider {
		isAvailable(): boolean;
		supports(_property: Property): boolean;
		decorate(controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement;
		/**
		 * The role decides which selector is built, the write target whether one is built at all: every
		 * selector reached from here decorates through `InlineSelector.renderWith`, which wraps a copy of
		 * the node and writes an inserted value into that copy - into the `.value` of a control holding
		 * text, into an option of a `<select>`. A node holding no value - the container of a user, file
		 * or entity widget, which the host renders and fills itself - would get a working-looking handle
		 * whose insertion lands nowhere.
		 *
		 * The `<select>` is offered as a target and `InlineSelector.onFieldSelect` fills it on its own, so
		 * nothing is done for it here. A `<label>`, which the selector fills too, is no target the
		 * framework declares: a type rendering one brings its own target or a role to decorate by
		 * (DEV-07: target and mode are the field's). The same refusal the adapter of the designer makes.
		 */
		decorateByRole(role: string, controlNode: HTMLElement, property: Property, context: SelectionContext): HTMLElement;
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
