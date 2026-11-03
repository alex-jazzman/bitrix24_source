// Layout of the hub header: the passport is not a section but the shell's own slot, shown above
// every section including the two the recomposition does not touch.

// Records the passport draws itself. The tree gives them sectionId 'passport' and no section renders
// them, so the two lists have to agree — a test holds them equal.
export const PASSPORT_LAYOUT_RECORD_IDS: string[] = ['sp-title', 'sp-description', 'sp-custom-section'];
