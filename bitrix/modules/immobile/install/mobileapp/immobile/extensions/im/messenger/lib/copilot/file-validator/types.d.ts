export type CopilotFileUploadPolicy = {
	allowedExtensions: Array<string>,
	maxFileSize: number,
	maxFilesPerMessage: number,
};

export type AttachFile = {
	name?: string,
	size?: number,
	url?: string,
	fromCamera?: boolean,
	dataAttributes?: {
		ID?: number,
		SIZE?: number | string,
	},
	status?: string,
};

export type AttachFileSelectionResult = {
	selected: Array<AttachFile>,
	invalidFormatCount: number,
	tooLargeCount: number,
	duplicateCount: number,
	overflowCount: number,
};

export type AttachSelectionNotification = {
	code: string,
	title: string,
	text: string | null,
};

export type PickerErrorMessage = {
	title: string,
	subtitle: string,
};

export type PickerErrorMessages = {
	format: PickerErrorMessage,
	size: PickerErrorMessage,
	count: PickerErrorMessage,
};

export type AttachPickerRestrictions = {
	maxAttachedFilesCount: number,
	fileRestrictions: {
		hint: string,
		allowedExtensions: Array<string>,
		maxFileSize: number,
		allowPhotoCapture: boolean,
		allowVideoCapture: boolean,
		errorMessages: PickerErrorMessages,
	},
	diskFileFilter: {
		allowedExtensions: Array<string>,
		maxFileSize: number,
	},
};
