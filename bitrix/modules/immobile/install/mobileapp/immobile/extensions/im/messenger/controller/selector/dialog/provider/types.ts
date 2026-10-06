type DialogSelectorProviderOptions = {
	allowMultipleSelection?: boolean;
	withFavorite?: boolean;
	withCurrentUser?: boolean;
	onlyUsers?: boolean;
	useNotes?: boolean;

	/**
	 * Drops im-guest users from server search results.
	 * Maps to SearchOptions::EXCLUDE_GUESTS_OPTION on the backend.
	 */
	excludeGuests?: boolean;

	/**
	 * dialogIds that must appear in the recent list even if they are not in
	 * recentModel (e.g. chats hidden from recent but already present in the
	 * folder being edited). Without this, the native widget drops them from
	 * the final selection on close.
	 */
	initialDialogIds?: Array<string | number>;
};

export { DialogSelectorProviderOptions };
