import {
	type UnorderedListBlockType,
	type OrderedListBlockType,
	MessageBuilderPlainColorToken,
	MessageBuilderGradientColorToken,
} from 'im.v2.const';

type ListItemType = UnorderedListBlockType['elements'][number] | OrderedListBlockType['elements'][number];
type ListBlock = UnorderedListBlockType | OrderedListBlockType;

export const getTextColorClass = (listItem: ListItemType, listBlock: ListBlock): string => {
	const color = listItem.color || listBlock.color || null;

	if (!MessageBuilderPlainColorToken[color] && !MessageBuilderGradientColorToken[color])
	{
		return '';
	}

	return color ? `--color-${color}` : '';
};
