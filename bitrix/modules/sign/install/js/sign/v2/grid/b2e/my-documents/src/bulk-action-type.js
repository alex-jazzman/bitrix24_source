// Local copy of BulkActionType from sign.v2.api: the panel needs the two action values only,
// and importing the api extension would load its whole dependency chain on every page open.
// sign.v2.api stays the contract owner; tests/unit/bulk-action-type.test.js asserts both match.
export const BulkActionType = Object.freeze({
	approve: 'approve',
	reject: 'reject',
});
