import {
	MessageBuilderPlainColorToken,
	type UnorderedListBlockType,
	type OrderedListBlockType,
} from 'im.v2.const';

type ListItemType = UnorderedListBlockType['elements'][number] | OrderedListBlockType['elements'][number];
type ListBlock = UnorderedListBlockType | OrderedListBlockType;

export const getIconColorClass = (listItem: ListItemType, listBlock: ListBlock): string => {
	const itemIconColor = listItem.icon?.color;
	const blockIconColor = listBlock.icon?.color;
	const itemColor = listItem.color;
	const blockColor = listBlock.color;

	const color = itemIconColor || blockIconColor || itemColor || blockColor;

	if (!MessageBuilderPlainColorToken[color])
	{
		return '';
	}

	return color ? `--color-${color}` : '';
};
