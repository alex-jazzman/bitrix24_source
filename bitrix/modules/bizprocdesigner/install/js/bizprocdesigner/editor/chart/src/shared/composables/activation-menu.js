import { Loc } from 'main.core';
import { MenuManager } from 'main.popup';

import type {
	Block,
	DiagramData,
} from '../types';

export type ActivationMenuHelper = {
	showActivationMenu: (event: MouseEvent, block: Block, onDeactivate?: () => void) => void;
};

export function useActivationMenu(store: DiagramData): ActivationMenuHelper
{
	function showActivationMenu(event: MouseEvent, block: Block, onToggle?: () => void): void
	{
		const menuText = block.activity.Activated === 'Y'
			? (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_OFF') ?? '')
			: (Loc.getMessage('BIZPROCDESIGNER_STORES_DIAGRAM_ACTIVATE_ON') ?? '');

		const menuItems = [
			{
				id: 'deactivate',
				text: menuText,
				onclick: (): void => {
					store.toggleBlockActivation(block.id, true);

					if (onToggle)
					{
						onToggle();
					}

					MenuManager.destroy('node-settings-local-menu');
				},
			},
		];

		MenuManager.show(
			'node-settings-local-menu',
			event.target,
			menuItems,
			{
				autoHide: true,
				cacheable: false,
				angle: true,
				offsetLeft: 0,
				offsetTop: 0,
			},
		);
	}

	return {
		showActivationMenu,
	};
}
