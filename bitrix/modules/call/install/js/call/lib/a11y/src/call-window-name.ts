import { Text, Type } from 'main.core';

import { CallWindowNameType, type CallWindowNameTypeValue } from 'call.lib.view-contract';

type CallWindowNameEntity = {
	name?: string;
	advanced?: { chatType?: string };
};

type PreparedCallSource = {
	user?: number | string | null;
	userData?: { [userId: string]: { name?: string } | null } | null;
};

type CallWindowNameSources = {
	entity?: CallWindowNameEntity | null;
	preparedCall?: PreparedCallSource | null;
};

export type CallWindowName = {
	name: string;
	type: CallWindowNameTypeValue;
};

/**
 * Conference is a special case of a group call, so it is matched first. Only the private type is
 * recognised by name: a call from any other kind of chat (collab, task, CRM...) stays a group call.
 */
export function resolveCallWindowNameType(entity: CallWindowNameEntity | null): CallWindowNameTypeValue
{
	if (!entity)
	{
		return CallWindowNameType.Private;
	}

	const chatType = entity.advanced?.chatType;

	if (chatType === 'videoconf')
	{
		return CallWindowNameType.Conference;
	}

	// The server never sends a user entity: getEntityType() is hardcoded to 'chat', so a private call
	// is told apart by the chat type, which comes under two names. It is 'private' in the server
	// dictionary, the ExtendedType of an incoming call payload, and 'user' in the client one, the
	// ChatType of im.v2.const that names the chat an outgoing call starts from. im equates the two
	// itself. See SERVER_USER_CHAT_TYPE in im/install/js/im/v2/lib/permission/src/permission.js.
	if (chatType === 'private' || chatType === 'user')
	{
		return CallWindowNameType.Private;
	}

	return CallWindowNameType.Group;
}

/**
 * Names the call window from the first source that has a name. The call is authoritative; the
 * prepared start only stands in for it while the window is already shown and the call is not
 * created yet, and it never describes anything but a private call.
 */
export function resolveCallWindowName(sources: CallWindowNameSources): CallWindowName | null
{
	return nameFromCall(sources.entity) ?? nameFromPreparedCall(sources.preparedCall);
}

function nameFromCall(entity: CallWindowNameEntity | null | undefined): CallWindowName | null
{
	if (!entity)
	{
		return null;
	}

	// Decoded here: an entity built from a server payload carries the name HTML-encoded.
	const name = Text.decode(entity.name ?? '');

	if (!Type.isStringFilled(name))
	{
		return null;
	}

	return { name, type: resolveCallWindowNameType(entity) };
}

function nameFromPreparedCall(preparedCall: PreparedCallSource | null | undefined): CallWindowName | null
{
	// Only a private start carries a companion: call-manager fills `user` for a user dialog alone, and
	// for a group chat the prepared payload has no name of the chat to offer at all.
	const companionId = preparedCall?.user;

	if (!companionId)
	{
		return null;
	}

	// Not decoded: this name comes from the im user model, which runs Text.decode when it stores it
	// (see userFieldsConfig in im.v2.model). Decoding it again would eat a real ampersand.
	const name = preparedCall?.userData?.[companionId]?.name ?? '';

	if (!Type.isStringFilled(name))
	{
		return null;
	}

	return { name, type: CallWindowNameType.Private };
}
