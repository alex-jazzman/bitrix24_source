import { ref, toValue, shallowRef } from 'ui.vue3';
import { Type } from 'main.core';
import { MenuItemOptions, MenuOptions, Popup, PopupOptions, Menu } from 'main.popup';
import { useBlockDiagram } from './block-diagram';

export type UseContextMenu = {
	isOpen: boolean,
	showMenu: (point: { clientX: number, clientY: number }, options: ?MenuOptions) => void,
	showPopup: (point: { clientX: number, clientY: number }, options: ?PopupOptions) => void,
	closeContextMenu: () => void,
	setOptions: (options: MenuOptions) => void,
};

// eslint-disable-next-line max-lines-per-function
export function useContextMenu(): UseContextMenu
{
	const {
		contextMenuLayerRef,
		targetContainerRef,
		isOpenContextMenu,
		positionContextMenu,
		contextMenuInstance,
		zoom,
	} = useBlockDiagram();
	const isOpen = ref(false);

	function getItems(items: MenuItemOptions[] = []): MenuItemOptions[]
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
			?.subscribeOnce('onDestroy', () => {
				isOpen.value = false;
			});

		toValue(contextMenuInstance)?.show();

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
			?.subscribeOnce('onDestroy', () => {
				isOpen.value = false;
			});

		toValue(contextMenuInstance)?.show();

		isOpen.value = true;
		isOpenContextMenu.value = true;
	}

	function closeContextMenu(): void
	{
		isOpen.value = false;
		isOpenContextMenu.value = false;

		toValue(contextMenuInstance)?.close();
	}

	return {
		isOpen,
		showMenu,
		showPopup,
		closeContextMenu,
	};
}
