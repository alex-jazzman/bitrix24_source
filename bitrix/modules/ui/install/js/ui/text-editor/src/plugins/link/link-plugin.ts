/* eslint-disable no-underscore-dangle */
import { Loc, Type, Validation } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { type BBCodeElementNode, type BBCodeNode } from 'ui.bbcode.model';
import { Outline } from 'ui.icon-set.api.core';
import {
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	PASTE_COMMAND,
	KEY_DOWN_COMMAND,
	isExactShortcutMatch,
	$isTextNode,
	$isElementNode,
	$getSelection,
	$isRangeSelection,
	$insertNodes,
	$isRootOrShadowRoot,
	$createParagraphNode,
	$createTextNode,
	$getNodeByKey,
	createCommand,
	type BaseSelection,
	type LexicalNode,
	type LexicalNodeConfig,
	type RangeSelection,
	type NodeKey,
	type LexicalCommand,
	type LexicalNodeReplacement,
} from 'ui.lexical.core';
import {
	LinkNode,
	TOGGLE_LINK_COMMAND,
	$toggleLink,
	$createLinkNode,
	$isLinkNode,
	$isAutoLinkNode,
	type LinkAttributes,
} from 'ui.lexical.link';
import { $wrapNodeInElement, $findMatchingParent, mergeRegister, objectKlassEquals } from 'ui.lexical.utils';

import {
	createBBCodeElement,
	type BBCodeConversion,
	type BBCodeConversionOutput,
	type BBCodeExportConversion,
	type BBCodeExportOutput,
	type BBCodeImportConversion,
} from '../../bbcode';
import { HIDE_DIALOG_COMMAND } from '../../commands';
import { getSelectedNode } from '../../helpers/get-selected-node';
import { sanitizeUrl } from '../../helpers/sanitize-url';
import { URL_REGEX, validateUrl } from '../../helpers/validate-url';
import { getKeystrokeCaption, hasCommandModifier, isApplePlatform } from '../../helpers/platform-shortcut';
import { type TextEditor } from '../../text-editor';
import { Button } from '../../toolbar/button';
import { type SchemeValidationOptions } from '../../types/scheme-validation-options';
import { $isInsideUnformatted } from '../../helpers/is-unformatted';
import { DialogPlugin } from '../dialog-plugin';
import { $createCustomLinkNode, CustomLinkNode } from './custom-link-node';
import { LinkEditor } from './link-editor';

export const INSERT_LINK_DIALOG_COMMAND: LexicalCommand<LinkNode> = createCommand('INSERT_LINK_DIALOG_COMMAND');

export class LinkPlugin extends DialogPlugin<LinkEditor>
{
	constructor(editor: TextEditor)
	{
		super(editor);

		this.#registerCommands();
		this.#registerListeners();
		this.#registerComponents();
	}

	static getName(): string
	{
		return 'Link';
	}

	static getNodes(editor: TextEditor): Array<LexicalNodeConfig>
	{
		return [
			LinkNode,
			CustomLinkNode,
			{
				replace: LinkNode,
				with: (node: LinkNode) => {
					return $createCustomLinkNode(node.__url, {
						rel: node.__rel,
						target: node.__target,
						title: node.__title,
					});
				},
				withKlass: CustomLinkNode,
			} satisfies LexicalNodeReplacement,
		];
	}

