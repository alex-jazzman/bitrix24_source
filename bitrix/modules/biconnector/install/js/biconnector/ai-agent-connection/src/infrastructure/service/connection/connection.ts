import { ajax, Type } from 'main.core';
import {
	ConnectionAction,
	type ConnectionResponse,
	type ConnectionTransport,
	NETWORK_ERROR_CODE,
} from '../../../const/connection';

// A changing request holds the popup open and its button off (AC-012), so an unlimited wait would
// leave a person locked there with no way out but a page reload. Less than thirty seconds would turn
// a live but slow external circuit into a false unknown result; on expiry the core aborts the request
// and synthesizes a network error, which is that same unknown result.
const REQUEST_TIMEOUT_SECONDS = 30;

// The code the core itself synthesizes; it is declared in the registry of the constants, where the
// classification reads it as well.
export { NETWORK_ERROR_CODE };

// A rejection that is not an envelope is reported with that same code.
const buildNetworkErrorResponse = (): ConnectionResponse => {
	return {
		status: 'error',
		data: null,
		errors: [{ code: NETWORK_ERROR_CODE, message: 'Network error' }],
	};
};

const isConnectionResponse = (value: unknown): value is ConnectionResponse => {
	return Type.isPlainObject(value) && Type.isArray(value.errors);
};

class ConnectionService implements ConnectionTransport
{
	getState(): Promise<ConnectionResponse>
	{
		return this.#run(ConnectionAction.GetState);
	}

	issue(): Promise<ConnectionResponse>
	{
		return this.#run(ConnectionAction.Issue);
	}

	reissue(): Promise<ConnectionResponse>
	{
		return this.#run(ConnectionAction.Reissue);
	}

	// Any outcome comes up as a value: the transport neither reads the envelope nor tells a refusal
	// from a success, and it swallows the rejection here; an unswallowed one would print an error to
	// the console and break AC-002. The actions take no input; POST and the session header the call
	// adds itself.
	async #run(action: ConnectionAction): Promise<ConnectionResponse>
	{
		try
		{
			return await ajax.runAction(action, { data: {}, timeout: REQUEST_TIMEOUT_SECONDS });
		}
		catch (rejection)
		{
			return isConnectionResponse(rejection) ? rejection : buildNetworkErrorResponse();
		}
	}
}

export const connectionService: ConnectionTransport = new ConnectionService();
