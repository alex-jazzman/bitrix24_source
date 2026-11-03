declare type SidebarFileCursor = {
	lastLoadFileId: number,
	lastLoadFileDate: string | null,
};

declare type SidebarFileOrder = {
	DATE_CREATE: 'ASC' | 'DESC',
};

declare type SidebarFileQueryParams = {
	chatId: number,
	subtypes: string[],
	order?: SidebarFileOrder | null,
	cursor?: SidebarFileCursor | null,
};
