import type { Transport } from '../transport';
import { Analytics } from '../analytics';

export type PageOptions = {
	transport: Transport,
	isSelfRegisterEnabled: boolean,
	analytics: Analytics,
	smsAvailable: boolean,
	useLocalEmailProgram: boolean,
	isAdmin: boolean,
	needConfirmRegistration: boolean,
	invitationLink: string,
	whiteList: string,
	isCloud: boolean,
	linkRegisterEnabled: boolean,
	isExtranetInstalled: boolean,
	canCurrentUserInvite: boolean,
	canCurrentUserCreateDepartment: boolean,
}
