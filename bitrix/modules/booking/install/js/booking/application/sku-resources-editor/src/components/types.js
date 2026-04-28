import type { ResourceModel } from 'booking.model.resources';
import type { SkuResourcesEditorOptions } from 'booking.model.sku-resources-editor';

export type SkuResourcesEditorParams = {
	title: string;
	description: string | null;
	options?: SkuResourcesEditorOptions;
	loadData(): () => Promise<ResourceModel[]>;
	save: (data) => void;
}
