// What is left of the "Основное" layout after the section was dissolved into the recomposed tree and
// the old tree stopped being maintained (PM, 2026-09-01): the two record ids the dates row keys its
// extra markup on.

// The dates row owns two pieces of markup no other row has — the "срок" note and the
// days-before-close field under the switch. Both are keyed on these ids in CrmTypeHubCardsSection.
export const DAYS_OWNER_RECORD_ID = 'sp-begin-close-dates';
export const DAYS_RECORD_ID = 'sp-days-before-close';
