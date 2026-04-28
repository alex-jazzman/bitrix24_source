import { Loc, Type, Tag, Dom } from 'main.core';
import { TagSelector } from 'ui.entity-selector';
import { BaseEvent, EventEmitter } from 'main.core.events';
import EntityType from './entity-type';
import './style.css';

export type DepartmentControlType = {
	rootDepartment: Object,
	departmentList: any | [],
	title: string,
	description: string,
	entitiesType: ?Array<EntityType>,
	groupOptions: ?Object,
	preselectedItems: ?Array,
	addButtonCaption: ?string,
	dialogOptions: ?Object,
	id: ?string,
}

export {
	EntityType,
};

export default class DepartmentControl extends EventEmitter
{
	#tagSelector: TagSelector;
	#rootDepartment: Object;
	#departmentList: Array;
	#title: string;
	#description: string;
	#entitiesType: Array<EntityType>;
	#groupOptions: Object;
	#preselectedItems: Array;
	#addButtonCaption: ?string;
	#dialogOptions: Object;
	#id: string;

	constructor(options: DepartmentControlType)
	{
		super();
		this.setEventNamespace('BX.Intranet.DepartmentControl');
		this.#rootDepartment = Type.isNil(options?.rootDepartment) ? null : options?.rootDepartment;
		this.#departmentList = Type.isArray(options?.departmentList) ? options?.departmentList : [];
		this.#title = options.title ?? Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_LABEL');
		this.#description = options.description ?? Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION');
		this.#entitiesType = Type.isArray(options.entitiesType) ? options.entitiesType : [EntityType.DEPARTMENT];
		this.#groupOptions = Type.isObject(options.groupOptions) ? options.groupOptions : {};
		this.#preselectedItems = Type.isArray(options.preselectedItems) ? options.preselectedItems : [];
		this.#addButtonCaption = Type.isStringFilled(options.addButtonCaption) ? options.addButtonCaption : null;
		this.#dialogOptions = Type.isObject(options.dialogOptions) ? options.dialogOptions : {};
		this.#tagSelector = this.#initTagSelector(options);
		this.#id = Type.isStringFilled(options.id) ? options.id : BX.Text.getRandom(5);
	}

