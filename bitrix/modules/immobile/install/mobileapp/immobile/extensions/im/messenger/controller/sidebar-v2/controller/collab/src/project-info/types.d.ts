declare type ProjectInfoLinkProps = {
	store: MessengerCoreStore,
	storeManager: MessengerCoreStoreManager,
	dialogId: DialogId,
	description?: string,
	parentWidget?: LayoutWidget,
	loadProjectInfo: () => Promise<void>,
};
