import { Type } from 'main.core';
import { PullClient } from 'pull.client';

const BACKLINKS_PUSH_COMMAND = 'documentBacklinksChanged';
// The module's "your shared tree changed, refetch it" signal, sent on an ACL grant/revoke among the
// rest. It concerns us because the count is personal: a source the reader just lost access to has to
// leave their number and their list. It travels on the reader's own channel and names other
// documents, not this one, so it is never matched against documentId.
const ACCESS_CASCADE_PUSH_COMMAND = 'documentAccessCascade';

// [EVENT-01] Subscribes to everything that can change what this reader sees as the backlinks of one
// document: the "backlinks changed" signal on the document's own channel and the ACL cascade on the
// reader's. `onChange()` takes no argument on purpose: the counter is personal, so no signal carries
// a value and a consumer re-reads its own number through [API-02]. Returns a disposer. Safe to call
// before BX.PULL exists (no-op disposer).
export function subscribeDocumentBacklinks(documentId: number, onChange: () => void): () => void
{
	const id = Number(documentId);
	if (!Type.isFunction(BX?.PULL?.subscribe) || !(id > 0) || !Type.isFunction(onChange))
	{
		return () => {};
	}

	const handler = (data) => {
		const command = data?.command;
		const isOurBacklinkChange = command === BACKLINKS_PUSH_COMMAND
			&& Number(data?.params?.documentId) === id;
		if (!isOurBacklinkChange && command !== ACCESS_CASCADE_PUSH_COMMAND)
		{
			return;
		}

		onChange();
	};

	const unsubscribe = BX.PULL.subscribe({
		type: PullClient.SubscriptionType.Server,
		moduleId: 'note',
		callback: handler,
	});

	return () => {
		if (typeof unsubscribe === 'function')
		{
			unsubscribe();
		}
	};
}
