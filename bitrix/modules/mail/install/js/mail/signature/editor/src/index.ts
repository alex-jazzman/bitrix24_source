export { SignatureEditor } from './signature-editor';
export { SignatureMacroCatalog } from './macro-catalog';
export {
	SignatureMacroCapability,
	buildSignatureMacroMenuOptions,
	findFirstUnknownMacro,
} from './signature-macro-capability';
export { SenderBindingPanel } from './sender-binding-panel';
export type { SenderBindingPanelOptions } from './sender-binding-panel';
export {
	SENDER_OPTION_ENTITY_ID,
	buildSenderSelectorItems,
	getInitialSenderOptionId,
	getSenderValueById,
} from './sender-options';
export type { SenderSelectorItem } from './sender-options';
export { CompositeTransport, needsUnifiedTransport } from './composite-transport';
export type { CompositeTransportOptions, UnifiedTransportCondition } from './composite-transport';
export { AssignmentTypeSelector } from './assignment-type-selector';
export type { AssignmentTypeSelectorOptions } from './assignment-type-selector';
export { AssignmentBlock } from './assignment-block';
export type { AssignmentBlockOptions } from './assignment-block';
export {
	ASSIGNMENT_MODES,
	DEFAULT_ASSIGNMENT_MODE,
	detectAssignmentMode,
	modeRequiresTargets,
} from './assignment-mode';
export { UserSignatureTransport } from './transport/user-signature';
export { SharedSignatureTransport } from './transport/shared-signature';
export { UnifiedSignatureTransport } from './transport/unified-signature';
export {
	ASSIGNMENTS_PROVIDED,
	buildUserSignatureSaveRequest,
	buildSharedSignatureSaveRequest,
	buildUnifiedSignatureUpdateRequest,
	extractUserSignatureId,
	extractSharedSignatureId,
	pickPanelData,
} from './save-request';
export type {
	Assignment,
	AssignmentMode,
	EditorPanels,
	PanelKind,
	PanelSaveData,
	PanelSlot,
	SavePayload,
	SaveRequest,
	ScopeCardSlot,
	SenderOption,
	SignatureEditorOptions,
	SignatureEditorCapability,
	SignatureEditorContext,
	SignatureHtmlEditor,
	SignatureMacroCapabilityOptions,
	SignatureMacroCatalogDto,
	SignatureMacroCatalogGroup,
	SignatureMacroCatalogGroupDto,
	SignatureMacroCatalogItem,
	SignatureMacroCatalogItemDto,
	SignatureTransport,
	SliderMessage,
} from './types';
