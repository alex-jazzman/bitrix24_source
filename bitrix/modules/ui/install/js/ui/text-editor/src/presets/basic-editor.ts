import { NewLineMode } from '../constants';
import { AutoLinkPlugin } from '../plugins/auto-link';
import { BlockToolbarPlugin } from '../plugins/block-toolbar';
import { BoldPlugin } from '../plugins/bold';
import { ClipboardPlugin } from '../plugins/clipboard';
import { CopilotPlugin } from '../plugins/copilot';
import { FilePlugin } from '../plugins/file';
import { FloatingToolbarPlugin } from '../plugins/floating-toolbar';
import { HistoryPlugin } from '../plugins/history';
import { ImagePlugin } from '../plugins/image';
import { ItalicPlugin } from '../plugins/italic';
import { LinkPlugin } from '../plugins/link';
import { ListPlugin } from '../plugins/list';
import { MentionPlugin } from '../plugins/mention';
import { ParagraphPlugin } from '../plugins/paragraph';
import { PlaceholderPlugin } from '../plugins/placeholder';
import { RichTextPlugin } from '../plugins/rich-text';
import { StrikethroughPlugin } from '../plugins/strikethrough';
import { TabIndentPlugin } from '../plugins/tab-indent';
import { ToolbarPlugin } from '../plugins/toolbar';
import { UnderlinePlugin } from '../plugins/underline';
import { TextEditor } from '../text-editor';
import { type TextEditorOptions } from '../types/text-editor-options';

/**
 * @memberof BX.UI.TextEditor
 */
export class BasicEditor extends TextEditor
{
	static getDefaultOptions(): TextEditorOptions
	{
		return {
			plugins: [
				RichTextPlugin,
				ParagraphPlugin,
				ClipboardPlugin,
				BoldPlugin,
				UnderlinePlugin,
				ItalicPlugin,
				StrikethroughPlugin,
				TabIndentPlugin,
				ListPlugin,
				MentionPlugin,
				LinkPlugin,
				AutoLinkPlugin,
				ImagePlugin,
				CopilotPlugin,
				HistoryPlugin,
				BlockToolbarPlugin,
				FloatingToolbarPlugin,
				ToolbarPlugin,
				PlaceholderPlugin,
				FilePlugin,
			],

			toolbar: [
				'bold',
				'italic',
				'underline',
				'strikethrough',
				'|',
				'numbered-list',
				'bulleted-list',
				'|',
				'link',
				'copilot',
			],

			newLineMode: NewLineMode.MIXED,
		};
	}
}
