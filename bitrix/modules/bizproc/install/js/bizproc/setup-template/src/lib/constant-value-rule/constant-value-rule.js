import { CONSTANT_TYPES } from '../../constants';
import { type ConstantValueRule } from '../../types';

// Kinds of the value rule: an integer value is bounded by the value itself, a textual one by its length.
export const VALUE_RULE_KINDS: { [string]: string } = Object.freeze({
	BOUNDS: 'bounds',
	LENGTH: 'length',
});

const VALUE_RULE_KIND_BY_CONSTANT_TYPE = new Map([
	[CONSTANT_TYPES.INT, VALUE_RULE_KINDS.BOUNDS],
	[CONSTANT_TYPES.STRING, VALUE_RULE_KINDS.LENGTH],
	[CONSTANT_TYPES.TEXT, VALUE_RULE_KINDS.LENGTH],
]);

/**
 * The kind of value rule a constant type gets, or null for a type that gets no rule at all. The hint
 * under the field and the check of an entered value branch by this one answer, so a type that gains
 * or loses a rule is described here alone.
 */
export function getValueRuleKind(constantType: string): ?string
{
	return VALUE_RULE_KIND_BY_CONSTANT_TYPE.get(constantType) ?? null;
}

/**
 * A bound of the value rule (DTO-01). The template describes a bound as a number or as a decimal
 * string, and a missing bound is no bound at all: zero is a bound of its own. The hint under the
 * field and the check of an entered value read a bound the same way, so they read it here.
 */
export function readRuleBound(rule: ConstantValueRule, name: string): ?number
{
	const bound = Number.parseInt(rule[name], 10);

	return Number.isNaN(bound) ? null : bound;
}
