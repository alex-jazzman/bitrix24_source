import { PORT_TYPES } from '../../../shared/constants';
import { type PortId } from '../../../shared/types';
import { resolveBrokenLinkOwners } from '../../../shared/utils';
import { PORTLESS_RULES_KEY } from '../api';
import { PORTLESS_RULE } from '../stores/node-settings-store';
import { type Construction, type NodeSettings, type Rule, type TRuleCard } from '../types';

// The node title as an owner of a reference. A symbol and not a string: the id is opaque to the
// matching utility and is compared by `includes`, so a symbol cannot be met by an id of a construction.
const TITLE_OWNER_ID = Symbol('nodeTitle');

// Keys of an expression a reference is allowed to be read from. The caption `title` of a construction
// is deliberately out: it is shown to the user, while the matching utility unfolds a value down to its
// string leaves and would take that caption for the place of the error.
const PAYLOAD_KEYS = ['value', 'field', 'document', 'activityData', 'rawActivityData'];

// The sections of the panel in the order the warnings are laid out in.
const SECTIONS = ['general', 'rules', 'relations'];

/**
 * The rule a construction belongs to, in the very shape the panel addresses a rule by: an input port,
 * a relation port, or the reserved rules container of a node without input ports (`PORTLESS_RULE`).
 */
export type NodeBrokenLinkRulePort = {
	id: PortId,
	type: string,
	title?: string,
};

/**
 * Where the panel leads for a reference. Absent for a reference written in the title of the node: the
 * row selector of the panel knows the constructions alone.
 */
export type NodeBrokenLinkTarget = {
	constructionId: string,
	rulePort: NodeBrokenLinkRulePort | null,
};

export type NodeBrokenLinkItem = {
	link: string,
	target: NodeBrokenLinkTarget | null,
};

export type NodeBrokenLinkSections = {
	general: Array<NodeBrokenLinkItem>,
	rules: Array<NodeBrokenLinkItem>,
	relations: Array<NodeBrokenLinkItem>,
};

// A place a reference may be written in, plus the section that place belongs to.
type SectionCandidate = {
	ownerId: mixed,
	section: string,
	rulePort: NodeBrokenLinkRulePort | null,
	value: mixed,
};

function payloadOf(expression: mixed): Array<mixed>
{
	return PAYLOAD_KEYS.map((key) => expression?.[key]);
}

function rulePortOf(ruleKey: string): NodeBrokenLinkRulePort
{
	return ruleKey === PORTLESS_RULES_KEY
		? PORTLESS_RULE
		: { id: ruleKey, type: PORT_TYPES.input }
	;
}

function relationPortOf(ruleKey: string): NodeBrokenLinkRulePort
{
	return { id: ruleKey, type: PORT_TYPES.inputRelation };
}

/**
 * A candidate for every construction of every card of every rule: a reference belongs to the
 * construction it is written in, and the construction is what the panel is able to lead to.
 */
function collectCandidates(
	rules: ?Map<string, Rule>,
	section: string,
	toRulePort: (ruleKey: string) => NodeBrokenLinkRulePort,
): Array<SectionCandidate>
{
	const candidates = [];
	for (const [ruleKey, rule] of (rules ?? []))
	{
		const rulePort = toRulePort(ruleKey);
		for (const ruleCard: TRuleCard of (rule?.ruleCards ?? []))
		{
			for (const construction: Construction of (ruleCard?.constructions ?? []))
			{
				candidates.push({
					ownerId: construction.id,
					section,
					rulePort,
					value: payloadOf(construction.expression),
				});
			}
		}
	}

	return candidates;
}

function targetOf(owner: SectionCandidate): NodeBrokenLinkTarget | null
{
	if (owner.ownerId === TITLE_OWNER_ID)
	{
		return null;
	}

	return { constructionId: owner.ownerId, rulePort: owner.rulePort };
}

/**
 * Which section of the panel names each of the broken references the server reported. Whether a
 * reference is broken is the server's word alone: nothing is recounted here and nothing is left out
 * of the list.
 *
 * A reference is named once per section, and the owners of a section are folded into a single place to
 * go to, so a reference written in two sections is named in both. A reference no construction and no
 * title of the node claims goes to the general section, as the only place able to speak for the node
 * as a whole - the same place a reference written in the title of the node lands in, and neither of
 * the two leads anywhere.
 *
 * Which of the sections are laid out at all is not known here: that is the caller's to gate.
 */
export function resolveNodeBrokenLinkSections(
	brokenLinks: { [key: string]: string },
	nodeSettings: NodeSettings | null,
): NodeBrokenLinkSections
{
	const sections = { general: [], rules: [], relations: [] };
	// The server sends the list as a map of a reference to itself, while the matching utility takes an
	// array of references.
	const links = Object.values(brokenLinks ?? {});
	if (links.length === 0)
	{
		return sections;
	}

	const candidates = [
		...collectCandidates(nodeSettings?.rules, 'rules', rulePortOf),
		...collectCandidates(nodeSettings?.relations, 'relations', relationPortOf),
		{ ownerId: TITLE_OWNER_ID, section: 'general', rulePort: null, value: nodeSettings?.title },
	];

	const { owners } = resolveBrokenLinkOwners(
		links,
		candidates.map(({ ownerId, value }) => ({ ownerId, value })),
	);
	const candidateById = new Map(candidates.map((candidate) => [candidate.ownerId, candidate]));

	links.forEach((link) => {
		// The utility answers with the very ids it was given, so every owner of a link is found in the
		// map built from the same candidates.
		const linkOwners = (owners.get(link) ?? []).map((ownerId) => candidateById.get(ownerId));
		if (linkOwners.length === 0)
		{
			sections.general.push({ link, target: null });

			return;
		}

		SECTIONS.forEach((section) => {
			// The owners keep the order of the candidates, which keeps the order of the constructions in
			// the store: the first one of the section is the place the section leads to.
			const sectionOwner = linkOwners.find((owner) => owner.section === section);
			if (sectionOwner)
			{
				sections[section].push({ link, target: targetOf(sectionOwner) });
			}
		});
	});

	return sections;
}
