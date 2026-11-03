import { Loc, Text, Type } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { AirButtonStyle, ButtonSize } from 'ui.buttons';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { UI } from 'ui.notification';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';
import { BLine } from 'ui.system.skeleton.vue';
import { HeadlineMd, TextMd, TextSm, TextXs } from 'ui.system.typography.vue';
import { Button as UiButton } from 'ui.vue3.components.button';
import { mapActions, mapState } from 'ui.vue3.pinia';

import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import {
	type ChangeFeedRow,
	EVENT_TYPES,
	useChangeHistoryStore,
} from '../../../../entities/blocks/stores/change-history';
import { buildChangePhrase } from './change-phrase';

const AUTHOR_TYPES = Object.freeze({
	human: 1,
	ai: 2,
	system: 3,
});

const EVENT_TYPE_PHRASES = {
	[EVENT_TYPES.publication]: 'BIZPROCDESIGNER_EDITOR_HISTORY_EVENT_PUBLICATION',
	[EVENT_TYPES.creation]: 'BIZPROCDESIGNER_EDITOR_HISTORY_EVENT_CREATION',
	[EVENT_TYPES.draftSave]: 'BIZPROCDESIGNER_EDITOR_HISTORY_EVENT_DRAFT_SAVE',
};

/** The mark an event is recognised by while scrolling, before its title is read. */
const EVENT_TYPE_MARKS = {
	[EVENT_TYPES.publication]: { icon: Outline.ROCKET, modifier: 'publication' },
	[EVENT_TYPES.creation]: { icon: Outline.FLAG, modifier: 'creation' },
	[EVENT_TYPES.draftSave]: { icon: Outline.DOCUMENT_UPDATE, modifier: 'draft-save' },
};

const UNKNOWN_EVENT_MARK = Object.freeze({ icon: Outline.NOTE, modifier: 'unknown' });

const AUTHOR_TYPE_PHRASES = {
	[AUTHOR_TYPES.ai]: 'BIZPROCDESIGNER_EDITOR_HISTORY_AUTHOR_AI',
	[AUTHOR_TYPES.system]: 'BIZPROCDESIGNER_EDITOR_HISTORY_AUTHOR_SYSTEM',
};

const AI_TOOL_PHRASES = new Map([
	['marta', 'BIZPROCDESIGNER_EDITOR_HISTORY_AI_TOOL_MARTA'],
	['rest', 'BIZPROCDESIGNER_EDITOR_HISTORY_AI_TOOL_EXTERNAL_AGENT'],
]);

const SHOW_MORE_CHANGES_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_ACTION_SHOW_MORE_CHANGES';
const COLLAPSE_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_ACTION_COLLAPSE';

const NO_DATA_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_NO_DATA';
const UNKNOWN_AUTHOR_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_AUTHOR_UNKNOWN';
const UNKNOWN_AI_TOOL_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_AI_TOOL_UNKNOWN';
const UNKNOWN_INITIATOR_PHRASE = 'BIZPROCDESIGNER_EDITOR_HISTORY_AI_INITIATOR_UNKNOWN';

const NOTIFICATION_HIDE_DELAY = 4000;

const SKELETON_ROWS = 4;
const SKELETON_LINE_HEIGHT = 48;
const DETAILS_SKELETON_LINE_HEIGHT = 16;
const BADGE_ICON_SIZE = 18;
const EMPTY_ICON_SIZE = 40;
const ERROR_ICON_SIZE = 20;
const TOGGLE_ICON_SIZE = 16;

/** A group header says today/yesterday, an exact date further back; its rows carry the time alone. */
const FEED_DAY_INTERVALS = [['today', 'today'], ['yesterday', 'yesterday']];

const FEED_DAY_FORMAT_CODE = 'FORMAT_DATE';
const FEED_TIME_FORMAT_CODE = 'SHORT_TIME_FORMAT';

/** A burst of writes of the journal is worth one re-read of the feed, not one per write. */
const FEED_REFRESH_DELAY = 1000;

type GroupHeaderRow = {
	type: 'group',
	key: string,
	day: string,
	author: string,
	authorTypeLabel: string,
	aiInitiator: string,
};

type ChangeRow = {
	type: 'change',
	key: string,
	eventId: number,
	index: number,
	kind: string,
	time: string,
	text: string,
};

type ToggleRow = {
	type: 'toggle',
	key: string,
	id: number,
	text: string,
	isExpanded: boolean,
	isLoading: boolean,
	errorMessage: string,
};

type EventRow = {
	type: 'event',
	key: string,
	id: number,
	time: string,
	eventTitle: string,
	eventIcon: string,
	eventModifier: string,
	versionLabel: string,
};

type FeedRow = GroupHeaderRow | ChangeRow | EventRow | ToggleRow;

