import { CONSTRUCTION_GROUPS, CONSTRUCTION_TYPES } from '../constants';
import { type Construction, type TRuleCard } from '../types';

export type HeadConstruction = {
	ruleCard: TRuleCard,
	construction: Construction,
};

export type RulesSurface = {
	headConstructions: Array<HeadConstruction>,
	groupCards: Array<TRuleCard>,
};

const CONDITION_TYPES: Set<string> = new Set(Object.values(CONSTRUCTION_TYPES.CONDITION));

// Blocks that live above the groups: one base-settings, then the filters.
const HEAD_CONSTRUCTION_TYPES: Set<string> = new Set([
	CONSTRUCTION_TYPES.BASE_SETTINGS,
	CONSTRUCTION_TYPES.FILTER,
]);

export const isHeadConstructionType = (type: string): boolean => {
	return HEAD_CONSTRUCTION_TYPES.has(type);
};

/**
 * Group name a construction is rendered under inside a group card,
 * or null for the head blocks which never form a group.
 */
export const getGroupConstructionName = (type: string): string | null => {
	if (CONDITION_TYPES.has(type))
	{
		return CONSTRUCTION_GROUPS.conditions;
	}

	if (type === CONSTRUCTION_TYPES.ACTION)
	{
		return CONSTRUCTION_GROUPS.actions;
	}

	if (type === CONSTRUCTION_TYPES.OUTPUT)
	{
		return CONSTRUCTION_GROUPS.outputs;
	}

	return null;
};

// Canonical order of the constructions inside a card: the head blocks above the groups
// (base-settings, then the filters, the order the head area lays them out), then the group
// sections in the order a group card renders them. A head block is keyed by its own type,
// a group construction by its group name.
const CONSTRUCTION_SECTION_ORDER: Array<string> = [
	CONSTRUCTION_TYPES.BASE_SETTINGS,
	CONSTRUCTION_TYPES.FILTER,
	CONSTRUCTION_GROUPS.conditions,
	CONSTRUCTION_GROUPS.actions,
	CONSTRUCTION_GROUPS.outputs,
];

// A type neither the head area nor a group card knows (a newer type, a damaged payload) takes the
// last position: it is invisible either way, and the head position would hide it above the blocks
// the user does see.
const UNKNOWN_SECTION_INDEX = CONSTRUCTION_SECTION_ORDER.length;

const getConstructionSectionIndex = (type: string): number => {
	const sectionKey = isHeadConstructionType(type) ? type : getGroupConstructionName(type);
	const sectionIndex = sectionKey === null ? -1 : CONSTRUCTION_SECTION_ORDER.indexOf(sectionKey);

	return sectionIndex === -1 ? UNKNOWN_SECTION_INDEX : sectionIndex;
};

/**
 * Position a new construction takes inside a card: right after the last construction of its own
 * or of an earlier section. The card renders the sections in a fixed order while the saved payload
 * order is the one the server turns into the node graph, so the insertion keeps the two in step.
 * Inside one section the constructions stay in the order they were added.
 */
export const findConstructionInsertIndex = (
	constructions: Array<Construction>,
	constructionType: string,
): number => {
	const items = constructions ?? [];
	const sectionIndex = getConstructionSectionIndex(constructionType);
	const nextSectionAt = items.findIndex(
		(construction: Construction) => getConstructionSectionIndex(construction.type) > sectionIndex,
	);

	return nextSectionAt === -1 ? items.length : nextSectionAt;
};

/**
 * Constructions of a card in the canonical order: the head blocks first, then the group sections in
 * the order the card renders them, stable inside a section. Insertion already places a construction
 * on the position of its own section (findConstructionInsertIndex); a manual move (drag and drop)
 * is normalised through here, so the saved order — the one the server turns into the node graph —
 * cannot drift away from the rendered one.
 */
export const sortConstructionsCanonically = (constructions: Array<Construction>): Array<Construction> => {
	return (constructions ?? [])
		.map((construction: Construction, index: number) => ({ construction, index }))
		.sort((left, right) => {
			const bySection = getConstructionSectionIndex(left.construction.type)
				- getConstructionSectionIndex(right.construction.type);

			return bySection === 0 ? left.index - right.index : bySection;
		})
		.map((item) => item.construction);
};

/**
 * Cards of one rule with the constructions of every card put in the canonical order.
 * Applied to a loaded payload: a template saved before the fixed section order keeps the
 * constructions in the order they were added, so the panel would render the sections one way while
 * the server turns the very same payload into the node graph the other way. The store applies this
 * after taking the saved-state snapshot, so a node the normalisation really changed reads as
 * modified: the rendered order, the payload and the node graph come back in step on the next save,
 * and that save is the user's own deliberate action.
 */
