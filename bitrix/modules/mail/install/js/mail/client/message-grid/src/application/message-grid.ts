import { type App as VueApplication, BitrixVue } from 'ui.vue3';
import { createPinia } from 'ui.vue3.pinia';

import { App } from './app';
import { GridFacade } from './grid-facade';
import {
	GridMode,
	type GridMessage,
	type GridModeValue,
	type GridPanel,
	gridPagingKey,
	type GridScreen,
	gridSelectionKey,
} from '../const';
import { createActionPanel } from '../feature/action-panel/action-panel';
import { reloadOnFilterApply } from '../feature/filter-reload/filter-reload';
import { armPrimarySyncStub } from '../feature/primary-sync-stub/primary-sync-stub';
import { showScreenMessages } from '../feature/screen-messages/screen-messages';
import { type RowHrefTemplates, rowHrefTemplates } from '../lib/row-href/row-href';
import { isSyncStubOffered } from '../lib/screen-flags/screen-flags';
import { useGridStore } from '../model/grid/grid';
import { type FolderMenuItem, type GridPagePayload } from '../model/grid/types';

/** Everything the screen gives one grid: where to mount, which list it draws and its first page. */
export type MessageGridOptions = {
	containerId: string,
	mode: GridModeValue,
	screen: GridScreen,
	/** The first page comes with the markup of the screen, so the list draws without a request. */
	page: GridPagePayload,
	/**
	 * Where a row of this grid opens a message, with the identifier left to fill in
	 * (`message-href.ts`). Only the page of the mail section knows the address, so it is said here
	 * and never asked of the server again.
	 */
	messageHrefTemplate?: string,
	/**
	 * Where a row of this grid leads outside the mail section - the task, the post and the event
	 * (`row-href.ts`). Said here for the same reason and never asked of the server again.
	 */
	hrefTemplates?: Partial<RowHrefTemplates>,
	/** Words the screen asks the grid to pass on once, before anything else. */
	messages?: GridMessage[],
	/**
	 * Folder tree of the submenu "move to folder": the transport carries the action with an empty
	 * submenu on purpose, since one tree serves every row of a mailbox.
	 */
	folders?: FolderMenuItem[],
	/** What the panel of mass actions of this grid is built of; without it the grid leads none. */
	panel?: GridPanel,
};

export class MessageGrid
{
	#options: MessageGridOptions;
	#application: VueApplication | null = null;

	constructor(options: MessageGridOptions)
	{
		this.#options = options;
	}

	start(): void
	{
		// A second start would mount a second application over the first one.
		if (this.#application)
		{
			return;
		}

		const container = document.getElementById(this.#options.containerId);
		if (!container)
		{
			return;
		}

		const {
			mode,
			screen,
			page,
			messages,
			panel,
			folders,
			messageHrefTemplate,
			hrefTemplates,
		} = this.#options;
		// A registry of its own for every grid: two of them share the screen and must not share a selection.
		const pinia = createPinia();
		// seeded before mounting, so the first row is drawn from the state and not from a request; the
		// registry is named rather than taken from the active one, which the second grid overwrites
		const registry = useGridStore(pinia);
		registry.initialize(
			mode,
			screen,
			page,
			folders ?? [],
			messageHrefTemplate ?? '',
			rowHrefTemplates(hrefTemplates),
		);

		const isMessageList = mode === GridMode.Message;
		const facade = new GridFacade({ gridId: screen.gridId, container, registry });
		// Before anything is drawn: the screen looks the grid up by its name the moment the panel of
		// mass actions is created, and that happens right after this script.
		facade.publish(isMessageList);

		// The words that drop the selection belong to the screen, and the screen has one list of
		// messages; the drafts keep their own selection and answer for it themselves.
		if (isMessageList)
		{
			facade.listenToScreen();
		}

		// Both lists of the screen narrow themselves by a filter, and each has a filter of its own.
		reloadOnFilterApply(screen.filterId, (): void => facade.reloadTable());

		// The panel takes its place before the application is mounted: the screen asks the grid for its
		// panel as soon as the list manager of the screen is built, and that is the next script on the page.
		if (panel)
		{
			const actionPanel = createActionPanel({
				gridId: screen.gridId,
				mode,
				filterId: screen.filterId,
				panel,
				gridContainer: container,
				onSelectAll: (on: boolean): void => facade.toggleSelectAll(on),
				onReset: (): void => facade.clearSelection(),
				// the same tree the menu of a row is given: the panel of one marked row shows the
				// actions of that row, the action of moving among them
				folders: folders ?? [],
			});

			if (actionPanel)
			{
				facade.setActionPanel(actionPanel);
			}
		}

		if (isMessageList && isSyncStubOffered())
		{
			armPrimarySyncStub(registry);
		}

		this.#application = BitrixVue.createApp(App, { mode });
		this.#application.use(pinia);
		this.#application.provide(gridPagingKey, facade);
		this.#application.provide(gridSelectionKey, facade);
		this.#application.mount(container);

		// The buttons of the bindings are put over their placeholders on this event alone, and the
		// extension that owns them was ready before the rows were (`mailer.js:73`, `:76`).
		facade.announceUpdated();

		showScreenMessages(messages ?? []);
	}
}
