import { useCatalogStore } from '../../../entities/catalog';

type Activity = { Type: string, PresetId?: string };

export const useDefaultTitle = (): {
	waitForCatalog: () => Promise<void>,
	getDefaultTitle: (activity: ?Activity, fallbackTitle: ?string) => string,
	resolveDefaultTitle: (activity: ?Activity, fallbackTitle: ?string) => Promise<string>,
} => {
	const catalogStore = useCatalogStore();

	return {
		waitForCatalog: () => catalogStore.init(),
		getDefaultTitle: (activity: ?Activity, fallbackTitle: ?string = ''): string => (
			catalogStore.getDefaultTitle(activity, fallbackTitle)
		),
		resolveDefaultTitle: async (activity: ?Activity, fallbackTitle: ?string = ''): Promise<string> => {
			await catalogStore.init();

			return catalogStore.getDefaultTitle(activity, fallbackTitle);
		},
	};
};
