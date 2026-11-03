import { CallCommonRecordState, CallCommonRecordType } from 'call.core';

// A fresh object on every call: the record menu edits the state in place while it waits for the
// server, so a shared one would leak between the call window and the picture-in-picture window.
export function createDefaultCommonRecordState()
{
	return {
		state: CallCommonRecordState.Stopped,
		type: CallCommonRecordType.None,
		userId: 0,
		date: {
			start: null,
			pause: [],
		},
	};
}
