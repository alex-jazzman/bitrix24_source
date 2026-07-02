import { Loc, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';
import 'ui.notification';
import { NoteThemeContext } from 'note.ui.theme-context';
import { DocumentList } from 'note.ui.document-list';
import { ActionMenuService } from 'note.ui.action-menu';
import { NoteEvent } from 'note.sidebar';
import { RecycleBinService } from './services/recyclebin-service';
import { openBulkRestorePopup } from './bulk-restore-popup';

const PAGE_SIZE = 50;

export const NoteRecycleBinPageComponent = {
	name: 'NoteRecycleBinPage',
	components: {
		DocumentList,
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
		};
	},
	computed: {
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
				disabled: this.restoringAll || this.loading,
				onClick: () => { void this.onRestoreAll(); },
			});

			items.push({
				text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_EMPTY_ACTION') || '',
				iconModifier: 'o-trashcan',
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
				const dialog = new Dialog({
					title: String(title || ''),
					content,
					hasOverlay: true,
					overlay: true,
					width: 420,
					centerButtons: [
						new Button({
							text: Loc.getMessage('NOTE_RECYCLEBIN_PAGE_CONFIRM_CANCEL') || '',
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
							size: ButtonSize.LARGE,
							style: AirButtonStyle.PLAIN,
							useAirDesign: true,
							color: danger ? Button.Color.DANGER : null,
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
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<div class="note-recyclebin-page__actions">
				<button
					v-if="hasItems"
					type="button"
					class="note-recyclebin-page__action-icon"
					:title="moreMenuLabel"
					:aria-label="moreMenuLabel"
					@click="openMoreMenu"
				>
					<div class="ui-icon-set --more-l"></div>
				</button>
			</div>
			<div class="note-recyclebin-page__body">
				<div class="note-recyclebin-page-heading">
					<h2 class="note-recyclebin-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-recyclebin-page-subtitle">{{ subtitleText }}</p>
				</div>
				<DocumentList
					v-if="!hasError && (loading || hasItems)"
					mode="detailed"
					:items="listItems"
					:has-more="hasMore"
					:loading="loading"
					@open="onOpen"
					@open-collection="onOpenCollection"
					@load-more="onLoadMore"
				/>
				<div
					v-else-if="!hasError"
					class="note-recyclebin-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>
		</div>
	`,
};
