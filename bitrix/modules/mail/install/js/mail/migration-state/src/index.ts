import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { MigrationState } from './migration-state';

const PullCommand = 'mailbox_migration_status_changed';
const states = new Map<number, MigrationState>();
let pullSubscribed = false;

type PullEvent = {
	getData(): [string, unknown],
};

const handlePull = (event: PullEvent): void => {
	const [command, payload] = event.getData();
	if (command !== PullCommand || !Type.isObject(payload))
	{
		return;
	}

	const mailboxId = Number((payload as Record<string, unknown>).mailboxId ?? 0);
	states.get(mailboxId)?.applyPull(payload);
};

function ensurePullSubscription(): void
{
	if (!pullSubscribed)
	{
		EventEmitter.subscribe('onPullEvent-mail', handlePull);
		pullSubscribed = true;
	}
}

function releaseState(mailboxId: number, state: MigrationState): void
{
	if (states.get(mailboxId) !== state)
	{
		return;
	}

	states.delete(mailboxId);
	state.destroy();
	if (states.size === 0 && pullSubscribed)
	{
		EventEmitter.unsubscribe('onPullEvent-mail', handlePull);
		pullSubscribed = false;
	}
}

export function getMigrationState(mailboxId: number): MigrationState
{
	if (!states.has(mailboxId))
	{
		ensurePullSubscription();
		states.set(mailboxId, new MigrationState(
			mailboxId,
			(state): void => releaseState(mailboxId, state),
		));
	}

	return states.get(mailboxId) as MigrationState;
}

export function clearMigrationStates(): void
{
	states.forEach((state): void => state.destroy());
	states.clear();
	if (pullSubscribed)
	{
		EventEmitter.unsubscribe('onPullEvent-mail', handlePull);
		pullSubscribed = false;
	}
}

export { MigrationState } from './migration-state';
export type {
	MigrationPublicStatus,
	MigrationStateChange,
	MigrationStateListener,
	MigrationStatusDto,
	MigrationVisibility,
} from './types';
