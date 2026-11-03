import { CheckListFormatting } from './formatting/formatting';
import { CheckListLink } from './link/link';
import { CheckListUrl } from './link/url';
import { CheckListBbCodeRenderer } from './renderer/renderer';
import { CheckListEditorBbCode } from './editor/editor-bb-code';
import { type FormattingResult } from './types';

export class CheckListBbCode
{
	static handleDecorationTag(source: string, textarea: ?HTMLTextAreaElement, action: string): FormattingResult
	{
		return CheckListFormatting.handleDecorationTag(source, textarea, action);
	}

	static addUrlTag(source: string, textarea: ?HTMLTextAreaElement, url: string): FormattingResult
	{
		return CheckListFormatting.addUrlTag(source, textarea, url);
	}

	static getActiveFormattingActions(source: string, selection: ?Object): string[]
	{
		return CheckListFormatting.getActiveFormattingActions(source, selection);
	}

	static buildLinkSource(url: string, text: string): string
	{
		return CheckListLink.buildSource(url, text);
	}

	static sanitizeUrl(url: string): string
	{
		return CheckListUrl.sanitize(url);
	}

	static wrapSelection(source: string, selection: ?Object, action: string): FormattingResult
	{
		return CheckListFormatting.wrapSelection(source, selection, action);
	}

	static formatHtml(source: string, linkColor: string = ''): string
	{
		return CheckListBbCodeRenderer.formatHtml(source, linkColor);
	}

	/**
	 * Visible text of a formatted source, for surfaces that show no formatting: accessible names,
	 * screen reader announcements, menu items.
	 */
	static toPlainText(source: string): string
	{
		return CheckListBbCodeRenderer.toPlainText(source);
	}

	static prepareForEditor(source: string): { originalSource: string, editorSource: string }
	{
		return CheckListEditorBbCode.prepare(source, this.hasMalformedFormattingTags(source));
	}

	static serializeFromEditor(editorSource: string, originalSource: string, dirty: boolean): string
	{
		return CheckListEditorBbCode.serialize(
			editorSource,
			originalSource,
			dirty,
			this.hasMalformedFormattingTags(editorSource),
		);
	}

	static hasMalformedFormattingTags(source: string): boolean
	{
		return CheckListBbCodeRenderer.hasMalformedFormattingTags(source);
	}
}
