import { Type } from 'main.core';

import { FILE_TYPE_ALIASES, OBJECT_TYPE_FILTERS, ObjectTypeFilter } from '../../const/picker';
import {
	type NormalizedFilterValues,
	type ObjectTypeFilterValue,
	type FileTypeFilterValue,
} from '../../const/types';

type FilterApi = {
	setFields?: (fields: { [key: string]: any }) => void,
	apply?: () => void,
};

type StandardFilter = {
	getFilterFieldsValues?: () => { [key: string]: any },
	getApi?: () => FilterApi,
};

export const FilterFieldId = Object.freeze({
	Find: 'FIND',
	ObjectType: 'OBJECT_TYPE_FILTER',
	FileType: 'FILE_TYPE_FILTERS',
});

const MAX_FIND_LENGTH = 255;

// Matches the server-side `mb_strlen` bound: count by Unicode code points, not UTF-16 units.
function limitFind(value: any): string
{
	if (!Type.isStringFilled(value))
	{
		return '';
	}

	return [...value.trim()].slice(0, MAX_FIND_LENGTH).join('');
}

function readObjectType(raw: { [key: string]: any }): string
{
	const value = raw[FilterFieldId.ObjectType];

	return Type.isStringFilled(value) ? value : ObjectTypeFilter.All;
}

function readFileTypes(raw: { [key: string]: any }): string[]
{
	const value = raw[FilterFieldId.FileType];

	// A multiselect value arrives as an array from a typed selection, but the standard
	// component hands back a numeric-keyed object (e.g. `{0: 'image'}`) when the value
	// comes from an applied preset. Both are read as a plain list of aliases.
	const aliases = Type.isArray(value)
		? value
		: (Type.isPlainObject(value) ? Object.values(value) : []);

	return aliases.filter((alias) => Type.isStringFilled(alias));
}

export function normalizeFilterValues(raw: { [key: string]: any }): NormalizedFilterValues
{
	const source = Type.isPlainObject(raw) ? raw : {};
	const find = limitFind(source[FilterFieldId.Find]);
	let objectTypeFilter = readObjectType(source);
	let fileTypeFilters = readFileTypes(source);

	const isObjectTypeKnown = OBJECT_TYPE_FILTERS.includes(objectTypeFilter);
	const areFileTypesKnown = fileTypeFilters.every((alias) => FILE_TYPE_ALIASES.includes(alias));

	if (!isObjectTypeKnown || !areFileTypesKnown)
	{
		// Any unknown value fully resets the type filters but keeps the restored FIND.
		objectTypeFilter = ObjectTypeFilter.All;
		fileTypeFilters = [];
	}
	else if (objectTypeFilter === ObjectTypeFilter.Folders && fileTypeFilters.length > 0)
	{
		// "folders" is incompatible with file type filters: drop only the file types.
		fileTypeFilters = [];
	}

	return {
		find,
		objectTypeFilter: (objectTypeFilter as ObjectTypeFilterValue),
		fileTypeFilters: (fileTypeFilters as FileTypeFilterValue[]),
	};
}

function isChanged(raw: { [key: string]: any }, normalized: NormalizedFilterValues): boolean
{
	const rawFind = Type.isStringFilled(raw[FilterFieldId.Find]) ? raw[FilterFieldId.Find] : '';
	const rawObjectType = readObjectType(raw);
	const rawFileTypes = readFileTypes(raw);

	return (
		rawFind !== normalized.find
		|| rawObjectType !== normalized.objectTypeFilter
		|| rawFileTypes.length !== normalized.fileTypeFilters.length
		|| rawFileTypes.some((alias, index) => alias !== normalized.fileTypeFilters[index])
	);
}

// Writes normalized values back into the standard filter before the picker subscribes
// to apply events, so the first data request matches the visible state. Best-effort:
// the standard component API varies, so every write is guarded.
function writeBack(filter: StandardFilter, normalized: NormalizedFilterValues): void
{
	try
	{
		const api = Type.isFunction(filter.getApi) ? filter.getApi() : null;
		if (api && Type.isFunction(api.setFields))
		{
			api.setFields({
				[FilterFieldId.Find]: normalized.find,
				[FilterFieldId.ObjectType]: normalized.objectTypeFilter,
				[FilterFieldId.FileType]: normalized.fileTypeFilters,
			});

			if (Type.isFunction(api.apply))
			{
				api.apply();
			}
		}
	}
	catch (error)
	{
		console.error('DiskPicker: failed to write normalized filter values back', error);
	}
}

// Sets the visible FIND field with the standard component's own apply event
// suppressed, so a feed change fires exactly one data request. The other fields
// are carried over from the current values: `setFields` replaces the applied
// preset wholesale, so passing FIND alone would drop the user's object-type and
// file-type filters on every folder change. Best-effort: the component API
// varies, so the write is guarded.
export function applyFindSuppressed(filter: StandardFilter, value: string): void
{
	try
	{
		const api = Type.isFunction(filter?.getApi) ? filter.getApi() : null;
		if (api && Type.isFunction(api.setFields))
		{
			const current = Type.isFunction(filter.getFilterFieldsValues) ? filter.getFilterFieldsValues() : {};
			api.setFields({ ...current, [FilterFieldId.Find]: value });
			if (Type.isFunction(api.apply))
			{
				api.apply();
			}
		}
	}
	catch (error)
	{
		console.error('DiskPicker: failed to set filter FIND', error);
	}
}

export function resetInitialFilterValues(filter: StandardFilter): boolean
{
	try
	{
		const api = Type.isFunction(filter?.getApi) ? filter.getApi() : null;
		if (!api || !Type.isFunction(api.setFields))
		{
			return false;
		}

		api.setFields({
			[FilterFieldId.Find]: '',
			[FilterFieldId.ObjectType]: ObjectTypeFilter.All,
			[FilterFieldId.FileType]: [],
		});

		return true;
	}
	catch (error)
	{
		console.error('DiskPicker: failed to reset initial filter values', error);

		return false;
	}
}

export function readInitialFilterValues(filter: StandardFilter): NormalizedFilterValues
{
	const raw = Type.isFunction(filter?.getFilterFieldsValues) ? filter.getFilterFieldsValues() : {};
	const normalized = normalizeFilterValues(raw);

	if (isChanged(raw, normalized))
	{
		writeBack(filter, normalized);
	}

	return normalized;
}
