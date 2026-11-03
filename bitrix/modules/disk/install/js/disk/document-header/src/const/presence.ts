/**
 * The live channel of the roster. The server sends the name of the command in the presence
 * configuration of the opening; the header keeps the expected value here and compares the two, so the
 * name is never written down a second time.
 */
export const PresencePullContract = Object.freeze({
	moduleId: 'disk',
	command: 'documentPresence',
} as const);

/**
 * The registration of the opening in the roster. The shell of the page serves these actions, and the
 * server sends their names in the same configuration - the header only compares them with what it
 * expects, exactly as it does with the name of the pull command.
 */
export const PresenceActionContract = Object.freeze({
	enter: 'presenceEnter',
	heartbeat: 'presenceHeartbeat',
	leave: 'presenceLeave',
} as const);

export type PresenceActions = {
	enter: string,
	heartbeat: string,
	leave: string,
};

/** The part of the presence configuration of the server the header itself reads. */
export type PresenceConfig = {
	enabled: boolean,
	moduleId: string,
	command: string,
	scope: string,
	// the channel of the recipient, as the pull client of the page expects it
	pullConfig: Record<string, unknown>,
	// the signed binding of this opening; the server answers no presence request without it
	presenceContext: string,
	// how often the registration of the opening has to be confirmed, in milliseconds
	heartbeatInterval: number,
	actions: PresenceActions,
};
