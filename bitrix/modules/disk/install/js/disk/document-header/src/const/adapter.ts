/**
 * `autosave` is a claim about the mode the object is opened in rather than about a write of its own:
 * the editor states that it saves by itself and reports no outcome. Everything else is an outcome.
 */
export type SaveState = 'neutral' | 'autosave' | 'saving' | 'saved' | 'failed';

export type SaveStatus = {
	state: SaveState,
	// filled only when state === 'failed'; the text is shown to the user
	errorMessage?: string,
};

export interface EditorAdapter {
	// the header subscribes once on mount; the returned function unsubscribes
	subscribeToSaveStatus(listener: (status: SaveStatus) => void): () => void;
	// called by the retry button; resolves once the attempt has started, not once it has finished
	retrySave(): Promise<void>;
	// whether the editor supports retrying a save; the retry button is not rendered when false
	canRetrySave(): boolean;
}

/**
 * The presentation mode as the shell of the page owns it: the node which goes full-screen, the
 * button of the exit, the cancel key and the announcements all belong to the page, and the header
 * only asks. The adapter is optional: a shell which gives none carries no presentation element.
 */
export interface PresentationAdapter {
	enter(): void;
	exit(): void;
	/**
	 * The header subscribes once on mount; the returned function unsubscribes. The listeners are told
	 * in the order they subscribed, and the page counts on it: a shell subscribing before the header
	 * is mounted has the page ready by the time the header takes the focus back.
	 */
	subscribeToState(listener: (isActive: boolean) => void): () => void;
	isActive(): boolean;
}
