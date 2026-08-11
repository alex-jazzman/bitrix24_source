import {
	type Backend,
	type Channel,
	type From,
	type To,
	replaceCustomMessagePlaceholders,
} from 'messageservice.message.editor';

import { Editor, type State, type EditorOptions, type Context } from './editor';

export { Editor, replaceCustomMessagePlaceholders };

export type {
	State,
	EditorOptions,
	Context,
	Backend,
	Channel,
	From,
	To,
};
