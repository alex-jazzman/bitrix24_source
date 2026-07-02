import { reactive } from 'vue';
import { Event } from 'main.core';
import { LinkEditingState } from '../services/link-editing-state';
import { findLinkMarkRangeAtPos } from '../services/link-editing';
import { LinkEditFormComponent } from './toolbar/link-edit-form';

const VIEWPORT_PADDING = 8;
const ANCHOR_GAP = 6;

export const LinkFloatingPopupComponent = {
	name: 'NoteLinkFloatingPopup',
	components: {
		LinkEditForm: LinkEditFormComponent,
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
	},
	data()
	{
		return {
			visible: false,
			posX: 0,
			posY: 0,
		};
	},
	created()
	{
		this.linkState = reactive(new LinkEditingState({
			getEditor: () => this.editor,
		}));
		this.currentAnchor = null;
	},
	mounted()
	{
		this.handleDocumentClick = this.handleDocumentClick.bind(this);
		this.handleDocumentKeydown = this.handleDocumentKeydown.bind(this);
		this.handleViewportChange = this.handleViewportChange.bind(this);

		Event.bind(document, 'click', this.handleDocumentClick, true);
		Event.bind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.bind(window, 'scroll', this.handleViewportChange, { passive: true, capture: true });
		Event.bind(window, 'resize', this.handleViewportChange, { passive: true });
	},
	beforeUnmount()
	{
		Event.unbind(document, 'click', this.handleDocumentClick, true);
		Event.unbind(document, 'keydown', this.handleDocumentKeydown, true);
		Event.unbind(window, 'scroll', this.handleViewportChange, true);
		Event.unbind(window, 'resize', this.handleViewportChange);
		this.linkState.close();
	},
	methods: {
		handleDocumentClick(event: MouseEvent): void
		{
			const target = event.target instanceof Element ? event.target : null;
			if (!target)
			{
				return;
			}

			if (this.visible)
			{
				const popup = this.$refs.popup;
				if (popup instanceof HTMLElement && popup.contains(target))
				{
					return;
				}
			}

			const editor = this.editor;
			if (!editor?.isEditable)
			{
				if (this.visible)
				{
					this.close();
				}

				return;
			}

			const editorDom = editor.view?.dom;
			if (!(editorDom instanceof HTMLElement) || !editorDom.contains(target))
			{
				if (this.visible)
				{
					this.close();
				}

				return;
			}

			const anchor = target.closest('a[href]');
			if (!(anchor instanceof HTMLAnchorElement))
			{
				if (this.visible)
				{
					this.close();
				}

				return;
			}

			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
			{
				return;
			}

			let pos = null;
			try
			{
				pos = editor.view.posAtDOM(anchor, 0);
			}
			catch (error)
			{
				pos = null;
			}

			if (!Number.isInteger(pos))
			{
				return;
			}

			const range = findLinkMarkRangeAtPos(editor, pos);
			if (!range)
			{
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			editor.commands.setTextSelection(range);
			this.linkState.open();
			this.openAt(anchor);
		},
		openAt(anchor: HTMLAnchorElement): void
		{
			this.currentAnchor = anchor;
			const rect = anchor.getBoundingClientRect();
			this.posX = Math.round(rect.left);
			this.posY = Math.round(rect.top - ANCHOR_GAP);
			this.visible = true;

			this.$nextTick(() => {
				this.adjustPosition();
			});
		},
		adjustPosition(): void
		{
			const popup = this.$refs.popup;
			const anchor = this.currentAnchor;
			if (!(popup instanceof HTMLElement) || !(anchor instanceof HTMLElement))
			{
				return;
			}

			const anchorRect = anchor.getBoundingClientRect();
			const popupRect = popup.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let nextTop = Math.round(anchorRect.top - popupRect.height - ANCHOR_GAP);
			if (nextTop < VIEWPORT_PADDING)
			{
				nextTop = Math.round(anchorRect.bottom + ANCHOR_GAP);
			}

			if (nextTop + popupRect.height > viewportHeight - VIEWPORT_PADDING)
			{
				nextTop = Math.max(VIEWPORT_PADDING, viewportHeight - popupRect.height - VIEWPORT_PADDING);
			}

			let nextLeft = Math.round(anchorRect.left);
			const maxLeft = viewportWidth - popupRect.width - VIEWPORT_PADDING;
			if (nextLeft > maxLeft)
			{
				nextLeft = maxLeft;
			}
			if (nextLeft < VIEWPORT_PADDING)
			{
				nextLeft = VIEWPORT_PADDING;
			}

			this.posX = nextLeft;
			this.posY = nextTop;
		},
		close(): void
		{
			if (!this.visible)
			{
				return;
			}

			this.visible = false;
			this.currentAnchor = null;
			this.linkState.close();
		},
		handleDocumentKeydown(event: KeyboardEvent): void
		{
			if (!this.visible)
			{
				return;
			}

			if (event.key === 'Escape')
			{
				event.preventDefault();
				this.close();
			}
		},
		handleViewportChange(): void
		{
			if (this.visible)
			{
				this.close();
			}
		},
		handleApply(): void
		{
			if (this.linkState.apply())
			{
				this.close();
			}
		},
		handleUnset(): void
		{
			this.linkState.unset();
			this.close();
		},
		handleLinkValueChange(value: string): void
		{
			this.linkState.setLinkValue(value);
		},
	},
	// language=Vue
	template: `
		<teleport to="#note-editor-app">
			<div
				v-if="visible"
				ref="popup"
				class="note-editor-popover note-editor-popover--floating"
				:style="{ position: 'fixed', left: posX + 'px', top: posY + 'px' }"
			>
				<div class="note-editor-popover-card">
					<LinkEditForm
						:editor="editor"
						:editor-tick="editorTick"
						:link-value="linkState.linkValue"
						:link-is-active="true"
						:autofocus="true"
						@update:link-value="handleLinkValueChange"
						@apply="handleApply"
						@unset="handleUnset"
					/>
				</div>
			</div>
		</teleport>
	`,
};
