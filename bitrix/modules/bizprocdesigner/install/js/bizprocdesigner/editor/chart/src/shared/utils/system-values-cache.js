import { Extension, Runtime, Type } from 'main.core';
// One record of the catalog is declared in the value builder extension, next to the mapper that turns
// the catalog into source items: one description of the DTO for the cache and for the mapper alike.
import { type SystemValue } from 'bizprocdesigner.expression-builder';
import { shallowReactive } from 'ui.vue3';

export type SystemValuesCache = {
	get: () => Array<SystemValue>,
	find: (object: string, field: string) => SystemValue | null,
	load: () => Promise<Array<SystemValue>>,
	hasSettled: () => boolean,
	hasLoaded: () => boolean,
	rereadPage: () => void,
};

const BP_SELECTOR_EXTENSION = 'bp_selector';
const CASE_INSENSITIVE_FIELD_OBJECTS = new Set(['system', 'workflow']);
const FIELD_INDEPENDENT_OBJECTS = new Set(['user']);

/**
 * The catalog of system values, read synchronously by the resolver of readable expressions and by the
 * source list of the expression builder. The editor page carries the settings of `bp_selector`
 * inlined, so the first read takes the catalog from the page itself and a reference resolves on the
 * very first render. The storage is kept reactive the way documentFieldsCache keeps the fields of a
 * document: a surface rendered before the catalog arrived re-renders on its own once it lands.
 *
 * A load that broke is settled for good: an automatic redraw reads the answer as final and asks for no
 * new load. Without that the redraw of the veneer, which follows every load, would ask again at once -
 * and `Runtime.loadExtension` keeps the promise of an extension forever, a broken one included, so every
 * next ask breaks again, without a pause and without end. What a later user edit does bring is a new look
 * at the page (`rereadPage()`): a legacy properties dialog opened meanwhile inlines the catalog itself.
 *
 * Loading the extension is what `load()` adds on top, and the new node settings panel needs it: the
 * component inlines `bp_selector` only for the legacy properties dialog
 * (bizprocdesigner.editor/templates/.default/template.php), and a legacy CJSCore extension cannot be
 * imported into the bundle. `hasSettled()` tells a synchronous reader whether asking for that load
 * still makes sense.
 */
export function createSystemValuesCache(): SystemValuesCache
{
	const state: { values: Array<SystemValue> } = shallowReactive({ values: [] });
	let pendingLoad: ?Promise<Array<SystemValue>> = null;
	let isLoaded = false;
	let hasReadPage = false;
	let hasSettled = false;
	let hasFailed = false;

	// An absent key and an empty list are one answer: the catalog is never published empty, so an
	// empty one only ever means "not on this page" (DTO-01).
	function readSettings(): ?Array<SystemValue>
	{
		const values = Extension.getSettings(BP_SELECTOR_EXTENSION).get('systemValues');

		return Type.isArrayFilled(values) ? values : null;
	}

	// The page is looked at once: with the settings inlined the catalog is here from the first read,
	// and without them every later read is a plain lookup instead of a walk over the document.
	function readPageOnce(): void
	{
		if (isLoaded || hasReadPage)
		{
			return;
		}

		hasReadPage = true;
		const inlinedValues = readSettings();
		if (inlinedValues)
		{
			isLoaded = true;
			hasSettled = true;
			state.values = inlinedValues;
		}
	}

	function load(): Promise<Array<SystemValue>>
	{
		readPageOnce();

		if (isLoaded || hasFailed)
		{
			return Promise.resolve(state.values);
		}

		if (!pendingLoad)
		{
			pendingLoad = Runtime.loadExtension(BP_SELECTOR_EXTENSION)
				.then(() => {
					const values = readSettings();
					if (!values)
					{
						console.warn(`systemValuesCache: the ${BP_SELECTOR_EXTENSION} extension carries no system values`);
					}

					isLoaded = true;
					hasSettled = true;
					state.values = values ?? [];

					return state.values;
				})
				.catch((error) => {
					hasFailed = true;
					hasSettled = true;
					console.error(`systemValuesCache: failed to load the ${BP_SELECTOR_EXTENSION} extension`, error);

					return state.values;
				})
				.finally(() => {
					pendingLoad = null;
				});
		}

		return pendingLoad;
	}

	return {
		get: (): Array<SystemValue> => {
			readPageOnce();

			return state.values;
		},

		find: (object: string, field: string): SystemValue | null => {
			readPageOnce();

			const objectKey = String(object).toLowerCase();
			const fieldKey = String(field).toLowerCase();

			return state.values.find((value: SystemValue) => {
				if (String(value.object).toLowerCase() !== objectKey)
				{
					return false;
				}

				if (FIELD_INDEPENDENT_OBJECTS.has(objectKey))
				{
					return true;
				}

				return CASE_INSENSITIVE_FIELD_OBJECTS.has(objectKey)
					? String(value.field).toLowerCase() === fieldKey
					: String(value.field) === String(field)
				;
			}) ?? null;
		},

		load,

		// `false` while a load can still bring the catalog in: a reader that resolved a reference
		// without it knows it is worth asking for one and redrawing.
		hasSettled: (): boolean => hasSettled,

		// The catalog is on hand: only then does its silence about a value mean the value is unknown.
		// A load that broke settles the question of asking again, not the question of what exists.
		hasLoaded: (): boolean => isLoaded,

		// The page is looked at again: a legacy properties dialog opened meanwhile inlines the very
		// catalog the load was after. The load itself is not repeated, and asking for it again would
		// change nothing - `Runtime.loadExtension` keeps the promise of an extension forever, a broken
		// one included (main.core, runtime/loadextension/internal/extensions-storage), so every next ask
		// gets the same refusal without a request. A network that fell and came back is already the
		// business of the loader itself: it waits for the connection and repeats the request on its own
		// (main.core, runtime/loadextension/internal/try-load).
		rereadPage: (): void => {
			hasReadPage = false;
		},
	};
}

export const systemValuesCache: SystemValuesCache = createSystemValuesCache();
