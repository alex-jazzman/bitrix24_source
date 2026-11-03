/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, main_polyfill_intersectionobserver, ui_system_checkbox, ui_iconSet_outline, ui_iconSet_actions, main_core, note_ui_loader, main_date, ui_hint, note_ui_avatarStack, ui_iconSet_api_vue, note_ui_themeContext, ui_vue3) {
	'use strict';

	const DocumentListItem = {
		name: 'NoteDocumentListItem',
		components: {
			NoteAvatarStack: note_ui_avatarStack.NoteAvatarStack
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			mode: {
				type: String,
				default: 'cards',
				validator: value => value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search'
			},
			selectionEnabled: {
				type: Boolean,
				default: false
			},
			// The list supports multi-select: on desktop a checkbox appears on hover and its
			// click enters selection mode. Ignored on mobile (entered via a toolbar button).
			selectable: {
				type: Boolean,
				default: false
			},
			isMobile: {
				type: Boolean,
				default: false
			},
			selected: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open', 'open-collection', 'select'],
		data() {
			return {
				// Set on pointerdown over the checkbox and consumed in onSelectChange, so blur() runs
				// only for pointer input. Keyboard (Space) toggles fire `change` without a preceding
				// pointerdown and must keep focus for multi-select (WCAG 2.4.3). Not used in render.
				pointerToggle: false
			};
		},
		computed: {
			title() {
				return String(this.item?.title ?? '');
			},
			selectAriaLabel() {
				// The checkbox is visually labelled only by an aria-hidden box, so give screen
				// readers the document title as the accessible name.
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_SELECT_ITEM_ARIA', {
					'#TITLE#': this.title
				}) || '';
			},
			snippetHtml() {
				return typeof this.item?.snippet === 'string' ? this.item.snippet : '';
			},
			excerpt() {
				return typeof this.item?.excerpt === 'string' ? this.item.excerpt : '';
			},
			hasExcerpt() {
				return this.snippetHtml !== '' || this.excerpt !== '';
			},
			showAuthor() {
				const author = this.item?.author;
				if (!author) {
					return false;
				}
				if (this.mode !== 'cards' && this.mode !== 'detailed' && this.mode !== 'search') {
					return false;
				}
				return author.isSystem === true || Number(author.id) > 0;
			},
			author() {
				return this.showAuthor ? this.item.author : null;
			},
			showCollection() {
				return (this.mode === 'detailed' || this.mode === 'search') && typeof this.item?.collectionTitle === 'string' && this.item.collectionTitle !== '';
			},
			collectionTitle() {
				return this.showCollection ? String(this.item.collectionTitle) : '';
			},
			hasCollectionLink() {
				return this.showCollection && Number(this.item?.collectionId) > 0;
			},
			hasTrashedDate() {
				return this.mode === 'detailed' && Boolean(this.item?.trashedAt);
			},
			trashedAtLabel() {
				return this.hasTrashedDate ? this.formatRelativeDate(this.item?.trashedAt) : '';
			},
			trashedAtFullLabel() {
				return this.hasTrashedDate ? this.formatFullDate(this.item?.trashedAt) : '';
			},
			hasArchivedDate() {
				return this.mode === 'detailed' && Boolean(this.item?.archivedAt);
			},
			archivedAtLabel() {
				return this.hasArchivedDate ? this.formatRelativeDate(this.item?.archivedAt) : '';
			},
			archivedAtFullLabel() {
				return this.hasArchivedDate ? this.formatFullDate(this.item?.archivedAt) : '';
			},
			hasAuthor() {
				return this.author !== null;
			},
			hasAttribution() {
				return this.hasTrashedDate || this.hasArchivedDate;
			},
			hasMeta() {
				return this.showCollection || this.hasAuthor || this.hasAttribution;
			},
			hasContent() {
				return this.hasExcerpt || this.hasMeta;
			},
			// Desktop-only: render a checkbox that stays hidden until the card is hovered; clicking
			// it enters selection mode. Once mode is active the checkbox is shown unconditionally.
			showHoverSelect() {
				return this.selectable && !this.isMobile && !this.selectionEnabled;
			},
			// Mobile: in management sections the checkbox is shown permanently, so entering
			// selection mode does not require a separate toolbar button. The first tap toggles
			// selection just like the desktop hover checkbox.
			showMobileSelect() {
				return this.selectable && this.isMobile;
			},
			showSelectBox() {
				return this.selectionEnabled || this.showHoverSelect || this.showMobileSelect;
			},
			rootClass() {
				return ['note-document-card', this.mode === 'compact' ? 'note-document-card--compact' : '', this.mode === 'detailed' ? 'note-document-card--detailed' : '', this.mode === 'search' ? 'note-document-card--search' : '', this.showHoverSelect ? 'note-document-card--hover-select' : '', this.selectionEnabled ? 'note-document-card--selecting' : ''];
			},
			// The card avatar is note.ui.avatar-stack in row mode (one participant), so an author looks
			// the same here as in the activity feed, the history tiles and the viewers list. `color` is
			// the server identity hue (see IdentityColor); the palette stays a defensive fallback for a
			// payload built before that field existed.
			authorParticipants() {
				const author = this.author;
				if (!author) {
					return [];
				}
				return [{
					id: Number(author.id) || 0,
					name: String(author.name || ''),
					avatar: author.photoUrl || null,
					color: author.color || note_ui_avatarStack.avatarFallbackColor(author.id)
				}];
			},
			docHref() {
				const raw = this.item?.documentId ?? this.item?.id;
				const id = Number(raw);
				return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
			},
			collectionHref() {
				if (!this.hasCollectionLink) {
					return '';
				}
				const id = Number(this.item?.collectionId);
				return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
			}
		},
		mounted() {
			this.refreshHints();
		},
		updated() {
			this.refreshHints();
		},
		methods: {
			emitSelectToggle() {
				// `activate` tells the page to switch into selection mode first — set when the click
				// arrives from the hover checkbox (mode not yet on).
				this.$emit('select', {
					id: Number(this.item?.id) || 0,
					selected: !this.selected,
					activate: !this.selectionEnabled
				});
			},
			onCardClick(event) {
				// In selection mode a click anywhere on the card toggles it (fallback for cards
				// without a title-link overlay); interactive children stop propagation themselves.
				if (!this.selectionEnabled) {
					return;
				}
				event.preventDefault();
				this.emitSelectToggle();
			},
			onTitleClick(event) {
				// In selection mode the whole card (the stretched title-link overlay) toggles
				// selection instead of opening the document.
				if (this.selectionEnabled) {
					event.preventDefault();
					event.stopPropagation();
					this.emitSelectToggle();
					return;
				}
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.$emit('open', this.item);
			},
			refreshHints() {
				if (this.$el instanceof HTMLElement) {
					ui_hint.Hint.init(this.$el);
				}
			},
			onActionsClick(event) {
				event?.stopPropagation?.();
			},
			onSelectClick(event) {
				// Keep the click off the card overlay so the document does not open
				event?.stopPropagation?.();
			},
			onSelectPointerDown() {
				// Mark that the imminent toggle is pointer-driven; keyboard toggles never reach here.
				this.pointerToggle = true;
			},
			onSelectKeyDown() {
				// Keyboard interaction (Space) fires keydown before change — clear any pointer flag left
				// stale by a cancelled pointer gesture (pointerdown without a following change), so the
				// keyboard toggle never wrongly triggers blur.
				this.pointerToggle = false;
			},
			onSelectChange(event) {
				// Stateless component: emit the intended toggle relative to the current prop; the page owns selection
				this.emitSelectToggle();

				// Drop focus only for pointer input: a deselect that exits selection mode collapses the
				// checkbox back to `width: 0` (see document-list.css), and a pointer click leaves no
				// `:focus-visible` to hold it open, so the focus would sit on an invisible element.
				// Keyboard users must keep focus so multi-select stays operable (WCAG 2.4.3).
				const pointerDriven = this.pointerToggle;
				this.pointerToggle = false;
				if (!pointerDriven) {
					return;
				}
				const input = event?.target;
				if (input instanceof HTMLElement) {
					input.blur();
				}
			},
			onCollectionClick(event) {
				// In selection mode the collection chip toggles the card too, never navigates.
				if (this.selectionEnabled) {
					event?.preventDefault?.();
					event?.stopPropagation?.();
					this.emitSelectToggle();
					return;
				}
				if (!this.hasCollectionLink) {
					return;
				}
				event?.stopPropagation?.();
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.$emit('open-collection', {
					collectionId: Number(this.item?.collectionId) || 0,
					collectionTitle: this.collectionTitle
				});
			},
			toTimestampSec(value) {
				if (typeof value !== 'string' || value === '') {
					return null;
				}
				const ms = Date.parse(value);
				if (Number.isNaN(ms)) {
					return null;
				}
				return Math.floor(ms / 1000);
			},
			formatRelativeDate(value) {
				const ts = this.toTimestampSec(value);
				return ts === null ? '' : main_date.DateTimeFormat.format('x', ts);
			},
			formatFullDate(value) {
				const ts = this.toTimestampSec(value);
				if (ts === null) {
					return '';
				}
				const bitrixFormat = main_core.Loc.getMessage('FORMAT_DATETIME') || 'DD.MM.YYYY HH:MI:SS';
				const phpFormat = main_date.DateTimeFormat.convertBitrixFormat(bitrixFormat);
				return main_date.DateTimeFormat.format(phpFormat, ts);
			}
		},
		// The card root is out of the tab order but focusable: DocumentList parks the focus here when the
		// paging retry unmounts the button it was pressed on, and a click on a child with nothing
		// focusable of its own lands here too - which is why the hover-select rule asks for
		// `:focus-visible` and not `:focus-within` (see document-list.css).
		// language=Vue
		template: `
		<div :class="rootClass" tabindex="-1" @click="onCardClick">
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
	`
	};

	const DocumentList = {
		name: 'NoteDocumentList',
		components: {
			DocumentListItem,
			Loader: note_ui_loader.Loader
		},
		props: {
			items: {
				type: Array,
				default: () => []
			},
			hasMore: {
				type: Boolean,
				default: false
			},
			loading: {
				type: Boolean,
				default: false
			},
			mode: {
				type: String,
				default: 'cards',
				validator: value => value === 'cards' || value === 'compact' || value === 'detailed' || value === 'search'
			},
			selectionEnabled: {
				type: Boolean,
				default: false
			},
			// List supports multi-select: enables the desktop hover checkbox on each card.
			selectable: {
				type: Boolean,
				default: false
			},
			isMobile: {
				type: Boolean,
				default: false
			},
			selectedIds: {
				type: [Set, Array],
				default: () => []
			},
			// The last "load more" came back with a failure. Automatic paging stops until the user asks
			// again: the sentinel of a list that did not grow stays in view, and every re-render builds a
			// new IntersectionObserver whose starting callback reports it as intersecting - left alone
			// that walks the host into the same failing request over and over. Announcing the failure is
			// the host's job (its live region outlives the list), so the block below keeps aria-live off.
			loadMoreFailed: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open', 'open-collection', 'load-more', 'retry-load-more', 'select'],
		computed: {
			selectedSet() {
				return this.selectedIds instanceof Set ? this.selectedIds : new Set(this.selectedIds);
			},
			isEmpty() {
				return !this.loading && this.items.length === 0;
			},
			emptyMessage() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_EMPTY') || '';
			},
			loadMoreErrorMessage() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_LOAD_MORE_ERROR') || '';
			},
			loadMoreRetryLabel() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_LOAD_MORE_RETRY') || '';
			},
			rootClass() {
				return ['note-document-cards', this.mode === 'compact' ? 'note-document-cards--compact' : '',
				// Reserve room at the bottom while the floating bulk-actions pill is up (shown once
				// something is selected), so the last card can scroll clear of it and stay reachable.
				this.selectedSet.size > 0 ? 'note-document-cards--bulk-active' : ''];
			}
		},
		mounted() {
			this.observer = null;
			this.setupObserver();
		},
		updated() {
			this.setupObserver();
		},
		beforeUnmount() {
			this.destroyObserver();
		},
		methods: {
			onOpen(item) {
				this.$emit('open', item);
			},
			onOpenCollection(payload) {
				this.$emit('open-collection', payload);
			},
			onSelect(payload) {
				this.$emit('select', payload);
			},
			// A deliberate request for the page that failed. It travels as its own event so the host can
			// keep refusing the automatic one while still serving this one.
			// The button sits in the branch that the paging loader takes over as soon as the host starts
			// the request, so the focus has to leave it first or it ends up in <body> (WCAG 2.4.3). It
			// goes to the last card. The list root and the grid survive the swap just as well, but the
			// root sends the next Tab back to the top of the list and drags the viewport there, while
			// the card keeps the user where they were: tabbing on walks its own controls and then goes
			// straight into whatever arrived, because new cards are appended right after it. The card
			// also outlives the last page, which takes the sentinel away with hasMore.
			// preventScroll, because a card is 100-200px tall and the button the user just pressed sits
			// right below it: on a short window the default focus would scroll the card into view and
			// take the answer the user is waiting for out of it. The card is where it is by being next
			// to that button, and a Tab from it scrolls on its own if it did end up out of sight.
			onRetryLoadMore() {
				const lastCard = this.$refs.grid?.lastElementChild;
				if (lastCard instanceof HTMLElement) {
					lastCard.focus({
						preventScroll: true
					});
				}
				this.$emit('retry-load-more');
			},
			isSelected(id) {
				return this.selectedSet.has(Number(id));
			},
			setupObserver() {
				this.destroyObserver();
				const sentinel = this.$refs.sentinel;
				if (!(sentinel instanceof HTMLElement)) {
					return;
				}
				this.observer = new IntersectionObserver(entries => {
					const entry = entries[0];
					if (entry?.isIntersecting && this.hasMore && !this.loading && !this.loadMoreFailed) {
						this.$emit('load-more');
					}
				}, {
					rootMargin: '100px'
				});
				this.observer.observe(sentinel);
			},
			destroyObserver() {
				if (this.observer) {
					this.observer.disconnect();
					this.observer = null;
				}
			},
			// Move focus to the list root. Called by the host page when the floating bulk-actions bar
			// collapses (exit / select-all off / after an action): the bar is teleported to <body>, so
			// once it hides the focus that sat on its buttons would be lost, breaking keyboard/AT flow
			// (WCAG 2.4.3). Landing on the (programmatically focusable, tabindex=-1) list root keeps the
			// next Tab anchored to the content instead of jumping to the end of the document.
			focusRoot() {
				const root = this.$refs.root;
				if (root instanceof HTMLElement) {
					root.focus();
				}
			}
		},
		// language=Vue
		template: `
		<div :class="rootClass" ref="root" tabindex="-1">
			<div v-if="loading && items.length === 0" class="note-document-cards__loader">
				<Loader />
			</div>
			<div v-else-if="isEmpty" class="note-document-cards__empty">{{ emptyMessage }}</div>
			<template v-else>
				<div class="note-document-cards__grid" ref="grid">
					<DocumentListItem
						v-for="item in items"
						:key="item.id"
						:item="item"
						:mode="mode"
						:selection-enabled="selectionEnabled"
						:selectable="selectable"
						:is-mobile="isMobile"
						:selected="isSelected(item.id)"
						@open="onOpen"
						@open-collection="onOpenCollection"
						@select="onSelect"
					>
						<template v-if="$slots.actions" #actions="slotProps">
							<slot name="actions" :item="slotProps.item" />
						</template>
					</DocumentListItem>
				</div>
				<div v-if="hasMore" ref="sentinel" class="note-document-cards__sentinel">
					<div v-if="loading" class="note-document-cards__loader">
						<Loader />
					</div>
					<div
						v-else-if="loadMoreFailed"
						class="note-document-cards__load-more-error"
						role="status"
						aria-live="off"
						data-testid="note-document-list-load-more-error"
					>
						<span class="note-document-cards__load-more-error-text">{{ loadMoreErrorMessage }}</span>
						<button
							type="button"
							class="ui-btn --air ui-btn-md --style-tinted ui-btn-no-caps"
							data-testid="note-document-list-load-more-retry"
							@click="onRetryLoadMore"
						>
							{{ loadMoreRetryLabel }}
						</button>
					</div>
				</div>
			</template>
		</div>
	`
	};

	// Section-dependent action sets (TPL-02): only actions valid for the section are rendered.
	const SECTION_ACTIONS = {
		active: [{
			type: 'move',
			icon: ui_iconSet_api_vue.Outline.MOVE_TO,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_MOVE',
			danger: false
		}, {
			type: 'archive',
			icon: ui_iconSet_api_vue.Outline.BOX_WITH_LID,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_ARCHIVE',
			danger: false
		}, {
			type: 'delete',
			icon: ui_iconSet_api_vue.Outline.TRASHCAN,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_DELETE',
			danger: true
		}],
		archive: [{
			type: 'restore',
			icon: ui_iconSet_api_vue.Outline.UNDO,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_RESTORE',
			danger: false
		}, {
			type: 'delete',
			icon: ui_iconSet_api_vue.Outline.TRASHCAN,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_DELETE',
			danger: true
		}],
		recycle: [{
			type: 'restore',
			icon: ui_iconSet_api_vue.Outline.UNDO,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_RESTORE',
			danger: false
		}, {
			type: 'hardDelete',
			icon: ui_iconSet_api_vue.Outline.TRASHCAN,
			labelId: 'NOTE_DOCUMENT_LIST_BULK_HARD_DELETE',
			danger: true
		}]
	};

	// Presentational only: emits intents, never touches the backend or owns selection state.
	const BulkActionsBar = {
		name: 'NoteBulkActionsBar',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			section: {
				type: String,
				required: true,
				validator: value => value === 'active' || value === 'archive' || value === 'recycle'
			},
			selectedCount: {
				type: Number,
				required: true
			},
			// "Select all" latch: the whole section is selected and newly paginated items join
			// automatically, so the pill shows "all selected" instead of a frozen number.
			allSelected: {
				type: Boolean,
				default: false
			},
			isMobile: {
				type: Boolean,
				default: false
			}
		},
		emits: ['action', 'select-all', 'clear'],
		data() {
			return {
				// The bar is teleported to <body>, outside the app root that carries the
				// design-system context class, so it must carry the current air theme context
				// itself — otherwise its --ui-color-* tokens fall back to the light values
				// (a white pill in dark theme).
				themeContextClass: note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(note_ui_themeContext.NoteThemeContext.get()),
				themeUnsubscribe: null
			};
		},
		created() {
			this.themeUnsubscribe = note_ui_themeContext.NoteThemeContext.subscribe(({
				data
			}) => {
				this.themeContextClass = note_ui_themeContext.NoteThemeContext.resolveDesignSystemContext(data?.theme);
			});
		},
		beforeUnmount() {
			this.themeUnsubscribe?.();
			this.themeUnsubscribe = null;
		},
		computed: {
			isVisible() {
				return this.selectedCount > 0;
			},
			actions() {
				return (SECTION_ACTIONS[this.section] || []).map(action => ({
					...action,
					label: main_core.Loc.getMessage(action.labelId) || ''
				}));
			},
			counterText() {
				// In "select all" mode the exact total is unknown (and would need a dedicated count
				// query), so the pill states "all selected" rather than a frozen page count.
				if (this.allSelected) {
					return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECTED_ALL') || '';
				}
				const count = Number(this.selectedCount) || 0;

				// Single "Selected: N" phrasing on purpose — a fixed label sidesteps plural agreement as
				// the count ticks up/down.
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECTED', {
					'#COUNT#': count
				}) || '';
			},
			selectAllLabel() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECT_ALL') || '';
			},
			toolbarLabel() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_TOOLBAR_ARIA') || '';
			},
			clearLabel() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_CLEAR_ARIA') || '';
			},
			selectAllIcon() {
				return ui_iconSet_api_vue.Outline.DOUBLE_CHECK;
			},
			clearIcon() {
				return ui_iconSet_api_vue.Outline.CROSS_L;
			},
			// Icons render larger on mobile (the buttons there are icon-only, square tap targets).
			// BIcon writes an inline --ui-icon-set__icon-size, so the size must come from the prop.
			iconSize() {
				return this.isMobile ? 22 : 18;
			},
			clearIconSize() {
				return this.isMobile ? 22 : 20;
			},
			rootClass() {
				return ['note-bulk-actions-bar', this.themeContextClass, this.isVisible ? 'note-bulk-actions-bar--visible' : '', this.isMobile ? 'note-bulk-actions-bar--mobile' : ''];
			}
		},
		methods: {
			onAction(type) {
				this.$emit('action', {
					type
				});
			},
			onSelectAll() {
				this.$emit('select-all');
			},
			onClear() {
				this.$emit('clear');
			}
		},
		// language=Vue
		template: `
		<div
			:class="rootClass"
			role="toolbar"
			:aria-label="toolbarLabel"
			:aria-hidden="isVisible ? null : 'true'"
		>
			<span
				class="note-bulk-actions-bar__counter"
				role="status"
				aria-live="polite"
				data-testid="note-bulk-counter"
			>{{ counterText }}</span>
			<span class="note-bulk-actions-bar__divider" aria-hidden="true"></span>
			<button
				type="button"
				class="note-bulk-actions-bar__btn note-bulk-actions-bar__btn--select-all"
				:class="{ 'note-bulk-actions-bar__btn--active': allSelected }"
				:aria-pressed="allSelected ? 'true' : 'false'"
				:title="selectAllLabel"
				:aria-label="selectAllLabel"
				:tabindex="isVisible ? null : -1"
				data-testid="note-bulk-select-all"
				@click="onSelectAll"
			>
				<BIcon :name="selectAllIcon" :size="iconSize" aria-hidden="true" />
				<span class="note-bulk-actions-bar__btn-text">{{ selectAllLabel }}</span>
			</button>
			<button
				v-for="action in actions"
				:key="action.type"
				type="button"
				class="note-bulk-actions-bar__btn"
				:class="{ 'note-bulk-actions-bar__btn--danger': action.danger }"
				:title="action.label"
				:aria-label="action.label"
				:tabindex="isVisible ? null : -1"
				:data-testid="'note-bulk-' + action.type"
				@click="onAction(action.type)"
			>
				<BIcon :name="action.icon" :size="iconSize" aria-hidden="true" />
				<span class="note-bulk-actions-bar__btn-text">{{ action.label }}</span>
			</button>
			<span class="note-bulk-actions-bar__divider" aria-hidden="true"></span>
			<button
				type="button"
				class="note-bulk-actions-bar__btn note-bulk-actions-bar__btn--icon"
				:aria-label="clearLabel"
				:tabindex="isVisible ? null : -1"
				data-testid="note-bulk-clear"
				@click="onClear"
			>
				<BIcon :name="clearIcon" :size="clearIconSize" aria-hidden="true" />
			</button>
		</div>
	`
	};

	// Presentational only: owns the collapsed flag and nothing else. The label, the content
	// and the decision to render the section at all belong to the host.
	const DocumentSection = {
		name: 'NoteDocumentSection',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			label: {
				type: String,
				default: ''
			},
			testId: {
				type: String,
				default: ''
			},
			// Heading level of the label. The outline belongs to the page and the two hosts sit at
			// different depths, so the level is theirs to name; 0 leaves the label a plain span.
			headingLevel: {
				type: Number,
				default: 0
			}
		},
		emits: ['toggle'],
		data() {
			return {
				collapsed: false
			};
		},
		computed: {
			toggleIcon() {
				return this.collapsed ? ui_iconSet_api_vue.Set.CHEVRON_DOWN : ui_iconSet_api_vue.Set.CHEVRON_UP;
			},
			// Derived from the host's id so an e2e locator for the section reads as its own family:
			// note-workspace-about-documents / note-workspace-about-documents-toggle.
			toggleTestId() {
				return this.testId ? `${this.testId}-toggle` : null;
			},
			labelTag() {
				const level = Math.trunc(this.headingLevel);
				return level >= 1 && level <= 6 ? `h${level}` : 'span';
			},
			// Names the action and stays the same in both states: the state is what aria-expanded
			// carries, and a name that flips with it would be announced twice.
			toggleLabel() {
				return main_core.Loc.getMessage('NOTE_DOCUMENT_LIST_SECTION_TOGGLE_ARIA') || '';
			}
		},
		methods: {
			toggle() {
				this.collapsed = !this.collapsed;
				this.$emit('toggle', this.collapsed);
			}
		},
		// language=Vue
		template: `
		<div class="note-document-section" :data-testid="testId || null">
			<div class="note-document-section__header" @click="toggle">
				<component :is="labelTag" class="note-document-section__label">{{ label }}</component>
				<button
					class="note-document-section__toggle"
					type="button"
					:data-testid="toggleTestId"
					:aria-label="toggleLabel"
					:aria-expanded="!collapsed"
				>
					<BIcon :name="toggleIcon" :size="16" />
				</button>
			</div>
			<slot v-if="!collapsed"/>
		</div>
	`
	};

	/**
	 * Page-level multiple-selection state for the document list.
	 *
	 * Lives on the page (data()), NOT in the sidebar store. Flat set of document ids
	 * plus a selection-mode flag. Returned as a single reactive object so Options-API
	 * pages can hold it in data() without ref-unwrap surprises. "Select all" is not
	 * enumerated here — pages route it to over-section endpoints.
	 */
	function createSelection() {
		return ui_vue3.reactive({
			mode: false,
			ids: new Set(),
			get count() {
				return this.ids.size;
			},
			has(id) {
				return this.ids.has(Number(id));
			},
			toggle(id) {
				const key = Number(id);
				if (this.ids.has(key)) {
					this.ids.delete(key);
				} else {
					this.ids.add(key);
				}
			},
			set(ids) {
				this.ids = new Set((Array.isArray(ids) ? ids : [...ids]).map(id => Number(id)));
			},
			clear() {
				this.ids.clear();
			},
			enter() {
				this.mode = true;
			},
			// Leaving selection mode always drops the current selection
			exit() {
				this.mode = false;
				this.ids.clear();
			}
		});
	}

	exports.BulkActionsBar = BulkActionsBar;
	exports.DocumentList = DocumentList;
	exports.DocumentListItem = DocumentListItem;
	exports.DocumentSection = DocumentSection;
	exports.createSelection = createSelection;

})(this.BX.Note.Ui = this.BX.Note.Ui || {}, BX, BX.UI.System.Checkbox, window, window, BX, BX.Note.Ui, BX.Main, BX.UI, BX.Note.Ui, BX.UI.IconSet, BX.Note.Ui, BX.Vue3);
//# sourceMappingURL=document-list.bundle.js.map
