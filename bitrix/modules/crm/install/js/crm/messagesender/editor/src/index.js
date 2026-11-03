import {
	type Backend,
	type Channel,
	type From,
	type To,
	replaceCustomMessagePlaceholders,
} from 'messageservice.message.editor';

import { Editor, type State, type EditorOptions, type Context } from './editor';
import { EscapeService } from './service/escape-service';

export { Editor, EscapeService, replaceCustomMessagePlaceholders };

export type {
	State,
	EditorOptions,
	Context,
	Backend,
	Channel,
	From,
	To,
};
