import { ajax, Loc, Type } from 'main.core';

import { DOCUMENT_FIELDS_ENTITY_ID } from '../constants';
import type { DiagramData, GetNodeSettingsControlsData, UpdateTemplateData, EntitySelectorItem } from '../types';

const USER_ENTITY_ID = 'user';
const AJAX_ENDPOINT = '/bitrix/services/main/ajax.php';
const AJAX_ACTION_PREFIX = 'bizprocdesigner.v2.';
// The one place the release action is named: the unload path builds its url by hand and would
// otherwise keep a second copy of the name that a rename breaks silently.
const RELEASE_TEMPLATE_LOCK_ACTION = 'Diagram.releaseTemplateLock';

// Typed transport error carrying the action-controller response payload so
// callers can branch on errors[].code and still read data/status/errors.
// What the refusal is about — the owner of the editing lease, the current revision of the draft —
// travels in customData of the same first error and is read by getErrorCustomData(), next to
// getErrorCode(): both answer for a raw response as readily as for this error.
class ApiError extends Error
{
	errors: Array<{ code?: string, message?: string, customData?: mixed }>;
	code: ?string;
	status: ?string;
	data: mixed;

	constructor(response: Object)
	{
		const errors = Array.isArray(response?.errors) ? response.errors : [];
		super(errors[0]?.message ?? 'Request failed');
		this.name = 'ApiError';
		this.errors = errors;
		this.code = errors[0]?.code ?? null;
		this.status = response?.status ?? 'error';
		this.data = response?.data ?? null;
	}
}

// Draft saves run in a queue where the next one starts only after the previous request has
// settled, so a request that never answers would stop every later save. Seconds, tunable.
const DRAFT_SAVE_TIMEOUT_SEC = 30;

// onRequestStart receives the XHR handle, so a caller whose request became
// stale can abort it instead of waiting for a response it will throw away.
// timeoutSec 0 keeps the browser default (effectively no limit).
type PostOptions = {
	onRequestStart?: (xhr: XMLHttpRequest) => void,
	timeoutSec?: number,
};

const post = async (action: string, data: Object, options: PostOptions = {}): Promise => {
	let response;
	try
	{
		response = await ajax.runAction(`${AJAX_ACTION_PREFIX}${action}`, {
			method: 'POST',
			json: data || {},
			timeout: options.timeoutSec ?? 0,
			onrequeststart: options.onRequestStart,
		});
	}
	catch (error)
	{
		// runAction rejects on any non-success response (including network
		// errors) with a response-like object holding errors[].
		throw new ApiError(error);
	}

	if (response?.status === 'success')
	{
		return response.data;
	}

	throw new ApiError(response);
};

// An empty collection creates no key in the snapshot, so only this state tells "found nothing"
// from "no snapshot at all" (API-01).
const NodeFilterSourceState = Object.freeze({
	noSnapshot: 'no-snapshot',
	empty: 'empty',
	ready: 'ready',
});

export type NodeFilterSourceStateValue = $Values<typeof NodeFilterSourceState>;

// `id` is the ordinal of the item in the list it came with: document identifiers stay on the
// server. An empty `url` means the caption is shown without a link.
export type NodeFilterFoundItem = {
	id: string,
	title: string,
	url: string,
};

// `hasMore` marks a truncated snapshot: part of the collection did not fit its size limit.
export type NodeFilterFoundItems = {
	state: NodeFilterSourceStateValue,
	items: Array<NodeFilterFoundItem>,
	hasMore: boolean,
};

// One shape for the snapshot and for the read on demand (DTO-01): `truncated` marks a value cut
// down at capture, an on-demand read is never cut.
export type ValueRecord = {
	value: string | number | boolean | null | Array<string | number | boolean | null>,
	type: string,
	multiple: boolean,
	truncated: boolean,
	totalCount: number | null,
};

export type NodeFilterItemValues = { [fieldKey: string]: ValueRecord };

// One employee as the provider of users answers about them (DTO-01): an empty `name` means an item
// that came without one, `avatarUrl` of `null` — an item that came without a photo.
export type EditorUser = {
	name: string,
	avatarUrl: ?string,
};

