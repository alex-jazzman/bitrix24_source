/**
 * @module crm/entity-tab/unified-filter/section-icons
 */
jn.define('crm/entity-tab/unified-filter/section-icons', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');

	/**
	 * Icons of the field groups, keyed by the section id the server sends (Crm\Filter\HeaderSections):
	 * the entity of the list, its client entities, its activity search.
	 *
	 * Every entity of CRM that opens a list of its own is named here: a group left out is drawn with
	 * its title alone, and next to the groups of the client and of the activity it reads as an icon
	 * that failed to load rather than as a group without one (checked on the live app: the invoice
	 * group of the invoice list stood iconless above the contact and company groups).
	 *
	 * A dynamic type is not among them: its section id carries the id of the type
	 * (`DYNAMIC_<typeId>`), which is known only at runtime - the group of such a list is named by
	 * `getSectionIcons`.
	 * @type {FieldIcons}
	 */
	const CRM_SECTION_ICONS = {
		LEAD: Icon.LEAD,
		DEAL: Icon.HANDSHAKE,
		CONTACT: Icon.CONTACT,
		COMPANY: Icon.COMPANY,
		QUOTE: Icon.QUOTE,
		SMART_INVOICE: Icon.INVOICE,
		ACTIVITY_FASTSEARCH: Icon.TASK_LIST,
	};

	/** How the server names the section of a list of a dynamic type: the entity name of that type. */
	const DYNAMIC_SECTION_PREFIX = 'DYNAMIC_';

	/**
	 * Icons of the groups of one list: the shared map, plus the group of the list itself when that
	 * list is a smart process.
	 *
	 * One icon for every smart process and not the icon of the type: the icon a type is drawn by
	 * belongs to the type and the drawer never receives it, while a group with no icon at all reads
	 * as an icon that failed to load next to the contact and company groups. Only the section of this
	 * list is added - a key of a type the list is not would be an entry nothing can reach.
	 *
	 * @param {string} entityTypeName the entity of the list, as its own group is named
	 * @return {FieldIcons}
	 */
	const getSectionIcons = (entityTypeName) => {
		if (
			!Type.isStringFilled(entityTypeName)
			|| !entityTypeName.startsWith(DYNAMIC_SECTION_PREFIX)
		)
		{
			return CRM_SECTION_ICONS;
		}

		return { ...CRM_SECTION_ICONS, [entityTypeName]: Icon.SMART_PROCESS };
	};

	module.exports = { CRM_SECTION_ICONS, getSectionIcons };
});