	#initTagSelector(options: DepartmentControlType): TagSelector
	{
		return new TagSelector({
			tagTextColor: '#1E8D36',
			tagBgColor: '#D4FDB0',
			items: this.getDefaultItems(),
			addButtonCaptionMore: this.#addButtonCaption,
			events: {
				onBeforeTagRemove: (event: BaseEvent) => {
					const selector = event.getTarget();
					const { tag } = event.getData();
					if (selector.getTags().length === 1 && this.#isRootItem(tag))
					{
						event.preventDefault();
					}
				},
				onAfterTagAdd: this.onAfterTagChange.bind(this),
				onAfterTagRemove: this.onAfterTagChange.bind(this),
			},
			dialogOptions: {
				...this.#dialogOptions,
				preselectedItems: this.#preselectedItems,
				context: 'INVITATION_STRUCTURE',
				width: 350,
				enableSearch: true,
				multiple: true,
				entities: this.#getDialogOptionsEntities(),
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
							const item = dialog.getItem(['structure-node', options?.rootDepartment?.id]);
							item?.select();
						}
					},
					onLoad: (event: BaseEvent) => {
						const dialog: Dialog = event.getTarget();
						dialog.selectTab('structure-departments-tab');
					},
				},
			},
		});
	}

	#getDialogOptionsEntities(): Array
	{
		const result = [];

		if (this.#entitiesType.includes(EntityType.DEPARTMENT))
		{
			result.push({
				id: 'structure-node',
				options: {
					selectMode: 'departmentsOnly',
					restricted: 'inviteUser',
				},
			});
		}

		const withGroups = this.#entitiesType.includes(EntityType.GROUP);
		const withExtranetGroups = this.#entitiesType.includes(EntityType.EXTRANET);
		const withCollabs = this.#entitiesType.includes(EntityType.COLLAB);

		if (withGroups || withExtranetGroups || withCollabs)
		{
			const options = this.#groupOptions;

			if (withExtranetGroups && !withGroups)
			{
				options.extranet = true;
			}
			else if (!withExtranetGroups && withGroups)
			{
				options.extranet = false;
			}

			if (!withCollabs)
			{
				options['!type'] = ['collab'];
			}

			result.push({
				id: 'project',
				options,
			});
		}

		return result;
	}

	getDefaultItems(): Array
	{
		let items = [];

		if (
			Type.isArray(this.#departmentList)
			&& this.#departmentList.length > 0
		)
		{
			items = this.#departmentList.map((department) => {
				return {
					id: parseInt(department.id, 10),
					avatar: '/bitrix/js/humanresources/entity-selector/src/images/company.svg',
					entityId: 'structure-node',
					textColor: '#006E7C',
					bgColor: '#DDF6F9',
					title: department.name,
					customData: {
						accessCode: department.accessCode,
					},
				};
			});
		}
		else if (!Type.isNil(this.#rootDepartment))
		{
			const rootDep = {
				id: parseInt(this.#rootDepartment.id, 10),
				avatar: '/bitrix/js/humanresources/entity-selector/src/images/company.svg',
				entityId: 'structure-node',
				textColor: '#006E7C',
				bgColor: '#DDF6F9',
				title: this.#rootDepartment.name,
				customData: {
					accessCode: this.#rootDepartment.accessCode,
				},
			};
			items.push(rootDep);
		}

		return items;
	}

	reset()
	{
		this.#tagSelector.removeTags();
		this.getDefaultItems().forEach((item) => {
			this.#tagSelector.addTag(item);
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
		tagSelectorItems
			.filter((item) => item?.entityId === 'structure-node')
			.forEach((item) => {
				const departmentId = parseInt(item?.id, 10);
				if (departmentId > 0)
				{
					collection.push(departmentId);
				}
			});

		return collection;
	}

	getGroupValues(): Array
	{
		const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();
		const collection = [];
		tagSelectorItems
			.filter((item) => item?.entityId === 'project')
			.forEach((item) => {
				const groupId = parseInt(item?.id, 10);

				if (groupId > 0)
				{
					collection.push(groupId);
				}
			});

		return collection;
	}

	getAllValues(): Object
	{
		const tagSelectorItems = this.#tagSelector.getDialog().getSelectedItems();

		const entitiesMap = Object.fromEntries(
			Object.getOwnPropertyNames(EntityType)
				.map((key) => EntityType[key])
				.map((value) => [value, []]),
		);

		tagSelectorItems.forEach((item) => {
			const itemId = parseInt(item?.id, 10);
			const itemType = this.#getEntityType(item);

			if (itemId > 0 && itemType)
			{
				entitiesMap[itemType].push(itemId);
			}
		});

		return entitiesMap;
	}

	#getEntityType(entity: Object): ?EntityType
	{
		if (entity.entityId === 'structure-node')
		{
			return EntityType.DEPARTMENT;
		}

		if (entity.entityId === 'project')
		{
			switch (entity.entityType ?? '')
			{
				case 'collab':
					return EntityType.COLLAB;
				case 'extranet':
					return EntityType.EXTRANET;
				case 'group':
				case 'project':
					return EntityType.GROUP;
				default:
					return null;
			}
		}

		return null;
	}

	render(): HTMLElement
	{
		const title = Tag.render`<label class="department-control__dialog-title">${this.#title}</label>`;
		const description = Tag.render`<div class="department-control__dialog-description">${this.#description}</div>`;
		const fieldContainer = Tag.render`<div></div>`;
		this.#tagSelector.renderTo(fieldContainer);

		return Tag.render`<div data-test-id="${this.#id}">${title}${description}${fieldContainer}</div>`;
	}

	onAfterTagChange(event: BaseEvent): void
	{
		const selector = event.getTarget();
		this.emit('onChange', { tags: selector.getTags() });
	}
}
