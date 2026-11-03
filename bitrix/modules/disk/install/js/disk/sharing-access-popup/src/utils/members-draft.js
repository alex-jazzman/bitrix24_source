// Merge selector items into the members draft while keeping the current row order stable:
// retained members follow sourceMembersById order, new members are appended in items order,
// and readOnly members that dropped out of items are kept at the end.
export function mergeMembersDraft(items, sourceMembersById, savedMembersById, maxTaskName, defaultRight)
{
	const itemById = {};
	items.forEach((item) => {
		itemById[item.entityId] = item;
	});

	const orderedEntityIds = [
		...Object.keys(sourceMembersById).filter((entityId) => itemById[entityId]),
		...items.map((item) => item.entityId).filter((entityId) => !sourceMembersById[entityId]),
	];

	const nextDraftById = {};

	orderedEntityIds.forEach((entityId) => {
		const item = itemById[entityId];
		const existing = sourceMembersById[entityId] ?? savedMembersById[entityId];
		// The selector classifies members by its own rules, so for a member we already have
		// the server values stay authoritative, including a meaningful null.
		const appearanceSource = existing ?? item;

		nextDraftById[entityId] = {
			entityId: item.entityId,
			title: item.title,
			avatar: item.avatar,
			memberType: appearanceSource.memberType ?? null,
			ownAvatar: appearanceSource.ownAvatar ?? null,
			right: existing?.right ?? defaultRight,
			maxTaskName: existing?.maxTaskName ?? maxTaskName,
			readOnly: existing?.readOnly ?? false,
		};
	});

	Object.values({ ...savedMembersById, ...sourceMembersById }).forEach((member) => {
		if (member.readOnly && !nextDraftById[member.entityId])
		{
			nextDraftById[member.entityId] = member;
		}
	});

	return nextDraftById;
}
