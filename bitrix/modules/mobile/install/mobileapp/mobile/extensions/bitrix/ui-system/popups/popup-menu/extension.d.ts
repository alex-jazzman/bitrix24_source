import {
	PopupMenuItem,
	PopupMenuSectionItem,
	PopupMenuStyles,
	PopupNextMenu,
	PopupTargetParams,
} from '../../../../../../../../dev/janative/types/dialogs/popup-menu';
import { TargetRef } from '../../../../../../../../dev/janative/api';
import { DialogPosition } from '../../../../../../../../dev/janative/types/dialogs/types';

interface PopupMenuSection extends PopupMenuSectionItem
{
	icon: Object; // Icon @module assets/icons/src/main
}

interface PopupMenuActionsData
{
	items: Array<PopupMenuActionItem>;
	sections: Array<PopupMenuSection>;
}

interface PopupMenuActionNextMenu extends PopupNextMenu
{
	items: PopupMenuActionItem[];
	sections: PopupMenuSectionItem,
	icon?: string; // URL of the back button icon
	title?: string; // title of the back button
	styles?: Record<string, any>; // styles of the back button
}

interface PopupMenuActionItem extends PopupMenuItem
{
	type?: string;
	onItemSelected: (...args: any[]) => any;
	icon?: Object; // Icon @module assets/icons/src/main
	data?: PopupMenuActionItemData;
	/**
	 * @deprecated
	 */
	style?: PopupMenuStyles;
	/**
	 * @deprecated use `title` in `PopupMenuSectionItem` instead
	 */
	sectionTitle?: string;
	/**
	 * @deprecated use `checked` instead
	 */
	showCheckedIcon?: boolean;
	/**
	 * @deprecated use `destructive` instead
	 */
	isDestructive?: boolean;
	destructive?: boolean;
	/**
	 * @deprecated use `showHint` in `data` instead
	 */
	showHint?: boolean;
	analyticsSection?: string;
	nextMenu?: PopupMenuActionNextMenu;
}

interface PopupMenuActionItemData
{
	qrUrl?: string;
	qrTitle?: string;
	showHint?: boolean;
	analyticsSection: string;
	articleCode?: string;
}

interface PopupMenuTargetParams extends PopupTargetParams
{
	cacheId: string;
}

interface PopupMenuShowOptions
{
	target?: TargetRef;
	targetParams?: PopupMenuTargetParams;
	position?: DialogPosition;
}

export { PopupMenuActionItem, PopupMenuSection, PopupMenuActionItemData, PopupMenuActionsData, PopupMenuShowOptions };
