export const RenderMode = Object.freeze({
	Public: 'public',
	Designer: 'designer',
	NewDesigner: 'new-designer',
});

/**
 * Where a field type asks the core to put the name block of a single field. `Above` is the
 * layout every type has always had; `InsideControlRow` moves the block into the control
 * wrapper, right after the control - a switch names itself to its right.
 */
export const NameBlockPlacement = Object.freeze({
	Above: 'above',
	InsideControlRow: 'inside-control-row',
});

/**
 * How a field that supports both is being filled right now: by its own control, or by an
 * expression standing in for a value. Exactly one of the two carriers holds a value at any
 * moment - the other one is kept empty, which is what has the backend read the value back from
 * the side that holds it (see Base::extractValueSingle).
 */
export const ValueMode = Object.freeze({
	Value: 'value',
	Expression: 'expression',
});

export const EventName = Object.freeze({
	BackendRenderFinished: 'bizproc.fields:backend:render-finished',
});

export const BackendForm = Object.freeze({
	Sfa: 'sfa_form',
});
