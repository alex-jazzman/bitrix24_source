/* eslint-disable */
type MigrationStatusDto = {
	mailboxId: number;
	visibility: MigrationVisibility;
	status: MigrationPublicStatus;
	reason: string | null;
};

type MigrationVisibility = 'hidden' | 'active' | 'terminal';

type MigrationPublicStatus = 'running' | 'waiting' | 'switching' | 'blocked' | 'cancelling' | 'done' | 'cancelled' | null;

type MigrationStateListener = (change: MigrationStateChange) => void;

type MigrationStateChange = {
	status: MigrationStatusDto;
	active: boolean;
	previousActive: boolean;
	source: 'initial' | 'pull';
};

declare namespace BX.Mail {
	function getMigrationState(mailboxId: number): MigrationState;

	class MigrationState {
		constructor(mailboxId: number, onUnused?: (state: MigrationState) => void);
		initialize(): Promise<MigrationStatusDto>;
		getStatus(): MigrationStatusDto;
		isActive(): boolean;
		isInitialized(): boolean;
		subscribe(listener: MigrationStateListener): () => void;
		destroy(): void;
		applyPull(payload: unknown): void;
	}

	function clearMigrationStates(): void;
}
