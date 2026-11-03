import { NewLineMode } from '../constants';
import { AutoLinkPlugin } from '../plugins/auto-link';
import { BoldPlugin } from '../plugins/bold';
import { ClearFormatPlugin } from '../plugins/clear-format';
import { ClipboardPlugin } from '../plugins/clipboard';
import { CopilotPlugin } from '../plugins/copilot';
import { HistoryPlugin } from '../plugins/history';
import { ImagePlugin } from '../plugins/image';
import { ItalicPlugin } from '../plugins/italic';
import { LinkPlugin } from '../plugins/link';
import { ListPlugin } from '../plugins/list';
import { ParagraphPlugin } from '../plugins/paragraph';
import { PlaceholderPlugin } from '../plugins/placeholder';
import { RichTextPlugin } from '../plugins/rich-text';
import { SmileyPlugin } from '../plugins/smiley';
import { StrikethroughPlugin } from '../plugins/strikethrough';
import { ToolbarPlugin } from '../plugins/toolbar';
import { UnderlinePlugin } from '../plugins/underline';
import { VideoPlugin } from '../plugins/video';
import { TextEditor } from '../text-editor';
import { type TextEditorOptions } from '../types/text-editor-options';

/**
 * @memberof BX.UI.TextEditor
 */
export class RichText extends TextEditor
{
	static getDefaultOptions(): TextEditorOptions
	{
		return {
			plugins: [
				RichTextPlugin,
				ParagraphPlugin,
				ClipboardPlugin,
				BoldPlugin,
				ItalicPlugin,
				UnderlinePlugin,
				StrikethroughPlugin,
				ListPlugin,
				LinkPlugin,
				AutoLinkPlugin,
				ImagePlugin,
				VideoPlugin,
				SmileyPlugin,
				CopilotPlugin,
				ClearFormatPlugin,
				HistoryPlugin,
				ToolbarPlugin,
				PlaceholderPlugin,
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
