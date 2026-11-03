import { ref, toValue, shallowRef } from 'ui.vue3';
import { Type } from 'main.core';
import {
	type MenuItemOptions,
	type MenuOptions,
	type PopupOptions,
	Popup,
	Menu,
} from 'main.popup';
import { useBlockDiagram } from './block-diagram';

export type DiagramContextMenuItemOptions = MenuItemOptions;

export type UseContextMenu = {
	isOpen: boolean,
	showMenu: (point: { clientX: number, clientY: number }, options: ?MenuOptions) => void,
	showPopup: (point: { clientX: number, clientY: number }, options: ?PopupOptions) => void,
	closeContextMenu: () => void,
	setOptions: (options: MenuOptions) => void,
};

// eslint-disable-next-line max-lines-per-function
export function useContextMenu(contextMenuName?: string | null | undefined = null): UseContextMenu
{
	const {
		contextMenuLayerRef,
		targetContainerRef,
		isOpenContextMenu,
		openedContextMenuName,
		positionContextMenu,
		contextMenuInstance,
		zoom,
	} = useBlockDiagram();
	const isOpen = ref(false);

	function setContextMenuName(newName: string | null): void
	{
		openedContextMenuName.value = toValue(newName);
	}

	function markClosed(): void
	{
		isOpen.value = false;
		isOpenContextMenu.value = false;
		setContextMenuName(null);
	}

	function getItems(items: DiagramContextMenuItemOptions[] = []): DiagramContextMenuItemOptions[]
	{
		return items.map((item) => {
			return {
				...item,
				onclick: () => {
					if (Type.isFunction(item.onclick))
					{
						const point: Point = {
							x: positionContextMenu.value.left,
							y: positionContextMenu.value.top,
						};
						item.onclick(point);
					}

					toValue(contextMenuInstance)?.close();
				},
			};
		});
	}

	function getDefaultOptions(additionalOptions: MenuOptions = {}): MenuOptions
	{
		const defaultOptions = {
			// Menu/Popup get a single options object below, so this id lands on the popup element
			// unprefixed - the legacy positional arguments would prefix it and break the e2e selector.
			id: 'block-diagram-context-menu',
			bindElement: {
				left: 0,
				top: 0,
			},
			minWidth: 200,
			autoHide: true,
			draggable: false,
			cacheable: false,
			targetContainer: toValue(targetContainerRef),
			...additionalOptions,
		};

		if ('items' in additionalOptions)
		{
			defaultOptions.items = getItems(additionalOptions.items);
		}

		return defaultOptions;
	}

	function updateContextMenuPosition(point: { clientX: number, clientY: number }): void
	{
		const { clientX = 0, clientY = 0 } = point;
		const { left, top } = toValue(contextMenuLayerRef)?.getBoundingClientRect() ?? { top: 0, left: 0 };
		positionContextMenu.value.top = (clientY - top) / toValue(zoom);
		positionContextMenu.value.left = (clientX - left) / toValue(zoom);
	}

	function showMenu(
		point: { clientX: number, clientY: number },
		options: ?MenuOptions = null,
	): void
	{
		updateContextMenuPosition(point);
		toValue(contextMenuInstance)?.destroy();

		contextMenuInstance.value = shallowRef(new Menu(getDefaultOptions(options)));
		toValue(contextMenuInstance)
			?.popupWindow
			?.subscribeOnce('onDestroy', markClosed);

		// A caller may override the cacheable default, and a cacheable popup closes without being
		// destroyed - the state has to come down on the close every menu goes through as well.
		toValue(contextMenuInstance)
			?.popupWindow
			?.subscribeOnce('onClose', markClosed);

		toValue(contextMenuInstance)?.show();

		// After the previous instance is gone: its closing lowers the very state raised here.
		setContextMenuName(contextMenuName);
		isOpen.value = true;
		isOpenContextMenu.value = true;
	}

	function showPopup(
		point: { clientX: number, clientY: number },
		options: ?PopupOptions = null,
	): void
	{
		updateContextMenuPosition(point);
		toValue(contextMenuInstance)?.destroy();

		contextMenuInstance.value = shallowRef(new Popup(getDefaultOptions(options)));
		toValue(contextMenuInstance)
			?.subscribeOnce('onDestroy', markClosed);

		// A caller may override the cacheable default, and a cacheable popup closes without being
		// destroyed - the state has to come down on the close every popup goes through as well.
		toValue(contextMenuInstance)
			?.subscribeOnce('onClose', markClosed);

		toValue(contextMenuInstance)?.show();

		// After the previous instance is gone: its closing lowers the very state raised here.
		setContextMenuName(contextMenuName);
		isOpen.value = true;
		isOpenContextMenu.value = true;
	}

	function closeContextMenu(): void
	{
		markClosed();
		toValue(contextMenuInstance)?.close();
	}

	return {
		isOpen,
		openedContextMenuName,
		showMenu,
		showPopup,
		closeContextMenu,
	};
}
