import { Type } from 'main.core';

import { FORMULA_PART, type FormulaPart } from '../../lib/formula-assembler/formula-assembler';

// No CSS of its own: the palette of the parts paints elements of the window body as well - the
// operator of the chain, its parentheses and the separator of the operands are parts of the same
// palette rendered by the body itself - so the whole of it lives with the body, and the parts are
// only ever shown inside the body, which brings that CSS along.

// The palette of the window, one class per role of a part (TPL-04). A Map and not an object: the
// role comes from the parse of a field value, and a plain object would answer a lookup of
// `constructor` or `toString` with something inherited from its prototype - a class attribute built
// out of a value is exactly what the insertion invariant forbids.
const CLASS_BY_ROLE = new Map([
	[FORMULA_PART.function, '--function'],
	[FORMULA_PART.modifier, '--modifier'],
	[FORMULA_PART.operator, '--operator'],
	[FORMULA_PART.source, '--source'],
	[FORMULA_PART.value, '--value'],
	[FORMULA_PART.number, '--number'],
	[FORMULA_PART.brace, '--brace'],
	[FORMULA_PART.plain, '--plain'],
]);

// A role the palette does not know is painted as the filler of the seams is: no class of its own,
// and none built out of the role either.
const UNKNOWN_ROLE_CLASS = CLASS_BY_ROLE.get(FORMULA_PART.plain);

// The cycle of the nesting: the fourth level starts it over. Three classes and not a number put
// into a name, so a depth of any size, sign or fraction still lands inside the list.
const PAREN_DEPTH_CLASSES = Object.freeze(['--paren-depth-1', '--paren-depth-2', '--paren-depth-3']);

/**
 * The class of a parenthesis by how deep it stands, counted from one. The depth is brought to a
 * whole number and taken modulo the length of the cycle: whatever comes in - a depth of any size,
 * sign or fraction, and a `NaN` as well - what goes out is one of the three names above.
 */
export function parenDepthClass(depth: mixed): string
{
	const level = Math.trunc(Number(depth));

	if (!Number.isFinite(level))
	{
		return PAREN_DEPTH_CLASSES[0];
	}

	const size = PAREN_DEPTH_CLASSES.length;

	return PAREN_DEPTH_CLASSES[(((level - 1) % size) + size) % size];
}

/** The class of one part: by its role, and for a parenthesis by its depth as well. */
export function formulaPartClass(part: ?FormulaPart): string
{
	if (part?.type === FORMULA_PART.paren)
	{
		return parenDepthClass(part.depth);
	}

	return CLASS_BY_ROLE.get(part?.type) ?? UNKNOWN_ROLE_CLASS;
}

/**
 * The typed parts of a value, painted in the palette of the window: one element per part, the class
 * picked from the list above and the text interpolated, so it reaches the document as a text node
 * by construction. Nothing here reads the value: the parts come ready ({@see describeFormulaParts},
 * {@see describeOperandParts}), and the renderer keeps no state and touches no store.
 *
 * A bare span and not a typography component: the parts stand inside the text element of the chip,
 * which is a typography component already, and a second one nested in it would set the size and the
 * line height a second time. A parenthesis of the chain is a text element of its own and takes its
 * class from parenDepthClass instead.
 *
 * @vue/component
 */
export const FormulaParts = {
	name: 'ExpressionBuilderFormulaParts',
	props:
	{
		/** @type Array<FormulaPart> */
		parts:
		{
			type: Array,
			default: () => [],
		},
	},
	methods:
	{
		partClass(part: ?FormulaPart): string
		{
			return formulaPartClass(part);
		},
		partText(part: ?FormulaPart): string
		{
			return Type.isString(part?.text) ? part.text : '';
		},
	},
	template: `
		<span
			v-for="(part, index) in parts"
			:key="index"
			class="bizprocdesigner-expression-builder__part"
			:class="partClass(part)"
		>{{ partText(part) }}</span>
	`,
};