	importBBCode(): BBCodeImportConversion
	{
		return {
			url: (): BBCodeConversion => ({
				conversion: (node: BBCodeNode): BBCodeConversionOutput | null => {
					// [url]{url}[/url]
					// [url={url}]{text}[/url]
					let url: string = (node as BBCodeElementNode).getValue() as string;
					if (!validateUrl(url))
					{
						url = node.toPlainText();
						if (!validateUrl(url))
						{
							return { node: null };
						}
					}

					return {
						node: $createLinkNode(sanitizeUrl(url), { target: '_blank' }),
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): BBCodeExportConversion
	{
		return {
			link: (lexicalNode: LexicalNode): BBCodeExportOutput => exportLinkNode(lexicalNode as LinkNode, this.getEditor()),
			'custom-link': (lexicalNode: LexicalNode): BBCodeExportOutput => {
				return exportLinkNode(lexicalNode as LinkNode, this.getEditor());
			},
		};
	}

	validateScheme(): SchemeValidationOptions | null
	{
		return {
			nodes: [
				{
					nodeClass: CustomLinkNode,
				},
			],
			bbcodeMap: {
				link: 'url',
				'custom-link': 'url',
			},
		};
	}

	#registerListeners(): void
	{
		this.cleanUpRegister(
			this.getEditor().registerEventListener(LinkNode, 'click', (event: Event, nodeKey: NodeKey) => {
				const linkNode = $getNodeByKey(nodeKey);
				if ($isLinkNode(linkNode))
				{
					this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND, linkNode);
				}
			}),
		);
	}

	#registerCommands(): void
	{
		this.cleanUpRegister(
			this.#registerToggleLinkCommand(),
			this.#registerInsertLinkCommand(),
			this.#registerKeyDownCommand(),
			this.#registerPasteCommand(),
		);
	}

	/**
	 * Answering `payload === null` here, and stopping the chain, is deliberate.
	 *
	 * registerAutoLink() brings a TOGGLE_LINK_COMMAND listener of its own: on an unlink it raises
	 * the isUnlinked flag of an AutoLinkNode, which is how lexical makes an unlinked auto-link stay
	 * unlinked -- $toggleLink() skips auto-links entirely, so nothing else would.
	 *
	 * That flag has nowhere to live in BBCode, which is what this editor saves into. An unlinked
	 * auto-link still exports as [url]...[/url], and reading it back yields a plain link: the unlink
	 * would not simply fail to survive a reload, it would turn an auto-link into a hard one. So the
	 * command belongs here alone, and this listener has to run first -- it is registered before the
	 * auto-link plugin, and both sit at COMMAND_PRIORITY_LOW.
	 *
	 * The lasting unlink is worth having; it needs BBCode to be able to express it first.
	 * Pinned by "is not handed to the isUnlinked mechanism of lexical" in auto-link.test.ts.
	 */
	#registerToggleLinkCommand(): () => void
	{
		return this.getEditor().registerCommand(
			TOGGLE_LINK_COMMAND,
			(payload): boolean => {
				if (payload === null)
				{
					$toggleLink(payload);

					return true;
				}

				const selection: BaseSelection | null = $getSelection();
				if (!$isRangeSelection(selection))
				{
					return false;
				}

				let url = null;
				let originalUrl = null;

				let attributes: LinkAttributes = {};
				if (Type.isStringFilled(payload))
				{
					url = payload;
				}
				else if (Type.isPlainObject(payload))
				{
					const { target, rel, title } = payload;
					attributes = { rel, target, title };
					url = payload.url;
					originalUrl = (payload as { originalUrl?: string }).originalUrl || null;
				}

				if (Type.isStringFilled(url))
				{
					if (!Type.isStringFilled(attributes.target))
					{
						attributes.target = '_blank';
					}

					if (validateUrl(url))
					{
						if (selection.isCollapsed() && !this.#isLinkSelected(selection))
						{
							this.#insertLink(selection, url, attributes, originalUrl);
						}
						else
						{
							$toggleLink(url, attributes);
						}

						return true;
					}

					return false;
				}

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}

	#handleInsertLinkDialog(payload: LinkNode): boolean
	{
		const selection: BaseSelection | null = $getSelection();
		if (!$isRangeSelection(selection) || !this.getEditor().isEditable())
		{
			return false;
		}

		this.rememberSelection(selection);
		this.getDialog()?.destroy();

		let lineNode: LinkNode | null = null;
		let linkUrl: string | null = null;

		if ($isLinkNode(payload))
		{
			lineNode = payload;
			linkUrl = lineNode.getURL();
		}
		else
		{
			if ($isInsideUnformatted(selection.anchor.getNode()))
			{
				return false;
			}

			const node = getSelectedNode(selection);
			const linkParent = $findMatchingParent(node, $isLinkNode);

			if (linkParent)
			{
				lineNode = linkParent;
				linkUrl = lineNode.getURL();
				lineNode.select();
			}
			else if ($isLinkNode(node))
			{
				lineNode = node;
				linkUrl = lineNode.getURL();
				lineNode.select();
			}
		}

		this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, { sender: 'link-dialog' });

		this.setDialog(this.#createLinkEditor(lineNode, linkUrl));
		this.getDialog()!.show();

		return true;
	}

	#createLinkEditor(lineNode: LinkNode | null, linkUrl: string | null): LinkEditor
	{
		return new LinkEditor({
			linkUrl: linkUrl as string,
			autoLinkMode: $isAutoLinkNode(lineNode),
			// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
			targetContainer: document.body,
			events: {
				onSave: (event: BaseEvent) => {
					this.#handleLinkEditorSave(event, lineNode);
				},
				onCancel: (event: BaseEvent) => {
					const linkEditor: LinkEditor = event.getTarget();
					linkEditor.hide();
				},
				onUnlink: (event: BaseEvent) => {
					if (lineNode === null)
					{
						this.getEditor().dispatchCommand(TOGGLE_LINK_COMMAND, null);
					}
					else
					{
						this.getEditor().update(() => {
							const children = lineNode.getChildren();
							for (const child of children)
							{
								// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
								lineNode.insertBefore(child);
							}

							lineNode.remove();
						});
					}

					const linkEditor: LinkEditor = event.getTarget();
					linkEditor.hide();
				},
				onShow: () => {
					this.attachDialogToSelection();
				},
				onClose: () => {
					this.handleDialogDestroy();
				},
				onDestroy: () => {
					this.handleDialogDestroy();
				},
			},
		});
	}

	#handleLinkEditorSave(event: BaseEvent, lineNode: LinkNode | null): void
	{
		const linkEditor: LinkEditor = event.getTarget();
		let url = linkEditor.getLinkUrl();
		if (!Type.isStringFilled(url))
		{
			linkEditor.hide();

			return;
		}

		const protocol = Validation.isEmail(url) ? 'mailto:' : 'https://';
		const originalUrl = url;
		if (!validateUrl(url))
		{
			url = `${protocol}${url}`;
			linkEditor.setLinkUrl(url);
		}

		if (lineNode === null)
		{
			this.getEditor().update(() => {
				this.restoreSelection();

				this.getEditor().dispatchCommand(
					TOGGLE_LINK_COMMAND,
					{ url, originalUrl, rel: null } as { url: string } & LinkAttributes,
				);
				linkEditor.setEditMode(false);

				const currentSelection: BaseSelection | null = $getSelection();
				if ($isRangeSelection(currentSelection))
				{
					this.rememberSelection(currentSelection);
				}

				if (!$isRangeSelection(currentSelection) || currentSelection.isCollapsed())
				{
					linkEditor.hide();
				}

				this.#convertAutoLinkToLink(currentSelection);
			});
		}
		else
		{
			this.getEditor().update(() => {
				lineNode.setURL(url);
				this.#convertAutoLinkToLink($getSelection());
				linkEditor.setAutoLinkMode(false);
			});

			linkEditor.setEditMode(false);
		}

		this.getEditor().resetHighlightSelection();
	}

	#registerInsertLinkCommand(): () => void
	{
		return mergeRegister(
			this.getEditor().registerCommand(
				INSERT_LINK_DIALOG_COMMAND,
				this.#handleInsertLinkDialog.bind(this),
				COMMAND_PRIORITY_LOW,
			),
			this.registerDialogCommands('link-dialog'),
		);
	}

	#registerKeyDownCommand(): () => void
	{
		return this.getEditor().registerCommand(
			KEY_DOWN_COMMAND,
			(event: KeyboardEvent) => {
				if (!hasCommandModifier(event))
				{
					return false;
				}

				// on Apple Ctrl+K is the system delete-to-end-of-line, left to the built-in Lexical chain
				if (
					(!isApplePlatform() && isExactShortcutMatch(event, 'k', { ctrlKey: true }))
					|| isExactShortcutMatch(event, 'k', { metaKey: true })
				)
				{
					event.preventDefault();
					this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_NORMAL,
		);
	}

	#registerPasteCommand(): () => void
	{
		return this.getEditor().registerCommand(
			PASTE_COMMAND,
			(event) => {
				const selection: BaseSelection | null = $getSelection();
				if (!$isRangeSelection(selection) || !objectKlassEquals(event, ClipboardEvent) || event.clipboardData === null)
				{
					return false;
				}

				const clipboardText = event.clipboardData.getData('text');
				if (!URL_REGEX.test(clipboardText))
				{
					return false;
				}

				const url = clipboardText.startsWith('http') ? clipboardText : `https://${clipboardText}`;
				if (selection.isCollapsed())
				{
					const success = this.getEditor().dispatchCommand(TOGGLE_LINK_COMMAND, { url });
					if (success)
					{
						event.preventDefault();

						return true;
					}
				}
				else if (!selection.getNodes().some((node) => $isElementNode(node)))
				{
					$toggleLink(url);
					event.preventDefault();

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_NORMAL,
		);
	}

	#insertLink(selection: RangeSelection, url: string, attributes?: LinkAttributes, originalUrl?: string | null): void
	{
		const linkUrl = sanitizeUrl(url);
		const linkNode = $createLinkNode(linkUrl, attributes);
		linkNode.append($createTextNode(Type.isStringFilled(originalUrl) ? originalUrl : linkUrl));

		const anchor = selection.anchor;
		if (anchor.type === 'text' && anchor.getNode().isSimpleText())
		{
			const anchorNode = anchor.getNode();
			const selectionOffset = anchor.offset;

			const splitNodes = anchorNode.splitText(selectionOffset);
			if (selectionOffset === 0)
			{
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
				splitNodes[0].insertBefore(linkNode);
				linkNode.select();
			}
			else
			{
				splitNodes[0].insertAfter(linkNode);
				linkNode.select();
			}
		}
		else
		{
			$insertNodes([linkNode]);
			if ($isRootOrShadowRoot(linkNode.getParentOrThrow()))
			{
				$wrapNodeInElement(linkNode, $createParagraphNode).selectEnd();
			}
		}
	}

	#isLinkSelected(selection: RangeSelection): boolean
	{
		const node = getSelectedNode(selection);
		const parent = node.getParent();

		return $isLinkNode(parent) || $isLinkNode(node);
	}

	#convertAutoLinkToLink(selection: BaseSelection | null): boolean
	{
		if ($isRangeSelection(selection))
		{
			const parent = getSelectedNode(selection).getParent();
			if ($isAutoLinkNode(parent))
			{
				const linkNode = $createLinkNode(parent.getURL(), {
					rel: parent.getRel(),
					target: Type.isStringFilled(parent.getTarget()) ? parent.getTarget() : '_blank',
					title: parent.getTitle(),
				});

				parent.replace(linkNode, true);

				return true;
			}
		}

		return false;
	}

	#registerComponents(): void
	{
		this.getEditor()
			.getComponentRegistry()
			.register('link', (): Button => {
				const button: Button = new Button();
				button.setIcon(Outline.LINK);
				button.setBlockType('link');
				button.setHasPopup('dialog');
				button.disableInsideUnformatted();
				button.setTooltip(Loc.getMessage('TEXT_EDITOR_BTN_LINK', {
					'#keystroke#': getKeystrokeCaption({ mac: '⌘K', other: 'Ctrl+K' }),
				}) as string | null);
				button.subscribe('onClick', (): void => {
					if (this.isDialogShown())
					{
						return;
					}

					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);
					});
				});

				return button;
			});
	}
}

export function exportLinkNode(lexicalNode: LinkNode, editor: TextEditor): BBCodeExportOutput
{
	const url = lexicalNode.getURL();
	const children = lexicalNode.getChildren();
	const isSimpleText = children.length === 1 && $isTextNode(children[0]) && children[0].getFormat() === 0;

	const scheme = editor.getBBCodeScheme();
	if (isSimpleText && children[0].getTextContent() === url)
	{
		return {
			node: createBBCodeElement(scheme, { name: 'url' }),
		};
	}

	return {
		node: createBBCodeElement(scheme, { name: 'url', value: url }),
	};
}
