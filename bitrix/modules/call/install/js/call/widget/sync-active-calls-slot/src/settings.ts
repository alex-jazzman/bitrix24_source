import { Extension } from 'main.core';

const EXTENSION_NAME = 'call.widget.sync-active-calls-slot';

/**
 * The list of active calls of the web SDK is on for the current user: the option
 * `call / sync_active_calls_enabled`, read by `Settings::isSyncActiveCallsEnabled()`.
 */
export function isSyncActiveCallsEnabled(): boolean
{
	return Extension.getSettings(EXTENSION_NAME).get('syncActiveCallsEnabled', false) === true;
}
