type LinkedDialog = {
	entityLink?: { url?: string | null } | null;
};

export const hasEntityLink = (dialog: LinkedDialog | null | undefined): boolean => {
	return Boolean(dialog?.entityLink?.url);
};
