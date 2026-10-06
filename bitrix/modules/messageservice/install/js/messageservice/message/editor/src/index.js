import 'ui.design-tokens';
import 'ui.design-tokens.air';

import { type TemplatePlaceholder } from './components/editor-header/custom-template-selector';
import { ContentProvider } from './content-provider/content-provider';
import { type ContentProviderFactory } from './content-provider/content-provider-factory';
import { type InsertContext } from './content-provider/insert-context';
import {
	Editor,
	type Backend,
	type Channel,
	type EditorOptions,
	type From,
	type State,
	type TemplateBinding,
	type To,
} from './editor';
import { replaceCustomMessagePlaceholders } from './utils';

import './css/base.css';

export {
	Editor,
	ContentProvider,
	replaceCustomMessagePlaceholders,
};

export type {
	EditorOptions,
	TemplateBinding,
	Channel,
	Backend,
	State,
	From,
	To,
	ContentProviderFactory,
	InsertContext,
	TemplatePlaceholder,
};
