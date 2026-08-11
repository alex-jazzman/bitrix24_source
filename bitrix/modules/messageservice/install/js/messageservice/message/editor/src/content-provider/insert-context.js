export type InsertContext = {
	insertText: (text: string) => void,
	insertPlaceholderText: (text: string) => void,
	insertPlaceholder: (code: string, caption: string, options?: {
		removable?: boolean,
		copyable?: boolean,
		customData?: { [key: string]: string },
	}) => void,
	getBindElement: () => HTMLElement,
	trackAction: (element: string) => void,
	setLoading: (isLoading: boolean) => void,
};
