import {
	appendOperand,
	buildFormulaString,
	canGroupOperands,
	describeFormulaParts,
	describeOperandParts,
	evaluateFormulaDraft,
	fitsOperandLength,
	groupOperands,
	isCanonicalDraft,
	isNumberLiteral,
	isSingleTerm,
	isSingleTermOperand,
	isSourceReference,
	omitsGroupParens,
	removeOperand,
	setOperand,
	setSign,
	ungroupOperands,
	CALC_OP,
	CALC_OPERATIONS,
	FORMULA_PART,
	PREVIEW_KIND,
	PREVIEW_WARNING,
	type FormulaDraft,
	type FormulaGroup,
	type FormulaPart,
	type PreviewResult,
} from '../formula-draft/formula-draft';
import {
	recognizeFieldValue,
	type RecognizedValue,
} from '../field-value-recognition/field-value-recognition';

// The calculator side of the expression builder. The chain, its assembly, the preview, the highlight
// parts and the recognition of a saved value all belong to the flat draft model of `formula-draft`
// and to the one scan of `expression-tokenizer`; the window reaches them through this one file and
// parses nothing of its own.

export {
	appendOperand,
	buildFormulaString,
	canGroupOperands,
	describeFormulaParts,
	describeOperandParts,
	evaluateFormulaDraft,
	fitsOperandLength,
	groupOperands,
	isCanonicalDraft,
	isNumberLiteral,
	isSingleTerm,
	isSingleTermOperand,
	isSourceReference,
	omitsGroupParens,
	recognizeFieldValue,
	removeOperand,
	setOperand,
	setSign,
	ungroupOperands,
	CALC_OP,
	CALC_OPERATIONS,
	FORMULA_PART,
	PREVIEW_KIND,
	PREVIEW_WARNING,
};

export type { FormulaDraft, FormulaGroup, FormulaPart, PreviewResult, RecognizedValue };
