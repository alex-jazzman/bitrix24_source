export type EventButtonMetaDataCollection = Record<string, EventButtonMetaData>
export type EventButtonMetaData = {
	callback: (arg: object) => void,
}
export type RequestButtonMetaData = {
	callback: (arg: object) => Promise<{ status: string }> | null,
}
export type UrlButtonMetaData = {
	callback: () => void,
}
