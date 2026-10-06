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
import { RecycleBinService } from './services/recyclebin-service';
import { openBulkRestorePopup } from './bulk-restore-popup';
import { openOrphanRestorePopup } from './orphan-restore-popup';

const PAGE_SIZE = 50;

export const NoteRecycleBinPageComponent = {
	name: 'NoteRecycleBinPage',
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
			emptyingTrash: false,
			hasMore: false,
			hasError: false,
			isAdmin: false,
			nextCursor: null,
			requestId: 0,
			selection: createSelection(),
			// "Select all" latch: routes bulk restore/hard-delete to the over-section endpoints
			// (restoreAll/empty). Any manual toggle drops it.
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
				excerpt: item.excerpt || '',
				author: item.author || null,
				documentId: item.documentId,
				recycleBinId: item.id,
				canRestore: Boolean(item.canRestore),
				canHardDelete: Boolean(item.canHardDelete),
				orphan: Boolean(item.orphan),
				collectionId: item.collectionId || 0,
				collectionTitle: item.collectionTitle || '',
				trashedBy: item.trashedBy || null,
				trashedAt: item.trashedAt || null,
			}));
		},
		titleText(): string
		{
			return Loc.getMessage('NOTE_RECYCLEBIN_PAGE_TITLE') || '';
		},
		breadcrumbRoot(): string
		{
			return Loc.getMessage('NOTE_RECYCLEBIN_BREADCRUMB_ROOT') || '';
		},
		subtitleText(): string
		{
			return Loc.getMessage('NOTE_RECYCLEBIN_PAGE_SUBTITLE') || '';
		},
		emptyHint(): string
		{
			return Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_HINT') || '';
		},
		moreMenuLabel(): string
		{
			return Loc.getMessage('NOTE_RECYCLEBIN_PAGE_MORE_LABEL') || '';
		},
		hasItems(): boolean
		{
			return this.items.length > 0;
		},
		headerMenuItems(): Array
		{
			const items = [];

			items.push({
				text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
				iconModifier: 'o-undo',
				testId: 'note-trash-menu-restore-all',
				disabled: this.restoringAll || this.loading,
				onClick: () => { void this.onRestoreAll(); },
			});

			items.push({
				text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION') || '',
				iconModifier: 'o-trashcan',
				testId: 'note-trash-menu-delete-all',
				danger: true,
				disabled: this.emptyingTrash || this.loading,
				onClick: () => { void this.onEmptyTrash(); },
			});

			return items;
		},
	},
	created()
	{
		this.service = new RecycleBinService();
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
			this.$router.push({ name: 'recyclebin' });
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
				this.isAdmin = response.isAdmin;

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
			// Ids here are recycle-bin record ids (DocumentList item.id === recycleBinId on this page).
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
			else if (type === 'hardDelete')
			{
				void this.runHardDelete();
			}
		},
		async runRestore(): Promise<void>
		{
			// "Select all" reuses the over-section restore (orphan-aware, covers unloaded records).
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

			await this.restoreSelection(ids);
		},
		// Which of the selected records are orphans (original collection gone) — read from the loaded
		// items, each of which carries an `orphan` flag. Lets us ask for a target BEFORE restoring.
		selectionOrphanIds(recycleBinIds: number[]): number[]
		{
			const orphanById = new Map(this.items.map((item) => [Number(item.id), item.orphan === true]));

			return recycleBinIds
				.map((id) => Number(id))
				.filter((id) => orphanById.get(id) === true);
		},
		async restoreSelection(recycleBinIds: number[]): Promise<void>
		{
			const orphanIds = this.selectionOrphanIds(recycleBinIds);
			const orphanIdSet = new Set(orphanIds);

			// Orphans need a target collection. Ask for it BEFORE restoring anything, so pressing
			// Cancel truly cancels — nothing is restored (previously non-orphans were committed first,
			// then the popup shown, leaving a partial restore on cancel).
			let target = null;
			if (orphanIds.length > 0)
			{
				target = await openOrphanRestorePopup({
					bodyText: Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_TARGET_TEXT') || '',
				});
				if (!target)
				{
					return;
				}
			}

			this.bulkBusy = true;
			let totalProcessed = 0;
			let lastOutcome = null;
			try
			{
				// Two phases, because targetCollectionId in the restore service applies to every record
				// it is given: non-orphans restore to their original collection (target null), orphans
				// go to the chosen target. Both run only after the popup was confirmed.
				const nonOrphanIds = recycleBinIds
					.map((id) => Number(id))
					.filter((id) => !orphanIdSet.has(id));
				if (nonOrphanIds.length > 0)
				{
					lastOutcome = await this.service.restoreMany(nonOrphanIds, null);
					totalProcessed += Number(lastOutcome?.processedCount) || 0;
				}
				if (orphanIds.length > 0)
				{
					lastOutcome = await this.service.restoreMany(orphanIds, target.collectionId);
					totalProcessed += Number(lastOutcome?.processedCount) || 0;
				}

				this.reportRestoreOutcome({ ...(lastOutcome || {}), processedCount: totalProcessed }, false);
				if (totalProcessed > 0)
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
				await this.loadPage(false);
			}
		},
		async runHardDelete(): Promise<void>
		{
			if (this.allSelected)
			{
				await this.onEmptyTrash();
				this.resetSelection();

				return;
			}

			const ids = [...this.selection.ids];
			if (ids.length === 0)
			{
				return;
			}

			// AC-032: reinforced confirm — hard delete is permanent and cannot be undone.
			const confirmed = await this.confirm({
				title: Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_TITLE') || '',
				message: Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_MESSAGE') || '',
				okText: Loc.getMessage('NOTE_RECYCLEBIN_BULK_HARD_DELETE_ACTION') || '',
				danger: true,
			});
			if (!confirmed)
			{
				return;
			}

			this.bulkBusy = true;
			try
			{
				const outcome = await this.service.hardDeleteMany(ids);
				this.reportRestoreOutcome(outcome, false, 'delete');
				this.resetSelection();
			}
			catch (error)
			{
				this.showBulkError(error);
			}
			finally
			{
				this.bulkBusy = false;
				await this.loadPage(false);
			}
		},
		emitBulkRestored(): void
		{
			EventEmitter.emit(NoteEvent.DOCUMENTS_BULK_RESTORED, new BaseEvent({
				data: { restoredCollections: [] },
			}));
		},
		reportRestoreOutcome(outcome: ?Object, orphanPending: boolean, action: 'restore' | 'delete' = 'restore'): void
		{
			if (outcome?.limitExceeded)
			{
				this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');

				return;
			}

			const processed = Number(outcome?.processedCount) || 0;
			const skipped = Number(outcome?.skippedCount) || 0;
			const noAccess = Number(outcome?.skippedByAccessCount) || 0;
			const orphan = Number(outcome?.skippedOrphanCount) || 0;

			if (processed === 0)
			{
				// A pending-orphan restore isn't a failure: nothing landed yet because the user
				// still has to pick a target — keep the explanatory line instead of "no access".
				if (orphanPending && orphan > 0)
				{
					this.showSuccessToast(Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_PENDING') || '');
				}
				else if (skipped > 0 && noAccess === skipped)
				{
					this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NO_ACCESS_ALL') || '');
				}
				else
				{
					this.showSuccessToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_NOTHING') || '');
				}

				return;
			}

			// Full success: one whole line.
			if (skipped === 0)
			{
				const doneKey = action === 'delete' ? 'NOTE_RECYCLEBIN_BULK_DONE_DELETE' : 'NOTE_DOCUMENT_LIST_BULK_DONE_RESTORE';
				this.showSuccessToast(Loc.getMessagePlural(doneKey, processed, { '#COUNT#': processed }));
			}
			else
			{
				// Partial success: a single whole phrase pluralised on the processed count.
				const partialKey = action === 'delete' ? 'NOTE_RECYCLEBIN_BULK_PARTIAL_DELETE' : 'NOTE_DOCUMENT_LIST_BULK_PARTIAL_RESTORE';
				this.showSuccessToast(Loc.getMessagePlural(partialKey, processed, { '#DONE#': processed, '#SKIPPED#': skipped }));
			}

			// Orphan tail is a self-contained sentence shown as its own toast, never glued onto
			// the result line. Currently unreachable — all callers pass orphanPending=false.
			if (orphanPending && orphan > 0)
			{
				this.showSuccessToast(Loc.getMessage('NOTE_RECYCLEBIN_BULK_ORPHAN_PENDING') || '');
			}
		},
		showBulkError(error: mixed): void
		{
			const code = String(error?.code || '');
			if (code === 'NOTE_BULK_LIMIT_EXCEEDED')
			{
				this.showErrorToast(Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_LIMIT') || '');

				return;
			}

			this.showErrorToast(error?.message || (Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || ''));
		},
		async onRestoreAll(): Promise<void>
		{
			if (this.restoringAll)
			{
				return;
			}

			let stats;
			try
			{
				stats = await this.service.getStats();
			}
			catch (error)
			{
				this.showErrorToast(error?.message || '');
				return;
			}

			if (stats.total <= 0)
			{
				return;
			}

			let orphanTargetCollectionId = null;

			if (stats.orphanCount > 0)
			{
				const popupResult = await openBulkRestorePopup({
					total: stats.total,
					orphanCount: stats.orphanCount,
				});
				if (!popupResult.confirmed)
				{
					return;
				}

				orphanTargetCollectionId = popupResult.orphanTargetCollectionId;
			}
			else
			{
				const confirmed = await this.confirm({
					title: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
					message: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_RESTORE_ALL') || '',
					okText: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_RESTORE_ALL') || '',
				});
				if (!confirmed)
				{
					return;
				}
			}

			this.restoringAll = true;

			try
			{
				const { restoredCount, skippedOrphan } = await this.service.restoreAll({ orphanTargetCollectionId });
				if (restoredCount > 0)
				{
					EventEmitter.emit(NoteEvent.DOCUMENTS_BULK_RESTORED, new BaseEvent({
						data: { restoredCollections: [] },
					}));
				}
				await this.loadPage(false);
				const messageCode = skippedOrphan > 0
					? 'NOTE_RECYCLEBIN_PAGE_RESTORE_ALL_SUCCESS_WITH_SKIPPED'
					: 'NOTE_RECYCLEBIN_PAGE_RESTORE_ALL_SUCCESS';
				const message = (Loc.getMessage(messageCode) || '')
					.replace('#COUNT#', String(restoredCount))
					.replace('#SKIPPED#', String(skippedOrphan))
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
		async onEmptyTrash(): Promise<void>
		{
			if (this.emptyingTrash)
			{
				return;
			}

			const confirmed = await this.confirm({
				title: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION_TITLE') || '',
				message: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_EMPTY') || '',
				okText: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION_CONFIRM') || '',
				danger: true,
			});
			if (!confirmed)
			{
				return;
			}

			this.emptyingTrash = true;

			try
			{
				const { deletedCount } = await this.service.empty();
				await this.loadPage(false);
				const message = (Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_SUCCESS') || '')
					.replace('#COUNT#', String(deletedCount))
				;
				this.showSuccessToast(message);
			}
			catch (error)
			{
				this.showErrorToast(error?.message || '');
			}
			finally
			{
				this.emptyingTrash = false;
			}
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
				key: 'recyclebin-header',
				popupClass: 'note-action-menu',
			});
		},
		confirm({ title, message, okText, danger = false }: {
			title: string,
			message: string,
			okText: string,
			danger?: boolean,
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
					<div class="note-recyclebin-confirm-content">
						${String(message || '')}
					</div>
				`;
				// Destructive actions mirror the single-delete dialog: no red button, inverted
				// order (prominent Cancel on the left, understated action on the right).
				const okButton = new Button({
					text: String(okText || ''),
					dataset: { testid: 'note-dialog-confirm' },
					size: ButtonSize.LARGE,
					style: danger ? AirButtonStyle.PLAIN : AirButtonStyle.FILLED,
					useAirDesign: true,
					onclick: () => {
						finish(true);
						dialog.hide();
					},
				});
				const cancelButton = new Button({
					text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
					dataset: { testid: 'note-dialog-cancel' },
					size: ButtonSize.LARGE,
					style: danger ? AirButtonStyle.FILLED : AirButtonStyle.PLAIN,
					useAirDesign: true,
					onclick: () => {
						finish(false);
						dialog.hide();
					},
				});
				const dialog = new Dialog({
					title: String(title || ''),
					content,
					hasOverlay: true,
					overlay: true,
					width: 420,
					centerButtons: danger ? [cancelButton, okButton] : [okButton, cancelButton],
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
				: (Loc.getMessage('NOTE_RECYCLEBIN_PAGE_ERROR_GENERIC') || '')
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
		<div class="note-recyclebin-page">
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
								data-testid="note-trash-more"
								@click="openMoreMenu"
							>
								<div class="ui-icon-set --more-l"></div>
							</button>
						</div>
					</div>
				</div>
			</teleport>
			<div class="note-recyclebin-page__body">
				<div class="note-recyclebin-page-heading">
					<h2 class="note-recyclebin-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-recyclebin-page-subtitle">{{ subtitleText }}</p>
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
					class="note-recyclebin-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>

			<teleport to="body">
				<BulkActionsBar
					section="recycle"
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
