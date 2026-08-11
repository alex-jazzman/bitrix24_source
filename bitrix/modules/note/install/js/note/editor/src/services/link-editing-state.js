import {
	captureLinkSelection,
	showLinkSelectionOverlay,
	clearLinkSelectionOverlay,
	applyLink as applyLinkService,
	unsetLink as unsetLinkService,
	commitLinkAtRange,
} from './link-editing';
import { sanitizeUrl } from '../utils/url';

export class LinkEditingState
{
	linkValue: string;
	initialHref: string;
	linkSelection: Object | null;
	_getEditor: () => Object | null;

	constructor({ getEditor }: { getEditor: () => Object | null })
	{
		this.linkValue = '';
		this.initialHref = '';
		this.linkSelection = null;
		this._getEditor = getEditor;
	}

	// `range` is the real link-mark span ({ from, to, href }), e.g. from findLinkMarkRangeAtPos.
	// Caret-driven callers must pass it so linkSelection seeds a non-collapsed range (the caret
	// itself is collapsed at this point); the toolbar path has no range and keeps the old behavior.
	open(range?: { from: number, to: number, href?: string } | null): void
	{
		const editor = this._getEditor();
		this.linkSelection = range ? { from: range.from, to: range.to } : captureLinkSelection(editor);
		showLinkSelectionOverlay(editor, this.linkSelection);
		// Prefer the href resolved from the link-mark range (caret may sit on a non-inclusive boundary
		// where getAttributes by selection reads empty); fall back to selection for the toolbar path.
		this.linkValue = range?.href ?? editor?.getAttributes('link').href ?? '';
		this.initialHref = this.linkValue;
	}

	// Closed contract: valid non-empty -> apply, empty -> unset, invalid -> rollback to initialHref.
	commit(): boolean
	{
		// Href unchanged: skip apply() so we don't restoreLinkSelection and yank the caret back into
		// the link (the common open/look/click-away case). Only touch the doc on a real edit.
		if (this.linkValue === this.initialHref)
		{
			return true;
		}

		if (!this.linkValue)
		{
			this.unset();

			return true;
		}

		if (!sanitizeUrl(this.linkValue))
		{
			this.linkValue = this.initialHref;

			return false;
		}

		return this.apply();
	}

	close(): void
	{
		clearLinkSelectionOverlay(this._getEditor());
	}

	// Same closed contract as commit(), but lands the edit on this.linkSelection directly instead of
	// the live selection, so the caret (already elsewhere, e.g. moved into a different link) doesn't
	// get pulled back. Used when the caret leaves this link before the user closed the popup.
	commitInPlace(): void
	{
		if (this.linkValue === this.initialHref)
		{
			return;
		}

		if (this.linkValue && !sanitizeUrl(this.linkValue))
		{
			return;
		}

		const editor = this._getEditor();
		commitLinkAtRange(editor, this.linkSelection, this.linkValue);
	}

	apply(): boolean
	{
		const editor = this._getEditor();
		if (!editor)
		{
			return false;
		}

		if (!this.linkValue)
		{
			this.unset();

			return true;
		}

		const { applied, href } = applyLinkService(editor, this.linkValue, this.linkSelection);
		if (!applied)
		{
			return false;
		}

		this.linkValue = href;
		// Sync initialHref so a follow-up commit-on-close (after Enter already applied) is a no-op.
		this.initialHref = href;
		this.linkSelection = null;
		clearLinkSelectionOverlay(editor);

		return true;
	}

	unset(): void
	{
		const editor = this._getEditor();
		if (!editor)
		{
			return;
		}

		unsetLinkService(editor, this.linkSelection);
		this.linkValue = '';
		// Sync initialHref so a follow-up commit-on-close is a no-op after the link was already removed.
		this.initialHref = '';
		this.linkSelection = null;
		clearLinkSelectionOverlay(editor);
	}

	setLinkValue(value: string): void
	{
		this.linkValue = value;
	}
}
