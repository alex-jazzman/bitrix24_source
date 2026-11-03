/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
import { Loc, Type } from 'main.core';
import { type BBCodeElementNode } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import { $insertDataTransferForPlainText } from 'ui.lexical.clipboard';
import {
	$createParagraphNode,
	$getPreviousSelection,
	$getSelection,
	$isElementNode,
	$isDecoratorNode,
	$isRangeSelection,
	$setSelection,
	createCommand,
	$isRootOrShadowRoot,
	$createTextNode,
	$getRoot,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	INSERT_PARAGRAPH_COMMAND,
	DELETE_CHARACTER_COMMAND,
	PASTE_COMMAND,
	KEY_ENTER_COMMAND,
	KEY_SPACE_COMMAND,
	isModifierMatch,
	type ElementNode,
	type LexicalNode,
	type LexicalNodeConfig,
	type RangeSelection,
} from 'ui.lexical.core';
import { $findMatchingParent, objectKlassEquals } from 'ui.lexical.utils';

import {
	createBBCodeElement,
	$normalizeTextNodes,
	shouldWrapInParagraph,
	type BBCodeConversion,
	type BBCodeConversionFn,
	type BBCodeConversionOutput,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
	type BBCodeExportConversion,
} from '../../bbcode';
import { $getAncestor } from '../../helpers/get-ancestor';
import { $isBlockNode } from '../../helpers/is-block-node';
import { hasCommandModifier } from '../../helpers/platform-shortcut';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { BasePlugin } from '../base-plugin';
import { $createSpoilerContentNode, $isSpoilerContentNode, SpoilerContentNode } from './spoiler-content-node';
import { $createSpoiler, $createSpoilerNode, $isSpoilerNode, SpoilerNode } from './spoiler-node';
import { $createSpoilerTitleNode, $isSpoilerTitleNode, $removeSpoiler, SpoilerTitleNode } from './spoiler-title-node';
import { $createSpoilerTitleTextNode, $isSpoilerTitleTextNode, SpoilerTitleTextNode } from './spoiler-title-text-node';

