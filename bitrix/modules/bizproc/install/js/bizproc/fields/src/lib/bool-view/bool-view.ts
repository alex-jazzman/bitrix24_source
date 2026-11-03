import {Type} from 'main.core';
import {type Property} from '../../const/type';

/**
 * Which shape a boolean field is drawn in. `Switcher` is the toggle every such field has always
 * been; `Checkbox` is the flag with its name standing beside it. The values are the wire form -
 * this is what the backend writes into the property, so they are the contract, not an internal
 * spelling.
 */
export const BoolView = Object.freeze({
	Switcher: 'switcher',
	Checkbox: 'checkbox',
});

export type BoolViewValue = typeof BoolView[keyof typeof BoolView];

const VIEW_SETTING = 'View';

/**
 * The view a property asks for. Nothing writes the key today, so an absent one has to keep every
 * existing field the toggle it is; an unknown one falls back the same way rather than leaving a
 * field the core cannot draw at all.
 */
export function readBoolView(property: Property): BoolViewValue
{
	const settings = property.Settings;
	const view = Type.isPlainObject(settings) ? settings[VIEW_SETTING] : null;
	const known = (Object.values(BoolView) as string[]);

	return Type.isString(view) && known.includes(view) ? (view as BoolViewValue) : BoolView.Switcher;
}
