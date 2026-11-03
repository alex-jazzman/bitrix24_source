import './style.css';

export { FieldRegistry } from './feature/field-registry/field-registry';
export { BaseField } from './model/base-field/base-field';
export { FieldManager } from './feature/field-manager/field-manager';
export { initFieldHints } from './model/field-layout/field-layout';
export { isExpressionValue, splitTopLevelValues } from './lib/expression/expression';
export { BoolView, readBoolView } from './lib/bool-view/bool-view';
export { SelectView, readSelectView } from './lib/select-view/select-view';
// The row a type places its own companion in wears it: that is how the core finds the row back
// from the companion (BaseField.#expressionRowOf) and lays it out under the control.
export { EXPRESSION_ROW_CLASS } from './model/base-field/expression-control';

export type {
	FieldValueState,
	NameBlockPlacementValue,
	Property,
	RenderedControl,
	RenderedField,
	RenderFieldParams,
	ValueModeValue,
} from './const/type';
export type { BoolViewValue } from './lib/bool-view/bool-view';
export type { SelectViewValue } from './lib/select-view/select-view';
export type { ValueModeLabels } from './model/value-mode/value-mode';
export type { FieldManagerOptions, RenderCollectionItem } from './feature/field-manager/field-manager';
export type { SelectionProvider, SelectionContext } from './model/selection/selection';
// Insertion is opt-in by design (see resolveSelectionProvider): only the caller knows which
// environment its fields are rendered into, so it names the adapter rather than the framework.
export { AutomationSelectionProvider } from './infrastructure/service/automation-selection/automation-selection';
export { NullSelectionProvider } from './model/selection/null-selection-provider';
export { RenderMode, EventName, NameBlockPlacement, ValueMode } from './const/const';
