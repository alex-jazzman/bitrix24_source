import { type TextEditorOptions } from 'ui.text-editor';
import { NewLineMode } from '../constants';
import { TextEditor } from '../text-editor';

/**
 * @memberof BX.UI.TextEditor
 */
export class RichText extends TextEditor
{
	static getDefaultOptions(): TextEditorOptions
	{
		return {
			plugins: [
				'RichText',
				'Paragraph',
				'Clipboard',
				'Bold',
				'Italic',
				'Underline',
				'Strikethrough',
				'List',
				'Link',
				'AutoLink',
				'Image',
				'Video',
				'Smiley',
				'Copilot',
				'ClearFormat',
				'History',
				'Toolbar',
				'Placeholder',
			],
			toolbar: [
				'bold', 'italic', 'underline', 'strikethrough',
				'|',
				'numbered-list', 'bulleted-list',
				'|',
				'link', 'image', 'video', 'smileys',
				'|',
				'clear-format',
			],
			newLineMode: NewLineMode.MIXED,
		};
	}
}
