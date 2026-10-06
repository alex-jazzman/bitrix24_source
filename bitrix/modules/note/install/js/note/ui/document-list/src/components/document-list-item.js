import { Loc } from 'main.core';
import { DateTimeFormat } from 'main.date';
import { Hint } from 'ui.hint';
import { NoteAvatarStack, avatarFallbackColor } from 'note.ui.avatar-stack';

export const DocumentListItem = {
	name: 'NoteDocumentListItem',
	components: {
		NoteAvatarStack,
	},
	props: {
		item: { type: Object, required: true },
		mode: {
			type: String,
			default: 'cards',
			validator: (value: string): boolean =>
				value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search',
		},
		selectionEnabled: {
			type: Boolean,
			default: false,
		},
		// The list supports multi-select: on desktop a checkbox appears on hover and its
		// click enters selection mode. Ignored on mobile (entered via a toolbar button).
		selectable: {
			type: Boolean,
			default: false,
		},
		isMobile: {
			type: Boolean,
			default: false,
		},
		selected: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['open', 'open-collection', 'select'],
	data(): Object
	{
		return {
			// Set on pointerdown over the checkbox and consumed in onSelectChange, so blur() runs
			// only for pointer input. Keyboard (Space) toggles fire `change` without a preceding
			// pointerdown and must keep focus for multi-select (WCAG 2.4.3). Not used in render.
			pointerToggle: false,
		};
	},
	computed: {
		title(): string
		{
			return String(this.item?.title ?? '');
		},
		selectAriaLabel(): string
		{
			// The checkbox is visually labelled only by an aria-hidden box, so give screen
			// readers the document title as the accessible name.
			return Loc.getMessage('NOTE_DOCUMENT_LIST_SELECT_ITEM_ARIA', { '#TITLE#': this.title }) || '';
		},
		snippetHtml(): string
		{
			return typeof this.item?.snippet === 'string' ? this.item.snippet : '';
		},
		excerpt(): string
		{
			return typeof this.item?.excerpt === 'string' ? this.item.excerpt : '';
		},
		hasExcerpt(): boolean
		{
			return this.snippetHtml !== '' || this.excerpt !== '';
		},
		showAuthor(): boolean
		{
			const author = this.item?.author;
			if (!author)
			{
				return false;
			}
			if (this.mode !== 'cards' && this.mode !== 'detailed' && this.mode !== 'search')
			{
				return false;
			}

			return author.isSystem === true || Number(author.id) > 0;
		},
		author(): ?Object
		{
			return this.showAuthor ? this.item.author : null;
		},
		showCollection(): boolean
		{
			return (this.mode === 'detailed' || this.mode === 'search')
				&& typeof this.item?.collectionTitle === 'string'
				&& this.item.collectionTitle !== '';
		},
		collectionTitle(): string
		{
			return this.showCollection ? String(this.item.collectionTitle) : '';
		},
		hasCollectionLink(): boolean
		{
			return this.showCollection && Number(this.item?.collectionId) > 0;
		},
		hasTrashedDate(): boolean
		{
			return this.mode === 'detailed' && Boolean(this.item?.trashedAt);
		},
		trashedAtLabel(): string
		{
			return this.hasTrashedDate ? this.formatRelativeDate(this.item?.trashedAt) : '';
		},
		trashedAtFullLabel(): string
		{
			return this.hasTrashedDate ? this.formatFullDate(this.item?.trashedAt) : '';
		},
		hasArchivedDate(): boolean
		{
			return this.mode === 'detailed' && Boolean(this.item?.archivedAt);
		},
		archivedAtLabel(): string
		{
			return this.hasArchivedDate ? this.formatRelativeDate(this.item?.archivedAt) : '';
		},
		archivedAtFullLabel(): string
		{
			return this.hasArchivedDate ? this.formatFullDate(this.item?.archivedAt) : '';
		},
		hasAuthor(): boolean
		{
			return this.author !== null;
		},
		hasAttribution(): boolean
		{
			return this.hasTrashedDate || this.hasArchivedDate;
		},
		hasMeta(): boolean
		{
			return this.showCollection || this.hasAuthor || this.hasAttribution;
		},
		hasContent(): boolean
		{
			return this.hasExcerpt || this.hasMeta;
		},
		// Desktop-only: render a checkbox that stays hidden until the card is hovered; clicking
		// it enters selection mode. Once mode is active the checkbox is shown unconditionally.
		showHoverSelect(): boolean
		{
			return this.selectable && !this.isMobile && !this.selectionEnabled;
		},
		// Mobile: in management sections the checkbox is shown permanently, so entering
		// selection mode does not require a separate toolbar button. The first tap toggles
		// selection just like the desktop hover checkbox.
		showMobileSelect(): boolean
		{
			return this.selectable && this.isMobile;
		},
		showSelectBox(): boolean
		{
			return this.selectionEnabled || this.showHoverSelect || this.showMobileSelect;
		},
		rootClass(): Array<string>
		{
			return [
				'note-document-card',
				this.mode === 'compact' ? 'note-document-card--compact' : '',
				this.mode === 'detailed' ? 'note-document-card--detailed' : '',
				this.mode === 'search' ? 'note-document-card--search' : '',
				this.showHoverSelect ? 'note-document-card--hover-select' : '',
				this.selectionEnabled ? 'note-document-card--selecting' : '',
			];
		},
		// The card avatar is note.ui.avatar-stack in row mode (one participant), so an author looks
		// the same here as in the activity feed, the history tiles and the viewers list. `color` is
		// the server identity hue (see IdentityColor); the palette stays a defensive fallback for a
		// payload built before that field existed.
		authorParticipants(): Array
		{
			const author = this.author;
			if (!author)
			{
				return [];
			}

			return [{
				id: Number(author.id) || 0,
				name: String(author.name || ''),
				avatar: author.photoUrl || null,
				color: author.color || avatarFallbackColor(author.id),
			}];
		},
		docHref(): string
		{
			const raw = this.item?.documentId ?? this.item?.id;
			const id = Number(raw);

			return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
		},
		collectionHref(): string
		{
			if (!this.hasCollectionLink)
			{
				return '';
			}
			const id = Number(this.item?.collectionId);

			return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
		},
	},
	mounted()
	{
		this.refreshHints();
	},
	updated()
	{
		this.refreshHints();
	},
	methods: {
		emitSelectToggle(): void
		{
			// `activate` tells the page to switch into selection mode first — set when the click
			// arrives from the hover checkbox (mode not yet on).
			this.$emit('select', {
				id: Number(this.item?.id) || 0,
				selected: !this.selected,
				activate: !this.selectionEnabled,
			});
		},
		onCardClick(event: MouseEvent): void
		{
			// In selection mode a click anywhere on the card toggles it (fallback for cards
			// without a title-link overlay); interactive children stop propagation themselves.
			if (!this.selectionEnabled)
			{
				return;
			}
			event.preventDefault();
			this.emitSelectToggle();
		},
		onTitleClick(event: MouseEvent): void
		{
			// In selection mode the whole card (the stretched title-link overlay) toggles
			// selection instead of opening the document.
			if (this.selectionEnabled)
			{
				event.preventDefault();
				event.stopPropagation();
				this.emitSelectToggle();

				return;
			}
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.$emit('open', this.item);
		},
		refreshHints(): void
		{
			if (this.$el instanceof HTMLElement)
			{
				Hint.init(this.$el);
			}
		},
		onActionsClick(event: MouseEvent): void
		{
			event?.stopPropagation?.();
		},
		onSelectClick(event: MouseEvent): void
		{
			// Keep the click off the card overlay so the document does not open
			event?.stopPropagation?.();
		},
		onSelectPointerDown(): void
		{
			// Mark that the imminent toggle is pointer-driven; keyboard toggles never reach here.
			this.pointerToggle = true;
		},
		onSelectKeyDown(): void
		{
			// Keyboard interaction (Space) fires keydown before change — clear any pointer flag left
			// stale by a cancelled pointer gesture (pointerdown without a following change), so the
			// keyboard toggle never wrongly triggers blur.
			this.pointerToggle = false;
		},
		onSelectChange(event: Event): void
		{
			// Stateless component: emit the intended toggle relative to the current prop; the page owns selection
			this.emitSelectToggle();

			// Drop focus only for pointer input: otherwise a deselect that exits selection mode leaves
			// the hover checkbox pinned open via :focus-within after the pointer moves away. Keyboard
			// users must keep focus so multi-select stays operable (WCAG 2.4.3).
			const pointerDriven = this.pointerToggle;
			this.pointerToggle = false;
			if (!pointerDriven)
			{
				return;
			}
			const input = event?.target;
			if (input instanceof HTMLElement)
			{
				input.blur();
			}
		},
		onCollectionClick(event: MouseEvent): void
		{
			// In selection mode the collection chip toggles the card too, never navigates.
			if (this.selectionEnabled)
			{
				event?.preventDefault?.();
				event?.stopPropagation?.();
				this.emitSelectToggle();

				return;
			}
			if (!this.hasCollectionLink)
			{
				return;
			}
			event?.stopPropagation?.();
			// Let the browser handle modifier keys, middle/right click natively
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			{
				return;
			}
			event.preventDefault();
			this.$emit('open-collection', {
				collectionId: Number(this.item?.collectionId) || 0,
				collectionTitle: this.collectionTitle,
			});
		},
		toTimestampSec(value: ?string): ?number
		{
			if (typeof value !== 'string' || value === '')
			{
				return null;
			}
			const ms = Date.parse(value);
			if (Number.isNaN(ms))
			{
				return null;
			}

			return Math.floor(ms / 1000);
		},
		formatRelativeDate(value: ?string): string
		{
			const ts = this.toTimestampSec(value);

			return ts === null ? '' : DateTimeFormat.format('x', ts);
		},
		formatFullDate(value: ?string): string
		{
			const ts = this.toTimestampSec(value);
			if (ts === null)
			{
				return '';
			}
			const bitrixFormat = Loc.getMessage('FORMAT_DATETIME') || 'DD.MM.YYYY HH:MI:SS';
			const phpFormat = DateTimeFormat.convertBitrixFormat(bitrixFormat);

			return DateTimeFormat.format(phpFormat, ts);
		},
	},
	// language=Vue
	template: `
		<div :class="rootClass" @click="onCardClick">
			<div class="note-document-card__header">
				<label
					v-if="showSelectBox"
					class="ui-checkbox --size-md note-document-card__select"
					:class="{ '--checked': selected }"
					@click.stop="onSelectClick"
					@pointerdown="onSelectPointerDown"
				>
					<input
						type="checkbox"
						class="ui-checkbox__input"
						:checked="selected"
						:aria-label="selectAriaLabel"
						@keydown="onSelectKeyDown"
						@change="onSelectChange"
					/>
					<span class="ui-checkbox__box" aria-hidden="true">
						<span v-if="selected" class="ui-checkbox__icon">
							<span class="ui-icon-set --check-m"></span>
						</span>
					</span>
				</label>
				<div class="note-document-card__title-cluster">
					<a
						v-if="docHref"
						class="note-document-card__title note-document-card__title-link"
						:href="docHref"
						@click="onTitleClick"
					>{{ title }}</a>
					<span v-else class="note-document-card__title">{{ title }}</span>
				</div>
				<div
					v-if="$slots.actions"
					class="note-document-card__header-action"
					@click="onActionsClick"
				>
					<slot name="actions" :item="item" />
				</div>
			</div>
			<div v-if="hasContent" class="note-document-card__content">
				<div v-if="showCollection" class="note-document-card__collection">
					<a
						v-if="hasCollectionLink"
						:href="collectionHref"
						class="note-document-card__collection-link"
						@click="onCollectionClick"
					>
						<span class="note-document-card__collection-icon" aria-hidden="true"></span>
						<span class="note-document-card__collection-name">{{ collectionTitle }}</span>
					</a>
					<span v-else class="note-document-card__collection-link">
						<span class="note-document-card__collection-icon" aria-hidden="true"></span>
						<span class="note-document-card__collection-name">{{ collectionTitle }}</span>
					</span>
				</div>
				<p
					v-if="snippetHtml"
					class="note-document-card__excerpt"
					v-html="snippetHtml"
				></p>
				<p
					v-else-if="excerpt"
					class="note-document-card__excerpt"
				>{{ excerpt }}</p>
				<div v-if="hasAuthor || hasAttribution" class="note-document-card__footer">
					<div v-if="author" class="note-document-card__author">
						<NoteAvatarStack
							class="note-document-card__avatar"
							:participants="authorParticipants"
							:inline="true"
							:show-hints="false"
						/>
						<span class="note-document-card__author-name">{{ author.name }}</span>
					</div>
					<span v-else class="note-document-card__footer-spacer" aria-hidden="true"></span>
					<div
						v-if="hasTrashedDate"
						class="note-document-card__attribution note-document-card__attribution--trashed"
					>
						<span
							class="note-document-card__attribution-date"
							:data-hint="trashedAtFullLabel"
							data-hint-no-icon
							data-hint-interactivity
							data-hint-center
						>{{ trashedAtLabel }}</span>
					</div>
					<div
						v-else-if="hasArchivedDate"
						class="note-document-card__attribution note-document-card__attribution--archived"
					>
						<span
							class="note-document-card__attribution-date"
							:data-hint="archivedAtFullLabel"
							data-hint-no-icon
							data-hint-interactivity
							data-hint-center
						>{{ archivedAtLabel }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
};
