import { Loc, Tag, Type } from 'main.core';
import { DefaultFooter, Dialog, Item, type FooterOptions } from 'ui.entity-selector';

import { DepartmentCreationPopup } from 'humanresources.department-creation-popup';

export class DepartmentCreationFooter extends DefaultFooter
{
	constructor(dialog: Dialog, options: FooterOptions)
	{
		super(dialog, options);

		this.departmentCreationPopup = null;
		this.handleDialogDestroy = this.handleDialogDestroy.bind(this);
		this.getDialog().subscribe('onDestroy', this.handleDialogDestroy);
	}

	getContent(): HTMLElement
	{
		return this.cache.remember('content', () => {
			this.footerLink = Tag.render`
				<span
					class="ui-selector-footer-link ui-selector-footer-link-add"
					onclick="${this.handleFooterClick.bind(this)}"
				>
					${Loc.getMessage('HUMANRESOURCES_ENTITY_SELECTOR_CREATE_DEPARTMENT_FOOTER')}
				</span>
			`;

			return this.footerLink;
		});
	}

	handleFooterClick(): void
	{
		this.departmentCreationPopup ??= new DepartmentCreationPopup({
			onCreate: async (result) => {
				this.handleDepartmentCreated(result?.node);
			},
		});

		this.departmentCreationPopup.show({
			parentDepartmentId: this.getSelectedDepartmentId(),
			departmentName: this.getDepartmentNameFromSearchQuery(),
		});
	}

	handleDepartmentCreated(node): void
	{
		if (!node?.id)
		{
			return;
		}

		const dialog = this.getDialog();
		let item = dialog.getItem(['structure-node', node.id]);

		if (!item)
		{
			item = dialog.addItem({
				id: node.id,
				entityId: 'structure-node',
				entityType: 'department',
				title: node.name,
				avatar: '/bitrix/js/humanresources/entity-selector/src/images/department.svg',
				tagOptions: {
					avatar: '/bitrix/js/humanresources/entity-selector/src/images/department.svg',
					fontWeight: '700',
					bgColor: '#ade7e4',
					textColor: '#207976',
				},
				customData: {
					accessCode: node.accessCode,
					nodeEntityType: 'department',
				},
			});
		}

		if (!item.isSelected())
		{
			item.select();
		}
	}

	getSelectedDepartmentId(): string | number | null
	{
		const selectedDepartment = this.getDialog()
			.getSelectedItems()
			.find((item: Item) => item.entityId === 'structure-node')
		;

		return selectedDepartment?.id ?? null;
	}

	getDepartmentNameFromSearchQuery(): string
	{
		const query = this.getDialog().getTagSelectorQuery();

		return Type.isString(query) ? query.trim() : '';
	}

	handleDialogDestroy(): void
	{
		this.getDialog().unsubscribe('onDestroy', this.handleDialogDestroy);
		this.departmentCreationPopup?.destroy();
		this.departmentCreationPopup = null;
	}
}
