/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_notification, note_ui_documentList, note_sidebar) {
	'use strict';

	const ACTION_LIST = 'note.infrastructure.DocumentController.listSharedWithMe';
	class SharedService {
		async list({
			limit = 50,
			afterCursor = null
		} = {}) {
			try {
				const response = await main_core.ajax.runAction(ACTION_LIST, {
					data: {
						limit,
						afterCursor: afterCursor || null
					}
				});
				const data = response?.data ?? {};
				const documents = Array.isArray(data.documents) ? data.documents : [];
				return {
					items: documents.map(doc => ({
						id: Number(doc.id) || 0,
						parentId: doc.parentId == null ? null : Number(doc.parentId),
						title: String(doc.title || ''),
						position: Number(doc.position) || 0,
						updatedAt: doc.updatedAt ? String(doc.updatedAt) : null,
						hasChildren: Boolean(doc.hasChildren),
						excerpt: String(doc.excerpt || ''),
						author: main_core.Type.isPlainObject(doc.author) ? {
							id: Number(doc.author.id) || 0,
							name: String(doc.author.name || ''),
							photoUrl: doc.author.photoUrl ? String(doc.author.photoUrl) : null,
							isSystem: doc.author.isSystem === true
						} : null
					})),
					nextCursor: main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null
				};
			} catch (error) {
				throw new Error(this.#extractErrorMessage(error));
			}
		}
		#extractErrorMessage(error) {
			if (main_core.Type.isPlainObject(error)) {
				const firstError = error?.errors?.[0]?.message;
				if (main_core.Type.isStringFilled(firstError)) {
					return firstError;
				}
				if (main_core.Type.isStringFilled(error.message)) {
					return error.message;
				}
			}
			return 'Shared list request failed';
		}
	}

	const PAGE_SIZE = 50;
	// Debounce window for cross-route pull-driven refetch; jitter desynchronises
	// reconnecting clients hitting REST after a burst of `collectionListInvalidated`.
	const REFETCH_DEBOUNCE_MIN_MS = 80;
	const REFETCH_DEBOUNCE_JITTER_MS = 220;
	const NoteSharedPageComponent = {
		name: 'NoteSharedPage',
		components: {
			DocumentList: note_ui_documentList.DocumentList
		},
		emits: ['open'],
		data() {
			return {
				items: [],
				loading: false,
				hasMore: false,
				hasError: false,
				nextCursor: null,
				requestId: 0
			};
		},
		computed: {
			listItems() {
				return this.items.map(item => ({
					id: item.id,
					title: item.title,
					snippet: '',
					excerpt: item.excerpt || '',
					author: item.author || null,
					documentId: item.id
				}));
			},
			titleText() {
				return main_core.Loc.getMessage('NOTE_SHARED_PAGE_TITLE') || '';
			},
			breadcrumbRoot() {
				return main_core.Loc.getMessage('NOTE_SHARED_BREADCRUMB_ROOT') || '';
			},
			subtitleText() {
				return main_core.Loc.getMessage('NOTE_SHARED_PAGE_SUBTITLE') || '';
			},
			emptyHint() {
				return main_core.Loc.getMessage('NOTE_SHARED_PAGE_EMPTY_HINT') || '';
			}
		},
		created() {
			this.service = new SharedService();
			this.refetchTimer = null;
			this.handlePullEvent = event => this.onPullEvent(event);
			main_core_events.EventEmitter.subscribe(note_sidebar.NoteEvent.PULL_EVENT, this.handlePullEvent);
			void this.loadPage(false);
		},
		beforeUnmount() {
			if (this.refetchTimer) {
				clearTimeout(this.refetchTimer);
				this.refetchTimer = null;
			}
			if (this.handlePullEvent) {
				main_core_events.EventEmitter.unsubscribe(note_sidebar.NoteEvent.PULL_EVENT, this.handlePullEvent);
				this.handlePullEvent = null;
			}
		},
		methods: {
			goRoot() {
				this.$router.push({
					name: 'shared'
				});
			},
			async loadPage(append) {
				if (!append) {
					this.items = [];
					this.nextCursor = null;
					this.hasMore = false;
					this.hasError = false;
				}
				const currentRequestId = ++this.requestId;
				this.loading = true;
				try {
					const response = await this.service.list({
						limit: PAGE_SIZE,
						afterCursor: append ? this.nextCursor : null
					});
					if (currentRequestId !== this.requestId) {
						return;
					}
					this.items = append ? [...this.items, ...response.items] : response.items;
					this.nextCursor = response.nextCursor;
					this.hasMore = Boolean(response.nextCursor);
				} catch (error) {
					if (currentRequestId !== this.requestId) {
						return;
					}
					if (!append) {
						this.hasError = true;
					}
					this.showErrorToast(error?.message || '');
				} finally {
					if (currentRequestId === this.requestId) {
						this.loading = false;
					}
				}
			},
			onLoadMore() {
				if (this.loading || !this.hasMore) {
					return;
				}
				void this.loadPage(true);
			},
			onPullEvent(event) {
				const payload = event?.getData ? event.getData() : null;
				const command = payload?.command;
				// documentAccessCascade (EVENT-01): a document-level ACL grant/revoke changes what this
				// flat list contains, so refetch it too — this keeps the flag-off page live under EVENT-01.
				if (command !== 'collectionListInvalidated' && command !== 'collectionCapabilities' && command !== 'documentAccessCascade') {
					return;
				}
				if (this.refetchTimer) {
					clearTimeout(this.refetchTimer);
				}
				const delay = REFETCH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFETCH_DEBOUNCE_JITTER_MS);
				this.refetchTimer = setTimeout(() => {
					this.refetchTimer = null;
					void this.loadPage(false);
				}, delay);
			},
			onOpen(item) {
				this.$emit('open', {
					documentId: item.documentId
				});
			},
			showErrorToast(text) {
				const message = main_core.Type.isStringFilled(text) ? text : main_core.Loc.getMessage('NOTE_SHARED_PAGE_ERROR_GENERIC') || '';
				if (!main_core.Type.isStringFilled(message)) {
					return;
				}
				BX.UI.Notification.Center.notify({
					content: message,
					position: 'top-right'
				});
			}
		},
		// language=Vue
		template: `
		<div class="note-shared-page">
			<teleport to="#note-page-header-slot">
				<div class="note-page-breadcrumb">
					<button
						type="button"
						class="note-page-breadcrumb-link"
						@click="goRoot"
					>{{ breadcrumbRoot }}</button>
				</div>
			</teleport>
			<header class="note-shared-page-header">
				<div class="note-shared-page-heading">
					<h2 class="note-shared-page-title">{{ titleText }}</h2>
					<p v-if="subtitleText" class="note-shared-page-subtitle">{{ subtitleText }}</p>
				</div>
			</header>
			<DocumentList
				v-if="!hasError && (loading || items.length > 0)"
				:items="listItems"
				:has-more="hasMore"
				:loading="loading"
				@open="onOpen"
				@load-more="onLoadMore"
			/>
			<div
				v-else-if="!hasError"
				class="note-shared-page-empty-hint"
			>
				{{ emptyHint }}
			</div>
		</div>
	`
	};

	exports.NoteSharedPageComponent = NoteSharedPageComponent;

})(this.BX.Note = this.BX.Note || {}, BX, BX.Event, BX.UI.Notification, BX.Note.Ui, BX.Note.Sidebar);
//# sourceMappingURL=shared.bundle.js.map
