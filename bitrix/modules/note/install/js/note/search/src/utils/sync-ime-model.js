/**
 * IME-safe v-model alternative for mobile inputs.
 *
 * Mobile IMEs (Android Gboard, iOS suggestions) update <input>.value via
 * composition events. Vue's v-model defers reactive updates until
 * `compositionend`, so the bound property lags behind the visible value
 * during typing -- debounced search/validate logic never sees the in-flight
 * characters.
 *
 * Read event.target.value on input/compositionend/change events and write it
 * back to the component property. For non-IME input the values already match,
 * so the guard makes the call a no-op.
 *
 * Duplicated in note.sidebar/src/utils/ to avoid cyclic dependency:
 * note.app imports from note.sidebar, so the helper cannot live in note.app.
 */
export function syncIMEModel(component, key, event)
{
	const next = event?.target?.value ?? component[key];
	if (component[key] !== next)
	{
		component[key] = next;
	}

	return next;
}
