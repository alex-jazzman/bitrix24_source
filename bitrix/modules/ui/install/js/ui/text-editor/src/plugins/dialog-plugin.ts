import { Event } from 'main.core';
import { type Popup } from 'main.popup';
import { COMMAND_PRIORITY_LOW, type RangeSelection } from 'ui.lexical.core';
import { mergeRegister } from 'ui.lexical.utils';

import { DIALOG_VISIBILITY_COMMAND, HIDE_DIALOG_COMMAND } from '../commands';
import { $adjustDialogPosition } from '../helpers/adjust-dialog-position';
import { RememberedSelection } from '../helpers/remembered-selection';
import { returnFocusToEditor } from '../helpers/return-focus-to-editor';
import { BasePlugin } from './base-plugin';

export interface EditorDialog
{
	getPopup(): Popup;
	isShown(): boolean;
	destroy(): void;
}

/**
 * A plugin whose button opens a popup bound to the caret: link, image, video.
 *
 * The lifecycle is the same for all of them: remember the selection the dialog was opened on,
 * place the popup at it, follow the editor scroll while it stays open, and on close put the
 * selection and the keyboard focus back into the editable.
 */
export class DialogPlugin<TDialog extends EditorDialog> extends BasePlugin
{
	#dialog: TDialog | null = null;
	#lastSelection: RememberedSelection = new RememberedSelection();
	#positionFrameRequested: boolean = false;
	#onEditorScroll: () => void = this.#handleEditorScroll.bind(this);

	getDialog(): TDialog | null
	{
		return this.#dialog;
	}

	setDialog(dialog: TDialog | null): void
	{
		this.#dialog = dialog;
	}

	isDialogShown(): boolean
	{
		return this.#dialog !== null && this.#dialog.isShown();
	}

	rememberSelection(selection: RangeSelection): void
	{
		this.#lastSelection.remember(selection);
	}

	forgetSelection(): void
	{
		this.#lastSelection.forget();
	}

	/** Puts the remembered caret back; see RememberedSelection for why it may decline. */
	restoreSelection(): boolean
	{
		return this.#lastSelection.restore();
	}

	/** Places the popup at the caret and, once it landed there, starts following the scroll. */
	attachDialogToSelection(): void
	{
		if ($adjustDialogPosition(this.#dialog!.getPopup(), this.getEditor()))
		{
			Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
				signal: this.getAbortSignal(),
			});
			this.getEditor().highlightSelection();
		}
	}

	/**
	 * The two commands every dialog plugin answers alike: another dialog opening closes this one,
	 * and the editor asks whether a dialog of this plugin is up. The sender tag is what keeps the
	 * plugin from closing its own dialog on the very command that announces it.
	 */
	registerDialogCommands(sender: string): () => void
	{
		return mergeRegister(
			this.getEditor().registerCommand(
				HIDE_DIALOG_COMMAND,
				(payload): boolean => {
					if (payload?.sender === sender)
					{
						return false;
					}

					this.forgetSelection();
					this.getDialog()?.destroy();

					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				DIALOG_VISIBILITY_COMMAND,
				(): boolean => {
					return this.isDialogShown();
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	handleDialogDestroy(): void
	{
		if (this.#dialog === null)
		{
			return;
		}

		this.#dialog = null;
		Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
		this.getEditor().resetHighlightSelection();

		// Putting the caret and the keyboard focus back belongs to a user closing the dialog. On
		// teardown the same callback arrives from destroy(), and by then the editor is losing its
		// root element: the update would commit into a dying editor and focus() would pull the
		// user off whatever they moved to after the editor went away.
		if (this.isDestroyed())
		{
			return;
		}

		this.getEditor().update(() => {
			this.restoreSelection();
			returnFocusToEditor(this.getEditor());
		});
	}

	destroy(): void
	{
		super.destroy();

		this.#dialog?.destroy();
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
			if (this.#dialog === null)
			{
				return;
			}

			this.getEditor().getEditorState().read((): void => {
				$adjustDialogPosition(this.#dialog!.getPopup(), this.getEditor());
			});
		});
	}
}
