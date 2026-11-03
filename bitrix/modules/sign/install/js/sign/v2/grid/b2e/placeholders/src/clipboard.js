/**
 * Copying with an unambiguous answer. The clipboard of the browser goes first, the temporary
 * textarea of this extension picks up any refusal, and the caller learns whether the text really
 * reached the clipboard: only then the row may report success.
 */

import { Dom, Type } from 'main.core';

export type ClipboardBackends = {
	/** Clipboard of the browser; rejects when the page is not allowed to use it. */
	writeText: (text: string) => Promise<void>,
	/** Temporary textarea; the result of `document.execCommand` is the answer. */
	copyViaTextarea: (text: string) => boolean,
};

const writeTextOfBrowser = (text: string): Promise<void> => {
	if (!navigator.clipboard || !window.isSecureContext)
	{
		return Promise.reject(new Error('Clipboard of the browser is unavailable'));
	}

	return navigator.clipboard.writeText(text);
};

const copyViaTextarea = (text: string): boolean => {
	const focusedBeforeCopy = document.activeElement;
	const textarea = document.createElement('textarea');
	textarea.value = text;
	textarea.readOnly = true;
	// Out of the view of the page: a field inserted into the flow would pull the scroll to itself.
	Dom.style(textarea, {
		position: 'fixed',
		top: '0',
		left: '-9999px',
	});
	Dom.append(textarea, document.body);
	textarea.select();

	try
	{
		return document.execCommand('copy');
	}
	catch (error)
	{
		console.error('Failed to copy via the textarea of the extension:', error);

		return false;
	}
	finally
	{
		Dom.remove(textarea);

		// `select()` takes the focus and the removal of the textarea loses it: the zone of the row the
		// user copied from has to keep its place in the list, and the scroll of the list with it.
		// The node is recognised by the predicate of the core and never by `instanceof`: a page of the
		// portal may hold no usable global constructor, and a throw here would take the answer of the
		// copy with it.
		if (Type.isElementNode(focusedBeforeCopy))
		{
			focusedBeforeCopy.focus({ preventScroll: true });
		}
	}
};

const browserBackends: ClipboardBackends = {
	writeText: writeTextOfBrowser,
	copyViaTextarea,
};

export const copyToClipboard = async (
	text: string,
	backends: ClipboardBackends = browserBackends,
): Promise<boolean> => {
	try
	{
		await backends.writeText(text);

		return true;
	}
	catch
	{
		return backends.copyViaTextarea(text);
	}
};
