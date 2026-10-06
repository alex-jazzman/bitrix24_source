/**
 * Arguments for deciding whether to apply an incoming AI-agent graph.
 * All values are numbers (store and incoming-event draftId/templateId).
 */
export type ResolveAgentDraftApplyParams = {
	storeDraftId: number,
	storeTemplateId: number,
	incomingDraftId: number,
	incomingTemplateId: number,
};

/**
 * Decision result:
 *  - shouldApply     — whether to apply the incoming graph to the diagram;
 *  - draftIdToAdopt  — draftId to adopt into the store (null — nothing to adopt).
 */
export type ResolveAgentDraftApplyResult = {
	shouldApply: boolean,
	draftIdToAdopt: number | null,
};

/**
 * Decides whether to apply an incoming AI-agent update and whether to adopt its draftId.
 *
 * Invariant: the first update for an open template establishes the local draft session.
 * On a fresh editor session storeDraftId === 0 (no draft session yet), while the agent sends its
 * own new draftId. This first update must be accepted and its draftId adopted, otherwise the
 * agent first update is lost. Subsequent updates are applied only if their draftId matches the
 * current draft session (a foreign/stale draft is discarded).
 */
export function resolveAgentDraftApply(params: ResolveAgentDraftApplyParams): ResolveAgentDraftApplyResult
{
	const { storeDraftId, storeTemplateId, incomingDraftId, incomingTemplateId } = params;

	if (storeTemplateId === 0 || incomingTemplateId !== storeTemplateId)
	{
		return { shouldApply: false, draftIdToAdopt: null };
	}

	if (storeDraftId === 0)
	{
		return { shouldApply: true, draftIdToAdopt: incomingDraftId };
	}

	if (incomingDraftId !== storeDraftId)
	{
		return { shouldApply: false, draftIdToAdopt: null };
	}

	return { shouldApply: true, draftIdToAdopt: null };
}
