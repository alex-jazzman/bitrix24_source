// type is a FileType member from assets/icons: the enum lives there as a runtime map, so it is not redeclared here
type FilePreviewProps = {
	testId: string;
	previewUrl: string;
	size?: number;
	type?: number;
	onClick?: () => void;
};
