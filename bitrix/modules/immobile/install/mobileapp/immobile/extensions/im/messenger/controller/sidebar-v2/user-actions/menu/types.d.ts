/** Single entry of the sidebar context menu, as UIMenu expects it. */
type SidebarMenuActionItem = {
	id: string,
	testId: string,
	title: string,
	iconName: string,
	onItemSelected: () => void,
	section: string,
	sort: number
}

type DownloadToDeviceActionParams = {
	testId: string,
	fileUrl: string
}

type DownloadToDiskActionParams = {
	testId: string,
	fileId: string | number
}

type OpenMessageActionParams = {
	testId: string,
	openInDialogTitle: string,
	onClick: () => void
}

export {
	DownloadToDeviceActionParams,
	DownloadToDiskActionParams,
	OpenMessageActionParams,
	SidebarMenuActionItem,
};