export const sortRuleCardConstructionsCanonically = (ruleCards: Array<TRuleCard>): Array<TRuleCard> => {
	return (ruleCards ?? []).map((ruleCard: TRuleCard) => ({
		...ruleCard,
		constructions: sortConstructionsCanonically(ruleCard.constructions),
	}));
};

const hasGroupConstruction = (ruleCard: TRuleCard): boolean => {
	return (ruleCard.constructions ?? []).some(
		(construction: Construction) => getGroupConstructionName(construction.type) !== null,
	);
};

/**
 * Cards rendered as groups: the ones holding at least one group construction plus
 * the still empty ones (an empty group added from the "..." menu must stay visible).
 */
export const getGroupRuleCards = (ruleCards: Array<TRuleCard>): Array<TRuleCard> => {
	return (ruleCards ?? []).filter(
		(ruleCard: TRuleCard) => (ruleCard.constructions ?? []).length === 0 || hasGroupConstruction(ruleCard),
	);
};

/**
 * Splits the cards of one rule into the head area and the group cards.
 * The head area is collected per construction, not per card: a legacy node keeping
 * base-settings inside a mixed card renders that block on top while the rest of the
 * card stays a group. The wire format is untouched.
 */
export const splitRulesSurface = (ruleCards: Array<TRuleCard>): RulesSurface => {
	const baseSettings: Array<HeadConstruction> = [];
	const filters: Array<HeadConstruction> = [];

	(ruleCards ?? []).forEach((ruleCard: TRuleCard) => {
		(ruleCard.constructions ?? []).forEach((construction: Construction) => {
			if (construction.type === CONSTRUCTION_TYPES.BASE_SETTINGS)
			{
				baseSettings.push({ ruleCard, construction });

				return;
			}

			if (construction.type === CONSTRUCTION_TYPES.FILTER)
			{
				filters.push({ ruleCard, construction });
			}
		});
	});

	return {
		headConstructions: [...baseSettings, ...filters],
		groupCards: getGroupRuleCards(ruleCards),
	};
};

/**
 * Card hosting the head blocks: the first one holding head constructions only.
 * Returns null when there is none, so the caller then creates it.
 */
export const findHeadRuleCard = (ruleCards: Array<TRuleCard>): TRuleCard | null => {
	return (ruleCards ?? []).find((ruleCard: TRuleCard) => {
		const constructions = ruleCard.constructions ?? [];

		return constructions.some((construction: Construction) => isHeadConstructionType(construction.type))
			&& !hasGroupConstruction(ruleCard);
	}) ?? null;
};

/**
 * Position a new head card takes among the cards of a rule: right after the last card already
 * holding head constructions. The head area lays its blocks out in card order, so on a legacy node
 * keeping a filter inside a mixed card — one findHeadRuleCard cannot reuse — the freshly added
 * block would otherwise render above the older one. With no such card the head card goes first,
 * above the groups. Only the placement of the new card is decided here: the cards already saved
 * keep their order, so the payload the server turns into the node graph stays untouched.
 */
export const findHeadRuleCardInsertIndex = (ruleCards: Array<TRuleCard>): number => {
	const cards = ruleCards ?? [];
	const lastHeadCardAt = cards.reduce((lastIndex: number, ruleCard: TRuleCard, index: number) => {
		const hasHeadConstruction = (ruleCard.constructions ?? []).some(
			(construction: Construction) => isHeadConstructionType(construction.type),
		);

		return hasHeadConstruction ? index : lastIndex;
	}, -1);

	return lastHeadCardAt + 1;
};

/**
 * Group card a toolbar chip adds the construction to: the last group, but only while it
 * holds no construction of that group yet. Returns null when a new group is due
 * (no groups at all, or the type repeats), per the mockup rule of CardSettingsRules.addCard.
 */
export const findGroupRuleCardForType = (
	ruleCards: Array<TRuleCard>,
	constructionType: string,
): TRuleCard | null => {
	const groupName = getGroupConstructionName(constructionType);
	if (!groupName)
	{
		return null;
	}

	const groupCards = getGroupRuleCards(ruleCards);
	const lastGroupCard = groupCards[groupCards.length - 1] ?? null;
	if (!lastGroupCard)
	{
		return null;
	}

	const hasSameGroup = (lastGroupCard.constructions ?? []).some(
		(construction: Construction) => getGroupConstructionName(construction.type) === groupName,
	);

	return hasSameGroup ? null : lastGroupCard;
};
