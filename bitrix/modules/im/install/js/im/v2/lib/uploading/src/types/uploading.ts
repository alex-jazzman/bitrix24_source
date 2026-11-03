export type MultiUploadingResult = {
	uploadingId: string,
	uploaderIds: Array<string>,
	sourceFilesCount: number,
	loadAllComplete: Promise<any>,
	uploadAllComplete: Promise<any>,
};

export type ValueOf<T> = T[keyof T];
