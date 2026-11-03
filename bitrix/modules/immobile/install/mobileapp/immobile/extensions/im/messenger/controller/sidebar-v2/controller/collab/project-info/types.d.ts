declare type ProjectInfoTagsSectionProps = {
	tags: string[],
	availableWidth?: number,
};

declare type ProjectInfoFields = {
	goal: string,
	period: string,
	description: string,
	tags: string[],
	pending?: boolean,
};

/**
 * Where the fields of a dialog are read from and how their changes are heard.
 */
declare type ProjectInfoStoreParams = {
	store: MessengerCoreStore,
	storeManager: MessengerCoreStoreManager,
	dialogId: DialogId,
	description?: string,
};

declare type ProjectInfoModalProps = ProjectInfoStoreParams & {
	layoutWidget?: LayoutWidget,
};

declare type ProjectInfoModalState = {
	descriptionExpanded: boolean,
	fields: ProjectInfoFields,
};

declare type ProjectInfoPropsParams = {
	store: MessengerCoreStore,
	dialogId: DialogId,
	description?: string,
};
