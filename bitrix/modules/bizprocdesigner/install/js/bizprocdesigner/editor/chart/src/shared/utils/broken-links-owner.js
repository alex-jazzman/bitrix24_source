import { Type } from 'main.core';

import { parseSegments } from './expression-parser';

const PRINTABLE_SUFFIX = '_printable';
const PARAMETER_OBJECT = 'Parameter';
const TEMPLATE_OBJECT = 'Template';

/**
 * A value of a field of the settings plus an id of whatever owns it. The id is opaque here: a panel
 * passes an id of its own row, another consumer passes something else.
 */
export type BrokenLinkCandidate = {
	ownerId: mixed,
	value: mixed,
};

export type BrokenLinkOwners = {
	owners: Map<string, Array<mixed>>,
	unaddressed: Array<string>,
};

/**
 * The reference the way the server writes it into `brokenLinks`
 * ({@see \Bitrix\Bizproc\Public\Service\Template\ActivityUsageAnalyzer::analyzeUsages}): a value of a
 * field may be written otherwise, so it is the value that is brought to the server's shape and never
 * the other way round. The `_printable` suffix is cut here as well - `parseSegments()` cuts it only
 * in the lower case, while the server cuts it in any
 * ({@see \Bitrix\Bizproc\Workflow\Template\SourceType::getObjectSourceType}).
 *
 * A reference to `Workflow`, `User` or `System` is the one shape the two sides never agree on: the
 * server names the object itself the field of `System` and reports `{=User:Id}` as `{=System:User}`.
 * Such a reference matches no candidate and stays unaddressed - named in the list, leading nowhere.
 */
function canonicalRef(object: string, field: string): string
{
	const name = field.toLowerCase().endsWith(PRINTABLE_SUFFIX)
		? field.slice(0, -PRINTABLE_SUFFIX.length)
		: field
	;

	return `{=${object === PARAMETER_OBJECT ? TEMPLATE_OBJECT : object}:${name}}`;
}

/**
 * A control of a multiple or a composite value keeps it as an array or an object, and a reference sits
 * in a leaf of it.
 */
function collectStringLeaves(value: mixed, leaves: Array<string>)
{
	if (Type.isString(value))
	{
		leaves.push(value);
	}
	else if (Type.isArray(value) || Type.isPlainObject(value))
	{
		for (const item of Object.values(value))
		{
			collectStringLeaves(item, leaves);
		}
	}
}

function collectCanonicalRefs(value: mixed): Array<string>
{
	const leaves = [];
	collectStringLeaves(value, leaves);

	const refs = [];
	for (const leaf of leaves)
	{
		for (const segment of parseSegments(leaf))
		{
			if (segment.kind === 'ref')
			{
				refs.push(canonicalRef(segment.object, segment.field));
			}
		}
	}

	return refs;
}

/**
 * Which of the candidates hold each of the broken references the server reported. Whether a reference
 * is broken is the server's word alone: a reference no candidate holds stays in `unaddressed` in the
 * order of the server's list, and a broken node the server reported as a sentence rather than a
 * reference lands there as well - it names no field to look for.
 */
export function resolveBrokenLinkOwners(
	brokenLinks: Array<string>,
	candidates: Array<BrokenLinkCandidate>,
): BrokenLinkOwners
{
	const links = new Set(brokenLinks);
	const owners = new Map();

	for (const candidate of candidates)
	{
		for (const ref of collectCanonicalRefs(candidate.value))
		{
			if (!links.has(ref))
			{
				continue;
			}

			const ownerIds = owners.get(ref) ?? [];
			if (!ownerIds.includes(candidate.ownerId))
			{
				ownerIds.push(candidate.ownerId);
			}

			owners.set(ref, ownerIds);
		}
	}

	return {
		owners,
		unaddressed: [...links].filter((link) => !owners.has(link)),
	};
}
