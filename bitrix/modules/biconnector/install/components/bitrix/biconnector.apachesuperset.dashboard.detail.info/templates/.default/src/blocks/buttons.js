import { Event, Loc, Tag, Text, Type } from 'main.core';
import { MenuManager, Popup } from 'main.popup';

export class ButtonsBlock
{
	static render(canShowMoreMenu: boolean = false): string
	{
		const buttonDiscuss = Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_BUTTON_DISCUSS') ?? '';
		const moreButton = canShowMoreMenu
			? `
				<button id="more-btn" class="ui-btn ui-btn-md --air ui-btn-no-caps --style-outline --with-left-icon dashboard-info-header-buttons-more">
					<div class="ui-icon-set --more-m"></div>
				</button>
			`
			: ''
		;

		return `
			<button id="discuss-btn" class="ui-btn ui-btn-md ui-btn-primary --air ui-btn-no-caps --with-left-icon dashboard-info-header-buttons-discuss">
				<div class="ui-icon-set --o-chats"></div>
				${Text.encode(buttonDiscuss)}
			</button>
			${moreButton}
		`;
	}
}

type MoreMenuOptions = {
	button: Element,
	menuId: string,
	canModifySettings: boolean,
	canDelete: boolean,
	onEdit: Function,
	onDelete: Function,
};

export class MoreMenu
{
	constructor(options: MoreMenuOptions)
	{
		this.button = options.button;
		this.menuId = options.menuId;
		this.canModifySettings = options.canModifySettings === true;
		this.canDelete = options.canDelete === true;
		this.onEdit = Type.isFunction(options.onEdit) ? options.onEdit : () => {};
		this.onDelete = Type.isFunction(options.onDelete) ? options.onDelete : () => {};
		this.onButtonClickHandler = this.onButtonClick.bind(this);
	}

	bind(): void
	{
		if (!Type.isDomNode(this.button))
		{
			return;
		}

		Event.unbindAll(this.button);
		Event.bind(this.button, 'click', this.onButtonClickHandler);
	}

	onButtonClick(): void
	{
		if (!Type.isDomNode(this.button))
		{
			return;
		}

		const openedMenu = MenuManager.getMenuById(this.menuId);
		if (openedMenu)
		{
			openedMenu.close();

			return;
		}

		const menuItems = this.getMenuItems();
		if (menuItems.length === 0)
		{
			return;
		}

		const angleOffset = Math.round((this.button.offsetWidth / 2) + Popup.getOption('angleMinTop'));

		const moreMenu = MenuManager.create({
			id: this.menuId,
			closeByEsc: true,
			closeIcon: false,
			cacheable: false,
			className: 'report-more-menu',
			angle: { offset: angleOffset },
			items: menuItems,
			autoHide: true,
			bindElement: this.button,
		});

		moreMenu.show();
	}

	getMenuItems(): Array<Object>
	{
		const items = [];

		if (this.canModifySettings)
		{
			items.push({
				html: Tag.render`
					<span class="report-more-menu-item">
						<span class="report-more-menu-item__text">
							${Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_MORE_MENU_EDIT') ?? ''}
						</span>
						<span class="ui-icon-set --edit-m"></span>
					</span>
				`,
				onclick: () => {
					this.onEdit();
					this.close();
				},
			});
		}

		if (this.canDelete)
		{
			items.push({
				html: Tag.render`
					<span class="report-more-menu-item report-more-menu-item--danger">
						<span class="report-more-menu-item__text">
							${Loc.getMessage('BICONNECTOR_APACHESUPERSET_DASHBOARD_DETAIL_INFO_MORE_MENU_DELETE') ?? ''}
						</span>
						<span class="ui-icon-set --o-trashcan"></span>
					</span>
				`,
				onclick: () => {
					this.onDelete();
					this.close();
				},
			});
		}

		return items;
	}

	close(): void
	{
		const menu = MenuManager.getMenuById(this.menuId);
		if (menu)
		{
			menu.close();
		}
	}
}
