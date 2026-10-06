import { type SenderOption } from './types';

// Client-side only entity: the whole list comes from the component, no provider is involved.
export const SENDER_OPTION_ENTITY_ID: string = 'mail-signature-sender';

const SENDER_OPTION_TAB_ID = 'recents';

export type SenderSelectorItem = {
	id: string,
	entityId: string,
	title: string,
	tabs: string,
	sort: number,
	selected: boolean,
	deselectable: boolean,
};

export function getInitialSenderOptionId(options: SenderOption[]): string | null
{
	const selected = options.find((option) => option.selected === true);

	return (selected ?? options[0])?.id ?? null;
}

export function buildSenderSelectorItems(options: SenderOption[]): SenderSelectorItem[]
{
	const initialId = getInitialSenderOptionId(options);

	// `sort` keeps the order built by the component: "all" first, then addresses and name variants.
	return options.map((option, index) => ({
		id: option.id,
		entityId: SENDER_OPTION_ENTITY_ID,
		title: option.title,
		tabs: SENDER_OPTION_TAB_ID,
		sort: index,
		selected: option.id === initialId,
		// The signature always has exactly one binding, so an item may only be replaced, not dropped.
		deselectable: false,
	}));
}

export function getSenderValueById(options: SenderOption[], id: string | null): string
{
	return options.find((option) => option.id === id)?.value ?? '';
}
