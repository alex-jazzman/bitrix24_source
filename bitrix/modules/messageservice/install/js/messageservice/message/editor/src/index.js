import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { ContentProvider } from './content-provider/content-provider';
import { type ContentProviderFactory } from './content-provider/content-provider-factory';
import { type InsertContext } from './content-provider/insert-context';
import { Editor, type EditorOptions, type From, type State, type To, type Channel, type Backend } from './editor';
import { replaceCustomMessagePlaceholders } from './utils';

import './css/base.css';

export {
	Editor,
	ContentProvider,
	replaceCustomMessagePlaceholders,
};

export type {
	EditorOptions,
	Channel,
	Backend,
	State,
	From,
	To,
	ContentProviderFactory,
	InsertContext,
};
