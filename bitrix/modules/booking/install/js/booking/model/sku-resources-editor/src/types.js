import { SkuResourcesEditorTab } from 'booking.const';
import type { ResourceModel, Skus } from 'booking.model.resources';
import type { CatalogSkuEntityOptions } from 'booking.model.sku';

export type SkuResourcesEditorState = {
	fetching: boolean;
	tab: $Values<typeof SkuResourcesEditorTab>;
	resources: Map<number, ResourceModel>;
	skus: Map<number, Skus>;
	resourcesSkusMap: Map<number, Set<number>>;
	invalidSku: boolean;
	invalidResource: boolean;
	options: SkuResourcesEditorOptions;
};

export type SkuInfo = Skus & {
	resources: ResourceModel[];
}

export type AddSkus = {
	resourceId: number,
	skus: Skus[];
}

export type AddSkuToResourcePayload = {
	resourceId: number;
	sku: Skus;
}

export type AddSkusToResourcesPayload = {
	resourcesIds: number[];
	skus: Skus[];
}

export type DeleteSkuFromResourcePayload = {
	resourceId: number;
	skuId: number;
};

export type DeleteSkuFromResourcesPayload = {
	resourceIds: number[];
	skuId: number;
}

export type DeleteSkusFromResourcesPayload = {
	resourcesIds: number[];
	skuIds: number[];
}

export type UpdateInvalidPayload = {
	invalidSku?: boolean;
	invalidResource?: boolean;
}

export type SkuResourcesEditorOptions = {
	canBeEmpty: boolean;
	editMode: boolean;
	catalogSkuEntityOptions: CatalogSkuEntityOptions;
}
