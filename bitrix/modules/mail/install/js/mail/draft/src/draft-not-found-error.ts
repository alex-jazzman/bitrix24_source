export class DraftNotFoundError extends Error
{
	// mirrors the ajax error payload so a missing draft is recognised the same way in both contexts
	errors: Array<{ code: string }> = [{ code: 'DRAFT_NOT_FOUND' }];
}
