type FolderSourcesSettingsListProps = {
	draft: FolderSourcesDraft,
	onSave?: () => void,
};

type FolderSourceItemProps = {
	folderId: number,
	code: string,
	title: string,
	description: string,
	enabled: boolean,
	togglable: boolean,
	isLast?: boolean,
	onToggle?: (folderId: number) => void,
};
