import {Dom, Event, Loc, Tag, Text, Type} from 'main.core';
import {
	type FieldValueState,
	type NameBlockPlacementValue,
	type Property,
	type RenderedControl,
	type RenderFieldParams,
	type RenderModeValue,
	type ValueModeValue,
} from '../../const/type';
import {NameBlockPlacement, RenderMode, ValueMode} from '../../const/const';
import {
	getControlName,
	isMultiple,
	isReadOnly,
	isRequired,
	isSelectable,
	isSelectionAllowed,
} from '../../lib/property/property';
import {
	getExpressionFieldName,
	isExpressionValue,
	splitTopLevelValues,
} from '../../lib/expression/expression';
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
import {
	buildValueModeSwitcher,
	type ValueModeLabels,
	type ValueModeSwitcher,
} from '../value-mode/value-mode';
import {
	buildExpressionControl,
	EXPRESSION_ROW_CLASS,
	type ExpressionControl,
	type ExpressionControlOptions,
} from './expression-control';
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

/**
 * The two carriers of one control: the node the value is read off, the companion the expression
 * travels in, and the node the value carrier is seen and operated by (see #applyValueModeState).
 */
type CarrierPair = {
	valueNode: HTMLElement,
	expressionNode: HTMLElement,
	namedNode: HTMLElement,
};

/** Marks a carrier so the mode can fade it; the modifier is what says which one is off. */
const CARRIER_CLASS = 'bizproc-fields-mode-carrier';
const INACTIVE_MODIFIER = '--inactive';

/**
 * ERR-01, the surface of a carrier holding text that stands in for no value: the flag on the
 * carrier and the caption saying why, both the same whichever carrier it is.
 */
const ERROR_MODIFIER = '--error';
const ERROR_CAPTION_CLASS = 'bizproc-fields-error';

/** The companion inside a row buildExpressionControl built - its BEM element of the row class. */
const EXPRESSION_INPUT_SELECTOR = `.${EXPRESSION_ROW_CLASS}__input`;

/**
 * Whether a <label for> pointed at this node would name it. Asked of the DOM instead of kept as a
 * list of tag names: every labelable element carries `labels`, an element that only looks like one
 * (a hidden input) carries it as null, and one that is none at all (the <span> a switch is drawn
 * as) does not carry it.
 */
