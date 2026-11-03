import { Extension } from 'main.core';

const CHART_EXTENSION_NAME = 'bizprocdesigner.editor.chart';

/**
 * Whether the person in the editor is an administrator of the portal, as the lease actions of the
 * controller understand it. Only the offer is decided here: whose lease may be released is decided by
 * the server, and a flag tampered with in the browser changes nothing but the menu.
 */
export function isPortalAdmin(): boolean
{
	return Extension.getSettings(CHART_EXTENSION_NAME)?.get('isPortalAdmin', false) === true;
}
