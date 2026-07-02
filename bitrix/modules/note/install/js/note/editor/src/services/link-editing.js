import { sanitizeUrl } from '../utils/url';

type LinkSelection = {
	from: number,
	to: number,
};

type ApplyLinkResult = {
	applied: boolean,
	href: string,
};

export function findLinkMarkRangeAtPos(editor: Object | null, pos: number): LinkSelection | null
{
	const doc = editor?.state?.doc;
	const linkMarkType = editor?.schema?.marks?.link;
	if (!doc || !linkMarkType || !Number.isInteger(pos))
	{
		return null;
	}

	const safePos = Math.max(0, Math.min(pos, doc.content.size));
	const $pos = doc.resolve(safePos);
	const carrier = $pos.nodeAfter || $pos.nodeBefore;
	const linkMark = carrier?.marks.find((mark) => mark.type === linkMarkType);
	if (!linkMark)
	{
		return null;
	}

	const matchesLink = (node: Object | null): boolean => {
		return Boolean(node && linkMarkType.isInSet(node.marks)
			&& node.marks.some((mark) => mark.type === linkMarkType && mark.attrs.href === linkMark.attrs.href));
	};

	let from = safePos;
	while (from > 0)
	{
		const before = doc.resolve(from).nodeBefore;
		if (!matchesLink(before))
		{
			break;
		}
		from -= before.nodeSize;
	}

	let to = safePos;
	const docSize = doc.content.size;
	while (to < docSize)
	{
		const after = doc.resolve(to).nodeAfter;
		if (!matchesLink(after))
		{
			break;
		}
		to += after.nodeSize;
	}

	if (from >= to)
	{
		return null;
	}

	return { from, to };
}

export function captureLinkSelection(editor: Object | null): LinkSelection | null
{
	const selection = editor?.state?.selection;
	if (!selection)
	{
		return null;
	}

	return {
		from: selection.from,
		to: selection.to,
	};
}

export function restoreLinkSelection(editor: Object | null, linkSelection: LinkSelection | null): void
{
	if (!editor || !linkSelection)
	{
		return;
	}

	editor.commands.setTextSelection(linkSelection);
}

export function showLinkSelectionOverlay(editor: Object | null, linkSelection: LinkSelection | null): void
{
	if (!editor || !linkSelection)
	{
		return;
	}

	const from = Number(linkSelection.from);
	const to = Number(linkSelection.to);
	if (!Number.isInteger(from) || !Number.isInteger(to) || from >= to)
	{
		return;
	}

	const transaction = editor.state.tr.setMeta('noteEditorLinkSelectionDecoration', { from, to });
	editor.view.dispatch(transaction);
}

export function clearLinkSelectionOverlay(editor: Object | null): void
{
	if (!editor)
	{
		return;
	}

	const transaction = editor.state.tr.setMeta('noteEditorLinkSelectionDecoration', { clear: true });
	editor.view.dispatch(transaction);
}

export function applyLink(
	editor: Object | null,
	linkValue: string,
	linkSelection: LinkSelection | null,
): ApplyLinkResult
{
	if (!editor)
	{
		return { applied: false, href: '' };
	}

	if (!linkValue)
	{
		return { applied: false, href: '' };
	}

	const safeHref = sanitizeUrl(linkValue);
	if (!safeHref)
	{
		return { applied: false, href: '' };
	}

	restoreLinkSelection(editor, linkSelection);

	const selection = editor.state.selection;
	const hasRange = selection && selection.from < selection.to;
	const hasLinkMark = editor.isActive('link');

	if (hasRange || hasLinkMark)
	{
		editor.chain().extendMarkRange('link').setLink({ href: safeHref }).run();
	}
	else
	{
		editor.chain().focus().insertContent({
			type: 'text',
			text: safeHref,
			marks: [{ type: 'link', attrs: { href: safeHref } }],
		}).run();
	}

	return { applied: true, href: safeHref };
}

export function unsetLink(editor: Object | null, linkSelection: LinkSelection | null): void
{
	if (!editor)
	{
		return;
	}

	restoreLinkSelection(editor, linkSelection);
	editor.chain().extendMarkRange('link').unsetLink().run();
}
