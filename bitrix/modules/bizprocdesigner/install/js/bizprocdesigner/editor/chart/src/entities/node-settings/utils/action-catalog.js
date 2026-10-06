import { ACTION_GROUP_ORDER } from '../constants';
import {
	type CatalogActionArea,
	type CatalogActionEntry,
	type CatalogActionGroup,
	type CatalogActionObject,
} from '../types';

/**
 * Mirrors the backend Searcher::normalizeActivityCode: lowercase the code and
 * strip a leading 'cbp' prefix. Catalog entry ids are normalized while the flat
 * action dictionary is keyed by the raw activity class, so navigation must
 * normalize before comparing.
 */
export const normalizeActionCode = (code: ?string): string => {
	const lower = String(code ?? '').toLowerCase();

	return lower.startsWith('cbp') ? lower.slice(3) : lower;
};

const entryHasArea = (entry: CatalogActionEntry, areaId: string): boolean => {
	return Array.isArray(entry.areas) && entry.areas.some((area) => area?.id === areaId);
};

const entryHasObject = (entry: CatalogActionEntry, objectId: string): boolean => {
	return Array.isArray(entry.objects) && entry.objects.some((object) => object?.id === objectId);
};

const isClassifiedEntry = (entry: CatalogActionEntry): boolean => {
	return Boolean(entry?.group) && Array.isArray(entry?.areas) && entry.areas.length > 0;
};

/**
 * True when every entry carries a group and at least one area, so the node can
 * be configured intent-first: universal action -> area -> object. A mixed or
 * empty catalog keeps the flat action selector.
 */
export const isFullyClassifiedCatalog = (entries: Array<CatalogActionEntry>): boolean => {
	return Array.isArray(entries) && entries.length > 0 && entries.every((entry) => isClassifiedEntry(entry));
};

/** Universal actions of the catalog, ordered as the server-side ActionGroup enum. */
export const getActionGroups = (entries: Array<CatalogActionEntry>): Array<CatalogActionGroup> => {
	const groups = new Set();
	for (const entry of (entries ?? []))
	{
		if (entry?.group)
		{
			groups.add(entry.group);
		}
	}

	const known = ACTION_GROUP_ORDER.filter((group) => groups.has(group));
	const rest = [...groups].filter((group) => !ACTION_GROUP_ORDER.includes(group));

	return [...known, ...rest].map((id) => ({ id }));
};

/** Catalog entry matching an actionId (raw flat key or normalized), or null. */
export const findEntryByActionId = (
	entries: Array<CatalogActionEntry>,
	actionId: ?string,
): CatalogActionEntry | null => {
	if (!actionId)
	{
		return null;
	}
	const normalized = normalizeActionCode(actionId);

	return entries.find((entry) => entry.id === normalized) ?? null;
};

/** Distinct areas offered by the classified actions of a group. */
export const getAreasByGroup = (
	entries: Array<CatalogActionEntry>,
	group: ?string,
): Array<CatalogActionArea> => {
	if (!group)
	{
		return [];
	}

	const seen = new Set();
	const areas = [];
	for (const entry of entries)
	{
		if (entry.group !== group || !Array.isArray(entry.areas))
		{
			continue;
		}

		for (const area of entry.areas)
		{
			if (area && !seen.has(area.id))
			{
				seen.add(area.id);
				areas.push(area);
			}
		}
	}

	return areas;
};

/** Distinct objects of a group within a given area. */
export const getObjectsByArea = (
	entries: Array<CatalogActionEntry>,
	group: ?string,
	areaId: ?string,
): Array<CatalogActionObject> => {
	if (!group || !areaId)
	{
		return [];
	}

	const seen = new Set();
	const objects = [];
	for (const entry of entries)
	{
		if (entry.group !== group || !entryHasArea(entry, areaId) || !Array.isArray(entry.objects))
		{
			continue;
		}

		for (const object of entry.objects)
		{
			if (object && object.area === areaId && !seen.has(object.id))
			{
				seen.add(object.id);
				objects.push(object);
			}
		}
	}

	return objects;
};

/** The single catalog entry executable for a (group, area[, object]) selection. */
export const findEntry = (
	entries: Array<CatalogActionEntry>,
	group: ?string,
	areaId: ?string,
	objectId: ?string = null,
): CatalogActionEntry | null => {
	if (!group || !areaId)
	{
		return null;
	}

	return entries.find((entry) => {
		return entry.group === group
			&& entryHasArea(entry, areaId)
			&& (objectId === null || entryHasObject(entry, objectId));
	}) ?? null;
};

/** Supported sources for a (group, area[, object]) selection, or null. */
export const getSourcesFor = (
	entries: Array<CatalogActionEntry>,
	group: ?string,
	areaId: ?string,
	objectId: ?string = null,
): Array<string> | null => {
	return findEntry(entries, group, areaId, objectId)?.sources ?? null;
};

/**
 * Resolves a (group, area[, object]) selection to a persistable actionId.
 * The catalog is keyed by the normalized code, so the result is mapped back to
 * the matching flat action dictionary key (the raw activity class the save
 * pipeline and the flat selector expect); falls back to the normalized id.
 */
export const resolveActionId = (
	entries: Array<CatalogActionEntry>,
	actionKeys: Array<string>,
	group: ?string,
	areaId: ?string,
	objectId: ?string = null,
): string | null => {
	const entry = findEntry(entries, group, areaId, objectId);
	if (!entry)
	{
		return null;
	}

	const flatKey = actionKeys.find((key) => normalizeActionCode(key) === entry.id);

	return flatKey ?? entry.id;
};
