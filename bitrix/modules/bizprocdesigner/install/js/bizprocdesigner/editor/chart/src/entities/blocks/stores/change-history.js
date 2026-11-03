import { Loc, Type } from 'main.core';
import { defineStore } from 'ui.vue3.pinia';

import { editorAPI } from '../../../shared/api';
import { getErrorCode } from '../../../shared/utils/response';
import { isTemplateId } from '../../../shared/utils/template-id';

export type TemplateChangeSummary = {
	added: number,
	removed: number,
	updated: number,
	moved: number,
};

export type TemplateChangeEvent = {
	id: number,
	eventType: number,
	authorType: number,
	authorId: ?number,
	initiatorUserId: ?number,
	aiTool: ?string,
	requestSource: ?string,
	createdTimestamp: number,
	versionNumber: ?number,
	summary: TemplateChangeSummary,
	hasDetails: boolean,
	changesPreview: Array<TemplateChangeEntry>,
};

type TemplateChangeEntry = {
	elementType: string,
	elementId: ?string,
	elementTitle: ?string,
	kind: string,
	oldValue: ?string,
	newValue: ?string,
	settingTitle: ?string,
	changedTimestamp: number,
};

export type ChangeFeedRow = {
	type: 'group' | 'event' | 'change' | 'toggle',
	key: string,
	index?: number,
	hiddenCount?: number,
	timestamp: number,
	event: TemplateChangeEvent,
	entry: ?TemplateChangeEntry,
};

export type TemplateChangeDetails = {
	changes: Array<TemplateChangeEntry>,
	isLoading: boolean,
	errorMessage: ?string,
};

type ChangeHistoryState = {
	events: Array<TemplateChangeEvent>,
	userNames: { [string]: string },
	nextCursor: ?number,
	isLoading: boolean,
	errorMessage: ?string,
	isAccessDenied: boolean,
	lastFetchId: number,
	eventDetails: { [string]: TemplateChangeDetails },
	expandedEventIds: Array<number>,
	detailsSessionId: number,
	isRefreshing: boolean,
	isRefreshQueued: boolean,
};

export const EVENT_TYPES = Object.freeze({
	publication: 1,
	creation: 2,
	draftSave: 3,
});

const ACCESS_DENIED_ERROR_CODE = 'ACCESS_DENIED';

const ERROR_PHRASES = {
	TEMPLATE_HISTORY_UNAVAILABLE: 'BIZPROCDESIGNER_EDITOR_HISTORY_ERROR_HISTORY_UNAVAILABLE',
	TEMPLATE_NOT_FOUND: 'BIZPROCDESIGNER_EDITOR_HISTORY_ERROR_TEMPLATE_NOT_FOUND',
	[ACCESS_DENIED_ERROR_CODE]: 'BIZPROCDESIGNER_EDITOR_HISTORY_ERROR_ACCESS_DENIED',
	FEATURE_DISABLED: 'BIZPROCDESIGNER_EDITOR_HISTORY_ERROR_FEATURE_DISABLED',
};

const COMMON_ERROR_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_ERROR_COMMON';

export function resolveChangeHistoryErrorMessage(error: Error): string
{
	const phraseCode = ERROR_PHRASES[getErrorCode(error)] ?? COMMON_ERROR_PHRASE;

	return Loc.getMessage(phraseCode) ?? '';
}

