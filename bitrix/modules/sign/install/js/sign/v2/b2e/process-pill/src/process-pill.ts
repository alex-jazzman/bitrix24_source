import { Dom, Event, Loc, Tag, Text } from 'main.core';
import { CounterPanel } from 'ui.counterpanel';
import { Api } from 'sign.v2.api';

import { resolveProcessesTabUrl } from './tab-url';

import './style.css';

const ITEM_ID = 'sign-b2e-processes';

/**
 * Row of the actions of the toolbar and the block of the navigation inside it - both are rendered by crm
 * (`bitrix:crm.toolbar`), and the pill takes its place next to the block instead of inside it.
 */
const ACTIONS_BAR_SELECTOR = '.ui-actions-bar';
const NAVIGATION_SELECTOR = '.ui-actions-bar__panel';

/**
 * The mark answers "is there at least one running process" and not "how many" (Q-003 of the brief), so the
 * probe asks for the shortest page the contract of API-04 allows and reads `hasAnyRunning` off it.
 */
const RUNNING_PROBE_LIMIT = 1;

/**
 * Pill "Processes" of the row of the views of the KEDO section. It is not a segment of the switch of the
 * views (AC-006): the set of views comes out of crm and takes no item from outside, so the pill stands in
 * the row as an element of its own, right after the block of the navigation (Q-3).
 */
export class ProcessPill
{
	#panel: CounterPanel | null = null;

	/**
	 * Mounts the pill once the row of the toolbar is in the document. Called at the load of the extension:
	 * the toolbar of the section renders no script of its own to call it from, and the extension is loaded
	 * by `sign.start` under the feature flag alone (AC-016).
	 */
	static mount(): void
	{
		Event.ready(() => {
			new ProcessPill().#render();
		});
	}

	#render(): void
	{
		const row = document.querySelector<HTMLElement>(ACTIONS_BAR_SELECTOR);
		const tabUrl = resolveProcessesTabUrl(document.location.pathname);
		if (row === null || tabUrl === null)
		{
			return;
		}

		this.#panel = new CounterPanel({
			target: this.#placeTarget(row, tabUrl),
			// the pill is named by its own item; a heading of the panel would draw the word a second time
			// on a portal outside the air design, where the node of the heading is not hidden
			title: '',
			// keeps the pill out of the shared bus of the counter panels: it is a way to the tab and not a
			// filter of a grid, so an activated filter of a neighbouring panel must not touch it
			multiselect: true,
			items: [
				{
					id: ITEM_ID,
					title: Loc.getMessage('SIGN_B2E_PROCESS_PILL_TITLE') ?? '',
				},
			],
		});
		this.#panel.init();

		this.#loadRunningMark();
	}

	/**
	 * The way to the tab is a link, and the item of the panel carries no handler of its own: an item nothing
	 * is bound to stays a plain node on either template of the portal, so nothing of `ui.counterpanel` names
	 * it over the link and the pill is reached by Tab without a template of its own to depend on.
	 */
	#placeTarget(row: HTMLElement, tabUrl: string): HTMLElement
	{
		const target = Tag.render`
			<a class="ui-actions-bar__panel sign-b2e-process-pill" data-testid="sign-b2e-process-pill"></a>
		`;
		Dom.attr(target, 'href', tabUrl);

		const navigation = row.querySelector<HTMLElement>(NAVIGATION_SELECTOR);
		if (navigation === null)
		{
			Dom.append(target, row);
		}
		else
		{
			Dom.insertAfter(target, navigation);
		}

		return target;
	}

	async #loadRunningMark(): Promise<void>
	{
		try
		{
			const page = await new Api().process.getGroups({}, RUNNING_PROBE_LIMIT, 0);
			if (page.hasAnyRunning)
			{
				this.#showRunningMark();
			}
		}
		catch
		{
			// the mark is not the tab: a probe that failed leaves the pill without it and nothing else
		}
	}

	/**
	 * The mark carries meaning of its own, so it is named for those who do not see it. The name joins the
	 * name of the link the item stands in, which is why the mark belongs inside the pill and not beside it.
	 */
	#showRunningMark(): void
	{
		const container = this.#panel?.getItemById(ITEM_ID)?.getContainer() ?? null;
		if (container === null)
		{
			return;
		}

		const label = Text.encode(Loc.getMessage('SIGN_B2E_PROCESS_PILL_HAS_RUNNING') ?? '');

		Dom.append(
			Tag.render`<span class="sign-b2e-process-pill__mark" role="img" aria-label="${label}"></span>`,
			container,
		);
	}
}
