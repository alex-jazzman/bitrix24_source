/**
 * Urls the submenu cannot build itself: both belong to pages outside this extension and are resolved by
 * the toolbar at the render of the create button.
 */
export type RunProcessMenuOptions = {
	createProcessUrl: string,
	allProcessesUrl: string,
};

/**
 * What the builder of the submenu reads out of a row of the catalog. The row itself is DTO-01 and belongs
 * to `sign.v2.api`: it travels through the builder to the slider of the launch untouched, so the builder
 * names only the fields it draws and keeps the transport out of its own dependencies.
 */
export type ProcessEntry = {
	id: number,
	name: string,
};

/**
 * The row as the grid of the section reads it back out of its own markup. The page carries the whole row
 * of DTO-01 in the button, and the two fields named here are the only ones the client itself acts on: the
 * rest travels to the launch slider untouched.
 */
export type CatalogProcess = ProcessEntry & {
	isConstantsTuned: boolean,
};

export type ProcessCatalog<Process extends ProcessEntry> = {
	processes: Process[],
	canCreateProcess: boolean,
};

/**
 * The options of a menu item this extension really uses, out of everything `main.popup` accepts. Named
 * here so the builder of the submenu stays a pure function with a contract of its own.
 */
export type SubmenuItem = {
	id: string,
	text?: string,
	html?: HTMLElement,
	href?: string,
	className?: string,
	delimiter?: boolean,
	onclick?: () => void,
};
