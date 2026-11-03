import { Tag, Runtime, Event } from 'main.core';
import { Popup } from 'main.popup';
import {
	$isTextNode,
	$getSelection,
	$isRangeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	COMMAND_PRIORITY_LOW,
} from 'ui.lexical.core';
import { $findMatchingParent, mergeRegister } from 'ui.lexical.utils';

import { DIALOG_VISIBILITY_COMMAND, HIDE_DIALOG_COMMAND } from '../../commands';
import { $adjustDialogPosition, clearDialogPosition } from '../../helpers/adjust-dialog-position';
import { type SelectionPosition } from '../../helpers/get-selection-position';
import { getAriaMessage } from '../../helpers/aria-message';
import { getSelectedNode } from '../../helpers/get-selected-node';
import { type TextEditor } from '../../text-editor';
import { Toolbar } from '../../toolbar/toolbar';
import { $isInsideUnformatted } from '../../helpers/is-unformatted';
import { type TextEditorOptions } from '../../types/text-editor-options';
import { type ToolbarOptions } from '../../types/toolbar-options';
import { BasePlugin } from '../base-plugin';

export class FloatingToolbarPlugin extends BasePlugin
{
	#popup: Popup | null = null;
	#toolbar: Toolbar | null = null;
	#showDebounced: Function | null = null;
	#onEditorScroll: () => void = this.#handleEditorScroll.bind(this);
	#positionFrameRequested: boolean = false;

	constructor(editor: TextEditor)
	{
		super(editor);

		this.#showDebounced = Runtime.debounce(() => {
			// Runtime.debounce hands out no handle to cancel with, so the deferred call has to be
			// stopped by a check instead: the editor may already be destroyed by the time it arrives
			if (this.isDestroyed())
			{
				return;
			}

			this.getEditor().update(() => {
				if (this.#shouldShowDialog())
				{
					this.#show();
				}
			});
		}, 700);
	}

	static getName(): string
	{
		return 'FloatingToolbar';
	}

	static getDefaultOptions(): TextEditorOptions
	{
		return { floatingToolbar: [] } as TextEditorOptions;
	}

	afterInit(): () => void
	{
		const toolbarOptions = this.getEditor().getOption<ToolbarOptions>('floatingToolbar', []);
		this.#toolbar = new Toolbar(this.getEditor(), toolbarOptions, 'ui-text-editor-floating-toolbar');
		if (!this.#toolbar.isEmpty())
		{
			this.cleanUpRegister(this.#registerListeners());
		}

		return (): void => {
			this.#toolbar!.destroy();
			this.#toolbar = null;
		};
	}

	#registerListeners(): () => void
	{
		return mergeRegister(
			this.getEditor().registerCommand(
				SELECTION_CHANGE_COMMAND,
				() => {
					this.update();

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.getEditor().registerUpdateListener(({ editorState }) => {
				editorState.read(() => {
					this.update();
				});
			}),
			this.getEditor().registerCommand(
				HIDE_DIALOG_COMMAND,
				(): boolean => {
					this.hide();

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	update(): void
	{
		if (this.#shouldShowDialog())
		{
			if (this.getPopup().isShown())
			{
				this.#show();
			}
			else
			{
				this.#showDebounced!();
			}
		}
		else
		{
			this.hide();
		}
	}

	#show()
	{
		this.getPopup().show();
		clearDialogPosition(this.getPopup());
		this.#adjustDialogPosition();
	}

	#adjustDialogPosition(): boolean
	{
		return $adjustDialogPosition(this.getPopup(), this.getEditor(), this.#initDialogPosition);
	}

	#initDialogPosition(selectionPosition: SelectionPosition): string
	{
		const { isBackward, isMultiline } = selectionPosition as { isBackward: boolean, isMultiline: boolean };

		return isBackward || !isMultiline ? 'top' : 'bottom';
	}

	#handleEditorScroll(): void
	{
		if (this.#positionFrameRequested)
		{
			return;
		}

		// a scroll only moves the popup, so the committed state is enough: a fresh
		// editor.update() clones the whole node map, and one scroll gesture brings a burst
		// of events -- the frame folds them into a single positioning pass
		this.#positionFrameRequested = true;
		this.registerAnimationFrame((): void => {
			this.#positionFrameRequested = false;
			this.getEditor().getEditorState().read((): void => {
				this.#adjustDialogPosition();
			});
		});
	}

	#shouldShowDialog(): boolean
	{
		if (this.getEditor().isComposing() || !this.getEditor().isEditable())
		{
			return false;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection) || selection.isCollapsed())
		{
			return false;
		}

		const nativeSelection = window.getSelection();
		if (nativeSelection === null || nativeSelection.isCollapsed)
		{
			return false;
		}

		const scrollerContainer = this.getEditor().getScrollerContainer();
		if (!scrollerContainer.contains(nativeSelection.anchorNode))
		{
			return false;
		}

		if ($isInsideUnformatted(selection.anchor.getNode()))
		{
			return false;
		}

		// a selection of nothing but line breaks has no text to format, and an empty one
		// is covered by the same check
		if (selection.getTextContent().replaceAll('\n', '') === '')
		{
			return false;
		}

		const isSomeDialogVisible = this.getEditor().dispatchCommand(DIALOG_VISIBILITY_COMMAND);
		if (isSomeDialogVisible)
		{
			return false;
		}

		const node = getSelectedNode(selection);

		return $isTextNode(node);
	}

	getPopup(): Popup
	{
		if (this.#popup === null)
		{
			const container = Tag.render`<div class="ui-text-editor-floating-toolbar"></div>`;
			this.#popup = new Popup({
				closeByEsc: true,
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_FORMATTING_ARIA') ?? undefined,
				// Keeping the panel in the body is deliberate. Moving it into the scroller would put
				// it next to the editor in the tab order, but the scroller clips on overflow: the
				// panel lands outside the visible box and gives the editor a scrollbar of its own.
				targetContainer: document.body,
				autoHide: true,
				content: container,
				autoHideHandler: (event: MouseEvent): boolean => {
					let collapsed = true;
					const nativeSelection = window.getSelection();
					if (nativeSelection!.isCollapsed)
					{
						return true;
					}

					this.getEditor().update(() => {
						const selection = $getSelection();
						collapsed = selection === null || selection.isCollapsed();
					});

					return collapsed;
				},
				events: {
					onShow: () => {
						if (this.#adjustDialogPosition())
						{
							Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
								signal: this.getAbortSignal(),
							});
						}
					},
					onClose: () => {
						Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
						clearDialogPosition(this.getPopup());
					},
				},
			});

			this.#toolbar!.renderTo(container);
		}

		return this.#popup;
	}

	hide()
	{
		if (this.#popup === null)
		{
			return;
		}

		this.getPopup().close();
	}

	destroy(): void
	{
		super.destroy();

		if (this.#popup !== null)
		{
			this.#popup.destroy();
			this.#popup = null;
		}
	}
}
