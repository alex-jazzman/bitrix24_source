import type {
	DepartmentEmployee,
	MailboxPayload,
	MassConnectDataType,
	MailboxLimitItem,
} from './store/type';

export const Api = {
	connectMailbox: async (mailbox: MailboxPayload, massConnectId: number): Promise<void> => {
		return BX.ajax.runAction('mail.mailboxconnecting.connectMailboxFromMassconnect', {
			data: { mailbox, massConnectId },
		});
	},

	createPasswordlessRequest: async (
		mailbox: MailboxPayload,
	): Promise<{ status: string, data: { mailboxId: number, email: string }, errors: Array }> => {
		return BX.ajax.runAction('mail.mailboxconnecting.createPasswordlessRequest', {
			data: { mailbox },
		});
	},

	validateConnectionSettings: async (
		settings: Object,
	): Promise<{ status: string, data: { valid: boolean }, errors: Array }> => {
		return BX.ajax.runAction('mail.mailboxconnecting.validateConnectionSettings', {
			data: { mailbox: settings },
		});
	},

	saveMailboxConnectionData: async (
		massConnectData: MassConnectDataType,
	): Promise<{ status: string, data: { id: number }, errors: Array }> => {
		return BX.ajax.runAction('mail.mailboxconnecting.saveMassConnectData', {
			data: { massConnectData },
		});
	},

	getDepartmentsUsers: async (
		departmentIds: number[],
	): Promise<{ status: string, data: DepartmentEmployee[], errors: Array }> => {
		return BX.ajax.runAction('mail.mailboxconnecting.getDepartmentUsers', {
			data: { departmentIds },
		});
	},

	checkMailboxLimits: async (
		userIds: number[],
	): Promise<{ status: string, data: { items: MailboxLimitItem[], processedCount: number }, errors: Array }> => {
		return BX.ajax.runAction('mail.mailboxconnecting.checkMailboxLimits', {
			data: { userIds },
		});
	},
};
