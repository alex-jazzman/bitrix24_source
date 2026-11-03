// Wrap a click handler so a blocked button swallows the click (keyboard/mouse) but stays focusable/announced.
export function guardedClick(button, fn)
{
	return (...args) => (button.blocked === true ? undefined : fn(...args));
}