// @vue/component
export const ChangeHistoryPanel = {
	name: 'ChangeHistoryPanel',
	emits: ['accessDenied'],
	components: {
		BIcon,
		BLine,
		Chip,
		HeadlineMd,
		TextMd,
		TextSm,
		TextXs,
		UiButton,
	},
	setup(): Object
	{
		return {
			AirButtonStyle,
			BADGE_ICON_SIZE,
			ButtonSize,
			ChipDesign,
			ChipSize,
			DETAILS_SKELETON_LINE_HEIGHT,
			EMPTY_ICON_SIZE,
			ERROR_ICON_SIZE,
			Outline,
			SKELETON_ROWS,
			SKELETON_LINE_HEIGHT,
			TOGGLE_ICON_SIZE,
		};
	},
	data(): Object
	{
		return {
			isActive: true,
			requestedChangeAt: null,
		};
	},
	computed: {
		...mapState(useDiagramStore, ['templateId', 'lastRecordedChangeAt']),
		...mapState(useChangeHistoryStore, [
			'events',
			'userNames',
			'isLoading',
			'errorMessage',
			'isAccessDenied',
			'isEmpty',
			'hasNextPage',
			'expandedEventIds',
			'eventDetails',
			'feedRows',
		]),
		hasEvents(): boolean
		{
			return this.events.length > 0;
		},
		isSkeletonShown(): boolean
		{
			return this.isLoading && !this.hasEvents;
		},
		expandedIds(): Set<number>
		{
			return new Set(this.expandedEventIds);
		},
		rows(): Array<FeedRow>
		{
			return this.feedRows.map((row) => this.buildFeedRow(row));
		},
	},
	watch: {
		/**
		 * The window stays open while a person edits, so the feed follows the writes of the journal
		 * instead of showing what the history looked like when it was opened.
		 */
		lastRecordedChangeAt(): void
		{
			this.scheduleRefresh();
		},
		/**
		 * The store has already dropped the journal it was showing; the window is what is left to close,
		 * and the reason is told outside it because it goes away with it.
		 */
		isAccessDenied(isDenied: boolean): void
		{
			if (!isDenied)
			{
				return;
			}

			UI.Notification.Center.notify({
				content: Text.encode(this.errorMessage),
				autoHideDelay: NOTIFICATION_HIDE_DELAY,
			});
			this.$emit('accessDenied');
		},
	},
	created(): void
	{
		this.refreshTimerId = null;
	},
	mounted(): void
	{
		this.loadFeed();
	},
	/**
	 * A failed read leaves the feed stale even when the journal has not moved since, so coming back to
	 * the tab retries it.
	 */
	activated(): void
	{
		this.isActive = true;
		if (this.requestedChangeAt !== this.lastRecordedChangeAt || this.errorMessage !== null)
		{
			this.loadFeed();
		}
	},
	deactivated(): void
	{
		this.isActive = false;
		clearTimeout(this.refreshTimerId);
	},
	unmounted(): void
	{
		clearTimeout(this.refreshTimerId);
		this.reset();
	},
	methods: {
		...mapActions(useChangeHistoryStore, ['loadEvents', 'loadNextPage', 'toggleEventDetails', 'reset']),
		/**
		 * A panel hidden behind the other tab does no work: it catches up with the journal when it
		 * comes back into view.
		 */
		scheduleRefresh(): void
		{
			if (!this.isActive)
			{
				return;
			}

			clearTimeout(this.refreshTimerId);
			this.refreshTimerId = setTimeout(this.loadFeed, FEED_REFRESH_DELAY);
		},
		loadFeed(): void
		{
			this.requestedChangeAt = this.lastRecordedChangeAt;
			void this.loadEvents(this.templateId);
		},
		loc(phraseCode: string, replacements: ?Object = null): string
		{
			return Loc.getMessage(phraseCode, replacements) ?? '';
		},
		buildFeedRow(row: ChangeFeedRow): FeedRow
		{
			if (row.type === 'group')
			{
				return {
					type: 'group',
					key: row.key,
					day: this.formatDay(row.timestamp),
					author: this.resolveAuthor(row.event),
					authorTypeLabel: this.resolveAuthorTypeLabel(row.event.authorType),
					aiInitiator: this.resolveAiInitiator(row.event),
				};
			}

			if (row.type === 'change')
			{
				return {
					type: 'change',
					key: row.key,
					eventId: row.event.id,
					index: row.index,
					kind: row.entry.kind,
					time: this.formatTime(row.timestamp),
					text: buildChangePhrase(row.entry),
				};
			}

			if (row.type === 'toggle')
			{
				return this.buildToggleRow(row);
			}

			const mark = this.resolveEventMark(row.event.eventType);

			return {
				type: 'event',
				key: row.key,
				id: row.event.id,
				time: this.formatTime(row.timestamp),
				eventTitle: this.resolveEventTitle(row.event.eventType),
				eventIcon: mark.icon,
				eventModifier: mark.modifier,
				versionLabel: this.resolveVersionLabel(row.event),
			};
		},
		buildToggleRow(row: ChangeFeedRow): ToggleRow
		{
			const eventId = row.event.id;
			const isExpanded = this.expandedIds.has(eventId);
			const details = this.eventDetails[eventId];
			const errorMessage = details?.errorMessage;

			return {
				type: 'toggle',
				key: row.key,
				id: eventId,
				text: isExpanded
					? this.loc(COLLAPSE_PHRASE)
					: this.loc(SHOW_MORE_CHANGES_PHRASE, { '#COUNT#': row.hiddenCount }),
				isExpanded,
				isLoading: details?.isLoading === true,
				errorMessage: Type.isStringFilled(errorMessage) ? errorMessage : '',
			};
		},
		formatDay(timestamp: ?number): string
		{
			if (!Type.isNumber(timestamp))
			{
				return this.loc(NO_DATA_PHRASE);
			}

			return DateTimeFormat.format(
				[...FEED_DAY_INTERVALS, ['', DateTimeFormat.getFormat(FEED_DAY_FORMAT_CODE)]],
				new Date(timestamp * 1000),
			);
		},
		formatTime(timestamp: ?number): string
		{
			if (!Type.isNumber(timestamp))
			{
				return this.loc(NO_DATA_PHRASE);
			}

			return DateTimeFormat.format(
				DateTimeFormat.getFormat(FEED_TIME_FORMAT_CODE),
				new Date(timestamp * 1000),
			);
		},
		resolveEventTitle(eventType: number): string
		{
			return this.loc(EVENT_TYPE_PHRASES[eventType] ?? NO_DATA_PHRASE);
		},
		resolveEventMark(eventType: number): Object
		{
			return EVENT_TYPE_MARKS[eventType] ?? UNKNOWN_EVENT_MARK;
		},
		resolveVersionLabel(event: Object): string
		{
			if (event.eventType !== EVENT_TYPES.publication || !Type.isNumber(event.versionNumber))
			{
				return '';
			}

			return this.loc('BIZPROCDESIGNER_EDITOR_HISTORY_VERSION', { '#NUMBER#': event.versionNumber });
		},
		resolveAuthorTypeLabel(authorType: number): string
		{
			const phraseCode = AUTHOR_TYPE_PHRASES[authorType];

			return phraseCode ? this.loc(phraseCode) : '';
		},
		/**
		 * A system event has no name of its own: the author type mark stands for it.
		 */
		resolveAuthor(event: Object): string
		{
			if (event.authorType === AUTHOR_TYPES.system)
			{
				return '';
			}

			if (event.authorType === AUTHOR_TYPES.ai)
			{
				return this.loc(AI_TOOL_PHRASES.get(event.aiTool) ?? UNKNOWN_AI_TOOL_PHRASE);
			}

			return this.resolveUserName(event.authorId, UNKNOWN_AUTHOR_PHRASE);
		},
		resolveAiInitiator(event: Object): string
		{
			if (event.authorType !== AUTHOR_TYPES.ai)
			{
				return '';
			}

			return this.loc('BIZPROCDESIGNER_EDITOR_HISTORY_AI_INITIATOR', {
				'#INITIATOR#': this.resolveUserName(event.initiatorUserId, UNKNOWN_INITIATOR_PHRASE),
			});
		},
		resolveUserName(userId: ?number, fallbackPhrase: string): string
		{
			const name = Type.isNumber(userId) ? this.userNames[String(userId)] : null;

			return Type.isStringFilled(name) ? name : this.loc(fallbackPhrase);
		},
	},
	template: `
		<div
			class="bizprocdesigner-change-history"
			data-testid="bizprocdesigner-editor-change-history"
		>
			<div v-if="errorMessage" class="bizprocdesigner-change-history__error">
				<BIcon
					class="bizprocdesigner-change-history__error-icon"
					:name="Outline.EXCLAMATION_CIRCLE"
					:size="ERROR_ICON_SIZE"
				/>
				<TextSm
					role="alert"
					class="bizprocdesigner-change-history__error-text"
					data-testid="bizprocdesigner-editor-change-history-error"
				>
					{{ errorMessage }}
				</TextSm>
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_HISTORY_ACTION_RETRY')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:dataset="{ testid: 'bizprocdesigner-editor-change-history-retry' }"
					@click="loadFeed"
				/>
			</div>
			<div
				v-if="isSkeletonShown"
				class="bizprocdesigner-change-history__skeleton"
				data-testid="bizprocdesigner-editor-change-history-loading"
			>
				<BLine
					v-for="line in SKELETON_ROWS"
					:key="line"
					:height="SKELETON_LINE_HEIGHT"
				/>
			</div>
			<ul
				v-else-if="hasEvents"
				class="bizprocdesigner-change-history__feed"
				data-testid="bizprocdesigner-editor-change-history-feed"
			>
				<template v-for="row in rows" :key="row.key">
					<li
						v-if="row.type === 'group'"
						class="bizprocdesigner-change-history__group-header"
						data-testid="bizprocdesigner-editor-change-history-group"
					>
						<TextSm accent>{{ row.day }}</TextSm>
						<Chip
							v-if="row.authorTypeLabel"
							tabindex="-1"
							:text="row.authorTypeLabel"
							:size="ChipSize.Xs"
							:design="ChipDesign.OutlineNoAccent"
						/>
						<TextXs v-if="row.author" wrap="break-words">{{ row.author }}</TextXs>
						<TextXs v-if="row.aiInitiator" wrap="break-words">{{ row.aiInitiator }}</TextXs>
					</li>
					<li
						v-else-if="row.type === 'change'"
						class="bizprocdesigner-change-history__change"
						:data-testid="'bizprocdesigner-editor-change-history-change-' + row.eventId + '-' + row.index"
					>
						<span :class="['bizprocdesigner-change-history__change-mark', '--' + row.kind]"></span>
						<TextSm wrap="break-words" class="bizprocdesigner-change-history__change-text">
							{{ row.text }}
						</TextSm>
						<TextXs class="bizprocdesigner-change-history__change-time">{{ row.time }}</TextXs>
					</li>
					<li v-else-if="row.type === 'toggle'" class="bizprocdesigner-change-history__expander">
						<BLine v-if="row.isLoading" :height="DETAILS_SKELETON_LINE_HEIGHT"/>
						<TextSm
							v-else-if="row.errorMessage"
							role="alert"
							class="bizprocdesigner-change-history__details-error"
							:data-testid="'bizprocdesigner-editor-change-history-details-error-' + row.id"
						>
							{{ row.errorMessage }}
						</TextSm>
						<button
							type="button"
							class="bizprocdesigner-change-history__toggle"
							:aria-expanded="row.isExpanded"
							:data-testid="'bizprocdesigner-editor-change-history-toggle-' + row.id"
							@click="toggleEventDetails(templateId, row.id)"
						>
							<TextSm>{{ row.text }}</TextSm>
							<BIcon
								class="bizprocdesigner-change-history__toggle-icon"
								:name="Outline.CHEVRON_DOWN_S"
								:size="TOGGLE_ICON_SIZE"
							/>
						</button>
					</li>
					<li
						v-else
						class="bizprocdesigner-change-history__event"
						:data-testid="'bizprocdesigner-editor-change-history-event-' + row.id"
					>
						<div :class="['bizprocdesigner-change-history__badge', '--' + row.eventModifier]">
							<BIcon :name="row.eventIcon" :size="BADGE_ICON_SIZE"/>
						</div>
						<div class="bizprocdesigner-change-history__head">
							<TextMd
								accent
								wrap="truncate"
								class="bizprocdesigner-change-history__title"
							>
								{{ row.eventTitle }}
							</TextMd>
							<Chip
								v-if="row.versionLabel"
								tabindex="-1"
								:text="row.versionLabel"
								:size="ChipSize.Xs"
								:design="ChipDesign.OutlineAccent2"
							/>
							<TextXs class="bizprocdesigner-change-history__event-time">{{ row.time }}</TextXs>
						</div>
					</li>
				</template>
			</ul>
			<div
				v-else-if="isEmpty"
				role="status"
				class="bizprocdesigner-change-history__empty"
				data-testid="bizprocdesigner-editor-change-history-empty"
			>
				<BIcon
					class="bizprocdesigner-change-history__empty-icon"
					:name="Outline.CLOCK_BACK"
					:size="EMPTY_ICON_SIZE"
				/>
				<HeadlineMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_HISTORY_EMPTY_TITLE') }}
				</HeadlineMd>
				<TextMd align="center">
					{{ loc('BIZPROCDESIGNER_EDITOR_HISTORY_EMPTY_TEXT') }}
				</TextMd>
			</div>
			<div v-if="hasNextPage" class="bizprocdesigner-change-history__more">
				<UiButton
					:text="loc('BIZPROCDESIGNER_EDITOR_HISTORY_ACTION_LOAD_MORE')"
					:size="ButtonSize.EXTRA_SMALL"
					:style="AirButtonStyle.OUTLINE"
					:loading="isLoading"
					:dataset="{ testid: 'bizprocdesigner-editor-change-history-load-more' }"
					@click="loadNextPage(templateId)"
				/>
			</div>
		</div>
	`,
};
