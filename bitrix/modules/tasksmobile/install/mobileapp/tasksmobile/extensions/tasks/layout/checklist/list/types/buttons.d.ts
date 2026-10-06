export type ButtonAddProps = {
	onClick?: () => void,
};

export type ButtonAddItemType = {
	key: string,
	type: string,
};

export type ButtonAddCheckListProps = {
	isDisabled?: boolean,
	onClick?: () => void,
};

export type ButtonRemoveProps = {
	onClick?: () => void,
};

export type ButtonRemoveToggleParams = {
	show: boolean,
};
