export type SystemButtonMetaDataCollection = Record<string, SystemButtonMetaData>
export type SystemButtonMetaData = {
	callback: (arg: object) => {},
}
export type CustomButtonMetaData = {
	callback: (arg: object) => Promise<any>,
}
