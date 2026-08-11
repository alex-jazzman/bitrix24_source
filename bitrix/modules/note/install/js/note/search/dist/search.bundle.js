/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_notification, note_analytics, note_ui_documentList) {
	'use strict';

	const ACTION_SEARCH = 'note.infrastructure.SearchController.search';
	class SearchService {
		async search(query, {
			page = 1,
			pageSize = 30
		} = {}) {
			try {
				const response = await main_core.ajax.runAction(ACTION_SEARCH, {
					data: {
						query
					},
					navigation: {
						page,
						size: pageSize
					}
				});
				const data = response?.data ?? {};
				return {
					items: Array.isArray(data.items) ? data.items : [],
					hasMore: Boolean(data.hasMore)
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
			return 'Search request failed';
		}
	}

	/**
	 * IME-safe v-model alternative for mobile inputs.
	 *
	 * Mobile IMEs (Android Gboard, iOS suggestions) update <input>.value via
	 * composition events. Vue's v-model defers reactive updates until
	 * `compositionend`, so the bound property lags behind the visible value
	 * during typing -- debounced search/validate logic never sees the in-flight
	 * characters.
	 *
	 * Read event.target.value on input/compositionend/change events and write it
	 * back to the component property. For non-IME input the values already match,
	 * so the guard makes the call a no-op.
	 *
	 * Duplicated in note.sidebar/src/utils/ to avoid cyclic dependency:
	 * note.app imports from note.sidebar, so the helper cannot live in note.app.
	 */
	function syncIMEModel(component, key, event) {
		const next = event?.target?.value ?? component[key];
		if (component[key] !== next) {
			component[key] = next;
		}
		return next;
	}

	const PAGE_SIZE = 30;
	const MIN_QUERY_LENGTH = 3;
	const DEBOUNCE_MS = 400;
	const NoteSearchPageComponent = {
		name: 'NoteSearchPage',
		components: {
			DocumentList: note_ui_documentList.DocumentList
		},
		props: {
			query: {
				type: String,
				default: ''
			}
		},
		emits: ['open', 'update-query'],
		data() {
			return {
				inputQuery: this.query || '',
				items: [],
				loading: false,
				hasMore: false,
				page: 0,
				hasError: false,
				requestId: 0,
				analyticsClickTracked: false
			};
		},
		computed: {
			trimmedQuery() {
				return (this.query || '').trim();
			},
			isTooShort() {
				return this.trimmedQuery.length > 0 && this.trimmedQuery.length < MIN_QUERY_LENGTH;
			},
			listItems() {
				return this.items.map(item => ({
					id: item.documentId,
					title: item.title,
					snippet: item.snippet || '',
					documentId: item.documentId,
					collectionId: item.collectionId,
					collectionTitle: item.collectionTitle || '',
					author: item.author || null,
					score: item.score
				}));
			},
			placeholderText() {
				return main_core.Loc.getMessage('NOTE_SEARCH_PAGE_PLACEHOLDER') || '';
			},
			tooShortMessage() {
				return main_core.Loc.getMessage('NOTE_SEARCH_QUERY_TOO_SHORT') || '';
			}
		},
		watch: {
			query(value) {
				this.inputQuery = value || '';
			},
			trimmedQuery() {
				this.runSearch(false);
			}
		},
		created() {
			this.service = new SearchService();
			this.debounceTimer = null;
			this.runSearch(false);
		},
		beforeUnmount() {
			clearTimeout(this.debounceTimer);
		},
		methods: {
			onInput(event) {
				syncIMEModel(this, 'inputQuery', event);
				clearTimeout(this.debounceTimer);
				this.debounceTimer = setTimeout(() => {
					this.$emit('update-query', this.inputQuery.trim());
				}, DEBOUNCE_MS);
			},
			onKeydown(event) {
				if (event.key === 'Enter') {
					clearTimeout(this.debounceTimer);
					this.$emit('update-query', this.inputQuery.trim());
				}
			},
			onSearchClick() {
				// Deliberate pointer click into the search field. mousedown never fires from the
				// initial autofocus or from a tab-switch refocus, so no false/duplicate events.
				if (!this.analyticsClickTracked) {
					note_analytics.NoteAnalytics.searchClicked(true);
					this.analyticsClickTracked = true;
				}
			},
			onBlur() {
				// Re-arm click_search so a click after leaving the field counts again.
				this.analyticsClickTracked = false;
			},
			async runSearch(append) {
				if (!append) {
					this.items = [];
					this.page = 0;
					this.hasMore = false;
					this.hasError = false;
				}
				if (this.trimmedQuery.length < MIN_QUERY_LENGTH) {
					this.loading = false;
					return;
				}
				const nextPage = this.page + 1;
				const currentRequestId = ++this.requestId;
				this.loading = true;
				try {
					const response = await this.service.search(this.trimmedQuery, {
						page: nextPage,
						pageSize: PAGE_SIZE
					});
					if (currentRequestId !== this.requestId) {
						return;
					}
					this.items = append ? [...this.items, ...response.items] : response.items;
					this.hasMore = response.hasMore;
					this.page = nextPage;
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
				this.runSearch(true);
			},
			onOpen(item) {
				this.$emit('open', {
					documentId: item.documentId
				});
			},
			onOpenCollection({
				collectionId
			}) {
				if (!collectionId) {
					return;
				}
				// Opening a collection tile from the full search-results page.
				note_analytics.NoteAnalytics.collectionViewed('search_page');
				this.$router.push({
					name: 'workspace',
					params: {
						id: collectionId
					}
				});
			},
			showErrorToast(text) {
				const message = main_core.Type.isStringFilled(text) ? text : main_core.Loc.getMessage('NOTE_SEARCH_PAGE_ERROR_GENERIC') || '';
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
		<div class="note-search-page">
			<div class="note-search-page-input-wrap">
				<input
					type="text"
					class="note-search-page-input"
					:placeholder="placeholderText"
					:value="inputQuery"
					@input="onInput"
					@compositionend="onInput"
					@change="onInput"
					@keydown="onKeydown"
					@mousedown="onSearchClick"
					@blur="onBlur"
					autofocus
				/>
			</div>
			<div v-if="isTooShort" class="note-search-page-hint">{{ tooShortMessage }}</div>
			<DocumentList
				v-else-if="!hasError"
				mode="search"
				:items="listItems"
				:has-more="hasMore"
				:loading="loading"
				@open="onOpen"
				@open-collection="onOpenCollection"
				@load-more="onLoadMore"
			/>
		</div>
	`
	};

	exports.NoteSearchPageComponent = NoteSearchPageComponent;

})(this.BX.Note = this.BX.Note || {}, BX, BX.UI.Notification, BX.Note, BX.Note.Ui);
//# sourceMappingURL=search.bundle.js.map
