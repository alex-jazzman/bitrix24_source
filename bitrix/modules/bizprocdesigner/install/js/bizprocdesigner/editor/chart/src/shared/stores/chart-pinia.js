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
 * Run the mount of a Vue application living next to the chart one (a window in `document.body`)
 * with the stores of the editor as the ones it reads: such an application gets no Pinia of its own,
 * so it resolves stores through the active instance. Naming the instance here is what keeps the
 * window off whichever application of the page installed its Pinia last.
 *
 * Deliberately not `app.use(pinia)` on the window: `install()` repoints `pinia._a` at the given
 * application and registers a devtools plugin, and the window is a new application on every
 * opening — so `_a` would end up on an unmounted application and `window.__VUE_DEVTOOLS_PLUGINS__`
 * would grow by an entry per opening, each holding on to its application.
 *
 * The instance of the editor is active for the mount only, and the previous one comes back right
 * after it — a thrown mount included: the window reads its stores while mounting and never later, so
 * holding the substitution any longer would just take the active instance away from another
 * application of the page. It keeps the rule checkable as well: a store of the window resolved after
 * the mount lands in the wrong instance at once.
 *
 * Plain mount while the chart application has not been mounted: the active instance is then the one
 * the caller set up, which is the case of the unit tests seeding the stores of their own instance.
 */
export function mountWithChartPinia(mount: () => void): void
{
	if (!chartPinia)
	{
		mount();

		return;
	}

	const previousPinia = getActivePinia();
	setActivePinia(chartPinia);

	try
	{
		mount();
	}
	finally
	{
		setActivePinia(previousPinia);
	}
}
