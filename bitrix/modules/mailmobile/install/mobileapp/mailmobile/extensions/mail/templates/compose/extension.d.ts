export type MailTemplateReference = {
	source: string,
	id: number,
};

export type MailTemplateListItem = {
	reference: MailTemplateReference,
	title: string,
	subject: string,
	canApply: boolean,
	disabledReason: string | null,
};

export type PreparedMailTemplate = {
	reference: MailTemplateReference,
	subject: string,
	bodyHtml: string,
	attachments: Array<{
		id: number,
		name: string,
		size: number,
		contentType: string | null,
	}>,
};

export type MailTemplateDecision = 'insert' | 'replace' | 'cancel';

export type MailTemplateSessionState = {
	quickItems: MailTemplateListItem[],
	isQuickLoading: boolean,
	quickError: boolean,
	quickLoaded: boolean,
};
