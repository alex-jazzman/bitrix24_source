export type EditorUnsubscribe = () => void;

/**
 * The form reads the visual mode alone: leaving it turns the body into one text, and the nodes the form owns
 * in the body are lost.
 */
export const EditorViewMode = Object.freeze({
	Visual: 'wysiwyg',
} as const);

export type EditorAdapterParams = {
	editorId: string,
	/** Without it the adapter reports no files: the control is the only owner of the attachment set. */
	uploaderControlId?: string,
	/** Escape inside the body is one more way out of the form, and it leaves through the same door. */
	closeForm?: () => void,
};

/**
 * `fileId` names the file in the uploader control and is what a removal asks for; `id` is the Disk object and
 * stays `null` until the upload ends. The size comes both in bytes and formatted by the uploader.
 */
export type EditorAttachment = {
	fileId: string,
	id: number | null,
	name: string,
	size: number,
	sizeFormatted: string,
};

export type RestoredEditorAttachment = {
	id: number,
	name: string,
	size: number,
	contentType: string | null,
};

export type BodyPosition =
	| { at: 'caret' }
	| { at: 'end' }
	| { at: 'before', anchor: HTMLElement };

/**
 * Identifiers of the blocks the form owns in the body of the editor. They are unique to the instance of the
 * form, so a quoted message that carries the same identifier cannot pass for one of them.
 */
export type BodyNodeIds = {
	signature: string,
	quote: string,
};

/** Every method answers with a failure sign instead of throwing when the editor is not on the page. */
export interface ComposeEditorAdapter
{
	readonly editorId: string;
	readonly bodyNodes: BodyNodeIds;

	getHostNode(): HTMLElement | null;
	show(): boolean;
	focus(): boolean;
	getBody(): string;
	setBody(html: string): boolean;
	setInitialBody(html: string): boolean;
	hasUserContent(): boolean;
	replaceUserContent(html: string): boolean;
	insertHtmlAtCaret(html: string): boolean;
	registerSystemNode(nodeId: string): EditorUnsubscribe;
	getBodyNode(nodeId: string): HTMLElement | null;
	insertNode(node: HTMLElement, position: BodyPosition): boolean;
	getFiles(): EditorAttachment[];
	replaceFiles(files: RestoredEditorAttachment[]): Promise<boolean>;
	removeFile(fileId: string): boolean;
	showUploader(): boolean;
	showCopilot(): boolean;
	showCreateDocument(): boolean;
	parseQuote(html: string): string | null;
	updateCopilotContext(parameters: Record<string, unknown>): boolean;
	subscribeReady(handler: () => void): EditorUnsubscribe;
	subscribeVisibilityChange(handler: (isShown: boolean) => void): EditorUnsubscribe;
	subscribeViewModeChange(handler: (mode: string) => void): EditorUnsubscribe;
	subscribeBodyClick(handler: () => void): EditorUnsubscribe;
	subscribeContentChange(handler: () => void): EditorUnsubscribe;
	subscribeBodyPlaceholder(text: string): EditorUnsubscribe;
	subscribeFileAdd(handler: () => void): EditorUnsubscribe;
	subscribeFileRemove(handler: () => void): EditorUnsubscribe;
	destroy(): void;
}
