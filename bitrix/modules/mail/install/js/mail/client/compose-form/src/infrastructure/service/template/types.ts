export type TemplateReferenceDto = {
	source: string,
	id: number,
};

export type TemplateListItemDto = {
	reference: TemplateReferenceDto,
	title: string,
	/** Subject the template carries; an empty string when it sets none. */
	subject: string,
	canApply: boolean,
	disabledReason: string | null,
};

export type PreparedTemplateAttachmentDto = {
	id: number,
	name: string,
	size: number,
	contentType: string | null,
};

export type PreparedTemplateDto = {
	reference: TemplateReferenceDto,
	subject: string,
	bodyHtml: string,
	/** Old Mail backends omit the field, which is equivalent to an empty list. */
	attachments?: PreparedTemplateAttachmentDto[],
};

export type QuickListResponse = {
	items: TemplateListItemDto[],
};

export type SearchTemplatesRequest = {
	query: string,
	offset: number,
	limit: number,
};

export type SearchTemplatesResponse = {
	items: TemplateListItemDto[],
	nextOffset: number | null,
};

export type PrepareTemplateResponse = {
	template: PreparedTemplateDto,
};

export type RecordTemplateUsageResponse = {
	recorded: true,
};

export type TemplateAjaxError = {
	code?: string | number,
	message?: string,
	customData?: unknown,
};

export type TemplateAjaxResponse<T> = {
	data?: T,
	errors?: TemplateAjaxError[],
	status?: string,
};
