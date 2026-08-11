/* eslint-disable */
this.BX = this.BX || {};
this.BX.Note = this.BX.Note || {};
(function (exports, ui_iconSet_api_vue, ui_iconSet_outline, note_analytics, note_ui_loader, ui_vue3, main_core, note_ui_actionMenu, main_sidepanel, note_import, note_permissions, main_core_events, ui_buttons, ui_entitySelector, ui_system_dialog, note_ui_themeContext, pull_client, ui_dialogs_messagebox) {
	'use strict';

	const SidebarLoader = {
		name: 'SidebarLoader',
		components: {
			Loader: note_ui_loader.Loader
		},
		props: {
			level: {
				type: Number,
				default: 0
			}
		},
		computed: {
			indentStyle() {
				const normalized = Number.isFinite(Number(this.level)) ? Math.max(Number(this.level), 0) : 0;
				const padding = 16 + normalized * 24;
				return {
					paddingLeft: `${padding}px`
				};
			}
		},
		template: `
		<div class="sidebar-loader" :style="indentStyle">
			<Loader />
		</div>
	`
	};

	// Height + opacity expand/collapse transition for a single v-if child.
	//
	// Behavior:
	//   - Normal mount: animates 0 → scrollHeight (and opacity 0 → 1).
	//   - Normal unmount: animates current height → 0 (opacity 1 → 0).
	//   - `loading=true` at mount: skips the entrance and waits for `loading` to
	//     flip to false, then animates the captured loader height → real content
	//     height (no opacity fade — the loader was already fully visible).
	//   - Empty content (scrollHeight === 0) at mount or leave: no animation.

	const DURATION_MS = 275;
	const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
	// Safety net in case `transitionend` is swallowed (display:none, detached
	// element mid-flight, browser quirks). Slightly longer than DURATION_MS.
	const FALLBACK_MS = DURATION_MS + 100;
	const pending = new WeakMap();
	function cancelPending(el) {
		const state = pending.get(el);
		if (!state) {
			return;
		}
		el.removeEventListener('transitionend', state.onEnd);
		clearTimeout(state.timer);
		pending.delete(el);
	}
	function clearInlineStyles(el) {
		el.style.transition = '';
		el.style.height = '';
		el.style.overflow = '';
		el.style.opacity = '';
	}
	function animateHeight(el, {
		from,
		to,
		fade,
		done
	}) {
		cancelPending(el);
		if (from === to) {
			done();
			return;
		}
		const opening = to > from;
		const transitions = [`height ${DURATION_MS}ms ${EASING}`];
		el.style.overflow = 'hidden';
		el.style.transition = '';
		el.style.height = `${from}px`;
		if (fade) {
			el.style.opacity = opening ? '0' : '1';
			transitions.push(`opacity ${DURATION_MS}ms ${EASING}`);
		}

		// Commit the starting frame before applying target values.
		void el.offsetHeight;
		el.style.transition = transitions.join(', ');
		el.style.height = `${to}px`;
		if (fade) {
			el.style.opacity = opening ? '1' : '0';
		}
		const finish = () => {
			cancelPending(el);
			done();
		};
		const onEnd = event => {
			if (event.target === el && event.propertyName === 'height') {
				finish();
			}
		};
		el.addEventListener('transitionend', onEnd);
		const timer = setTimeout(finish, FALLBACK_MS);
		pending.set(el, {
			onEnd,
			timer
		});
	}
	const ExpandTransition = {
		name: 'ExpandTransition',
		props: {
			loading: {
				type: Boolean,
				default: false
			}
		},
		data() {
			// Plain non-reactive container — we need identity stability for the
			// DOM ref and the in-flight flag, not change tracking.
			return {
				refs: ui_vue3.markRaw({
					el: null,
					transitioning: false
				})
			};
		},
		methods: {
			onBeforeEnter(el) {
				this.refs.el = el;
				this.refs.transitioning = true;
				if (this.loading) {
					return;
				}
				el.style.overflow = 'hidden';
				el.style.height = '0px';
				el.style.opacity = '0';
			},
			onEnter(el, done) {
				if (this.loading) {
					done();
					return;
				}
				animateHeight(el, {
					from: 0,
					to: el.scrollHeight,
					fade: true,
					done
				});
			},
			onAfterEnter(el) {
				clearInlineStyles(el);
				this.refs.transitioning = false;
			},
			onEnterCancelled(el) {
				cancelPending(el);
				clearInlineStyles(el);
				this.refs.el = null;
				this.refs.transitioning = false;
			},
			onBeforeLeave() {
				this.refs.transitioning = true;
			},
			onLeave(el, done) {
				animateHeight(el, {
					from: el.scrollHeight,
					to: 0,
					fade: true,
					done
				});
			},
			onAfterLeave(el) {
				clearInlineStyles(el);
				this.refs.el = null;
				this.refs.transitioning = false;
			},
			onLeaveCancelled(el) {
				cancelPending(el);
				clearInlineStyles(el);
				this.refs.transitioning = false;
			}
		},
		watch: {
			loading(next, prev) {
				// Only react to true → false while the element is mounted and idle.
				if (!prev || next || this.refs.transitioning) {
					return;
				}
				const el = this.refs.el;
				if (!el || !el.isConnected) {
					return;
				}
				const start = el.offsetHeight;
				// Lock the current height so Vue's content swap doesn't flash.
				el.style.overflow = 'hidden';
				el.style.height = `${start}px`;
				this.$nextTick(() => {
					if (!el.isConnected) {
						clearInlineStyles(el);
						return;
					}
					animateHeight(el, {
						from: start,
						to: el.scrollHeight,
						fade: false,
						done: () => clearInlineStyles(el)
					});
				});
			}
		},
		template: `
		<Transition
			:css="false"
			@before-enter="onBeforeEnter"
			@enter="onEnter"
			@after-enter="onAfterEnter"
			@enter-cancelled="onEnterCancelled"
			@before-leave="onBeforeLeave"
			@leave="onLeave"
			@after-leave="onAfterLeave"
			@leave-cancelled="onLeaveCancelled"
		>
			<slot />
		</Transition>
	`
	};

	const TreeNode = {
		name: 'TreeNode',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			SidebarLoader,
			ExpandTransition
		},
		props: {
			doc: {
				type: Object,
				required: true
			},
			level: {
				type: Number,
				default: 1
			},
			selectedDocId: {
				type: Number,
				default: null
			},
			expandedDocs: {
				type: Object,
				required: true
			},
			getChildren: {
				type: Function,
				required: true
			},
			isLoadingChildren: {
				type: Function,
				required: true
			},
			hasNextChildren: {
				type: Function,
				required: true
			},
			canEditDocument: {
				type: Function,
				required: true
			},
			canManageDocument: {
				type: Function,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			docDragItem: {
				type: Object,
				default: null
			},
			docDropTarget: {
				type: Object,
				default: null
			},
			renamingDocId: {
				type: Number,
				default: null
			}
		},
		data() {
			return {
				renameCancelled: false
			};
		},
		emits: ['toggle', 'open', 'prefetch-children', 'load-more', 'start-drag', 'branch-drag-enter', 'branch-drag-over', 'branch-drop', 'end-drag', 'create-child', 'rename-doc', 'delete-doc', 'confirm-rename-doc', 'cancel-rename-doc'],
		computed: {
			isExpanded() {
				return Boolean(this.expandedDocs[this.doc.id]);
			},
			children() {
				return this.getChildren(this.doc.collectionId, this.doc.id);
			},
			dropClass() {
				const target = this.docDropTarget;
				if (!target || Number(target.targetId) !== Number(this.doc.id)) {
					return '';
				}
				if (target.placement === 'before') {
					return 'is-drop-before';
				}
				if (target.placement === 'after') {
					if (this.isExpanded && this.children.length > 0) {
						return '';
					}
					return 'is-drop-after';
				}
				if (target.placement === 'inside') {
					return 'is-drop-inside';
				}
				return '';
			},
			isDropAfterExpanded() {
				const target = this.docDropTarget;
				if (!target || Number(target.targetId) !== Number(this.doc.id)) {
					return false;
				}
				return target.placement === 'after' && this.isExpanded && this.children.length > 0;
			},
			isDragSource() {
				return Boolean(this.docDragItem && Number(this.docDragItem.id) === Number(this.doc.id));
			},
			canExpand() {
				return Boolean(this.doc.hasChildren || this.children.length > 0 || this.isExpanded);
			},
			canEditCurrentDocument() {
				return Boolean(this.canEditDocument(this.doc));
			},
			canManageCurrentDocument() {
				return Boolean(this.canManageDocument(this.doc));
			},
			rowStyle() {
				const level = Number.isFinite(Number(this.level)) ? Number(this.level) : 1;
				const indent = 16 + Math.max(level, 1) * 24;
				return {
					'--indent': `${indent}px`
				};
			},
			isRenaming() {
				return this.renamingDocId === Number(this.doc.id);
			},
			docHref() {
				const id = Number(this.doc?.id);
				return Number.isFinite(id) && id > 0 ? `/note/document/${id}/` : '';
			}
		},
		watch: {
			isRenaming(value) {
				this.renameCancelled = false;
				if (value) {
					this.$nextTick(() => {
						const input = this.$refs.renameInput;
						if (input) {
							input.focus();
							input.select();
						}
					});
				}
			}
		},
		methods: {
			getDocumentTitle(doc) {
				const title = String(doc?.title ?? '').trim();
				return title === '' ? null : title;
			},
			onToggle(event) {
				event.stopPropagation();
				this.$emit('toggle', this.doc);
			},
			onOpen() {
				note_analytics.NoteAnalytics.documentViewed('side_menu');
				this.$emit('open', this.doc);
				if (!this.canExpand) {
					return;
				}
				const isCurrent = Number(this.selectedDocId) === Number(this.doc.id);
				if (isCurrent || !this.isExpanded) {
					this.$emit('toggle', this.doc);
				}
			},
			onTitleClick(event) {
				if (this.isRenaming) {
					return;
				}
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.onOpen();
			},
			onPrefetchChildren() {
				this.$emit('prefetch-children', this.doc);
			},
			onCreateChild(event) {
				if (!this.canManageCurrentDocument) {
					return;
				}
				event.stopPropagation();
				this.$emit('create-child', this.doc);
			},
			onDragStart(event) {
				if (!this.canManageCurrentDocument) {
					event.preventDefault();
					return;
				}
				this.$emit('start-drag', {
					doc: this.doc,
					nativeEvent: event
				});
			},
			onDragEnd() {
				this.$emit('end-drag');
			},
			onChildrenDragEnter(event) {
				this.$emit('branch-drag-enter', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onChildrenDragOver(event) {
				this.$emit('branch-drag-over', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onChildrenDrop(event) {
				this.$emit('branch-drop', {
					branchElement: event.currentTarget,
					collectionId: this.doc.collectionId,
					parentId: this.doc.id,
					nativeEvent: event
				});
			},
			onRenameKeyEnter(event) {
				event.target.blur();
			},
			onRenameKeyEscape() {
				this.renameCancelled = true;
				this.$refs.renameInput?.blur();
			},
			onRenameBlur(event) {
				if (this.renameCancelled) {
					this.$emit('cancel-rename-doc');
					return;
				}
				const value = event.target.value.trim();
				if (!value) {
					this.$emit('cancel-rename-doc');
					return;
				}
				this.$emit('confirm-rename-doc', {
					doc: this.doc,
					title: value
				});
			}
		},
		template: `
		<li :class="{ 'is-drop-after': isDropAfterExpanded }" :style="isDropAfterExpanded ? rowStyle : null">
			<div
				class="tree-row"
				:data-doc-id="doc.id"
				:class="[
					{ 'is-active': selectedDocId === Number(doc.id) },
					dropClass,
					{ 'is-drag-source': isDragSource },
					{ 'has-actions': canManageCurrentDocument && !isRenaming }
					]"
				:style="rowStyle"
				:draggable="canManageCurrentDocument && !isRenaming"
				@mouseenter="onPrefetchChildren"
				@dragstart="onDragStart"
				@dragend="onDragEnd"
			>
				<span
					class="tree-item tree-button"
					:title="isRenaming ? null : getDocumentTitle(doc)"
				>
					<button v-if="canExpand" type="button" class="tree-disclosure"
							:class="{ 'is-expanded': isExpanded }"
							@click="onToggle">
						<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
					</button>
					<span v-else class="tree-disclosure-spacer"></span>
					<input
						v-if="isRenaming"
						class="tree-title-input"
						type="text"
						:value="doc.title"
						@keydown.enter="onRenameKeyEnter($event)"
						@keydown.escape="onRenameKeyEscape"
						@blur="onRenameBlur($event)"
						@click.stop
						ref="renameInput"
					/>
					<a
						v-else
						class="tree-title tree-title-link"
						:href="docHref"
						draggable="false"
						@click="onTitleClick"
					>{{ doc.title }}</a>
				</span>
				<div v-if="canManageCurrentDocument && !isRenaming" class="tree-actions">
					<button class="row-action-btn" type="button" @click="onCreateChild">
						<BIcon name="plus-l" :size="24" color="var(--ui-color-accent-main-primary)" />
					</button>
				</div>
				<span v-if="dropClass === 'is-drop-inside'" class="drop-overlay"/>
			</div>
			<ExpandTransition :loading="isLoadingChildren(doc.collectionId, doc.id)">
			<ul
				v-if="isExpanded"
				class="tree-branch tree-children"
				@dragenter="onChildrenDragEnter"
				@dragover.stop="onChildrenDragOver"
				@drop.stop="onChildrenDrop"
			>
				<tree-node
					v-for="child in children"
					:key="child.id"
					:doc="child"
					:level="level + 1"
					:selected-doc-id="selectedDocId"
					:expanded-docs="expandedDocs"
					:get-children="getChildren"
					:is-loading-children="isLoadingChildren"
					:has-next-children="hasNextChildren"
					:can-edit-document="canEditDocument"
					:can-manage-document="canManageDocument"
					:messages="messages"
					:doc-drag-item="docDragItem"
					:doc-drop-target="docDropTarget"
					:renaming-doc-id="renamingDocId"
					@toggle="$emit('toggle', $event)"
					@open="$emit('open', $event)"
					@prefetch-children="$emit('prefetch-children', $event)"
					@load-more="$emit('load-more', $event)"
					@start-drag="$emit('start-drag', $event)"
					@branch-drag-enter="$emit('branch-drag-enter', $event)"
					@branch-drag-over="$emit('branch-drag-over', $event)"
					@branch-drop="$emit('branch-drop', $event)"
					@end-drag="$emit('end-drag')"
					@create-child="$emit('create-child', $event)"
					@rename-doc="$emit('rename-doc', $event)"
					@delete-doc="$emit('delete-doc', $event)"
					@confirm-rename-doc="$emit('confirm-rename-doc', $event)"
					@cancel-rename-doc="$emit('cancel-rename-doc')"
				/>
				<li v-if="isLoadingChildren(doc.collectionId, doc.id)" class="sidebar-muted">
					<SidebarLoader :level="level + 1" />
				</li>
				<li
					v-if="hasNextChildren(doc.collectionId, doc.id)"
					class="doc-load-more-sentinel js-doc-load-more-sentinel"
					:data-collection-id="doc.collectionId"
					:data-parent-id="doc.id"
					aria-hidden="true"
				/>
			</ul>
			</ExpandTransition>
		</li>
	`
	};

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
	 * Usage (Options API):
	 *   methods: {
	 *     onInput(event) {
	 *       syncIMEModel(this, 'query', event);
	 *       // ... debounce, fetch, ...
	 *     },
	 *   }
	 *
	 * Template:
	 *   <input
	 *     :value="query"
	 *     @input="onInput"
	 *     @compositionend="onInput"
	 *     @change="onInput"
	 *   />
	 */
	function syncIMEModel(component, key, event) {
		const next = event?.target?.value ?? component[key];
		if (component[key] !== next) {
			component[key] = next;
		}
		return next;
	}

	const ACTION_QUICK_SEARCH = 'note.infrastructure.SearchController.quickSearch';
	const DEBOUNCE_MS = 300;
	const MIN_QUERY_LENGTH = 3;
	const SidebarSearchInput = {
		name: 'SidebarSearchInput',
		emits: ['navigate-document', 'navigate-search'],
		data() {
			return {
				query: '',
				results: [],
				status: 'idle',
				// idle | loading | results | empty | error
				dropdownVisible: false,
				focusedIndex: -1,
				analyticsClickTracked: false
			};
		},
		computed: {
			trimmedQuery() {
				return this.query.trim();
			},
			placeholderText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_PLACEHOLDER') || '';
			},
			showAllText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_SHOW_ALL') || '';
			},
			emptyText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_EMPTY') || '';
			},
			errorText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_ERROR') || '';
			},
			clearText() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_SEARCH_CLEAR') || '';
			},
			hasQuery() {
				return this.query.length > 0;
			}
		},
		created() {
			this.debounceTimer = null;
			this.requestId = 0;
		},
		beforeUnmount() {
			this.cancelPending();
		},
		methods: {
			onInput(event) {
				syncIMEModel(this, 'query', event);
				clearTimeout(this.debounceTimer);
				if (this.trimmedQuery.length < MIN_QUERY_LENGTH) {
					this.cancelPending();
					this.results = [];
					this.status = 'idle';
					this.dropdownVisible = false;
					this.focusedIndex = -1;
					return;
				}
				this.debounceTimer = setTimeout(() => {
					this.fetchResults();
				}, DEBOUNCE_MS);
			},
			onKeydown(event) {
				if (event.key === 'ArrowDown') {
					event.preventDefault();
					if (!this.dropdownVisible || this.status !== 'results') {
						return;
					}
					const max = this.results.length; // last index = "show all"
					if (this.focusedIndex < max) {
						this.focusedIndex++;
					}
					return;
				}
				if (event.key === 'ArrowUp') {
					event.preventDefault();
					if (!this.dropdownVisible || this.status !== 'results') {
						return;
					}
					if (this.focusedIndex > -1) {
						this.focusedIndex--;
					}
					return;
				}
				if (event.key === 'Enter') {
					if (this.focusedIndex >= 0 && this.focusedIndex < this.results.length) {
						this.selectResult(this.results[this.focusedIndex]);
						return;
					}
					if (this.focusedIndex === this.results.length && this.results.length > 0) {
						this.showAll();
						return;
					}
					if (this.trimmedQuery.length >= MIN_QUERY_LENGTH) {
						const {
							trimmedQuery
						} = this;
						this.resetSearch();
						this.$emit('navigate-search', {
							query: trimmedQuery
						});
					}
					return;
				}
				if (event.key === 'Escape') {
					this.dropdownVisible = false;
					this.focusedIndex = -1;
				}
			},
			onSearchRowClick() {
				this.$refs.input?.focus();
				// Emit click_search once per search session; the flag resets on resetSearch(),
				// not on blur/tab-switch, so re-focus/tab changes never re-fire it.
				if (!this.analyticsClickTracked) {
					note_analytics.NoteAnalytics.searchClicked(false);
					this.analyticsClickTracked = true;
				}
			},
			onFocus() {
				if (this.results.length > 0 || this.status === 'empty') {
					this.dropdownVisible = true;
				}
			},
			onBlur() {
				// Re-arm click_search: leaving the field and clicking back in counts as a new search.
				this.analyticsClickTracked = false;
				setTimeout(() => {
					this.dropdownVisible = false;
				}, 150);
			},
			async fetchResults() {
				const currentQuery = this.trimmedQuery;
				if (currentQuery.length < MIN_QUERY_LENGTH) {
					return;
				}
				const currentRequestId = ++this.requestId;
				this.status = 'loading';
				this.dropdownVisible = true;
				try {
					const response = await main_core.ajax.runAction(ACTION_QUICK_SEARCH, {
						data: {
							query: currentQuery
						}
					});
					if (currentRequestId !== this.requestId) {
						return;
					}
					const items = response?.data?.items;
					this.results = Array.isArray(items) ? items : [];
					this.status = this.results.length > 0 ? 'results' : 'empty';
					this.focusedIndex = -1;
					this.dropdownVisible = true;
				} catch {
					if (currentRequestId !== this.requestId) {
						return;
					}
					this.results = [];
					this.status = 'error';
				}
			},
			cancelPending() {
				clearTimeout(this.debounceTimer);
				this.requestId++;
			},
			resetSearch() {
				this.cancelPending();
				this.query = '';
				this.results = [];
				this.status = 'idle';
				this.dropdownVisible = false;
				this.analyticsClickTracked = false;
			},
			selectResult(item) {
				this.resetSearch();
				this.$emit('navigate-document', {
					documentId: Number(item.documentId)
				});
			},
			clearQuery() {
				this.resetSearch();
				this.$refs.input?.focus();
			},
			showAll() {
				const {
					trimmedQuery
				} = this;
				this.resetSearch();
				this.$emit('navigate-search', {
					query: trimmedQuery
				});
			}
		},
		// language=Vue
		template: `
		<div class="note-sidebar-search">
			<div class="note-sidebar-search-row" @click="onSearchRowClick">
				<div class="note-sidebar-search-bg"></div>
				<div class="note-sidebar-search-border"></div>
				<span v-if="!hasQuery" class="note-sidebar-search-icon" aria-hidden="true">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="7"></circle>
						<path d="m20 20-3.5-3.5"></path>
					</svg>
				</span>
				<input
					ref="input"
					type="text"
					class="note-sidebar-search-input"
					:placeholder="placeholderText"
					:value="query"
					@input="onInput"
					@compositionend="onInput"
					@change="onInput"
					@keydown="onKeydown"
					@focus="onFocus"
					@blur="onBlur"
				/>
				<span
					v-if="hasQuery"
					class="ui-icon-set --o-circle-cross note-sidebar-search-clear"
					role="button"
					:aria-label="clearText"
					@mousedown.prevent
					@click.stop="clearQuery"
				></span>
			</div>
			<div v-if="dropdownVisible" class="note-kb-search-popup" @mouseleave="focusedIndex = -1">
				<div v-if="status === 'loading'" class="note-kb-search-status">
					...
				</div>
				<div v-else-if="status === 'empty'" class="note-kb-search-empty">
					<img class="note-kb-search-empty-mascot" src="/bitrix/js/note/sidebar/src/images/empty-search.png" alt="" />
					<div class="note-kb-search-empty-caption">{{ emptyText }}</div>
				</div>
				<div v-else-if="status === 'error'" class="note-kb-search-status note-kb-search-status--error">
					{{ errorText }}
				</div>
				<div v-else-if="status === 'results'" class="note-kb-search-list">
					<div
						v-for="(item, index) in results"
						:key="item.documentId"
						class="note-kb-search-item"
						:class="{ 'is-focused': focusedIndex === index }"
						@mousedown.prevent="selectResult(item)"
						@mouseenter="focusedIndex = index"
					>
						<div class="note-kb-search-item-overlay"></div>
						<div class="note-kb-search-item-label">
							<span class="note-kb-search-item-name">{{ item.title }}</span>
						</div>
					</div>
					<button
						type="button"
						class="note-kb-search-cta"
						:class="{ 'is-focused': focusedIndex === results.length }"
						@mousedown.prevent="showAll"
						@mouseenter="focusedIndex = results.length"
					>
						{{ showAllText }}
					</button>
				</div>
			</div>
		</div>
	`
	};

	const SidebarSearchRow = {
		name: 'SidebarSearchRow',
		components: {
			SidebarSearchInput,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			}
		},
		emits: ['navigate-document', 'navigate-search'],
		data() {
			return {
				actionMenuService: ui_vue3.markRaw(new note_ui_actionMenu.ActionMenuService({
					popupClass: 'note-action-menu'
				}))
			};
		},
		computed: {
			canCreateCollection() {
				return Boolean(this.state?.permissions?.canEditCollections);
			},
			canCreateDocument() {
				return Boolean(this.state?.permissions?.hasManageableCollection);
			},
			showCreateButton() {
				return this.canCreateCollection || this.canCreateDocument;
			},
			createButtonLabel() {
				if (this.canCreateCollection && this.canCreateDocument) {
					return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_MENU') || '';
				}
				if (this.canCreateDocument) {
					return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '';
				}
				return main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '';
			}
		},
		beforeUnmount() {
			if (this.actionMenuService) {
				this.actionMenuService.destroy();
			}
		},
		methods: {
			onCreateClick(event) {
				if (this.canCreateCollection && this.canCreateDocument) {
					this.openCreateMenu(event.currentTarget);
					return;
				}
				if (this.canCreateDocument) {
					void this.actions?.createDocumentFromSidebar?.();
					return;
				}
				if (this.canCreateCollection) {
					void this.actions?.createCollection?.();
				}
			},
			openCreateMenu(bindElement) {
				const collectionIcon = main_core.Tag.render`
				<span class="note-action-menu-icon sidebar-search-row__menu-icon-collection"></span>
			`;
				const items = [{
					text: main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_DOCUMENT_MENU') || '',
					iconModifier: 'o-document-sign',
					onClick: () => {
						void this.actions?.createDocumentFromSidebar?.();
					}
				}, {
					text: main_core.Loc.getMessage('NOTE_SIDEBAR_CREATE_COLLECTION_MENU') || '',
					iconElement: collectionIcon,
					onClick: () => {
						void this.actions?.createCollection?.();
					}
				}];
				this.actionMenuService.open(items, bindElement, {
					key: 'sidebar-search-row-create'
				});
			}
		},
		template: `
		<div class="sidebar-search-row" :class="{ 'sidebar-search-row--no-create': !showCreateButton }">
			<SidebarSearchInput
				@navigate-document="$emit('navigate-document', $event)"
				@navigate-search="$emit('navigate-search', $event)"
			/>
			<button
				v-if="showCreateButton"
				type="button"
				class="sidebar-search-row__create"
				:title="createButtonLabel"
				:aria-label="createButtonLabel"
				@click="onCreateClick($event)"
			>
				<BIcon class="sidebar-search-row__create-icon" name="plus-l" :size="28" color="var(--ui-color-accent-main-primary)" />
			</button>
		</div>
	`
	};

	const SidebarFooter = {
		name: 'SidebarFooter',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			themeActions: {
				type: Object,
				default: null
			}
		},
		emits: ['toggle-collapsed'],
		computed: {
			canEditGlobalPermissions() {
				return Boolean(this.state?.permissions?.canEditGlobalPermissions);
			},
			isMobile() {
				return Boolean(this.state?.isMobile);
			},
			canImport() {
				return Boolean(this.state?.permissions?.canImport);
			},
			isRecycleBinActive() {
				return Boolean(this.state?.selectedRecycleBinView);
			},
			isCollapsed() {
				return Boolean(this.state?.sidebarCollapsed);
			},
			importLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_IMPORT_COLLECTION_MENU') || '';
			},
			recycleBinLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_RECYCLE_BIN') || '';
			},
			permissionsLabel() {
				return main_core.Loc.getMessage('NOTE_SIDEBAR_OPEN_PERMISSIONS') || '';
			},
			toggleLabel() {
				return main_core.Loc.getMessage(this.isCollapsed ? 'NOTE_SIDEBAR_TOGGLE_EXPAND' : 'NOTE_SIDEBAR_TOGGLE_COLLAPSE') || '';
			},
			toggleIconName() {
				return this.isCollapsed ? 'chevron-right-l' : 'chevron-left-l';
			},
			hasThemeToggle() {
				return main_core.Type.isPlainObject(this.themeActions) && main_core.Type.isFunction(this.themeActions.toggle);
			},
			isDarkTheme() {
				return this.themeActions?.state?.theme === 'dark';
			},
			themeIconName() {
				return this.isDarkTheme ? 'o-sun' : 'o-moon';
			},
			themeLabel() {
				return main_core.Loc.getMessage(this.isDarkTheme ? 'NOTE_SIDEBAR_THEME_TO_LIGHT' : 'NOTE_SIDEBAR_THEME_TO_DARK') || '';
			}
		},
		methods: {
			openImportDialog() {
				try {
					if (!main_core.Type.isFunction(note_import.ImportDialog)) {
						throw new TypeError('note.import extension API is not available');
					}
					const dialog = new note_import.ImportDialog({
						wikiImportEnabled: Boolean(this.state?.permissions?.canImportWiki),
						onComplete: async () => {
							if (main_core.Type.isFunction(this.actions?.refreshCollections)) {
								await this.actions.refreshCollections();
							}
						}
					});
					dialog.show();
				} catch (error) {
					console.error('note.sidebar: failed to open import dialog', error);
				}
			},
			onRecycleBin() {
				if (typeof this.actions?.navigateToRecycleBin === 'function') {
					this.actions.navigateToRecycleBin();
				}
			},
			onToggleCollapsed() {
				this.$emit('toggle-collapsed');
			},
			onToggleTheme() {
				if (this.hasThemeToggle) {
					this.themeActions.toggle();
				}
			},
			async onOpenPermissions() {
				try {
					if (main_core.Type.isFunction(note_permissions.App?.openGlobalSettings)) {
						note_permissions.App.openGlobalSettings();
						return;
					}
				} catch (error) {
					console.error('note.sidebar: failed to open permissions', error);
				}
				const sidePanel = main_sidepanel.SidePanel?.Instance || null;
				if (sidePanel && main_core.Type.isFunction(sidePanel.open)) {
					sidePanel.open('/note/settings/permissions/', {
						cacheable: false
					});
				}
			}
		},
		template: `
		<footer class="sidebar-footer" :class="{ 'is-collapsed': isCollapsed }">
			<button
				type="button"
				class="sidebar-footer__btn"
				:class="{ 'is-active': isRecycleBinActive }"
				:title="recycleBinLabel"
				:aria-label="recycleBinLabel"
				:aria-pressed="isRecycleBinActive.toString()"
				@click="onRecycleBin"
			>
				<BIcon class="sidebar-footer__icon" name="o-trashcan" :size="26" />
			</button>
			<button
				v-if="canEditGlobalPermissions && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="permissionsLabel"
				:aria-label="permissionsLabel"
				@click="onOpenPermissions"
			>
				<BIcon class="sidebar-footer__icon" name="o-settings" :size="26" />
			</button>
			<button
				v-if="canImport && !isMobile"
				type="button"
				class="sidebar-footer__btn"
				:title="importLabel"
				:aria-label="importLabel"
				@click="openImportDialog"
			>
				<BIcon class="sidebar-footer__icon" name="o-share" :size="26" />
			</button>
			<button
				v-if="hasThemeToggle"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--theme"
				:title="themeLabel"
				:aria-label="themeLabel"
				:aria-pressed="isDarkTheme.toString()"
				@click="onToggleTheme"
			>
				<BIcon class="sidebar-footer__icon" :name="themeIconName" :size="26" />
			</button>
			<button
				v-if="!isMobile"
				type="button"
				class="sidebar-footer__btn sidebar-footer__btn--toggle"
				:title="toggleLabel"
				:aria-label="toggleLabel"
				:aria-pressed="isCollapsed.toString()"
				@click="onToggleCollapsed"
			>
				<BIcon class="sidebar-footer__icon" :name="toggleIconName" :size="26" />
			</button>
		</footer>
	`
	};

	const SidebarRootComponent = {
		name: 'SidebarRootComponent',
		components: {
			TreeNode,
			SidebarSearchRow,
			SidebarFooter,
			SidebarLoader,
			BIcon: ui_iconSet_api_vue.BIcon,
			ExpandTransition
		},
		props: {
			state: {
				type: Object,
				required: true
			},
			actions: {
				type: Object,
				required: true
			},
			messages: {
				type: Object,
				required: true
			},
			themeActions: {
				type: Object,
				default: null
			}
		},
		data() {
			return {
				isSidebarResizing: false,
				sidebarResizeStartX: 0,
				sidebarResizeStartWidth: 0,
				renameCollectionCancelled: false,
				dragAutoScrollRaf: 0,
				dragAutoScrollSpeed: 0,
				dragLastClientX: 0,
				dragLastClientY: 0,
				dragOverCaptureHandler: null,
				dragScrollDuringDrag: null,
				dispatchingSyntheticDragOver: false
			};
		},
		mounted() {
			const content = this.$refs.sidebarContent;
			if (content) {
				this.dragOverCaptureHandler = event => this.onDragOverCapture(event);
				content.addEventListener('dragover', this.dragOverCaptureHandler, true);
				this.dragScrollDuringDrag = () => this.onScrollDuringDrag();
				content.addEventListener('scroll', this.dragScrollDuringDrag, {
					passive: true
				});
			}
		},
		beforeUnmount() {
			this.clearSidebarResizeState();
			this.stopDragAutoScroll();
			const content = this.$refs.sidebarContent;
			if (content && this.dragOverCaptureHandler) {
				content.removeEventListener('dragover', this.dragOverCaptureHandler, true);
			}
			if (content && this.dragScrollDuringDrag) {
				content.removeEventListener('scroll', this.dragScrollDuringDrag);
			}
		},
		watch: {
			'state.renamingCollectionId': function (value) {
				this.renameCollectionCancelled = false;
				if (value !== null) {
					this.$nextTick(() => {
						const input = this.$refs[`renameCollectionInput-${value}`];
						const el = Array.isArray(input) ? input[0] : input;
						if (el) {
							el.focus();
							el.select();
						}
					});
				}
			}
		},
		methods: {
			onSearchNavigateDocument(payload) {
				const documentId = Number(payload?.documentId);
				if (documentId > 0) {
					// Direct click on a quick-search result.
					note_analytics.NoteAnalytics.documentViewed('search');
					this.actions.openDocument({
						id: documentId
					});
				}
			},
			onSearchNavigateSearch(payload) {
				const query = String(payload?.query || '');
				if (query.length > 0) {
					// "Show all results" gesture navigating to the full search page.
					note_analytics.NoteAnalytics.searchResult(true);
					this.actions.navigateToSearch(query);
				}
			},
			onSidebarResizeStart(event) {
				if (!(event instanceof MouseEvent) || event.button !== 0) {
					return;
				}
				if (!main_core.Type.isFunction(this.actions.setSidebarWidth)) {
					return;
				}
				if (this.state.sidebarCollapsed) {
					return;
				}
				event.preventDefault();
				this.isSidebarResizing = true;
				this.sidebarResizeStartX = event.clientX;
				this.sidebarResizeStartWidth = Number(this.state.sidebarWidth) || 280;
				main_core.Dom.addClass(document.body, 'note-sidebar-resizing');
				main_core.Event.bind(document, 'mousemove', this.onSidebarResizeMove);
				main_core.Event.bind(document, 'mouseup', this.onSidebarResizeEnd);
				main_core.Event.bind(window, 'blur', this.onSidebarResizeCancel);
			},
			onSidebarResizeMove(event) {
				if (!this.isSidebarResizing || !main_core.Type.isFunction(this.actions.setSidebarWidth)) {
					return;
				}
				const deltaX = event.clientX - this.sidebarResizeStartX;
				const nextWidth = this.sidebarResizeStartWidth + deltaX;
				this.actions.setSidebarWidth(nextWidth);
			},
			onSidebarResizeEnd() {
				if (!this.isSidebarResizing) {
					return;
				}
				if (main_core.Type.isFunction(this.actions.saveSidebarWidth)) {
					this.actions.saveSidebarWidth(this.state.sidebarWidth);
				}
				this.clearSidebarResizeState();
			},
			onSidebarResizeCancel() {
				if (!this.isSidebarResizing) {
					return;
				}
				this.clearSidebarResizeState();
			},
			clearSidebarResizeState() {
				this.isSidebarResizing = false;
				main_core.Dom.removeClass(document.body, 'note-sidebar-resizing');
				main_core.Event.unbind(document, 'mousemove', this.onSidebarResizeMove);
				main_core.Event.unbind(document, 'mouseup', this.onSidebarResizeEnd);
				main_core.Event.unbind(window, 'blur', this.onSidebarResizeCancel);
			},
			onToggleSidebarCollapsed() {
				if (!main_core.Type.isFunction(this.actions.toggleSidebarCollapsed)) {
					return;
				}
				this.clearSidebarResizeState();
				const isCollapsed = Boolean(this.actions.toggleSidebarCollapsed());
				if (main_core.Type.isFunction(this.actions.saveSidebarState)) {
					this.actions.saveSidebarState({
						width: this.state.sidebarWidth,
						collapsed: isCollapsed
					});
				}
			},
			getSidebarToggleLabel() {
				return this.state.sidebarCollapsed ? main_core.Loc.getMessage('NOTE_SIDEBAR_TOGGLE_EXPAND') : main_core.Loc.getMessage('NOTE_SIDEBAR_TOGGLE_COLLAPSE');
			},
			onSidebarScroll(event) {
				if (!this.state.collectionsSectionExpanded) {
					return;
				}
				const target = event.target;
				if (!(target instanceof HTMLElement)) {
					return;
				}
				const offsetToBottom = target.scrollHeight - (target.scrollTop + target.clientHeight);
				if (offsetToBottom <= 64) {
					void this.actions.loadMoreCollections();
				}
				this.tryAutoLoadDocuments(target);
			},
			tryAutoLoadDocuments(container) {
				const sentinels = container.querySelectorAll('.js-doc-load-more-sentinel');
				if (sentinels.length === 0) {
					return;
				}
				const containerRect = container.getBoundingClientRect();
				for (const sentinel of sentinels) {
					if (!(sentinel instanceof HTMLElement)) {
						continue;
					}
					const rect = sentinel.getBoundingClientRect();
					if (rect.bottom < containerRect.top - 24 || rect.top > containerRect.bottom + 24) {
						continue;
					}
					const collectionId = Number(sentinel.dataset.collectionId);
					if (!Number.isFinite(collectionId) || collectionId <= 0) {
						continue;
					}
					const rawParentId = sentinel.dataset.parentId || '';
					const parentId = rawParentId === 'root' ? null : Number(rawParentId);
					if (rawParentId !== 'root' && (!Number.isFinite(parentId) || parentId <= 0)) {
						continue;
					}
					const hasNext = parentId === null ? this.state.hasRootNextPage(collectionId) : this.state.hasNextChildren(collectionId, parentId);
					if (!hasNext) {
						continue;
					}
					const isLoading = parentId === null ? this.state.isRootLoading(collectionId) : this.state.isLoadingChildren(collectionId, parentId);
					if (isLoading) {
						continue;
					}
					void this.actions.loadMoreChildren({
						collectionId,
						id: parentId
					});
					break;
				}
			},
			collectionDropClass(collection) {
				const target = this.state.collectionDropTarget;
				if (!target || Number(target.id) !== Number(collection.id)) {
					return '';
				}
				if (target.placement === 'before') {
					return 'is-drop-before';
				}
				if (this.actions.isCollectionExpanded(collection.id)) {
					return '';
				}
				return 'is-drop-after';
			},
			isCollectionDropAfterExpanded(collection) {
				const target = this.state.collectionDropTarget;
				if (!target || Number(target.id) !== Number(collection.id)) {
					return false;
				}
				return target.placement === 'after' && this.actions.isCollectionExpanded(collection.id);
			},
			onContentDragOver(event) {
				this.actions.onCollectionViewportDragOver(event);
				this.actions.onDocViewportDragOver(event);
			},
			onContentDrop(event) {
				this.stopDragAutoScroll();
				this.actions.onCollectionViewportDrop(event);
				this.actions.onDocViewportDrop(event);
			},
			isAnyDragActive() {
				return Boolean(this.state.docDragItem) || Boolean(this.state.collectionDragItem);
			},
			onDragOverCapture(event) {
				if (this.dispatchingSyntheticDragOver) {
					return;
				}
				if (!this.isAnyDragActive()) {
					this.stopDragAutoScroll();
					return;
				}
				this.dragLastClientX = event.clientX;
				this.dragLastClientY = event.clientY;
				this.updateDragAutoScrollSpeed();
			},
			onScrollDuringDrag() {
				if (!this.isAnyDragActive()) {
					return;
				}
				if (typeof this.actions.invalidateDndRectCache === 'function') {
					this.actions.invalidateDndRectCache();
				}
			},
			updateDragAutoScrollSpeed() {
				const content = this.$refs.sidebarContent;
				if (!content) {
					return;
				}
				const rect = content.getBoundingClientRect();
				const EDGE = 56;
				const MAX_SPEED = 2;
				let speed = 0;
				if (this.dragLastClientY < rect.top + EDGE && content.scrollTop > 0) {
					const ratio = Math.min(1, (rect.top + EDGE - this.dragLastClientY) / EDGE);
					speed = -Math.max(1, Math.ceil(ratio * MAX_SPEED));
				} else if (this.dragLastClientY > rect.bottom - EDGE && content.scrollTop + content.clientHeight < content.scrollHeight) {
					const ratio = Math.min(1, (this.dragLastClientY - (rect.bottom - EDGE)) / EDGE);
					speed = Math.max(1, Math.ceil(ratio * MAX_SPEED));
				}
				this.dragAutoScrollSpeed = speed;
				if (speed !== 0) {
					this.runDragAutoScrollFrame();
				}
			},
			runDragAutoScrollFrame() {
				if (this.dragAutoScrollRaf !== 0) {
					return;
				}
				this.dragAutoScrollRaf = requestAnimationFrame(() => {
					this.dragAutoScrollRaf = 0;
					if (!this.isAnyDragActive() || this.dragAutoScrollSpeed === 0) {
						return;
					}
					const content = this.$refs.sidebarContent;
					if (!content) {
						return;
					}
					const before = content.scrollTop;
					content.scrollTop = before + this.dragAutoScrollSpeed;
					if (content.scrollTop !== before) {
						this.refireDragOverAtLastPos();
					}
					this.updateDragAutoScrollSpeed();
				});
			},
			refireDragOverAtLastPos() {
				const el = document.elementFromPoint(this.dragLastClientX, this.dragLastClientY);
				if (!el) {
					return;
				}
				const evt = new DragEvent('dragover', {
					bubbles: true,
					cancelable: true,
					clientX: this.dragLastClientX,
					clientY: this.dragLastClientY
				});
				this.dispatchingSyntheticDragOver = true;
				try {
					el.dispatchEvent(evt);
				} finally {
					this.dispatchingSyntheticDragOver = false;
				}
			},
			stopDragAutoScroll() {
				this.dragAutoScrollSpeed = 0;
				if (this.dragAutoScrollRaf !== 0) {
					cancelAnimationFrame(this.dragAutoScrollRaf);
					this.dragAutoScrollRaf = 0;
				}
			},
			onCollectionRowDragOver(collection, event) {
				if (this.state.docDragItem) {
					this.actions.onDocCollectionDragOver(collection, event);
					return;
				}
				this.actions.onCollectionDragOver(collection, event);
			},
			onCollectionRowDrop(collection, event) {
				if (this.state.docDragItem) {
					this.actions.onDocCollectionDrop(collection, event);
					return;
				}
				this.actions.onCollectionDrop(collection, event);
			},
			onRootBranchDragEnter(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragEnter({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onRootBranchDragOver(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragOver({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onRootBranchDrop(collection, event) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDrop({
					branchElement: event.currentTarget,
					collectionId: collection.id,
					parentId: null,
					nativeEvent: event
				});
			},
			onNestedBranchDragEnter(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragEnter(payload);
			},
			onNestedBranchDragOver(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDragOver(payload);
			},
			onNestedBranchDrop(payload) {
				if (!this.state.docDragItem) {
					return;
				}
				this.actions.onDocBranchDrop(payload);
			},
			isDocDropInsideCollection(collection) {
				const target = this.state.docDropTarget;
				if (!target) {
					return false;
				}
				return target.placement === 'inside' && Number(target.collectionId) === Number(collection.id) && (target.targetId === null || target.targetId === undefined);
			},
			canEditCollection(collection) {
				return this.actions.canEditCollection(collection);
			},
			getCollectionTitle(collection) {
				const title = String(collection?.name ?? '').trim();
				return title === '' ? null : title;
			},
			onCollectionDragStart(collection, event) {
				if (!this.canEditCollection(collection)) {
					event.preventDefault();
					return;
				}
				this.actions.startCollectionDrag(collection, event);
			},
			isRenamingCollection(collection) {
				return this.state.renamingCollectionId === Number(collection.id);
			},
			onRenameCollectionKeyEnter(event) {
				event.target.blur();
			},
			onRenameCollectionKeyEscape(collection) {
				this.renameCollectionCancelled = true;
				const input = this.$refs[`renameCollectionInput-${collection.id}`];
				const el = Array.isArray(input) ? input[0] : input;
				if (el) {
					el.blur();
				}
			},
			onRenameCollectionBlur(collection, event) {
				if (this.renameCollectionCancelled) {
					this.actions.cancelRenameCollection();
					return;
				}
				const value = event.target.value.trim();
				if (!value) {
					this.actions.cancelRenameCollection();
					return;
				}
				this.actions.confirmRenameCollection(Number(collection.id), value);
			},
			onCollectionPlateClick(collection) {
				const id = Number(collection?.id);
				if (!Number.isInteger(id) || id <= 0) {
					return;
				}
				const isExpanded = typeof this.actions.isCollectionExpanded === 'function' ? Boolean(this.actions.isCollectionExpanded(id)) : false;
				const isCurrent = Number(this.state.selectedCollectionId) === id && !this.state.selectedDocId;
				if (isCurrent || !isExpanded) {
					this.actions.toggleCollectionExpanded(collection);
				}
				note_analytics.NoteAnalytics.collectionViewed('side_menu');
				this.actions.openCollection(collection);
				if (typeof this.actions.navigateToWorkspace === 'function') {
					this.actions.navigateToWorkspace(id);
				}
			},
			collectionHref(collection) {
				const id = Number(collection?.id);
				return Number.isFinite(id) && id > 0 ? `/note/workspace/${id}/` : '';
			},
			onCollectionTitleClick(collection, event) {
				if (this.isRenamingCollection(collection)) {
					return;
				}
				// Let the browser handle modifier keys, middle/right click natively
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.onCollectionPlateClick(collection);
			}
		},
		template: `
		<aside
			class="sidebar"
			:class="{ 'is-collapsed': state.sidebarCollapsed, 'is-dragging': isAnyDragActive() }"
			:style="{ '--note-sidebar-width': \`\${state.sidebarEffectiveWidth}px\` }"
		>
			<SidebarSearchRow
				:state="state"
				:actions="actions"
				@navigate-document="onSearchNavigateDocument"
				@navigate-search="onSearchNavigateSearch"
			/>
			<div
				class="sidebar-layout"
				@dragover="onContentDragOver($event)"
				@drop="onContentDrop($event)"
			>
				<div
					class="sidebar-content"
					ref="sidebarContent"
					@scroll.passive="onSidebarScroll"
				>
					<div class="sidebar-sections">
						<button
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedSharedView }"
							@click="actions.navigateToShared()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-forward" :size="30" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.sharedWithMe }}</span>
						</button>
						<button
							type="button"
							class="sidebar-section-header"
							:title="state.collectionsSectionExpanded ? messages.collapseCollections : messages.expandCollections"
							@click="actions.toggleCollectionsSection()"
						>
							<span class="sidebar-section-header__icon" aria-hidden="true"></span>
							<span class="sidebar-section-header__title">{{ messages.collections }}</span>
							<span
								class="sidebar-section-header__chevron"
								:class="{ 'is-expanded': state.collectionsSectionExpanded }"
							>
								<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
							</span>
						</button>
						<ExpandTransition :loading="state.collectionsLoading && !state.collections.length">
						<div
							v-if="state.collectionsSectionExpanded"
							class="collection-list"
							@dragover="actions.onCollectionListDragOver($event)"
							@drop="actions.onCollectionListDrop($event)"
						>
							<div v-if="state.collectionsLoading && !state.collections.length" class="sidebar-muted">
								<SidebarLoader :level="0" />
							</div>
							<template v-else>
								<div
									v-for="collection in state.collections"
									:key="collection.id"
									:class="{ 'is-collection-drop-after': isCollectionDropAfterExpanded(collection) }"
								>
									<div
										class="collection-row"
										:data-collection-id="collection.id"
										:class="[
										{ 'is-active': state.selectedCollectionId === Number(collection.id) && !state.selectedDocId },
										collectionDropClass(collection),
										{ 'is-drop-inside': isDocDropInsideCollection(collection) },
										{ 'is-drag-source': state.collectionDragItem && state.collectionDragItem.id === Number(collection.id) },
										{ 'has-actions': canEditCollection(collection) && !isRenamingCollection(collection) }
										]"
										:draggable="canEditCollection(collection)"
										@mouseenter="actions.prefetchCollectionChildren(collection)"
										@dragstart="onCollectionDragStart(collection, $event)"
										@dragover="onCollectionRowDragOver(collection, $event)"
										@drop="onCollectionRowDrop(collection, $event)"
										@dragend="actions.endCollectionDrag"
									>
									<span
										class="collection-link"
										:title="isRenamingCollection(collection) ? null : getCollectionTitle(collection)"
									>
										<button
											v-if="!isRenamingCollection(collection)"
											type="button"
											class="collection-disclosure"
											:class="{ 'is-expanded': actions.isCollectionExpanded(collection.id) }"
											@click.stop="actions.toggleCollectionExpanded(collection)"
										>
											<BIcon name="chevron-right-l" :size="16" color="var(--ui-color-accent-main-primary)" />
										</button>
										<input
											v-if="isRenamingCollection(collection)"
											class="collection-title-input"
											type="text"
											:value="collection.name"
											@keydown.enter="onRenameCollectionKeyEnter($event)"
											@keydown.escape="onRenameCollectionKeyEscape(collection)"
											@blur="onRenameCollectionBlur(collection, $event)"
											@click.stop
											:ref="'renameCollectionInput-' + collection.id"
										/>
										<a
											v-else
											class="collection-title collection-title-link"
											:href="collectionHref(collection)"
											draggable="false"
											@click="onCollectionTitleClick(collection, $event)"
										>{{ collection.name }}</a>
									</span>
									<div v-if="!isRenamingCollection(collection)" class="collection-actions">
										<button
											v-if="canEditCollection(collection)"
											class="row-action-btn"
											type="button"
											:title="messages.createDocument"
											:aria-label="messages.createDocument"
											@click.stop="actions.createDocumentForCollection(collection)"
										>
											<BIcon name="plus-l" :size="24" color="var(--ui-color-accent-main-primary)" />
										</button>
									</div>
										<span v-if="isDocDropInsideCollection(collection)"
												class="collection-drop-overlay"/>
									</div>
									<ExpandTransition :loading="state.isRootLoading(collection.id)">
									<div
										v-if="actions.isCollectionExpanded(collection.id)"
										class="collection-tree"
									>
										<ul
											class="tree-branch"
											@dragenter="onRootBranchDragEnter(collection, $event)"
											@dragover.stop="onRootBranchDragOver(collection, $event)"
											@drop.stop="onRootBranchDrop(collection, $event)"
										>
											<tree-node
												v-for="doc in state.getRootDocs(collection.id)"
												:key="doc.id"
												:doc="doc"
												:level="1"
												:selected-doc-id="state.selectedDocId"
												:expanded-docs="state.expandedDocs"
												:get-children="state.getChildren"
												:is-loading-children="state.isLoadingChildren"
												:has-next-children="state.hasNextChildren"
												:can-edit-document="actions.canEditDocument"
												:can-manage-document="actions.canManageDocument"
												:messages="messages"
												:doc-drag-item="state.docDragItem"
												:doc-drop-target="state.docDropTarget"
												:renaming-doc-id="state.renamingDocId"
												@toggle="actions.toggleDoc"
												@open="actions.openDocument"
												@prefetch-children="actions.prefetchDocumentChildren"
												@load-more="actions.loadMoreChildren"
												@create-child="actions.createChildDocument"
												@rename-doc="actions.renameDocument"
												@delete-doc="actions.deleteDocument"
												@start-drag="actions.startDocDrag($event.doc, $event.nativeEvent)"
												@branch-drag-enter="onNestedBranchDragEnter($event)"
												@branch-drag-over="onNestedBranchDragOver($event)"
												@branch-drop="onNestedBranchDrop($event)"
												@end-drag="actions.endDocDrag"
												@confirm-rename-doc="actions.confirmRenameDocument($event.doc.id, $event.title, $event.doc.collectionId)"
												@cancel-rename-doc="actions.cancelRenameDocument()"
											/>
											<li v-if="state.isRootLoading(collection.id)" class="sidebar-muted">
												<SidebarLoader :level="1" />
											</li>
											<li
												v-if="state.hasRootNextPage(collection.id)"
												class="doc-load-more-sentinel js-doc-load-more-sentinel"
												:data-collection-id="collection.id"
												data-parent-id="root"
												aria-hidden="true"
											/>
										</ul>
									</div>
									</ExpandTransition>
								</div>
								<div v-if="!state.collections.length"
									 class="sidebar-muted">{{ messages.emptyCollections }}
								</div>
								<div v-if="state.collectionsLoading && state.collections.length" class="sidebar-muted">
									<SidebarLoader :level="0" />
								</div>
							</template>
						</div>
						</ExpandTransition>
						<button
							type="button"
							class="sidebar-fixed-row"
							:class="{ 'is-active': state.selectedArchiveView }"
							@click="actions.navigateToArchive()"
						>
							<BIcon class="sidebar-fixed-row__icon" name="o-box-with-lid" :size="30" color="var(--ui-color-accent-main-primary)" />
							<span class="sidebar-fixed-row__title">{{ messages.archive }}</span>
						</button>
					</div>
				</div>
			</div>
			<SidebarFooter
				:state="state"
				:actions="actions"
				:theme-actions="themeActions"
				@toggle-collapsed="onToggleSidebarCollapsed"
			/>
			<div
				v-if="!state.sidebarCollapsed"
				class="sidebar-resizer"
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
				@mousedown="onSidebarResizeStart"
			></div>
		</aside>
	`
	};

	function createInlineEditActions({
		collectionUseCases,
		documentUseCases
	}) {
		return {
			confirmRenameCollection: (id, name) => collectionUseCases.confirmRenameCollection(id, name),
			cancelRenameCollection: () => collectionUseCases.cancelRenameCollection(),
			confirmRenameDocument: (id, title, collectionId) => {
				return documentUseCases.confirmRenameDocument(id, title, collectionId);
			},
			cancelRenameDocument: () => documentUseCases.cancelRenameDocument()
		};
	}
	function createDndActions({
		collectionDndService,
		documentDndService
	}) {
		return {
			startCollectionDrag: (collection, event) => collectionDndService.startDrag(collection, event),
			onCollectionDragOver: (collection, event) => collectionDndService.onDragOver(collection, event),
			onCollectionDrop: async (collection, event) => collectionDndService.onDrop(collection, event),
			onCollectionListDragOver: event => collectionDndService.onListDragOver(event),
			onCollectionListDrop: async event => collectionDndService.onListDrop(event),
			onCollectionViewportDragOver: event => collectionDndService.onViewportDragOver(event),
			onCollectionViewportDrop: async event => collectionDndService.onViewportDrop(event),
			endCollectionDrag: () => collectionDndService.endDrag(),
			startDocDrag: (doc, event) => documentDndService.startDrag(doc, event),
			onDocBranchDragEnter: payload => documentDndService.onBranchDragEnter(payload),
			onDocBranchDragOver: payload => documentDndService.onBranchDragOver(payload),
			onDocBranchDrop: async payload => documentDndService.onBranchDrop(payload),
			onDocCollectionDragOver: (collection, event) => documentDndService.onCollectionDragOver(collection, event),
			onDocCollectionDrop: async (collection, event) => documentDndService.onCollectionDrop(collection, event),
			onDocViewportDragOver: event => documentDndService.onViewportDragOver(event),
			onDocViewportDrop: async event => documentDndService.onViewportDrop(event),
			endDocDrag: () => documentDndService.clearDrag(),
			invalidateDndRectCache: () => {
				collectionDndService.invalidateDragRectCache();
				documentDndService.invalidateDragRectCache();
			}
		};
	}
	function createSidebarActions({
		collectionUseCases,
		documentUseCases,
		collectionDndService,
		documentDndService,
		messages,
		router,
		routeNames = {},
		setSidebarWidth = () => {},
		saveSidebarWidth = () => {},
		setSidebarMinWidth = () => {},
		setSidebarCollapsed = () => {},
		toggleSidebarCollapsed = () => false,
		saveSidebarState = () => {}
	}) {
		return {
			canEditCollection: collection => collectionUseCases.canEditCollection(collection),
			canManageCollectionPermissions: collection => collectionUseCases.canManageCollectionPermissions(collection),
			canEditDocument: doc => documentUseCases.canEditDocument(doc),
			canManageDocument: doc => documentUseCases.canManageDocument(doc),
			openCollection: async collection => collectionUseCases.openCollection(collection),
			prefetchCollectionChildren: async collection => collectionUseCases.prefetchCollectionChildren(collection),
			isCollectionExpanded: collectionId => collectionUseCases.isCollectionExpanded(collectionId),
			toggleCollectionExpanded: async collection => collectionUseCases.toggleCollectionExpanded(collection),
			toggleCollectionsSection: () => collectionUseCases.toggleCollectionsSection(),
			loadMoreCollections: async () => collectionUseCases.loadMoreCollections(),
			refreshCollections: async () => collectionUseCases.refreshCollections(),
			openDocument: async doc => documentUseCases.openDocument(doc),
			prefetchDocumentChildren: async doc => documentUseCases.prefetchDocumentChildren(doc),
			toggleDoc: async doc => documentUseCases.toggleDoc(doc),
			loadMoreChildren: async doc => documentUseCases.loadMoreChildren(doc),
			createCollection: async () => collectionUseCases.createCollection(),
			createDocument: async () => documentUseCases.createDocument(),
			createDocumentFromSidebar: async () => documentUseCases.createDocumentFromSidebar(),
			createDocumentForCollection: async collection => documentUseCases.createDocumentForCollection(collection),
			createChildDocument: async doc => documentUseCases.createChildDocument(doc),
			renameCollection: async collection => collectionUseCases.renameCollection(collection),
			deleteCollection: async collection => collectionUseCases.deleteCollection(collection),
			renameDocument: async doc => documentUseCases.renameDocument(doc),
			deleteDocument: async doc => documentUseCases.deleteDocument(doc),
			archiveDocument: async doc => documentUseCases.archiveDocument(doc),
			restoreDocument: async doc => documentUseCases.restoreDocument(doc),
			...createDndActions({
				collectionDndService,
				documentDndService
			}),
			...createInlineEditActions({
				collectionUseCases,
				documentUseCases
			}),
			setSidebarWidth: width => setSidebarWidth(width),
			saveSidebarWidth: width => saveSidebarWidth(width),
			setSidebarMinWidth: minWidth => setSidebarMinWidth(minWidth),
			setSidebarCollapsed: collapsed => setSidebarCollapsed(collapsed),
			toggleSidebarCollapsed: () => toggleSidebarCollapsed(),
			saveSidebarState: payload => saveSidebarState(payload),
			navigateToSearch: query => {
				if (router && routeNames.search) {
					router.push({
						name: routeNames.search,
						query: {
							q: query
						}
					});
				}
			},
			navigateToShared: () => {
				if (router && routeNames.shared) {
					router.push({
						name: routeNames.shared
					});
				}
			},
			navigateToArchive: () => {
				if (router && routeNames.archive) {
					router.push({
						name: routeNames.archive
					});
				}
			},
			navigateToRecycleBin: () => {
				if (router && routeNames.recyclebin) {
					router.push({
						name: routeNames.recyclebin
					});
				}
			},
			navigateToWorkspace: collectionId => {
				const id = Number(collectionId);
				if (!router || !routeNames.workspace || !Number.isInteger(id) || id <= 0) {
					return;
				}
				router.push({
					name: routeNames.workspace,
					params: {
						id
					}
				});
			}
		};
	}

	class CollectionDndService {
		#dragState;
		#store;
		#api;
		#onFail;
		#cachedListElement = null;
		#cachedRects = null;
		#lastScrollTop = 0;
		#committed = false;
		constructor({
			dragState,
			store,
			api,
			onFail
		}) {
			this.#dragState = dragState;
			this.#store = store;
			this.#api = api;
			this.#onFail = onFail;
		}
		startDrag(collection, event) {
			this.#dragState.collectionItem = {
				id: Number(collection.id)
			};
			this.#dragState.collectionTarget = null;
			this.#committed = false;
			this.#invalidateRectCache();
			const transfer = event.dataTransfer;
			if (transfer) {
				transfer.effectAllowed = 'move';
				transfer.setData('text/plain', String(collection.id));
			}
		}
		onDragOver(collection, event) {
			if (!this.#dragState.collectionItem) {
				return;
			}
			event.preventDefault();
		}
		onListDragOver(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			event.preventDefault();
			const listNode = event.currentTarget;
			if (this.#cachedListElement !== listNode) {
				this.#cacheListRects(listNode);
			}
			const scrollParent = listNode.closest('.sidebar-content');
			if (scrollParent && scrollParent.scrollTop !== this.#lastScrollTop) {
				this.#lastScrollTop = scrollParent.scrollTop;
				this.#invalidateRectCache();
				this.#cacheListRects(listNode);
			}
			const target = this.#resolveCollectionGapTarget(event);
			if (!target) {
				return;
			}
			const current = this.#dragState.collectionTarget;
			if (current && Number(current.id) === Number(target.id) && current.placement === target.placement) {
				return;
			}
			this.#dragState.collectionTarget = target;
		}
		onViewportDragOver(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			const targetNode = event.target;
			if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list')) {
				return;
			}
			const target = this.#resolveCollectionViewportTarget(event);
			if (!target) {
				return;
			}
			event.preventDefault();
			this.#dragState.collectionTarget = target;
		}
		async onDrop(collection, event) {
			if (!this.#dragState.collectionItem) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#tryCommitAndClear();
		}
		async onListDrop(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			event.preventDefault();
			this.#tryCommitAndClear();
		}
		async onViewportDrop(event) {
			if (!this.#dragState.collectionItem || this.#dragState.docItem) {
				return;
			}
			const targetNode = event.target;
			if (targetNode instanceof HTMLElement && targetNode.closest('.collection-list')) {
				return;
			}
			if (!this.#dragState.collectionTarget) {
				this.#dragState.collectionTarget = this.#resolveCollectionViewportTarget(event);
			}
			event.preventDefault();
			this.#tryCommitAndClear();
		}
		endDrag() {
			this.#tryCommitAndClear();
		}
		clearDrag() {
			this.#dragState.collectionItem = null;
			this.#dragState.collectionTarget = null;
			this.#invalidateRectCache();
		}
		#tryCommitAndClear() {
			if (this.#committed) {
				this.clearDrag();
				return;
			}
			const dragItem = this.#dragState.collectionItem;
			const target = this.#dragState.collectionTarget;
			this.clearDrag();
			if (!dragItem || !target || dragItem.id === Number(target.id)) {
				return;
			}
			this.#committed = true;
			const position = this.#resolvePosition(dragItem.id, Number(target.id), target.placement);
			this.#store.actions.moveCollectionLocal(dragItem.id, Number(target.id), target.placement);
			void this.#sendMove(dragItem.id, position);
		}
		async #sendMove(dragId, position) {
			try {
				const response = await this.#api.moveCollection(dragId, position);
				const affected = Array.isArray(response?.affectedPositions) ? response.affectedPositions : [];
				if (affected.length > 0 && this.#store.actions.applyCollectionPositions) {
					this.#store.actions.applyCollectionPositions(affected);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		#resolvePosition(dragId, targetId, placement) {
			const siblings = this.#store.state.collections.value.map(item => Number(item.id)).filter(id => id !== dragId);
			const targetIndex = siblings.indexOf(targetId);
			if (targetIndex < 0) {
				return null;
			}
			const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			return insertIndex + 1;
		}
		#cacheListRects(listNode) {
			if (this.#cachedListElement === listNode) {
				return;
			}
			const rowNodes = [...listNode.querySelectorAll('.collection-row')];
			this.#cachedRects = rowNodes.map(row => {
				const rect = row.getBoundingClientRect();
				return {
					id: Number(row.dataset.collectionId),
					top: rect.top,
					bottom: rect.bottom,
					height: rect.height
				};
			});
			this.#cachedListElement = listNode;
		}
		#invalidateRectCache() {
			this.#cachedListElement = null;
			this.#cachedRects = null;
		}
		invalidateDragRectCache() {
			this.#invalidateRectCache();
		}
		#resolveCollectionGapTarget(event) {
			const rects = this.#cachedRects;
			if (!rects || rects.length === 0) {
				return null;
			}
			const pointerY = event.clientY;
			if (pointerY <= rects[0].top) {
				return {
					id: rects[0].id,
					placement: 'before'
				};
			}
			if (pointerY >= rects[rects.length - 1].bottom) {
				return {
					id: rects[rects.length - 1].id,
					placement: 'after'
				};
			}
			for (let i = 0; i < rects.length; i++) {
				const {
					id,
					top,
					height
				} = rects[i];
				const midY = top + height / 2;
				if (pointerY < midY) {
					if (i === 0) {
						return {
							id,
							placement: 'before'
						};
					}
					return {
						id: rects[i - 1].id,
						placement: 'after'
					};
				}
				const nextTop = i < rects.length - 1 ? rects[i + 1].top : null;
				if (nextTop === null || pointerY < nextTop) {
					return {
						id,
						placement: 'after'
					};
				}
			}
			return {
				id: rects[rects.length - 1].id,
				placement: 'after'
			};
		}
		#resolveCollectionViewportTarget(event) {
			const viewportNode = event.currentTarget;
			const listNode = viewportNode.querySelector('.collection-list');
			if (!(listNode instanceof HTMLElement)) {
				return null;
			}
			const rowNodes = [...listNode.querySelectorAll('.collection-row')];
			if (rowNodes.length === 0) {
				return null;
			}
			const pointerY = event.clientY;
			const firstId = Number(rowNodes[0].dataset.collectionId);
			const lastId = Number(rowNodes[rowNodes.length - 1].dataset.collectionId);
			if (!Number.isFinite(firstId) || !Number.isFinite(lastId)) {
				return null;
			}
			const listRect = listNode.getBoundingClientRect();
			if (pointerY < listRect.top) {
				return {
					id: firstId,
					placement: 'before'
				};
			}
			if (pointerY > listRect.bottom) {
				return {
					id: lastId,
					placement: 'after'
				};
			}
			return null;
		}
	}

	const NoteEvent = {
		DOCUMENT_RENAMED: 'Note:documentRenamed',
		COLLECTION_RENAMED: 'Note:collectionRenamed',
		DOCUMENT_CHILDREN_CHANGED: 'Note:documentChildrenChanged',
		DOCUMENTS_BULK_RESTORED: 'Note:documentsBulkRestored',
		// Cross-route bus: sidebar re-emits selected pull commands so other pages
		// (e.g. /shared/) can react without subscribing to BX.PULL directly.
		PULL_EVENT: 'Note:pullEvent',
		// Editor → app: after a push-driven capability refetch, app-level
		// routeDocumentContext.document needs the new recycleBinId/canRestore/etc
		// so menu actions (restoreFromTrash, hardDelete) can read them.
		DOCUMENT_ACCESS_SYNCED: 'Note:documentAccessSynced'
	};

	class DocumentDndService {
		#dragState;
		#store;
		#api;
		#onFail;
		#uiState;
		#autoExpandDelayMs;
		#prefetchCooldownMs = 300;
		#autoExpandTimer = null;
		#autoExpandKey = null;
		#dragPrefetchedKeys = new Set();
		#dragPrefetchInFlight = new Map();
		#dragPrefetchAt = new Map();
		#cachedBranchElement = null;
		#cachedRects = null;
		constructor({
			dragState,
			store,
			api,
			onFail,
			uiState,
			autoExpandDelayMs = 500
		}) {
			this.#dragState = dragState;
			this.#store = store;
			this.#api = api;
			this.#onFail = onFail;
			this.#uiState = uiState;
			this.#autoExpandDelayMs = autoExpandDelayMs;
		}
		startDrag(doc, event) {
			this.#clearAutoExpand();
			this.#clearDragPrefetchState();
			this.#invalidateRectCache();
			this.#dragState.docItem = {
				id: Number(doc.id),
				collectionId: Number(doc.collectionId),
				parentId: this.#toNullableInt(doc.parentId),
				title: String(doc.title || ''),
				hasChildren: Boolean(doc.hasChildren),
				position: Number(doc.position || 0)
			};
			this.#dragState.docTarget = null;
			const transfer = event.dataTransfer;
			if (transfer) {
				transfer.effectAllowed = 'move';
				transfer.setData('text/plain', String(doc.id));
			}
		}
		onBranchDragEnter(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			this.#cacheBranchRects(payload.branchElement);
		}
		onBranchDragOver(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			if (this.#cachedBranchElement !== payload.branchElement) {
				this.#cacheBranchRects(payload.branchElement);
			}
			const collectionId = Number(payload.collectionId);
			const parentId = this.#toNullableInt(payload.parentId);
			const target = this.#resolveGapTarget(collectionId, parentId, payload.nativeEvent);
			if (!target) {
				return;
			}
			const current = this.#dragState.docTarget;
			if (current && Number(current.targetId) === Number(target.targetId) && current.placement === target.placement && Number(current.collectionId) === Number(target.collectionId) && current.parentId === target.parentId) {
				return;
			}
			this.#dragState.docTarget = target;
			if (target.placement === 'inside' && target.targetId !== null) {
				const doc = this.#store.queries.findLoadedDocument(collectionId, target.targetId);
				if (doc) {
					this.#scheduleDocAutoExpand(doc);
				} else {
					this.#clearAutoExpand();
				}
			} else if (target.placement === 'inside' && target.targetId === null) {
				this.#scheduleCollectionAutoExpand(collectionId);
			} else {
				this.#clearAutoExpand();
			}
		}
		async onBranchDrop(payload) {
			if (!this.#dragState.docItem) {
				return;
			}
			payload.nativeEvent.preventDefault();
			payload.nativeEvent.stopPropagation();
			this.#clearAutoExpand();
			const target = this.#dragState.docTarget;
			if (!target) {
				this.clearDrag();
				return;
			}
			await this.#moveDocumentWithTarget(target);
		}
		onViewportDragOver(event) {
			if (!this.#dragState.docItem) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.tree-branch')) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.collection-row')) {
				return;
			}
			event.preventDefault();
			const currentTarget = this.#dragState.docTarget;
			if (!currentTarget) {
				return;
			}
			const collectionId = Number(currentTarget.collectionId);
			const rootDocs = this.#store.queries.getChildren(collectionId, null);
			if (rootDocs.length === 0) {
				return;
			}
			const lastDoc = rootDocs[rootDocs.length - 1];
			const lastDocId = Number(lastDoc.id);
			const newTarget = {
				collectionId,
				parentId: null,
				targetId: lastDocId,
				placement: 'after'
			};
			if (Number(currentTarget.targetId) === lastDocId && currentTarget.placement === 'after' && currentTarget.parentId === null) {
				return;
			}
			this.#dragState.docTarget = newTarget;
			this.#clearAutoExpand();
		}
		async onViewportDrop(event) {
			if (!this.#dragState.docItem) {
				return;
			}
			if (event.target instanceof HTMLElement && event.target.closest('.tree-branch')) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#clearAutoExpand();
			const target = this.#dragState.docTarget;
			if (!target) {
				this.clearDrag();
				return;
			}
			await this.#moveDocumentWithTarget(target);
		}
		onCollectionDragOver(collection, event) {
			if (!this.#dragState.docItem || !collection) {
				return;
			}
			event.preventDefault();
			const current = this.#dragState.docTarget;
			if (current && current.placement === 'inside' && current.targetId === null && Number(current.collectionId) === Number(collection.id)) {
				return;
			}
			this.#dragState.docTarget = {
				collectionId: Number(collection.id),
				parentId: null,
				targetId: null,
				placement: 'inside'
			};
			this.#scheduleCollectionAutoExpand(Number(collection.id));
		}
		async onCollectionDrop(collection, event) {
			if (!this.#dragState.docItem || !collection) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			this.#clearAutoExpand();
			const target = {
				collectionId: Number(collection.id),
				parentId: null,
				targetId: null,
				placement: 'inside'
			};
			await this.#moveDocumentWithTarget(target);
		}
		clearDrag() {
			this.#clearAutoExpand();
			this.#clearDragPrefetchState();
			this.#invalidateRectCache();
			this.#dragState.docItem = null;
			this.#dragState.docTarget = null;
		}
		async #moveDocumentWithTarget(target) {
			const dragItem = this.#dragState.docItem;
			if (!dragItem) {
				return;
			}
			if (target.targetId === dragItem.id) {
				this.clearDrag();
				return;
			}
			if (this.#isInvalidDocMoveTarget(dragItem, target)) {
				this.clearDrag();
				return;
			}
			try {
				const position = this.#resolveDocumentPosition(dragItem, target);
				const nextParentId = target.placement === 'inside' ? target.targetId : target.parentId;
				if (this.#shouldGuardPrefetchTarget(target, nextParentId)) {
					await this.#guardPrefetchTarget(target.collectionId, nextParentId);
				}
				await this.#api.moveDocument(dragItem.id, target.collectionId, nextParentId, position);
				this.#store.actions.moveDocumentLocal({
					docId: dragItem.id,
					fromCollectionId: dragItem.collectionId,
					fromParentId: dragItem.parentId,
					toCollectionId: target.collectionId,
					toParentId: nextParentId,
					placement: target.placement,
					targetId: target.targetId,
					fallbackDoc: {
						id: dragItem.id,
						collectionId: target.collectionId,
						parentId: nextParentId,
						title: dragItem.title,
						hasChildren: dragItem.hasChildren,
						position: dragItem.position
					}
				});
				const changedParents = new Set();
				if (dragItem.parentId !== null) {
					changedParents.add(`${dragItem.collectionId}:${dragItem.parentId}`);
				}
				if (nextParentId !== null) {
					changedParents.add(`${target.collectionId}:${nextParentId}`);
				}
				for (const key of changedParents) {
					const [colId, parId] = key.split(':').map(Number);
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId: parId,
							collectionId: colId
						}
					}));
				}
			} catch (error) {
				this.#onFail(error);
			} finally {
				this.clearDrag();
			}
		}
		#resolveDocumentPosition(dragItem, target) {
			if (target.placement === 'root' || target.placement === 'inside') {
				return null;
			}
			const siblings = this.#store.queries.getChildren(target.collectionId, target.parentId);
			const siblingIds = siblings.map(item => Number(item.id)).filter(id => id !== dragItem.id);
			const targetIndex = siblingIds.indexOf(target.targetId);
			if (targetIndex < 0) {
				return null;
			}
			const insertIndex = target.placement === 'before' ? targetIndex : targetIndex + 1;
			return insertIndex + 1;
		}
		#cacheBranchRects(branchElement) {
			if (this.#cachedBranchElement === branchElement) {
				return;
			}
			const rows = [...branchElement.querySelectorAll(':scope > li > .tree-row')];
			this.#cachedRects = rows.map(row => {
				const rect = row.getBoundingClientRect();
				return {
					docId: Number(row.dataset.docId),
					top: rect.top,
					bottom: rect.bottom,
					height: rect.height
				};
			});
			this.#cachedBranchElement = branchElement;
		}
		#invalidateRectCache() {
			this.#cachedBranchElement = null;
			this.#cachedRects = null;
		}
		invalidateDragRectCache() {
			this.#invalidateRectCache();
		}
		#resolveGapTarget(collectionId, parentId, event) {
			const rects = this.#cachedRects;
			if (!rects || rects.length === 0) {
				return {
					collectionId,
					parentId,
					targetId: null,
					placement: 'inside'
				};
			}
			const result = this.#findGapPlacement(rects, event.clientY);
			return {
				collectionId,
				parentId,
				targetId: result.docId,
				placement: result.placement
			};
		}
		#findGapPlacement(rects, pointerY) {
			for (let i = 0; i < rects.length; i++) {
				const {
					docId,
					top,
					height
				} = rects[i];
				if (pointerY < top + height * 0.25) {
					if (i === 0) {
						return {
							docId,
							placement: 'before'
						};
					}
					return {
						docId: rects[i - 1].docId,
						placement: 'after'
					};
				}
				if (pointerY < top + height * 0.75) {
					return {
						docId,
						placement: 'inside'
					};
				}
				if (this.#store.state.expandedDocs[docId] && pointerY < top + height) {
					return {
						docId,
						placement: 'inside'
					};
				}
				const nextTop = i < rects.length - 1 ? rects[i + 1].top : null;
				if (nextTop === null || pointerY < nextTop) {
					return {
						docId,
						placement: 'after'
					};
				}
			}
			return {
				docId: rects[rects.length - 1].docId,
				placement: 'after'
			};
		}
		#shouldGuardPrefetchTarget(target, nextParentId) {
			if (target.placement !== 'inside') {
				return false;
			}
			const collectionId = Number(target.collectionId);
			const parentId = this.#toNullableInt(nextParentId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			if (parentId === null) {
				return Boolean(this.#uiState.expandedCollections[collectionId]) && !this.#store.queries.isBranchLoaded(collectionId, null);
			}
			if (!this.#store.state.expandedDocs[parentId]) {
				return false;
			}
			return !this.#store.queries.isBranchLoaded(collectionId, parentId);
		}
		async #guardPrefetchTarget(collectionId, parentId) {
			const key = `${Number(collectionId)}:${parentId === null ? 'root' : Number(parentId)}`;
			if (this.#dragPrefetchedKeys.has(key)) {
				return;
			}
			const inFlight = this.#dragPrefetchInFlight.get(key);
			if (inFlight) {
				await inFlight;
				return;
			}
			const lastAttemptAt = this.#dragPrefetchAt.get(key);
			if (Number.isFinite(lastAttemptAt) && Date.now() - lastAttemptAt < this.#prefetchCooldownMs) {
				return;
			}
			this.#dragPrefetchAt.set(key, Date.now());
			const request = this.#store.actions.ensureChildrenLoaded(collectionId, parentId);
			this.#dragPrefetchInFlight.set(key, request);
			try {
				await request;
				this.#dragPrefetchedKeys.add(key);
			} finally {
				if (this.#dragPrefetchInFlight.get(key) === request) {
					this.#dragPrefetchInFlight.delete(key);
				}
			}
		}
		#scheduleDocAutoExpand(doc) {
			if (!doc) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			const docId = Number(doc.id);
			if (!Number.isFinite(collectionId) || collectionId <= 0 || !Number.isFinite(docId) || docId <= 0) {
				return;
			}
			if (!doc.hasChildren) {
				this.#clearAutoExpand();
				return;
			}
			if (this.#store.state.expandedDocs[docId]) {
				this.#clearAutoExpand();
				return;
			}
			this.#scheduleAutoExpand(`doc:${collectionId}:${docId}`, async () => {
				const target = this.#dragState.docTarget;
				if (!target || target.placement !== 'inside' || Number(target.collectionId) !== collectionId || Number(target.targetId) !== docId) {
					return;
				}
				if (this.#store.state.expandedDocs[docId]) {
					return;
				}
				this.#store.state.expandedDocs[docId] = true;
				this.#invalidateRectCache();
				await this.#store.actions.ensureChildrenLoaded(collectionId, docId);
			});
		}
		#scheduleCollectionAutoExpand(collectionId) {
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return;
			}
			if (this.#uiState.expandedCollections[collectionId]) {
				this.#clearAutoExpand();
				return;
			}
			this.#scheduleAutoExpand(`collection:${collectionId}`, async () => {
				const target = this.#dragState.docTarget;
				if (!target || target.placement !== 'inside' || Number(target.collectionId) !== collectionId || !(target.targetId === null || target.targetId === undefined)) {
					return;
				}
				const shouldExpandImmediately = this.#store.queries.isLoadingChildren(collectionId, null) || this.#store.queries.getChildren(collectionId, null).length > 0 || this.#store.queries.hasNextChildren(collectionId, null);
				if (shouldExpandImmediately) {
					this.#uiState.expandedCollections[collectionId] = true;
				}
				await this.#store.actions.ensureChildrenLoaded(collectionId, null);
				const hasChildren = this.#store.queries.getChildren(collectionId, null).length > 0 || this.#store.queries.hasNextChildren(collectionId, null);
				if (!hasChildren) {
					return;
				}
				this.#uiState.expandedCollections[collectionId] = true;
				this.#invalidateRectCache();
			});
		}
		#scheduleAutoExpand(key, callback) {
			if (this.#autoExpandKey === key) {
				return;
			}
			this.#clearAutoExpand();
			this.#autoExpandKey = key;
			this.#autoExpandTimer = setTimeout(() => {
				if (this.#autoExpandKey !== key) {
					return;
				}
				this.#autoExpandTimer = null;
				this.#autoExpandKey = null;
				void callback();
			}, this.#autoExpandDelayMs);
		}
		#clearAutoExpand() {
			if (this.#autoExpandTimer !== null) {
				clearTimeout(this.#autoExpandTimer);
				this.#autoExpandTimer = null;
			}
			this.#autoExpandKey = null;
		}
		#clearDragPrefetchState() {
			this.#dragPrefetchedKeys.clear();
			this.#dragPrefetchInFlight.clear();
			this.#dragPrefetchAt.clear();
		}
		#isInvalidDocMoveTarget(dragItem, target) {
			if (!target || target.targetId === null || target.targetId === undefined) {
				return false;
			}
			if (Number(dragItem.id) === Number(target.targetId)) {
				return true;
			}
			if (Number(dragItem.collectionId) !== Number(target.collectionId)) {
				return false;
			}
			let currentId = Number(target.targetId);
			let guard = 0;
			while (currentId > 0 && guard < 200) {
				guard += 1;
				if (currentId === Number(dragItem.id)) {
					return true;
				}
				const loadedDoc = this.#store.queries.findLoadedDocument(target.collectionId, currentId);
				if (!loadedDoc) {
					return false;
				}
				const nextParent = this.#toNullableInt(loadedDoc.parentId);
				if (nextParent === null) {
					return false;
				}
				currentId = Number(nextParent);
			}
			return false;
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}
	}

	const MAX_BRANCH_LOAD_ITERATIONS = 100;
	class SidebarRouteSyncService {
		#store;
		#router;
		#uiState;
		#messages;
		#emitAction;
		#getRouteDocumentContext;
		#hydrateFromInitialContext;
		#documentRouteName;
		#homeRouteName;
		#sharedRouteName;
		#archiveRouteName;
		#recycleBinRouteName;
		#workspaceRouteName;
		#searchRouteName;
		constructor({
			store,
			router,
			uiState,
			messages,
			emitAction,
			getRouteDocumentContext = () => null,
			hydrateFromInitialContext = null,
			routeNames = {}
		}) {
			this.#store = store;
			this.#router = router;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#emitAction = emitAction;
			this.#getRouteDocumentContext = getRouteDocumentContext;
			this.#hydrateFromInitialContext = hydrateFromInitialContext ?? (context => store.actions.hydrateFromInitialContext(context));
			this.#documentRouteName = routeNames.document || 'document';
			this.#homeRouteName = routeNames.home || 'home';
			this.#sharedRouteName = routeNames.shared || 'shared';
			this.#archiveRouteName = routeNames.archive || 'archive';
			this.#recycleBinRouteName = routeNames.recyclebin || 'recyclebin';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#searchRouteName = routeNames.search || 'search';
		}
		async bootstrap({
			skipInitialCollectionsLoad = false
		} = {}) {
			if (skipInitialCollectionsLoad) {
				this.#subscribeToPullEvents();
				return;
			}
			try {
				await this.#store.actions.loadCollections(false);
			} catch {
				// store already handles load errors
			}
			this.#subscribeToPullEvents();
		}
		#subscribeToPullEvents() {
			const subscribe = this.#store.actions?.subscribeToPullEvents;
			if (typeof subscribe !== 'function') {
				return;
			}
			try {
				subscribe();
			} catch {
				// Pull subscription is best-effort — never break bootstrap.
			}
		}
		destroy() {
			const unsubscribe = this.#store.actions?.unsubscribeFromPullEvents;
			if (typeof unsubscribe !== 'function') {
				return;
			}
			try {
				unsubscribe();
			} catch {
				// Best-effort teardown — never throw on destroy.
			}
		}
		getRouteDocumentId(route = this.#router?.currentRoute?.value) {
			if (!route || route.name !== this.#documentRouteName) {
				return 0;
			}
			const docId = Number(route.params?.id);
			return Number.isInteger(docId) && docId > 0 ? docId : 0;
		}
		async syncFromRouteContext(withCollectionFallback = false, options = {}) {
			const previousRouteName = String(options?.previousRouteName || '');
			const currentRouteName = String(this.#router?.currentRoute?.value?.name || '');
			if (currentRouteName === this.#sharedRouteName) {
				this.#store.actions.setSharedView(true);
				return;
			}
			if (currentRouteName === this.#archiveRouteName) {
				this.#store.actions.setArchiveView(true);
				return;
			}
			if (currentRouteName === this.#recycleBinRouteName) {
				this.#store.actions.setRecycleBinView(true);
				return;
			}
			this.#store.actions.setSharedView(false);
			this.#store.actions.setArchiveView(false);
			this.#store.actions.setRecycleBinView(false);
			if (currentRouteName === this.#searchRouteName) {
				// Search page does not belong to any collection — clear selection so
				// no sidebar item gets highlighted as active.
				this.#store.actions.clearSelection();
				return;
			}
			if (currentRouteName === this.#workspaceRouteName) {
				await this.#syncWorkspaceRoute();
				return;
			}
			const context = this.#getRouteDocumentContext();
			const status = String(context?.status || 'idle');
			const routeDocId = Number(context?.docId || this.getRouteDocumentId());
			if (status === 'ready' && main_core.Type.isPlainObject(context?.document)) {
				await this.#syncDocumentContext(context);
				return;
			}
			if (status === 'not_found' || status === 'error') {
				await this.#handleInvalidDocumentRoute();
				return;
			}
			if (status === 'loading' && Number.isInteger(routeDocId) && routeDocId > 0) {
				return;
			}
			await this.#ensureHomeCollectionSelected(withCollectionFallback, previousRouteName, currentRouteName);
			this.#store.actions.clearDocumentSelection();
		}
		async #syncWorkspaceRoute() {
			const route = this.#router?.currentRoute?.value;
			const collectionId = Number(route?.params?.id);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				this.#store.actions.clearSelection();
				return;
			}
			this.#store.actions.clearDocumentSelection();
			const currentSelectedId = Number(this.#store.state.selectedCollectionId.value);
			if (currentSelectedId === collectionId) {
				return;
			}
			this.#uiState.expandedCollections[collectionId] = true;
			await this.#store.actions.selectCollection(collectionId);
		}
		async #syncDocumentContext(context) {
			const document = context.document;
			const docId = Number(document?.id);
			if (!Number.isInteger(docId) || docId <= 0) {
				await this.#handleInvalidDocumentRoute();
				return;
			}
			if (document?.sharedAccess === true) {
				this.#store.actions.clearSelection();
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId: 0
				});
				return;
			}
			if (document?.isTrashed === true) {
				// Trashed orphan documents may have collectionId === 0 (source collection gone).
				// Skip sidebar tree manipulation; editor renders trashed view from openContext.
				this.#store.actions.clearDocumentSelection();
				const rawCollectionId = Number(document?.collectionId);
				const trashedCollectionId = Number.isInteger(rawCollectionId) && rawCollectionId > 0 ? rawCollectionId : 0;
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId: trashedCollectionId
				});
				return;
			}
			const collectionId = Number(document?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				await this.#handleInvalidDocumentRoute();
				return;
			}

			// archived/trashed target is hidden from the sidebar tree, so skip expansion/selection for it
			const shouldExpandSidebarTree = !document?.isArchived && !document?.isTrashed;
			if (shouldExpandSidebarTree) {
				this.#uiState.expandedCollections[collectionId] = true;
			}
			if (main_core.Type.isPlainObject(context.openContext) && this.#hydrateFromInitialContext(context.openContext)) {
				this.#emitAction('onOpenDocument', {
					docId,
					collectionId
				});
				return;
			}
			await this.#store.actions.selectCollection(collectionId, {
				preserveDocumentSelection: true
			});
			if (shouldExpandSidebarTree) {
				await this.#ensureDocumentLoaded(collectionId, this.#toNullableInt(document.parentId), docId, 0);
				this.#expandAncestorDocs(collectionId, this.#toNullableInt(document.parentId));
				this.#store.actions.selectDocument(docId);
			}
			this.#emitAction('onOpenDocument', {
				docId,
				collectionId
			});
		}
		async #handleInvalidDocumentRoute() {
			// Toast + redirect are owned by pages/document-page.js (single source of truth for unavailable docs).
			// This handler stays as a safety-net to clear sidebar selection and ensure the user leaves the doc route.
			this.#store.actions.clearDocumentSelection();
			if (this.#router.currentRoute.value.name === this.#documentRouteName) {
				await this.#router.replace({
					name: this.#homeRouteName
				});
			}
		}
		async #ensureDocumentLoaded(collectionId, parentId, targetDocId, depth = 0) {
			const normalizedParentId = this.#toNullableInt(parentId);
			const targetId = Number(targetDocId);
			if (depth >= MAX_BRANCH_LOAD_ITERATIONS || !Number.isInteger(targetId) || targetId <= 0) {
				return;
			}
			const hasTargetLoaded = () => this.#store.queries.getChildren(collectionId, normalizedParentId).some(item => Number(item.id) === targetId);
			if (hasTargetLoaded()) {
				return;
			}
			await this.#store.actions.ensureChildrenLoaded(collectionId, normalizedParentId);
			if (hasTargetLoaded()) {
				return;
			}
			if (!this.#store.queries.hasNextChildren(collectionId, normalizedParentId)) {
				return;
			}
			await this.#store.actions.loadDocuments(collectionId, normalizedParentId, true);
			if (hasTargetLoaded()) {
				return;
			}
			await this.#ensureDocumentLoaded(collectionId, normalizedParentId, targetId, depth + 1);
		}
		async #ensureHomeCollectionSelected(withCollectionFallback, previousRouteName = '', currentRouteName = '') {
			if (!withCollectionFallback || this.#store.state.selectedCollectionId.value || this.#store.state.collections.value.length === 0) {
				return;
			}

			// Only redirect from HOME — other routes (search, etc.) fall through this
			// branch with status='idle' but must keep their URL intact.
			if (currentRouteName !== this.#homeRouteName) {
				return;
			}
			const firstId = Number(this.#store.state.collections.value[0].id);
			if (!Number.isInteger(firstId) || firstId <= 0) {
				return;
			}
			await this.#store.actions.selectCollection(firstId);

			// Loop guard: skip redirect when we just bounced back from workspace/document
			// (via workspace-page onNotFound/onArchived/onDeleted) — keep user on empty HomePage.
			if (previousRouteName === this.#workspaceRouteName || previousRouteName === this.#documentRouteName) {
				return;
			}
			await this.#router.replace({
				name: this.#workspaceRouteName,
				params: {
					id: String(firstId)
				}
			});
		}
		#expandAncestorDocs(collectionId, parentId) {
			const visited = new Set();
			let currentId = parentId;
			while (currentId !== null && currentId > 0 && !visited.has(currentId)) {
				visited.add(currentId);
				this.#store.state.expandedDocs[currentId] = true;
				const parentDoc = this.#store.queries.findLoadedDocument(collectionId, currentId);
				currentId = this.#toNullableInt(parentDoc?.parentId);
			}
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}
	}

	class CollectionUseCases {
		#api;
		#dialog;
		#store;
		#uiState;
		#messages;
		#onFail;
		#emitAction;
		#isDragging;
		#router;
		#homeRouteName;
		#documentRouteName;
		#workspaceRouteName;
		#getRouteDocumentContext;
		#prefetchTimer = null;
		#handleExternalCollectionRenamed = null;
		constructor({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			emitAction,
			isDragging = () => false,
			router = null,
			routeNames = {},
			getRouteDocumentContext
		}) {
			this.#api = api;
			this.#dialog = dialog;
			this.#store = store;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#onFail = onFail;
			this.#emitAction = emitAction;
			this.#isDragging = isDragging;
			this.#router = router;
			this.#homeRouteName = routeNames.home || 'home';
			this.#documentRouteName = routeNames.document || 'document';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
			this.#handleExternalCollectionRenamed = event => {
				const {
					id,
					name
				} = event.getData();
				const collectionId = Number(id);
				if (!Number.isInteger(collectionId) || collectionId <= 0) {
					return;
				}
				this.#store.actions.updateCollectionLocal(collectionId, {
					name: String(name || '')
				});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.COLLECTION_RENAMED, this.#handleExternalCollectionRenamed);
		}
		isCollectionExpanded(collectionId) {
			return Boolean(this.#uiState.expandedCollections[Number(collectionId)]);
		}
		canCreateCollections() {
			return Boolean(this.#store.state.globalPermissions.canEditCollections);
		}
		canEditCollection(collection) {
			return Boolean(collection?.canEditCollection);
		}
		canManageCollectionPermissions(collection) {
			return Boolean(collection?.canManagePermissions);
		}
		async openCollection(collection) {
			await this.#store.actions.selectCollection(collection.id);
			this.#emitAction('onOpenCollection', {
				collectionId: Number(collection.id)
			});
		}
		prefetchCollectionChildren(collection) {
			clearTimeout(this.#prefetchTimer);
			if (!collection || this.#isDragging()) {
				return;
			}
			const collectionId = Number(collection.id);
			this.#prefetchTimer = setTimeout(() => {
				this.#store.actions.prefetchChildren(collectionId, null);
			}, 300);
		}
		async toggleCollectionExpanded(collection) {
			const id = Number(collection.id);
			const nextValue = !this.isCollectionExpanded(id);
			this.#uiState.expandedCollections[id] = nextValue;
			if (nextValue) {
				await this.#store.actions.ensureChildrenLoaded(id, null);
			} else {
				this.#store.actions.clearCollectionExpandedDocs(id);
			}
		}
		toggleCollectionsSection() {
			this.#uiState.collectionsSectionExpanded = !this.#uiState.collectionsSectionExpanded;
		}
		async loadMoreCollections() {
			if (this.#store.state.collectionsLoading.value || !this.#store.state.collectionsHasNextPage.value) {
				return;
			}
			await this.#store.actions.loadCollections(true);
		}
		async refreshCollections() {
			await this.#store.actions.loadCollections(false);
		}
		createCollection() {
			if (!this.canCreateCollections()) {
				return;
			}
			void note_permissions.App.openCollectionCreatePopup({
				onCreated: collection => this.#onCollectionCreated(collection)
			});
		}
		async #onCollectionCreated(collection) {
			const id = Number(collection?.id);
			if (!Number.isInteger(id) || id <= 0) {
				return;
			}
			const name = String(collection?.name || '');
			const maxPosition = this.#store.state.collections.value.reduce((max, item) => Math.max(max, Number(item?.position || 0)), 0);
			this.#store.actions.insertCollectionLocal({
				id,
				name,
				position: Number(collection?.position || maxPosition + 1),
				canEditCollection: true,
				canManagePermissions: true
			});
			main_core_events.EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new main_core_events.BaseEvent({
				data: {
					id,
					name
				}
			}));
			this.#uiState.collectionsSectionExpanded = true;
			this.#uiState.expandedCollections[id] = true;
			await this.openCollection({
				id,
				name
			});
			if (this.#router && this.#workspaceRouteName) {
				await this.#router.push({
					name: this.#workspaceRouteName,
					params: {
						id
					}
				});
			}
		}
		renameCollection(collection) {
			if (!this.canEditCollection(collection)) {
				return;
			}
			this.#uiState.renamingCollectionId = Number(collection.id);
		}
		async confirmRenameCollection(collectionId, newName) {
			this.#uiState.renamingCollectionId = null;
			if (!newName) {
				return;
			}
			const id = Number(collectionId);
			const current = this.#store.queries.findCollection(id);
			const previousName = current ? String(current.name ?? '') : null;
			if (previousName === newName) {
				return;
			}
			this.#store.actions.updateCollectionLocal(id, {
				name: newName
			});
			try {
				await this.#api.updateCollection(id, newName);
				main_core_events.EventEmitter.emit(NoteEvent.COLLECTION_RENAMED, new main_core_events.BaseEvent({
					data: {
						id,
						name: newName
					}
				}));
			} catch (error) {
				if (previousName !== null) {
					this.#store.actions.updateCollectionLocal(id, {
						name: previousName
					});
				}
				this.#onFail(error);
			}
		}
		cancelRenameCollection() {
			this.#uiState.renamingCollectionId = null;
		}
		#isRouteDocumentInCollection(collectionId) {
			const normalizedCollectionId = Number(collectionId);
			if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0) {
				return false;
			}
			const route = this.#router?.currentRoute?.value;
			if (!route || route.name !== this.#documentRouteName) {
				return false;
			}
			const routeDoc = this.#getRouteDocumentContext()?.document ?? null;
			if (routeDoc && Number(routeDoc.collectionId) === normalizedCollectionId) {
				return true;
			}
			if (routeDoc) {
				return false;
			}
			const routeDocId = Number(route.params?.id);
			if (!Number.isInteger(routeDocId) || routeDocId <= 0) {
				return false;
			}
			return Boolean(this.#store.queries.findLoadedDocument(normalizedCollectionId, routeDocId));
		}
		async deleteCollection(collection) {
			if (!this.canManageCollectionPermissions(collection)) {
				return;
			}
			const confirmed = await this.#dialog.confirm(this.#messages.confirmDeleteCollection, this.#messages.confirmDeleteCollectionTitle, this.#messages.delete);
			if (!confirmed) {
				return;
			}
			try {
				const collectionId = Number(collection.id);
				await this.#api.deleteCollection(collectionId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
				this.#store.actions.removeCollectionLocal(collectionId);
				delete this.#uiState.expandedCollections[collectionId];
				if (collectionId === this.#store.state.selectedCollectionId.value) {
					this.#store.actions.clearSelection();
				}
				if (shouldLeaveDocumentPage) {
					await this.#router?.replace({
						name: this.#homeRouteName
					});
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async archiveCollection(collection) {
			if (!this.canManageCollectionPermissions(collection)) {
				return;
			}
			const confirmed = await this.#dialog.confirm(this.#messages.confirmDeleteCollection, this.#messages.confirmDeleteCollectionTitle, this.#messages.delete);
			if (!confirmed) {
				return;
			}
			try {
				const collectionId = Number(collection.id);
				await this.#api.archiveCollection(collectionId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInCollection(collectionId);
				this.#store.actions.removeCollectionLocal(collectionId);
				delete this.#uiState.expandedCollections[collectionId];
				if (collectionId === this.#store.state.selectedCollectionId.value) {
					this.#store.actions.clearSelection();
				}
				if (shouldLeaveDocumentPage) {
					await this.#router?.replace({
						name: this.#homeRouteName
					});
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
	}

	const ENTITY_ID = 'note-collection';
	function openPickCollectionPopup(options) {
		const api = options?.api;
		const store = options?.store;
		const canCreateCollection = Boolean(options?.canCreateCollection);
		const onFail = main_core.Type.isFunction(options?.onFail) ? options.onFail : () => {};
		return new Promise(resolve => {
			let isResolved = false;
			let primaryButton = null;
			let selector = null;
			const finish = value => {
				if (isResolved) {
					return;
				}
				isResolved = true;
				resolve(value);
			};
			const textNode = main_core.Tag.render`
			<div class="note-sidebar-pick-collection-popup-text"></div>
		`;
			textNode.textContent = canCreateCollection ? main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT_WITH_CREATE') || '' : main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TEXT') || '';
			const selectorContainer = main_core.Tag.render`
			<div class="note-sidebar-pick-collection-popup-selector"></div>
		`;
			const content = main_core.Tag.render`
			<div class="note-sidebar-pick-collection-popup-content">
				${textNode}
				${selectorContainer}
			</div>
		`;
			const updatePrimaryState = () => {
				if (!primaryButton || !selector) {
					return;
				}
				const tags = main_core.Type.isFunction(selector.getTags) ? selector.getTags() : [];
				primaryButton.setDisabled(!Array.isArray(tags) || tags.length !== 1);
			};
			const getSelectedTag = () => {
				if (!selector || !main_core.Type.isFunction(selector.getTags)) {
					return null;
				}
				const tags = selector.getTags();
				if (!Array.isArray(tags) || tags.length !== 1) {
					return null;
				}
				const tag = tags[0];
				const id = Number(tag?.id ?? tag?.entityId ?? 0);
				if (!Number.isInteger(id) || id <= 0) {
					return null;
				}
				return {
					collectionId: id,
					collectionTitle: String(tag?.title || tag?.searchable || '')
				};
			};
			primaryButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PRIMARY') || '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.FILLED,
				useAirDesign: true,
				disabled: true,
				onclick: () => {
					const selected = getSelectedTag();
					if (!selected) {
						return;
					}
					finish(selected);
					dialog.hide();
				}
			});
			const cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_CANCEL') || '',
				size: ui_buttons.ButtonSize.LARGE,
				style: ui_buttons.AirButtonStyle.PLAIN,
				useAirDesign: true,
				onclick: () => {
					finish(null);
					dialog.hide();
				}
			});

			// Inline create via SearchTabFooter — backend auto-assigns LEVEL_MODERATE to creator.
			const dialogEvents = {};
			if (canCreateCollection) {
				dialogEvents['Search:onItemCreateAsync'] = event => {
					const name = String(event?.getData()?.searchQuery?.getQuery?.() || '').trim();
					if (name === '') {
						return Promise.resolve();
					}
					return api.createCollection(name).then(created => {
						const id = Number(created?.id);
						if (!Number.isInteger(id) || id <= 0) {
							return;
						}
						const collectionName = String(created?.name || name);
						if (store && store.actions && main_core.Type.isFunction(store.actions.insertCollectionLocal)) {
							const maxPosition = (store.state?.collections?.value || []).reduce((max, item) => Math.max(max, Number(item?.position || 0)), 0);
							store.actions.insertCollectionLocal({
								id,
								name: collectionName,
								position: Number(created?.position || maxPosition + 1),
								canEditCollection: true,
								canManagePermissions: true
							});
						}

						// Defer hide so SearchTabFooter's post-emit chain (clearSearch + selectFirstTab) can run first.
						setTimeout(() => {
							finish({
								collectionId: id,
								collectionTitle: collectionName
							});
							dialog.hide();
						}, 0);
					}).catch(error => {
						onFail(error);
					});
				};
			}
			const dialog = new ui_system_dialog.Dialog({
				title: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_TITLE') || '',
				content,
				hasOverlay: true,
				overlay: true,
				width: 480,
				centerButtons: [primaryButton, cancelButton],
				events: {
					onAfterShow: () => {
						const targetWidth = selectorContainer.offsetWidth || 432;
						const isMobile = document.documentElement.classList.contains('note-mobile');
						selector = new ui_entitySelector.TagSelector({
							multiple: false,
							tagLimit: 1,
							placeholder: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_PLACEHOLDER') || '',
							dialogOptions: {
								width: targetWidth,
								height: isMobile ? 280 : 340,
								showAvatars: false,
								popupOptions: {
									className: note_ui_themeContext.NoteThemeContext.getDesignSystemContext()
								},
								entities: [{
									id: ENTITY_ID,
									dynamicLoad: true,
									dynamicSearch: true,
									options: {}
								}],
								searchOptions: canCreateCollection ? {
									allowCreateItem: true,
									footerOptions: {
										label: main_core.Loc.getMessage('NOTE_SIDEBAR_PICK_COLLECTION_FOOTER_CREATE') || ''
									}
								} : undefined,
								events: dialogEvents
							},
							events: {
								onAfterTagAdd: () => updatePrimaryState(),
								onAfterTagRemove: () => updatePrimaryState(),
								onAfterTagsClear: () => updatePrimaryState()
							}
						});
						note_ui_themeContext.NoteThemeContext.applyToTagSelector(selector);
						selector.renderTo(selectorContainer);
						const entityDialog = typeof selector.getDialog === 'function' ? selector.getDialog() : null;
						if (entityDialog) {
							note_ui_themeContext.NoteThemeContext.themeEntitySelector(entityDialog);
						}
						updatePrimaryState();
					},
					onHide: () => {
						const entityDialog = selector && main_core.Type.isFunction(selector.getDialog) ? selector.getDialog() : null;
						if (entityDialog && main_core.Type.isFunction(entityDialog.hide)) {
							entityDialog.hide();
						}
						finish(null);
					},
					onDestroy: () => {
						if (selector && main_core.Type.isFunction(selector.destroy)) {
							selector.destroy();
						}
					}
				}
			});
			note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
			dialog.show();
		});
	}

	class DocumentUseCases {
		#api;
		#dialog;
		#store;
		#uiState;
		#messages;
		#onFail;
		#router;
		#documentRouteName;
		#homeRouteName;
		#workspaceRouteName;
		#isDragging;
		#getRouteDocumentContext;
		#reloadRouteDocumentContext;
		#openingDocumentId = 0;
		#handleExternalDocRenamed;
		#handleBulkDocumentsRestored;
		#prefetchTimer = null;
		constructor({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			router,
			routeNames = {},
			isDragging = () => false,
			getRouteDocumentContext,
			reloadRouteDocumentContext = null
		}) {
			this.#api = api;
			this.#dialog = dialog;
			this.#store = store;
			this.#uiState = uiState;
			this.#messages = messages;
			this.#onFail = onFail;
			this.#router = router;
			this.#documentRouteName = routeNames.document || 'document';
			this.#homeRouteName = routeNames.home || 'home';
			this.#workspaceRouteName = routeNames.workspace || 'workspace';
			this.#isDragging = isDragging;
			this.#getRouteDocumentContext = getRouteDocumentContext || (() => null);
			this.#reloadRouteDocumentContext = reloadRouteDocumentContext;
			this.#handleExternalDocRenamed = event => {
				const {
					id,
					title,
					collectionId
				} = event.getData();
				this.#store.actions.updateDocumentLocal(Number(id), {
					title
				}, {
					collectionId: Number(collectionId)
				});
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENT_RENAMED, this.#handleExternalDocRenamed);
			this.#handleBulkDocumentsRestored = async event => {
				const data = event.getData() || {};
				const restoredCollections = Array.isArray(data.restoredCollections) ? data.restoredCollections : [];
				restoredCollections.forEach(collection => this.#ensureCollectionInStore(collection));

				// Restored docs may belong to collections whose branches are still hydrated locally
				// (e.g. user archived documents one by one — collection was kept in store with empty branch).
				// Invalidate every loaded branch so the next access refetches fresh data.
				this.#store.actions.invalidateAllChildren();

				// Currently-expanded collections won't trigger hover/click; reload them eagerly so the
				// user sees restored documents without having to interact.
				const expandedCollectionIds = Object.keys(this.#uiState.expandedCollections).filter(id => this.#uiState.expandedCollections[id]).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0);
				await Promise.all(expandedCollectionIds.map(id => this.#store.actions.ensureChildrenLoaded(id, null)));
			};
			main_core_events.EventEmitter.subscribe(NoteEvent.DOCUMENTS_BULK_RESTORED, this.#handleBulkDocumentsRestored);
		}
		canEditDocument(doc) {
			const collectionId = Number(doc?.collectionId);
			return this.#canEditCollection(collectionId);
		}
		canManageDocument(doc) {
			const collectionId = Number(doc?.collectionId);
			if (this.#canEditCollection(collectionId)) {
				return true;
			}

			// archived/shared docs: collection isn't in sidebar store, trust the per-doc flag from backend
			return Boolean(doc?.canEditCollection);
		}
		canManageDocumentPermissions(doc) {
			const collectionId = Number(doc?.collectionId);
			return this.#canManagePermissionsInCollection(collectionId);
		}
		async openDocument(doc) {
			const documentId = Number(doc.id);
			if (!Number.isInteger(documentId) || documentId <= 0) {
				return;
			}
			if (this.#openingDocumentId === documentId) {
				return;
			}
			if (this.#getRouteDocumentId() === documentId) {
				return;
			}
			this.#openingDocumentId = documentId;
			try {
				await this.#router.push({
					name: this.#documentRouteName,
					params: {
						id: documentId
					}
				});
			} finally {
				if (this.#openingDocumentId === documentId) {
					this.#openingDocumentId = 0;
				}
			}
		}
		prefetchDocumentChildren(doc) {
			clearTimeout(this.#prefetchTimer);
			if (!doc || this.#isDragging()) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			const parentId = Number(doc.id);
			const hasLoadedChildren = this.#store.queries.getChildren(collectionId, parentId).length > 0;
			if (!doc.hasChildren && !hasLoadedChildren) {
				return;
			}
			this.#prefetchTimer = setTimeout(() => {
				this.#store.actions.prefetchChildren(collectionId, parentId);
			}, 300);
		}
		async toggleDoc(doc) {
			await this.#store.actions.toggleDocExpanded(doc);
		}
		async loadMoreChildren(doc) {
			await this.#store.actions.loadDocuments(Number(doc.collectionId), doc.id === null || doc.id === undefined ? null : Number(doc.id), true);
		}
		async createDocument() {
			const collectionId = this.#store.state.selectedCollectionId.value;
			if (!collectionId) {
				return;
			}
			if (!this.#canEditCollection(collectionId)) {
				return;
			}
			await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
		}
		async createDocumentFromSidebar() {
			try {
				const {
					items,
					hasMore
				} = await this.#api.listManageableCollections(2);
				if (Array.isArray(items) && items.length === 1 && !hasMore) {
					await this.#createDocumentInCollection(Number(items[0].id));
					return;
				}
				const canCreateCollection = Boolean(this.#store.state.globalPermissions?.canEditCollections);
				const picked = await openPickCollectionPopup({
					api: this.#api,
					store: this.#store,
					canCreateCollection,
					onFail: this.#onFail
				});
				if (!picked) {
					return;
				}
				await this.#createDocumentInCollection(Number(picked.collectionId));
			} catch (error) {
				this.#onFail(error);
			}
		}
		async #createDocumentInCollection(collectionId) {
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			await this.#store.actions.selectCollection(collectionId);
			this.#uiState.expandedCollections[collectionId] = true;
			await this.confirmCreateDocument(collectionId, null, this.#messages.promptDocumentName);
		}
		async createDocumentForCollection(collection) {
			if (!collection) {
				return;
			}
			if (!this.#canEditCollection(Number(collection.id))) {
				return;
			}
			await this.#store.actions.selectCollection(collection.id);
			this.#uiState.expandedCollections[Number(collection.id)] = true;
			await this.confirmCreateDocument(Number(collection.id), null, this.#messages.promptDocumentName);
		}
		async createChildDocument(doc) {
			if (!doc) {
				return;
			}
			const collectionId = Number(doc.collectionId);
			if (!this.#canEditCollection(collectionId)) {
				return;
			}
			const parentId = Number(doc.id);
			this.#store.state.expandedDocs[parentId] = true;
			await this.confirmCreateDocument(collectionId, parentId, this.#messages.promptDocumentName);
		}
		async confirmCreateDocument(collectionId, parentId, title) {
			if (!title) {
				return;
			}
			try {
				const doc = await this.#api.createDocument(collectionId, title, parentId);
				const nextPosition = this.#store.queries.getChildren(collectionId, parentId).length + 1;
				const insertedDoc = this.#store.actions.insertDocumentLocal({
					...doc,
					collectionId,
					parentId,
					title,
					position: Number(doc?.position || nextPosition),
					hasChildren: Boolean(doc?.hasChildren ?? false)
				}, {
					forceCreateBranch: true
				});
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
					data: {
						id: Number(insertedDoc?.id || doc?.id),
						title,
						collectionId
					}
				}));
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (Number(insertedDoc?.id) > 0) {
					await this.openDocument(insertedDoc);
					const routeContext = this.#getRouteDocumentContext();
					if (routeContext) {
						routeContext.autoEdit = true;
					}
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		renameDocument(doc) {
			if (!this.canEditDocument(doc)) {
				return;
			}
			this.#uiState.renamingDocId = Number(doc.id);
		}
		async confirmRenameDocument(docId, newTitle, collectionId) {
			this.#uiState.renamingDocId = null;
			if (!newTitle) {
				return;
			}
			try {
				await this.#api.updateDocument(Number(docId), newTitle);
				note_analytics.NoteAnalytics.documentUpdated(true);
				this.#store.actions.updateDocumentLocal(Number(docId), {
					title: newTitle
				}, {
					collectionId: Number(collectionId)
				});
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
					data: {
						id: Number(docId),
						title: newTitle,
						collectionId: Number(collectionId)
					}
				}));
			} catch (error) {
				note_analytics.NoteAnalytics.documentUpdated(false);
				this.#onFail(error);
			}
		}
		cancelRenameDocument() {
			this.#uiState.renamingDocId = null;
		}
		async restoreDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}
			const documentId = Number(doc.id);
			if (!Number.isInteger(documentId) || documentId <= 0) {
				return;
			}
			try {
				const restored = await this.#api.restoreDocument(documentId);
				if (restored && Number(restored.id) > 0) {
					this.#ensureCollectionInStore(restored.restoredCollection);
					const restoredDoc = {
						...restored,
						id: Number(restored.id),
						collectionId: Number(restored.collectionId),
						parentId: restored.parentId === null || restored.parentId === undefined || restored.parentId === '' ? null : Number(restored.parentId),
						title: String(restored.title ?? doc.title ?? ''),
						position: Number(restored.position ?? doc.position ?? 0),
						hasChildren: Boolean(restored.hasChildren ?? doc.hasChildren ?? false),
						isArchived: false
					};
					const inserted = this.#store.actions.insertDocumentLocal(restoredDoc, {
						forceCreateBranch: true
					});

					// Expand the collection and ancestor chain so the restored doc is visible.
					this.#uiState.expandedCollections[restoredDoc.collectionId] = true;
					let ancestorId = restoredDoc.parentId;
					const visited = new Set();
					while (Number.isInteger(ancestorId) && ancestorId > 0 && !visited.has(ancestorId)) {
						visited.add(ancestorId);
						this.#store.state.expandedDocs[ancestorId] = true;
						const ancestorDoc = this.#store.queries.findLoadedDocument(restoredDoc.collectionId, ancestorId);
						ancestorId = ancestorDoc?.parentId === null || ancestorDoc?.parentId === undefined ? null : Number(ancestorDoc.parentId);
					}
					if (restoredDoc.parentId !== null) {
						main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
							data: {
								parentId: restoredDoc.parentId,
								collectionId: restoredDoc.collectionId
							}
						}));
					}
					if (inserted) {
						main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_RENAMED, new main_core_events.BaseEvent({
							data: {
								id: restoredDoc.id,
								title: restoredDoc.title,
								collectionId: restoredDoc.collectionId
							}
						}));
					}
				}
				if (this.#getRouteDocumentId() === documentId && this.#reloadRouteDocumentContext) {
					await this.#reloadRouteDocumentContext();
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async archiveDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}
			try {
				await this.#api.archiveDocument(Number(doc.id));
				const collectionId = Number(doc.collectionId);
				const parentId = this.#toNullableInt(doc.parentId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
				this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (shouldLeaveDocumentPage) {
					await this.#redirectAfterDocumentRemoval(collectionId);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async deleteDocument(doc) {
			if (!this.canManageDocument(doc)) {
				return;
			}
			const confirmed = await this.#dialog.confirm(this.#messages.confirmDeleteDocument, this.#messages.confirmDeleteDocumentTitle, this.#messages.delete);
			if (!confirmed) {
				return;
			}
			try {
				await this.#api.deleteDocument(Number(doc.id));
				const collectionId = Number(doc.collectionId);
				const parentId = this.#toNullableInt(doc.parentId);
				const shouldLeaveDocumentPage = this.#isRouteDocumentInSubtree(Number(doc.id), collectionId);
				this.#store.actions.removeDocumentLocal(collectionId, parentId, Number(doc.id));
				if (parentId !== null) {
					main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
						data: {
							parentId,
							collectionId
						}
					}));
				}
				if (shouldLeaveDocumentPage) {
					await this.#redirectAfterDocumentRemoval(collectionId);
				}
			} catch (error) {
				this.#onFail(error);
			}
		}
		async #redirectAfterDocumentRemoval(collectionId) {
			this.#store.actions.clearDocumentSelection();
			const targetRoute = this.#findCollection(collectionId) ? {
				name: this.#workspaceRouteName,
				params: {
					id: collectionId
				}
			} : {
				name: this.#homeRouteName
			};
			await this.#router.replace(targetRoute);
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return Number(value);
		}
		#getRouteDocumentId() {
			const route = this.#router?.currentRoute?.value;
			if (!route || route.name !== this.#documentRouteName) {
				return 0;
			}
			const docId = Number(route.params?.id);
			return Number.isInteger(docId) && docId > 0 ? docId : 0;
		}
		#isRouteDocumentInSubtree(rootDocId, collectionId) {
			const normalizedRootId = Number(rootDocId);
			const normalizedCollectionId = Number(collectionId);
			const routeDocId = this.#getRouteDocumentId();
			if (!Number.isInteger(normalizedRootId) || normalizedRootId <= 0 || !Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0 || routeDocId <= 0) {
				return false;
			}
			if (routeDocId === normalizedRootId) {
				return true;
			}
			const routeContext = this.#getRouteDocumentContext();
			const routeDoc = routeContext?.document ?? null;
			if (!routeDoc || Number(routeDoc.collectionId) !== normalizedCollectionId) {
				return false;
			}
			const visited = new Set([routeDocId]);
			let parentId = this.#toNullableInt(routeDoc.parentId);
			while (parentId !== null && Number.isInteger(parentId) && parentId > 0 && !visited.has(parentId)) {
				if (parentId === normalizedRootId) {
					return true;
				}
				visited.add(parentId);
				const parent = this.#store.queries.findLoadedDocument(normalizedCollectionId, parentId);
				if (!parent) {
					return false;
				}
				parentId = this.#toNullableInt(parent.parentId);
			}
			return false;
		}
		#ensureCollectionInStore(restoredCollection) {
			if (!main_core.Type.isPlainObject(restoredCollection)) {
				return;
			}
			const collectionId = Number(restoredCollection.id);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			if (this.#findCollection(collectionId)) {
				return;
			}
			this.#store.actions.insertCollectionLocal({
				...restoredCollection,
				id: collectionId
			});

			// Restored collections must appear collapsed so the user doesn't see
			// an expanded node with no loaded children until hover triggers prefetch.
			delete this.#uiState.expandedCollections[collectionId];
		}
		#findCollection(collectionId) {
			const normalizedCollectionId = Number(collectionId);
			if (!Number.isInteger(normalizedCollectionId) || normalizedCollectionId <= 0) {
				return null;
			}
			return this.#store.state.collections.value.find(item => Number(item.id) === normalizedCollectionId) ?? null;
		}
		#canEditCollection(collectionId) {
			return Boolean(this.#findCollection(collectionId)?.canEditCollection);
		}
		#canManagePermissionsInCollection(collectionId) {
			return Boolean(this.#findCollection(collectionId)?.canManagePermissions);
		}
	}

	const PAGE_SIZE$1 = 50;

	// Debounce window for capability and list refresh — collapses bursts of ACL
	// updates on the same collection (or list-invalidations during a multi-step
	// admin operation) and adds random jitter to desynchronise reconnecting clients.
	const REFRESH_DEBOUNCE_MIN_MS = 80;
	const REFRESH_DEBOUNCE_JITTER_MS = 220;
	class SidebarCollectionActions {
		#api;
		#state;
		#setError;
		#setGlobalPermissions;
		#removeBranch;
		#refreshCollectionWatches;
		#capabilityRefreshTimers;
		#listRefetchTimer;
		constructor({
			api,
			state,
			setError,
			setGlobalPermissions,
			removeBranch,
			refreshCollectionWatches
		}) {
			this.#api = api;
			this.#state = state;
			this.#setError = setError;
			this.#setGlobalPermissions = setGlobalPermissions;
			this.#removeBranch = removeBranch;
			this.#refreshCollectionWatches = typeof refreshCollectionWatches === 'function' ? refreshCollectionWatches : () => {};
			this.#capabilityRefreshTimers = new Map();
			this.#listRefetchTimer = null;
		}
		insertCollectionLocal(collection) {
			if (!collection) {
				return null;
			}
			const normalizedId = Number(collection.id);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return null;
			}
			const nextItem = {
				...collection,
				id: normalizedId,
				name: String(collection.name || ''),
				position: Number.isFinite(Number(collection.position)) ? Number(collection.position) : 0
			};
			this.#state.collections.value = this.#mergeCollections(this.#state.collections.value, [nextItem]);
			return nextItem;
		}
		#sortCollections(items) {
			return [...items].sort((a, b) => {
				const leftPos = Number(a?.position || 0);
				const rightPos = Number(b?.position || 0);
				if (leftPos !== rightPos) {
					return rightPos - leftPos;
				}
				return Number(b?.id || 0) - Number(a?.id || 0);
			});
		}
		#mergeCollections(base, incoming) {
			const byId = new Map();
			for (const item of base) {
				const id = Number(item?.id);
				if (Number.isInteger(id) && id > 0) {
					byId.set(id, item);
				}
			}
			for (const item of incoming) {
				const id = Number(item?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				byId.set(id, byId.has(id) ? {
					...byId.get(id),
					...item
				} : item);
			}
			return this.#sortCollections([...byId.values()]);
		}
		updateCollectionLocal(collectionId, patch = {}) {
			const normalizedId = Number(collectionId);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const index = this.#state.collections.value.findIndex(item => Number(item.id) === normalizedId);
			if (index < 0) {
				return false;
			}
			const next = [...this.#state.collections.value];
			next[index] = {
				...next[index],
				...patch
			};
			this.#state.collections.value = next;
			return true;
		}
		async applyCollectionCreate() {
			await this.loadCollections(false);
			this.#refreshCollectionWatches();
		}
		applyCollectionDelete(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}
			return this.removeCollectionLocal(collectionId);
		}
		applyCollectionArchive(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}

			// Archived collection lives on under /note/archive/ — lazy-refetch when user opens that view.
			return this.removeCollectionLocal(collectionId);
		}
		applyCollectionRestore(params) {
			if (!params) {
				return null;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return null;
			}
			const inserted = this.insertCollectionLocal({
				id: collectionId,
				name: typeof params.name === 'string' ? params.name : '',
				position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
				policyLevel: Number.isFinite(Number(params.policyLevel)) ? Number(params.policyLevel) : 0
			});
			if (inserted) {
				this.#refreshCollectionWatches();
			}
			return inserted;
		}
		applyCollectionCapabilities(params) {
			const collectionId = Number(params?.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return;
			}
			this.#scheduleCapabilityRefresh(collectionId);
		}
		applyCollectionListInvalidated() {
			this.#scheduleListRefetch();
		}
		patchCollectionCapabilities(collectionId, capabilities) {
			const normalizedId = Number(collectionId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof capabilities.policyLevel === 'string') {
				patch.policyLevel = capabilities.policyLevel;
			}
			if (typeof capabilities.canEditCollection === 'boolean') {
				patch.canEditCollection = capabilities.canEditCollection;
			}
			if (typeof capabilities.canManagePermissions === 'boolean') {
				patch.canManagePermissions = capabilities.canManagePermissions;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			return this.updateCollectionLocal(normalizedId, patch);
		}
		#scheduleCapabilityRefresh(collectionId) {
			const existing = this.#capabilityRefreshTimers.get(collectionId);
			if (existing) {
				clearTimeout(existing);
			}
			const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
			const timer = setTimeout(() => {
				this.#capabilityRefreshTimers.delete(collectionId);
				this.#fetchAndApplyCapabilities(collectionId);
			}, delay);
			this.#capabilityRefreshTimers.set(collectionId, timer);
		}
		async #fetchAndApplyCapabilities(collectionId) {
			try {
				const access = await this.#api.getMyCollectionAccess(collectionId);
				if (!access) {
					return;
				}
				if (access.level === 'none') {
					// Lost-access path: collection drops out of the sidebar; /shared/ takes over via list-invalidation.
					this.removeCollectionLocal(collectionId);
					return;
				}
				this.patchCollectionCapabilities(collectionId, {
					policyLevel: access.policyLevel,
					canEditCollection: access.canEditCollection,
					canManagePermissions: access.canManagePermissions
				});
			} catch (error) {
				console.warn('[NOTE PULL SIDEBAR] capability refresh failed', collectionId, error);
			}
		}
		#scheduleListRefetch() {
			if (this.#listRefetchTimer) {
				clearTimeout(this.#listRefetchTimer);
			}
			const delay = REFRESH_DEBOUNCE_MIN_MS + Math.floor(Math.random() * REFRESH_DEBOUNCE_JITTER_MS);
			this.#listRefetchTimer = setTimeout(() => {
				this.#listRefetchTimer = null;
				this.loadCollections(false).then(() => this.#refreshCollectionWatches()).catch(error => console.warn('[NOTE PULL SIDEBAR] list refetch failed', error));
			}, delay);
		}
		applyCollectionUpdate(params) {
			if (!params) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof params.name === 'string') {
				patch.name = params.name;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			return this.updateCollectionLocal(collectionId, patch);
		}
		removeCollectionLocal(collectionId) {
			const normalizedId = Number(collectionId);
			if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
				return false;
			}
			const nextCollections = this.#state.collections.value.filter(item => Number(item.id) !== normalizedId);
			if (nextCollections.length === this.#state.collections.value.length) {
				return false;
			}
			this.#state.collections.value = nextCollections;
			this.#state.collectionsCursor.value = null;
			const keyPrefix = `${normalizedId}:`;
			const docIdsToCollapse = [];
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix)) {
					continue;
				}
				if (Array.isArray(docs)) {
					for (const doc of docs) {
						const docId = Number(doc?.id);
						if (Number.isInteger(docId) && docId > 0) {
							docIdsToCollapse.push(docId);
						}
					}
				}
				const [, parentToken] = key.split(':');
				const parentId = parentToken === 'root' ? null : Number(parentToken);
				this.#removeBranch(normalizedId, parentId);
			}
			for (const docId of docIdsToCollapse) {
				delete this.#state.expandedDocs[docId];
			}
			if (this.#state.selectedCollectionId.value === normalizedId) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
			}
			return true;
		}
		moveCollectionLocal(dragId, targetId, placement) {
			const list = this.#state.collections.value.filter(item => Number(item.id) !== dragId);
			const dragItem = this.#state.collections.value.find(item => Number(item.id) === dragId);
			if (!dragItem) {
				return;
			}
			const targetIndex = list.findIndex(item => Number(item.id) === targetId);
			if (targetIndex < 0) {
				return;
			}

			// Synthesise a position above/below the target so the optimistic order matches the
			// upcoming server response. The server returns authoritative values via applyCollectionPositions.
			const beforeItem = placement === 'before' ? list[targetIndex - 1] ?? null : list[targetIndex];
			const afterItem = placement === 'before' ? list[targetIndex] : list[targetIndex + 1] ?? null;
			const beforePos = beforeItem ? Number(beforeItem.position) : null;
			const afterPos = afterItem ? Number(afterItem.position) : null;
			let optimisticPosition;
			if (beforePos !== null && afterPos !== null) {
				optimisticPosition = Math.floor((beforePos + afterPos) / 2);
			} else if (beforePos !== null) {
				optimisticPosition = beforePos - 1;
			} else if (afterPos !== null) {
				optimisticPosition = afterPos + 1;
			} else {
				optimisticPosition = Number(dragItem.position) || 0;
			}
			const insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
			list.splice(insertIndex, 0, {
				...dragItem,
				position: optimisticPosition
			});
			this.#state.collections.value = this.#sortCollections(list);
			this.#state.collectionsCursor.value = null;
		}
		applyCollectionPositions(entries) {
			if (!Array.isArray(entries) || entries.length === 0) {
				return;
			}
			const patchById = new Map();
			for (const entry of entries) {
				const id = Number(entry?.id);
				const position = Number(entry?.position);
				if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(position)) {
					continue;
				}
				patchById.set(id, position);
			}
			if (patchById.size === 0) {
				return;
			}
			const next = this.#state.collections.value.map(item => {
				const id = Number(item?.id);
				return patchById.has(id) ? {
					...item,
					position: patchById.get(id)
				} : item;
			});
			this.#state.collections.value = this.#sortCollections(next);
		}
		async applyCollectionMove(params) {
			if (!params) {
				return;
			}
			if (params.requestRefetch === true) {
				await this.loadCollections(false);
				return;
			}
			const entries = Array.isArray(params.affectedPositions) ? params.affectedPositions : [];
			if (entries.length > 0) {
				this.applyCollectionPositions(entries);
			}
		}
		async loadCollections(append = false) {
			this.#state.collectionsLoading.value = true;
			try {
				const effectiveAppend = append && this.#state.collectionsCursor.value !== null;
				const cursor = effectiveAppend ? this.#state.collectionsCursor.value : null;
				const response = await this.#api.listCollections({
					limit: PAGE_SIZE$1,
					cursor
				});
				if (this.#setGlobalPermissions && response?.permissions) {
					this.#setGlobalPermissions(response.permissions);
				}
				this.#state.collections.value = this.#mergeCollections(this.#state.collections.value, response.items);
				this.#state.collectionsCursor.value = response.nextCursor;
				this.#state.collectionsHasNextPage.value = response.hasNextPage;
			} catch (error) {
				this.#setError(error?.message || 'Collections loading failed');
			} finally {
				this.#state.collectionsLoading.value = false;
			}
		}
	}

	function sortDocuments(docs) {
		return [...docs].sort((a, b) => {
			const leftPos = Number(a?.position || 0);
			const rightPos = Number(b?.position || 0);
			if (leftPos !== rightPos) {
				return rightPos - leftPos;
			}
			return Number(b?.id || 0) - Number(a?.id || 0);
		});
	}
	function normalizeDocumentForStore(doc, normalizeParentId, fallback = {}) {
		const id = Number(doc?.id ?? fallback.id ?? 0);
		const collectionId = Number(doc?.collectionId ?? fallback.collectionId ?? 0);
		const parentIdValue = doc?.parentId ?? fallback.parentId;
		const parentId = normalizeParentId(parentIdValue);
		if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(collectionId) || collectionId <= 0) {
			return null;
		}
		return {
			...doc,
			id,
			collectionId,
			parentId,
			title: String(doc?.title ?? fallback.title ?? ''),
			position: Number.isFinite(Number(doc?.position)) ? Number(doc.position) : Number.isFinite(Number(fallback.position)) ? Number(fallback.position) : 0,
			hasChildren: Boolean(doc?.hasChildren ?? fallback.hasChildren ?? false),
			isArchived: Boolean(doc?.isArchived ?? fallback.isArchived ?? false)
		};
	}

	class SidebarDocumentActions {
		#api;
		#state;
		#queries;
		#keyOf;
		#normalizeParentId;
		#setBranchDocs;
		#removeBranch;
		#setError;
		constructor({
			api,
			state,
			queries,
			keyOf,
			normalizeParentId,
			setBranchDocs,
			removeBranch,
			setError
		}) {
			this.#api = api;
			this.#state = state;
			this.#queries = queries;
			this.#keyOf = keyOf;
			this.#normalizeParentId = normalizeParentId;
			this.#setBranchDocs = setBranchDocs;
			this.#removeBranch = removeBranch;
			this.#setError = setError;
		}
		invalidateChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}

		// Hard reset for a branch: drop cached docs in addition to cursor/hydration flags.
		// Used by realtime handlers when the server signals a branch needs full refetch.
		invalidateBranch(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			this.#state.docsByParent[key] = [];
			this.#state.docsHydratedByParent[key] = false;
			this.#state.docsStaleByParent[key] = true;
			this.#state.docsOffsetByParent[key] = 0;
			this.#state.docsCursorByParent[key] = null;
			this.#state.docsHasNextPageByParent[key] = true;
		}
		invalidateAllChildren() {
			for (const key of Object.keys(this.#state.docsHydratedByParent)) {
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}

		// Cascade reset for an entire collection — used when a cascade push requests refetch
		// and the loaded sub-branches under the root must also be invalidated.
		invalidateCollectionTree(collectionId) {
			const cid = Number(collectionId);
			if (!Number.isFinite(cid) || cid <= 0) {
				return;
			}
			const prefix = `${cid}:`;
			for (const key of Object.keys(this.#state.docsByParent)) {
				if (!key.startsWith(prefix)) {
					continue;
				}
				this.#state.docsByParent[key] = [];
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}

		// Drop child-branch caches keyed by every id in `parentIds` — used after cascade
		// archive/delete so loaded sub-branches under each removed doc are also flushed.
		invalidateBranchesByParentIds(collectionId, parentIds) {
			const cid = Number(collectionId);
			if (!Number.isFinite(cid) || cid <= 0 || !Array.isArray(parentIds)) {
				return;
			}
			for (const rawId of parentIds) {
				const pid = Number(rawId);
				if (!Number.isFinite(pid) || pid <= 0) {
					continue;
				}
				const key = this.#keyOf(cid, pid);
				if (this.#state.docsByParent[key] === undefined) {
					continue;
				}
				this.#state.docsByParent[key] = [];
				this.#state.docsHydratedByParent[key] = false;
				this.#state.docsStaleByParent[key] = true;
				this.#state.docsOffsetByParent[key] = 0;
				this.#state.docsCursorByParent[key] = null;
				this.#state.docsHasNextPageByParent[key] = true;
			}
		}
		#setParentHasChildren(collectionId, parentId, value) {
			const normalizedParentId = this.#normalizeParentId(parentId);
			if (normalizedParentId === null) {
				return;
			}
			this.#updateDocumentInCollection(collectionId, doc => {
				if (Number(doc.id) !== Number(normalizedParentId) || Boolean(doc.hasChildren) === Boolean(value)) {
					return doc;
				}
				return {
					...doc,
					hasChildren: Boolean(value)
				};
			});
		}
		setParentHasChildrenLocal(collectionId, parentId, value) {
			this.#setParentHasChildren(collectionId, parentId, value);
		}
		insertDocumentLocal(doc, options = {}) {
			const normalized = normalizeDocumentForStore(doc, this.#normalizeParentId);
			if (!normalized) {
				return null;
			}
			const parentId = this.#normalizeParentId(normalized.parentId);
			if (!this.#queries.isBranchLoaded(normalized.collectionId, parentId) && !options.forceCreateBranch) {
				if (parentId !== null) {
					this.#setParentHasChildren(normalized.collectionId, parentId, true);
				}
				return normalized;
			}
			const key = this.#keyOf(normalized.collectionId, parentId);
			const docs = [...(this.#state.docsByParent[key] || [])];
			const existingIndex = docs.findIndex(item => Number(item.id) === Number(normalized.id));
			if (existingIndex >= 0) {
				docs[existingIndex] = {
					...docs[existingIndex],
					...normalized
				};
			} else {
				docs.push(normalized);
			}
			this.#setBranchDocs(normalized.collectionId, parentId, sortDocuments(docs));
			if (parentId !== null) {
				this.#setParentHasChildren(normalized.collectionId, parentId, true);
			}
			return normalized;
		}

		// Applies a documentUpdate push payload to local docs. Idempotent:
		// patches by id across every loaded branch via updateDocumentLocal.
		applyDocumentUpdate(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			const patch = {};
			if (typeof params.title === 'string' && params.title !== '') {
				patch.title = params.title;
			}
			if (Object.keys(patch).length === 0) {
				return false;
			}
			const collectionId = Number(params.collectionId);
			const options = Number.isFinite(collectionId) && collectionId > 0 ? {
				collectionId
			} : {};
			return this.updateDocumentLocal(documentId, patch, options);
		}

		// forceCreateBranch is intentionally absent: materialising a collapsed
		// branch from a single sibling would mask the rest until full reload.
		applyDocumentCreate(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			const parentId = this.#normalizeParentId(params.parentId);
			const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
			const title = typeof params.title === 'string' ? params.title : '';
			const hasChildren = params.hasChildren === true;
			const inserted = this.insertDocumentLocal({
				id: documentId,
				collectionId,
				parentId,
				position,
				title,
				hasChildren
			});
			return inserted !== null;
		}

		// Applies a documentRestore push payload. Idempotent:
		// upserts the doc into the loaded branch by id. For Phase 1 wired to
		// DOCUMENT_RESTORE only — Phase 2 will add DOCUMENT_CREATE.
		applyDocumentActive(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0) {
				return false;
			}
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			const parentId = this.#normalizeParentId(params.parentId);
			const position = Number.isFinite(Number(params.position)) ? Number(params.position) : 0;
			const title = typeof params.title === 'string' ? params.title : '';
			const hasChildren = params.hasChildren === true;
			const inserted = this.insertDocumentLocal({
				id: documentId,
				collectionId,
				parentId,
				position,
				title,
				hasChildren
			}, {
				forceCreateBranch: true
			});
			return inserted !== null;
		}

		// Applies a documentArchive / documentDelete push payload. Both events
		// share the same "remove these ids from sidebar" shape — only the editor
		// reacts differently (archived vs recycle-bin freeze).
		async applyDocumentRemoval(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const collectionId = Number(params.collectionId);
			if (!Number.isFinite(collectionId) || collectionId <= 0) {
				return false;
			}
			if (params.requestRefetch === true) {
				// Tree-wide invalidate: the cascade may have pruned sub-branches that were already
				// hydrated under collapsed parents — a root-only reset would leave stale child caches.
				this.invalidateCollectionTree(collectionId);
				await this.loadDocuments(collectionId, null, false);
				return true;
			}
			const documentIds = Array.isArray(params.documentIds) ? params.documentIds : null;
			if (!documentIds || documentIds.length === 0) {
				return false;
			}
			let removed = false;
			for (const rawId of documentIds) {
				const documentId = Number(rawId);
				if (!Number.isFinite(documentId) || documentId <= 0) {
					continue;
				}
				const located = this.#queries.findLoadedDocumentAnywhere(documentId);
				const parentId = located ? this.#normalizeParentId(located.parentId) : null;
				if (this.removeDocumentLocal(collectionId, parentId, documentId)) {
					removed = true;
				}
			}

			// Each removed doc may itself parent a hydrated branch — drop those caches so a later
			// expand doesn't render documents already swept by the cascade.
			this.invalidateBranchesByParentIds(collectionId, documentIds);
			return removed;
		}

		// Applies a list of {id, position} entries across loaded branches and
		// resorts those branches. Symmetric with applyCollectionPositions.
		applyDocumentPositions(entries) {
			if (!Array.isArray(entries) || entries.length === 0) {
				return false;
			}
			const patchById = new Map();
			for (const entry of entries) {
				const id = Number(entry?.id);
				const position = Number(entry?.position);
				if (!Number.isInteger(id) || id <= 0 || !Number.isFinite(position)) {
					continue;
				}
				patchById.set(id, position);
			}
			if (patchById.size === 0) {
				return false;
			}
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!Array.isArray(docs)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(doc => {
					const id = Number(doc?.id);
					if (!patchById.has(id)) {
						return doc;
					}
					branchChanged = true;
					return {
						...doc,
						position: patchById.get(id)
					};
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = sortDocuments(nextDocs);
				changed = true;
			}
			return changed;
		}

		// Applies a documentMove push payload. Handles two shapes:
		// - requestRefetch=true: fall back to invalidate+reload of both branches.
		// - Standard: optimistic move + applyDocumentPositions for siblings.
		async applyDocumentMove(params) {
			if (!params || typeof params !== 'object') {
				return false;
			}
			const documentId = Number(params.documentId);
			const toCollectionId = Number(params.collectionId);
			if (!Number.isFinite(documentId) || documentId <= 0 || !Number.isFinite(toCollectionId) || toCollectionId <= 0) {
				return false;
			}
			const fromCollectionId = Number.isFinite(Number(params.fromCollectionId)) ? Number(params.fromCollectionId) : toCollectionId;
			const toParentId = this.#normalizeParentId(params.parentId);
			const fromParentId = this.#normalizeParentId(params.fromParentId);
			if (params.requestRefetch === true) {
				this.invalidateBranch(fromCollectionId, fromParentId);
				if (fromCollectionId !== toCollectionId || fromParentId !== toParentId) {
					this.invalidateBranch(toCollectionId, toParentId);
				}
				const reloads = [this.loadDocuments(fromCollectionId, fromParentId, false)];
				if (fromCollectionId !== toCollectionId || fromParentId !== toParentId) {
					reloads.push(this.loadDocuments(toCollectionId, toParentId, false));
				}
				await Promise.all(reloads);
				return true;
			}
			const fallbackDoc = {
				id: documentId,
				collectionId: toCollectionId,
				parentId: toParentId,
				position: Number.isFinite(Number(params.position)) ? Number(params.position) : 0,
				title: typeof params.title === 'string' ? params.title : '',
				hasChildren: Boolean(params.hasChildren)
			};
			const moved = this.moveDocumentLocal({
				docId: documentId,
				fromCollectionId,
				fromParentId,
				toCollectionId,
				toParentId,
				fallbackDoc
			});
			if (Array.isArray(params.affectedPositions) && params.affectedPositions.length > 0) {
				this.applyDocumentPositions(params.affectedPositions);
			}

			// Server tells us authoritatively whether fromParent still has children —
			// covers the case where receiver never loaded that branch, so local
			// `handleParentBecameEmpty` can't decide.
			if (fromParentId !== null && typeof params.fromParentHasChildren === 'boolean') {
				this.#setParentHasChildren(fromCollectionId, fromParentId, params.fromParentHasChildren);
			}
			return moved !== null;
		}
		updateDocumentLocal(docId, patch = {}, options = {}) {
			const normalizedDocId = Number(docId);
			if (!Number.isFinite(normalizedDocId) || normalizedDocId <= 0) {
				return false;
			}
			const normalizedCollectionId = Number(options.collectionId || 0);
			const keyPrefix = normalizedCollectionId > 0 ? `${normalizedCollectionId}:` : '';
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!Array.isArray(docs) || keyPrefix && !key.startsWith(keyPrefix)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(currentDoc => {
					if (Number(currentDoc.id) !== normalizedDocId) {
						return currentDoc;
					}
					branchChanged = true;
					return {
						...currentDoc,
						...patch
					};
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				changed = true;
			}
			return changed;
		}
		removeDocumentLocal(collectionId, parentId, docId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedParentId = this.#normalizeParentId(parentId);
			const normalizedDocId = Number(docId);
			if (!Number.isFinite(normalizedCollectionId) || normalizedCollectionId <= 0 || !Number.isFinite(normalizedDocId) || normalizedDocId <= 0) {
				return false;
			}
			const descendants = this.#collectLoadedDescendantIds(normalizedCollectionId, normalizedDocId);
			const idsToDelete = new Set([normalizedDocId, ...descendants]);
			const keyPrefix = `${normalizedCollectionId}:`;
			let removed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				const nextDocs = docs.filter(item => !idsToDelete.has(Number(item.id)));
				if (nextDocs.length === docs.length) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				this.#state.docsOffsetByParent[key] = nextDocs.length;
				removed = true;
			}
			for (const id of idsToDelete) {
				delete this.#state.expandedDocs[id];
				this.#removeBranch(normalizedCollectionId, id);
			}
			if (removed) {
				this.#handleParentBecameEmpty(normalizedCollectionId, normalizedParentId);
			}
			return removed;
		}
		moveDocumentLocal({
			docId,
			fromCollectionId,
			fromParentId,
			toCollectionId,
			toParentId,
			placement = 'inside',
			targetId = null,
			fallbackDoc = null
		}) {
			const normalizedDocId = Number(docId);
			const fromCollection = Number(fromCollectionId);
			const toCollection = Number(toCollectionId);
			const fromParent = this.#normalizeParentId(fromParentId);
			const toParent = this.#normalizeParentId(toParentId);
			const collectionChanged = fromCollection !== toCollection;
			const descendantsToInvalidate = collectionChanged ? this.#collectLoadedDescendantIds(fromCollection, normalizedDocId) : null;
			let movedDoc = this.#extractDocumentFromBranch(fromCollection, fromParent, normalizedDocId);
			if (!movedDoc) {
				movedDoc = this.#queries.findLoadedDocument(fromCollection, normalizedDocId);
			}
			movedDoc = normalizeDocumentForStore(movedDoc || fallbackDoc, this.#normalizeParentId, {
				id: normalizedDocId,
				collectionId: toCollection,
				parentId: toParent
			});
			if (!movedDoc) {
				return null;
			}
			const nextDoc = {
				...movedDoc,
				collectionId: toCollection,
				parentId: toParent
			};
			this.#insertDocumentIntoBranch(nextDoc, toCollection, toParent, placement, targetId);
			this.#handleParentBecameEmpty(fromCollection, fromParent);
			if (toParent !== null) {
				this.#setParentHasChildren(toCollection, toParent, true);
			}
			if (descendantsToInvalidate) {
				for (const descId of descendantsToInvalidate) {
					this.#removeBranch(fromCollection, descId);
					delete this.#state.expandedDocs[descId];
				}
			}
			return nextDoc;
		}
		async loadDocuments(collectionId, parentId = null, append = false) {
			const key = this.#keyOf(collectionId, parentId);
			if (!append && this.#state.docsRequestByParent[key]) {
				await this.#state.docsRequestByParent[key];
				return;
			}
			const request = this.#loadDocumentsRequest(collectionId, parentId, append, key);
			if (append) {
				await request;
				return;
			}
			this.#state.docsRequestByParent[key] = request;
			try {
				await request;
			} finally {
				if (this.#state.docsRequestByParent[key] === request) {
					delete this.#state.docsRequestByParent[key];
				}
			}
		}
		async prefetchChildren(collectionId, parentId = null) {
			if (this.#queries.isChildrenHydrated(collectionId, parentId)) {
				return;
			}
			await this.loadDocuments(collectionId, parentId, false);
		}
		async ensureChildrenLoaded(collectionId, parentId = null) {
			await this.prefetchChildren(collectionId, parentId);
		}
		#updateDocumentInCollection(collectionId, updater) {
			const keyPrefix = `${Number(collectionId)}:`;
			let changed = false;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				let branchChanged = false;
				const nextDocs = docs.map(doc => {
					const nextDoc = updater(doc);
					if (nextDoc !== doc) {
						branchChanged = true;
					}
					return nextDoc;
				});
				if (!branchChanged) {
					continue;
				}
				this.#state.docsByParent[key] = nextDocs;
				changed = true;
			}
			return changed;
		}
		#collectLoadedDescendantIds(collectionId, docId) {
			const descendants = new Set();
			const stack = [Number(docId)];
			while (stack.length > 0) {
				const currentId = stack.pop();
				if (!Number.isFinite(currentId)) {
					continue;
				}
				const children = this.#queries.getChildren(collectionId, currentId);
				for (const child of children) {
					const childId = Number(child.id);
					if (!Number.isFinite(childId) || descendants.has(childId)) {
						continue;
					}
					descendants.add(childId);
					stack.push(childId);
				}
			}
			return descendants;
		}
		#extractDocumentFromBranch(collectionId, parentId, docId) {
			const key = this.#keyOf(collectionId, parentId);
			const docs = this.#state.docsByParent[key];
			if (!Array.isArray(docs)) {
				return null;
			}
			const index = docs.findIndex(item => Number(item.id) === Number(docId));
			if (index < 0) {
				return null;
			}
			const removed = docs[index];
			const nextDocs = [...docs.slice(0, index), ...docs.slice(index + 1)];
			this.#state.docsByParent[key] = nextDocs;
			this.#state.docsOffsetByParent[key] = nextDocs.length;
			return removed;
		}
		#handleParentBecameEmpty(collectionId, parentId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedParentId = this.#normalizeParentId(parentId);
			if (!Number.isFinite(normalizedCollectionId) || normalizedCollectionId <= 0 || normalizedParentId === null) {
				return false;
			}
			if (!this.#queries.isBranchLoaded(normalizedCollectionId, normalizedParentId)) {
				return false;
			}
			const siblings = this.#queries.getChildren(normalizedCollectionId, normalizedParentId);
			if (siblings.length > 0) {
				return false;
			}
			this.#setParentHasChildren(normalizedCollectionId, normalizedParentId, false);
			delete this.#state.expandedDocs[normalizedParentId];
			return true;
		}
		#insertDocumentIntoBranch(doc, collectionId, parentId, placement = 'inside', targetId = null) {
			if (!this.#queries.isBranchLoaded(collectionId, parentId)) {
				return false;
			}
			const key = this.#keyOf(collectionId, parentId);
			const docs = [...(this.#state.docsByParent[key] || [])].filter(item => Number(item.id) !== Number(doc.id));
			let insertIndex = docs.length;
			if ((placement === 'before' || placement === 'after') && Number.isFinite(Number(targetId))) {
				const targetIndex = docs.findIndex(item => Number(item.id) === Number(targetId));
				if (targetIndex >= 0) {
					insertIndex = placement === 'before' ? targetIndex : targetIndex + 1;
				}
			}
			docs.splice(insertIndex, 0, doc);
			this.#setBranchDocs(collectionId, parentId, docs);
			return true;
		}
		#mergeDocs(base, incoming) {
			const byId = new Map();
			for (const item of base) {
				const id = Number(item?.id);
				if (Number.isInteger(id) && id > 0) {
					byId.set(id, item);
				}
			}
			for (const item of incoming) {
				const id = Number(item?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				byId.set(id, byId.has(id) ? {
					...byId.get(id),
					...item
				} : item);
			}
			return sortDocuments([...byId.values()]);
		}
		async #loadDocumentsRequest(collectionId, parentId, append, key) {
			this.#state.docsLoadingByParent[key] = true;
			try {
				const hasCursor = (this.#state.docsCursorByParent[key] || null) !== null;
				const effectiveAppend = append && hasCursor;
				const cursor = effectiveAppend ? this.#state.docsCursorByParent[key] : null;
				const response = await this.#api.listDocumentsByParent(collectionId, parentId, {
					limit: PAGE_SIZE$1,
					cursor
				});
				this.#state.docsByParent[key] = effectiveAppend ? this.#mergeDocs(this.#state.docsByParent[key] || [], response.items) : sortDocuments(response.items);
				this.#state.docsOffsetByParent[key] = this.#state.docsByParent[key].length;
				this.#state.docsCursorByParent[key] = response.nextCursor || null;
				this.#state.docsHasNextPageByParent[key] = response.hasNextPage;
				this.#state.docsHydratedByParent[key] = true;
				this.#state.docsStaleByParent[key] = false;
			} catch (error) {
				this.#setError(error?.message || 'Documents loading failed');
			} finally {
				this.#state.docsLoadingByParent[key] = false;
			}
		}
	}

	class SidebarErrorActions {
		// Silent: sidebar errors are surfaced by page wrappers (workspace/document) as a single toast + redirect.
		setError() {}
	}

	class SidebarExpansionActions {
		#state;
		#getChildren;
		#ensureChildrenLoaded;
		constructor({
			state,
			getChildren,
			ensureChildrenLoaded
		}) {
			this.#state = state;
			this.#getChildren = getChildren;
			this.#ensureChildrenLoaded = ensureChildrenLoaded;
		}
		#clearExpandedBranch(collectionId, parentDocId) {
			const children = this.#getChildren(collectionId, parentDocId);
			for (const child of children) {
				const childId = Number(child.id);
				delete this.#state.expandedDocs[childId];
				this.#clearExpandedBranch(collectionId, childId);
			}
		}
		async toggleDocExpanded(doc) {
			const docId = Number(doc.id);
			const isNextExpanded = !this.#state.expandedDocs[docId];
			this.#state.expandedDocs[docId] = isNextExpanded;
			if (isNextExpanded) {
				await this.#ensureChildrenLoaded(Number(doc.collectionId), docId);
			} else {
				this.#clearExpandedBranch(Number(doc.collectionId), docId);
			}
		}
		clearCollectionExpandedDocs(collectionId) {
			const rootDocs = this.#getChildren(collectionId, null);
			for (const doc of rootDocs) {
				const docId = Number(doc.id);
				delete this.#state.expandedDocs[docId];
				this.#clearExpandedBranch(collectionId, docId);
			}
		}
	}

	class SidebarHydrationActions {
		#state;
		#keyOf;
		#normalizeParentId;
		constructor({
			state,
			keyOf,
			normalizeParentId
		}) {
			this.#state = state;
			this.#keyOf = keyOf;
			this.#normalizeParentId = normalizeParentId;
		}
		hydrateFromInitialContext(context) {
			if (!main_core.Type.isPlainObject(context)) {
				return false;
			}
			const normalizedDocument = this.#normalizeDocument(context.document);
			if (!normalizedDocument) {
				return false;
			}
			const selectedCollectionId = this.#toPositiveInt(context.selectedCollectionId ?? context.collectionId ?? normalizedDocument.collectionId);
			const selectedDocId = this.#toPositiveInt(context.selectedDocId ?? normalizedDocument.id);
			if (selectedCollectionId === null || selectedDocId === null) {
				return false;
			}
			this.#hydrateBranches(context.branches, selectedCollectionId);
			this.#hydrateExpandedDocs(context.expandedDocs);
			this.#state.selectedCollectionId.value = selectedCollectionId;
			this.#state.selectedDocId.value = selectedDocId;
			return true;
		}
		hydrateInitialCollections(payload) {
			if (!main_core.Type.isPlainObject(payload)) {
				return false;
			}
			this.setGlobalPermissions(payload.permissions);
			const rawItems = Array.isArray(payload.items) ? payload.items : [];
			const collections = rawItems.map(item => this.#normalizeCollection(item)).filter(item => item !== null);
			this.#state.collections.value = collections;
			this.#state.collectionsCursor.value = payload.nextCursor ?? null;
			this.#state.collectionsHasNextPage.value = payload.nextCursor !== null && payload.nextCursor !== undefined;
			this.#state.collectionsLoading.value = false;
			return true;
		}
		setGlobalPermissions(rawPermissions) {
			const normalized = this.#normalizeGlobalPermissions(rawPermissions);
			this.#state.globalPermissions.canEditCollections = normalized.canEditCollections;
			this.#state.globalPermissions.canEditGlobalPermissions = normalized.canEditGlobalPermissions;
			this.#state.globalPermissions.canImport = normalized.canImport;
			this.#state.globalPermissions.canImportWiki = normalized.canImportWiki;
			this.#state.globalPermissions.hasManageableCollection = normalized.hasManageableCollection;
		}
		#hydrateBranches(rawBranches, fallbackCollectionId) {
			if (!main_core.Type.isPlainObject(rawBranches)) {
				return;
			}
			for (const [rawKey, rawDocuments] of Object.entries(rawBranches)) {
				const branchMeta = this.#parseBranchKey(rawKey, fallbackCollectionId);
				if (!branchMeta) {
					continue;
				}
				const documents = Array.isArray(rawDocuments) ? rawDocuments.map(item => this.#normalizeDocument(item)).filter(item => item !== null) : [];
				const key = this.#keyOf(branchMeta.collectionId, branchMeta.parentId);
				this.#state.docsByParent[key] = documents;
				this.#state.docsOffsetByParent[key] = documents.length;
				this.#state.docsLoadingByParent[key] = false;
				this.#state.docsHasNextPageByParent[key] = false;
				this.#state.docsHydratedByParent[key] = true;
				this.#state.docsStaleByParent[key] = false;
			}
		}
		#hydrateExpandedDocs(rawExpandedDocs) {
			if (!main_core.Type.isPlainObject(rawExpandedDocs)) {
				return;
			}
			for (const [rawDocId, rawIsExpanded] of Object.entries(rawExpandedDocs)) {
				const docId = this.#toPositiveInt(rawDocId);
				if (docId === null || !rawIsExpanded) {
					continue;
				}
				this.#state.expandedDocs[docId] = true;
			}
		}
		#parseBranchKey(rawKey, fallbackCollectionId) {
			if (!main_core.Type.isStringFilled(rawKey)) {
				return null;
			}
			const [rawCollectionId, rawParentToken] = rawKey.split(':');
			const collectionId = this.#toPositiveInt(rawCollectionId) ?? fallbackCollectionId;
			if (collectionId === null) {
				return null;
			}
			if (rawParentToken === 'root') {
				return {
					collectionId,
					parentId: null
				};
			}
			const parentId = this.#normalizeParentId(rawParentToken);
			if (parentId === null) {
				return null;
			}
			return {
				collectionId,
				parentId
			};
		}
		#normalizeCollection(rawCollection) {
			if (!main_core.Type.isPlainObject(rawCollection)) {
				return null;
			}
			const id = this.#toPositiveInt(rawCollection.id);
			if (id === null) {
				return null;
			}
			const name = String(rawCollection.name ?? '').trim();
			return {
				...rawCollection,
				id,
				name: name === '' ? `#${id}` : name,
				position: Number.isFinite(Number(rawCollection.position)) ? Number(rawCollection.position) : 0,
				canEditCollection: Boolean(rawCollection.canEditCollection),
				canManagePermissions: Boolean(rawCollection.canManagePermissions)
			};
		}
		#normalizeDocument(rawDocument) {
			if (!main_core.Type.isPlainObject(rawDocument)) {
				return null;
			}
			const id = this.#toPositiveInt(rawDocument.id);
			const collectionId = this.#toPositiveInt(rawDocument.collectionId);
			if (id === null || collectionId === null) {
				return null;
			}
			return {
				...rawDocument,
				id,
				collectionId,
				parentId: this.#normalizeParentId(rawDocument.parentId),
				title: String(rawDocument.title ?? ''),
				collectionTitle: String(rawDocument.collectionTitle ?? ''),
				position: Number.isFinite(Number(rawDocument.position)) ? Number(rawDocument.position) : 0,
				hasChildren: Boolean(rawDocument.hasChildren),
				isArchived: Boolean(rawDocument.isArchived)
			};
		}
		#toPositiveInt(value) {
			const parsed = Number(value);
			if (!Number.isInteger(parsed) || parsed <= 0) {
				return null;
			}
			return parsed;
		}
		#normalizeGlobalPermissions(rawPermissions) {
			if (!main_core.Type.isPlainObject(rawPermissions)) {
				return {
					canEditCollections: false,
					canEditGlobalPermissions: false,
					canImport: false,
					canImportWiki: false,
					hasManageableCollection: false
				};
			}
			return {
				canEditCollections: Boolean(rawPermissions.canEditCollections),
				canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
				canImport: Boolean(rawPermissions.canImport),
				canImportWiki: Boolean(rawPermissions.canImportWiki),
				hasManageableCollection: Boolean(rawPermissions.hasManageableCollection)
			};
		}
	}

	const PullCommand = Object.freeze({
		DOCUMENT_CREATE: 'documentCreate',
		DOCUMENT_UPDATE: 'documentUpdate',
		DOCUMENT_MOVE: 'documentMove',
		DOCUMENT_ARCHIVE: 'documentArchive',
		DOCUMENT_RESTORE: 'documentRestore',
		DOCUMENT_DELETE: 'documentDelete',
		DOCUMENT_HARD_DELETE: 'documentHardDelete',
		COLLECTION_CREATE: 'collectionCreate',
		COLLECTION_UPDATE: 'collectionUpdate',
		COLLECTION_MOVE: 'collectionMove',
		COLLECTION_ARCHIVE: 'collectionArchive',
		COLLECTION_RESTORE: 'collectionRestore',
		COLLECTION_DELETE: 'collectionDelete',
		COLLECTION_CAPABILITIES: 'collectionCapabilities',
		COLLECTION_LIST_INVALIDATED: 'collectionListInvalidated'
	});
	class SidebarPullActions {
		#state;
		#handlers;
		#subscriptions;
		#subscribed;
		constructor({
			state,
			handlers
		}) {
			this.#state = state;
			this.#handlers = handlers || {};
			this.#subscriptions = [];
			this.#subscribed = false;
		}
		subscribeToPullEvents() {
			if (this.#subscribed) {
				this.#refreshCollectionWatches();
				return;
			}
			if (!main_core.Type.isFunction(BX?.PULL?.subscribe)) {
				return;
			}
			const knownCommands = new Set(Object.values(PullCommand));
			const handler = data => {
				// Drop foreign/out-of-spec pushes before any bus traffic or warn noise —
				// only commands declared in PullCommand are routed.
				if (!data || !knownCommands.has(data.command)) {
					return;
				}

				// Cross-route bus: re-emit on EventEmitter so non-sidebar pages
				// (e.g. /shared/) can react without subscribing to BX.PULL directly.
				main_core_events.EventEmitter.emit(NoteEvent.PULL_EVENT, new main_core_events.BaseEvent({
					data: {
						command: data.command,
						params: data.params || {}
					}
				}));
				const dispatch = this.#handlers[data.command];
				if (typeof dispatch !== 'function') {
					console.warn('[NOTE PULL SIDEBAR] no handler for', data.command);
					return;
				}
				dispatch(data.params || {});
			};
			const unsubscribeServer = BX.PULL.subscribe({
				type: pull_client.PullClient.SubscriptionType.Server,
				moduleId: 'note',
				callback: handler
			});
			if (main_core.Type.isFunction(unsubscribeServer)) {
				this.#subscriptions.push(unsubscribeServer);
			}
			BX.PULL.extendWatch('NOTE_GLOBAL');
			this.#refreshCollectionWatches();
			this.#subscribed = true;
		}
		unsubscribeFromPullEvents() {
			for (const unsub of this.#subscriptions) {
				if (main_core.Type.isFunction(unsub)) {
					unsub();
				}
			}
			this.#subscriptions = [];
			this.#subscribed = false;
		}
		refreshCollectionWatches() {
			this.#refreshCollectionWatches();
		}
		#refreshCollectionWatches() {
			if (!main_core.Type.isFunction(BX?.PULL?.extendWatch)) {
				return;
			}
			const collections = this.#state.collections.value || [];
			for (const collection of collections) {
				const id = Number(collection?.id);
				if (!Number.isInteger(id) || id <= 0) {
					continue;
				}
				BX.PULL.extendWatch(`NOTE_COLLECTION_${id}`);
				BX.PULL.extendWatch(`NOTE_COLLECTION_${id}_ACL`);
			}
		}
	}

	class SidebarSelectionActions {
		#state;
		#ensureChildrenLoaded;
		constructor({
			state,
			ensureChildrenLoaded
		}) {
			this.#state = state;
			this.#ensureChildrenLoaded = ensureChildrenLoaded;
		}
		async selectCollection(collectionId, options = {}) {
			const preserveDocumentSelection = Boolean(options?.preserveDocumentSelection);
			this.#state.selectedCollectionId.value = Number(collectionId);
			this.#state.selectedSharedView.value = false;
			this.#state.selectedArchiveView.value = false;
			this.#state.selectedRecycleBinView.value = false;
			if (!preserveDocumentSelection) {
				this.#state.selectedDocId.value = null;
			}
			await this.#ensureChildrenLoaded(this.#state.selectedCollectionId.value, null);
		}
		selectDocument(docId) {
			if (docId === null || docId === undefined || docId === '') {
				this.#state.selectedDocId.value = null;
				return;
			}
			this.#state.selectedDocId.value = Number(docId);
			this.#state.selectedSharedView.value = false;
			this.#state.selectedArchiveView.value = false;
			this.#state.selectedRecycleBinView.value = false;
		}
		clearSelection() {
			this.#state.selectedCollectionId.value = null;
			this.#state.selectedDocId.value = null;
		}
		clearDocumentSelection() {
			this.#state.selectedDocId.value = null;
		}
		setSharedView(active) {
			const next = Boolean(active);
			this.#state.selectedSharedView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedArchiveView.value = false;
				this.#state.selectedRecycleBinView.value = false;
			}
		}
		setArchiveView(active) {
			const next = Boolean(active);
			this.#state.selectedArchiveView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedSharedView.value = false;
				this.#state.selectedRecycleBinView.value = false;
			}
		}
		setRecycleBinView(active) {
			const next = Boolean(active);
			this.#state.selectedRecycleBinView.value = next;
			if (next) {
				this.#state.selectedCollectionId.value = null;
				this.#state.selectedDocId.value = null;
				this.#state.selectedSharedView.value = false;
				this.#state.selectedArchiveView.value = false;
			}
		}
	}

	class SidebarStoreQueries {
		#state;
		#keyOf;
		constructor(state, keyOf) {
			this.#state = state;
			this.#keyOf = keyOf;
			this.currentRootDocs = ui_vue3.computed(() => {
				if (!this.#state.selectedCollectionId.value) {
					return [];
				}
				return this.getChildren(this.#state.selectedCollectionId.value, null);
			});
		}
		getChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return this.#state.docsByParent[key] || [];
		}
		findLoadedDocument(collectionId, docId) {
			const normalizedCollectionId = Number(collectionId);
			const normalizedDocId = Number(docId);
			const keyPrefix = `${normalizedCollectionId}:`;
			for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
				if (!key.startsWith(keyPrefix) || !Array.isArray(docs)) {
					continue;
				}
				const found = docs.find(doc => Number(doc.id) === normalizedDocId);
				if (found) {
					return found;
				}
			}
			return null;
		}
		findLoadedDocumentAnywhere(docId) {
			const normalizedDocId = Number(docId);
			if (!Number.isInteger(normalizedDocId) || normalizedDocId <= 0) {
				return null;
			}
			for (const docs of Object.values(this.#state.docsByParent)) {
				if (!Array.isArray(docs)) {
					continue;
				}
				const found = docs.find(doc => Number(doc.id) === normalizedDocId);
				if (found) {
					return found;
				}
			}
			return null;
		}
		isDocumentLoadedAnywhere(docId) {
			return this.findLoadedDocumentAnywhere(docId) !== null;
		}

		// Returns ancestors from the closest-to-root to the direct parent (the document itself excluded).
		// Walks docsByParent: keys are `${collectionId}:${parentId}`. Stops if the chain breaks.
		getAncestorsForDocument(docId) {
			const startId = Number(docId);
			if (!Number.isInteger(startId) || startId <= 0) {
				return [];
			}
			const ancestors = [];
			const visited = new Set();
			let currentId = startId;
			while (currentId > 0 && !visited.has(currentId)) {
				visited.add(currentId);
				let foundDoc = null;
				let parentId = 0;
				for (const [key, docs] of Object.entries(this.#state.docsByParent)) {
					if (!Array.isArray(docs)) {
						continue;
					}
					const found = docs.find(doc => Number(doc.id) === currentId);
					if (!found) {
						continue;
					}
					foundDoc = found;
					const colonIndex = key.indexOf(':');
					const parentPart = colonIndex >= 0 ? key.slice(colonIndex + 1) : '';
					parentId = parentPart === 'root' ? 0 : Number(parentPart) || 0;
					break;
				}
				if (!foundDoc) {
					break;
				}
				if (currentId !== startId) {
					ancestors.unshift({
						id: Number(foundDoc.id),
						title: String(foundDoc.title || '')
					});
				}
				currentId = parentId;
			}
			return ancestors;
		}
		findCollection(collectionId) {
			const normalizedId = Number(collectionId);
			if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
				return null;
			}
			const collections = this.#state.collections.value;
			if (!Array.isArray(collections)) {
				return null;
			}
			return collections.find(collection => Number(collection.id) === normalizedId) || null;
		}
		isLoadingChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsLoadingByParent[key]);
		}
		hasNextChildren(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHasNextPageByParent[key]);
		}
		isChildrenHydrated(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHydratedByParent[key]) && !this.#state.docsStaleByParent[key];
		}
		isBranchLoaded(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			return Boolean(this.#state.docsHydratedByParent[key]) || Array.isArray(this.#state.docsByParent[key]);
		}
	}

	class SidebarBranchUtils {
		#state;
		#keyOf;
		constructor(state, keyOf) {
			this.#state = state;
			this.#keyOf = keyOf;
		}
		setBranchDocs(collectionId, parentId, list, {
			keepHasNext = true
		} = {}) {
			const key = this.#keyOf(collectionId, parentId);
			const normalizedList = Array.isArray(list) ? list : [];
			this.#state.docsByParent[key] = normalizedList;
			this.#state.docsOffsetByParent[key] = normalizedList.length;
			this.#state.docsHydratedByParent[key] = true;
			this.#state.docsStaleByParent[key] = false;
			if (!keepHasNext) {
				this.#state.docsHasNextPageByParent[key] = false;
			}
		}
		removeBranch(collectionId, parentId = null) {
			const key = this.#keyOf(collectionId, parentId);
			delete this.#state.docsByParent[key];
			delete this.#state.docsLoadingByParent[key];
			delete this.#state.docsHasNextPageByParent[key];
			delete this.#state.docsOffsetByParent[key];
			delete this.#state.docsCursorByParent[key];
			delete this.#state.docsHydratedByParent[key];
			delete this.#state.docsStaleByParent[key];
			delete this.#state.docsRequestByParent[key];
		}
	}

	function normalizeParentId(parentId) {
		if (parentId === null || parentId === undefined || parentId === '') {
			return null;
		}
		const normalized = Number(parentId);
		return Number.isFinite(normalized) ? normalized : null;
	}
	function keyOf(collectionId, parentId = null) {
		const normalizedCollectionId = Number(collectionId);
		const normalizedParentId = normalizeParentId(parentId);
		return `${normalizedCollectionId}:${normalizedParentId === null ? 'root' : normalizedParentId}`;
	}

	class SidebarStoreState {
		constructor() {
			this.collections = ui_vue3.ref([]);
			this.collectionsLoading = ui_vue3.ref(false);
			this.collectionsCursor = ui_vue3.ref(null);
			this.collectionsHasNextPage = ui_vue3.ref(true);
			this.globalPermissions = ui_vue3.reactive({
				canEditCollections: false,
				canEditGlobalPermissions: false,
				canImport: false,
				canImportWiki: false,
				hasManageableCollection: false
			});
			this.selectedCollectionId = ui_vue3.ref(null);
			this.selectedDocId = ui_vue3.ref(null);
			this.selectedSharedView = ui_vue3.ref(false);
			this.selectedArchiveView = ui_vue3.ref(false);
			this.selectedRecycleBinView = ui_vue3.ref(false);
			this.expandedDocs = ui_vue3.reactive({});
			this.docsByParent = ui_vue3.reactive({});
			this.docsLoadingByParent = ui_vue3.reactive({});
			this.docsHasNextPageByParent = ui_vue3.reactive({});
			this.docsOffsetByParent = ui_vue3.reactive({});
			this.docsCursorByParent = ui_vue3.reactive({});
			this.docsHydratedByParent = ui_vue3.reactive({});
			this.docsStaleByParent = ui_vue3.reactive({});
			this.docsRequestByParent = {};
		}
	}

	class SidebarStore {
		constructor(api) {
			const bind = (instance, methodName) => instance[methodName].bind(instance);
			const internalState = new SidebarStoreState();
			const errorActions = new SidebarErrorActions();
			const queryService = new SidebarStoreQueries(internalState, keyOf);
			const branchUtils = new SidebarBranchUtils(internalState, keyOf);
			const setBranchDocs = (collectionId, parentId, list, options = {}) => {
				branchUtils.setBranchDocs(collectionId, parentId, list, options);
			};
			const removeBranch = (collectionId, parentId = null) => {
				branchUtils.removeBranch(collectionId, parentId);
			};
			const setError = message => {
				errorActions.setError(message);
			};
			const documentActions = new SidebarDocumentActions({
				api,
				state: internalState,
				queries: queryService,
				keyOf,
				normalizeParentId,
				setBranchDocs,
				removeBranch,
				setError
			});
			const hydrationActions = new SidebarHydrationActions({
				state: internalState,
				keyOf,
				normalizeParentId
			});

			// Late-bound: pullActions is constructed below after the dispatch table is built.
			let pullActionsRef = null;
			const collectionActions = new SidebarCollectionActions({
				api,
				state: internalState,
				setError,
				setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
				removeBranch,
				refreshCollectionWatches: () => pullActionsRef?.refreshCollectionWatches()
			});
			const ensureChildrenLoaded = bind(documentActions, 'ensureChildrenLoaded');
			const selectionActions = new SidebarSelectionActions({
				state: internalState,
				ensureChildrenLoaded
			});
			const expansionActions = new SidebarExpansionActions({
				state: internalState,
				getChildren: bind(queryService, 'getChildren'),
				ensureChildrenLoaded
			});

			// Pull-router dispatch table. Phase 1 handlers are wired below;
			// noop slots reserve commands that arrive earlier than their phase ships.
			const noop = () => {};
			const applyDocumentUpdate = bind(documentActions, 'applyDocumentUpdate');
			const applyDocumentMove = bind(documentActions, 'applyDocumentMove');
			const applyDocumentRemoval = bind(documentActions, 'applyDocumentRemoval');
			const applyDocumentActive = bind(documentActions, 'applyDocumentActive');
			const applyDocumentCreate = bind(documentActions, 'applyDocumentCreate');
			const applyCollectionCreate = bind(collectionActions, 'applyCollectionCreate');
			const applyCollectionDelete = bind(collectionActions, 'applyCollectionDelete');
			const applyCollectionArchive = bind(collectionActions, 'applyCollectionArchive');
			const applyCollectionRestore = bind(collectionActions, 'applyCollectionRestore');
			const applyCollectionUpdate = bind(collectionActions, 'applyCollectionUpdate');
			const applyCollectionMove = bind(collectionActions, 'applyCollectionMove');
			const applyCollectionCapabilities = bind(collectionActions, 'applyCollectionCapabilities');
			const applyCollectionListInvalidated = bind(collectionActions, 'applyCollectionListInvalidated');
			// Pull-driven applies: emit DOCUMENT_CHILDREN_CHANGED for affected parents so
			// editor children-block (note-app subscription) refreshes on remote events.
			const emitChildrenChanged = (collectionId, parentId) => {
				const pid = Number(parentId);
				const cid = Number(collectionId);
				if (!Number.isFinite(pid) || pid <= 0 || !Number.isFinite(cid) || cid <= 0) {
					return;
				}
				main_core_events.EventEmitter.emit(NoteEvent.DOCUMENT_CHILDREN_CHANGED, new main_core_events.BaseEvent({
					data: {
						parentId: pid,
						collectionId: cid
					}
				}));
			};
			const pullDocumentCreate = async params => {
				const result = await applyDocumentCreate(params);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentMove = async params => {
				const result = await applyDocumentMove(params);
				emitChildrenChanged(params?.fromCollectionId ?? params?.collectionId, params?.fromParentId);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentActive = async params => {
				const result = await applyDocumentActive(params);
				emitChildrenChanged(params?.collectionId, params?.parentId);
				return result;
			};
			const pullDocumentRemoval = async params => {
				// Pre-compute affected parents from store before removal mutates it.
				const affectedParents = [];
				const ids = Array.isArray(params?.documentIds) ? params.documentIds : [];
				for (const rawId of ids) {
					const id = Number(rawId);
					if (!Number.isFinite(id) || id <= 0) {
						continue;
					}
					const found = queryService.findLoadedDocumentAnywhere(id);
					if (found && Number(found.parentId) > 0) {
						affectedParents.push({
							collectionId: Number(found.collectionId),
							parentId: Number(found.parentId)
						});
					}
				}
				const result = await applyDocumentRemoval(params);
				for (const ap of affectedParents) {
					emitChildrenChanged(ap.collectionId, ap.parentId);
				}
				return result;
			};
			const handlers = {
				[PullCommand.DOCUMENT_CREATE]: pullDocumentCreate,
				[PullCommand.DOCUMENT_UPDATE]: applyDocumentUpdate,
				[PullCommand.DOCUMENT_MOVE]: pullDocumentMove,
				[PullCommand.DOCUMENT_ARCHIVE]: pullDocumentRemoval,
				[PullCommand.DOCUMENT_RESTORE]: pullDocumentActive,
				[PullCommand.DOCUMENT_DELETE]: pullDocumentRemoval,
				[PullCommand.DOCUMENT_HARD_DELETE]: noop,
				[PullCommand.COLLECTION_CREATE]: applyCollectionCreate,
				[PullCommand.COLLECTION_UPDATE]: applyCollectionUpdate,
				[PullCommand.COLLECTION_MOVE]: applyCollectionMove,
				[PullCommand.COLLECTION_ARCHIVE]: applyCollectionArchive,
				[PullCommand.COLLECTION_RESTORE]: applyCollectionRestore,
				[PullCommand.COLLECTION_DELETE]: applyCollectionDelete,
				[PullCommand.COLLECTION_CAPABILITIES]: applyCollectionCapabilities,
				[PullCommand.COLLECTION_LIST_INVALIDATED]: applyCollectionListInvalidated
			};
			const pullActions = new SidebarPullActions({
				state: internalState,
				handlers
			});
			pullActionsRef = pullActions;
			this.state = {
				collections: internalState.collections,
				collectionsLoading: internalState.collectionsLoading,
				collectionsHasNextPage: internalState.collectionsHasNextPage,
				globalPermissions: internalState.globalPermissions,
				selectedCollectionId: internalState.selectedCollectionId,
				selectedDocId: internalState.selectedDocId,
				selectedSharedView: internalState.selectedSharedView,
				selectedArchiveView: internalState.selectedArchiveView,
				selectedRecycleBinView: internalState.selectedRecycleBinView,
				expandedDocs: internalState.expandedDocs,
				currentRootDocs: queryService.currentRootDocs
			};
			this.actions = {
				setError,
				hydrateFromInitialContext: bind(hydrationActions, 'hydrateFromInitialContext'),
				hydrateInitialCollections: bind(hydrationActions, 'hydrateInitialCollections'),
				setGlobalPermissions: bind(hydrationActions, 'setGlobalPermissions'),
				invalidateChildren: bind(documentActions, 'invalidateChildren'),
				invalidateBranch: bind(documentActions, 'invalidateBranch'),
				invalidateAllChildren: bind(documentActions, 'invalidateAllChildren'),
				setParentHasChildrenLocal: bind(documentActions, 'setParentHasChildrenLocal'),
				insertDocumentLocal: bind(documentActions, 'insertDocumentLocal'),
				updateDocumentLocal: bind(documentActions, 'updateDocumentLocal'),
				applyDocumentUpdate,
				applyDocumentMove,
				applyDocumentPositions: bind(documentActions, 'applyDocumentPositions'),
				applyDocumentRemoval,
				applyDocumentActive,
				applyDocumentCreate,
				removeDocumentLocal: bind(documentActions, 'removeDocumentLocal'),
				moveDocumentLocal: bind(documentActions, 'moveDocumentLocal'),
				loadDocuments: bind(documentActions, 'loadDocuments'),
				prefetchChildren: bind(documentActions, 'prefetchChildren'),
				ensureChildrenLoaded,
				insertCollectionLocal: bind(collectionActions, 'insertCollectionLocal'),
				updateCollectionLocal: bind(collectionActions, 'updateCollectionLocal'),
				applyCollectionCreate,
				applyCollectionDelete,
				applyCollectionArchive,
				applyCollectionRestore,
				applyCollectionUpdate,
				applyCollectionMove,
				applyCollectionCapabilities,
				applyCollectionListInvalidated,
				patchCollectionCapabilities: bind(collectionActions, 'patchCollectionCapabilities'),
				removeCollectionLocal: bind(collectionActions, 'removeCollectionLocal'),
				moveCollectionLocal: bind(collectionActions, 'moveCollectionLocal'),
				applyCollectionPositions: bind(collectionActions, 'applyCollectionPositions'),
				loadCollections: bind(collectionActions, 'loadCollections'),
				selectCollection: bind(selectionActions, 'selectCollection'),
				selectDocument: bind(selectionActions, 'selectDocument'),
				clearSelection: bind(selectionActions, 'clearSelection'),
				clearDocumentSelection: bind(selectionActions, 'clearDocumentSelection'),
				setSharedView: bind(selectionActions, 'setSharedView'),
				setArchiveView: bind(selectionActions, 'setArchiveView'),
				setRecycleBinView: bind(selectionActions, 'setRecycleBinView'),
				toggleDocExpanded: bind(expansionActions, 'toggleDocExpanded'),
				clearCollectionExpandedDocs: bind(expansionActions, 'clearCollectionExpandedDocs'),
				subscribeToPullEvents: bind(pullActions, 'subscribeToPullEvents'),
				unsubscribeFromPullEvents: bind(pullActions, 'unsubscribeFromPullEvents')
			};
			this.queries = {
				getChildren: bind(queryService, 'getChildren'),
				findCollection: bind(queryService, 'findCollection'),
				findLoadedDocument: bind(queryService, 'findLoadedDocument'),
				findLoadedDocumentAnywhere: bind(queryService, 'findLoadedDocumentAnywhere'),
				isDocumentLoadedAnywhere: bind(queryService, 'isDocumentLoadedAnywhere'),
				getAncestorsForDocument: bind(queryService, 'getAncestorsForDocument'),
				isLoadingChildren: bind(queryService, 'isLoadingChildren'),
				hasNextChildren: bind(queryService, 'hasNextChildren'),
				isChildrenHydrated: bind(queryService, 'isChildrenHydrated'),
				isBranchLoaded: bind(queryService, 'isBranchLoaded')
			};
		}
	}
	function createSidebarStore(api) {
		return new SidebarStore(api);
	}

	function buildSidebarMessages() {
		const msg = code => main_core.Loc.getMessage(code);
		return {
			brandName: msg('NOTE_SIDEBAR_BRAND_NAME'),
			brandSuffix: msg('NOTE_SIDEBAR_BRAND_SUFFIX'),
			knowledgeBase: msg('NOTE_SIDEBAR_KNOWLEDGE_BASE'),
			collections: msg('NOTE_SIDEBAR_COLLECTIONS'),
			documents: msg('NOTE_SIDEBAR_DOCUMENTS'),
			emptyCollections: msg('NOTE_SIDEBAR_EMPTY_COLLECTIONS'),
			emptyDocuments: msg('NOTE_SIDEBAR_EMPTY_DOCUMENTS'),
			createDocument: msg('NOTE_SIDEBAR_CREATE_DOCUMENT'),
			delete: msg('NOTE_SIDEBAR_DELETE'),
			confirmDeleteCollection: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION'),
			confirmDeleteCollectionTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_COLLECTION_TITLE'),
			confirmDeleteDocument: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT'),
			confirmDeleteDocumentTitle: msg('NOTE_SIDEBAR_CONFIRM_DELETE_DOCUMENT_TITLE'),
			promptCollectionName: msg('NOTE_SIDEBAR_PROMPT_COLLECTION_NAME'),
			promptDocumentName: msg('NOTE_SIDEBAR_PROMPT_DOCUMENT_NAME'),
			errorGeneric: msg('NOTE_SIDEBAR_ERROR_GENERIC'),
			errorDocumentNotFound: msg('NOTE_SIDEBAR_ERROR_DOCUMENT_NOT_FOUND'),
			openPermissions: msg('NOTE_SIDEBAR_OPEN_PERMISSIONS'),
			sharedWithMe: msg('NOTE_SIDEBAR_SHARED_WITH_ME'),
			archive: msg('NOTE_SIDEBAR_ARCHIVE'),
			recycleBin: msg('NOTE_SIDEBAR_RECYCLE_BIN'),
			expandCollections: msg('NOTE_SIDEBAR_COLLECTIONS_EXPAND'),
			collapseCollections: msg('NOTE_SIDEBAR_COLLECTIONS_COLLAPSE')
		};
	}

	const SIDEBAR_COLLAPSED_WIDTH = 48;
	function createSidebarRootState({
		store,
		uiState,
		dragState,
		getRouteDocumentId
	}) {
		const documentsLoading = ui_vue3.computed(() => {
			if (!store.state.selectedCollectionId.value) {
				return false;
			}
			return store.queries.isLoadingChildren(store.state.selectedCollectionId.value, null);
		});
		const hasManageableCollection = ui_vue3.computed(() => {
			const items = store.state.collections.value;
			if (!Array.isArray(items)) {
				return false;
			}
			return items.some(collection => Boolean(collection?.canEditCollection));
		});
		const permissions = ui_vue3.computed(() => ({
			...store.state.globalPermissions,
			hasManageableCollection: hasManageableCollection.value
		}));
		return {
			get collections() {
				return store.state.collections.value;
			},
			get collectionsLoading() {
				return store.state.collectionsLoading.value;
			},
			get collectionsHasNextPage() {
				return store.state.collectionsHasNextPage.value;
			},
			get permissions() {
				return permissions.value;
			},
			get documentsLoading() {
				return documentsLoading.value;
			},
			get selectedCollectionId() {
				return store.state.selectedCollectionId.value;
			},
			get selectedDocId() {
				return getRouteDocumentId() || store.state.selectedDocId.value;
			},
			get selectedSharedView() {
				return store.state.selectedSharedView.value;
			},
			get selectedArchiveView() {
				return store.state.selectedArchiveView.value;
			},
			get selectedRecycleBinView() {
				return store.state.selectedRecycleBinView.value;
			},
			get collectionsSectionExpanded() {
				return uiState.collectionsSectionExpanded;
			},
			get sidebarWidth() {
				return uiState.sidebarWidth;
			},
			get sidebarCollapsed() {
				return uiState.sidebarCollapsed;
			},
			get isMobile() {
				return Boolean(uiState.isMobile);
			},
			get sidebarEffectiveWidth() {
				return uiState.sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : uiState.sidebarWidth;
			},
			expandedDocs: store.state.expandedDocs,
			get currentRootDocs() {
				return store.state.currentRootDocs.value;
			},
			get docDragItem() {
				return dragState.docItem;
			},
			get docDropTarget() {
				return dragState.docTarget;
			},
			get collectionDragItem() {
				return dragState.collectionItem;
			},
			get collectionDropTarget() {
				return dragState.collectionTarget;
			},
			get renamingDocId() {
				return uiState.renamingDocId;
			},
			get renamingCollectionId() {
				return uiState.renamingCollectionId;
			},
			getChildren: store.queries.getChildren,
			isLoadingChildren: store.queries.isLoadingChildren,
			hasNextChildren: store.queries.hasNextChildren,
			getRootDocs: collectionId => store.queries.getChildren(collectionId, null),
			isRootLoading: collectionId => store.queries.isLoadingChildren(collectionId, null),
			hasRootNextPage: collectionId => store.queries.hasNextChildren(collectionId, null)
		};
	}

	class AjaxControllerClient {
		run(action, data = {}) {
			return main_core.ajax.runAction(action, {
				data
			}).then(response => response?.data).catch(error => {
				throw new Error(this.#extractErrorMessage(error));
			});
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
			return 'Request failed';
		}
	}

	class DialogService {
		confirm(message, title = '', confirmText = '') {
			return new Promise(resolve => {
				let isResolved = false;
				const finish = value => {
					if (isResolved) {
						return;
					}
					isResolved = true;
					resolve(value);
				};
				const content = main_core.Tag.render`
				<div class="note-sidebar-confirm-content">
					${String(message || '')}
				</div>
			`;
				const dialog = new ui_system_dialog.Dialog({
					title,
					content,
					width: 420,
					hasOverlay: true,
					overlay: true,
					centerButtons: [new ui_buttons.Button({
						text: String(main_core.Loc.getMessage('NOTE_SIDEBAR_CANCEL') || 'Cancel'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: () => {
							finish(false);
							dialog.hide();
						}
					}), new ui_buttons.Button({
						text: String(confirmText || title || main_core.Loc.getMessage('NOTE_SIDEBAR_DELETE') || 'OK'),
						size: ui_buttons.ButtonSize.LARGE,
						style: ui_buttons.AirButtonStyle.PLAIN,
						useAirDesign: true,
						onclick: () => {
							finish(true);
							dialog.hide();
						}
					})],
					events: {
						onHide: () => {
							finish(false);
						}
					}
				});
				note_ui_themeContext.NoteThemeContext.themeDialog(dialog, content);
				dialog.show();
			});
		}
		requestText({
			title = '',
			value = ''
		}) {
			return new Promise(resolve => {
				const input = document.createElement('input');
				input.className = 'ui-ctl-element';
				input.value = value;
				ui_dialogs_messagebox.MessageBox.show({
					title,
					message: input,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					popupOptions: {
						designSystemContext: note_ui_themeContext.NoteThemeContext.getDesignSystemContext()
					},
					onOk: messageBox => {
						const nextValue = String(input.value || '').trim();
						messageBox.close();
						resolve(nextValue || null);
					},
					onCancel: messageBox => {
						messageBox.close();
						resolve(null);
					}
				});
				setTimeout(() => {
					input.focus();
				}, 0);
			});
		}
	}

	const PAGE_SIZE = 50;
	class SidebarApi {
		#client;
		constructor(client) {
			this.#client = client;
		}
		async listCollections({
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			const params = {
				limit
			};
			if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
				params.afterPosition = cursor.position;
				params.afterId = cursor.id;
			}
			const data = await this.#client.run('note.infrastructure.CollectionController.list', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null,
					permissions: null
				};
			}
			const normalizedItems = data.items.map(item => this.#normalizeCollection(item)).filter(item => item !== null);
			const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			return {
				items: normalizedItems,
				hasNextPage: nextCursor !== null,
				nextCursor,
				permissions: this.#normalizeGlobalPermissions(data.permissions)
			};
		}
		async listDocumentsByParent(collectionId, parentId = null, {
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			try {
				const params = {
					collectionId,
					parentId,
					limit
				};
				if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
					params.afterPosition = cursor.position;
					params.afterId = cursor.id;
				}
				const data = await this.#client.run('note.infrastructure.DocumentController.listByParent', params);
				if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.documents)) {
					throw new TypeError('Invalid listByParent response');
				}
				const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
				return {
					items: data.documents.map(item => this.#normalizeDocument(item)).filter(item => item !== null),
					hasNextPage: nextCursor !== null,
					nextCursor
				};
			} catch {
				const allDocs = await this.#loadParentFromTree(collectionId, parentId);
				return {
					items: allDocs,
					hasNextPage: false,
					nextCursor: null
				};
			}
		}
		async createCollection(name) {
			const data = await this.#client.run('note.infrastructure.CollectionController.create', {
				name,
				position: 0
			});
			const normalized = this.#normalizeCollection(data);
			if (normalized) {
				return normalized;
			}
			const id = this.#toPositiveInt(data?.id);
			return {
				id: id ?? 0,
				name: String(name || ''),
				position: 0
			};
		}
		updateCollection(id, name) {
			return this.#client.run('note.infrastructure.CollectionController.update', {
				id,
				name
			});
		}
		deleteCollection(id) {
			return this.#client.run('note.infrastructure.CollectionController.delete', {
				id
			});
		}
		archiveCollection(id) {
			return this.#client.run('note.infrastructure.CollectionController.archive', {
				id
			});
		}
		async getMyCollectionAccess(id) {
			const data = await this.#client.run('note.infrastructure.CollectionController.getMyAccess', {
				id
			});
			if (!main_core.Type.isPlainObject(data)) {
				return null;
			}
			return {
				collectionId: Number(data.collectionId) || id,
				level: typeof data.level === 'string' ? data.level : 'none',
				policyLevel: typeof data.policyLevel === 'string' ? data.policyLevel : 'none',
				canEditCollection: Boolean(data.canEditCollection),
				canManagePermissions: Boolean(data.canManagePermissions)
			};
		}
		async moveCollection(id, position) {
			const data = await this.#client.run('note.infrastructure.CollectionController.move', {
				id,
				position
			});
			if (!main_core.Type.isPlainObject(data)) {
				return {
					position: null,
					affectedPositions: []
				};
			}
			const rawList = Array.isArray(data.affectedPositions) ? data.affectedPositions : [];
			const affectedPositions = [];
			for (const entry of rawList) {
				if (!main_core.Type.isPlainObject(entry)) {
					continue;
				}
				const entryId = this.#toPositiveInt(entry.id);
				const entryPosition = this.#toInt(entry.position);
				if (entryId === null || entryPosition === null) {
					continue;
				}
				affectedPositions.push({
					id: entryId,
					position: entryPosition
				});
			}
			return {
				position: this.#toInt(data.position),
				affectedPositions
			};
		}
		async listManageableCollections(limit = 2) {
			const data = await this.#client.run('note.infrastructure.CollectionController.listManageableShort', {
				limit
			});
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasMore: false
				};
			}
			const items = data.items.map(item => {
				if (!main_core.Type.isPlainObject(item)) {
					return null;
				}
				const id = this.#toPositiveInt(item.id);
				if (id === null) {
					return null;
				}
				return {
					id,
					name: String(item.name ?? '')
				};
			}).filter(item => item !== null);
			return {
				items,
				hasMore: Boolean(data.hasMore)
			};
		}
		async createDocument(collectionId, title, parentId = null) {
			const data = await this.#client.run('note.infrastructure.DocumentController.create', {
				collectionId,
				parentId,
				title
			});
			const normalized = this.#normalizeDocument(data);
			if (normalized) {
				return normalized;
			}
			const id = this.#toPositiveInt(data?.id);
			return {
				id: id ?? 0,
				collectionId: this.#toPositiveInt(collectionId) ?? 0,
				parentId: this.#toNullableInt(parentId),
				title: String(title || ''),
				position: 0,
				hasChildren: false,
				isArchived: false
			};
		}
		updateDocument(id, title) {
			return this.#client.run('note.infrastructure.DocumentController.update', {
				id,
				title
			});
		}
		deleteDocument(id) {
			return this.#client.run('note.infrastructure.DocumentController.delete', {
				id
			});
		}
		archiveDocument(id) {
			return this.#client.run('note.infrastructure.DocumentController.archive', {
				id
			});
		}
		restoreDocument(id) {
			return this.#client.run('note.infrastructure.DocumentController.restore', {
				id
			});
		}
		restoreAllDocuments() {
			return this.#client.run('note.infrastructure.DocumentController.restoreAll', {});
		}
		async listArchivedDocuments({
			limit = PAGE_SIZE,
			cursor = null
		} = {}) {
			const params = {
				limit
			};
			if (cursor !== null && main_core.Type.isPlainObject(cursor)) {
				params.afterCursor = cursor;
			}
			const data = await this.#client.run('note.infrastructure.DocumentController.listArchived', params);
			if (!main_core.Type.isPlainObject(data) || !Array.isArray(data.items)) {
				return {
					items: [],
					hasNextPage: false,
					nextCursor: null
				};
			}
			const nextCursor = main_core.Type.isPlainObject(data.nextCursor) ? data.nextCursor : null;
			return {
				items: data.items,
				hasNextPage: nextCursor !== null,
				nextCursor
			};
		}
		moveDocument(id, collectionId, parentId, position) {
			return this.#client.run('note.infrastructure.DocumentController.move', {
				id,
				collectionId,
				parentId,
				position
			});
		}
		async #loadParentFromTree(collectionId, parentId) {
			const tree = await this.#client.run('note.infrastructure.DocumentController.getTree', {
				collectionId
			});
			if (!Array.isArray(tree)) {
				return [];
			}
			const docs = this.#collectTreeDocumentsByParent(tree, parentId ?? null);
			this.#sortDocumentsByPosition(docs);
			return docs;
		}
		#collectTreeDocumentsByParent(tree, targetParentId) {
			const docs = [];
			const stack = [...tree];
			while (stack.length > 0) {
				const node = stack.pop();
				const normalizedNode = this.#normalizeTreeNode(node, targetParentId);
				if (normalizedNode) {
					docs.push(normalizedNode);
				}
				this.#pushNodeChildren(stack, node);
			}
			return docs;
		}
		#normalizeTreeNode(node, targetParentId) {
			if (!main_core.Type.isPlainObject(node)) {
				return null;
			}
			const nodeParentId = node.parentId ?? null;
			if (nodeParentId !== targetParentId) {
				return null;
			}
			const children = Array.isArray(node.children) ? node.children : [];
			return this.#normalizeDocument({
				...node,
				hasChildren: children.length > 0
			});
		}
		#pushNodeChildren(stack, node) {
			if (!main_core.Type.isPlainObject(node)) {
				return;
			}
			const children = Array.isArray(node.children) ? node.children : [];
			for (let i = children.length - 1; i >= 0; i -= 1) {
				stack.push(children[i]);
			}
		}
		#sortDocumentsByPosition(documents) {
			documents.sort((a, b) => {
				const leftPos = Number(a.position || 0);
				const rightPos = Number(b.position || 0);
				if (leftPos !== rightPos) {
					return rightPos - leftPos;
				}
				return Number(b.id || 0) - Number(a.id || 0);
			});
		}
		#normalizeCollection(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			if (id === null) {
				return null;
			}
			return {
				...row,
				id,
				name: String(row.name ?? ''),
				position: this.#toInt(row.position) ?? 0,
				canEditCollection: Boolean(row.canEditCollection),
				canManagePermissions: Boolean(row.canManagePermissions)
			};
		}
		#normalizeDocument(row) {
			if (!main_core.Type.isPlainObject(row)) {
				return null;
			}
			const id = this.#toPositiveInt(row.id);
			const collectionId = this.#toPositiveInt(row.collectionId);
			if (id === null || collectionId === null) {
				return null;
			}
			return {
				...row,
				id,
				collectionId,
				parentId: this.#toNullableInt(row.parentId),
				title: String(row.title ?? ''),
				position: this.#toInt(row.position) ?? 0,
				hasChildren: Boolean(row.hasChildren),
				isArchived: Boolean(row.isArchived)
			};
		}
		#toPositiveInt(value) {
			const normalized = this.#toInt(value);
			if (normalized === null || normalized <= 0) {
				return null;
			}
			return normalized;
		}
		#toNullableInt(value) {
			if (value === null || value === undefined || value === '') {
				return null;
			}
			return this.#toInt(value);
		}
		#toInt(value) {
			const parsed = Number(value);
			if (!Number.isFinite(parsed)) {
				return null;
			}
			return Math.trunc(parsed);
		}
		#normalizeGlobalPermissions(rawPermissions) {
			if (!main_core.Type.isPlainObject(rawPermissions)) {
				return null;
			}
			return {
				canEditCollections: Boolean(rawPermissions.canEditCollections),
				canEditGlobalPermissions: Boolean(rawPermissions.canEditGlobalPermissions),
				canImport: Boolean(rawPermissions.canImport),
				hasManageableCollection: Boolean(rawPermissions.hasManageableCollection)
			};
		}
	}

	const AUTO_EXPAND_DELAY_MS = 500;
	const SIDEBAR_DEFAULT_WIDTH = 280;
	const SIDEBAR_MIN_WIDTH = 280;
	const SIDEBAR_MAX_WIDTH = 540;
	function createDragState() {
		return ui_vue3.reactive({
			docItem: null,
			docTarget: null,
			collectionItem: null,
			collectionTarget: null
		});
	}
	function normalizeSidebarMinWidth(minWidth) {
		const numericMin = Number(minWidth);
		if (!Number.isFinite(numericMin)) {
			return SIDEBAR_MIN_WIDTH;
		}
		return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.ceil(numericMin)));
	}
	function normalizeSidebarWidth(width, minWidth = SIDEBAR_MIN_WIDTH) {
		const normalizedMin = normalizeSidebarMinWidth(minWidth);
		const normalizedWidth = Number(width);
		if (!Number.isFinite(normalizedWidth)) {
			return Math.max(normalizedMin, SIDEBAR_DEFAULT_WIDTH);
		}
		return Math.max(normalizedMin, Math.min(SIDEBAR_MAX_WIDTH, Math.trunc(normalizedWidth)));
	}
	function normalizeSidebarCollapsed(collapsed) {
		return Boolean(collapsed);
	}
	function createUiState(sidebarWidth = SIDEBAR_DEFAULT_WIDTH, sidebarCollapsed = false, isMobile = false) {
		return ui_vue3.reactive({
			expandedCollections: {},
			collectionsSectionExpanded: true,
			sidebarMinWidth: SIDEBAR_MIN_WIDTH,
			sidebarWidth: normalizeSidebarWidth(sidebarWidth, SIDEBAR_MIN_WIDTH),
			sidebarCollapsed: normalizeSidebarCollapsed(sidebarCollapsed),
			isMobile: Boolean(isMobile),
			renamingDocId: null,
			renamingCollectionId: null
		});
	}
	function applyExpandedCollectionsFromContext(uiState, context) {
		const expandedCollectionsState = uiState.expandedCollections;
		const expandedCollections = main_core.Type.isPlainObject(context?.expandedCollections) ? context.expandedCollections : {};
		for (const [rawCollectionId, rawIsExpanded] of Object.entries(expandedCollections)) {
			const collectionId = Number(rawCollectionId);
			if (!Number.isInteger(collectionId) || collectionId <= 0 || !rawIsExpanded) {
				continue;
			}
			expandedCollectionsState[collectionId] = true;
		}
		if (Object.keys(expandedCollectionsState).length > 0) {
			return;
		}
		if (Boolean(context?.document?.isArchived)) {
			return;
		}
		const fallbackCollectionId = Number(context?.selectedCollectionId ?? context?.collectionId ?? context?.document?.collectionId ?? 0);
		if (Number.isInteger(fallbackCollectionId) && fallbackCollectionId > 0) {
			expandedCollectionsState[fallbackCollectionId] = true;
		}
	}
	async function scrollSelectedDocIntoView(docId) {
		const normalizedId = Number(docId);
		if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
			return;
		}
		await ui_vue3.nextTick();
		const node = document.querySelector(`[data-doc-id="${normalizedId}"]`);
		if (node && main_core.Type.isFunction(node.scrollIntoView)) {
			node.scrollIntoView({
				block: 'center',
				behavior: 'smooth'
			});
		}
	}
	function createHydrateFromInitialContext(store, uiState) {
		return context => {
			const isHydrated = store.actions.hydrateFromInitialContext(context);
			if (!isHydrated) {
				return false;
			}
			applyExpandedCollectionsFromContext(uiState, context);
			return true;
		};
	}
	function createHydrateInitialCollections(store) {
		return payload => store.actions.hydrateInitialCollections(payload);
	}
	function createHydrationApi(store, uiState) {
		return {
			hydrateFromInitialContext: createHydrateFromInitialContext(store, uiState),
			hydrateInitialCollections: createHydrateInitialCollections(store)
		};
	}
	function createSidebarPersistenceHandlers(uiState) {
		const sidebarUiState = uiState;
		const saveSidebarState = ({
			width = sidebarUiState.sidebarWidth,
			collapsed = sidebarUiState.sidebarCollapsed
		} = {}) => {
			const normalizedWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
			const normalizedCollapsed = normalizeSidebarCollapsed(collapsed);
			sidebarUiState.sidebarWidth = normalizedWidth;
			sidebarUiState.sidebarCollapsed = normalizedCollapsed;
			void main_core.ajax.runAction('main.userOption.saveOptions', {
				json: {
					newValues: [{
						c: 'note',
						n: 'sidebar',
						v: {
							width: normalizedWidth,
							collapsed: normalizedCollapsed ? 'Y' : 'N'
						}
					}]
				}
			}).catch(() => {
				// Keep UI state even if persistence fails.
			});
		};
		const setSidebarWidth = width => {
			sidebarUiState.sidebarWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
		};
		const saveSidebarWidth = width => {
			const normalizedWidth = normalizeSidebarWidth(width, sidebarUiState.sidebarMinWidth);
			sidebarUiState.sidebarWidth = normalizedWidth;
			saveSidebarState({
				width: normalizedWidth,
				collapsed: sidebarUiState.sidebarCollapsed
			});
		};
		const setSidebarMinWidth = minWidth => {
			const normalizedMin = normalizeSidebarMinWidth(minWidth);
			if (normalizedMin === sidebarUiState.sidebarMinWidth) {
				return;
			}
			sidebarUiState.sidebarMinWidth = normalizedMin;
			if (sidebarUiState.sidebarWidth < normalizedMin) {
				sidebarUiState.sidebarWidth = normalizedMin;
			}
		};
		const setSidebarCollapsed = collapsed => {
			sidebarUiState.sidebarCollapsed = normalizeSidebarCollapsed(collapsed);
			return sidebarUiState.sidebarCollapsed;
		};
		const toggleSidebarCollapsed = () => {
			sidebarUiState.sidebarCollapsed = !sidebarUiState.sidebarCollapsed;
			return sidebarUiState.sidebarCollapsed;
		};
		return {
			saveSidebarState,
			setSidebarWidth,
			saveSidebarWidth,
			setSidebarMinWidth,
			setSidebarCollapsed,
			toggleSidebarCollapsed
		};
	}
	function createStoreProxy(store) {
		return {
			ensureChildrenLoaded: (collectionId, parentId) => store.actions.ensureChildrenLoaded(collectionId, parentId),
			findCollection: collectionId => store.queries.findCollection(collectionId),
			findLoadedDocument: (collectionId, docId) => store.queries.findLoadedDocument(collectionId, docId),
			findLoadedDocumentAnywhere: docId => store.queries.findLoadedDocumentAnywhere(docId),
			getAncestorsForDocument: docId => store.queries.getAncestorsForDocument(docId),
			hasNextChildren: (collectionId, parentId) => store.queries.hasNextChildren(collectionId, parentId),
			loadMoreChildren: (collectionId, parentId) => store.actions.loadDocuments(collectionId, parentId, true),
			isDocumentLoaded: docId => store.queries.isDocumentLoadedAnywhere(docId),
			setSharedView: active => store.actions.setSharedView(active),
			setArchiveView: active => store.actions.setArchiveView(active),
			setRecycleBinView: active => store.actions.setRecycleBinView(active),
			insertCollectionLocal: collection => store.actions.insertCollectionLocal(collection),
			removeCollectionLocal: collectionId => store.actions.removeCollectionLocal(Number(collectionId)),
			isCollectionSelected: collectionId => Number(store.state.selectedCollectionId.value) === Number(collectionId),
			clearCollectionSelection: () => store.actions.clearSelection()
		};
	}
	function createSidebarState(store, uiState, dragState, routeSyncService) {
		return createSidebarRootState({
			store,
			uiState,
			dragState,
			getRouteDocumentId: () => routeSyncService.getRouteDocumentId()
		});
	}
	function createSidebarRuntime({
		router,
		emitAction,
		getRouteDocumentContext,
		reloadRouteDocumentContext,
		routeNames,
		api,
		dialog,
		dragState,
		uiState,
		store,
		messages,
		onFail
	}) {
		const isDragging = () => Boolean(dragState.docItem || dragState.collectionItem);
		const hydrationApi = createHydrationApi(store, uiState);
		ui_vue3.watch(() => store.state.selectedDocId.value, newId => {
			void scrollSelectedDocIntoView(newId);
		}, {
			flush: 'post'
		});
		// Prune expandedCollections for ids no longer present (NONE→VIEW must enter collapsed).
		ui_vue3.watch(() => store.state.collections.value.map(c => Number(c?.id)), currentIds => {
			const presentIds = new Set(currentIds.filter(id => Number.isInteger(id) && id > 0));
			for (const key of Object.keys(uiState.expandedCollections)) {
				if (!presentIds.has(Number(key))) {
					delete uiState.expandedCollections[key];
				}
			}
		});
		const routeSyncService = new SidebarRouteSyncService({
			store,
			router,
			uiState,
			messages,
			emitAction,
			getRouteDocumentContext,
			routeNames,
			hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext
		});
		const collectionUseCases = new CollectionUseCases({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			emitAction,
			isDragging,
			router,
			routeNames,
			getRouteDocumentContext
		});
		const documentUseCases = new DocumentUseCases({
			api,
			dialog,
			store,
			uiState,
			messages,
			onFail,
			router,
			routeNames,
			isDragging,
			getRouteDocumentContext,
			reloadRouteDocumentContext
		});
		const collectionDndService = new CollectionDndService({
			dragState,
			store,
			api,
			onFail
		});
		const documentDndService = new DocumentDndService({
			dragState,
			store,
			api,
			onFail,
			uiState,
			autoExpandDelayMs: AUTO_EXPAND_DELAY_MS
		});
		const persistenceHandlers = createSidebarPersistenceHandlers(uiState);
		const actions = createSidebarActions({
			collectionUseCases,
			documentUseCases,
			collectionDndService,
			documentDndService,
			messages,
			router,
			routeNames,
			setSidebarWidth: persistenceHandlers.setSidebarWidth,
			saveSidebarWidth: persistenceHandlers.saveSidebarWidth,
			setSidebarMinWidth: persistenceHandlers.setSidebarMinWidth,
			setSidebarCollapsed: persistenceHandlers.setSidebarCollapsed,
			toggleSidebarCollapsed: persistenceHandlers.toggleSidebarCollapsed,
			saveSidebarState: persistenceHandlers.saveSidebarState
		});
		const state = createSidebarState(store, uiState, dragState, routeSyncService);
		const storeProxy = createStoreProxy(store);
		return {
			state,
			actions,
			store: storeProxy,
			messages,
			bootstrap: async (options = {}) => routeSyncService.bootstrap(options),
			syncFromRouteContext: async (withCollectionFallback = false, options = {}) => routeSyncService.syncFromRouteContext(withCollectionFallback, options),
			hydrateInitialCollections: hydrationApi.hydrateInitialCollections,
			hydrateFromInitialContext: hydrationApi.hydrateFromInitialContext,
			...storeProxy,
			destroy: () => {
				routeSyncService.destroy();
			}
		};
	}
	function createSidebarFeature({
		router,
		emitAction = () => {},
		getRouteDocumentContext = () => null,
		reloadRouteDocumentContext = null,
		routeNames = {
			home: 'home',
			document: 'document',
			search: 'search',
			shared: 'shared',
			archive: 'archive',
			recyclebin: 'recyclebin'
		},
		sidebarOptions = null,
		isMobile = false
	}) {
		const api = new SidebarApi(new AjaxControllerClient());
		const dialog = new DialogService();
		const dragState = createDragState();
		const initialSidebarWidth = normalizeSidebarWidth(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.width : SIDEBAR_DEFAULT_WIDTH);
		const initialSidebarCollapsed = normalizeSidebarCollapsed(main_core.Type.isPlainObject(sidebarOptions) ? sidebarOptions.collapsed : false);
		const uiState = createUiState(initialSidebarWidth, initialSidebarCollapsed, Boolean(isMobile));
		const store = createSidebarStore(api);
		const messages = buildSidebarMessages();
		const onFail = error => {
			store.actions.setError(error?.message || messages.errorGeneric);
		};
		return createSidebarRuntime({
			router,
			emitAction,
			getRouteDocumentContext,
			reloadRouteDocumentContext,
			routeNames,
			api,
			dialog,
			dragState,
			uiState,
			store,
			messages,
			onFail
		});
	}

	exports.DialogService = DialogService;
	exports.NoteEvent = NoteEvent;
	exports.SidebarRootComponent = SidebarRootComponent;
	exports.createSidebarFeature = createSidebarFeature;

})(this.BX.Note.Sidebar = this.BX.Note.Sidebar || {}, BX.UI.IconSet, window, BX.Note, BX.Note.Ui, BX.Vue3, BX, BX.Note.Ui, BX.SidePanel, BX.Note.Import, BX.Note.Permissions, BX.Event, BX.UI, BX.UI.EntitySelector, BX.UI.System, BX.Note.Ui, BX, BX.UI.Dialogs);
//# sourceMappingURL=sidebar.bundle.js.map
