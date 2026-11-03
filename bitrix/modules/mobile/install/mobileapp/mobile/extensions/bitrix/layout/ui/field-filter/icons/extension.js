/**
 * @module layout/ui/field-filter/icons
 */
jn.define('layout/ui/field-filter/icons', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');

	/**
	 * Everything past the first separator addresses the preset a field belongs to, not the field:
	 * a requisite of a CRM item arrives as `RQ_ADDR|1|0|CITY`, where `1` is the requisite preset
	 * and `0|CITY` the part of the address.
	 * @type {string}
	 */
	const FAMILY_SEPARATOR = '|';

	/**
	 * Fields the portal names the same way wherever they appear: the author and the owner of an
	 * item, the dates it was created and changed on, its title, its comment, its tag. A module
	 * spreads this map into its own and keeps only what its lists mean by themselves - and it
	 * overrides an entry whenever the word means something else there: `CLOSED` is a closed deal
	 * in CRM and an archived project in tasks.
	 *
	 * Only the codes some list of the portal really has: an icon for a field nobody asks for is
	 * an entry nothing can reach.
	 *
	 * @type {FieldIcons}
	 */
	const CommonFieldIcons = {
		// a number of an item and not a numbered list: the latter is what the icon means in an editor
		ID: Icon.QUANTITY,
		TITLE: Icon.TEXT,
		NAME: Icon.TEXT,
		COMMENTS: Icon.MESSAGE,
		TAG: Icon.TAG,

		CREATED_BY: Icon.PERSON,
		CREATED_BY_ID: Icon.PERSON,
		MODIFY_BY_ID: Icon.PERSON,
		UPDATED_BY: Icon.PERSON,
		ASSIGNED_BY_ID: Icon.PERSON,
		RESPONSIBLE_ID: Icon.PERSON,
		OBSERVERS: Icon.OBSERVER,
		OBSERVER_IDS: Icon.OBSERVER,

		DATE_CREATE: Icon.CALENDAR,
		DATE_MODIFY: Icon.CALENDAR,
		CREATED_TIME: Icon.CALENDAR,
		UPDATED_TIME: Icon.CALENDAR,
		DEADLINE: Icon.CALENDAR_WITH_SLOTS,

		OPENED: Icon.UNLOCK,
		CLOSED: Icon.CIRCLE_CHECK,
	};

	/**
	 * Leading icon of a field row, as the consumer of the filter names it (`fieldIcons`). Beyond
	 * the id of a field the map may name the code of a whole family - one entry then covers every
	 * preset of the portal, which is the only way to reach fields whose id carries a preset.
	 *
	 * A field the map says nothing about is drawn without an icon: there is no neutral stand-in,
	 * and every user field of the portal is such a field.
	 *
	 * @param {FieldIcons} icons
	 * @param {string} fieldId
	 * @return {?FieldIcon}
	 */
	const resolveFieldIcon = (icons, fieldId) => {
		if (!Type.isPlainObject(icons) || !Type.isStringFilled(fieldId))
		{
			return null;
		}

		const separator = fieldId.indexOf(FAMILY_SEPARATOR);
		const family = separator === -1 ? fieldId : fieldId.slice(0, separator);

		return icons[fieldId] ?? icons[family] ?? null;
	};

	/**
	 * Whether the rows of the fields are drawn with a leading icon. The product left the pictures to
	 * the titles of the groups alone: a row of the form and a row of the field screen are read by
	 * their names, and a column of icons in front of them only narrows the name.
	 *
	 * The vocabularies stay as they are, and so does everything that carries them to the rows - the
	 * decision may come back, and it comes back by this one answer.
	 *
	 * @type {boolean}
	 */
	const FIELD_ROW_ICONS_SHOWN = false;

	/**
	 * The icon of a field row, and the only thing a row asks: the map is read while the rows are
	 * drawn with icons at all (`FIELD_ROW_ICONS_SHOWN`), and nothing is drawn while they are not.
	 *
	 * @param {FieldIcons} icons
	 * @param {string} fieldId
	 * @return {?FieldIcon}
	 */
	const resolveFieldRowIcon = (icons, fieldId) => (
		FIELD_ROW_ICONS_SHOWN ? resolveFieldIcon(icons, fieldId) : null
	);

	/**
	 * The icon a filter field is drawn with. A list screen names the icons of its own rows long before
	 * the drawer is opened, and every module adds its own names on top of the common vocabulary, so
	 * this is the most widely required part of the filter and the cheapest one to load.
	 */
	module.exports = {
		CommonFieldIcons,
		resolveFieldIcon,
		resolveFieldRowIcon,
		FIELD_ROW_ICONS_SHOWN,
	};
});
