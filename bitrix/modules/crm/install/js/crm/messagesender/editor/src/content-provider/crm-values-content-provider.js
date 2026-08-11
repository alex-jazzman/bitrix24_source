import { Loc } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { type InsertContext } from 'messageservice.message.editor';
import { Dialog } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.system.menu';

import { BaseContentProvider } from './base-content-provider';

export class CrmValuesContentProvider extends BaseContentProvider<{ placeholdersOptions: Object }>
{
	#dialog: ?Dialog = null;

	getMenuItems(ctx: InsertContext): Array<MenuItemOptions>
	{
		return [{
			title: Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_CRM'),
			icon: Outline.PROMPT_VAR,
			sectionCode: 'crmValues',
			onClick: () => {
				this.#showDialog(ctx);
			},
		}];
	}

	#showDialog(ctx: InsertContext): void
	{
		this.#dialog ??= new Dialog({
			targetNode: ctx.getBindElement(),
			multiple: false,
			showAvatars: false,
			dropdownMode: true,
			compactView: true,
			enableSearch: true,
			entities: [
				{
					id: 'placeholder',
					dynamicLoad: true,
					dynamicSearch: false,
					searchable: true,
					options: this.getCustomData().placeholdersOptions,
				},
			],
			events: {
				'Item:onSelect': (event: BaseEvent) => {
					const { item: selectedItem } = event.getData();

					const displayText = selectedItem.getCustomData().get('text');
					ctx.insertPlaceholder(selectedItem.getId(), displayText);

					ctx.trackAction('crmValue');
					selectedItem.deselect();
				},
			},
		});

		this.#dialog.show();
	}

	destroy(): void
	{
		this.#dialog?.destroy();
		this.#dialog = null;
		super.destroy();
	}
}
