import { sendData } from 'ui.analytics';
import type { AnalyticsOptions } from 'ui.analytics';

// welcome_points entry points: source key -> { c_section, c_element }. 'left_menu' is the default
// left-menu entry; 'wiki' is the post-import redirect from the legacy wiki tool (backlog maps it to
// c_section=project). The rest (crm/task/employee_widget/employee_profile/group) are backlog points.
const WELCOME_SOURCE_MAP = Object.freeze({
	left_menu: { c_section: 'left_menu', c_element: 'context_menu' },
	wiki: { c_section: 'project', c_element: 'horizontal_menu' },
});

const DEFAULT_WELCOME_ELEMENT = 'context_menu';

export class NoteAnalytics
{
	static #tool = 'bk';
	static #category = 'bk';

	static collectionLinkCopied(success: boolean): void
	{
		this.#send('copy_collection_link', success);
	}

	static documentLinkCopied(success: boolean): void
	{
		this.#send('copy_document_link', success);
	}

	// view_document: click source goes to c_sub_section; c_element is fixed to 'view_button'.
	static documentViewed(
		cSubSection: 'side_menu' | 'docs_list' | 'document' | 'search_page' | 'search',
		success: boolean = true,
	): void
	{
		this.#send('view_document', success, {
			c_sub_section: cSubSection,
			c_element: 'view_button',
		});
	}

	// view_collection: click source goes to c_sub_section; c_element is fixed to 'view_button'.
	static collectionViewed(
		cSubSection: 'side_menu' | 'context_menu' | 'search_page',
		success: boolean = true,
	): void
	{
		this.#send('view_collection', success, {
			c_sub_section: cSubSection,
			c_element: 'view_button',
		});
	}

	static welcomePoint(source: string = 'left_menu', success: boolean = true): void
	{
		// Unknown source falls back to its raw value as c_section with the default context_menu gesture.
		const mapped = WELCOME_SOURCE_MAP[source] ?? { c_section: source, c_element: DEFAULT_WELCOME_ELEMENT };

		this.#send('welcome_points', success, {
			c_element: mapped.c_element,
			c_section: mapped.c_section,
		});
	}

	// create_collection (web): full p1 by spec, camelCase keys matching backend AnalyticsStats.
	static collectionCreated(stats: Object, success: boolean): void
	{
		this.#send('create_collection', success, {
			c_element: 'add_button',
			p1: JSON.stringify(stats),
		});
	}

	// change_collection: ACL edit of an existing collection.
	static collectionAccessChanged(success: boolean): void
	{
		this.#send('change_collection', success, { c_element: 'access_rights' });
	}

	// change_document + edit_text: title/content edit. Access-rights edits go to documentAccessChanged.
	static documentUpdated(success: boolean): void
	{
		this.#send('change_document', success, { c_element: 'edit_text' });
	}

	// change_document + access_rights: ACL edit of an existing document (mirrors collectionAccessChanged).
	static documentAccessChanged(success: boolean): void
	{
		this.#send('change_document', success, { c_element: 'access_rights' });
	}

	// search_result: "show all results" gesture from quick search.
	static searchResult(success: boolean): void
	{
		this.#send('search_result', success, { c_sub_section: 'show_all_results' });
	}

	// click_search: intent to search (focus into a search input). c_sub_section='search_page'
	// only on the full-page search; the sidebar quick search omits it entirely.
	static searchClicked(onSearchPage: boolean = false): void
	{
		this.#send('click_search', true, onSearchPage ? { c_sub_section: 'search_page' } : {});
	}

	static #send(event: string, success: boolean, additionalData: AnalyticsOptions = {}): void
	{
		sendData({
			tool: this.#tool,
			category: this.#category,
			event,
			type: 'bk', // all FE events are UI actions => bk transport
			status: success ? 'success' : 'error',
			c_section: this.#category, // 'bk' by default; welcomePoint overrides via additionalData
			...additionalData,
		});
	}
}
