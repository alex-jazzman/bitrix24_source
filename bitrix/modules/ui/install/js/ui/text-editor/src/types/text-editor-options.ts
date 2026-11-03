import { type BaseEvent } from 'main.core.events';
import { type DialogOptions } from 'ui.entity-selector';
import { type UploaderFileInfo } from 'ui.uploader.core';

import { type CopilotOptions } from 'ai.copilot';

import { type PluginConstructor } from '../plugins/base-plugin';
import { type InitialEditorStateType } from './initial-editor-state-type';
import { type NewLineModeType } from './new-line-mode-type';

export type TextEditorOptions = {
	content?: string;
	editorState?: InitialEditorStateType;

	plugins?: Array<string | PluginConstructor>;
	extraPlugins?: Array<string | PluginConstructor>;
	removePlugins?: Array<string | PluginConstructor>;

	toolbar?: string[];
	hideToolbar?: boolean;
	floatingToolbar?: string[];

	newLineMode?: NewLineModeType;
	autoFocus?: boolean;
	minHeight?: number;
	maxHeight?: number;
	editable?: number;
	collapsingMode?: boolean;

	placeholder?: string;
	paragraphPlaceholder?: string | 'auto';

	/** The accessible name of the editing area. Falls back to a generic phrase. */
	ariaLabel?: string;

	visualOptions?: {
		borderRadius?: string;
		borderWidth?: string;
		borderStyle?: string;
		borderColorBase?: string;
		borderColorFocus?: string;

		colorBackground?: string;
		colorSelection?: string;
		colorToolbarBackground?: string;
		colorToolbarBorder?: string;

		blockSpaceInline?: string;
		blockSpaceStack?: string;
	};

	namespace?: string;
	events?: Record<string, (event: BaseEvent) => void>;

	mention?: {
		dialogOptions?: DialogOptions;
		entities?: string[];
	};

	copilot?: {
		copilotOptions?: CopilotOptions;
		triggerBySpace?: boolean;
	};

	file?: {
		mode?: 'disk' | 'file';
		files?: UploaderFileInfo[];
	};

	list?: {
		maxIndent?: number;
	};
};
