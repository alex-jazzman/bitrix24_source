export type SkuModelState = {
	catalogSkuEntityOptions: CatalogSkuEntityOptions;
	isReloadRelations: boolean,
}

export type CatalogSkuEntityOptions = {
	basePriceId: number;
	iblockId: number;
	restrictedProductTypes: number[];
	showPriceInCaption: boolean;
	canCreate: boolean;
	linkType: string;
}
