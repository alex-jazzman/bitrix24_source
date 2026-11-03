import { type RowAction, type RowBinding } from '../../model/grid/types';

/**
 * Where a row leads outside the mail section - the task, the post and the event it is bound to or
 * may be made into - out of the templates the screen gave once and what a row carries of its own.
 *
 * No page of the list carries one of those addresses. They are built out of the `PATH_TO_USER_*`
 * parameters the mail section is included with, which only the page of that section knows, and a
 * portal is free to pass its own. So the screen ships the templates (`RowHrefTemplates` on the
 * server) and every page ships identifiers and parameters. The templates are never sent back - an
 * address named by the client would come back drawn into the rows.
 */

/** The same word `RowHrefTemplates::ID_PLACEHOLDER` writes. */
const IdPlaceholder = '__ENTITY_ID__';

export const RowHrefTemplate = Object.freeze({
	TaskCreate: 'taskCreate',
	TaskView: 'taskView',
	PostCreate: 'postCreate',
	PostView: 'postView',
	CalendarEvent: 'calendarEvent',
} as const);

export type RowHrefTemplateName = typeof RowHrefTemplate[keyof typeof RowHrefTemplate];

export type RowHrefTemplates = Record<RowHrefTemplateName, string>;

/** Which template addresses the thing a binding of this kind is already bound to. */
const BoundTemplate: Record<string, RowHrefTemplateName> = {
	task: RowHrefTemplate.TaskView,
	post: RowHrefTemplate.PostView,
	meeting: RowHrefTemplate.CalendarEvent,
};

/** Which template addresses what a binding of this kind offers to create; the other kinds offer none. */
const CreateTemplate: Record<string, RowHrefTemplateName> = {
	task: RowHrefTemplate.TaskCreate,
	post: RowHrefTemplate.PostCreate,
};

/** A grid the screen gave no templates draws the drafts, and no row of those leads anywhere outside. */
export function emptyRowHrefTemplates(): RowHrefTemplates
{
	return {
		taskCreate: '',
		taskView: '',
		postCreate: '',
		postView: '',
		calendarEvent: '',
	};
}

export function rowHrefTemplates(given: Partial<RowHrefTemplates> = {}): RowHrefTemplates
{
	return { ...emptyRowHrefTemplates(), ...given };
}

function fillEntityId(template: string, entityId: string): string
{
	return template === '' ? '' : template.replaceAll(IdPlaceholder, entityId);
}

/**
 * The same encoding the server used while it built these addresses itself: `Uri::addParams()` ends in
 * `http_build_query(..., PHP_QUERY_RFC3986)`, which is `rawurlencode`. `encodeURIComponent` leaves
 * `!'()*` raw, so those are caught by hand - otherwise an address built here differs from the one the
 * screen gave for the very same letter.
 *
 * Encoding is not a nicety: the subject and the sender come from outside the portal, and an `&` left
 * raw adds parameters of its own to the address of a new task while a `#` cuts everything behind it.
 */
function encodeRfc3986(value: string): string
{
	return encodeURIComponent(value).replace(
		/[!'()*]/g,
		(character: string): string => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

/**
 * The parameters join whatever query the template already carries; what is there is neither read back
 * nor rebuilt. The server writes the analytics of a view into the template itself, and a portal is
 * free to stand its sections behind a query of its own.
 */
function fillParams(template: string, params: Record<string, unknown>): string
{
	if (template === '')
	{
		return '';
	}

	const query = Object.entries(params)
		.map(([name, value]: [string, unknown]): string => (
			`${encodeRfc3986(name)}=${encodeRfc3986(String(value))}`
		))
		.join('&')
	;

	if (query === '')
	{
		return template;
	}

	return `${template}${template.includes('?') ? '&' : '?'}${query}`;
}

/**
 * The address of every placeholder of the bindings, written over what the page brought.
 *
 * The CRM is the one kind the server answers about: the address of its entity is no setting of the
 * screen. The other three are addressed by a template and the identifier the page carries.
 */
export function fillBindingHrefs(bindings: RowBinding[], templates: RowHrefTemplates): void
{
	bindings.forEach((binding: RowBinding): void => {
		const boundTemplate = BoundTemplate[binding.type ?? ''];
		const createTemplate = CreateTemplate[binding.type ?? ''];

		if (binding.bindId !== null && boundTemplate)
		{
			binding.bindHref = fillEntityId(templates[boundTemplate], binding.bindId) || null;
		}

		binding.createHref = (binding.createParams && createTemplate)
			? fillParams(templates[createTemplate], binding.createParams) || null
			: null
		;
	});
}

/**
 * The address of the two items of the menu that lead outside the mail section. Their handler reads
 * it back off the node at the moment of the press, so the item has to carry it as an attribute.
 */
export function fillActionHrefs(actions: RowAction[], templates: RowHrefTemplates): void
{
	actions.forEach((action: RowAction): void => {
		if (action.items)
		{
			fillActionHrefs(action.items, templates);
		}

		if (action.hrefTemplate)
		{
			action.href = fillParams(templates[action.hrefTemplate], action.hrefParams ?? {});
		}
	});
}
