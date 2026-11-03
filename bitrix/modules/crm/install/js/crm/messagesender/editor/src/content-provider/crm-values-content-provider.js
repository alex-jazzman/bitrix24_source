import { Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Dialog } from 'ui.entity-selector';
import { Outline } from 'ui.icon-set.api.vue';
import { type MenuItemOptions } from 'ui.system.menu';

import { type InsertContext } from 'messageservice.message.editor';

import { BaseContentProvider } from './base-content-provider';

type PlaceholdersOptions = {
	entityTypeId?: ?number,
	entityId?: ?number,
	categoryId?: ?number,
};

export class CrmValuesContentProvider extends BaseContentProvider<{ placeholdersOptions: PlaceholdersOptions }>
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
					ctx.insertPlaceholder(selectedItem.getId(), displayText, {
						customData: this.#buildOriginAttrs(selectedItem),
					});

					ctx.trackAction('crmValue');
					selectedItem.deselect();
				},
			},
		});

		this.#dialog.show();
	}

	/**
	 * Stamp the placeholder origin onto its BBCode attributes so the zone can
	 * later decide keep/remove on template insert. The platform carries these
	 * opaquely; only the zone subscriber interprets them.
	 *
	 * `entityTypeId`/`categoryId` are the current picker context. `isUf` marks a
	 * user field, and `categoryDependent` marks a user field whose visibility is
	 * scoped to a category (Contact/Company) — only those need a category match
	 * on top of the entity-type match. Boolean flags are stamped as `'true'` /
	 * `'false'` (read back with `Text.toBoolean`); BBCode attributes are strings.
	 */
	#buildOriginAttrs(selectedItem: Object): { [key: string]: string }
	{
		const { entityTypeId, categoryId } = this.getCustomData().placeholdersOptions ?? {};
		const itemData = selectedItem.getCustomData();
		const isUf = itemData.get('isUf');
		const categoryDependent = itemData.get('categoryDependent');

		const attrs = {};
		if (!Type.isNil(entityTypeId))
		{
			attrs.entityTypeId = String(entityTypeId);
		}

		if (!Type.isNil(categoryId))
		{
			attrs.categoryId = String(categoryId);
		}

		if (!Type.isNil(isUf))
		{
			attrs.isUf = isUf ? 'true' : 'false';
		}

		if (!Type.isNil(categoryDependent))
		{
			attrs.categoryDependent = categoryDependent ? 'true' : 'false';
		}

		return attrs;
	}

	destroy(): void
	{
		this.#dialog?.destroy();
		this.#dialog = null;
		super.destroy();
	}
}
