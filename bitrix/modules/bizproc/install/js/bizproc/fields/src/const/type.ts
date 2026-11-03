import { type NameBlockPlacement, type RenderMode, type ValueMode } from './const';

export type RenderModeValue = typeof RenderMode[keyof typeof RenderMode];

export type NameBlockPlacementValue = typeof NameBlockPlacement[keyof typeof NameBlockPlacement];

export type ValueModeValue = typeof ValueMode[keyof typeof ValueMode];

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
export type FieldValueState = {
	value: string | string[],
	expression: string,
	mode: ValueModeValue,
};

export type Property = {
	Type: string,
	Name: string,
	Multiple?: boolean,
	Required?: boolean,
	AllowSelection?: boolean,
	Options?: Record<string, string>,
	Settings?: Record<string, unknown>,
	Description?: string,
	Placeholder?: string,
	ReadOnly?: boolean,
};

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
export type RenderedControl = {
	root: HTMLElement,
	valueNode: HTMLElement,
	namedNode?: HTMLElement,
	insertAnchor?: HTMLElement,
	expressionNode?: HTMLElement,
};

/**
 * What the manager returns for one rendered field.
 *
 * `fieldId` is the manager's own handle on the field: it addresses the field for
 * applyProperty() and releaseField() and does not change while the field lives,
 * so it stays valid across re-renders that replace `node`.
 */
export type RenderedField = {
	fieldId: string,
	node: HTMLElement,
};

export type ManagerOptions = {
	documentType?: string[],
	renderMode?: RenderModeValue,
	showLabels?: boolean,
	showDescriptions?: boolean,
};

export type RenderFieldParams = {
	property: Property,
	fieldName: string,
	value?: string | string[] | null,
	renderMode?: RenderModeValue,
	showLabels?: boolean,
	showDescriptions?: boolean,
	documentType?: string[],
};
