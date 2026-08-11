import { useCatalogStore } from '../../../entities/catalog';

type Activity = { Type: string, PresetId?: string };

export const useDefaultTitle = (): {
	waitForCatalog: () => Promise<void>,
	getDefaultTitle: (activity: ?Activity) => string,
	resolveDefaultTitle: (activity: ?Activity) => Promise<string>,
} => {
	const catalogStore = useCatalogStore();

	return {
		waitForCatalog: () => catalogStore.init(),
		getDefaultTitle: (activity: ?Activity): string => catalogStore.getDefaultTitle(activity),
		resolveDefaultTitle: async (activity: ?Activity): Promise<string> => {
			await catalogStore.init();

			return catalogStore.getDefaultTitle(activity);
		},
	};
};
