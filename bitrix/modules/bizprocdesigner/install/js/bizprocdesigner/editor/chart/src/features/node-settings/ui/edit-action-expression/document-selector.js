import { Loc, Type } from 'main.core';
import { MenuManager } from 'main.popup';
import type { MenuItem } from 'main.popup';
import { Dialog, EntityOptions, Item, ItemOptions, TabOptions } from 'ui.entity-selector';
import { diagramStore } from '../../../../entities/blocks';
import type { Block, PortId } from '../../../../shared/types';

const CurrentDocumentId = '@';

export class DocumentSelector
{
	#store: diagramStore;
	#currentPortId: PortId | null = null;
	#currentBlock : Block;
	#fixedDocumentType: Array<string> | null = null;

	constructor(
		currentBlock: Block,
		currentPortId: PortId | null = null,
		fixedDocumentType: Array<string> | null = null,
	)
	{
		this.#store = diagramStore();
		this.#currentBlock = currentBlock;
		this.#currentPortId = currentPortId;
		this.#fixedDocumentType = fixedDocumentType;
	}

	show(target: HTMLElement): Promise<string | null>
	{
		const documentItems: ItemOptions[] = [
			{
				id: CurrentDocumentId,
				entityId: 'bizproc-document',
				entityType: 'document',
				title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_TEMPLATE_DOCUMENT'),
				nodeOptions: {
					open: false,
					dynamic: false,
				},
				tabs: 'documents',
			},
			...this.#getDocuments(),
		];

		return new Promise((resolve) => {
			const dialog = new Dialog({
				targetNode: target,
				width: 500,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				items: documentItems,
				tabs: this.#getTabs(),
				entities: this.#getEntities(),
				cacheable: false,
				showAvatars: false,
				events: {
					'Item:onSelect': (event) => {
						resolve(this.#getReturnValue(event.getData().item));
					},
				},
				compactView: true,
			});

			dialog.show();
		});
	}

	#getTabs(): TabOptions[]
	{
		return [
			{
				id: 'documents',
				title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_MULTIPLE'),
				icon: 'elements',
			},
		];
	}

	#getReturnValue(item: Item): string | null
	{
		return item.getId() === CurrentDocumentId ? null : item.getId();
	}

	#getEntities(): EntityOptions[]
	{
		return [
			{
				id: 'bizproc-document',
			},
		];
	}

	#processChildrenProperties(block: Block): ItemOptions[]
	{
		const childrenProperties = [];
		block.activity.Children.forEach((activity) => {
			if (Type.isArrayFilled(activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties({ id: activity.Name, activity });
				if (Type.isArrayFilled(properties))
				{
					childrenProperties.push(...properties);
				}
			}
		});

		const properties = [];
		if (Type.isArrayFilled(childrenProperties))
		{
			properties.push({
				id: block.id,
				entityId: 'block-node',
				tabs: 'documents',
				title: block.activity.Properties.Title,
				children: childrenProperties,
				searchable: false,
			});
		}

		return properties;
	}

	#processReturnProperties(block: Block): ItemOptions[]
	{
		const properties = [];

		block.activity.ReturnProperties
			.filter((property) => {
				if (property.Type !== 'document')
				{
					return false;
				}

				if (!Type.isArrayFilled(property.Default))
				{
					return true;
				}

				if (!Type.isArrayFilled(this.#fixedDocumentType))
				{
					return true;
				}

				return JSON.stringify(property.Default) === JSON.stringify(this.#fixedDocumentType);
			})
			.forEach((property) => {
				const id = `{=${block.id}:${property.Id}}`;

				properties.push({
					id,
					entityId: 'bizproc-document',
					entityType: 'document',
					title: `${property.Name} (${block.activity.Properties.Title})`,
					nodeOptions: {
						open: false,
						dynamic: false,
					},
					tabs: 'documents',
				});
			})
		;

		return properties;
	}

	#getDocuments(): ItemOptions[]
	{
		const blocks = this.#store.getAllBlockAncestors(this.#currentBlock, this.#currentPortId);

		return blocks.reduce((acc, block: Block) => {
			if (Type.isArrayFilled(block.activity.Children))
			{
				const properties = this.#processChildrenProperties(block);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			if (Type.isArrayFilled(block.activity.ReturnProperties))
			{
				const properties = this.#processReturnProperties(block);
				if (Type.isArrayFilled(properties))
				{
					acc.push(...properties);
				}
			}

			return acc;
		}, []);
	}
}
