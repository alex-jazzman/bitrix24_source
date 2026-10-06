import { BaseEvent, EventEmitter } from 'main.core.events';
import { BIcon, Outline, Solid } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';
import 'ui.icon-set.solid';
import { FavoriteApi } from './favorite-api';

// Local bus of the page, shared with the sidebar (NoteEvent.FAVORITE_CHANGED there). A literal here on
// purpose: note.sidebar already depends on this extension for the bell popover, so it cannot be
// imported back.
const FAVORITE_CHANGED_EVENT = 'Note:favoriteChanged';
import { extractErrorMessage } from './error-message';
import { showErrorToast } from './show-error-toast';

// [P4.T3] Star of the activity line: adds the open document to the personal favorites list and takes
// it back out. Unlike the bell it is NOT gated by the notifications setting - the list exists on its
// own - and it needs document VIEW, not edit (AC-001), the same right the bell needs.
//
// State is one and the same as the sidebar's: when the sidebar is on the page its store is the owner
// of the flag (optimistic toggles, EVENT-01 pushes, the loaded pages of the block all land there), so
// a change made in a row of the sidebar shows up here without a reload. `initialFavorite` is the
// bootstrap value (TPL-01) for the case where the store has never heard of this document; the local
// flag on top of both is what the user's own press flips this frame.
export const FavoriteStarComponent = {
	name: 'NoteDocumentHistoryFavoriteStar',
	components: {
		BIcon,
	},
	props: {
		documentId: {
			type: Number,
			required: true,
		},
		// Bootstrap value of the flag; `null` means the caller has not reported one.
		initialFavorite: {
			type: Boolean,
			default: null,
		},
		// What the sidebar needs to draw the row of the favorites block within the frame of the press
		// instead of after a read of the list: it travels with the announcement below. An empty title
		// reports nothing - a nameless row is worse than the wait it saves.
		documentTitle: {
			type: String,
			default: '',
		},
		collectionId: {
			type: Number,
			default: 0,
		},
		messages: {
			type: Object,
			required: true,
		},
	},
	// The bell next to the star is gated by the same flag (notifications live on favorites), and the
	// star is its owner here - including the optimistic frame, which no store reports on a page
	// without a sidebar.
	emits: ['favorite-change'],
	inject: {
		// The sidebar of the page, when there is one. Optional by design: the activity line also
		// renders where no sidebar is mounted.
		noteSidebarState: { default: null },
	},
	data()
	{
		return {
			localFavorite: null,
			isSaving: false,
		};
	},
	computed: {
		starIcon(): string
		{
			return this.isFavorite ? Solid.FAVORITE : Outline.FAVORITE;
		},
		sharedFavorite(): boolean | null
		{
			const favorites = this.noteSidebarState?.favorites;
			if (!favorites || typeof favorites.isFavorite !== 'function')
			{
				return null;
			}

			return favorites.isFavorite('document', Number(this.documentId));
		},
		isFavorite(): boolean
		{
			return this.localFavorite ?? this.initialFavorite ?? this.sharedFavorite ?? false;
		},
		starTitle(): string
		{
			return this.isFavorite ? this.messages.activityFavoriteOff : this.messages.activityFavoriteOn;
		},
	},
	created()
	{
		this.favoriteEventHandler = (event: Object): void => {
			const data = event?.getData?.() ?? {};
			if (String(data.entityType) !== 'document' || Number(data.entityId) !== Number(this.documentId))
			{
				return;
			}

			this.localFavorite = data.isFavorite === true;
		};
		EventEmitter.subscribe(FAVORITE_CHANGED_EVENT, this.favoriteEventHandler);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(FAVORITE_CHANGED_EVENT, this.favoriteEventHandler);
		this.favoriteEventHandler = null;
	},
	watch: {
		isFavorite: {
			immediate: true,
			handler(value: boolean): void
			{
				this.$emit('favorite-change', value);
			},
		},
		// A change in the store is a change of the shared state - adopt it. Only changes are followed:
		// the store answers "not in the list" for a document it has never loaded, and that answer must
		// not overrule the bootstrap value on mount.
		sharedFavorite(value: boolean | null): void
		{
			if (typeof value === 'boolean')
			{
				this.localFavorite = value;
			}
		},
		documentId(): void
		{
			this.localFavorite = null;
		},
	},
	methods: {
		emitFavoriteChanged(isFavorite: boolean): void
		{
			EventEmitter.emit(FAVORITE_CHANGED_EVENT, new BaseEvent({
				data: {
					entityType: 'document',
					entityId: Number(this.documentId),
					isFavorite,
					hint: this.favoriteHint(),
				},
			}));
		},
		// [DTO-01] Second announcement of the same press, this one with the server's answer behind it -
		// including the refusal that rolls the press back, which settles the state just as well. Until it
		// arrives the sidebar holds the press against a page read of its own; `confirmed` is what releases
		// it, the same convention the bell of the line follows. `item` is the finished row of the block: it
		// is the only thing that can name the row drawn on the press (id, position, coverage), and a null
		// one (an older server, an object the list does not hand out) leaves the block to re-read.
		emitFavoriteConfirmed(isFavorite: boolean, item: Object | null): void
		{
			EventEmitter.emit(FAVORITE_CHANGED_EVENT, new BaseEvent({
				data: {
					entityType: 'document',
					entityId: Number(this.documentId),
					isFavorite,
					confirmed: true,
					item,
				},
			}));
		},
		// The open document as the sidebar's block would draw it. Nesting is left out: this page knows
		// nothing about the children of the document, and the push of the add reports them.
		favoriteHint(): Object | null
		{
			const title = String(this.documentTitle ?? '').trim();
			if (title === '')
			{
				return null;
			}

			return { title, collectionId: Number(this.collectionId) || 0 };
		},
		async toggle(): Promise<void>
		{
			const documentId = Number(this.documentId);
			if (this.isSaving || !(documentId > 0))
			{
				return;
			}

			// Optimistic: the star fills in this frame and falls back on failure. The announcement goes out
			// with the optimistic flip, not after the answer - the row of the sidebar has to light up in
			// the same frame as the star that was pressed.
			const previous = this.isFavorite;
			this.localFavorite = !previous;
			this.emitFavoriteChanged(!previous);

			this.isSaving = true;
			try
			{
				if (previous)
				{
					await FavoriteApi.remove({ documentId });
					this.emitFavoriteConfirmed(false, null);
				}
				else
				{
					const response = await FavoriteApi.add({ documentId });
					this.emitFavoriteConfirmed(true, response?.data?.item ?? null);
				}
			}
			catch (error)
			{
				this.localFavorite = previous;
				// A refused write leaves the server holding the state from before the press, so the
				// roll-back is as settled as an answer: it releases the press instead of opening a new one.
				this.emitFavoriteConfirmed(previous, null);
				showErrorToast(extractErrorMessage(
					error,
					previous ? this.messages.favoriteRemoveError : this.messages.favoriteAddError,
				));
			}
			finally
			{
				this.isSaving = false;
			}
		},
	},
	// language=Vue
	template: `
		<button
			type="button"
			class="note-activity-line__control --interactive"
			:class="{ '--on': isFavorite }"
			:title="starTitle"
			:aria-label="messages.activityFavoriteState"
			:aria-pressed="isFavorite ? 'true' : 'false'"
			data-testid="note-activity-favorite"
			@click="toggle"
		>
			<BIcon :name="starIcon" class="note-activity-line__control-icon" aria-hidden="true" />
		</button>
	`,
};
