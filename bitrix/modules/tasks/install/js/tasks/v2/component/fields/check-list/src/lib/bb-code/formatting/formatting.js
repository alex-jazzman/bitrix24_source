import { ChecklistFormattingAction, FormattingTags, TagToFormattingAction } from '../const';
import { CheckListFormattingTag } from './formatting-tag';
import { CheckListLink } from '../link/link';
import { CheckListSelection } from '../selection/selection';
import {
	type FormattingRange,
	type FormattingResult,
	type FormattingTag,
	type SelectedFormattingRange,
	type SelectionRange,
} from '../types';

export class CheckListFormatting
{
	static handleDecorationTag(source: string, textarea: ?HTMLTextAreaElement, action: string): FormattingResult
	{
		return this.wrapSelection(source, CheckListSelection.getTextareaSelection(textarea), action);
	}

	static addUrlTag(source: string, textarea: ?HTMLTextAreaElement, url: string): FormattingResult
	{
		return this.wrapSelection(
			source,
			{
				...CheckListSelection.getTextareaSelection(textarea),
				url,
			},
			ChecklistFormattingAction.Link,
		);
	}

	static getActiveFormattingActions(source: string, selection: ?Object): string[]
	{
		const normalizedSource = CheckListSelection.normalizeSource(source);
		const { start, end } = CheckListSelection.normalizeSelection(normalizedSource, selection);
		const activeTags = [];
		const activeActions = new Set();

		const formattingTagRegExp = CheckListFormattingTag.createRegExp();
		let match = formattingTagRegExp.exec(normalizedSource);
		while (match)
		{
			const tagEnd = match.index + match[0].length;
			if (tagEnd > start)
			{
				break;
			}

			const tagName = this.normalizeTagName(match[2]);
			if (match[1] === '/')
			{
				const tagIndex = activeTags.lastIndexOf(tagName);
				if (tagIndex !== -1)
				{
					activeTags.splice(tagIndex, 1);
				}
			}
			else
			{
				activeTags.push(tagName);
			}

			match = formattingTagRegExp.exec(normalizedSource);
		}

		activeTags.forEach((tagName: string) => {
			const action = TagToFormattingAction[tagName];
			if (action)
			{
				activeActions.add(action);
			}
		});

		if (end > start)
		{
			Object.keys(TagToFormattingAction).forEach((tagName: string) => {
				const wrapsSelection = this.getFormattingRanges(normalizedSource, tagName).some((range) => {
					return start <= range.openStart && range.closeEnd <= end;
				});
				if (wrapsSelection)
				{
					activeActions.add(TagToFormattingAction[tagName]);
				}
			});
		}

		return [...activeActions];
	}

	static wrapSelection(source: string, selection: ?Object, action: string): FormattingResult
	{
		const normalizedSource = CheckListSelection.normalizeSource(source);
		const selectionRange = CheckListSelection.normalizeSelection(normalizedSource, selection);
		const { start, end } = selectionRange;
		const selectedText = normalizedSource.slice(start, end);

		if (action === ChecklistFormattingAction.Link)
		{
			const selectedLinkRange = this.findSelectedFormattingRange(normalizedSource, selectionRange, 'URL');
			if (selectedLinkRange)
			{
				return this.unwrapFormattingSelection(
					normalizedSource,
					selectedLinkRange.selection,
					selectedLinkRange.range,
				);
			}

			const linkSource = CheckListLink.buildSource(selection?.url ?? '', selectedText);
			if (!linkSource)
			{
				return {
					source: normalizedSource,
					selectionStart: start,
					selectionEnd: end,
				};
			}

			return {
				source: `${normalizedSource.slice(0, start)}${linkSource}${normalizedSource.slice(end)}`,
				selectionStart: start,
				selectionEnd: start + linkSource.length,
			};
		}

		const tag = FormattingTags[action];
		if (!tag)
		{
			return {
				source: normalizedSource,
				selectionStart: start,
				selectionEnd: end,
			};
		}

		const selectedFormattingRange = this.findSelectedFormattingRange(
			normalizedSource,
			selectionRange,
			this.getFormattingTagName(tag),
		);
		if (
			selectedFormattingRange
			&& this.canUnwrapCleanly(
				normalizedSource,
				selectedFormattingRange.range,
				selectedFormattingRange.selection,
			)
		)
		{
			return this.unwrapFormattingSelection(
				normalizedSource,
				selectedFormattingRange.selection,
				selectedFormattingRange.range,
			);
		}

		const wrappedSource = `${normalizedSource.slice(0, start)}${tag.open}${selectedText}${tag.close}${normalizedSource.slice(end)}`;

		if (start === end)
		{
			const cursor = start + tag.open.length;

			return {
				source: wrappedSource,
				selectionStart: cursor,
				selectionEnd: cursor,
			};
		}

		return {
			source: wrappedSource,
			selectionStart: start,
			selectionEnd: start + tag.open.length + selectedText.length + tag.close.length,
		};
	}

