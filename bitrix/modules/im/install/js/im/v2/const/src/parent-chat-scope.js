export const ParentChatScope = {
	all: null,
	topLevel: 0,
};

export type ParentChatIdType = number | $Values<typeof ParentChatScope>;
