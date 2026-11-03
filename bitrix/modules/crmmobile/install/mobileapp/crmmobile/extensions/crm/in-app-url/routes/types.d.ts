/**
 * The entity list a /crm/... link addresses.
 */
type CrmEntityListTarget = {
	entityTypeId: number | null;
	activeTabName: string | null;
}

/**
 * Path parameters a /crm/... list link carries: either a named section (/crm/deal/) or the
 * numeric form (/crm/type/1054/), where typeName is the literal segment "type".
 */
type CrmEntityListPathParams = {
	typeName?: string;
	typeId?: string;
}

/**
 * Options of openEntityDetail: everything besides the listed keys is passed to the card payload.
 */
type CrmOpenEntityDetailOptions = {
	linkText?: string;
	canOpenInDefault?: boolean;
	queryParams?: Record<string, string>;
	parentWidget?: object;
	analytics?: object;
	presentation?: object;
}

/**
 * Options of openEntityList.
 */
type CrmOpenEntityListOptions = {
	activeTabName?: string;
	entityTypeId?: number;
	presentation?: object;
}

export {
	CrmEntityListPathParams,
	CrmEntityListTarget,
	CrmOpenEntityDetailOptions,
	CrmOpenEntityListOptions,
};
