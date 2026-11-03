import { Type, ajax as Ajax } from 'main.core';

/** The board offers the users of the portal for a mention, and nothing else. */
const SEARCH_ENTITY_ID = 'user';

/** Names the caller of the selector; the recent items of the mention picker are kept under it. */
const DIALOG_CONTEXT = 'DISK_FLIPCHART_COMMENT_MENTION';

const ERROR_SEARCH_FAILED = 'SEARCH_FAILED';
const ERROR_CANCELLED = 'CANCELLED';

/**
 * The people the board may offer for a mention, looked up through the entity selector of the portal.
 *
 * The board asks over the SDK and waits for exactly one answer per request: the SDK turns what this
 * returns into the success or the error event the board listens for. So every request has to end -
 * a search that failed is answered as an error, and a search the board no longer waits for is
 * ended by the cancel it sent, instead of being left for a reply that would never come.
 *
 * The selector is asked headlessly: the dialog it searches under is described in the request itself,
 * and nothing of it is rendered. The search itself is a seam - tests stand it in, production keeps
 * the action of the portal.
 */
export default class MentionMembers
{
	#pending: Map<string, Function> = new Map();
	#search: Function;

	constructor(options: Object = {})
	{
		this.#search = Type.isFunction(options.search) ? options.search : MentionMembers.runSearch;
	}

	/**
	 * Answers one request of the board. The search and the cancel of the very same request race each
	 * other, and whichever comes first ends it.
	 */
	request = (data: Object): Promise => {
		const requestId = MentionMembers.readRequestId(data);
		const query = Type.isString(data?.query) ? data.query : '';

		let cancel = null;
		const cancelled = new Promise((resolve) => {
			cancel = resolve;
		});
		this.#pending.set(requestId, cancel);

		const searched = Promise.resolve()
			.then(() => this.#search(query))
			.then((response) => ({ members: MentionMembers.toMembers(response) }))
			.catch((error) => ({
				error: {
					code: ERROR_SEARCH_FAILED,
					message: MentionMembers.readErrorMessage(error),
				},
			}))
		;

		return Promise
			.race([searched, cancelled])
			.then((result) => {
				this.#pending.delete(requestId);

				return result;
			})
		;
	};

	/**
	 * The board stopped waiting for an answer, so the request is ended right away instead of hanging
	 * on a search whose result nobody reads any more.
	 */
	cancel = (data: Object): void => {
		const requestId = MentionMembers.readRequestId(data);
		const pending = this.#pending.get(requestId);
		this.#pending.delete(requestId);

		pending?.({ error: { code: ERROR_CANCELLED } });
	};

	static runSearch(query: string): Promise
	{
		const normalized = query.trim().replaceAll(/\s\s+/g, ' ');

		return Ajax.runAction('ui.entityselector.doSearch', {
			json: {
				dialog: {
					context: DIALOG_CONTEXT,
					entities: [{ id: SEARCH_ENTITY_ID }],
				},
				searchQuery: {
					query: normalized,
					// the selector searches nothing without the words of the query
					queryWords: normalized === '' ? [] : normalized.split(' '),
					dynamicSearchEntities: [SEARCH_ENTITY_ID],
				},
			},
		});
	}

	/**
	 * @return {Array} The users of the answer, in the order the selector ranked them; a result that
	 *     names nobody is an empty list rather than a refusal.
	 */
	static toMembers(response: Object): Array
	{
		const items = response?.data?.dialog?.items;
		if (!Type.isArrayFilled(items))
		{
			return [];
		}

		return items
			.filter((item) => item?.entityId === SEARCH_ENTITY_ID)
			.map((item) => MentionMembers.toMember(item))
			.filter((member) => member !== null)
		;
	}

	/**
	 * The user as the board knows one. `id` is what the backend stores the mention by, so an item
	 * without one is left out; `email` and `avatarUrl` are told only when the portal has them, and
	 * are never made up.
	 */
	static toMember(item: Object): ?Object
	{
		const id = Type.isStringFilled(item?.id) || Type.isNumber(item?.id) ? String(item.id) : '';
		if (id === '')
		{
			return null;
		}

		const member = {
			id,
			name: MentionMembers.readText(item?.title),
		};

		const email = item?.customData?.email;
		if (Type.isStringFilled(email))
		{
			member.email = email;
		}

		const avatarUrl = MentionMembers.toAbsoluteUrl(item?.avatar);
		if (avatarUrl !== null)
		{
			member.avatarUrl = avatarUrl;
		}

		return member;
	}

	/** A node of the selector is a plain string or the text with the type it is drawn in. */
	static readText(node: string | Object): string
	{
		if (Type.isStringFilled(node))
		{
			return node;
		}

		return Type.isStringFilled(node?.text) ? node.text : '';
	}

	/**
	 * The board is opened in a frame of another origin, so a path of the portal reaches it only in
	 * full; an address that is already absolute is kept as it is.
	 */
	static toAbsoluteUrl(avatar: string): ?string
	{
		if (!Type.isStringFilled(avatar))
		{
			return null;
		}

		try
		{
			return new URL(avatar, window.location.origin).href;
		}
		catch
		{
			return null;
		}
	}

	static readRequestId(data: Object): string
	{
		return Type.isStringFilled(data?.requestId) ? data.requestId : '';
	}

	static readErrorMessage(error: Object): string | void
	{
		const message = Type.isStringFilled(error?.message)
			? error.message
			: error?.errors?.[0]?.message
		;

		return Type.isStringFilled(message) ? message : undefined;
	}
}
