import { reactive } from 'vue';
import { syncPopoverPositions, clearPopoverOffsets } from '../utils/popover-position';
import { LinkEditingState } from '../services/link-editing-state';
import { Event, Type } from 'main.core';
import {
	ToolbarHistoryGroupComponent,
	ToolbarHeadingGroupComponent,
	ToolbarTextStyleGroupComponent,
	ToolbarBlockGroupComponent,
	ToolbarScriptGroupComponent,
	ToolbarAlignGroupComponent,
	ToolbarInsertGroupComponent,
	ToolbarHighlightLinkGroupComponent,
	ToolbarCalloutGroupComponent,
	ToolbarMoreGroupComponent,
} from './toolbar';

let toolbarSequence = 0;

export const EditorToolbarComponent = {
	name: 'NoteEditorToolbar',
	components: {
		ToolbarHistoryGroupComponent,
		ToolbarHeadingGroupComponent,
		ToolbarTextStyleGroupComponent,
		ToolbarBlockGroupComponent,
		ToolbarScriptGroupComponent,
		ToolbarAlignGroupComponent,
		ToolbarInsertGroupComponent,
		ToolbarHighlightLinkGroupComponent,
		ToolbarCalloutGroupComponent,
		ToolbarMoreGroupComponent,
	},
	props: {
		editor: {
			type: Object,
			default: null,
		},
		headingLevel: {
			type: Number,
			default: 0,
		},
		editorTick: {
			type: Number,
			default: 0,
		},
		canUndo: {
			type: Boolean,
			default: false,
		},
		canRedo: {
			type: Boolean,
			default: false,
		},
		maxImageSize: {
			type: Number,
			default: 0,
		},
		maxFileSize: {
			type: Number,
			default: 0,
		},
		fixed: {
			type: Boolean,
			default: false,
		},
		fixedTop: {
			type: Number,
			default: 10,
		},
		fixedLeft: {
			type: Number,
			default: 0,
		},
		fixedMaxWidth: {
			type: Number,
			default: 0,
		},
	},
	emits: ['insertFileStub', 'insertImageStub', 'insertVideoStub'],
	data()
	{
		return {
			openMenu: null,
			moreSubMode: 'menu',
			popoverSyncFrame: null,
			toolbarId: `note-editor-toolbar-${++toolbarSequence}`,
		};
	},
	created()
	{
		this.linkState = reactive(new LinkEditingState({
			getEditor: () => this.editor,
		}));
	},
	computed: {
		linkValue(): string
		{
			return this.linkState?.linkValue ?? '';
		},
		insertTableDisabled(): boolean
		{
			const editorTick = this.editorTick;
			void editorTick;
			const isInTable = this.editor?.isActive('table') ?? false;

			return !this.editor?.isEditable || isInTable;
		},
		listIsActive(): boolean
		{
			const editorTick = this.editorTick;
			void editorTick;

			return (this.editor?.isActive('bulletList') || this.editor?.isActive('orderedList') || this.editor?.isActive('taskList')) ?? false;
		},
		linkIsActive(): boolean
		{
			const editorTick = this.editorTick;
			void editorTick;
			const href = this.editor?.getAttributes('link')?.href;

			return Boolean(this.editor?.isActive('link') || href);
		},
		highlightIsActive(): boolean
		{
			const editorTick = this.editorTick;
			void editorTick;

			return this.editor?.isActive('highlight') ?? false;
		},
		textColorIsActive(): boolean
		{
			const editorTick = this.editorTick;
			void editorTick;
			const color = this.editor?.getAttributes('textStyle')?.color;

			return Boolean(color);
		},
		hasOpenMenu(): boolean
		{
			return Boolean(this.openMenu);
		},
		toolbarStyle(): Object | null
		{
			if (!this.fixed)
			{
				return null;
			}

			return {
				position: 'fixed',
				top: `${this.fixedTop}px`,
				left: `${this.fixedLeft}px`,
				transform: 'translateX(-50%)',
				maxWidth: `${this.fixedMaxWidth}px`,
				zIndex: 100,
			};
		},
	},
	watch: {
		openMenu(nextOpenMenu)
		{
			if (nextOpenMenu !== 'more')
			{
				this.moreSubMode = 'menu';
				// Auto-apply the link on close (no explicit "Apply" button); commit is a no-op if unchanged.
				this.linkState.commit();
				this.linkState.close();
			}

			if (nextOpenMenu)
			{
				this.$nextTick(() => {
					this.syncOpenPopoverPosition();
				});

				return;
			}

			this.clearOpenPopoverOffsets();
		},
		moreSubMode(nextMode)
		{
			if (nextMode === 'link')
			{
				this.linkState.open();
			}
			else
			{
				// Auto-apply the link when leaving the link sub-mode; commit is a no-op if unchanged.
				this.linkState.commit();
				this.linkState.close();
			}

			this.$nextTick(() => {
				this.syncOpenPopoverPosition();
			});
		},
	},
	mounted()
	{
		Event.bind(document, 'click', this.handleDocumentClick, true);
		Event.bind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.bind(window, 'resize', this.handleWindowResize, { passive: true });
		document.addEventListener('scroll', this.handleWindowScroll, { capture: true, passive: true });
		this.$nextTick(() => this.updateScrollIndicator());
	},
	beforeUnmount()
	{
		Event.unbind(document, 'click', this.handleDocumentClick, true);
		Event.unbind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.unbind(window, 'resize', this.handleWindowResize);
		document.removeEventListener('scroll', this.handleWindowScroll, { capture: true });
		if (this.popoverSyncFrame !== null)
		{
			cancelAnimationFrame(this.popoverSyncFrame);
			this.popoverSyncFrame = null;
		}
		this.linkState.commit();
		this.linkState.close();
	},
	methods: {
		schedulePopoverPositionSync(): void
		{
			if (this.popoverSyncFrame !== null)
			{
				cancelAnimationFrame(this.popoverSyncFrame);
			}

			this.popoverSyncFrame = requestAnimationFrame(() => {
				this.popoverSyncFrame = null;
				this.syncOpenPopoverPosition();
			});
		},
		syncOpenPopoverPosition(): void
		{
			syncPopoverPositions({
				toolbarRoot: this.$refs.toolbarRoot,
				toolbarId: this.toolbarId,
			});
		},
		clearOpenPopoverOffsets(): void
		{
			clearPopoverOffsets(this.toolbarId);
		},
		handleToolbarScroll(): void
		{
			if (this.openMenu)
			{
				this.schedulePopoverPositionSync();
			}
			this.updateScrollIndicator();
		},
		handleWindowResize(): void
		{
			if (this.openMenu)
			{
				this.schedulePopoverPositionSync();
			}
			this.updateScrollIndicator();
		},
		updateScrollIndicator(): void
		{
			const s = this.$refs.toolbarScroll;
			const r = this.$refs.toolbarRoot;
			if (!s || !r)
			{
				return;
			}
			const overflow = s.scrollWidth - s.clientWidth;
			const track = Math.max(0, s.clientWidth - 32);
			const thumb = overflow > 1 ? Math.max(24, Math.min(track, s.clientWidth / s.scrollWidth * track)) : 0;
			const offset = overflow > 1 ? 16 + s.scrollLeft / overflow * (track - thumb) : 0;
			r.style.setProperty('--thumb-width', `${Math.round(thumb)}px`);
			r.style.setProperty('--thumb-offset', `${Math.round(offset)}px`);
		},
		handleThumbPointerDown(event: PointerEvent): void
		{
			const s = this.$refs.toolbarScroll;
			const overflow = s ? s.scrollWidth - s.clientWidth : 0;
			if (overflow <= 1)
			{
				return;
			}
			const track = Math.max(0, s.clientWidth - 32);
			const thumb = Math.max(24, Math.min(track, s.clientWidth / s.scrollWidth * track));
			const ratio = overflow / Math.max(1, track - thumb);
			const startX = event.clientX;
			const startScroll = s.scrollLeft;
			const target = event.currentTarget;
			target.setPointerCapture?.(event.pointerId);
			const move = (e: PointerEvent) => { s.scrollLeft = startScroll + (e.clientX - startX) * ratio; };
			const up = (e: PointerEvent) => {
				target.releasePointerCapture?.(e.pointerId);
				target.removeEventListener('pointermove', move);
				target.removeEventListener('pointerup', up);
				target.removeEventListener('pointercancel', up);
			};
			target.addEventListener('pointermove', move);
			target.addEventListener('pointerup', up);
			target.addEventListener('pointercancel', up);
			event.preventDefault();
		},
		handleWindowScroll(): void
		{
			if (this.openMenu)
			{
				this.schedulePopoverPositionSync();
			}
		},
		setLinkValue(value: string): void
		{
			this.linkState.setLinkValue(value);
		},
		toggleHeading(level: number): void
		{
			if (!this.editor)
			{
				return;
			}

			if (level === 0)
			{
				this.editor.commands.setParagraph();
			}
			else
			{
				this.editor.commands.toggleHeading({ level });
			}
		},
		setHighlightColor(value: string | null): void
		{
			if (!this.editor)
			{
				return;
			}

			if (!value)
			{
				if (this.editor.isActive('table'))
				{
					this.editor.commands.setCellAttribute('backgroundColor', null);
				}
				else
				{
					this.editor.commands.unsetHighlight();
				}

				return;
			}

			if (this.editor.isActive('table'))
			{
				this.editor.commands.setCellAttribute('backgroundColor', value);
			}
			else
			{
				this.editor.commands.setHighlight({ color: value });
			}
		},
		setTextColor(value: string | null): void
		{
			if (!this.editor)
			{
				return;
			}

			if (!value)
			{
				this.editor.commands.unsetColor();

				return;
			}

			this.editor.commands.setColor(value);
		},
		applyLink(): void
		{
			if (this.linkState.apply())
			{
				this.closeMenu();
			}
		},
		unsetLink(): void
		{
			this.linkState.unset();
			this.closeMenu();
		},
		toggleMenu(name: string): void
		{
			if (!this.editor?.isEditable)
			{
				return;
			}

			this.openMenu = this.openMenu === name ? null : name;
		},
		closeMenu(): void
		{
			this.openMenu = null;
		},
		setMoreSubMode(mode: string): void
		{
			this.moreSubMode = mode;
		},
		handleDocumentClick(event: Event): void
		{
			const root = this.$refs.toolbarRoot;
			if (!root)
			{
				return;
			}

			const target = event.target instanceof Element ? event.target : null;
			const popoverSelector = `.note-editor-popover[data-note-toolbar-owner="${this.toolbarId}"]`;
			const isInsidePopover = target ? Boolean(target.closest(popoverSelector)) : false;
			if (!root.contains(target) && !isInsidePopover)
			{
				this.openMenu = null;
			}
		},
		handleToolbarMouseDown(event: Event): void
		{
			const button = event.target?.closest('button');
			if (button)
			{
				event.preventDefault();
			}
		},
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (event.key === 'Escape')
			{
				this.openMenu = null;
			}
		},
		undo(): void
		{
			if (Type.isFunction(this.editor?.commands?.undo))
			{
				this.editor.commands.undo();
			}
		},
		redo(): void
		{
			if (Type.isFunction(this.editor?.commands?.redo))
			{
				this.editor.commands.redo();
			}
		},
		insertFileStub(): void
		{
			void this.$emit?.('insertFileStub', this.maxFileSize);
		},
		insertImageStub(): void
		{
			void this.$emit?.('insertImageStub', this.maxImageSize);
		},
		insertVideoStub(): void
		{
			void this.$emit?.('insertVideoStub', this.maxFileSize);
		},
	},
	// language=Vue
	template: `
		<div
			ref="toolbarRoot"
			class="note-editor-toolbar-wrap"
			:class="{
				'note-editor-toolbar-fixed': fixed,
				'note-editor-toolbar-menu-open': hasOpenMenu,
			}"
			:style="toolbarStyle"
			@mousedown="handleToolbarMouseDown"
		>
			<div ref="toolbarScroll" class="note-editor-toolbar" @scroll.passive="handleToolbarScroll">
			<ToolbarHistoryGroupComponent :can-undo="canUndo" :can-redo="canRedo" :on-undo="undo" :on-redo="redo" />
			<div class="note-editor-toolbar-separator"></div>

				<ToolbarHeadingGroupComponent
					:editor="editor"
					:heading-level="headingLevel"
					:is-open="openMenu === 'heading'"
					:popover-owner-id="toolbarId"
					:on-toggle-menu="toggleMenu"
					:on-close-menu="closeMenu"
					:on-toggle-heading="toggleHeading"
				/>
			<div class="note-editor-toolbar-separator"></div>

			<ToolbarTextStyleGroupComponent :editor="editor" :editor-tick="editorTick" />
			<div class="note-editor-toolbar-separator"></div>

			<ToolbarBlockGroupComponent :editor="editor" :editor-tick="editorTick" />
			<div class="note-editor-toolbar-separator"></div>

				<ToolbarCalloutGroupComponent
					:editor="editor"
					:editor-tick="editorTick"
					:is-open="openMenu === 'callout'"
					:popover-owner-id="toolbarId"
					:on-toggle-menu="toggleMenu"
					:on-close-menu="closeMenu"
				/>
			<div class="note-editor-toolbar-separator"></div>

			<ToolbarScriptGroupComponent :editor="editor" :editor-tick="editorTick" />
			<div class="note-editor-toolbar-separator"></div>

			<ToolbarAlignGroupComponent :editor="editor" :editor-tick="editorTick" />
			<div class="note-editor-toolbar-separator"></div>

				<ToolbarInsertGroupComponent
					:editor="editor"
					:editor-tick="editorTick"
					:list-is-active="listIsActive"
					:is-list-open="openMenu === 'list'"
					:popover-owner-id="toolbarId"
					:on-toggle-menu="toggleMenu"
					:on-close-menu="closeMenu"
				/>
			<div class="note-editor-toolbar-separator"></div>

				<ToolbarHighlightLinkGroupComponent
					:editor="editor"
					:editor-tick="editorTick"
					:highlight-is-active="highlightIsActive"
					:text-color-is-active="textColorIsActive"
					:on-close-menu="closeMenu"
					:on-set-highlight-color="setHighlightColor"
					:on-set-text-color="setTextColor"
				/>
			<div class="note-editor-toolbar-separator"></div>

			<ToolbarMoreGroupComponent
				:editor="editor"
				:editor-tick="editorTick"
				:is-open="openMenu === 'more'"
				:sub-mode="moreSubMode"
				:insert-table-disabled="insertTableDisabled"
				:link-value="linkValue"
				:link-is-active="linkIsActive"
				:popover-owner-id="toolbarId"
				:on-toggle-menu="toggleMenu"
				:on-close-menu="closeMenu"
				:on-set-sub-mode="setMoreSubMode"
				:on-apply-link="applyLink"
				:on-unset-link="unsetLink"
				:on-link-value-change="setLinkValue"
				:on-insert-file="insertFileStub"
				:on-insert-image="insertImageStub"
				:on-insert-video="insertVideoStub"
			/>
			</div>
			<div class="note-editor-toolbar-thumb" aria-hidden="true" @pointerdown="handleThumbPointerDown"></div>
		</div>
	`,
};
