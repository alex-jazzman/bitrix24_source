import { type RenderMode } from './const';

export type RenderModeValue = typeof RenderMode[keyof typeof RenderMode];

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
export type RenderedControl = {
	root: HTMLElement,
	valueNode: HTMLElement,
	namedNode?: HTMLElement,
	insertAnchor?: HTMLElement,
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
