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
import { ArchiveService } from './services/archive-service';

const PAGE_SIZE = 50;

export const NoteArchivePageComponent = {
	name: 'NoteArchivePage',
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
			deletingAll: false,
			hasMore: false,
			hasError: false,
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
				disabled: !this.canRestoreAny || this.restoringAll || this.loading,
				onClick: () => { void this.onRestoreAll(); },
			});

			items.push({
				text: Loc.getMessage('NOTE_ARCHIVE_PAGE_DELETE_ALL') || '',
				iconModifier: 'o-trashcan',
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
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<div class="note-archive-page__actions">
				<button
					v-if="hasItems"
					type="button"
					class="note-archive-page__action-icon"
					:title="moreMenuLabel"
					:aria-label="moreMenuLabel"
					@click="openMoreMenu"
				>
					<div class="ui-icon-set --more-l"></div>
				</button>
			</div>
			<div class="note-archive-page__body">
				<div class="note-archive-page-heading">
					<h2 class="note-archive-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-archive-page-subtitle">{{ subtitleText }}</p>
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
					class="note-archive-page-empty-hint"
				>
					{{ emptyHint }}
				</div>
			</div>
		</div>
	`,
};
