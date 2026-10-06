import { reactive } from 'ui.vue3';

/**
 * Page-level multiple-selection state for the document list.
 *
 * Lives on the page (data()), NOT in the sidebar store. Flat set of document ids
 * plus a selection-mode flag. Returned as a single reactive object so Options-API
 * pages can hold it in data() without ref-unwrap surprises. "Select all" is not
 * enumerated here — pages route it to over-section endpoints.
 */
export function createSelection(): Object
{
	return reactive({
		mode: false,
		ids: new Set(),

		get count(): number
		{
			return this.ids.size;
		},
		has(id): boolean
		{
			return this.ids.has(Number(id));
		},
		toggle(id): void
		{
			const key = Number(id);
			if (this.ids.has(key))
			{
				this.ids.delete(key);
			}
			else
			{
				this.ids.add(key);
			}
		},
		set(ids): void
		{
			this.ids = new Set((Array.isArray(ids) ? ids : [...ids]).map((id) => Number(id)));
		},
		clear(): void
		{
			this.ids.clear();
		},
		enter(): void
		{
			this.mode = true;
		},
		// Leaving selection mode always drops the current selection (AC-003, ERR-010)
		exit(): void
		{
			this.mode = false;
			this.ids.clear();
		},
	});
}
