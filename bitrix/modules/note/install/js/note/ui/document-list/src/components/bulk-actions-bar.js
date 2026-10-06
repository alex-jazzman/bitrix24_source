import { Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { NoteThemeContext } from 'note.ui.theme-context';

// Section-dependent action sets (TPL-02): only actions valid for the section are rendered.
const SECTION_ACTIONS = {
	active: [
		{ type: 'move', icon: Outline.MOVE_TO, labelId: 'NOTE_DOCUMENT_LIST_BULK_MOVE', danger: false },
		{ type: 'archive', icon: Outline.BOX_WITH_LID, labelId: 'NOTE_DOCUMENT_LIST_BULK_ARCHIVE', danger: false },
		{ type: 'delete', icon: Outline.TRASHCAN, labelId: 'NOTE_DOCUMENT_LIST_BULK_DELETE', danger: true },
	],
	archive: [
		{ type: 'restore', icon: Outline.UNDO, labelId: 'NOTE_DOCUMENT_LIST_BULK_RESTORE', danger: false },
		{ type: 'delete', icon: Outline.TRASHCAN, labelId: 'NOTE_DOCUMENT_LIST_BULK_DELETE', danger: true },
	],
	recycle: [
		{ type: 'restore', icon: Outline.UNDO, labelId: 'NOTE_DOCUMENT_LIST_BULK_RESTORE', danger: false },
		{ type: 'hardDelete', icon: Outline.TRASHCAN, labelId: 'NOTE_DOCUMENT_LIST_BULK_HARD_DELETE', danger: true },
	],
};

// Presentational only: emits intents, never touches the backend or owns selection state.
export const BulkActionsBar = {
	name: 'NoteBulkActionsBar',
	components: {
		BIcon,
	},
	props: {
		section: {
			type: String,
			required: true,
			validator: (value: string): boolean =>
				value === 'active' || value === 'archive' || value === 'recycle',
		},
		selectedCount: {
			type: Number,
			required: true,
		},
		// "Select all" latch: the whole section is selected and newly paginated items join
		// automatically, so the pill shows "all selected" instead of a frozen number.
		allSelected: {
			type: Boolean,
			default: false,
		},
		isMobile: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['action', 'select-all', 'clear'],
	data(): Object
	{
		return {
			// The bar is teleported to <body>, outside the app root that carries the
			// design-system context class, so it must carry the current air theme context
			// itself — otherwise its --ui-color-* tokens fall back to the light values
			// (a white pill in dark theme).
			themeContextClass: NoteThemeContext.resolveDesignSystemContext(NoteThemeContext.get()),
			themeUnsubscribe: null,
		};
	},
	created(): void
	{
		this.themeUnsubscribe = NoteThemeContext.subscribe(({ data }) => {
			this.themeContextClass = NoteThemeContext.resolveDesignSystemContext(data?.theme);
		});
	},
	beforeUnmount(): void
	{
		this.themeUnsubscribe?.();
		this.themeUnsubscribe = null;
	},
	computed: {
		isVisible(): boolean
		{
			return this.selectedCount > 0;
		},
		actions(): Array<Object>
		{
			return (SECTION_ACTIONS[this.section] || []).map((action) => ({
				...action,
				label: Loc.getMessage(action.labelId) || '',
			}));
		},
		counterText(): string
		{
			// In "select all" mode the exact total is unknown (and would need a dedicated count
			// query), so the pill states "all selected" rather than a frozen page count.
			if (this.allSelected)
			{
				return Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECTED_ALL') || '';
			}

			const count = Number(this.selectedCount) || 0;

			// Single "Selected: N" phrasing on purpose — a fixed label sidesteps plural agreement as
			// the count ticks up/down.
			return Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECTED', { '#COUNT#': count }) || '';
		},
		selectAllLabel(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_SELECT_ALL') || '';
		},
		toolbarLabel(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_TOOLBAR_ARIA') || '';
		},
		clearLabel(): string
		{
			return Loc.getMessage('NOTE_DOCUMENT_LIST_BULK_CLEAR_ARIA') || '';
		},
		selectAllIcon(): string
		{
			return Outline.DOUBLE_CHECK;
		},
		clearIcon(): string
		{
			return Outline.CROSS_L;
		},
		// Icons render larger on mobile (the buttons there are icon-only, square tap targets).
		// BIcon writes an inline --ui-icon-set__icon-size, so the size must come from the prop.
		iconSize(): number
		{
			return this.isMobile ? 22 : 18;
		},
		clearIconSize(): number
		{
			return this.isMobile ? 22 : 20;
		},
		rootClass(): Array<string>
		{
			return [
				'note-bulk-actions-bar',
				this.themeContextClass,
				this.isVisible ? 'note-bulk-actions-bar--visible' : '',
				this.isMobile ? 'note-bulk-actions-bar--mobile' : '',
			];
		},
	},
	methods: {
		onAction(type: string): void
		{
			this.$emit('action', { type });
		},
		onSelectAll(): void
		{
			this.$emit('select-all');
		},
		onClear(): void
		{
			this.$emit('clear');
		},
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
	`,
};
