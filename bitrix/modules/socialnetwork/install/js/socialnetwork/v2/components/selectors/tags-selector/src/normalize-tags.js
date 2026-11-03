export function normalizeTags(query: string): string[]
{
	return query
		.toLowerCase()
		.split(',')
		.map((tag) => tag.trim())
		.filter((tag) => tag.length > 0)
	;
}
