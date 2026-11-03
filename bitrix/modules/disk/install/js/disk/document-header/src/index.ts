export { DocumentHeader } from './application/document-header';
export type { MountContext } from './application/document-header';
export { HeaderElement } from './const/element';
export type { HeaderElementValue } from './const/element';
export {
	EditorAdapterInjectionKey,
	EditUrlInjectionKey,
	NameAsPageHeadingInjectionKey,
	PresentationAdapterInjectionKey,
	SaveStatusInjectionKey,
	ShowPromoImmediatelyInjectionKey,
} from './const/injection';
export { PresenceActionContract, PresencePullContract } from './const/presence';
export type { PresenceActions, PresenceConfig } from './const/presence';
export type { EditorAdapter, PresentationAdapter, SaveState, SaveStatus } from './const/adapter';
export { useCompositionStore } from './model/composition/composition';
export { usePresenceStore } from './model/presence/presence';
export { documentHeaderService, HeaderServiceErrorCode } from './infrastructure/service/document-header/document-header';
export {
	mapCompositionDtoToModel,
	mapPresenceDtoToModel,
	mapRenameDto,
} from './infrastructure/service/document-header/mappers';
export type {
	CompositionDto,
	CompositionRequest,
	EditorDto,
	HeaderServiceError,
	HeaderServiceResult,
	ParticipantDto,
	PresenceDto,
	PresenceRequest,
	RenameDto,
	RenameRequest,
} from './infrastructure/service/document-header/types';
export { PresenceChannel } from './infrastructure/pull/presence/presence';
export { applyComposition, loadComposition } from './feature/load-composition/load-composition';
export type { LoadCompositionResult } from './feature/load-composition/load-composition';
export { renameObject, RenameRefusal } from './feature/rename-object/rename-object';
export type { RenameRefusalValue, RenameResult } from './feature/rename-object/rename-object';
export {
	applyPresenceConfig,
	loadInitialPresence,
	syncPresenceFromPull,
} from './feature/sync-presence/sync-presence';
export type { PresenceLoadResult } from './feature/sync-presence/sync-presence';
export { copyLink } from './feature/copy-link/copy-link';
export { showBoost } from './feature/show-boost/show-boost';
export type {
	SessionBoostContext,
	ShowBoostRequest,
	UserOptionAddress,
} from './feature/show-boost/show-boost';
export { showPromo } from './feature/show-promo/show-promo';
export { loadPromoGate } from './feature/promo-gate/promo-gate';
export type { PromoGate } from './feature/promo-gate/promo-gate';
export { openAccess, openAccessPopup } from './feature/open-access-popup/open-access-popup';
export { BeforeStartEditEvent, ServerChosenEditor, startEdit } from './feature/start-edit/start-edit';
export type { StartEditOutcome, StartEditRequest } from './feature/start-edit/start-edit';
export { FullscreenPresentation } from './feature/presentation/presentation';
export {
	CaptionsFitWidth,
	HeaderWidthLevel,
	IconWordsFitWidth,
	observeContainerWidth,
	resolveAdaptation,
} from './lib/container-width/container-width';
export type { HeaderWidthLevelValue, WidthAdaptation } from './lib/container-width/container-width';
export { ActionBar } from './component/action-bar/action-bar';
export { BoostSlot } from './component/boost-slot/boost-slot';
export { ContentWarning } from './component/content-warning/content-warning';
export { EditAction } from './component/edit-action/edit-action';
export { Header } from './component/header/header';
export { ObjectName } from './component/object-name/object-name';
export { PresenceStack } from './component/presence-stack/presence-stack';
export { SaveStatusIndicator } from './component/save-status-indicator/save-status-indicator';
export type {
	CompositionAccess,
	CompositionMode,
	CompositionModel,
	CompositionObject,
	CompositionState,
	CompositionUrls,
	EditorItem,
	ObjectType,
} from './model/composition/types';
export type {
	PresenceParticipant,
	PresenceRoster,
	PresenceState,
} from './model/presence/types';