/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
export const INSERT_SPOILER_COMMAND = createCommand('INSERT_SPOILER_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
export const REMOVE_SPOILER_COMMAND = createCommand('REMOVE_SPOILER_COMMAND');

/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
export const TOGGLE_SPOILER_COMMAND = createCommand('TOGGLE_SPOILER_COMMAND');

export class SpoilerPlugin extends BasePlugin
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerNodeTransforms();
		this.#registerCommands();
		this.#registerComponents();
		this.#registerEditableListener();
	}

	/**
	 * Switching the mode does not rebuild the DOM of the titles already rendered, so their keyboard
	 * reachability has to be updated by hand — see SpoilerTitleNode.createDOM.
	 */
	#registerEditableListener(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerEditableListener((isEditable: boolean): void => {
				const rootElement = this.getEditor().getRootElement();
				if (rootElement === null)
				{
					return;
				}

				for (const title of rootElement.querySelectorAll('summary'))
				{
					(title as HTMLElement).tabIndex = isEditable ? -1 : 0;
				}
			}),
		);
	}

	static getName(): string
	{
		return 'Spoiler';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [SpoilerNode, SpoilerTitleNode, SpoilerContentNode, SpoilerTitleTextNode];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			spoiler: (): BBCodeConversion => ({
				conversion: ((node: BBCodeElementNode): BBCodeConversionOutput | null => {
					const title: string = Type.isStringFilled(node.getValue())
						? trimSpoilerTitle(node.getValue() as string)
						: Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE') as string;

					return {
						node: $createSpoilerNode(false),
						after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							return [
								$createSpoilerTitleNode().append($createSpoilerTitleTextNode(title)),
								$createSpoilerContentNode().append(...$normalizeTextNodes(childLexicalNodes)),
							];
						},
					};
				}) as BBCodeConversionFn,
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			spoiler: (spoilerNode: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();
				const titleNode = (spoilerNode as SpoilerNode).getChildren()[0];
				const title = trimSpoilerTitle(titleNode.getTextContent());
				const value = title === Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE') ? '' : title;

				return {
					node: createBBCodeElement(scheme, { name: 'spoiler', value }),
				};
			},
			'spoiler-title': (node: LexicalNode): BBCodeExportOutput => {
				return {
					node: null,
				};
			},
			'spoiler-content': (node: LexicalNode): BBCodeExportOutput => {
				const scheme = this.getEditor().getBBCodeScheme();

				return {
					node: scheme.createFragment(),
				};
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: SpoilerNode,
				},
				{
					nodeClass: SpoilerContentNode,
					validate: (contentNode: LexicalNode) => {
						(contentNode as SpoilerContentNode).getChildren().forEach((child: LexicalNode | ElementNode) => {
							if (shouldWrapInParagraph(child))
							{
								const paragraph = $createParagraphNode();
								child.replace(paragraph);
								paragraph.append(child);
							}
						});

						return false;
					},
				},
			],

			bbcodeMap: {
				spoiler: 'spoiler',
				'spoiler-content': 'spoiler',
				'spoiler-title': 'spoiler',
			},
		};
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('spoiler', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.SPOILER);
				button.setBlockType('spoiler');
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_SPOILER') as string);
				button.subscribe('onClick', (): void => {
					this.getEditor().focus();
					this.getEditor().update((): void => {
						if (button.isActive())
						{
							this.getEditor().dispatchCommand(REMOVE_SPOILER_COMMAND);
						}
						else
						{
							this.getEditor().dispatchCommand(INSERT_SPOILER_COMMAND);
						}
					});
				});

				return button;
			});
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			// This handles the case when container is collapsed and we delete its previous sibling
			// into it, it would cause collapsed content deleted (since it's display: none, and selection
			// swallows it when deletes single char). Instead we expand container, which is although
			// not perfect, but avoids bigger problem
			this.getEditor().registerCommand(
				DELETE_CHARACTER_COMMAND,
				this.#handleDeleteCharacter.bind(this),
				COMMAND_PRIORITY_LOW,
			),

			this.getEditor().registerCommand(KEY_ENTER_COMMAND, this.#handleEnter.bind(this), COMMAND_PRIORITY_NORMAL),

			this.getEditor().registerCommand(KEY_SPACE_COMMAND, this.#handleSpace.bind(this), COMMAND_PRIORITY_NORMAL),

			this.getEditor().registerCommand(
				INSERT_PARAGRAPH_COMMAND,
				this.#handleInsertParagraph.bind(this),
				COMMAND_PRIORITY_LOW,
			),

			this.getEditor().registerCommand(PASTE_COMMAND, this.#handlePaste.bind(this), COMMAND_PRIORITY_NORMAL),

			this.getEditor().registerCommand(
				INSERT_SPOILER_COMMAND,
				(payload) => {
					this.getEditor().update(() => {
						const title = Type.isPlainObject(payload) && Type.isStringFilled(payload.title) ? payload.title : undefined;
						let selection = $getSelection() || $getPreviousSelection();
						if (selection === null)
						{
							selection = $getRoot().selectEnd();
						}

						const spoiler = insertSpoiler(selection as RangeSelection, title);

						if (spoiler !== null)
						{
							spoiler.getContentNode()?.getChildren<ElementNode>()[0]?.select();
						}
					});

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				REMOVE_SPOILER_COMMAND,
				() => {
					this.getEditor().update(() => {
						const selection = $getSelection();
						if (!$isRangeSelection(selection))
						{
							return;
						}

						let spoilerNode = $findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
						if (!spoilerNode)
						{
							spoilerNode = $findMatchingParent(selection.focus.getNode(), $isSpoilerNode);
						}

						$removeSpoiler(spoilerNode as SpoilerNode);
					});

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
			this.getEditor().registerCommand(
				TOGGLE_SPOILER_COMMAND,
				() => {
					const selection = $getSelection() || $getPreviousSelection();
					if (!$isRangeSelection(selection))
					{
						return false;
					}

					let spoilerNode = $findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
					if (!spoilerNode)
					{
						spoilerNode = $findMatchingParent(selection.focus.getNode(), $isSpoilerNode);
					}

					if (spoilerNode)
					{
						this.getEditor().dispatchCommand(REMOVE_SPOILER_COMMAND);
					}
					else
					{
						this.getEditor().dispatchCommand(INSERT_SPOILER_COMMAND);
					}

					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	#registerNodeTransforms(): void
	{
		this.cleanUpRegister(
			// Structure enforcing transformers for each node type. In case nesting structure is not
			// "Container > Title + Content" it'll unwrap nodes and convert it back
			// to regular content.
			this.getEditor().registerNodeTransform(SpoilerNode, (node) => {
				const children = node.getChildren();
				if (children.length !== 2 || !$isSpoilerTitleNode(children[0]) || !$isSpoilerContentNode(children[1]))
				{
					for (const child of children)
					{
						if ($isElementNode(child) || $isDecoratorNode(child))
						{
							node.insertBefore(child);
						}
						else
						{
							node.insertBefore($createParagraphNode().append(child));
						}
					}

					node.remove();
				}
			}),

			this.getEditor().registerNodeTransform(SpoilerTitleNode, (node: SpoilerTitleNode) => {
				const parent = node.getParent();
				if (!$isSpoilerNode(parent))
				{
					node.replace($createParagraphNode().append(...node.getChildren()));
				}
				else if (
					(node.getChildrenSize() === 1 && !$isSpoilerTitleTextNode(node.getFirstChild()))
					|| node.getChildrenSize() > 1
				)
				{
					$setSelection(null);
					const textContent = trimSpoilerTitle(node.getTextContent());
					node.clear();
					node.append($createSpoilerTitleTextNode(textContent));
					node.select();
				}
			}),

			this.getEditor().registerNodeTransform(SpoilerTitleTextNode, (node: SpoilerTitleTextNode) => {
				const parent = node.getParent();
				if (!$isSpoilerTitleNode(parent))
				{
					node.replace($createParagraphNode().append($createTextNode(node.getTextContent())));
				}
			}),

			this.getEditor().registerNodeTransform(SpoilerContentNode, (node) => {
				const parent = node.getParent();
				if (!$isSpoilerNode(parent))
				{
					const children = node.getChildren();
					for (const child of children)
					{
						if ($isElementNode(child) || $isDecoratorNode(child))
						{
							node.insertBefore(child);
						}
						else
						{
							node.insertBefore($createParagraphNode().append(child));
						}
					}

					node.remove();
				}
			}),
		);
	}

	#handleDeleteCharacter(): boolean
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.offset !== 0)
		{
			return false;
		}

		const anchorNode = selection.anchor.getNode();
		const topLevelElement = anchorNode.getTopLevelElement();
		if (topLevelElement === null)
		{
			return false;
		}

		const container: SpoilerNode = topLevelElement.getPreviousSibling() as SpoilerNode;
		if (!$isSpoilerNode(container) || container.getOpen())
		{
			return false;
		}

		container.setOpen(true);

		return true;
	}

	#handleInsertParagraph(): boolean
	{
		const selection = $getSelection();
		if ($isRangeSelection(selection))
		{
			const spoilerTitleNode: SpoilerTitleNode = $findMatchingParent(
				selection.anchor.getNode(),
				(node: LexicalNode) => $isSpoilerTitleNode(node),
			) as SpoilerTitleNode;

			if (spoilerTitleNode)
			{
				const newBlock: ElementNode = spoilerTitleNode.insertNewAfter(selection);
				if (newBlock)
				{
					newBlock.selectStart();
				}

				return true;
			}
		}

		return false;
	}

	#handleEnter(event: KeyboardEvent | null): boolean
	{
		if (event && hasCommandModifier(event))
		{
			// Handling CMD+Enter to toggle spoiler element collapsed state
			const selection = $getPreviousSelection();
			if ($isRangeSelection(selection) && selection.isCollapsed())
			{
				const parent = $findMatchingParent(
					selection.anchor.getNode(),
					(node) => $isElementNode(node) && !node.isInline(),
				);

				if ($isSpoilerTitleNode(parent))
				{
					const container: SpoilerNode = parent!.getParent() as SpoilerNode;
					if ($isSpoilerNode(container))
					{
						container.toggleOpen();
						$setSelection(selection.clone());

						return true;
					}
				}
			}

			return false;
		}

		// A plain Enter that landed on the `<summary>` would otherwise be taken as the native
		// activation of that element: WebKit expands the collapsed `<details>` and swallows the
		// keystroke, so the paragraph that belongs after the spoiler never appears. Insert it
		// here instead, before the browser gets to act on the key.
		if (event === null || !isModifierMatch(event, {}) || !this.#isSummaryKeyEventInTitle(event))
		{
			return false;
		}

		event.preventDefault();

		return this.#handleInsertParagraph();
	}

	/**
	 * Whether a key event landed on the `<summary>` element itself while the caret sits in the
	 * spoiler title — the arrangement in which the browser may run the native activation behaviour
	 * of `<summary>` and take the keystroke away from the editor.
	 */
	#isSummaryKeyEventInTitle(event: KeyboardEvent): boolean
	{
		if (!(event.target instanceof HTMLElement) || event.target.tagName !== 'SUMMARY')
		{
			return false;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return false;
		}

		return $findMatchingParent(
			selection.anchor.getNode(),
			(node: LexicalNode) => $isSpoilerTitleNode(node),
		) !== null;
	}

	/**
	 * A Space that landed on the `<summary>` is likewise an activation keystroke: Firefox turns it
	 * into a click on the summary, the `<details>` toggles and the character never reaches the
	 * editor — so the title cannot hold a space at all. Put the space in through the editor.
	 *
	 * Firefox activates it with modifiers held too (measured: Ctrl+Space collapses the spoiler),
	 * so the default action always has to go. Typing a character, though, is what only a plain
	 * Space means, Shift included: a Ctrl, Alt or Meta combination inserts nothing and is reported
	 * unhandled, for whoever asked for it.
	 */
	#handleSpace(event: KeyboardEvent | null): boolean
	{
		if (event === null || !this.#isSummaryKeyEventInTitle(event))
		{
			return false;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return false;
		}

		event.preventDefault();

		if (!isModifierMatch(event, { shiftKey: 'any' }))
		{
			return false;
		}

		selection.insertText(' ');

		return true;
	}

	#handlePaste(event: ClipboardEvent | InputEvent | KeyboardEvent): boolean
	{
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || !objectKlassEquals(event, ClipboardEvent) || event.clipboardData === null)
		{
			return false;
		}

		const spoilerTitleNode: SpoilerTitleNode = $findMatchingParent(
			selection.anchor.getNode(),
			(node: LexicalNode) => $isSpoilerTitleNode(node),
		) as SpoilerTitleNode;

		if (spoilerTitleNode)
		{
			event.preventDefault();
			this.getEditor().update(
				() => {
					$insertDataTransferForPlainText(event.clipboardData!, selection);
				},
				{
					tag: 'paste',
				},
			);

			return true;
		}

		return false;
	}
}

export function insertSpoiler(selection: RangeSelection, title?: string)
{
	if (!$isRangeSelection(selection))
	{
		return null;
	}

	const anchor = selection.anchor;
	const anchorNode: ElementNode = anchor.getNode() as ElementNode;
	const spoiler: SpoilerNode = $createSpoiler(true, title);
	if ($isRootOrShadowRoot(anchorNode))
	{
		const firstChild = anchorNode.getFirstChild();
		if (firstChild)
		{
			firstChild.replace(spoiler, true);
		}
		else
		{
			anchorNode.append(spoiler);
		}

		return spoiler;
	}

	const handled = new Set();
	const nodes: LexicalNode[] = selection.getNodes();
	const firstSelectedBlock = $getAncestor(selection.anchor.getNode(), $isBlockNode);
	if (firstSelectedBlock && !nodes.includes(firstSelectedBlock))
	{
		nodes.unshift(firstSelectedBlock);
	}

	handled.add(spoiler.getKey());
	handled.add(spoiler.getTitleNode()!.getKey());
	handled.add(spoiler.getContentNode()!.getKey());

	let firstNode = true;
	for (const node of nodes)
	{
		if (!$isBlockNode(node) || handled.has(node.getKey()))
		{
			continue;
		}

		const isParentHandled = $getAncestor(
			node.getParent()!,
			(parentNode: LexicalNode): boolean => handled.has(parentNode.getKey()),
		);

		if (isParentHandled)
		{
			continue;
		}

		if (firstNode)
		{
			firstNode = false;
			node.replace(spoiler);
			spoiler.getContentNode()!.append(node);
		}
		else
		{
			spoiler.getContentNode()!.append(node);
		}

		handled.add(node.getKey());
	}

	return spoiler;
}

export function trimSpoilerTitle(title: string): string
{
	return title
		.trim()
		.replaceAll(/\r?\n|\t/gm, '')
		.replace('\r', '')
		.replaceAll(/\s+/g, ' ');
}