function localDayKey(timestamp: number): string
{
	const date = new Date(timestamp * 1000);

	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Everything the header of a group says about who wrote it, so two authors never share a header. */
function authorKey(event: TemplateChangeEvent): string
{
	return [event.authorType, event.authorId, event.aiTool, event.initiatorUserId].join('|');
}

/**
 * An expanded event shows every change the server sent for it; until they arrive, and if the answer
 * carries nothing, the preview of the event stands.
 */
function resolveShownChanges(state: ChangeHistoryState, event: TemplateChangeEvent): Array<TemplateChangeEntry>
{
	const details = state.expandedEventIds.includes(event.id) ? state.eventDetails[event.id] : null;
	const changes = details?.changes;
	const shown = Type.isArray(changes) && changes.length > 0 ? changes : event.changesPreview;

	return Type.isArray(shown) ? shown : [];
}

function countChanges(summary: ?TemplateChangeSummary): number
{
	return Object.values(summary ?? {}).reduce(
		(total: number, count: mixed) => (Type.isNumber(count) ? total + count : total),
		0,
	);
}

function buildChangeRows(event: TemplateChangeEvent, changes: Array<TemplateChangeEntry>): Array<ChangeFeedRow>
{
	return changes
		.map((entry: TemplateChangeEntry, index: number) => ({
			type: 'change',
			key: `change:${event.id}:${index}`,
			index,
			timestamp: Type.isNumber(entry.changedTimestamp) ? entry.changedTimestamp : event.createdTimestamp,
			event,
			entry,
		}))
		.reverse()
	;
}

export const useChangeHistoryStore = defineStore('bizprocdesigner-editor-change-history', {
	state: (): ChangeHistoryState => ({
		events: [],
		userNames: {},
		nextCursor: null,
		isLoading: false,
		errorMessage: null,
		isAccessDenied: false,
		lastFetchId: 0,
		eventDetails: {},
		expandedEventIds: [],
		detailsSessionId: 0,
		isRefreshing: false,
		isRefreshQueued: false,
	}),
	getters:
	{
		isEmpty: (state: ChangeHistoryState): boolean => {
			return !state.isLoading && state.errorMessage === null && state.events.length === 0;
		},
		hasNextPage: (state: ChangeHistoryState): boolean => state.nextCursor !== null,
		/**
		 * A flat feed: a row per change with a time of its own, under a header naming the day and the
		 * author. The grouping goes by the time of the change and not of the event, so a session running
		 * past midnight falls into the two days it was written on, and two sessions of the same person
		 * within a day read as one. A saved draft says nothing its changes do not, so it gets no row of
		 * its own; a publication and the creation of the template do. A session showing fewer changes
		 * than it made ends with a row expanding the rest.
		 */
		feedRows: (state: ChangeHistoryState): Array<ChangeFeedRow> => {
			const rows = [];
			let openGroupKey = null;

			const pushRow = (row: ChangeFeedRow): void => {
				const groupKey = `${localDayKey(row.timestamp)}|${authorKey(row.event)}`;
				if (groupKey !== openGroupKey)
				{
					openGroupKey = groupKey;
					rows.push({ ...row, type: 'group', key: `group:${row.key}`, entry: null });
				}

				rows.push(row);
			};

			state.events.forEach((event: TemplateChangeEvent) => {
				if (event.eventType !== EVENT_TYPES.draftSave)
				{
					pushRow({
						type: 'event',
						key: `event:${event.id}`,
						timestamp: event.createdTimestamp,
						event,
						entry: null,
					});
				}

				const changeRows = buildChangeRows(event, resolveShownChanges(state, event));
				changeRows.forEach((row: ChangeFeedRow) => pushRow(row));

				const hiddenCount = Math.max(countChanges(event.summary) - changeRows.length, 0);
				const isExpanded = state.expandedEventIds.includes(event.id);
				if (event.hasDetails === true && (isExpanded || hiddenCount > 0))
				{
					pushRow({
						type: 'toggle',
						key: `toggle:${event.id}`,
						hiddenCount,
						timestamp: changeRows[changeRows.length - 1]?.timestamp ?? event.createdTimestamp,
						event,
						entry: null,
					});
				}
			});

			return rows;
		},
	},
	actions:
	{
		/**
		 * A signal arriving while the feed is being re-read is collapsed into a single repeat: the
		 * window stays open through an editing session, and every write of the journal signals it.
		 */
		async loadEvents(templateId: number): Promise<void>
		{
			if (this.isRefreshing)
			{
				this.isRefreshQueued = true;

				return;
			}

			this.isRefreshing = true;
			try
			{
				const newestBeforeReload = this.events[0] ?? null;
				await this.loadPage(templateId, null);
				await this.refreshNewestEventDetails(templateId, newestBeforeReload);
			}
			finally
			{
				this.isRefreshing = false;
			}

			if (this.isRefreshQueued)
			{
				this.isRefreshQueued = false;
				await this.loadEvents(templateId);
			}
		},
		/**
		 * Only the newest event keeps taking in the changes of the same editing session, so a reload of
		 * the feed re-reads the changes shown under that one event and keeps the rest of the cache. The
		 * journal stamps the event anew every time it takes in a change, so an unmoved stamp means the
		 * shown changes are the ones already cached and there is nothing to re-read.
		 */
		async refreshNewestEventDetails(templateId: number, previousNewestEvent: ?ChangeHistoryEvent): Promise<void>
		{
			const newestEvent = this.events[0];
			if (!newestEvent || !this.expandedEventIds.includes(newestEvent.id))
			{
				return;
			}

			if (
				previousNewestEvent?.id === newestEvent.id
				&& previousNewestEvent.createdTimestamp === newestEvent.createdTimestamp
			)
			{
				return;
			}

			delete this.eventDetails[newestEvent.id];

			await this.loadEventDetails(templateId, newestEvent.id);
		},
		async loadNextPage(templateId: number): Promise<void>
		{
			if (this.nextCursor === null || this.isLoading)
			{
				return;
			}

			await this.loadPage(templateId, this.nextCursor);
		},
		/**
		 * A failed page keeps the events already shown, whichever page it was: a re-read of the head
		 * fails as easily as a next page, and it must not cost the person the feed they had.
		 */
		async loadPage(templateId: number, cursor: ?number): Promise<void>
		{
			if (!isTemplateId(templateId))
			{
				return;
			}

			const fetchId = ++this.lastFetchId;
			this.isLoading = true;
			this.errorMessage = null;
			try
			{
				const data = await editorAPI.getTemplateChangeEvents({ templateId, cursor });
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				const events = Type.isArray(data?.events) ? data.events : [];
				const merged = cursor === null ? this.mergeHeadPage(events) : null;

				if (merged === null)
				{
					this.events = cursor === null ? events : [...this.events, ...events];
					this.nextCursor = Type.isNumber(data?.nextCursor) && data.nextCursor > 0 ? data.nextCursor : null;
				}
				else
				{
					this.events = merged;
				}

				await this.loadUserNames(fetchId);
			}
			catch (error)
			{
				if (this.lastFetchId !== fetchId)
				{
					return;
				}

				this.handleError(error);
			}
			finally
			{
				if (this.lastFetchId === fetchId)
				{
					this.isLoading = false;
				}
			}
		},
		/**
		 * A re-read of the head keeps the pages the person loaded by "show more" and their scroll: the
		 * feed is cut at its oldest event the head page still has and continues from there. The head
		 * page speaks for everything above that cut, so an event it no longer carries has left the
		 * journal and goes with it. Without an event in common there may be a gap between the head and
		 * the feed, so the caller starts the feed from scratch instead.
		 */
		mergeHeadPage(events: Array<TemplateChangeEvent>): ?Array<TemplateChangeEvent>
		{
			const headIds = new Set(events.map((event) => event.id));
			const cutIndex = this.events.reduce(
				(lastCommonIndex, event, index) => (headIds.has(event.id) ? index : lastCommonIndex),
				-1,
			);

			return cutIndex === -1 ? null : [...events, ...this.events.slice(cutIndex + 1)];
		},
		async loadUserNames(fetchId: number): Promise<void>
		{
			const userIds = [...new Set(
				this.events
					.flatMap((event) => [event.authorId, event.initiatorUserId])
					.filter((userId) => Type.isNumber(userId) && userId > 0 && !(String(userId) in this.userNames)),
			)];

			if (userIds.length === 0)
			{
				return;
			}

			const names = await editorAPI.fetchUserNames(userIds);
			if (this.lastFetchId === fetchId)
			{
				this.userNames = { ...this.userNames, ...names };
			}
		},
		async toggleEventDetails(templateId: number, eventId: number): Promise<void>
		{
			if (this.expandedEventIds.includes(eventId))
			{
				this.expandedEventIds = this.expandedEventIds.filter((id) => id !== eventId);

				return;
			}

			this.expandedEventIds = [...this.expandedEventIds, eventId];

			await this.loadEventDetails(templateId, eventId);
		},
		/**
		 * A loaded or a pending event is never requested twice; only a failed attempt is retried on
		 * the next expand, and a reload of the feed drops the cache of the events shown. An answer of
		 * the window closed meanwhile is dropped: it must not refill the cache of the reopened one.
		 */
		async loadEventDetails(templateId: number, eventId: number): Promise<void>
		{
			const loaded = this.eventDetails[eventId];
			if (!isTemplateId(templateId) || (loaded && loaded.errorMessage === null))
			{
				return;
			}

			const sessionId = this.detailsSessionId;
			this.setEventDetails(eventId, { changes: [], isLoading: true, errorMessage: null });
			try
			{
				const data = await editorAPI.getTemplateChangeEvent({ templateId, eventId });
				if (this.detailsSessionId === sessionId)
				{
					this.setEventDetails(eventId, {
						changes: Type.isArray(data?.changes) ? data.changes : [],
						isLoading: false,
						errorMessage: null,
					});
				}
			}
			catch (error)
			{
				if (this.detailsSessionId !== sessionId)
				{
					return;
				}

				if (this.isAccessDeniedError(error))
				{
					this.handleError(error);

					return;
				}

				this.setEventDetails(eventId, {
					changes: [],
					isLoading: false,
					errorMessage: resolveChangeHistoryErrorMessage(error),
				});
			}
		},
		isAccessDeniedError(error: Error): boolean
		{
			return getErrorCode(error) === ACCESS_DENIED_ERROR_CODE;
		},
		/**
		 * The right to the template is checked on every request, and losing it mid-session must cost the
		 * person the journal they are looking at: the feed and the details are dropped, and the window is
		 * closed by the flag the panel follows.
		 */
		handleError(error: Error): void
		{
			const message = resolveChangeHistoryErrorMessage(error);

			if (this.isAccessDeniedError(error))
			{
				this.reset();
				this.isAccessDenied = true;
			}

			this.errorMessage = message;
		},
		setEventDetails(eventId: number, details: TemplateChangeDetails): void
		{
			this.eventDetails[eventId] = details;
		},
		reset(): void
		{
			this.events = [];
			this.userNames = {};
			this.nextCursor = null;
			this.isLoading = false;
			this.errorMessage = null;
			this.isAccessDenied = false;
			this.lastFetchId++;
			this.eventDetails = {};
			this.expandedEventIds = [];
			this.detailsSessionId++;
			this.isRefreshing = false;
			this.isRefreshQueued = false;
		},
	},
});
