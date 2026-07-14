export type EventButtonMetaDataCollection = Record<string, EventButtonMetaData>
export type EventButtonMetaData = {
	callback: (arg: object) => void,
}
export type RequestButtonMetaData = {
	callback: (arg: object) => Promise<any>,
}
export type UrlButtonMetaData = {
	callback: () => void,
}
