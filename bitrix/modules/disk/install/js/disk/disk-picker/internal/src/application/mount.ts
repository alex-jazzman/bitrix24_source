import { Loc } from 'main.core';
import { BitrixVue } from 'ui.vue3';
import { createPinia, disposePinia, getActivePinia, setActivePinia } from 'ui.vue3.pinia';

import { loadInitialStage } from '../feature/load-initial-stage/load-initial-stage';
import { resetRowActivation } from '../feature/row-activation/row-activation';
import { resetSelectLimitNotice } from '../feature/toggle-selection/toggle-selection';
import { ObjectTypeFilter } from '../const/picker';
import { type NormalizedFilterValues } from '../const/types';
import { MainUiFilterAdapter } from '../infrastructure/filter/main-ui-filter-adapter';
import { resetPreviews } from '../lib/preview-load-queue/preview-load-queue';
import { clearFolderPages } from '../model/item/folder-page-cache';
import { useSessionStore } from '../model/session/session';
import { type PickerConstraints, type SessionCallbacks } from '../model/session/types';

import { App } from './app';

export type SessionStartOptions = {
	constraints: PickerConstraints,
	restoredFilter: NormalizedFilterValues,
	filterId: string,
	callbacks: SessionCallbacks,
};

export type PickerAppHandle = {
	unmount: () => void,
	start: (options: SessionStartOptions) => void,
	notifyClosing: () => void,
};

// Minimal loc mixin backed by main.core so components get `this.loc()` without
// pulling an extra extension into the dependency surface.
const locMixin = {
	methods: {
		loc(name: string, replacements?: { [key: string]: string }): string
		{
			return Loc.getMessage(name, replacements) ?? '';
		},
	},
};

export function mountPickerApp(container: HTMLElement, props: { [key: string]: any } = {}): PickerAppHandle
{
	const app = BitrixVue.createApp(App, props);
	// A dedicated Pinia keeps session state out of the host page.
	const pinia = createPinia();
	app.use(pinia);
	setActivePinia(pinia);
	app.mixin(locMixin);
	app.mount(container);

	let filterAdapter: MainUiFilterAdapter | null = null;

	return {
		unmount(): void
		{
			clearFolderPages();
			resetPreviews();
			resetRowActivation();
			resetSelectLimitNotice();
			filterAdapter?.dispose();
			filterAdapter = null;
			app.unmount();
			disposePinia(pinia);
			if (getActivePinia() === pinia)
			{
				setActivePinia(undefined);
			}
		},
		start(options: SessionStartOptions): void
		{
			setActivePinia(pinia);
			clearFolderPages();
			resetPreviews();

			const adapter = new MainUiFilterAdapter(options.filterId, pinia, options.callbacks, options.restoredFilter);
			filterAdapter = adapter;

			// A restored non-empty query or active type filter means the search is
			// already meaningful, so the header opens expanded rather than collapsed.
			const restored = options.restoredFilter;
			const restoredMeaningful = restored.find !== ''
				|| restored.objectTypeFilter !== ObjectTypeFilter.All
				|| restored.fileTypeFilters.length > 0;
			useSessionStore().setSearchOpen(restoredMeaningful);

			// The adapter owns the programmatic FIND clear and the filter reset so the
			// apply events they generate are suppressed or flow back through one path.
			useSessionStore().setCallbacks({
				...options.callbacks,
				suppressFilterFind: () => adapter.clearFindSuppressed(),
				resetFilters: () => adapter.resetFilters(),
			});

			adapter.subscribe();

			void loadInitialStage({
				constraints: options.constraints,
				restoredFilter: options.restoredFilter,
				notify: options.callbacks.notify,
				onContextInvalid: options.callbacks.onContextInvalid,
			});
		},
		notifyClosing(): void
		{
			setActivePinia(pinia);
			clearFolderPages();
			resetPreviews();
			resetRowActivation();
			resetSelectLimitNotice();
			filterAdapter?.dispose();
			filterAdapter = null;
			const session = useSessionStore();
			session.setNavigationPending(false);
			session.setLoading(false);
			session.invalidateRequests();
		},
	};
}
