export type TestingCatalogModule = {
	id: string,
	title: string,
	sortOrder: number,
};

export type TestingCatalogFeature = {
	id: string,
	title: string,
	sortOrder: number,
};

export type TestingCatalogTest = {
	id: string,
	title: string,
	extensionName: string,
	featureIds: string[],
	basic: boolean,
	sortOrder: number,
};

export type TestingCatalogManifest = {
	module: TestingCatalogModule,
	features: TestingCatalogFeature[],
	tests: TestingCatalogTest[],
};

export type TestingCatalogGroupType = 'module' | 'feature' | 'basic';

export type TestingCatalogGroup = {
	id: string,
	type: TestingCatalogGroupType,
	title: string,
	sortOrder: number,
	tests: TestingCatalogTest[],
	extensionNames: string[],
};

export function createTestingGroupTestId(groupId: string): string;
