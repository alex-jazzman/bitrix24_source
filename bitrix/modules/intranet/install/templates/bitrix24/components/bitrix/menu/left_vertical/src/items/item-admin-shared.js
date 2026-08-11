import {Tag, Loc} from 'main.core';
import {EventEmitter} from 'main.core.events';
import Item from './item';
import Backend from "../backend";
import Options from "../options";
import { ITEM_CODE_USER_FAVORITES, ITEM_CODE_USER_SELF } from "./item-codes";
import Utils from "../utils";

export default class ItemAdminShared extends Item
{
	static code = 'admin';

	canDelete(): boolean
	{
		return this.container.dataset.deletePerm === 'Y';
	}

	delete()
	{
		Backend
			.deleteAdminSharedItemMenu(this.getId())
			.then(() => {
				if (this.storage.indexOf(ITEM_CODE_USER_FAVORITES) >= 0)
				{
					Backend.deleteFavoritesItemMenu({id: this.getId()});
				}
				if (this.storage.indexOf(ITEM_CODE_USER_SELF) >= 0)
				{
					Backend.deleteSelfITem(this.getId());
				}
				EventEmitter.emit(this, Options.eventName('onItemDelete'), {animate: true});
			})
			.catch(this.showError)
		;
	}

	getDropDownActions(): Array
	{
		if (!this.canDelete())
		{
			return [];
		}

		const contextMenuItems = [];
/*		contextMenuItems.push({
			text: Loc.getMessage("MENU_RENAME_ITEM"),
			onclick: () => {
				this.constructor
					.showUpdate(this)
					.then(this.update.bind(this))
					.catch(this.showError.bind(this));
			}
		});
*/

		if (this.storage.filter((value) => {return value === ITEM_CODE_USER_FAVORITES || value === ITEM_CODE_USER_SELF;}).length > 0)
		{
			contextMenuItems.push({
				text: Loc.getMessage('MENU_REMOVE_STANDARD_ITEM'),
				onclick: this.delete.bind(this)
			});
			contextMenuItems.push({
				text: Loc.getMessage('MENU_DELETE_CUSTOM_ITEM_FROM_ALL'),
				onclick: () => {
					Backend
						.deleteAdminSharedItemMenu(this.getId())
						.then(() => {
							this.showMessage(Loc.getMessage('MENU_ITEM_WAS_DELETED_FROM_ALL'));
							const codeToConvert = this.storage.indexOf(ITEM_CODE_USER_SELF) >= 0
								? ITEM_CODE_USER_SELF
								: ITEM_CODE_USER_FAVORITES;
							this.container.dataset.type = codeToConvert;
							this.container.dataset.storage = this.storage.filter((v) => {return v !== codeToConvert}).join(',');
							EventEmitter.emit(this, Options.eventName('onItemConvert'), this);
						})
						.catch(this.showError);
				}
			});
		}
		else
		{
			contextMenuItems.push({
				text: Loc.getMessage("MENU_DELETE_CUSTOM_ITEM_FROM_ALL"),
				onclick: this.delete.bind(this)
			});
		}
		return contextMenuItems;
	}
}
