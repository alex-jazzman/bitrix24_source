import {
	KEY_TAB_COMMAND,
	INDENT_CONTENT_COMMAND,
	OUTDENT_CONTENT_COMMAND,
	COMMAND_PRIORITY_EDITOR,
	COMMAND_PRIORITY_LOW,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	type BaseSelection,
	type LexicalNode,
} from 'ui.lexical.core';

import { $findMatchingParent } from 'ui.lexical.utils';
import { $isListItemNode } from 'ui.lexical.list';

import { BasePlugin } from '../base-plugin';
import { type TextEditor } from '../../text-editor';

export class TabIndentPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerListeners();
	}

	static getName(): string
	{
		return 'TabIndent';
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerCommand(
				KEY_TAB_COMMAND,
				(event): boolean => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					// Tab only changes the indent inside a list; outside one the browser keeps its
					// own behaviour and moves the focus on
					if ($isSelectionInList(selection))
					{
						event.preventDefault();
					}

					const command = event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND;

					return this.getEditor().dispatchCommand(command);
				},
				COMMAND_PRIORITY_EDITOR,
			),

			// Turn off RichText built-in indents
			this.getEditor().registerCommand(
				INDENT_CONTENT_COMMAND,
				(): boolean => {
					const selection = $getSelection();

					return !$isSelectionInList(selection);
				},
				COMMAND_PRIORITY_LOW,
			),

			this.getEditor().registerCommand(
				OUTDENT_CONTENT_COMMAND,
				(): boolean => {
					const selection = $getSelection();

					return !$isSelectionInList(selection);
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}
}

function $isNodeInList(node: LexicalNode): boolean
{
	if ($isListItemNode(node))
	{
		return true;
	}

	const parentNode = $findMatchingParent(node, (parent: LexicalNode) => $isElementNode(parent) && !parent.isInline());

	return $isListItemNode(parentNode);
}

/**
 * Whether the selection touches a list at all.
 *
 * Any node of it being in a list is enough. Asking only about the point the selection starts at
 * left a range that begins in a paragraph and ends in a list item to the browser: Tab was not
 * swallowed, so the keystroke moved the focus out of the editor, while the indent command
 * this plugin dispatches still reported the key as handled and nothing indented.
 */
function $isSelectionInList(selection: BaseSelection | null): boolean
{
	if (!$isRangeSelection(selection))
	{
		return false;
	}

	return selection.getNodes().some((node: LexicalNode): boolean => $isNodeInList(node));
}
