import {
	BLUR_COMMAND,
	COMMAND_PRIORITY_CRITICAL,
	FOCUS_COMMAND,
	SELECTION_CHANGE_COMMAND,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	type BaseSelection,
	type ElementNode,
	type LexicalNode,
	type RangeSelection,
	type TextFormatType,
} from 'ui.lexical.core';
import { batch, computed, signal, type ReadonlySignal, type Signal } from 'ui.lexical.extension';
import { $isListNode } from 'ui.lexical.list';
import { mergeRegister } from 'ui.lexical.utils';

import { type TextEditor } from '../text-editor';
import { $isUnformatted } from '../helpers/is-unformatted';
import { type ToolbarBlockTypeNode } from '../types/toolbar-block-type-node';

/** How long a blur is tolerated before the active state is dropped, in milliseconds. */
const BLUR_GRACE_PERIOD = 400;

type Snapshot = {
	insideUnformatted: boolean,
	formats: Set<string>,
	blockTypes: Set<string>,
};

/**
 * Derives the toolbar-facing state of the current selection once per revision, so that every
 * toolbar of the editor reads one computation instead of deriving its own.
 *
 * @internal reached through TextEditor.getSelectionState(); not part of the public editor API.
 */
export class SelectionState
{
	#editor: TextEditor = null!;
	#revision: Signal<number> = signal(0);
	#selectionVisible: Signal<boolean> = signal(true);
	#requestedFormats: Set<string> = new Set();
	#formatSignals: Map<string, ReadonlySignal<boolean>> = new Map();
	#blockTypeSignals: Map<string, ReadonlySignal<boolean>> = new Map();
	#disabledSignals: Map<string, ReadonlySignal<boolean>> = new Map();
	#timeoutId: number | null = null;
	#removeListeners: () => void = () => {};
	#snapshot: ReadonlySignal<Snapshot>;

	constructor(editor: TextEditor)
	{
		this.#editor = editor;
		this.#snapshot = computed((): Snapshot => {
			void this.#revision.value;

			return this.#editor.getEditorState().read((): Snapshot => this.#derive());
		});

		this.#removeListeners = this.#registerListeners();
	}

	getRevisionSignal(): ReadonlySignal<number>
	{
		return this.#revision;
	}

	/**
	 * Invalidates the snapshot without any editor change. The one thing the class cannot observe
	 * is an opaque disable callback whose answer depends on the world outside the document — a
	 * finished upload, an ajax reply — so its owner has to say when the answer may have changed.
	 */
	invalidate(): void
	{
		this.#revision.value += 1;
	}

	/**
	 * Requesting a format that was never asked for before writes to the revision signal, so this
	 * must not be called from inside a `computed` or an `effect` — ask for the signal first and
	 * read it there.
	 */
	formatActive(format: string): ReadonlySignal<boolean>
	{
		let existing = this.#formatSignals.get(format);
		if (existing === undefined)
		{
			// a format nobody asked for is not collected, so requesting one invalidates the snapshot
			this.#requestedFormats.add(format);
			this.#revision.value += 1;

			existing = computed((): boolean => {
				return this.#selectionVisible.value && this.#snapshot.value.formats.has(format);
			});
			this.#formatSignals.set(format, existing);
		}

		return existing;
	}

	blockTypeActive(type: string): ReadonlySignal<boolean>
	{
		let existing = this.#blockTypeSignals.get(type);
		if (existing === undefined)
		{
			existing = computed((): boolean => {
				return this.#selectionVisible.value && this.#snapshot.value.blockTypes.has(type);
			});
			this.#blockTypeSignals.set(type, existing);
		}

		return existing;
	}

	disabled(insideUnformattedMatters: boolean): ReadonlySignal<boolean>
	{
		const key = String(insideUnformattedMatters);
		let existing = this.#disabledSignals.get(key);
		if (existing === undefined)
		{
			existing = computed((): boolean => {
				if (!this.#editor.getEditableSignal().value)
				{
					return true;
				}

				return insideUnformattedMatters && this.#snapshot.value.insideUnformatted;
			});
			this.#disabledSignals.set(key, existing);
		}

		return existing;
	}

	destroy(): void
	{
		this.#removeListeners();

		if (this.#timeoutId !== null)
		{
			clearTimeout(this.#timeoutId);
			this.#timeoutId = null;
		}
	}

	#registerListeners(): () => void
	{
		return mergeRegister(
			this.#editor.registerCommand(
				SELECTION_CHANGE_COMMAND,
				(): boolean => {
					// the blank a blur leaves behind lasts only until the selection speaks again.
					// The revision is not bumped here: the command is handled inside the update that
					// carries the new selection, while getEditorState() still returns the committed
					// one, so deriving now would read the previous caret position and be thrown away
					// by the update listener a moment later
					this.#selectionVisible.value = true;

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.#editor.registerCommand(
				FOCUS_COMMAND,
				(): boolean => {
					if (this.#timeoutId !== null)
					{
						clearTimeout(this.#timeoutId);
						this.#timeoutId = null;
					}

					this.#selectionVisible.value = true;

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.#editor.registerCommand(
				BLUR_COMMAND,
				(): boolean => {
					if (this.#timeoutId !== null)
					{
						clearTimeout(this.#timeoutId);
					}

					this.#timeoutId = setTimeout((): void => {
						this.#timeoutId = null;
						const activeElement = document.activeElement;
						// the toolbar is a tab stop of its own and a sibling of the scroller, not its
						// descendant, so containment has to be measured against the whole editor
						const editorRoot = this.#editor.getRootContainer();
						if (activeElement === null || !editorRoot.contains(activeElement))
						{
							this.#selectionVisible.value = false;
						}
					}, BLUR_GRACE_PERIOD);

					return false;
				},
				COMMAND_PRIORITY_CRITICAL,
			),
			this.#editor.registerUpdateListener((): void => {
				batch((): void => {
					this.#selectionVisible.value = true;
					this.#revision.value += 1;
				});
			}),
		);
	}

	#derive(): Snapshot
	{
		const selection: BaseSelection | null = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return { insideUnformatted: false, formats: new Set(), blockTypes: new Set() };
		}

		const rangeSelection: RangeSelection = selection;
		const formats = new Set<string>();
		this.#requestedFormats.forEach((format: string): void => {
			if (rangeSelection.hasFormat(format as TextFormatType))
			{
				formats.add(format);
			}
		});

		// the unformatted flag and the block types live on the same chain of ancestors,
		// so one walk from the anchor to the root answers both
		const blockTypes = new Set<string>();
		let insideUnformatted = false;
		const root = $getRoot();
		let currentNode: ElementNode | LexicalNode | null = rangeSelection.anchor.getNode();
		while (currentNode !== root && currentNode !== null)
		{
			blockTypes.add(this.#getBlockType(currentNode));
			if ($isUnformatted(currentNode))
			{
				insideUnformatted = true;
			}

			currentNode = currentNode.getParent();
		}

		return { insideUnformatted, formats, blockTypes };
	}

	#getBlockType(node: LexicalNode): string
	{
		const declared: string | undefined = (node as ToolbarBlockTypeNode).getToolbarBlockType?.();
		if (declared !== undefined)
		{
			return declared;
		}

		// the vendor list node has no say in the matter: which button its type answers to is
		// decided here, by the two list buttons of the toolbar
		return $isListNode(node) ? node.getListType() : node.getType();
	}
}
