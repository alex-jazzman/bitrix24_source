import { Loc, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import 'ui.notification';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { NoteThemeContext } from 'note.ui.theme-context';
import { DocumentList, BulkActionsBar, createSelection } from 'note.ui.document-list';
import { ActionMenuService } from 'note.ui.action-menu';
import { NoteEvent } from 'note.sidebar';
import { ArchiveService } from './services/archive-service';

const PAGE_SIZE = 50;

export const NoteArchivePageComponent = {
	name: 'NoteArchivePage',
	components: {
		BIcon,
		DocumentList,
		BulkActionsBar,
	},
	inject: {
		sidebarState: { from: 'noteSidebarState', default: null },
	},
	emits: ['open'],
	data()
	{
		return {
			items: [],
			loading: false,
			restoringAll: false,
			deletingAll: false,
			hasMore: false,
			hasError: false,
			nextCursor: null,
			requestId: 0,
			selection: createSelection(),
			// "Select all" latch: routes bulk restore/delete to the over-section endpoints
			// (restoreAll/deleteAll). Any manual toggle drops it.
			allSelected: false,
			bulkBusy: false,
		};
	},
	computed: {
		Outline: (): typeof Outline => Outline,
		isMobile(): boolean
		{
			return Boolean(this.sidebarState?.isMobile);
		},
		selectedCount(): number
		{
			return this.selection.count;
		},
		showSelectButton(): boolean
		{
			return !this.hasError && this.hasItems;
		},
		listItems(): Array
		{
			return this.items.map((item) => ({
				id: item.id,
				title: item.title,
				snippet: '',
				excerpt: item.excerpt || '',
				author: item.author || null,
				documentId: item.id,
				collectionId: item.collectionId || 0,
				collectionTitle: item.collectionTitle || '',
				archivedBy: item.archivedBy || null,
				archivedAt: item.archivedAt || null,
			}));
		},
		titleText(): string
		{
			return Loc.getMessage('NOTE_ARCHIVE_PAGE_TITLE') || '';
		},
		breadcrumbRoot(): string
		{
			return Loc.getMessage('NOTE_ARCHIVE_BREADCRUMB_ROOT') || '';
		},
		subtitleText(): string
		{
			return Loc.getMessage('NOTE_ARCHIVE_PAGE_SUBTITLE') || '';
		},
		emptyHint(): string
		{
			return Loc.getMessage('NOTE_ARCHIVE_PAGE_EMPTY_HINT') || '';
		},
		moreMenuLabel(): string
		{
			return Loc.getMessage('NOTE_ARCHIVE_PAGE_MORE_LABEL') || '';
		},
		canRestoreAny(): boolean
		{
			return this.items.some((item) => item.canRestore);
		},
		hasItems(): boolean
		{
			return this.items.length > 0;
		},
		headerMenuItems(): Array
		{
			const items = [];

			items.push({
				text: Loc.getMessage('NOTE_ARCHIVE_PAGE_RESTORE_ALL') || '',
				iconModifier: 'o-undo',
				testId: 'note-archive-menu-restore-all',
				disabled: !this.canRestoreAny || this.restoringAll || this.loading,
				onClick: () => { void this.onRestoreAll(); },
			});

			items.push({
				text: Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL') || '',
				iconModifier: 'o-trashcan',
				testId: 'note-archive-menu-delete-all',
				danger: true,
				disabled: !this.hasItems || this.deletingAll || this.restoringAll || this.loading,
				onClick: () => { void this.onDeleteAll(); },
			});

			return items;
		},
	},
	created()
	{
		this.service = new ArchiveService();
		this.actionMenuService = markRaw(new ActionMenuService({ popupClass: 'note-action-menu' }));
		void this.loadPage(false);
	},
	beforeUnmount()
	{
		this.actionMenuService?.destroy?.();
		this.actionMenuService = null;
	},
	methods: {
		goRoot(): void
		{
			this.$router.push({ name: 'archive' });
		},
		async loadPage(append: boolean): Promise<void>
		{
			if (!append)
			{
				this.items = [];
				this.nextCursor = null;
				this.hasMore = false;
				this.hasError = false;
			}

			const currentRequestId = ++this.requestId;
			this.loading = true;

			try
			{
				const response = await this.service.list({
					limit: PAGE_SIZE,
					afterCursor: append ? this.nextCursor : null,
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.items = append ? [...this.items, ...response.items] : response.items;
				this.nextCursor = response.nextCursor;
				this.hasMore = Boolean(response.nextCursor);

				// In "select all" mode paginated-in items join the selection so they render checked.
				if (append && this.allSelected && this.selection.mode)
				{
					const nextIds = response.items.map((item) => Number(item.id) || 0).filter((id) => id > 0);
					this.selection.set([...this.selection.ids, ...nextIds]);
				}
			}
			catch (error)
			{
				if (currentRequestId !== this.requestId)
				{
					return;
				}

				if (!append)
				{
					this.hasError = true;
				}
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				if (currentRequestId === this.requestId)
				{
					this.loading = false;
				}
			}
		},
		onLoadMore(): void
		{
			if (this.loading || !this.hasMore)
			{
				return;
			}

			void this.loadPage(true);
		},
		resetSelection(): void
		{
			// Hand focus back to the list when the floating bulk-actions bar (teleported to <body>)
			// is about to hide, so keyboard/AT focus is not lost (WCAG 2.4.3). A soft exit from
			// unticking the last card leaves focus on that card and must be left alone.
			const restoreFocus = this.isFocusInsideBulkBar();
			this.allSelected = false;
			this.selection.exit();
			if (restoreFocus)
			{
				void this.$nextTick(() => this.$refs.documentList?.focusRoot());
			}
		},
		isFocusInsideBulkBar(): boolean
		{
			return document.activeElement?.closest?.('.note-bulk-actions-bar') != null;
		},
		onSelect({ id, selected, activate }): void
		{
			const key = Number(id) || 0;
			if (key <= 0)
			{
				return;
			}

			// Desktop hover checkbox: enter selection mode before applying the toggle.
			if (activate && !this.selection.mode)
			{
				this.selection.enter();
			}

			if (this.selection.has(key) !== selected)
			{
				this.selection.toggle(key);
			}

			// Deselecting the last item leaves selection mode so the checkboxes do not linger.
			if (this.selection.count === 0)
			{
				this.resetSelection();

				return;
			}

			// Keep the "select all" latch in sync with the manual pick: when every loaded item
			// is ticked and nothing is left to paginate, the manual set IS the whole section, so the
			// latch (button highlight + action routing) reflects it; otherwise it stays a subset.
			this.allSelected = !this.hasMore && this.selection.count === this.items.length;
		},
		onSelectAll(): void
		{
			if (this.allSelected)
			{
				this.resetSelection();

				return;
			}

			this.allSelected = true;
			this.selection.set(this.items.map((item) => Number(item.id) || 0).filter((id) => id > 0));
		},
		onBulkClear(): void
		{
			this.resetSelection();
		},
		onBulkAction({ type }): void
		{
			if (this.bulkBusy)
			{
				return;
			}

			if (type === 'restore')
			{
				void this.runRestore();
			}
			else if (type === 'delete')
			{
				void this.runDelete();
			}
		},
		async runRestore(): Promise<void>
		{
			// "Select all" reuses the over-section restore (covers unloaded documents).
			if (this.allSelected)
			{
				await this.onRestoreAll();
				this.resetSelection();

				return;
			}

			const ids = [...this.selection.ids];
			if (ids.length === 0)
			{
				return;
			}

			await this.runBulk(() => this.service.restoreMany(ids), { restored: true });
		},
		async runDelete(): Promise<void>
		{
			if (this.allSelected)
			{
				await this.onDeleteAll();
				this.resetSelection();

				return;
			}

			const ids = [...this.selection.ids];
			if (ids.length === 0)
			{
				return;
			}

			const confirmed = await this.confirmBulkDelete(ids);
			if (!confirmed)
			{
				return;
			}

			await this.runBulk(() => this.service.deleteMany(ids, confirmed.withNested), { restored: false });
		},
		confirmBulkDelete(ids: number[]): Promise<?Object>
		{
			// Archive is a flat list with no nesting UI, so bulk delete removes exactly the selected
			// documents — no "with nested" option and no subtree dry-run.
			return this.openBulkConfirm({
				title: Loc.getMessage('NOTE_ARCHIVE_BULK_DELETE_TITLE') || '',
				okText: Loc.getMessage('NOTE_ARCHIVE_BULK_DELETE_ACTION') || '',
				countKey: 'NOTE_DOCUMENT_LIST_BULK_DELETE_COUNT',
				count: ids.length,
			});
		},
		async runBulk(operation: () => Promise<Object>, { restored }: { restored: boolean }): Promise<void>
		{
			this.bulkBusy = true;
			try
			{
				const outcome = await operation();
				this.reportOutcome(outcome, restored ? 'restore' : 'delete');
				if (restored && Number(outcome?.processedCount) > 0)
				{
					this.emitBulkRestored();
				}
				this.resetSelection();
			}
			catch (error)
			{
				this.showBulkError(error);
			}
			finally
			{
				this.bulkBusy = false;
			}

			// Re-fetch on both success and failure so the list reflects the server's authoritative state.
			await this.loadPage(false);
		},
		emitBulkRestored(): void
		{
			EventEmitter.emit(NoteEvent.DOCUMENTS_BULK_RESTORED, new BaseEvent({
				data: { restoredCollections: [] },
			}));
		},
		reportOutcome(outcome: Object, action: 'restore' | 'delete'): void
		{
			if (outcome?.limitExceeded)
			{
				this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');

				return;
			}

			const processed = Number(outcome?.processedCount) || 0;
			const skipped = Number(outcome?.skippedCount) || 0;
			const noAccess = Number(outcome?.skippedByAccessCount) || 0;

			if (processed === 0)
			{
				if (skipped > 0 && noAccess === skipped)
				{
					this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL') || '');
				}
				else
				{
					this.showSuccessToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NOTHING') || '');
				}

				return;
			}

			if (skipped === 0)
			{
				const key = action === 'restore' ? 'NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE' : 'NOTE_DOCUMENT_LIST_BULK_DONE_DELETE';
				this.showSuccessToast(Loc.getMessagePlural(key, processed, { '#COUNT#': processed }));

				return;
			}

			// Partial success: a single whole phrase pluralised on the processed count.
			const partialKey = action === 'restore' ? 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE' : 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_DELETE';
			this.showSuccessToast(Loc.getMessagePlural(partialKey, processed, { '#DONE#': processed, '#SKIPPED#': skipped }));
		},
		showBulkError(error: mixed): void
		{
			const code = String(error?.code || '');
			if (code === 'NOTE_BULK_LIMIT_EXCEEDED')
			{
				this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');

				return;
			}

			this.showErrorToast(error?.message || (Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_ERROR') || ''));
		},
		openBulkConfirm({ title, okText, countKey, count }): Promise<?Object>
		{
			return new Promise((resolve) => {
				let isResolved = false;

				const finish = (value) => {
					if (isResolved)
					{
						return;
					}
					isResolved = true;
					resolve(value);
				};

				const formatCount = (n) => (Loc.getMessagePlural(countKey, n, { '#COUNT#': n }) || '');

				const textNode = Tag.render`<div class="note-archive-bulk-confirm-text"></div>`;
				textNode.textContent = formatCount(Number(count) || 0);

				const content = Tag.render`
					<div class="note-archive-bulk-confirm-content">
						${textNode}
					</div>
				`;

				// Matches the single-delete dialog: no red button, inverted order
				// (prominent Cancel on the left, understated Delete on the right).
				const okButton = new Button({
					text: String(okText || ''),
					dataset: { testid: 'note-dialog-confirm' },
					size: ButtonSize.LARGE,
					style: AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						finish({ withNested: false });
						dialog.hide();
					},
				});

				const cancelButton = new Button({
					text: Loc.getMessage('NOTE_ARCHIVE_BULK_CANCEL') || '',
					dataset: { testid: 'note-dialog-cancel' },
					size: ButtonSize.LARGE,
					style: AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						finish(null);
						dialog.hide();
					},
				});

				const dialog = new Dialog({
					title: String(title || ''),
					content,
					hasOverlay: true,
					overlay: true,
					width: 420,
					centerButtons: [cancelButton, okButton],
					events: {
						onHide: () => {
							finish(null);
						},
					},
				});

				NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		},
		async onRestoreAll(): Promise<void>
		{
			if (this.restoringAll || !this.canRestoreAny)
			{
				return;
			}

			this.restoringAll = true;

			try
			{
				const { restoredCount, restoredCollections } = await this.service.restoreAll();
				if (restoredCount > 0)
				{
					EventEmitter.emit(NoteEvent.DOCUMENTS_BULK_RESTORED, new BaseEvent({
						data: {
							restoredCollections: Array.isArray(restoredCollections) ? restoredCollections : [],
						},
					}));
				}
				await this.loadPage(false);
				const message = (Loc.getMessage('NOTE_ARCHIVE_PAGE_RESTORE_ALL_SUCCESS') || '')
					.replace('#COUNT#', String(restoredCount))
				;
				this.showSuccessToast(message);
			}
			catch (error)
			{
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				this.restoringAll = false;
			}
		},
		async onDeleteAll(): Promise<void>
		{
			if (this.deletingAll || this.restoringAll || !this.hasItems)
			{
				return;
			}

			const confirmed = await this.confirm({
				title: Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_CONFIRM_TITLE') || '',
				message: Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_CONFIRM_MESSAGE') || '',
				okText: Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_ACTION') || '',
			});
			if (!confirmed)
			{
				return;
			}

			this.deletingAll = true;

			try
			{
				const { deletedCount } = await this.service.deleteAll();
				await this.loadPage(false);
				if (deletedCount > 0)
				{
					const message = (Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_SUCCESS') || '')
						.replace('#COUNT#', String(deletedCount))
					;
					this.showSuccessToast(message);
				}
				else
				{
					this.showSuccessToast(Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL_NOTHING') || '');
				}
			}
			catch (error)
			{
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				this.deletingAll = false;
			}
		},
		confirm({ title, message, okText }: {
			title: string,
			message: string,
			okText: string,
		}): Promise<boolean>
		{
			return new Promise((resolve) => {
				let isResolved = false;
				const finish = (value) => {
					if (isResolved)
					{
						return;
					}

					isResolved = true;
					resolve(value);
				};

				const content = Tag.render`
					<div class="note-archive-confirm-content">
						${String(message || '')}
					</div>
				`;
				const dialog = new Dialog({
					title: String(title || ''),
					content,
					hasOverlay: true,
					overlay: true,
					width: 420,
					centerButtons: [
						new Button({
							text: Loc.getMessage('NOTE_ARCHIVE_PAGE_CONFIRM_CANCEL') || '',
							dataset: { testid: 'note-dialog-cancel' },
							size: ButtonSize.LARGE,
							style: AirButtonStyle.FILLED,
							useAirDesign: true,
							onclick: () => {
								finish(false);
								dialog.hide();
							},
						}),
						new Button({
							text: String(okText || ''),
							dataset: { testid: 'note-dialog-confirm' },
							size: ButtonSize.LARGE,
							style: AirButtonStyle.PLAIN,
							useAirDesign: true,
							onclick: () => {
								finish(true);
								dialog.hide();
							},
						}),
					],
					events: {
						onHide: () => {
							finish(false);
						},
					},
				});

				NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		},
		onOpen(item): void
		{
			this.$emit('open', { documentId: item.documentId });
		},
		onOpenCollection({ collectionId }): void
		{
			if (!collectionId)
			{
				return;
			}
			this.$router.push({ name: 'workspace', params: { id: collectionId } });
		},
		openMoreMenu(event: MouseEvent): void
		{
			const target = event?.currentTarget;
			if (!this.actionMenuService || !(target instanceof HTMLElement))
			{
				return;
			}

			const items = this.headerMenuItems;
			if (items.length === 0)
			{
				return;
			}

			this.actionMenuService.open(items, target, {
				key: 'archive-header',
				popupClass: 'note-action-menu',
			});
		},
		showSuccessToast(text: string): void
		{
			if (!Type.isStringFilled(text))
			{
				return;
			}

			BX.UI.Notification.Center.notify({ content: text, position: 'top-right' });
		},
		showErrorToast(text: string): void
		{
			const message = Type.isStringFilled(text)
				? text
				: (Loc.getMessage('NOTE_ARCHIVE_PAGE_ERROR_GENERIC') || '')
			;
			if (!Type.isStringFilled(message))
			{
				return;
			}

			BX.UI.Notification.Center.notify({ content: message, position: 'top-right' });
		},
	},
	// language=Vue
	template: `
		<div class="note-archive-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-document-header">
					<div class="note-page-document-titles">
						<div class="note-page-breadcrumb">
							<button
								type="button"
								class="note-page-breadcrumb-link"
								@click="goRoot"
							>{{ breadcrumbRoot }}</button>
						</div>
					</div>
					<div class="note-page-document-header-right">
						<div class="note-page-document-actions">
							<button
								v-if="hasItems"
								type="button"
								class="note-page-document-action-icon"
								:title="moreMenuLabel"
								:aria-label="moreMenuLabel"
								data-testid="note-archive-more"
								@click="openMoreMenu"
							>
								<div class="ui-icon-set --more-l"></div>
							</button>
						</div>
					</div>
				</div>
			</teleport>
			<div class="note-archive-page__body">
				<div class="note-archive-page-heading">
					<h2 class="note-archive-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-archive-page-subtitle">{{ subtitleText }}</p>
				</div>
				<DocumentList
					v-if="!hasError && (loading || hasItems)"
					ref="documentList"
					mode="detailed"
					:items="listItems"
					:has-more="hasMore"
					:loading="loading"
					:selection-enabled="selection.mode"
					:selectable="showSelectButton"
					:is-mobile="isMobile"
					:selected-ids="selection.ids"
					@open="onOpen"
					@open-collection="onOpenCollection"
					@load-more="onLoadMore"
					@select="onSelect"
				/>
				<div
					v-else-if="!hasError"
					class="note-archive-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>

			<teleport to="body">
				<BulkActionsBar
					section="archive"
					:selected-count="selectedCount"
					:all-selected="allSelected"
					:is-mobile="isMobile"
					@action="onBulkAction"
					@select-all="onSelectAll"
					@clear="onBulkClear"
				/>
			</teleport>
		</div>
	`,
};
