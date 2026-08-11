import { Loc, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.system.menu';

import { type InsertContext } from 'messageservice.message.editor';

import { type ServiceLocator } from '../service/service-locator';
import { BaseContentProvider } from './base-content-provider';

export class DocumentsContentProvider extends BaseContentProvider<{ moduleId: string, provider: string, value: number }>
{
	#locator: ServiceLocator;

	constructor(serverData: Object, locator: ServiceLocator)
	{
		super(serverData);
		this.#locator = locator;
	}

	getMenuItems(ctx: InsertContext): Array<MenuItemOptions>
	{
		return [{
			title: Loc.getMessage('CRM_MESSAGESENDER_EDITOR_ADD_DOCUMENT'),
			icon: Outline.FILE,
			onClick: async () => {
				ctx.setLoading(true);
				try
				{
					const documentService = this.#locator.getDocumentService();
					const document = await documentService.selectOrCreateDocument(ctx.getBindElement(), this.getCustomData());
					if (!Type.isNil(document))
					{
						ctx.insertText(`${document.title} ${document.publicUrl}`);
						ctx.trackAction('document');
					}
				}
				finally
				{
					ctx.setLoading(false);
				}
			},
		}];
	}
}
