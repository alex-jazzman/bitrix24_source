// Phrase code for one field (title or description) of a feature card: the layout's own value
// OVERRIDES the descriptor record's, the record is the fallback, and an unset pair resolves to ''
// (CrmHubFeatureCard only renders `description` when it is truthy, so '' correctly hides it).
// `??`, not `||`, so an explicit '' from the layout is still a deliberate override, not "unset".
//
// This priority is what lets task-10's short card copy live in the layout instead of an
// (additive-only) edit to descriptor.ts. It is generic over title and description because both
// fields need the exact same rule; "Main" section is unaffected since MAIN_FEATURE_CARDS passes no
// layout value for `description` — the record still wins there and D-17 keeps working unchanged.
export function resolveFeatureCardCopy(layoutValue: string | undefined, recordValue: string | undefined): string
{
	return layoutValue ?? recordValue ?? '';
}
