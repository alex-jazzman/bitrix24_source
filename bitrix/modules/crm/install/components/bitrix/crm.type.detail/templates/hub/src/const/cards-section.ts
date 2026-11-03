// Shape of a "grid of feature cards" section: the one form four sections of the hub share
// ("Карточка процесса", "Процесс", "Автоматизация", "Товары и документы"; with the option off —
// "Основное", "Возможности", "Товары и документы"). One component reads it,
// CrmTypeHubCardsSection, so the fourth section of the new tree costs a data literal instead of a
// fourth copy of the same 200-line component (the duplication the project has been carrying since
// features/products).

// The route out of a row: a secondary button under the description, shown only while the setting
// above it is on. It replaces the ExtraLayout row of the grey block the sections used to draw under
// the card — the mockup of the second screen puts the button inside its own row instead.
//
// The gate came for free in the move. Every extra row of the old block named the flag of the very
// row it belonged to (funnels editor ↔ isCategoriesEnabled, bin ↔ isRecyclebinEnabled, templates ↔
// isDocumentsEnabled, requisites ↔ isMycompanyEnabled), so "visible while the capability is on" is
// now just the row's own `checked` and needs no `dependsOn` field to carry it.
export type FeatureCardAction = {
	// Phrase code of the button caption. It says where the button goes ("Редактор воронок и
	// туннелей"), because the row above already says what the setting is.
	text: string;
	// Action key emitted to the app; every key of the hub lives in action-keys.ts.
	actionKey: string;
	// Icon name of the ui.icon-set Outline set, left of the caption.
	icon?: string;
};

// One tile of the grid: which descriptor record owns the value, plus the visual attributes the
// record itself does not carry. Icon names are plain string literals of the ui.icon-set Outline set
// (same reason as SpControlType: this module stays importable in the bare unit harness).
export type FeatureCardLayout = {
	// id of the SP_HUB_RECORDS entry that owns the value
	recordId: string;
	icon: string;
	// Phrase code; falls back to the record title only when unset — same `??` rule as `description`
	// below, so an explicit '' here is a deliberate override too, not "unset".
	title?: string;
	// Phrase code; when set it OVERRIDES the record's own `ScalarRecord.description` (see
	// resolveFeatureCardCopy) — the short card copy lives here instead of in the descriptor, so
	// descriptor.ts stays untouched (its author owns it, edits there must be additive only).
	description?: string;
	// Secondary button under the description, drawn only while this row is on.
	action?: FeatureCardAction;
};

// Microtext above the grid.
export type CardsSectionIntro = {
	text: string;
};

export type CardsSectionLayout = {
	sectionId: string;
	// Root class of the section wrapper; each section keeps its own so section-specific CSS still
	// has a hook, even though today all of them are the same flex column.
	rootClass: string;
	cardId: string;
	// Phrase code of the white card's own header (the section heading itself is visually hidden,
	// hideTitle: true — see D-18).
	title: string;
	icon: string;
	intro?: CardsSectionIntro;
	cards: FeatureCardLayout[];
	// Record ids the layout draws itself. Everything else that belongs to the section is rendered by
	// the generic CrmHubControlRenderer fallback, so raising SUPPLY_STEP can never drop a record off
	// the screen silently.
	layoutRecordIds: string[];
};
