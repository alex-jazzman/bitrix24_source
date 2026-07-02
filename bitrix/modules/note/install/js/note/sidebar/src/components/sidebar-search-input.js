import { ajax, Loc } from 'main.core';
import 'ui.icon-set.outline';
import { syncIMEModel } from '../utils/sync-ime-model';

const ACTION_QUICK_SEARCH = 'note.infrastructure.SearchController.quickSearch';
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export const SidebarSearchInput = {
	name: 'SidebarSearchInput',
	emits: ['navigate-document', 'navigate-search'],
	data()
	{
		return {
			query: '',
			results: [],
			status: 'idle', // idle | loading | results | empty | error
			dropdownVisible: false,
			focusedIndex: -1,
		};
	},
	computed: {
		trimmedQuery(): string
		{
			return this.query.trim();
		},
		placeholderText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SEARCH_PLACEHOLDER') || '';
		},
		showAllText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SEARCH_SHOW_ALL') || '';
		},
		emptyText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SEARCH_EMPTY') || '';
		},
		errorText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SEARCH_ERROR') || '';
		},
		clearText(): string
		{
			return Loc.getMessage('NOTE_SIDEBAR_SEARCH_CLEAR') || '';
		},
		hasQuery(): boolean
		{
			return this.query.length > 0;
		},
	},
	created()
	{
		this.debounceTimer = null;
		this.requestId = 0;
	},
	beforeUnmount()
	{
		this.cancelPending();
	},
	methods: {
		onInput(event): void
		{
			syncIMEModel(this, 'query', event);
			clearTimeout(this.debounceTimer);

			if (this.trimmedQuery.length < MIN_QUERY_LENGTH)
			{
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
		onKeydown(event): void
		{
			if (event.key === 'ArrowDown')
			{
				event.preventDefault();
				if (!this.dropdownVisible || this.status !== 'results')
				{
					return;
				}
				const max = this.results.length; // last index = "show all"
				if (this.focusedIndex < max)
				{
					this.focusedIndex++;
				}

				return;
			}

			if (event.key === 'ArrowUp')
			{
				event.preventDefault();
				if (!this.dropdownVisible || this.status !== 'results')
				{
					return;
				}
				if (this.focusedIndex > -1)
				{
					this.focusedIndex--;
				}

				return;
			}

			if (event.key === 'Enter')
			{
				if (this.focusedIndex >= 0 && this.focusedIndex < this.results.length)
				{
					this.selectResult(this.results[this.focusedIndex]);

					return;
				}

				if (this.focusedIndex === this.results.length && this.results.length > 0)
				{
					this.showAll();

					return;
				}

				if (this.trimmedQuery.length >= MIN_QUERY_LENGTH)
				{
					const { trimmedQuery } = this;
					this.resetSearch();
					this.$emit('navigate-search', { query: trimmedQuery });
				}

				return;
			}

			if (event.key === 'Escape')
			{
				this.dropdownVisible = false;
				this.focusedIndex = -1;
			}
		},
		onFocus(): void
		{
			if (this.results.length > 0 || this.status === 'empty')
			{
				this.dropdownVisible = true;
			}
		},
		onBlur(): void
		{
			setTimeout(() => {
				this.dropdownVisible = false;
			}, 150);
		},
		async fetchResults(): Promise<void>
		{
			const currentQuery = this.trimmedQuery;
			if (currentQuery.length < MIN_QUERY_LENGTH)
			{
				return;
			}

			const currentRequestId = ++this.requestId;
			this.status = 'loading';
			this.dropdownVisible = true;

			try
			{
				const response = await ajax.runAction(ACTION_QUICK_SEARCH, {
					data: { query: currentQuery },
				});

				if (currentRequestId !== this.requestId)
				{
					return;
				}

				const items = response?.data?.items;
				this.results = Array.isArray(items) ? items : [];
				this.status = this.results.length > 0 ? 'results' : 'empty';
				this.focusedIndex = -1;
				this.dropdownVisible = true;
			}
			catch
			{
				if (currentRequestId !== this.requestId)
				{
					return;
				}

				this.results = [];
				this.status = 'error';
			}
		},
		cancelPending(): void
		{
			clearTimeout(this.debounceTimer);
			this.requestId++;
		},
		resetSearch(): void
		{
			this.cancelPending();
			this.query = '';
			this.results = [];
			this.status = 'idle';
			this.dropdownVisible = false;
		},
		selectResult(item): void
		{
			this.resetSearch();
			this.$emit('navigate-document', { documentId: Number(item.documentId) });
		},
		clearQuery(): void
		{
			this.resetSearch();
			this.$refs.input?.focus();
		},
		showAll(): void
		{
			const { trimmedQuery } = this;
			this.resetSearch();
			this.$emit('navigate-search', { query: trimmedQuery });
		},
	},
	// language=Vue
	template: `
		<div class="note-sidebar-search">
			<div class="note-sidebar-search-row" @click="$refs.input.focus()">
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
	`,
};