function isLabelable(node: HTMLElement): boolean
{
	const labels = (node as HTMLInputElement).labels;

	return !Type.isUndefined(labels) && !Type.isNull(labels);
}

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
	 * The announced node of every control built, in render order - the node the field is named on
	 * and the visible carrier of its value (see #applyValueModeState), and for a core-driven
	 * multiple the list its row names are numbered from (see #nameRows). Positions match
	 * #valueNodes: both are appended to as a control is built and dropped from together when a
	 * row goes.
	 */
	#namedNodes: HTMLElement[] = [];
	/**
	 * The expression node of every control built, `null` where the type declared none. Positions
	 * match #valueNodes, so a row of a core-driven multiple drops both together (see #forgetRow).
	 */
	#expressionNodes: Array<HTMLElement | null> = [];
	/**
	 * The one companion of a field whose rows the core lays out, standing beside them rather than
	 * inside any of them. A field carries exactly one expression whatever its multiplicity - it
	 * travels under the plain `{name}_text` and the backend reads it back from there - so a
	 * companion per row would be several inputs under one name, of which a form submits the last.
	 * Set only where the core builds the rows (see #buildsRows); elsewhere the pair belongs to the
	 * control and lives in #expressionNodes.
	 */
	#sharedExpressionNode: HTMLElement | null = null;
	/**
	 * The wrapper around the rows of a core-driven multiple. It is the value carrier of such a
	 * field as a whole - what fades and goes `inert` when an expression fills the field, the
	 * button that adds another row included.
	 */
	#rowsWrapNode: HTMLElement | null = null;
	#valueNodeByRoot: WeakMap<HTMLElement, HTMLElement> = new WeakMap();
	/**
	 * Which of the two carriers the field is being filled by. Kept rather than read off the
	 * markup: a control that is never empty (a switch is always on or off) tells nothing about
	 * the mode it stands in, so the pair of nodes cannot be asked. Outlives a render, which is
	 * what has the field come back in the mode it was left in. The one thing a render does say
	 * is that an expression is standing in for a value - see #adoptRenderedValueMode.
	 */
	#valueMode: ValueModeValue = ValueMode.Value;
	#valueModeSwitcher: ValueModeSwitcher | null = null;
	/**
	 * What the carrier the mode left behind was holding. Kept aside instead of dropped, so
	 * switching there and back loses neither the toggle position nor the typed-in expression.
	 */
	#stashedValues: WeakMap<HTMLElement, string> = new WeakMap();
	#captionRendered: boolean = false;
	/** Node of the last render, the one a change is announced from - see emitChange(). */
	#rootNode: HTMLElement | null = null;
	/**
	 * The carrier an expression is typed into by hand and the selector its input is found by. One
	 * per field: a field carries one expression whatever its multiplicity, so the two carriers of
	 * a type - the insert row of a list and the control of its dropdown view - never stand at
	 * once. The input is resolved through the selector rather than kept, because the selection
	 * decorator replaces it with a copy of itself (see watchExpressionCarrier).
	 */
	#expressionCarrier: {node: HTMLElement, inputSelector: string} | null = null;
	/** The ERR-01 caption on screen, null while the carrier has nothing to complain about. */
	#errorNode: HTMLElement | null = null;

	readonly #controlId: string;

	readonly #captionId: string;

	readonly #errorId: string;

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
		this.#errorId = `${this.#controlId}-error`;
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
	 * Where the name block of this field goes. Declared rather than returned with the control,
	 * because render() has to know the placement before it decides what wraps the control.
	 * Answered for a single field only - a group keeps its <legend> first whatever a type says.
	 */
	getNameBlockPlacement(): NameBlockPlacementValue
	{
		return NameBlockPlacement.Above;
	}

	/**
	 * Whether this type is filled two ways - by its own control or by an expression - with the
	 * two standing side by side and a switch above them. Declared by a type whose control cannot
	 * show an expression itself (a switch, a list of options); a type that shows one inside its
	 * own control has nothing to switch between and keeps the answer.
	 *
	 * Says nothing about permission: a field that may insert nothing gets neither the switcher
	 * nor the expression row, whatever the type declares here (see renderExpressionControl).
	 */
	supportsExpressionMode(): boolean
	{
		return false;
	}

	/**
	 * What the two tabs above the control are called. The default names the control of the only
	 * type that declares mode support today - a toggle; a type shaped differently answers with
	 * its own word for its own control.
	 */
	getValueModeLabels(): ValueModeLabels
	{
		return {
			value: Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_SWITCH') ?? '',
			expression: Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_EXPRESSION') ?? '',
		};
	}

	/**
	 * Whether the type draws a multiple field as a whole, leaving the core no rows to build.
	 * Kept apart from rendersGroup() because the two coincide only where the controls a type
	 * owns are several: a type may hold the whole selection in one control (user) and then it
	 * is announced as a single field, not as a group of them.
	 */
	rendersOwnMultiple(): boolean
	{
		return this.rendersGroup();
	}

	/**
	 * Whether the node the core names carries the requirement itself. ARIA 1.2 allows
	 * `aria-required` on the input family of roles alone, so a type whose named node is none of
	 * them - user names the `group` around a whole selector widget - answers false, and the flag
	 * is left off instead of being silently dropped by the accessibility tree. Such a type owes
	 * the user the requirement by other means, the accessible name being one (WCAG H90).
	 * The default is the node every other type names: a control, which does carry it.
	 */
	protected namedNodeCarriesRequired(): boolean
	{
		return true;
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
		this.#namedNodes = [];
		this.#expressionNodes = [];
		this.#sharedExpressionNode = null;
		this.#rowsWrapNode = null;
		this.#valueNodeByRoot = new WeakMap();
		this.#valueModeSwitcher = null;
		this.#stashedValues = new WeakMap();
		this.#expressionCarrier = null;
		this.#errorNode = null;

		const captionNode = this.#showLabels && this.#showDescriptions
			? FieldLayout.renderCaption(this.#property, this.#captionId)
			: null;
		this.#captionRendered = !Type.isNull(captionNode);

		const multiple = isMultiple(this.#property);
		const rendersOwnGroup = this.rendersGroup();
		const buildsRows = multiple && !this.rendersOwnMultiple();
		// The rows the core builds are a group of controls of their own, which is why a
		// multiple left to the core is announced as one even when the type is silent.
		const isGroup = rendersOwnGroup || buildsRows;

		let controlNode: HTMLElement;
		let nameTarget: HTMLElement | null = null;
		// Handed to assemble() so the name block can be put in front of it - see there.
		let expressionRowNode: HTMLElement | null = null;

		// A type that draws the multiple case itself (select is one list control in both modes,
		// user one selector) leaves the core nothing to lay out in rows.
		if (buildsRows)
		{
			const rows = this.#buildRows();
			controlNode = rows.controlNode;
			expressionRowNode = rows.expressionRowNode;
		}
		else
		{
			const control = this.#buildControl(this.#value);
			controlNode = control.root;
			nameTarget = control.namedNode ?? control.valueNode;
			expressionRowNode = Type.isUndefined(control.expressionNode)
				? null
				: this.#expressionRowOf(control.expressionNode);
		}

		this.#nameExpressionNodes();

		// The named node is what the <label> points at and what the screen reader announces,
		// so the ARIA of a single field goes there too - for bool that is the visible switcher
		// rather than the hidden input holding the value.
		if (!isGroup && !Type.isNull(nameTarget))
		{
			Dom.attr(nameTarget, 'id', this.#controlId);
			this.#applyAria(nameTarget);
		}

		// A `for` naming a node no <label> may name is worse than no `for` at all: the attribute
		// is taken silently, the linkage never holds, and the block ends up promising a click that
		// toggles nothing (WCAG 1.3.1). Such a node is named by its own aria-label instead - which
		// is what the switcher of bool does.
		const namesTarget = !isGroup && !Type.isNull(nameTarget) && isLabelable(nameTarget);

		const nameBlockNode = this.#showLabels
			? FieldLayout.renderNameBlock({
				property: this.#property,
				isGroup,
				showDescription: this.#showDescriptions,
				controlId: namesTarget ? this.#controlId : undefined,
			})
			: null;

		const assembled = FieldLayout.assemble({
			nameBlockNode,
			captionNode,
			controlNode,
			showLabels: this.#showLabels,
			isGroup,
			nameBlockPlacement: this.getNameBlockPlacement(),
			expressionRowNode,
		});

		// A type that renders its own group (select) exposes no single node to carry the ARIA of
		// the group, so it is split: the description goes on the group node, the requirement on
		// the controls the type names. Not applied to a core-driven multiple - there each row
		// already carries its own.
		if (rendersOwnGroup)
		{
			this.#applyGroupAria(assembled);
		}

		// Before the switcher is built: it takes the active tab from the mode the field stands in.
		this.#adoptRenderedValueMode();
		this.#renderValueModeSwitcher(assembled);
		this.#applyValueModeState();

		initFieldHints(assembled);

		// Dom.attr wraps setAttribute (a DOM API, not an HTML sink), so the value goes in raw.
		Dom.attr(assembled, 'data-testid', `bizproc-field-${this.#fieldName}`);

		this.#rootNode = assembled;

		// A field is rendered with a value it did not get through setValue(), and the carrier shows
		// it as it came. Text that stands in for no value is dropped by getValue() either way, so
		// without checking here the field would look filled and save empty (ERR-01).
		this.checkExpressionCarrier();

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

	/**
	 * Lets a type go of what it holds for one row, that row being dropped while the rest of the
	 * field lives on. release() answers for a redraw, which drops every row at once; a row removed
	 * by hand reaches nothing, so a type holding a design-system component per row would hold that
	 * one forever - and a component keeping its instances in a static list of its own (ui.switcher
	 * does) keeps the detached nodes with it. Repeating "add, remove" would then grow without
	 * bound until the whole field is released.
	 */
	protected releaseRow(valueNode: HTMLElement): void
	{
	}

	/**
	 * What the field holds: the value of its node, or one value per row where the core lays the
	 * multiple case out in rows. A type that owns the multiple case itself may narrow this - user
	 * keeps a whole selection in one node and answers with that one string even when Multiple - so a
	 * consumer must read the answer for what it is instead of deriving its shape from isMultiple().
	 */
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
	setValue(value: string | string[]): void
	{
		if (!this.#offersExpressionMode())
		{
			this.#writeValue(value);

			return;
		}

		// A scalar falls into items only where the core lays the field out in rows - that is where
		// a render cuts it too. Elsewhere the type is handed the string whole and reads it as one,
		// so cutting it here would have the two entry points disagree about the very string this
		// keeps them agreeing on.
		const listShaped = this.#buildsRows() || Type.isArray<string>(value);
		const {values, expression} = this.#splitItems(listShaped ? this.#toValueList(value) : [value]);

		if (Type.isStringFilled(expression))
		{
			// The list is kept whole for the next render, expression and all: the render splits it
			// again by the same rule and seeds the companion from it.
			this.#value = value;

			// Put aside on the way in only: a carrier already standing quiet has given up what it
			// held, and stashing an emptied node a second time would put emptiness in the tin - a
			// second expression written in a row would cost the field the value it kept.
			if (this.#valueMode !== ValueMode.Expression)
			{
				this.#valueNodes.forEach((valueNode) => this.#setCarrierValue(valueNode, false));
			}

			this.setValueMode(ValueMode.Expression);
			this.#applyExpression(expression);

			return;
		}

		// The same move the other way round, and guarded on the way in for the same reason. Left
		// filled, the companion would be submitted beside the value just written: for a multiple
		// Base::extractValueMultiple appends `{name}_text` to the rows whenever it looks like an
		// expression, without the "only past an empty value" rule the single case has.
		if (this.#valueMode !== ValueMode.Value)
		{
			this.getExpressionNodes().forEach((node) => this.#setCarrierValue(node, false));
		}

		this.setValueMode(ValueMode.Value);
		this.#writeValue(listShaped ? values : value);
	}

	/**
	 * Writes a value into the carriers and keeps it for the next render, the mode left where it
	 * stands. What setValue() does past settling the mode, and what a restore does instead of it:
	 * there the mode comes from the snapshot, and taking the field through the value mode on the
	 * way would have the type fill the carrier that mode requires empty.
	 */
	#writeValue(value: string | string[]): void
	{
		this.#value = value;
		this.applyValue(value);
		this.checkExpressionCarrier();
	}

	/**
	 * What the field holds now, read as a whole rather than as a value: in the expression mode the
	 * value node is empty by construction, so a caller carrying the value alone would carry that
	 * emptiness and lose the expression with it (see FieldManager.applyProperty). A type that
	 * offers no expression mode answers with the value alone, exactly as it always has.
	 *
	 * The value part goes through getValue(), so a type reading its value its own way (a date
	 * joining its zone back in, a select merging an unmatched expression) is answered for here too.
	 */
	getValueState(): FieldValueState
	{
		return {
			value: this.getValue(),
			expression: this.#readExpression(),
			mode: this.#valueMode,
		};
	}

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
	getEffectiveValue(): string | string[]
	{
		const state = this.getValueState();

		if (state.mode !== ValueMode.Expression)
		{
			return state.value;
		}

		const listShaped = Type.isArray<string>(state.value);

		// Nothing is submitted then: the value node is empty by construction in this mode, and the
		// companion either holds nothing or holds text that stands in for no value - typed by hand
		// and no expression, which is what ERR-01 marks the carrier for. What the quiet carrier
		// still shows - a toggle stands on or off whatever the mode did - is the business of the
		// snapshot, not of a read that has to match the submit.
		if (!isExpressionValue(state.expression))
		{
			return listShaped ? [] : '';
		}

		return listShaped ? [state.expression] : state.expression;
	}

	/**
	 * Whether what this field submits comes from its companion rather than from its value carrier.
	 * Asked by the application layer, which collapses fields sharing a name the way a form submit
	 * does: `{name}_text` is one input for the whole group of namesakes, so only the last companion
	 * reaches the backend and the expressions of the earlier ones reach nobody (see
	 * FieldManager.getValues). A companion standing empty carries nothing, mode or no mode - and
	 * so does one holding text that is no expression at all (ERR-01).
	 */
	carriesExpression(): boolean
	{
		const state = this.getValueState();

		return state.mode === ValueMode.Expression && isExpressionValue(state.expression);
	}

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
	setValueState(state: FieldValueState): void
	{
		this.#writeValue(state.value);

		const mode = this.#offersExpressionMode() ? state.mode : ValueMode.Value;

		this.#restoreExpression(state.expression, mode);
		this.setValueMode(mode);
	}

	/**
	 * Puts the expression back where the mode being restored keeps it: in the companion while the
	 * expression fills the field, in the stash while the value does.
	 *
	 * A restore is not a write, which is why it does not go through #applyExpression. A multiple
	 * submits its one companion beside its rows, and Base::extractValueMultiple appends
	 * `{name}_text` to the values whenever it looks like an expression - none of the "only past an
	 * empty value" rule the single case has. So a companion left filled behind the value mode would
	 * save the stale expression together with the Y/N of every row.
	 *
	 * A field offering no modes is left alone entirely: its companion is filled and read by the type
	 * (select carries its expression inside the value), so emptying it here would take away a node
	 * the core does not own.
	 */
	#restoreExpression(expression: string, mode: ValueModeValue): void
	{
		if (!this.#offersExpressionMode())
		{
			return;
		}

		const active = mode === ValueMode.Expression;

		// Kept aside rather than dropped: the tab the user picks next gives it back, by the same
		// rule a carrier going quiet is emptied into the stash.
		const stash = !active && Type.isStringFilled(expression);

		this.getExpressionNodes().forEach((node) => {
			const input = node as HTMLInputElement;

			this.#stashedValues.delete(node);
			input.value = active ? expression : '';

			if (stash)
			{
				this.#stashedValues.set(node, expression);
			}
		});

		// A restore puts back what the carrier held, hand-typed text included, so the mark it
		// raised comes back with it instead of leaving the field complaining about nothing.
		this.checkExpressionCarrier();
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

	/**
	 * What the provider is told about the field it decorates. The name goes in whatever else does:
	 * a provider serving the whole form has no other way of telling this field from its neighbour
	 * (see SelectionContext.fieldName), while the document type is there only where the field
	 * was given one.
	 */
	getSelectionContext(): SelectionContext
	{
		if (!Type.isUndefined(this.#documentType))
		{
			return { fieldName: this.#fieldName, documentType: this.#documentType };
		}

		return { fieldName: this.#fieldName };
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
			this.#nameExpressionNodes();
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

			// The row was built the way render() builds one, which knows nothing of the mode the
			// field stands in: without this its carriers would both be live, and the one the mode
			// requires empty would take a keystroke (WCAG 4.1.2).
			this.#applyValueModeState();

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

		return this.#decorateSelection(control);
	}

	/**
	 * Hands the pair to the provider; whether it should be decorated is the caller's to settle. A
	 * control of a type is asked about with decoratesSelection(), the one row the core builds
	 * beside the rows of a multiple with decoratesSharedExpressionRow().
	 */
	#decorateSelection(control: RenderedControl): RenderedControl
	{
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
	 */
	decoratesSelection(): boolean
	{
		if (!isSelectionAllowed(this.#property, this.#renderMode))
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
	 * The same question for the one expression row the core puts beside the rows of a multiple
	 * (see #buildSharedExpressionRow). Asked apart from decoratesSelection() because the two
	 * answers differ for a type whose rows hold no text an inserted value could go into: such a
	 * type keeps the provider off its rows, while that row is the carrier the expression of the
	 * field travels in - insertion has nowhere else to go there. A type answering the same way
	 * for both keeps this default.
	 */
	protected decoratesSharedExpressionRow(): boolean
	{
		return this.decoratesSelection();
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
	 * Expression companions of the current render, in render order - the live nodes, the decorator
	 * having handed its copies back before the list was built. Controls that declared none are not
	 * in the list: a caller reads the companions there are, not one per row.
	 */
	protected getExpressionNodes(): HTMLElement[]
	{
		if (!Type.isNull(this.#sharedExpressionNode))
		{
			return [this.#sharedExpressionNode];
		}

		return this.#expressionNodes.filter((node): node is HTMLElement => !Type.isNull(node));
	}

	protected getValueMode(): ValueModeValue
	{
		return this.#valueMode;
	}

	/**
	 * Puts the field into a mode without announcing it - what the caller decides, as opposed to
	 * what the user picked in the switcher (see #selectValueMode). Moves no value between the
	 * carriers: the type has just rendered a split that already holds, and a programmatic write
	 * belongs to the caller.
	 */
	protected setValueMode(mode: ValueModeValue): void
	{
		this.#valueMode = mode;

		if (!Type.isNull(this.#valueModeSwitcher))
		{
			this.#valueModeSwitcher.setActiveMode(mode);
		}

		this.#applyValueModeState();
	}

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
	protected onValueModeChanged(mode: ValueModeValue): void
	{
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
	protected renderExpressionControl(options: ExpressionControlOptions): ExpressionControl | null
	{
		// Nothing where the companion is the field's rather than the control's: there the core
		// builds the one row beside the group itself (see #buildSharedExpressionRow), and a type
		// answering with one per control would put several inputs under the one `{name}_text`.
		if (!this.#offersExpressionMode() || this.hasSharedExpressionRow())
		{
			return null;
		}

		const readOnly = this.isReadOnly();
		// Where the provider decorates the row it brings its own button into it, so the field's
		// own one would be the second `...` of the field.
		const ownInsertButton = !readOnly && !this.decoratesSelection();

		const control = buildExpressionControl({
			...options,
			fieldName: this.#fieldName,
			readOnly,
			insertButton: ownInsertButton ? this.renderInsertButton() : null,
		});

		this.watchExpressionCarrier(control.node, EXPRESSION_INPUT_SELECTOR);

		return control;
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
	 * Takes the carrier an expression is typed into by hand under the ERR-01 check, on focus loss
	 * and on commit but never mid-typing. The value constructor announces an inserted value with
	 * `change` and fires no `input` at all, so an insertion clears the mark typing raised.
	 *
	 * The input is named by a selector and resolved at event time: the selection decorator
	 * replaces it with a clone, and cloneNode drops both the listeners and a captured node.
	 */
	protected watchExpressionCarrier(carrier: HTMLElement, inputSelector: string): void
	{
		if (this.isReadOnly())
		{
			return;
		}

		this.#expressionCarrier = { node: carrier, inputSelector };

		Event.bind(carrier, 'focusout', this.#handleCarrierCommit);
		Event.bind(carrier, 'change', this.#handleCarrierCommit);
	}

	/**
	 * Runs the ERR-01 check once and puts the surface where the answer says. Called by the core
	 * after every write into a carrier, and by a type that writes into one itself - a programmatic
	 * write fires no event, so without it the field would keep showing a mark for text no longer
	 * there. Does nothing where the field has no carrier to check.
	 */
	protected checkExpressionCarrier(): void
	{
		const carrier = this.#expressionCarrier;

		if (Type.isNull(carrier))
		{
			return;
		}

		const input = carrier.node.querySelector<HTMLInputElement>(carrier.inputSelector);

		if (Type.isNull(input))
		{
			return;
		}

		this.#markExpressionError(carrier.node, input, !this.isExpressionCarrierValid(input));
	}

	/**
	 * Whether what the carrier holds stands in for a value of the field. One answer for the core:
	 * an expression does, anything else typed by hand does not, and an empty carrier complains
	 * about nothing. The check is the marker alone and no grammar - reading an expression apart
	 * belongs to bizproc, and a broken one inside `{{...}}` is still the backend's to refuse.
	 *
	 * Left open to a type whose carrier legitimately shows more than an expression: the dropdown
	 * view of select shows the caption of the option that was picked.
	 */
	protected isExpressionCarrierValid(input: HTMLInputElement): boolean
	{
		return !Type.isStringFilled(input.value) || isExpressionValue(input.value);
	}

	#handleCarrierCommit = (): void => {
		this.checkExpressionCarrier();
	};

	/**
	 * The whole of ERR-01 in the markup: the flag on the carrier, `aria-invalid` on its input and
	 * the caption below it, tied to the input by `aria-describedby` so a screen reader reads the
	 * reason together with the field (WCAG 3.3.1). Cleared down to the last of them when the
	 * carrier comes back holding something the field accepts.
	 */
	#markExpressionError(carrier: HTMLElement, input: HTMLElement, invalid: boolean): void
	{
		if (!invalid)
		{
			Dom.removeClass(carrier, ERROR_MODIFIER);
			Dom.attr(input, 'aria-invalid', null);
			this.#describeByError(input, false);
			Dom.remove(this.#errorNode);
			this.#errorNode = null;

			return;
		}

		Dom.addClass(carrier, ERROR_MODIFIER);
		Dom.attr(input, 'aria-invalid', 'true');

		if (Type.isNull(this.#errorNode))
		{
			this.#errorNode = Tag.render`
				<div
					class="${ERROR_CAPTION_CLASS}"
					data-testid="${Text.encode(`bizproc-field-error-${this.#fieldName}`)}"
				>
					${Text.encode(Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_INVALID') ?? '')}
				</div>
			`;

			Dom.attr(this.#errorNode, 'id', this.#errorId);
			Dom.insertAfter(this.#errorNode, carrier);
		}

		this.#describeByError(input, true);
	}

	/**
	 * Adds the caption of the error to what already describes the input, or takes it back out.
	 * Written as a list rather than as one id: the core may have pointed the input at the
	 * description of the field already (see #applyAria), and overwriting the attribute would
	 * silence it.
	 */
	#describeByError(input: HTMLElement, described: boolean): void
	{
		const ids = (input.getAttribute('aria-describedby') ?? '')
			.split(' ')
			.filter((id) => id !== '' && id !== this.#errorId);

		if (described)
		{
			ids.push(this.#errorId);
		}

		Dom.attr(input, 'aria-describedby', ids.length > 0 ? ids.join(' ') : null);
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
	 *
	 * A scalar is cut on its top-level commas alone: an expression carries commas of its own
	 * (`{=A:B>user,printable}` holds the modifier past one), and cutting inside it would leave a
	 * head still shaped like an expression and a tail read as an ordinary value - the field would
	 * drop the expression and come up filled by that tail.
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

		return this.splitsScalarValue() ? splitTopLevelValues(value) : [value];
	}

	/**
	 * The two sides a list of items falls into: the values that go into the carriers of the field,
	 * and the one expression standing in for them. An expression among the values belongs to the
	 * field, not to a row: it is what the companion is seeded with, and it leaves no row behind.
	 * Same rule the single case keeps inside the type, where a value shaped like an expression goes
	 * to the companion instead of the control (see BoolField.renderControl). A value among them
	 * wins, and the expression is dropped rather than kept beside it: that is the order the backend
	 * reads the pair in (Base::extractValueSingle takes `{name}_text` only past an empty value),
	 * and exactly one carrier may be filled.
	 *
	 * Held apart only where the expression has a companion to go into. A field offering no modes
	 * has none, so there an expression-shaped item is an ordinary value of the list: taken out of
	 * the list it would land in no carrier at all and be lost instead of moved.
	 *
	 * The one place that rule lives, so a render and a write lay the same list out the same way.
	 */
	#splitItems(items: string[]): {values: string[], expression: string}
	{
		if (!this.#offersExpressionMode())
		{
			return {values: items, expression: ''};
		}

		const values = items.filter((item) => !isExpressionValue(item));
		const expression = values.length > 0
			? ''
			: (items.find((item) => isExpressionValue(item)) ?? '');

		return {values, expression};
	}

	/** The rows of a core-driven multiple and the one companion standing beside them. */
	#buildRows(): {controlNode: HTMLElement, expressionRowNode: HTMLElement | null}
	{
		const {values, expression: seedExpression} = this.#splitItems(this.#toValueList(this.#value));
		const seed = values.length > 0 ? values : [null];

		// Before the rows are built, not read back off them afterwards. A type is asked for a row
		// while nothing has read the render yet, and bool answers off the mode: left in the value
		// mode it seeds that row with a plain 'N', and #adoptRenderedValueMode() then sees a field
		// reporting a value and leaves the mode where it was. The 'N' would be submitted beside the
		// expression - Base::extractValueMultiple appends `{name}_text` to the values whenever it
		// looks like an expression, without the "only past an empty value" rule the single case has.
		// The core already knows the answer here: no value among the items, an expression standing
		// for them.
		if (Type.isStringFilled(seedExpression))
		{
			this.setValueMode(ValueMode.Expression);
		}

		// Every row of a core-driven multiple announces itself as a field of its own, so the ARIA
		// goes on each row rather than on the wrapper above them (see onAddClick in wrapMultiple,
		// which does the same for a row added later). It goes on the named node of the row for the
		// same reason as in the single case: for bool the value node is a hidden input, which is
		// not in the accessibility tree at all.
		const roots = seed.map((presetValue) => {
			const control = this.#buildControl(presetValue);
			this.#applyRowAria(control);

			return control.root;
		});

		const controlNode = this.wrapMultiple(roots);
		this.#rowsWrapNode = controlNode;
		this.#nameRows();

		return { controlNode, expressionRowNode: this.#buildSharedExpressionRow(seedExpression, controlNode) };
	}

	#buildControl(value: string | string[] | null): RenderedControl
	{
		const control = this.renderSelectionControl(this.renderControl(value));

		this.#valueNodes.push(control.valueNode);
		this.#namedNodes.push(control.namedNode ?? control.valueNode);
		this.#valueNodeByRoot.set(control.root, control.valueNode);
		this.#trackExpressionNode(control.expressionNode);

		return control;
	}

	/**
	 * Whether the rows of this field are laid out by the core rather than by the type. Such a
	 * field is a group of controls with one expression between them, which is why its companion
	 * is the field's own (see #sharedExpressionNode); a type drawing its multiple itself keeps
	 * the pair inside the one control it renders.
	 */
	#buildsRows(): boolean
	{
		return isMultiple(this.#property) && !this.rendersOwnMultiple();
	}

	/**
	 * Whether the companion of this field is the shared one the core puts beside the rows. Asked
	 * by a type before it declares an insert anchor: a row of such a field has no companion to
	 * anchor at, and an anchor left undeclared sends the decorator to the value node instead
	 * (see applySelectionDecorator).
	 */
	protected hasSharedExpressionRow(): boolean
	{
		return this.#buildsRows() && this.#offersExpressionMode();
	}

	/**
	 * The one expression row of a core-driven multiple, built after the rows so it stands beside
	 * them rather than inside one. Returns null where the field offers no modes at all - then
	 * there is no row and no switcher, exactly as for a single field.
	 *
	 * The row is described to the provider the way a control of a type is (see #buildControl), so
	 * insertion into a multiple field reaches the same companion the user types into. The anchor
	 * is spelled out rather than left to the default: undeclared, it is the value node - and here
	 * that is the wrapper around the rows, whose inputs hold the values the field already has.
	 * The rows are what the anchor is kept away from, which is the very check isDecoratableAnchor
	 * makes, so they are named here as the value node of the pair.
	 */
	#buildSharedExpressionRow(value: string, rowsWrapNode: HTMLElement): HTMLElement | null
	{
		if (!this.hasSharedExpressionRow())
		{
			return null;
		}

		const readOnly = this.isReadOnly();
		// Where the provider decorates the row it brings its own button into it, so the field's own
		// one would be the second `...` of the field - the rule renderExpressionControl keeps for a
		// companion belonging to a control.
		const decorates = this.decoratesSharedExpressionRow();
		const ownInsertButton = !readOnly && !decorates;
		const row = buildExpressionControl({
			value,
			fieldName: this.#fieldName,
			readOnly,
			insertButton: ownInsertButton ? this.renderInsertButton() : null,
		});

		// A value node outside the root is the exception documented on RenderedControl; it holds
		// here because this pair always takes the anchor branch.
		const pair: RenderedControl = {
			root: row.node,
			valueNode: rowsWrapNode,
			insertAnchor: row.input,
			expressionNode: row.input,
		};

		// Decorated past renderSelectionControl(): that one answers for a control of the type, while
		// this row belongs to the core - a type keeping the provider off its rows still gets it here.
		const decorated = decorates ? this.#decorateSelection(pair) : pair;

		// The live copy the decoration handed back, or the input itself where none happened: the
		// name and everything read off the companion afterwards have to reach the node on screen.
		const input = decorated.expressionNode ?? row.input;

		Dom.attr(input, 'name', getExpressionFieldName(this.#fieldName));
		this.#sharedExpressionNode = input;

		this.watchExpressionCarrier(row.node, EXPRESSION_INPUT_SELECTOR);

		return decorated.root;
	}

	/**
	 * Takes the expression companion of one control into the list and names it. Done here, after
	 * the decorator ran, because the node the type declared may have been replaced by the live
	 * copy inside the decoration - and it is that copy the value has to be read off.
	 */
	#trackExpressionNode(expressionNode: HTMLElement | undefined): void
	{
		if (Type.isUndefined(expressionNode))
		{
			this.#expressionNodes.push(null);

			return;
		}

		Dom.attr(expressionNode, 'name', getExpressionFieldName(this.#fieldName));
		this.#expressionNodes.push(expressionNode);
	}

	/**
	 * The expression the field carries - one for the whole field, multiple or not: the companion
	 * travels under the plain `{fieldName}_text` name in either case, so the rows of a multiple
	 * share the one expression and the first companion answers for all of them.
	 */
	#readExpression(): string
	{
		const node = this.getExpressionNodes()[0];

		return Type.isUndefined(node) ? '' : this.#carrierValue(node);
	}

	/**
	 * Every companion takes the one expression, by the same rule #readExpression reads it, and what
	 * was put aside for it goes: the stash left behind would be handed back over this the next time
	 * the tab is picked. Restoring a state is the other case and belongs to #restoreExpression,
	 * where the mode decides which of the two the expression goes into.
	 */
	#applyExpression(expression: string): void
	{
		this.getExpressionNodes().forEach((node) => {
			const input = node as HTMLInputElement;

			this.#stashedValues.delete(node);
			input.value = expression;
		});

		this.checkExpressionCarrier();
	}

	/**
	 * What a carrier holds - the value in its node, or the one kept aside where the mode sent that
	 * carrier quiet. A quiet carrier is emptied rather than hidden (see #setCarrierValue), so its
	 * node answers with an empty string while the field still carries the value; reading the node
	 * alone would report the field as having lost what the user typed, and a re-render restored
	 * from that report would lose it for real.
	 */
	#carrierValue(node: HTMLElement): string
	{
		const stashed = this.#stashedValues.get(node);

		return Type.isUndefined(stashed) ? ((node as HTMLInputElement).value ?? '') : stashed;
	}

	/**
	 * Whether the field offers the two modes at all: the type has to declare the pair, and the
	 * field has to be allowed to insert anything - in the live document an AllowSelection left
	 * unsaid means "no". Without both there is neither a switcher nor an expression row.
	 */
	#offersExpressionMode(): boolean
	{
		return this.supportsExpressionMode() && isSelectionAllowed(this.#property, this.#renderMode);
	}

	/**
	 * Puts the row of tabs above everything the field row holds - above the control and above the
	 * name block standing beside it. In a group it goes behind the <legend>, which names its
	 * <fieldset> only as its first child (WCAG 1.3.1).
	 */
	#renderValueModeSwitcher(assembled: HTMLElement): void
	{
		if (!this.#offersExpressionMode())
		{
			return;
		}

		const switcher = buildValueModeSwitcher({
			labels: this.getValueModeLabels(),
			activeMode: this.#valueMode,
			// A single field nests the group in nothing that carries its name, so the name goes
			// into the phrase: several fields on one page otherwise announce the same group
			// (WCAG 4.1.2, 2.4.6).
			groupLabel: Loc.getMessage('BIZPROC_FIELDS_VALUE_MODE_LABEL', {
				'#NAME#': this.accessibleName(),
			}) ?? '',
			fieldName: this.#fieldName,
			// The tabs of a read-only field announce the mode and take no pick - see #selectValueMode.
			readOnly: this.isReadOnly(),
			onSelect: (mode: ValueModeValue): void => {
				this.#selectValueMode(mode);
			},
		});

		this.#valueModeSwitcher = switcher;

		const legend = assembled.querySelector<HTMLElement>(':scope > legend');

		if (Type.isNull(legend))
		{
			Dom.prepend(switcher.node, assembled);

			return;
		}

		Dom.insertAfter(switcher.node, legend);
	}

	/**
	 * Puts the field into the expression mode where the render it has just done says so: an
	 * expression standing in the companion while the field reports no value of its own is a field
	 * being filled that way, whoever laid the pair out - the server sending back a saved expression
	 * included. Without this the mode would stay whatever it was, the switcher would point at the
	 * empty carrier, and the first redraw would fill the other one behind the expression (TPL-13:
	 * exactly one of the two carriers is filled at any moment).
	 *
	 * Read from what the field answers rather than from its nodes: getValue() is what a type reading
	 * its value its own way answers with, and the companion is read the one way getValueState()
	 * reads it. Only that one direction is read - a control that is never empty says nothing about
	 * the mode it stands in - so a mode picked earlier survives a render untouched.
	 */
	#adoptRenderedValueMode(): void
	{
		if (!this.#offersExpressionMode() || !Type.isStringFilled(this.#readExpression()))
		{
			return;
		}

		const value = this.getValue();
		const holdsNoValue = Type.isArray<string>(value) ? value.length === 0 : value === '';

		if (holdsNoValue)
		{
			this.setValueMode(ValueMode.Expression);
		}
	}

	/**
	 * What picking a tab means: the mode is the user's choice now, the value moves to the carrier
	 * the mode names, the type finishes what that move could not (see onValueModeChanged), and the
	 * change is announced the way every other value change is.
	 *
	 * A read-only field picks nothing. This is the one point a pick reaches the transfer through, and
	 * the transfer takes the value away from the carrier it leaves behind: without this, one click on
	 * a tab would empty the value a field forbade editing - and for bool an empty value is "not set"
	 * to the backend, not "No". The switcher of such a field binds no selection at all (see
	 * buildValueModeSwitcher), so this guards the data while that guards the promise the markup makes.
	 * Programmatic changes are unaffected: they go through setValueMode(), which moves no value.
	 */
	#selectValueMode(mode: ValueModeValue): void
	{
		if (this.isReadOnly())
		{
			return;
		}

		if (mode === this.#valueMode)
		{
			return;
		}

		this.#valueMode = mode;
		this.#moveValueToActiveCarrier();
		this.onValueModeChanged(mode);
		this.#applyValueModeState();
		this.emitChange();
	}

	/**
	 * Fades the carrier the mode left behind and brings the other one back. Neither is hidden nor
	 * dropped: both keep their place and their value. Faded AND `inert`, because a carrier that
	 * still took a click or a keystroke would write into a node the mode requires to stay empty.
	 */
	#applyValueModeState(): void
	{
		if (Type.isNull(this.#valueModeSwitcher))
		{
			return;
		}

		const expressionActive = this.#valueMode === ValueMode.Expression;

		// One companion, one value carrier: the rows of a core-driven multiple fade as a whole,
		// the button adding another one included - a row born while an expression fills the field
		// would be a carrier the mode requires empty. The companion stands outside that wrapper,
		// so the `inert` put on it does not reach the row the user is meant to type into.
		if (!Type.isNull(this.#sharedExpressionNode) && !Type.isNull(this.#rowsWrapNode))
		{
			this.#setCarrierActive(this.#rowsWrapNode, !expressionActive);
			this.#setCarrierActive(this.#expressionRowOf(this.#sharedExpressionNode), expressionActive);

			return;
		}

		this.#forEachCarrierPair((pair) => {
			this.#setCarrierActive(pair.namedNode, !expressionActive);
			this.#setCarrierActive(this.#expressionRowOf(pair.expressionNode), expressionActive);
		});
	}

	/**
	 * Keeps exactly one carrier filled: what the one going quiet held is kept aside, and the one
	 * coming back takes its own back. Done on a switch alone - at render time the type has already
	 * put the value on the side that holds it, and moving it then would drop, for one, the
	 * expression a field was rendered with.
	 *
	 * A carrier that never stashed anything has nothing to take back, and this keeps its hands off
	 * it rather than guessing: what a value node left empty should hold is the type's answer alone
	 * (see onValueModeChanged).
	 */
	#moveValueToActiveCarrier(): void
	{
		const expressionActive = this.#valueMode === ValueMode.Expression;

		// Every row goes quiet against the one companion: the rows are the value carrier of such
		// a field together, so all of them are kept aside and given back at once.
		if (!Type.isNull(this.#sharedExpressionNode))
		{
			this.#valueNodes.forEach((valueNode) => this.#setCarrierValue(valueNode, !expressionActive));
			this.#setCarrierValue(this.#sharedExpressionNode, expressionActive);
		}
		else
		{
			this.#forEachCarrierPair((pair) => {
				this.#setCarrierValue(pair.valueNode, !expressionActive);
				this.#setCarrierValue(pair.expressionNode, expressionActive);
			});
		}

		// The tab coming back hands the carrier what it had put aside, hand-typed text included,
		// so the ERR-01 mark follows the text between the tabs instead of staying on the one it
		// was raised on.
		this.checkExpressionCarrier();
	}

	/** Walks the controls that carry both nodes; a control with no companion has no mode to be in. */
	#forEachCarrierPair(callback: (pair: CarrierPair) => void): void
	{
		this.#expressionNodes.forEach((expressionNode, index) => {
			const valueNode = this.#valueNodes[index];
			const namedNode = this.#namedNodes[index];

			if (Type.isNull(expressionNode) || Type.isUndefined(valueNode) || Type.isUndefined(namedNode))
			{
				return;
			}

			callback({valueNode, expressionNode, namedNode});
		});
	}

	#setCarrierActive(node: HTMLElement, active: boolean): void
	{
		Dom.addClass(node, CARRIER_CLASS);

		if (active)
		{
			Dom.removeClass(node, INACTIVE_MODIFIER);
		}
		else
		{
			Dom.addClass(node, INACTIVE_MODIFIER);
		}

		node.toggleAttribute('inert', !active);
	}

	#setCarrierValue(node: HTMLElement, active: boolean): void
	{
		const input = node as HTMLInputElement;

		if (!active)
		{
			this.#stashedValues.set(node, input.value);
			input.value = '';

			return;
		}

		const stashed = this.#stashedValues.get(node);

		if (!Type.isUndefined(stashed))
		{
			input.value = stashed;
			this.#stashedValues.delete(node);
		}
	}

	/** The row the companion lives in - what fades, the "..." button standing in it included. */
	#expressionRowOf(expressionNode: HTMLElement): HTMLElement
	{
		return expressionNode.closest<HTMLElement>(`.${EXPRESSION_ROW_CLASS}`) ?? expressionNode;
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
		if (isRequired(this.#property) && this.namedNodeCarriesRequired())
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

		Dom.attr(groupNode, 'aria-label', this.accessibleName());
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
	 *
	 * Left open to a type that has something to add to the name - user spells the requirement into
	 * it, the requirement being an ARIA state its named node may not carry - so that the rule above
	 * is stated once and built upon rather than copied.
	 */
	protected accessibleName(): string
	{
		const name = Type.isString(this.#property.Name) ? this.#property.Name.trim() : '';

		return Type.isStringFilled(name) ? name : this.#fieldName;
	}

	/**
	 * ARIA of one row of a core-driven multiple: the requirement and the description. The row is
	 * already in the list its name is numbered from - #buildControl takes every control there.
	 */
	#applyRowAria(control: RenderedControl): void
	{
		this.#applyAria(control.namedNode ?? control.valueNode);
	}

	/**
	 * Names every expression companion of the field. Done here rather than in the markup for the
	 * same reason the `name` attribute is (see #trackExpressionNode): the phrase needs the field,
	 * and a row of a multiple needs its number. Without it the companion is announced by its
	 * placeholder, which names nothing (WCAG 3.3.2), and the companions of a multiple all sound
	 * exactly alike (WCAG 4.1.2).
	 */
	#nameExpressionNodes(): void
	{
		// The shared companion belongs to the field, not to a row, so it is named after the field
		// itself - numbering it would announce an expression that fills every row as the one of
		// row 1.
		if (!Type.isNull(this.#sharedExpressionNode))
		{
			const fieldLabel = Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_LABEL', {
				'#NAME#': this.accessibleName(),
			}) ?? '';

			if (fieldLabel !== '')
			{
				Dom.attr(this.#sharedExpressionNode, 'aria-label', fieldLabel);
			}

			return;
		}

		this.#expressionNodes.forEach((node, index) => {
			if (Type.isNull(node))
			{
				return;
			}

			const label = Loc.getMessage('BIZPROC_FIELDS_EXPRESSION_LABEL', {
				'#NAME#': this.#rowOwnerName(index),
			}) ?? '';

			if (label !== '')
			{
				// Dom.attr wraps setAttribute (a DOM API, not an HTML sink): no Text.encode, or the
				// screen reader would read literal entities.
				Dom.attr(node, 'aria-label', label);
			}
		});
	}

	/**
	 * What names the announced unit at this position: the field itself, or the numbered row of a
	 * core-driven multiple. The numbering is the one #nameRows uses, so a row and its companion
	 * are announced under the same name.
	 */
	#rowOwnerName(index: number): string
	{
		const name = this.accessibleName();

		if (!this.isMultiple() || this.rendersGroup())
		{
			return name;
		}

		return Loc.getMessage('BIZPROC_FIELDS_MULTIPLE_ROW_LABEL', {
			'#NAME#': name,
			'#NUMBER#': String(index + 1),
		}) ?? name;
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
		const name = this.accessibleName();

		this.#namedNodes.forEach((node, index) => {
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

		this.releaseRow(valueNode);
		this.#valueNodes.splice(index, 1);
		this.#namedNodes.splice(index, 1);
		this.#expressionNodes.splice(index, 1);
		this.#nameRows();
		this.#nameExpressionNodes();
	}
}
