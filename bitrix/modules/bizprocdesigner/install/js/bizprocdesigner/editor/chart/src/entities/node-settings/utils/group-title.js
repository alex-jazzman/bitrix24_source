const GROUP_INDEX_MARKER = '#N#';

/**
 * Next default group index: max(N parsed from titles matching the
 * default-title template, e.g. 'Group #N#') + 1 — so deleted/renamed cards
 * cannot cause duplicate default names like two 'Group 3'.
 *
 * @param ruleCards cards of the current rule
 * @param titleTemplate raw localized template containing the #N# marker
 */
export const getNextGroupIndex = (
	ruleCards: Array<{ groupTitle?: string }>,
	titleTemplate: string,
): number => {
	const escapedTemplate = titleTemplate
		.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
		.replace(GROUP_INDEX_MARKER, String.raw`(\d+)`);
	const titleRegExp = new RegExp(`^${escapedTemplate}$`);

	const maxIndex = ruleCards.reduce((max, ruleCard) => {
		const match = (ruleCard.groupTitle ?? '').match(titleRegExp);

		return match ? Math.max(max, parseInt(match[1], 10)) : max;
	}, 0);

	return maxIndex + 1;
};
