import { Loc } from 'main.core';
import { LiveAnnouncer } from 'ui.a11y';

const listedNamesLimit = 3;

const pendingNames: Set<string> = new Set();
let isFlushScheduled = false;

function buildMessage(names: string[]): string
{
	if (names.length === 1)
	{
		return Loc.getMessage('TASKS_V2_ABSENCE_POPUP_ANNOUNCE', { '#USER_NAME#': names[0] });
	}

	if (names.length <= listedNamesLimit)
	{
		return Loc.getMessage('TASKS_V2_ABSENCE_POPUP_ANNOUNCE_LIST', { '#USER_NAMES#': names.join(', ') });
	}

	return Loc.getMessagePlural('TASKS_V2_ABSENCE_POPUP_ANNOUNCE_COUNT', names.length, {
		'#COUNT#': String(names.length),
	});
}

function flush(): void
{
	isFlushScheduled = false;

	const names = [...pendingNames];
	pendingNames.clear();

	if (names.length > 0)
	{
		LiveAnnouncer.announce(buildMessage(names));
	}
}

/**
 * One popup is mounted per absent participant, and the live region plays messages
 * one after another. Names are collected across the whole mount flush and spoken
 * as a single message, so the region is not held busy for the whole list.
 */
export function announceAbsentParticipant(userName: string): void
{
	pendingNames.add(userName);

	if (isFlushScheduled)
	{
		return;
	}

	isFlushScheduled = true;
	void Promise.resolve().then(flush);
}
