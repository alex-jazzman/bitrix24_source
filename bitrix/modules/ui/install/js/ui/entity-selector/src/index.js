import Dialog from './dialog/dialog';
import EntityError from './entity/entity-error';
import Item from './item/item';
import Tab from './dialog/tabs/tab';
import Entity from './entity/entity';
import TagSelector from './tag-selector/tag-selector';
import TagItem from './tag-selector/tag-item';
import BaseHeader from './dialog/header/base-header';
import DefaultHeader from './dialog/header/default-header';
import BaseFooter from './dialog/footer/base-footer';
import DefaultFooter from './dialog/footer/default-footer';
import BaseStub from './dialog/tabs/base-stub';
import DefaultStub from './dialog/tabs/default-stub';

import type { DialogOptions } from './dialog/dialog-options';
import type { TabOptions } from './dialog/tabs/tab-options';
import type { ItemOptions } from './item/item-options';
import type { EntityOptions } from './entity/entity-options';
import type { TagSelectorOptions } from './tag-selector/tag-selector-options';

import './css/dialog.css';
import './css/tab.css';
import './css/item.css';
import './css/tag-selector.css';

const EntitySelector = {
	Dialog,
	Item,
	Tab,
	Entity,
	TagSelector,
	TagItem,
	BaseHeader,
	DefaultHeader,
	BaseFooter,
	DefaultFooter,
	BaseStub,
	DefaultStub,
	EntityError,
};

/**
 * @namespace BX.UI.EntitySelector
 */
export {
	EntitySelector,
	Dialog,
	Item,
	Tab,
	Entity,
	TagSelector,
	TagItem,
	BaseHeader,
	DefaultHeader,
	BaseFooter,
	DefaultFooter,
	BaseStub,
	DefaultStub,
	EntityError,
};

export type {
	DialogOptions,
	TabOptions,
	ItemOptions,
	EntityOptions,
	TagSelectorOptions,
};
