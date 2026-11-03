/**
 * Pass-through parameters of a connection: the transport forwards them to acquisition and to the
 * balancer as payload and never branches on them. The meaning of a room type, a call type, a limit
 * or a role belongs to the layers above - that is what keeps the transport unaware of the kind of
 * call it serves. Typed as primitives on purpose: a closed enum here would be exactly the knowledge
 * the transport must not hold.
 */
export type TransportVariators = {
	scheme: number,
	provider: string,
	roomType: number,
	callType: number,
	callUuid?: string,
	usersLimit?: number,
	userRoles?: unknown,
};
