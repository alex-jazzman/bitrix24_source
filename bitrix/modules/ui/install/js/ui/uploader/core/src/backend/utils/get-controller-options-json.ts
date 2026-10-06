import { type Server } from '../server';

/**
 * Serialises the current Server's controllerOptions for transport over the
 * AJAX action query string. Returns null when no options are configured so the
 * caller can skip emitting the parameter entirely.
 */
export function getControllerOptionsJSON(server: Server): string | null | undefined
{
	const controllerOptions = server.getControllerOptions();

	return controllerOptions ? JSON.stringify(controllerOptions) : null;
}
