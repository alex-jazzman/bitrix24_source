/**
 * Everyone who has the document open. A participant is described by exactly what the server tells
 * about them - a name and an avatar - and nothing is derived on the client: seeing the list gives no
 * rights either on the object or on the profiles.
 */
export type PresenceParticipant = {
	id: number,
	name: string,
	avatar: string,
	// every anonymous viewer of the opening arrives as one participant, and only in the starting roster
	isGuest: boolean,
};

/** The starting roster of the opening: the composition confirmed by the server and its revision. */
export type PresenceRoster = {
	revision: number,
	participants: PresenceParticipant[],
};

export type PresenceState = {
	participants: PresenceParticipant[],
	revision: number,
	// false until the starting roster arrives: an incomplete stack must not be shown at all
	isAvailable: boolean,
	// the scope of this opening; a live event about any other one is not ours
	scope: string,
};
