import { Loc, Runtime } from 'main.core';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.system.menu';

import { ContentProvider } from './content-provider';
import { type InsertContext } from './insert-context';
import { type ServiceLocator } from '../service/service-locator';

export class FilesContentProvider extends ContentProvider<{ sliderCode: string, isLocked: boolean }>
{
	#locator: ServiceLocator;

	constructor(serverData: Object, locator: ServiceLocator)
	{
		super(serverData);
		this.#locator = locator;
	}

	getMenuItems(ctx: InsertContext): Array<MenuItemOptions>
	{
		if (this.getCustomData().isLocked)
		{
			return [{
				title: Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE'),
				icon: Outline.ATTACH,
				isLocked: true,
				onClick: async () => {
					const sliderCode = this.getCustomData().sliderCode;
					if (sliderCode)
					{
						const { FeaturePromotersRegistry } = await Runtime.loadExtension('ui.info-helper');
						FeaturePromotersRegistry.getPromoter({ code: sliderCode }).show();
					}
				},
			}];
		}

		return [{
			title: Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE'),
			icon: Outline.ATTACH,
			subMenu: {
				items: [
					{
						id: 'uploadFile',
						title: Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE_UPLOAD'),
						onClick: () => {
							this.#locator.getFileService().uploadNewFile((file: File) => {
								ctx.insertText(`${file.name} ${file.externalLink}`);
								ctx.trackAction('file');
							});
						},
					},
					{
						id: 'diskFile',
						title: Loc.getMessage('MESSAGESERVICE_MESSAGE_EDITOR_ADD_FILE_DISK'),
						onClick: () => {
							this.#locator.getFileService().pickFromDisk((file: File) => {
								ctx.insertText(`${file.name} ${file.externalLink}`);
								ctx.trackAction('file');
							});
						},
					},
				],
			},
		}];
	}
}
