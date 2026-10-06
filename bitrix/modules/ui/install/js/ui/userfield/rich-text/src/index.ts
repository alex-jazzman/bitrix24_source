import { Event } from 'main.core';
import { RichTextControl } from './control';

Event.ready((): void => {
	RichTextControl.boot();
});

export { RichTextControl };
