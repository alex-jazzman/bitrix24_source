import { Dom, Loc, Tag, Type } from 'main.core';
import { TagSelector, type TagSelectorOptions } from 'ui.entity-selector';

export default class DepartmentControl
{
	#tagSelector: TagSelector;
	#rootDepartment: Object;

	constructor(options)
	{
		this.#rootDepartment = Type.isNil(options?.rootDepartment) ? null : options?.rootDepartment

		let items: TagSelectorOptions['items'] = [];
		if (!Type.isNil(options?.rootDepartment))
		{
			items = options.departmentList.map((department) => {
				const isRootDepartment = parseInt(department.id, 10) === parseInt(this.#rootDepartment.id, 10);
				// styles has reference in \Bitrix\HumanResources\Integration\UI\DepartmentProvider
				const avatar = isRootDepartment
					? '/bitrix/js/humanresources/entity-selector/src/images/company.svg'
					: '/bitrix/js/humanresources/entity-selector/src/images/department.svg';

				return {
					id: parseInt(department.id, 10),
					entityId: 'structure-node',
					title: department.name,
					customData: {
						accessCode: department.accessCode,
					},
					avatar,
					tagOptions: {
						avatar,
						bgColor: isRootDepartment ? '#f1fbd0' : '#ade7e4',
						textColor: isRootDepartment ? '#7fa800' : '#207976',
						fontWeight: '700',
					},
				};
			});
		}

		this.#tagSelector = new TagSelector({
			items,
			events: {
				onBeforeTagRemove: (event: BaseEvent) => {
					const selector = event.getTarget();
					const { tag } = event.getData();
					if (selector.getTags().length === 1 && this.#isRootItem(tag))
					{
						event.preventDefault();
					}
				},
			},
			dialogOptions: {
				context: 'INVITATION_STRUCTURE',
				width: 350,
				enableSearch: true,
				multiple: true,
				entities: [
					{
						id: 'structure-node',
						options: {
							selectMode: 'departmentsOnly',
							restricted: 'inviteUser',
						},
					},
				],
				events: {
					'Item:onBeforeDeselect': (event: BaseEvent) => {
						const dialog: Dialog = event.getTarget();
						const selectedItems: Item[] = dialog.getSelectedItems();
						if (selectedItems.length === 1 && this.#isRootItem(selectedItems[0]))
						{
							event.preventDefault();
						}
					},
					'Item:onDeselect': (event: BaseEvent) => {
						const dialog: Dialog = event.getTarget();
						const selectedItems: Item[] = dialog.getSelectedItems();
						if (selectedItems.length <= 0)
						{
							const item = dialog.getItem(['structure-node', options?.rootDepartment.id]);
							item?.select();
						}
					},
				},
			},
		});
	}

	#isRootItem(item: Object): boolean
	{
		const itemId = Type.isNil(item?.id) ? null : parseInt(item?.id, 10);
		const rootId = Type.isNil(this.#rootDepartment?.id) ? null : parseInt(this.#rootDepartment?.id, 10);

		return !Type.isNil(itemId) && !Type.isNil(rootId) && itemId === rootId;
	}

	renderTo(container: HTMLElement): void
	{
		Dom.append(this.render(), container);
	}

	getValues(): Array
	{
		const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();
		const collection = [];
		tagSelectorItems.forEach((item) => {
			const departmentId = parseInt(item.id, 10);
			if (departmentId > 0)
			{
				collection.push(departmentId);
			}
		});

		return collection;
	}

	render(): HTMLElament
	{
		const title = Tag.render`<label class="intranet-invitation__dialog-title">${Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_LABEL')}</label>`;
		const description = Tag.render`<div class="intranet-invitation__dialog-description">${Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION')}</div>`;
		const fieldContainer = Tag.render`<div></div>`;
		this.#tagSelector.renderTo(fieldContainer);

		return Tag.render`<div>${title}${description}${fieldContainer}</div>`;
	}
}
