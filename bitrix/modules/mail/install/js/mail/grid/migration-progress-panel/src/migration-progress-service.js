import { ajax } from 'main.core';

export type MigrationProgress = {
	mailboxId: number,
	operationId: ?string,
	availability: string,
	status: ?string,
	stage: ?string,
	reason: ?string,
	missingFolderRole: ?string,
	nextAttemptAt: ?number,
	lastProgressAt: ?number,
	sampledAt: ?number,
	snapshotAccepted: ?boolean,
	switchAuthorized: ?boolean,
	manualControl: ?MigrationManualControl,
	metrics: { importProcessed: ?number, tailAppended: ?number },
	warnings: Array<{ code: string, count: number }>,
};

export type MigrationManualControlCommand = 'enable' | 'grant' | 'automatic';

export type MigrationManualControl = {
	enabled: boolean,
	waiting: boolean,
	checkpoint: ?string,
	version: number,
	granted: boolean,
	waitingSince: ?number,
	allowedCommands: MigrationManualControlCommand[],
};

type RequestError = {
	status?: number | string,
	ajaxRejectData?: { xhr?: { status?: number } },
	errors?: Array<{ code: number | string }>,
};

export class MigrationProgressService
{
	getProgress(mailboxId: number): Promise<MigrationProgress>
	{
		return ajax.runAction('mail.api.migration.getAdminProgress', {
			method: 'POST',
			data: { mailboxId },
		}).then((response) => response.data.progress);
	}

	setManualControl(
		mailboxId: number,
		operationId: string,
		command: MigrationManualControlCommand,
		expectedVersion: number,
		expectedCheckpoint: ?string,
	): Promise<MigrationProgress>
	{
		return ajax.runAction('mail.api.migration.setManualControl', {
			method: 'POST',
			data: {
				mailboxId,
				operationId,
				command,
				expectedVersion,
				expectedCheckpoint,
			},
		}).then((response) => response.data.progress);
	}

	getErrorCodes(error: RequestError): Set<string>
	{
		return new Set([
			String(error?.status),
			String(error?.ajaxRejectData?.xhr?.status),
			...(error?.errors ?? []).map((item) => String(item.code)),
		]);
	}

	isAccessDenied(error: RequestError): boolean
	{
		const codes = new Set(['401', '403', 'ACCESS_DENIED', 'access_denied', 'invalid_authentication']);

		return [...this.getErrorCodes(error)].some((code) => codes.has(code));
	}
}
