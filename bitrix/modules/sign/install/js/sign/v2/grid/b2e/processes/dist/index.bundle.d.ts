/* eslint-disable */
/**
 * Urls the submenu cannot build itself: both belong to pages outside this extension and are resolved by
 * the toolbar at the render of the create button.
 */
type RunProcessMenuOptions = {
	createProcessUrl: string;
	allProcessesUrl: string;
};

/**
 * The row as the grid of the section reads it back out of its own markup. The page carries the whole row
 * of DTO-01 in the button, and the two fields named here are the only ones the client itself acts on: the
 * rest travels to the launch slider untouched.
 */
type CatalogProcess = ProcessEntry & {
	isConstantsTuned: boolean;
};

/**
 * What the builder of the submenu reads out of a row of the catalog. The row itself is DTO-01 and belongs
 * to `sign.v2.api`: it travels through the builder to the slider of the launch untouched, so the builder
 * names only the fields it draws and keeps the transport out of its own dependencies.
 */
type ProcessEntry = {
	id: number;
	name: string;
};

declare namespace BX.Sign.V2.Grid.B2e {
	/**
	 * Client half of the catalog page. The rows are built by the component of the page; this class answers
	 * only for the "run" button of a row and sends the chosen process to the same public point the submenu
	 * uses.
	 */
	class ProcessCatalog {
		/**
		 * Entry point of the page. The grid reloads over ajax and replaces its own rows, so the handler is
		 * delegated and installed once - a repeated call after a reload changes nothing.
		 */
		static bind(): void;
	}

	/**
	 * Submenu of the "run a process" item of the create button. Whether the item exists at all is decided by
	 * the toolbar at the render of the page; this class only answers what the submenu is made of and asks the
	 * catalog for it once - on the first expand.
	 */
	class RunProcessMenu {
		/**
		 * Entry point of the toolbar, called on every expand of the submenu.
		 */
		static fill(item: BX.Main.MenuItem, options: RunProcessMenuOptions): void;
		constructor(item: BX.Main.MenuItem, options: RunProcessMenuOptions);
	}
}
