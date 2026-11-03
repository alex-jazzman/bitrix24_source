import type { Popup } from 'main.popup';

export type InvitationWidgetOptions = {
	button?: HTMLElement,
	target?: HTMLElement,
	loader?: Popup,
	isCurrentUserAdmin?: boolean,
	isExtranetAvailable?: boolean,
	isCollabAvailable?: boolean,
	isInvitationAvailable?: boolean,
	structureLink?: string,
	userListLink?: string,
	invitationLink?: string,
	invitationCounter?: number,
	counterId?: string,
	shouldShowStructureCounter?: boolean,
}

export type InvitationPopupOptions = {
	isAdmin?: boolean,
	button?: HTMLElement,
	target?: HTMLElement,
	loader?: Popup,
	isExtranetAvailable?: boolean,
	isCollabAvailable?: boolean,
	isInvitationAvailable?: boolean,
	userListLink?: string,
	offices?: {
		count: number,
		url: string,
	},
	params?: {
		structureLink?: string,
		invitationLink?: string,
		shouldShowStructureCounter?: boolean,
	}
}

export type InvitationContentOptions = {
	isAdmin?: boolean,
	button?: HTMLElement,
	invitationLink?: string,
	isInvitationAvailable?: string,
}

export type StructureContentOptions = {
	link?: string,
	shouldShowStructureCounter?: boolean,
}

export type EmployeesContentOptions = {
	isAdmin?: boolean,
	awaitData?: Promise,
	userListLink?: string,
}

export type ExtranetContentOptions = {
	isAdmin?: boolean,
	button?: HTMLElement,
	awaitData?: Promise,
	invitationLink?: string,
	isInvitationAvailable?: boolean,
}

export type CollabContentOptions = {
	isAdmin?: boolean,
	awaitData?: Promise,
}
