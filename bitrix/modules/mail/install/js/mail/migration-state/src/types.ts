export type MigrationVisibility = 'hidden' | 'active' | 'terminal';

export type MigrationPublicStatus =
	| 'running'
	| 'waiting'
	| 'switching'
	| 'blocked'
	| 'cancelling'
	| 'done'
	| 'cancelled'
	| null
;

export type MigrationStatusDto = {
	mailboxId: number,
	visibility: MigrationVisibility,
	status: MigrationPublicStatus,
	reason: string | null,
};

export type MigrationStateChange = {
	status: MigrationStatusDto,
	active: boolean,
	previousActive: boolean,
	source: 'initial' | 'pull',
};

export type MigrationStateListener = (change: MigrationStateChange) => void;
