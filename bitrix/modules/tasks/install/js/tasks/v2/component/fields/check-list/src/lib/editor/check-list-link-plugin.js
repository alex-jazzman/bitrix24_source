import { CheckListBbCode } from 'tasks.v2.lib.check-list-bb-code';
import { BasePlugin } from 'ui.text-editor';
import {
	$addUpdateTag,
	$createParagraphNode,
	$createTextNode,
	$getSelection,
	$insertNodes,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_LOW,
} from 'ui.lexical.core';
import {
	$createLinkNode,
	$isLinkNode,
	$toggleLink,
	LinkNode,
	TOGGLE_LINK_COMMAND,
} from 'ui.lexical.link';
import { $wrapNodeInElement } from 'ui.lexical.utils';

const HISTORY_PUSH_TAG = 'history-push';

export class CheckListLinkPlugin extends BasePlugin
{
	constructor(editor)
	{
		super(editor);

		this.cleanUpRegister(
			editor.registerCommand(
				TOGGLE_LINK_COMMAND,
				(payload): boolean => this.toggleLink(payload),
				COMMAND_PRIORITY_LOW,
			),
		);
	}

	static getName(): string
	{
		return 'CheckListLink';
	}

	static getNodes(): Array<Class<LinkNode>>
	{
		return [LinkNode];
	}

	importBBCode(): Object
	{
		return {
			url: () => ({
				conversion: (node) => {
					const sourceUrl = node.getValue() || node.toPlainText();
					const safeUrl = CheckListBbCode.sanitizeUrl(sourceUrl);

					return {
						node: safeUrl ? $createLinkNode(safeUrl, { target: '_blank' }) : null,
					};
				},
				priority: 0,
			}),
		};
	}

	exportBBCode(): Object
	{
		return {
			link: (node: LinkNode) => {
				const scheme = this.getEditor().getBBCodeScheme();
				const safeUrl = CheckListBbCode.sanitizeUrl(node.getURL());

				return {
					node: safeUrl
						? scheme.createElement({ name: 'url', value: safeUrl })
						: scheme.createFragment(),
				};
			},
		};
	}

	validateScheme(): Object
	{
		return {
			nodes: [{ nodeClass: LinkNode }],
			bbcodeMap: { link: 'url' },
		};
	}

	toggleLink(payload): boolean
	{
		if (payload === null)
		{
			$addUpdateTag(HISTORY_PUSH_TAG);
			$toggleLink(null);

			return true;
		}

		const selection = $getSelection();
		if (!$isRangeSelection(selection))
		{
			return false;
		}
		if (this.#selectionHasLink(selection))
		{
			$addUpdateTag(HISTORY_PUSH_TAG);
			$toggleLink(null);

			return true;
		}

		const sourceUrl = typeof payload === 'string' ? payload : payload?.url;
		const safeUrl = CheckListBbCode.sanitizeUrl(sourceUrl);
		if (!safeUrl)
		{
			return false;
		}

		const attributes = {
			target: '_blank',
			rel: 'noopener noreferrer',
		};
		if (selection.isCollapsed())
		{
			$addUpdateTag(HISTORY_PUSH_TAG);
			this.#insertLink(selection, safeUrl, attributes);

			return true;
		}

		$addUpdateTag(HISTORY_PUSH_TAG);
		$toggleLink(safeUrl, attributes);

		return true;
	}

	#insertLink(selection, url: string, attributes: Object): void
	{
		const linkNode = $createLinkNode(url, attributes);
		linkNode.append($createTextNode(url));

		const anchor = selection.anchor;
		if (anchor.type === 'text' && anchor.getNode().isSimpleText())
		{
			const anchorNode = anchor.getNode();
			const selectionOffset = anchor.offset;
			const splitNodes = anchorNode.splitText(selectionOffset);
			if (selectionOffset === 0)
			{
				splitNodes[0].insertBefore(linkNode);
			}
			else
			{
				splitNodes[0].insertAfter(linkNode);
			}

			linkNode.select();

			return;
		}

		$insertNodes([linkNode]);
		if ($isRootOrShadowRoot(linkNode.getParentOrThrow()))
		{
			$wrapNodeInElement(linkNode, $createParagraphNode).selectEnd();
		}
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
}
