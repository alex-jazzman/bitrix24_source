import { Loc, Text } from 'main.core';
import { announce } from 'bizproc.a11y';
import { UI } from 'ui.notification';

/** Says a word of the pass to the person: the balloon carries no live region of its own. */
export function notifyPass(messageCode: string): void
{
	const content = Loc.getMessage(messageCode);

	// the balloon renders a string as HTML, and a phrase of the pass may come with a substitution
	UI.Notification.Center.notify({ content: Text.encode(content) });
	announce(content);
}
