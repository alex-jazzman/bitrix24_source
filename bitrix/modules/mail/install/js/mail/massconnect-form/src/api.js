import type { MassConnectDataType } from './store/type';
import { DepartmentEmployee, MailboxPayload } from './store/type';

export const Api = {
	connectMailbox: async (mailbox: MailboxPayload, massConnectId: number): Promise<void> => {
		return BX.ajax.runAction('mail.mailboxconnecting.connectMailboxFromMassconnect', {
			data: { mailbox, massConnectId },
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
};
