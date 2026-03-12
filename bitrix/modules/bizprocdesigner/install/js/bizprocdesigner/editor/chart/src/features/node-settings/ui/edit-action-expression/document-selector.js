import { Loc, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { Dialog, ItemOptions, TabOptions } from 'ui.entity-selector';
import { diagramStore } from '../../../../entities/blocks';
import type { ActivityProperty, Block, PortId } from '../../../../shared/types';
import { PROPERTY_TYPES } from '../../../../shared/constants';

const DocumentsTabId = 'documents';

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
		return new Promise((resolve) => {
			const dialog = new Dialog({
				targetNode: target,
				width: 500,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				items: this.#getDocuments(),
				tabs: this.#getTabs(),
				cacheable: false,
				showAvatars: false,
				events: {
					'Item:onSelect': (event: BaseEvent): void => {
						resolve(event.getData().item.getId());
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
				id: DocumentsTabId,
				title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_MULTIPLE'),
				icon: 'elements',
				stub: true,
				stubOptions: {
					title: Loc.getMessage('BIZPROCDESIGNER_EDITOR_DOCUMENT_STUB_TITLE'),
				},
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
				tabs: DocumentsTabId,
				title: block.activity.Properties.Title,
				children: childrenProperties,
				searchable: false,
			});
		}

		return properties;
	}

	#processReturnProperties(block: Block): ItemOptions[]
	{
		const properties: ItemOptions[] = [];

		block.activity.ReturnProperties
			.filter((property: ActivityProperty): boolean => {
				if (property.Type !== PROPERTY_TYPES.DOCUMENT)
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

				for (const key: number of this.#fixedDocumentType.keys())
				{
					if (property.Default?.[key] !== this.#fixedDocumentType[key])
					{
						return false;
					}
				}

				return true;
			})
			.forEach((property: ActivityProperty): void => {
				const item: ItemOptions = {
					id: `{=${block.id}:${property.Id}}`,
					entityId: 'bizproc-document',
					entityType: 'document',
					title: `${property.Name} (${block.activity.Properties.Title})`,
					nodeOptions: {
						open: false,
						dynamic: false,
					},
					tabs: DocumentsTabId,
				};
				properties.push(item);
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
