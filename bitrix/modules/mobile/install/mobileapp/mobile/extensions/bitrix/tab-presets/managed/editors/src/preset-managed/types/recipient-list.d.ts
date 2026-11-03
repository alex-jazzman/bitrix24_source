type RecipientListProps = {
	items?: ManagedPresetDisplayRecipient[];
	testId: string;
	paddingLeft?: number;
	paddingRight?: number;
};

type RecipientListItemProps = {
	item: ManagedPresetDisplayRecipient;
	testId: string;
	paddingLeft: number;
	paddingRight: number;
};

type RecipientAvatarProps = {
	item: ManagedPresetDisplayRecipient;
	testId: string;
};
