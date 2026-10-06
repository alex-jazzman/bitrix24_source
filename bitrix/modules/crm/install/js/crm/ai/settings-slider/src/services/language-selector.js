import { Runtime } from 'main.core';

const POPUP_WIDTH = 300;

export async function openLanguageSelector({
	entityTypeId,
	categoryId,
	currentLanguageId,
	onSelect,
	targetNode = null,
}): Promise
{
	const { Dialog } = await Runtime.loadExtension('ui.entity-selector');

	const dialog = new Dialog({
		targetNode,
		multiple: false,
		showAvatars: false,
		dropdownMode: true,
		compactView: true,
		enableSearch: true,
		context: `COPILOT-LANGUAGE-SELECTOR-${entityTypeId}-${categoryId}`,
		width: POPUP_WIDTH,
		tagSelectorOptions: {
			textBoxWidth: '100%',
		},
		preselectedItems: currentLanguageId ? [['copilot_language', currentLanguageId]] : [],
		entities: [{
			id: 'copilot_language',
			options: {
				entityTypeId,
				categoryId,
			},
		}],
		events: {
			'Item:onSelect': (event) => {
				const item = event.getData().item;
				onSelect(String(item.id).toLowerCase(), item.getTitle());
			},
			'onHide': () => {
				dialog.destroy();
			},
		},
	});

	dialog.show();
}
