import { Event, Loc } from 'main.core';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { findTableAtSelection, normalizeTableAlignment } from '../../utils/table-alignment';

const VIEWPORT_PADDING = 8;
const TABLE_CONTROL_GAP = 8;
const TABLE_CONTROL_MARGIN = 4;

function clamp(value: number, min: number, max: number): number
{
	return Math.min(max, Math.max(min, value));
}

function resolveTableElement(editor: Object, position: number): ?HTMLElement
{
	const nodeDom = editor.view?.nodeDOM(position);
	if (!(nodeDom instanceof HTMLElement))
	{
		return null;
	}

	if (nodeDom.matches('table'))
	{
		return nodeDom;
	}

	const table = nodeDom.querySelector('table');

	return table instanceof HTMLElement ? table : null;
}

export const TableAlignmentControls = {
	name: 'NoteTableAlignmentControls',
	components: {
		BIcon,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
		layoutStable: {
			type: Boolean,
			default: true,
		},
	},
	data()
	{
		return {
			visible: false,
			position: { left: 0, top: 0 },
			alignment: 'center',
			Outline,
		};
	},
	computed: {
		actions(): Array<Object>
		{
			return [
				{
					value: 'left',
					label: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_LEFT'),
					icon: this.Outline.POINT_LEFT,
				},
				{
					value: 'center',
					label: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_CENTER'),
					icon: this.Outline.ALIGN_CENTER,
				},
				{
					value: 'right',
					label: Loc.getMessage('NOTE_EDITOR_TOOLBAR_ALIGN_RIGHT'),
					icon: this.Outline.POINT_RIGHT,
				},
			];
		},
	},
	watch: {
		visible(value)
		{
			if (value)
			{
				this.$nextTick(() => this.sync());
			}
		},
		editorTick()
		{
			this.sync();
		},
		editor()
		{
			this.sync();
		},
		layoutStable(stable)
		{
			if (!stable)
			{
				this.visible = false;

				return;
			}

			this.$nextTick(() => this.sync());
		},
	},
	mounted()
	{
		this.handleViewportChange = this.handleViewportChange.bind(this);
		Event.bind(document, 'scroll', this.handleViewportChange, { passive: true, capture: true });
		Event.bind(window, 'resize', this.handleViewportChange, { passive: true });
		this.sync();
	},
	beforeUnmount()
	{
		Event.unbind(document, 'scroll', this.handleViewportChange, true);
		Event.unbind(window, 'resize', this.handleViewportChange);
	},
	methods: {
		sync(): void
		{
			if (!this.layoutStable)
			{
				this.visible = false;

				return;
			}

			const editor = this.editor;
			if (!editor?.isEditable)
			{
				this.visible = false;

				return;
			}

			const table = findTableAtSelection(editor.state?.selection);
			if (!table)
			{
				this.visible = false;

				return;
			}

			const tableElement = resolveTableElement(editor, table.pos);
			if (!tableElement)
			{
				this.visible = false;

				return;
			}

			this.alignment = normalizeTableAlignment(table.node.attrs.alignment);
			this.updatePosition(tableElement);
			this.visible = true;
		},
		handleViewportChange(): void
		{
			if (this.visible)
			{
				this.sync();
			}
		},
		updatePosition(table: HTMLElement): void
		{
			const tableRect = table.getBoundingClientRect();
			const wrapper = table.closest('.tableWrapper');
			const isHorizontallyScrollable = wrapper instanceof HTMLElement && wrapper.scrollWidth > wrapper.clientWidth;
			const boundsRect = isHorizontallyScrollable ? wrapper.getBoundingClientRect() : tableRect;
			const controlRect = this.$refs.controls instanceof HTMLElement
				? this.$refs.controls.getBoundingClientRect()
				: null;
			const controlWidth = controlRect?.width ?? 0;
			const controlHeight = controlRect?.height ?? 0;
			const halfControlWidth = controlWidth / 2;
			const viewportMinLeft = VIEWPORT_PADDING + halfControlWidth;
			const viewportMaxLeft = window.innerWidth - VIEWPORT_PADDING - halfControlWidth;
			const minLeft = Math.max(
				VIEWPORT_PADDING + halfControlWidth,
				boundsRect.left + TABLE_CONTROL_MARGIN + halfControlWidth,
			);
			const maxLeft = Math.min(
				window.innerWidth - VIEWPORT_PADDING - halfControlWidth,
				boundsRect.right - TABLE_CONTROL_MARGIN - halfControlWidth,
			);
			const preferredLeft = tableRect.left + (tableRect.width / 2);
			const left = minLeft <= maxLeft
				? clamp(preferredLeft, minLeft, maxLeft)
				: clamp(preferredLeft, viewportMinLeft, viewportMaxLeft);
			const minTop = VIEWPORT_PADDING + controlHeight;
			const maxTop = window.innerHeight - VIEWPORT_PADDING;
			const preferredTop = tableRect.top - TABLE_CONTROL_GAP;
			this.position = {
				left,
				top: minTop <= maxTop ? clamp(preferredTop, minTop, maxTop) : maxTop,
			};
		},
		setAlignment(alignment: string): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			this.editor.chain().focus().setTableAlignment(alignment).run();
		},
	},
	// language=Vue
	template: `
		<teleport to="#note-editor-app">
			<div
				v-if="visible"
				ref="controls"
				class="note-editor-table-alignment-controls"
				data-testid="note-editor-table-alignment-controls"
				:style="{ left: position.left + 'px', top: position.top + 'px' }"
				contenteditable="false"
				@mousedown.prevent
			>
				<button
					v-for="action in actions"
					:key="action.value"
					type="button"
					class="note-editor-table-alignment-controls_button"
					:class="{ 'note-editor-table-alignment-controls_button--active': alignment === action.value }"
					:title="action.label"
					:aria-label="action.label"
					:aria-pressed="alignment === action.value"
					:data-testid="'note-editor-table-alignment-' + action.value + '-btn'"
					@click="setAlignment(action.value)"
				>
					<BIcon :name="action.icon" :size="20" />
				</button>
			</div>
		</teleport>
	`,
};
