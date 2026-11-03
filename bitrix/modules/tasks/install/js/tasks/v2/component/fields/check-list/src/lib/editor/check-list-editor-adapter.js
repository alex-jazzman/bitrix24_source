import { Dom, Type } from 'main.core';
import { CheckListBbCode, ChecklistFormattingAction } from 'tasks.v2.lib.check-list-bb-code';
import { BasicEditor, Constants } from 'ui.text-editor';
import {
	$createRangeSelection,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	$selectAll,
	$setSelection,
	COMMAND_PRIORITY_HIGH,
	FORMAT_TEXT_COMMAND,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	KEY_DOWN_COMMAND,
	KEY_TAB_COMMAND,
	PASTE_COMMAND,
	SELECTION_CHANGE_COMMAND,
	type ElementNode,
	type RangeSelection,
	type TextNode,
} from 'ui.lexical.core';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from 'ui.lexical.link';
import { $isAtNodeEnd } from 'ui.lexical.selection';
import { $findMatchingParent } from 'ui.lexical.utils';

import { CheckListLinkPlugin } from './check-list-link-plugin';

const FormattingByAction = Object.freeze({
	[ChecklistFormattingAction.Bold]: 'bold',
	[ChecklistFormattingAction.Italic]: 'italic',
	[ChecklistFormattingAction.Underline]: 'underline',
	[ChecklistFormattingAction.Strikethrough]: 'strikethrough',
});

const FormattingActionByCode = Object.freeze({
	KeyB: ChecklistFormattingAction.Bold,
	KeyI: ChecklistFormattingAction.Italic,
	KeyU: ChecklistFormattingAction.Underline,
	KeyS: ChecklistFormattingAction.Strikethrough,
});

export const getFormattingActionFromKeyboardEvent = (event: KeyboardEvent): ?string => {
	if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey)
	{
		return null;
	}

	return FormattingActionByCode[event.code] ?? null;
};

// Port of the non-exported ui.text-editor helper of the same name.
const getSelectedNode = (selection: RangeSelection): TextNode | ElementNode => {
	const anchorNode = selection.anchor.getNode();
	const focusNode = selection.focus.getNode();
	if (anchorNode === focusNode)
	{
		return anchorNode;
	}

	const startPoint = selection.isBackward() ? selection.focus : selection.anchor;

	return $isAtNodeEnd(startPoint) ? anchorNode : focusNode;
};

// Port of the non-exported ui.text-editor helpers `getSelectionRect` and `$getSelectionPosition`,
// narrowed to the caret end of a live native selection: no scroll offsets and no vertical gap.
const getNativeSelectionAnchorRect = (nativeSelection: Selection): ?Object => {
	const range = nativeSelection.getRangeAt(0);
	const isBackward = range.startContainer !== nativeSelection.anchorNode
		|| range.startOffset !== nativeSelection.anchorOffset
	;
	const rects = range.getClientRects();
	// The caret line is taken as it comes: `top === 0` is where a line at the top edge of the window
	// stands, not a sign of a missing rectangle. Only a range without rectangles at all degrades.
	let rect = rects[isBackward ? 0 : rects.length - 1];
	if (!rect)
	{
		const { anchorNode } = nativeSelection;
		if (!Type.isFunction(anchorNode?.getBoundingClientRect))
		{
			return null;
		}

		rect = anchorNode.getBoundingClientRect();
	}

	return {
		x: isBackward ? rect.left : rect.right,
		top: rect.top,
		bottom: rect.bottom,
	};
};

// The document comes from the editor: a checklist is shown in a slider and in a card popup of its own.
// `caretPositionFromPoint` is the standard API, `caretRangeFromPoint` its WebKit-only predecessor.
const createCaretRangeFromPoint = (ownerDocument: Document, { x, y }: { x: number, y: number }): ?Range => {
	if (Type.isFunction(ownerDocument.caretPositionFromPoint))
	{
		const position = ownerDocument.caretPositionFromPoint(x, y);
		if (!position)
		{
			return null;
		}

		const range = ownerDocument.createRange();
		range.setStart(position.offsetNode, position.offset);
		range.collapse(true);

		return range;
	}

	if (!Type.isFunction(ownerDocument.caretRangeFromPoint))
	{
		return null;
	}

	const range = ownerDocument.caretRangeFromPoint(x, y);
	range?.collapse(true);

	return range;
};