const editorAPI: {...} = {
	getCatalogData: (): Promise<?Object> => {
		return post('Catalog.get');
	},
	getDiagramData: async (
		params: {
			templateId: Number,
			documentType: ?Array,
			startTrigger: ?string,
		},
	): Promise<?Object> => {
		return post('Diagram.get', params);
	},
	updateTemplateData: (data: UpdateTemplateData): Promise<?Object> => {
		return post('Diagram.updateTemplate', data);
	},
	publicDiagramData: (data: DiagramData): Promise<?Object> => {
		return post('Diagram.publicate', data);
	},
	// draftRevision is optional on purpose: the server checks it only when the client sends one, so a
	// tab that does not know the revision writes the way it did before the editing lease existed.
	publicDiagramDataDraft: (data: DiagramData & { draftRevision?: number }): Promise<?Object> => {
		return post('Diagram.publicateDraft', data, { timeoutSec: DRAFT_SAVE_TIMEOUT_SEC });
	},
	// Taking the editing lease and extending it are one action: which of the two is needed is decided by
	// the server, so the client never judges the deadline by the clock of the browser.
	acquireTemplateLock: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.acquireTemplateLock', params);
	},
	releaseTemplateLock: (params: { templateId: number }): Promise<?Object> => {
		return post(RELEASE_TEMPLATE_LOCK_ACTION, params);
	},
	// Who edits the template right now. Nobody holding it is an empty owner and not a refusal, so the
	// answer describes an idle template as readily as a busy one.
	getTemplateLock: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.getTemplateLock', params);
	},
	// The release on the way out of the page: an ordinary request is cancelled by the browser on unload.
	// Returns whether the browser took the request over — the delivery itself is never guaranteed.
	releaseTemplateLockOnUnload: (params: { templateId: number }): boolean => {
		if (!Type.isFunction(navigator?.sendBeacon))
		{
			return false;
		}

		const payload = new Blob([
			JSON.stringify({
				sessid: Loc.getMessage('bitrix_sessid') ?? '',
				templateId: params.templateId,
			}),
		], { type: 'application/json' });

		return navigator.sendBeacon(
			`${AJAX_ENDPOINT}?action=${AJAX_ACTION_PREFIX}${RELEASE_TEMPLATE_LOCK_ACTION}`,
			payload,
		);
	},
	getLastRunValues: async (params: { templateId: number }): Promise<Object> => {
		try
		{
			const data = await post('Diagram.getLastRunValues', params);

			return data?.values ?? {};
		}
		catch
		{
			// Missing values are a regular state, so a failed request must not
			// break the data panel: it just stays without values.
			return {};
		}
	},
	// Unlike getLastRunValues, a failure travels on as ApiError: the panel has to tell "nothing was
	// found" from "the list did not load" (API-01).
	getNodeFilterFoundItems: async (
		params: { templateId: number, expression: string },
	): Promise<NodeFilterFoundItems> => {
		const data = await post('Diagram.getNodeFilterFoundItems', params);

		return {
			state: data?.state ?? NodeFilterSourceState.noSnapshot,
			items: Array.isArray(data?.items) ? data.items : [],
			hasMore: data?.hasMore === true,
		};
	},
	// Values of one found item, keyed by the requested field key (API-02).
	getNodeFilterItemValues: async (
		params: { templateId: number, expression: string, itemId: string, fields: Array<string> },
	): Promise<NodeFilterItemValues> => {
		const data = await post('Diagram.getNodeFilterItemValues', params);

		return data?.values ?? {};
	},
	getTemplateVersions: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.getVersions', params);
	},
	getTemplateVersion: (params: { templateId: number, versionId: number }): Promise<?Object> => {
		return post('Diagram.getVersion', params);
	},
	getTemplateChangeEvents: (
		params: { templateId: number, cursor: ?number, limit?: ?number },
	): Promise<?Object> => {
		return post('Diagram.getChangeEvents', params);
	},
	getTemplateChangeEvent: (params: { templateId: number, eventId: number }): Promise<?Object> => {
		return post('Diagram.getChangeEvent', params);
	},
	restoreTemplateVersion: (params: { templateId: number, versionId: number }): Promise<?Object> => {
		return post('Diagram.restoreVersion', params);
	},
	undoTemplateRestore: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.undoRestore', params);
	},
	discardTemplateRestoreBackup: (params: { templateId: number }): Promise<?Object> => {
		return post('Diagram.discardRestoreBackup', params);
	},
	// The discussions pinned to the scheme (API-01 to API-07). Reading is a POST as well: the controller
	// narrows every action to it.
	getNotes: (params: { templateId: number }): Promise<?Object> => {
		return post('TemplateNote.list', params);
	},
	createNote: (
		data: {
			templateId: number,
			anchor: {
				type: string,
				nodeId?: string,
				sourceBlockId?: string,
				sourcePortId?: string,
				targetBlockId?: string,
				targetPortId?: string,
			},
			offset: { x: number, y: number },
			position: { x: number, y: number },
			message: string,
		},
	): Promise<?Object> => {
		return post('TemplateNote.create', data);
	},
	replyToNote: (params: { noteId: number, message: string }): Promise<?Object> => {
		return post('TemplateNote.reply', params);
	},
	updateNoteMessage: (params: { messageId: number, message: string, revision: number }): Promise<?Object> => {
		return post('TemplateNote.updateMessage', params);
	},
	deleteNoteMessage: (params: { messageId: number }): Promise<?Object> => {
		return post('TemplateNote.deleteMessage', params);
	},
	completeNote: (params: { noteId: number }): Promise<?Object> => {
		return post('TemplateNote.complete', params);
	},
	getNoteThread: (params: { noteId: number }): Promise<?Object> => {
		return post('TemplateNote.thread', params);
	},
	// The visibility rules of the portal are kept by the provider itself: an employee it answered
	// nothing about — hidden, from the extranet — is absent from the map, and nothing here fills the
	// gap. A missing name and a missing photo are independent of each other and of that.
	fetchUsers: async (userIds: Array<number>): Promise<{ [string]: EditorUser }> => {
		if (userIds.length === 0)
		{
			return {};
		}

		try
		{
			const response = await ajax.runAction('ui.entityselector.load', {
				json: {
					dialog: {
						entities: [
							{
								id: USER_ENTITY_ID,
								dynamicLoad: true,
								// Only the requested authors are needed: without these the provider also
								// preloads the recent items and the first 50 users of the portal.
								fillRecentItems: false,
								options: { fillDialog: false },
							},
						],
						preselectedItems: userIds.map((userId) => [USER_ENTITY_ID, userId]),
					},
				},
			});

			const items = response?.data?.dialog?.items ?? [];

			return Object.fromEntries(
				items
					.filter((item) => item?.entityId === USER_ENTITY_ID)
					.map((item) => [
						String(item.id),
						{
							name: item.title?.text ?? item.title ?? '',
							// Whatever the provider answers goes on as it is: the only consumer is the
							// avatar of the design system, which puts the value into an attribute.
							avatarUrl: item.avatar ?? null,
						},
					]),
			);
		}
		catch
		{
			// A name is decoration over authorId: without it the row shows "no data" and stays usable.
			return {};
		}
	},
	// Kept for the callers that only ever needed the name; the empty ones are dropped here and not in
	// the read itself, where an employee with a photo and no name is a case of its own.
	fetchUserNames: async (userIds: Array<number>): Promise<{ [string]: string }> => {
		const users = await editorAPI.fetchUsers(userIds);

		return Object.fromEntries(
			Object.entries(users)
				.map(([userId, user]) => [userId, user.name])
				.filter(([, name]) => name !== ''),
		);
	},
	getNodeSettingsControls: (data: GetNodeSettingsControlsData, options: PostOptions = {}): Promise<?Object> => {
		return post('Activity.getSettingsControls', data, options);
	},
	getNodeFilterMetadata: (
		data: {
			activityType: string,
			contextActivityType?: ?string,
			documentType: Array<string>,
			onlyDynamicEntities: boolean,
			includeRelatedEntityTypes: boolean,
		},
	): Promise<?Object> => {
		return post('Activity.getNodeFilterMetadata', data);
	},
	saveNodeSettings: (data: Object): Promise<?Object> => {
		return post('Activity.SaveSettings', data);
	},
	/**
	 * Global variables and constants of a signed document type (API-02, `bizproc.globalfield.reload`).
	 * The action answers `{list}` or `{error}`: a refusal by read rights is a regular answer of the
	 * action, not a failure of the transport, and leaves the caller with an empty list.
	 */
	fetchGlobalFields: async (mode: string, documentTypeSigned: string): Promise<{ [string]: Object }> => {
		// `data`, not `json`: the action lives on a plain Controller, which binds parameters of an
		// action from the form body only: a JSON body reaches solely a descendant of JsonController.
		const response = await ajax.runAction('bizproc.globalfield.reload', {
			data: { mode, documentTypeSigned },
		});

		const list = response?.data?.list;

		return Type.isPlainObject(list) ? list : {};
	},
	fetchDocumentFields: async (documentType: string | Array<string>): Promise<Array<EntitySelectorItem>> => {
		const key = Array.isArray(documentType) ? documentType.join(':') : String(documentType);
		const response = await ajax.runAction('ui.entityselector.getChildren', {
			json: {
				parentItem: {
					id: `document-fields-${key}`,
					entityId: DOCUMENT_FIELDS_ENTITY_ID,
					entityType: 'document',
					customData: {
						document: documentType,
						idTemplate: '#FIELD#',
					},
				},
				dialog: {
					entities: [
						{
							id: DOCUMENT_FIELDS_ENTITY_ID,
							dynamicLoad: true,
						},
					],
				},
			},
		});

		return response?.data?.dialog?.items ?? [];
	},
};

export {
	editorAPI,
	post,
	ApiError,
	NodeFilterSourceState,
};
