/**
 * @module im/messenger/db/query-builder/condition
 */
jn.define('im/messenger/db/query-builder/condition', (require, exports, module) => {
	const { Type } = require('type');

	/** @enum {string} */
	const ConditionType = Object.freeze({
		EQUAL: 'equal',
		NOT_EQUAL: 'notEqual',
		GREATER_THAN: 'greaterThan',
		GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual',
		LESS_THAN: 'lessThan',
		LESS_THAN_OR_EQUAL: 'lessThanOrEqual',
		IN: 'in',
		NOT_IN: 'notIn',
		LIKE: 'like',
		NOT_LIKE: 'notLike',
		IS_NULL: 'isNull',
		IS_NOT_NULL: 'isNotNull',
		AND: 'and',
		OR: 'or',
		NOT: 'not',
		EQUAL_FIELD: 'equalField',
	});

	// ─── comparison: field OP value ────────────────────────────────────

	/** @return {ComparisonCondition} */
	const equal = (field, value) => Object.freeze({
		type: ConditionType.EQUAL,
		field,
		value,
	});

	/** @return {ComparisonCondition} */
	const notEqual = (field, value) => Object.freeze({
		type: ConditionType.NOT_EQUAL,
		field,
		value,
	});

	/** @return {ComparisonCondition} */
	const greaterThan = (field, value) => {
		if (Type.isNil(value))
		{
			throw new Error('greaterThan: value is required');
		}

		return Object.freeze({ type: ConditionType.GREATER_THAN, field, value });
	};

	/** @return {ComparisonCondition} */
	const greaterThanOrEqual = (field, value) => {
		if (Type.isNil(value))
		{
			throw new Error('greaterThanOrEqual: value is required');
		}

		return Object.freeze({ type: ConditionType.GREATER_THAN_OR_EQUAL, field, value });
	};

	/** @return {ComparisonCondition} */
	const lessThan = (field, value) => {
		if (Type.isNil(value))
		{
			throw new Error('lessThan: value is required');
		}

		return Object.freeze({ type: ConditionType.LESS_THAN, field, value });
	};

	/** @return {ComparisonCondition} */
	const lessThanOrEqual = (field, value) => {
		if (Type.isNil(value))
		{
			throw new Error('lessThanOrEqual: value is required');
		}

		return Object.freeze({ type: ConditionType.LESS_THAN_OR_EQUAL, field, value });
	};

	/** @return {ListCondition} */
	const inList = (field, values) => {
		if (!Type.isArrayFilled(values))
		{
			throw new Error('inList: non-empty values array is required');
		}

		return Object.freeze({ type: ConditionType.IN, field, values });
	};

	/** @return {ListCondition} */
	const notInList = (field, values) => {
		if (!Type.isArrayFilled(values))
		{
			throw new Error('notInList: non-empty values array is required');
		}

		return Object.freeze({ type: ConditionType.NOT_IN, field, values });
	};

	/** @return {PatternCondition} */
	const like = (field, pattern) => {
		if (Type.isNil(pattern))
		{
			throw new Error('like: pattern is required');
		}

		return Object.freeze({ type: ConditionType.LIKE, field, pattern });
	};

	/** @return {PatternCondition} */
	const notLike = (field, pattern) => {
		if (Type.isNil(pattern))
		{
			throw new Error('notLike: pattern is required');
		}

		return Object.freeze({ type: ConditionType.NOT_LIKE, field, pattern });
	};

	/** @return {NullCheckCondition} */
	const isNull = (field) => Object.freeze({
		type: ConditionType.IS_NULL,
		field,
	});

	/** @return {NullCheckCondition} */
	const isNotNull = (field) => Object.freeze({
		type: ConditionType.IS_NOT_NULL,
		field,
	});

	/**
	 * @param {...(Condition|null|undefined|false)} conditions
	 * @return {Condition|null}
	 */
	const and = (...conditions) => {
		const filtered = conditions.filter(Boolean);

		if (!Type.isArrayFilled(filtered))
		{
			return null;
		}

		if (filtered.length === 1)
		{
			return filtered[0];
		}

		return Object.freeze({
			type: ConditionType.AND,
			children: filtered,
		});
	};

	/**
	 * @param {...(Condition|null|undefined|false)} conditions
	 * @return {Condition|null}
	 */
	const or = (...conditions) => {
		const filtered = conditions.filter(Boolean);

		if (!Type.isArrayFilled(filtered))
		{
			return null;
		}

		if (filtered.length === 1)
		{
			return filtered[0];
		}

		return Object.freeze({
			type: ConditionType.OR,
			children: filtered,
		});
	};

	/**
	 * @param {Condition|null|undefined|false} condition
	 * @return {NotCondition|null}
	 */
	const not = (condition) => {
		if (!condition)
		{
			return null;
		}

		return Object.freeze({
			type: ConditionType.NOT,
			child: condition,
		});
	};

	// ─── field-to-field: JOIN ON ───────────────────────────────────────

	/**
	 * @param {BaseField} leftField
	 * @param {BaseField} rightField
	 * @return {Condition}
	 */
	const equalField = (leftField, rightField) => {
		if (Type.isNil(leftField) || Type.isNil(rightField))
		{
			throw new Error('equalField: both leftField and rightField are required');
		}

		return /** @type {Condition} */ (Object.freeze({ type: ConditionType.EQUAL_FIELD, leftField, rightField }));
	};

	module.exports = {
		ConditionType,

		equal,
		notEqual,
		greaterThan,
		greaterThanOrEqual,
		lessThan,
		lessThanOrEqual,
		inList,
		notInList,
		like,
		notLike,
		isNull,
		isNotNull,

		and,
		or,
		not,
		equalField,
	};
});
