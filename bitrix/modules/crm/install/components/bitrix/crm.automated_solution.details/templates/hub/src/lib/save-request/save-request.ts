import { type SavePayload } from '../../store/actions';

type SaveStore = {
	dispatch: (name: string, payload: SavePayload) => Promise<void>,
};

// The one save request of the hub: the store action gets the field rule for the request copy of the description and
// the read-only mode of the hub, which decides whether the page switch is sent.
export function dispatchSave(
	store: SaveStore,
	normalizeDescription: (value: unknown) => string,
	readOnly: boolean,
): Promise<void>
{
	return store.dispatch('save', { normalizeDescription, readOnly });
}
