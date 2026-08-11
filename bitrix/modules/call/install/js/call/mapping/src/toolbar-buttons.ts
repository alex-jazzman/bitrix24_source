/** Store/Vue button display name → Legacy/Controller action name. */

export type ButtonDisplayName =
	| 'microphone'
	| 'camera'
	| 'screen'
	| 'addUser'
	| 'chat'
	| 'users'
	| 'history'
	| 'floorRequest'
	| 'record'
	| 'copilot'
	| 'document';

export type ButtonActionName =
	| 'toggleMute'
	| 'toggleVideo'
	| 'toggleScreenSharing'
	| 'inviteUser'
	| 'showChat'
	| 'toggleUsers'
	| 'showHistory'
	| 'toggleFloorRequest'
	| 'toggleRecord'
	| 'toggleCopilot'
	| 'toggleDocument';

const StoreToControllerButtonMap: Record<ButtonDisplayName, ButtonActionName> = Object.freeze({
	microphone: 'toggleMute',
	camera: 'toggleVideo',
	screen: 'toggleScreenSharing',
	addUser: 'inviteUser',
	chat: 'showChat',
	users: 'toggleUsers',
	history: 'showHistory',
	floorRequest: 'toggleFloorRequest',
	record: 'toggleRecord',
	copilot: 'toggleCopilot',
	document: 'toggleDocument',
});

/**
 * Returns the controller action name for a given store button name.
 * Unknown names pass through unchanged.
 */
export function toControllerAction(name: ButtonDisplayName): ButtonActionName;
export function toControllerAction(name: string): string;
export function toControllerAction(name: string): string
{
	return StoreToControllerButtonMap[name as ButtonDisplayName] ?? name;
}
