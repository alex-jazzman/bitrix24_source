import { Loc } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';
import {
	UNDO_COMMAND,
	REDO_COMMAND,
} from 'ui.lexical.core';
import { batch, computed, signal, type ReadonlySignal, type Signal } from 'ui.lexical.extension';
import { registerHistory, createEmptyHistoryState, type HistoryState } from 'ui.lexical.history';

import { getKeystrokeCaption } from '../../helpers/platform-shortcut';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { BasePlugin } from '../base-plugin';

const MERGE_DELAY = 1000;

export class HistoryPlugin extends BasePlugin
{
	readonly #canUndo: Signal<boolean> = signal(false);
	readonly #canRedo: Signal<boolean> = signal(false);

	readonly #undoDisabled: ReadonlySignal<boolean> = computed((): boolean => {
		return !this.#canUndo.value || !this.getEditor().getEditableSignal().value;
	});

	readonly #redoDisabled: ReadonlySignal<boolean> = computed((): boolean => {
		return !this.#canRedo.value || !this.getEditor().getEditableSignal().value;
	});

	constructor(editor: TextEditor)
	{
		super(editor);

		const historyState = createEmptyHistoryState();
		this.cleanUpRegister(registerHistory(
			editor.getLexicalEditor(),
			historyState,
			MERGE_DELAY,
			undefined,
			(state: HistoryState): void => {
				batch((): void => {
					this.#canUndo.value = state.undoStack.length > 0;
					this.#canRedo.value = state.redoStack.length > 0;
				});
			},
		));

		this.#registerComponents();
	}

	static getName(): string
	{
		return 'History';
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('undo', (): Button => {
				return this.#createButton({
					icon: Outline.UNDO,
					tooltip: Loc.getMessage('TEXT_EDITOR_BTN_UNDO', {
						'#keystroke#': getKeystrokeCaption({ mac: '⌘Z', other: 'Ctrl+Z' }),
					}) as string | null,
					disabled: this.#undoDisabled,
					command: UNDO_COMMAND,
				});
			});

		this.getEditor()
			.getComponentRegistry()
			.register('redo', (): Button => {
				return this.#createButton({
					icon: Outline.REDO,
					tooltip: Loc.getMessage('TEXT_EDITOR_BTN_REDO', {
						'#keystroke#': getKeystrokeCaption({ mac: '⌘⇧Z', other: 'Ctrl+Y' }),
					}) as string | null,
					disabled: this.#redoDisabled,
					command: REDO_COMMAND,
				});
			});
	}

	#createButton(options: {
		icon: string,
		tooltip: string | null,
		disabled: ReadonlySignal<boolean>,
		command: Parameters<TextEditor['dispatchCommand']>[0],
	}): Button
	{
		const button: Button = new Button();
		button.setIcon(options.icon);
		button.setTooltip(options.tooltip);
		button.bindDisabled(options.disabled);
		button.subscribe('onClick', (): void => {
			this.getEditor().dispatchCommand(options.command);
		});

		return button;
	}
}
