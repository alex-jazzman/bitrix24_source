import { Type } from 'main.core';
import { type Property } from '../../const/type';

/**
 * Which shape a list field is drawn in. `List` is the group of radios or checkboxes every such
 * field has always been; `Dropdown` is the text control whose options are picked in a menu. The
 * dropdown value is the wire form - `Select::VIEW_TYPE_MENU` is what the backend writes into the
 * property, so it is the contract, not an internal spelling. The list has no wire value of its
 * own: the property says nothing where the field stays a list, and the literal here is only the
 * name in code.
 */
export const SelectView = Object.freeze({
	List: 'list',
	Dropdown: 'menu',
});

export type SelectViewValue = typeof SelectView[keyof typeof SelectView];

const VIEW_SETTING = 'ViewType';

/**
 * The view a property asks for. Only the dropdown is ever written, so an absent key has to keep
 * every existing field the list it is; an unknown one falls back the same way rather than leaving
 * a field the core cannot draw at all.
 */
export function readSelectView(property: Property): SelectViewValue
{
	const settings = property.Settings;
	const view = Type.isPlainObject(settings) ? settings[VIEW_SETTING] : null;
	const known = (Object.values(SelectView) as string[]);

	return Type.isString(view) && known.includes(view) ? (view as SelectViewValue) : SelectView.List;
}
