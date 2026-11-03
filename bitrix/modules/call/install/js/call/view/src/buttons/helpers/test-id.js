/**
 * Test hooks of the call control panel.
 *
 * The button class is the identity of a panel item, so both button families derive their
 * hooks from it instead of taking one more config field: a hook cannot drift from the item
 * it marks, and a new button gets its hook for free.
 *
 * The prefix names the panel the item belongs to. Panels reuse button classes, so the class
 * alone is not unique in the document: the call panel keeps the default prefix, a panel that
 * lives in its own window passes its own.
 *
 * Nested hooks are the item hook plus a suffix, e.g. `call-panel-chat-counter`.
 */
export function panelTestId(buttonClass, prefix = 'call-panel')
{
	// class tokens come in both spellings (`floor-request`, `returnToCall`), hooks stay kebab
	const name = buttonClass.replaceAll(/([\da-z])([A-Z])/g, '$1-$2').toLowerCase();

	return `${prefix}-${name}`;
}