export class CheckListEditorAdapter
{
	#editor = null;
	#editorFactory: Function;
	#onChange: Function;
	#onSelectionChange: Function;
	#activeSession = null;
	#changeHandler: Function = null;
	#generation: number = 0;
	#destroyed: boolean = false;
	#managedAriaAttributes: Set<string> = new Set();

	constructor(options: Object = {})
	{
		this.#editorFactory = Type.isFunction(options.editorFactory)
			? options.editorFactory
			: (editorOptions) => new BasicEditor(editorOptions)
		;
		this.#onChange = Type.isFunction(options.onChange) ? options.onChange : () => {};
		this.#onSelectionChange = Type.isFunction(options.onSelectionChange)
			? options.onSelectionChange
			: () => {}
		;
	}

	activate({ itemId, source, container, aria, selection = null, handlers = {} }: Object): Object | null
	{
		if (this.#destroyed || !Type.isElementNode(container))
		{
			return null;
		}

		const editor = this.#getEditor();
		if (this.#activeSession?.itemId === itemId)
		{
			this.#activeSession.handlers = handlers;
			editor.renderTo(container);
			this.#applyAria(aria);
			if (selection)
			{
				this.restoreSelection(selection);
			}

			return null;
		}

		const previousSession = this.deactivate('switch');
		editor.renderTo(container);
		this.#applyAria(aria);

		const prepared = CheckListBbCode.prepareForEditor(source);
		const generation = ++this.#generation;
		this.#activeSession = {
			itemId,
			originalSource: prepared.originalSource,
			currentSource: prepared.originalSource,
			dirty: false,
			generation,
			handlers,
		};

		this.#unsubscribeFromChanges();
		editor.setText(prepared.editorSource, { discrete: true });
		editor.clearHistory();
		this.#subscribeToChanges(itemId, generation);

		if (selection)
		{
			this.restoreSelection(selection);
		}

		return previousSession;
	}

	isActive(itemId: number | string): boolean
	{
		return String(this.#activeSession?.itemId) === String(itemId);
	}

	getActiveItemId(): number | string | null
	{
		return this.#activeSession?.itemId ?? null;
	}

	isDirty(): boolean
	{
		return this.#activeSession?.dirty === true;
	}

	replaceSource(itemId: number | string, source: string): Object
	{
		if (!this.isActive(itemId) || !this.#editor)
		{
			return { status: 'inactive' };
		}
		if (source === this.#activeSession.currentSource)
		{
			return { status: 'current' };
		}

		if (this.#activeSession.dirty)
		{
			return {
				status: 'conflict',
				itemId,
				localSource: this.#serializeSession(this.#activeSession),
				externalSource: source,
			};
		}

		const prepared = CheckListBbCode.prepareForEditor(source);
		const generation = ++this.#generation;
		this.#unsubscribeFromChanges();
		this.#activeSession = {
			...this.#activeSession,
			originalSource: prepared.originalSource,
			currentSource: prepared.originalSource,
			dirty: false,
			generation,
		};
		this.#editor.setText(prepared.editorSource, { discrete: true });
		this.#editor.clearHistory();
		this.#subscribeToChanges(itemId, generation);

		return { status: 'replaced', generation };
	}

	deactivate(reason: string = 'deactivate'): Object | null
	{
		if (!this.#activeSession || !this.#editor)
		{
			return null;
		}

		const session = this.#activeSession;
		const source = this.#serializeSession(session);
		this.#unsubscribeFromChanges();
		this.#editor.clearHistory();
		this.#editor.update((): void => $setSelection(null), { discrete: true });
		this.#editor.setRootElement(null);
		Dom.remove(this.#editor.getRootContainer());
		this.#activeSession = null;
		this.#generation++;

		return {
			itemId: session.itemId,
			source,
			dirty: session.dirty,
			reason,
		};
	}

	focus(point: ?{ x: number, y: number } = null): void
	{
		if (point && this.#editor && this.#activeSession)
		{
			this.#selectAtPoint(point);
		}

		this.#editor?.focus(null, { defaultSelection: 'rootEnd' });
	}

	/**
	 * The browser drops a drag whose element has gone, and the press that raises the editor removes
	 * exactly that element -- the read-only title it replaces. The rest of such a drag is followed
	 * here, from the caret left at the press point to the position under the pointer.
	 */
	extendSelectionTo(point: { x: number, y: number }): void
	{
		if (!this.#editor || !this.#activeSession)
		{
			return;
		}

		const editable = this.#editor.getEditableContainer();
		const range = createCaretRangeFromPoint(editable.ownerDocument, point);
		if (!range || !editable.contains(range.startContainer))
		{
			return;
		}

		const nativeSelection = editable.ownerDocument.getSelection();
		if (editable.contains(nativeSelection?.anchorNode))
		{
			nativeSelection.extend(range.startContainer, range.startOffset);
		}
	}

	selectAll(): boolean
	{
		if (!this.#editor || !this.#activeSession)
		{
			return false;
		}

		this.#editor.update((): void => $selectAll(), { discrete: true });

		return true;
	}

	setAria(aria): void
	{
		if (this.#editor && this.#activeSession)
		{
			this.#applyAria(aria);
		}
	}

	getVisibleState(): Object | null
	{
		if (!this.#editor || !this.#activeSession)
		{
			return null;
		}

		return this.#editor.getEditorState().read(() => {
			const root = $getRoot();
			const selection = $getSelection();
			if (!$isRangeSelection(selection))
			{
				return { text: root.getTextContent(), start: 0, end: 0 };
			}

			return {
				text: root.getTextContent(),
				start: this.#getVisibleOffset(selection.anchor),
				end: this.#getVisibleOffset(selection.focus),
			};
		});
	}

	captureVisibleRange(start: number, end: number): Object | null
	{
		if (!this.#editor || !this.#activeSession)
		{
			return null;
		}

		return this.#editor.getEditorState().read(() => {
			const currentSelection = $getSelection();
			if (!$isRangeSelection(currentSelection))
			{
				return null;
			}
			const nodes = $getRoot().getAllTextNodes();
			const endNodeIndex = nodes.findIndex((node) => node.getKey() === currentSelection.focus.key);
			if (endNodeIndex < 0)
			{
				return null;
			}
			let startNode = nodes[endNodeIndex];
			let startOffset = currentSelection.focus.offset;
			let remaining = Math.max(0, end - start);
			for (let index = endNodeIndex; index >= 0 && remaining > 0; index--)
			{
				startNode = nodes[index];
				const available = index === endNodeIndex ? startOffset : startNode.getTextContentSize();
				if (remaining <= available)
				{
					startOffset = available - remaining;
					remaining = 0;

					break;
				}

				remaining -= available;
				startOffset = 0;
			}
			if (remaining > 0)
			{
				return null;
			}

			const selection = $createRangeSelection();
			selection.setTextNodeRange(
				startNode,
				startOffset,
				currentSelection.focus.getNode(),
				currentSelection.focus.offset,
			);

			return selection;
		});
	}

	captureSelection(): Object | null
	{
		if (!this.#editor || !this.#activeSession)
		{
			return null;
		}

		return this.#editor.getEditorState().read(() => {
			const selection = $getSelection();

			return $isRangeSelection(selection) ? selection.clone() : null;
		});
	}

	restoreSelection(snapshot): boolean
	{
		if (!this.#editor || !this.#activeSession || !$isRangeSelection(snapshot))
		{
			return false;
		}

		this.#editor.update((): void => {
			$setSelection(snapshot.clone());
		}, { discrete: true });

		return true;
	}

	getSelectionAnchorRect(): ?Object
	{
		const nativeSelection = this.#getEditableNativeSelection();

		return nativeSelection === null ? null : getNativeSelectionAnchorRect(nativeSelection);
	}

	dispatchFormatting(action: string, payload = null): boolean
	{
		if (!this.#editor || !this.#activeSession)
		{
			return false;
		}

		if (action === ChecklistFormattingAction.Link)
		{
			return this.#editor.dispatchCommand(TOGGLE_LINK_COMMAND, payload);
		}

		const format = FormattingByAction[action];

		return format ? this.#editor.dispatchCommand(FORMAT_TEXT_COMMAND, format) : false;
	}

	getActiveFormattingActions(): string[]
	{
		if (!this.#editor || !this.#activeSession)
		{
			return [];
		}

		return this.#editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection))
			{
				return [];
			}

			const selectedTextNodes = selection.getNodes().filter((node) => $isTextNode(node));
			const actions = Object.entries(FormattingByAction)
				.filter(([, format]) => {
					return selection.hasFormat(format) || selectedTextNodes.some((node) => node.hasFormat(format));
				})
				.map(([action]) => action)
			;
			if (this.#selectionHasLink(selection))
			{
				actions.push(ChecklistFormattingAction.Link);
			}

			return actions;
		});
	}

	/**
	 * Emits the selection report again for a caller outside a command handler -- the release of a
	 * pointer drag, whose own reports were refused while the button was held. Opens the read context
	 * `#hasFormattableSelection()` needs and a command handler provides.
	 */
	reportSelection(): void
	{
		if (!this.#editor || !this.#activeSession)
		{
			return;
		}

		this.#editor.getEditorState().read((): void => this.#emitSelectionChange());
	}

	removeVisibleRange(range): boolean
	{
		if (!this.#editor || !this.#activeSession || !$isRangeSelection(range))
		{
			return false;
		}

		this.#editor.update((): void => {
			const selection = range.clone();
			$setSelection(selection);
			selection.removeText();
		});

		return true;
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.deactivate('destroy');
		this.#editor?.destroy();
		this.#editor = null;
		this.#destroyed = true;
	}

	#getEditor()
	{
		if (this.#editor)
		{
			return this.#editor;
		}

		this.#editor = this.#editorFactory({
			plugins: [
				'RichText',
				'Paragraph',
				'Clipboard',
				'Bold',
				'Italic',
				'Underline',
				'Strikethrough',
				'History',
				'Placeholder',
				CheckListLinkPlugin,
			],
			hideToolbar: true,
			toolbar: [],
			floatingToolbar: [],
		});
		this.#editor.registerCommand(
			PASTE_COMMAND,
			(event): boolean => this.#handlePaste(event),
			COMMAND_PRIORITY_HIGH,
		);
		this.#editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event): boolean => this.#handleEnter(event),
			COMMAND_PRIORITY_HIGH,
		);
		this.#editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			(event): boolean => this.#handleSessionKey('onEscape', event),
			COMMAND_PRIORITY_HIGH,
		);
		this.#editor.registerCommand(
			KEY_TAB_COMMAND,
			(event): boolean => this.#handleSessionKey('onTab', event),
			COMMAND_PRIORITY_HIGH,
		);
		this.#editor.registerCommand(
			KEY_DOWN_COMMAND,
			(event): boolean => this.#handleModifier(event),
			COMMAND_PRIORITY_HIGH,
		);
		this.#editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			(): boolean => {
				this.#emitSelectionChange();

				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return this.#editor;
	}

	#subscribeToChanges(itemId, generation): void
	{
		this.#changeHandler = (): void => {
			const session = this.#activeSession;
			if (!session || session.itemId !== itemId || session.generation !== generation)
			{
				return;
			}

			session.dirty = true;
			const source = this.#serializeSession(session);
			session.currentSource = source;
			this.#onChange(source, {
				itemId,
				generation,
				dirty: true,
			});
		};
		this.#editor.subscribe('onChange', this.#changeHandler);
	}

	#unsubscribeFromChanges(): void
	{
		if (this.#changeHandler && this.#editor)
		{
			this.#editor.unsubscribe('onChange', this.#changeHandler);
		}

		this.#changeHandler = null;
	}

	#serializeSession(session): string
	{
		return CheckListBbCode.serializeFromEditor(
			this.#editor.getText(),
			session.originalSource,
			session.dirty,
		);
	}

	#emitSelectionChange(): void
	{
		this.#onSelectionChange(this.getActiveFormattingActions(), {
			itemId: this.#activeSession?.itemId ?? null,
			generation: this.#activeSession?.generation ?? null,
			hasFormattableSelection: this.#hasFormattableSelection(),
		});
	}

	/**
	 * The editor is raised over a title the pointer has already pressed, and the focus event that
	 * raises it carries no coordinates. The editor takes the box the title had, so replaying the press
	 * point over it keeps the caret where the user aimed.
	 */
	#selectAtPoint(point: { x: number, y: number }): void
	{
		// The editable container, not the scroller around it: only what it holds is editable text.
		const editable = this.#editor.getEditableContainer();
		const range = createCaretRangeFromPoint(editable.ownerDocument, point);
		if (!range || !editable.contains(range.startContainer))
		{
			return;
		}

		this.#editor.update((): void => {
			const selection = $createRangeSelection();
			selection.applyDOMRange(range);
			// An unresolved point leaves the fresh selection on the root: the caret then stays with
			// the default of `focus()`.
			if (selection.anchor.key !== $getRoot().getKey())
			{
				$setSelection(selection);
			}
		}, { discrete: true });
	}

	/**
	 * Premises shared by `#hasFormattableSelection()` and `getSelectionAnchorRect()`: an editable
	 * session and a non-empty native selection inside it. Reads the live native selection, so unlike
	 * the editor state it needs no read context.
	 */
	#getEditableNativeSelection(): ?Selection
	{
		if (!this.#editor || !this.#activeSession || !this.#editor.isEditable())
		{
			return null;
		}

		const nativeSelection = window.getSelection();
		if (nativeSelection === null || nativeSelection.isCollapsed)
		{
			return null;
		}

		return this.#editor.getScrollerContainer().contains(nativeSelection.anchorNode)
			? nativeSelection
			: null
		;
	}

	/**
	 * Repeats `FloatingToolbarPlugin#shouldShowDialog` minus its check for a visible dialog:
	 * the checklist panel keeps its own holds in the component.
	 * Reads the selection of the active editor state, so it needs a command handler or a read context.
	 */
	#hasFormattableSelection(): boolean
	{
		if (this.#getEditableNativeSelection() === null || this.#editor.isComposing())
		{
			return false;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection) || selection.isCollapsed())
		{
			return false;
		}

		const unformattedParent = $findMatchingParent(
			selection.anchor.getNode(),
			// eslint-disable-next-line no-underscore-dangle
			(node): boolean => (node.__flags & Constants.UNFORMATTED) !== 0,
		);
		const textContent = selection.getTextContent();
		if (unformattedParent || textContent === '')
		{
			return false;
		}

		if (textContent.replaceAll('\n', '') === '')
		{
			return false;
		}

		return $isTextNode(getSelectedNode(selection));
	}

	#selectionHasLink(selection): boolean
	{
		return selection.getNodes().some((node): boolean => {
			let currentNode = node;
			while (currentNode)
			{
				if ($isLinkNode(currentNode))
				{
					return true;
				}

				currentNode = currentNode.getParent();
			}

			return false;
		});
	}

	#handlePaste(event): boolean
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || !event?.clipboardData)
		{
			return false;
		}

		event.preventDefault();
		selection.insertText(event.clipboardData.getData('text/plain'));

		return true;
	}

	#handleModifier(event: KeyboardEvent): boolean
	{
		const action = getFormattingActionFromKeyboardEvent(event);
		if (!action)
		{
			return false;
		}

		event.preventDefault();
		this.dispatchFormatting(action);

		return true;
	}

	#handleEnter(event: KeyboardEvent): boolean
	{
		if (!event || !this.#activeSession)
		{
			return false;
		}

		if (event.ctrlKey || event.metaKey)
		{
			event.stopPropagation();

			return true;
		}

		event.preventDefault();

		return this.#handleSessionKey('onEnter', event);
	}

	#handleSessionKey(handlerName: string, event: KeyboardEvent): boolean
	{
		const handler = this.#activeSession?.handlers?.[handlerName];
		if (!Type.isFunction(handler))
		{
			return false;
		}

		return handler(event) !== false;
	}

	#getVisibleOffset(point): number
	{
		const selection = $createRangeSelection();
		selection.anchor.set($getRoot().getKey(), 0, 'element');
		selection.focus.set(point.key, point.offset, point.type);

		return selection.getTextContent().length;
	}

	#applyAria(aria): void
	{
		const editable = this.#editor.getEditableContainer();
		this.#managedAriaAttributes.forEach((attribute): void => editable.removeAttribute(attribute));
		this.#managedAriaAttributes.clear();
		editable.setAttribute('role', 'textbox');
		editable.setAttribute('aria-multiline', 'true');

		if (Type.isStringFilled(aria))
		{
			this.#setAriaAttribute(editable, 'aria-label', aria);

			return;
		}

		if (Type.isPlainObject(aria))
		{
			Object.entries(aria).forEach(([name, value]): void => {
				if (name === 'role')
				{
					if (Type.isStringFilled(value))
					{
						this.#setAriaAttribute(editable, 'role', value);
					}

					return;
				}

				const attribute = name.startsWith('aria-') ? name : `aria-${name}`;
				if (Type.isStringFilled(value))
				{
					this.#setAriaAttribute(editable, attribute, value);
				}
			});
		}
	}

	#setAriaAttribute(editable: HTMLElement, attribute: string, value: string): void
	{
		editable.setAttribute(attribute, value);
		this.#managedAriaAttributes.add(attribute);
	}
}
