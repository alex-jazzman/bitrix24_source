import { Type, Runtime, Extension } from 'main.core';

export type SourceItem = {
	id: string,
	title: string,
	subtitle: string,
	value: string,
	// Both type strings the modification mode needs, see SourceTypes in modifier-catalog.
	type: ?string,
	baseType: ?string,
	// Function items only: `false` for a call that takes no arguments at all.
	acceptsArguments?: boolean,
};

export type Section = {
	id: string,
	title: string,
	items: Array<SourceItem>,
};

// One record of the catalog bizproc publishes into the settings of `bp_selector`
// (SystemProvider::getSystemValues(), bizproc/include.php). `label` is resolved on the server,
// `type` is the real type of the value, string and int included.
export type SystemValue = {
	object: string,
	field: string,
	expression: string,
	label: string,
	type: string,
};

const BP_SELECTOR_EXTENSION = 'bp_selector';

let pendingFunctionsLoad: ?Promise<Array<SourceItem>> = null;

/**
 * Functions: plain data, no dialog. The editor page has `bp_selector` inlined already, so its
 * settings are read straight from the DOM on every call — `Extension.getSettings()` caches what it
 * parsed, so a repeated read is a lookup. The extension itself is loaded only when the settings are
 * absent, because for a legacy CJSCore extension that costs an ajax round trip and re-runs the
 * script: a portal whose function list is merely empty is a final answer and never pays for the
 * load. Loading it at all stays rebuild-safe: an unimported legacy extension cannot live in the
 * generated config.php `rel`. The load is memoized while in flight only — settings that arrive later
 * must still be picked up, so a fruitless attempt does not block the next one. Insertion keeps the
 * `{{=name()}}` shape (arguments typed by the user).
 *
 * A failed load rejects instead of passing an empty list off as the answer: "the portal has no
 * functions" and "the list could not be fetched" are different things to show and the reason has to
 * stay traceable.
 */
export function loadFunctionItems(): Promise<Array<SourceItem>>
{
	const inlinedItems = readFunctionSettings();
	if (inlinedItems)
	{
		return Promise.resolve(inlinedItems);
	}

	if (pendingFunctionsLoad)
	{
		return pendingFunctionsLoad;
	}

	pendingFunctionsLoad = Runtime.loadExtension(BP_SELECTOR_EXTENSION)
		.then(() => readFunctionSettings() ?? [])
		.catch((error) => {
			console.error(`expression builder: failed to load the ${BP_SELECTOR_EXTENSION} extension`, error);

			throw error;
		})
		.finally(() => {
			pendingFunctionsLoad = null;
		});

	return pendingFunctionsLoad;
}

/**
 * `null` means «the settings are not on the page», as opposed to an empty array — «they are, and
 * there are no functions». The inlined settings of `bp_selector` always carry the `functions` array
 * (bizproc/include.php:30), so a missing or malformed key is a missing settings node.
 */
function readFunctionSettings(): ?Array<SourceItem>
{
	const functions = Extension.getSettings(BP_SELECTOR_EXTENSION).get('functions');
	if (!Type.isArray(functions))
	{
		return null;
	}

	return functions.reduce((acc: Array<SourceItem>, func) => {
		if (Type.isStringFilled(func?.name))
		{
			acc.push({
				id: `fn:${func.name}`,
				title: func.name,
				subtitle: Type.isStringFilled(func.description) ? func.description : '',
				value: `{{=${func.name}()}}`,
				type: null,
				baseType: null,
				acceptsArguments: func.args !== false,
			});
		}

		return acc;
	}, []);
}

/**
 * Function items carry a call with empty parentheses, for a host where the user writes the arguments
 * in afterwards. A host that already knows what the formula is about — the data view dialog, where
 * the formula belongs to one column — passes that source and gets it as the first argument. A function
 * declared to take no arguments (`true`, `false`) keeps its empty parentheses: anything inside them is
 * a parse error.
 */
export function withFunctionArgument(item: SourceItem, argument: string): string
{
	return item.acceptsArguments !== false && Type.isStringFilled(argument)
		? item.value.replace('()', `(${argument})`)
		: item.value;
}

/**
 * System values: the catalog the server publishes into the settings of `bp_selector`, captions
 * included. Every record carries its real type, so Modification mode offers the modifiers of that
 * type and nothing else: date, datetime and user have their own, string and int have none (CTR-01).
 * A type left out would instead read as "unknown" there and offer all of them.
 *
 * The catalog itself is the host's to read and to pass in: on a page without the settings inlined it
 * takes a load of `bp_selector`, and waiting for the server is an errand of the host that owns the
 * sections, not of the window that shows them.
 */
export function getSystemVariableItems(values: Array<SystemValue>): Array<SourceItem>
{
	return values.map((value: SystemValue) => ({
		id: value.expression,
		title: Type.isStringFilled(value.label) ? value.label : value.expression,
		subtitle: value.expression,
		value: value.expression,
		// The declared types are bizproc base types themselves, so the two coincide here.
		type: value.type,
		baseType: value.type,
	}));
}
