import { getMarkRange } from '@tiptap/core';
import { sanitizeUrl } from '../utils/url';

type LinkSelection = {
	from: number,
	to: number,
	href?: string,
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
	// Prefer the after-neighbor but fall back to before, so a caret sitting exactly on the
	// boundary between two links still resolves to a carrier (matches tiptap's own lookup order).
	const carrier = $pos.nodeAfter?.marks.some((mark) => mark.type === linkMarkType)
		? $pos.nodeAfter
		: $pos.nodeBefore;
	const linkMark = carrier?.marks.find((mark) => mark.type === linkMarkType);
	if (!linkMark)
	{
		return null;
	}

	// getMarkRange matches by href, so it naturally breaks at the boundary between two
	// adjacent links with different hrefs instead of gluing them together.
	const range = getMarkRange($pos, linkMarkType, { href: linkMark.attrs.href });
	if (!range || range.from >= range.to)
	{
		return null;
	}

	// Carry href from the mark itself: right after an input-rule the caret sits on the link's
	// (non-inclusive) boundary, where getAttributes('link') by selection would read empty.
	return { from: range.from, to: range.to, href: linkMark.attrs.href ?? '' };
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

// Commits a link edit to an explicit mark range without touching the current selection, so the
// caret (already moved to a different link) is not yanked back. Used when the caret leaves link A
// for link B and A's pending edit still needs to land. Empty linkValue removes the mark on `range`.
export function commitLinkAtRange(editor: Object | null, range: LinkSelection | null, linkValue: string): void
{
	if (!editor || !range || !Number.isInteger(range.from) || !Number.isInteger(range.to) || range.from >= range.to)
	{
		return;
	}

	const linkMarkType = editor.schema?.marks?.link;
	if (!linkMarkType)
	{
		return;
	}

	const { tr } = editor.state;

	if (!linkValue)
	{
		tr.removeMark(range.from, range.to, linkMarkType);
		editor.view.dispatch(tr);

		return;
	}

	const safeHref = sanitizeUrl(linkValue);
	if (!safeHref)
	{
		return;
	}

	tr.addMark(range.from, range.to, linkMarkType.create({ href: safeHref }));
	editor.view.dispatch(tr);
}
