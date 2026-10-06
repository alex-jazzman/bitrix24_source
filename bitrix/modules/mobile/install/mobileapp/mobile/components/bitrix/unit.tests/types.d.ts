export type UnitTestsCatalogProps = {};

export type UnitTestsCatalogState = {
	section: 'root' | 'modules' | 'features',
	catalogReady: boolean,
	searchQuery: string,
};
