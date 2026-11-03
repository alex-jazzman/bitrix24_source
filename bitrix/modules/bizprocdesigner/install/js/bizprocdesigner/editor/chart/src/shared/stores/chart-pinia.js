import { createPinia, getActivePinia, setActivePinia } from 'ui.vue3.pinia';

let chartPinia = null;

/**
 * The Pinia instance of the chart application: one editor, one instance. Created on the first call
 * (the mount of the editor) and returned as is afterwards — a second mount on the same page would
 * share the stores of the first one.
 */
export function ensureChartPinia(): Object
{
	if (!chartPinia)
	{
		chartPinia = createPinia();
	}

	return chartPinia;
}

/**
 * Run a read of the stores of the editor made from outside its application — the collection of the
 * value sources for the builder window, which is a Vue application of its own in `document.body` —
 * with the instance of the chart as the active one: a read outside a component of the editor
 * resolves its stores through the active instance, and naming the instance here is what keeps it
 * off whichever application of the page installed its Pinia last. Returns what the read returned.
 *
 * Deliberately not `app.use(pinia)` on the window instead: `install()` repoints `pinia._a` at the
 * given application and registers a devtools plugin, and the window is a new application on every
 * opening — so `_a` would end up on an unmounted application and `window.__VUE_DEVTOOLS_PLUGINS__`
 * would grow by an entry per opening, each holding on to its application. The window needs none of
 * it either: it owns no store and is handed the sources it shows.
 *
 * The instance of the editor is active for the read only, and the previous one comes back right
 * after it — a thrown read included: the collection reads its stores before it returns, so the
 * substitution covers exactly the reading and holding it any longer would just take the active
 * instance away from another application of the page.
 *
 * Plain call while the chart application has not been mounted: the active instance is then the one
 * the caller set up, which is the case of the unit tests seeding the stores of their own instance.
 */
export function withChartPinia<T>(read: () => T): T
{
	if (!chartPinia)
	{
		return read();
	}

	const previousPinia = getActivePinia();
	setActivePinia(chartPinia);

	try
	{
		return read();
	}
	finally
	{
		setActivePinia(previousPinia);
	}
}
