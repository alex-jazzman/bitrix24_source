import { CheckListFormatting } from './formatting/formatting';
import { CheckListLink } from './link/link';
import { CheckListBbCodeRenderer } from './renderer/renderer';
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

	static wrapSelection(source: string, selection: ?Object, action: string): FormattingResult
	{
		return CheckListFormatting.wrapSelection(source, selection, action);
	}

	static formatHtml(source: string, linkColor: string = ''): string
	{
		return CheckListBbCodeRenderer.formatHtml(source, linkColor);
	}
}
