// Ids reach the view in both forms: numbers from the call engine, strings from server payloads and
// from the DOM. A participant told apart by the form of the id would be treated as a stranger by
// half of the view, so the whole file asks this one question instead of comparing ids directly.
//
// Comparison is by textual form, which is not the same as the loose == this replaced. Two absent
// values are different (null is not undefined), two NaN are the same, and a numeric string written
// differently ('01') is not the number it parses to. The test next to this file pins all three.
export function isSameUser(userId, otherUserId)
{
	return String(userId) === String(otherUserId);
}
