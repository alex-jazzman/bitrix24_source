export const UploaderStatus = {
	STARTED: 0,
	STOPPED: 1,
};

export type UploaderStatus = (typeof UploaderStatus)[keyof typeof UploaderStatus];
