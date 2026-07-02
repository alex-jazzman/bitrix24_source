/**
 * Type declarations for the Condition AST — frozen plain objects created
 * by named factory functions.
 *
 * Each condition is a frozen object with a `type` discriminator field.
 * Structural shape depends on the category:
 * - Comparison: { type, field, value }
 * - List: { type, field, values }
 * - Pattern: { type, field, pattern }
 * - NullCheck: { type, field }
 * - Composite: { type, children }
 * - Not: { type, child }
 */

import { BaseField } from '../../../field/types/fields';

export interface ComparisonCondition {
	readonly type: 'equal' | 'notEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual';
	readonly field: BaseField;
	readonly value: any;
}

export interface ListCondition {
	readonly type: 'in' | 'notIn';
	readonly field: BaseField;
	readonly values: any[];
}

export interface PatternCondition {
	readonly type: 'like' | 'notLike';
	readonly field: BaseField;
	readonly pattern: string;
}

export interface NullCheckCondition {
	readonly type: 'isNull' | 'isNotNull';
	readonly field: BaseField;
}

export interface AndCondition {
	readonly type: 'and';
	readonly children: Condition[];
}

export interface OrCondition {
	readonly type: 'or';
	readonly children: Condition[];
}

export interface NotCondition {
	readonly type: 'not';
	readonly child: Condition;
}

export interface EqualFieldCondition {
	readonly type: 'equalField';
	readonly leftField: BaseField;
	readonly rightField: BaseField;
}

export type Condition =
	| ComparisonCondition
	| ListCondition
	| PatternCondition
	| NullCheckCondition
	| AndCondition
	| OrCondition
	| NotCondition
	| EqualFieldCondition;

export declare const ConditionType: {
	readonly EQUAL: 'equal';
	readonly NOT_EQUAL: 'notEqual';
	readonly GREATER_THAN: 'greaterThan';
	readonly GREATER_THAN_OR_EQUAL: 'greaterThanOrEqual';
	readonly LESS_THAN: 'lessThan';
	readonly LESS_THAN_OR_EQUAL: 'lessThanOrEqual';
	readonly IN: 'in';
	readonly NOT_IN: 'notIn';
	readonly LIKE: 'like';
	readonly NOT_LIKE: 'notLike';
	readonly IS_NULL: 'isNull';
	readonly IS_NOT_NULL: 'isNotNull';
	readonly AND: 'and';
	readonly OR: 'or';
	readonly NOT: 'not';
	readonly EQUAL_FIELD: 'equalField';
};

// ─── Factories ──────────────────────────────────────────────────────────

export declare function equal(field: BaseField, value: any): ComparisonCondition;
export declare function notEqual(field: BaseField, value: any): ComparisonCondition;
export declare function greaterThan(field: BaseField, value: any): ComparisonCondition;
export declare function greaterThanOrEqual(field: BaseField, value: any): ComparisonCondition;
export declare function lessThan(field: BaseField, value: any): ComparisonCondition;
export declare function lessThanOrEqual(field: BaseField, value: any): ComparisonCondition;

export declare function inList(field: BaseField, values: any[]): ListCondition;
export declare function notInList(field: BaseField, values: any[]): ListCondition;

export declare function like(field: BaseField, pattern: string): PatternCondition;
export declare function notLike(field: BaseField, pattern: string): PatternCondition;

export declare function isNull(field: BaseField): NullCheckCondition;
export declare function isNotNull(field: BaseField): NullCheckCondition;

export declare function and(...conditions: (Condition | null | undefined | false)[]): Condition | null;
export declare function or(...conditions: (Condition | null | undefined | false)[]): Condition | null;
export declare function not(condition: Condition | null | undefined | false): NotCondition | null;

export declare function equalField(leftField: BaseField, rightField: BaseField): EqualFieldCondition;