	static getFormattingTagName(tag: FormattingTag): string
	{
		return tag.open.slice(1, -1);
	}

	static canUnwrapCleanly(source: string, range: FormattingRange, selection: SelectionRange): boolean
	{
		const beforeSelection = source.slice(range.contentStart, selection.start);
		const afterSelection = source.slice(selection.end, range.contentEnd);

		if (CheckListFormattingTag.createRegExp().test(beforeSelection))
		{
			return false;
		}

		if (CheckListFormattingTag.createRegExp().test(afterSelection))
		{
			return false;
		}

		return true;
	}

	static getFormattingRanges(source: string, tagName: string): FormattingRange[]
	{
		const openedTags: { start: number, end: number, tag: string }[] = [];
		const ranges: FormattingRange[] = [];
		const normalizedTagName = this.normalizeTagName(tagName);

		const formattingTagRegExp = CheckListFormattingTag.createRegExp();
		let match = formattingTagRegExp.exec(source);
		while (match)
		{
			const currentTagName = this.normalizeTagName(match[2]);
			if (currentTagName === normalizedTagName)
			{
				if (match[1] === '/')
				{
					const openedTag = openedTags.pop();
					if (openedTag)
					{
						ranges.push({
							openStart: openedTag.start,
							openEnd: openedTag.end,
							openTag: openedTag.tag,
							contentStart: openedTag.end,
							contentEnd: match.index,
							closeStart: match.index,
							closeEnd: match.index + match[0].length,
							closeTag: match[0],
						});
					}
				}
				else
				{
					openedTags.push({
						start: match.index,
						end: match.index + match[0].length,
						tag: match[0],
					});
				}
			}

			match = formattingTagRegExp.exec(source);
		}

		return ranges;
	}

	static normalizeTagName(tagName: string): string
	{
		const normalizedTagName = tagName.toLowerCase();

		return normalizedTagName === 'url' ? 'URL' : normalizedTagName;
	}

	static findSelectedFormattingRange(
		source: string,
		selection: SelectionRange,
		tagName: string,
	): ?SelectedFormattingRange
	{
		const ranges = this.getFormattingRanges(source, tagName);

		const exactRange = ranges.find((range) => {
			return range.openStart === selection.start && range.closeEnd === selection.end;
		});
		if (exactRange)
		{
			return {
				range: exactRange,
				selection: {
					start: exactRange.contentStart,
					end: exactRange.contentEnd,
				},
			};
		}

		const containingRanges = ranges
			.filter((range) => {
				return range.contentStart <= selection.start && selection.end <= range.contentEnd;
			})
			.sort((a, b) => {
				return (a.contentEnd - a.contentStart) - (b.contentEnd - b.contentStart);
			})
		;

		const range = containingRanges[0];
		if (!range)
		{
			return null;
		}

		return {
			range,
			selection,
		};
	}

	static unwrapFormattingSelection(
		source: string,
		selection: SelectionRange,
		range: FormattingRange,
	): FormattingResult
	{
		const beforeRange = source.slice(0, range.openStart);
		const beforeSelection = source.slice(range.contentStart, selection.start);
		const selectedText = source.slice(selection.start, selection.end);
		const afterSelection = source.slice(selection.end, range.contentEnd);
		const afterRange = source.slice(range.closeEnd);

		const formattedBeforeSelection = beforeSelection ? `${range.openTag}${beforeSelection}${range.closeTag}` : '';
		const formattedAfterSelection = afterSelection ? `${range.openTag}${afterSelection}${range.closeTag}` : '';
		const selectionStart = beforeRange.length + formattedBeforeSelection.length;

		return {
			source: [
				beforeRange,
				formattedBeforeSelection,
				selectedText,
				formattedAfterSelection,
				afterRange,
			].join(''),
			selectionStart,
			selectionEnd: selectionStart + selectedText.length,
		};
	}
}
