/**
 * @module crm/entity-tab/unified-filter/field-icons
 */
jn.define('crm/entity-tab/unified-filter/field-icons', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { CommonFieldIcons } = require('layout/ui/field-filter/icons');

	/**
	 * Leading icons of the field rows CRM names itself, spread over the vocabulary the portal
	 * shares (`CommonFieldIcons`): what is written here is what a CRM list means by a field, and
	 * `NAME` is overridden because for a lead and a contact it is the name of a person.
	 *
	 * Covers every field a CRM list of the portal always has, over every entity type the tab
	 * serves. A field the map says nothing about - every user field among them - is drawn without
	 * an icon, there is no neutral stand-in.
	 *
	 * A requisite arrives as `RQ_ADDR|1|0|CITY`, where everything past the first `|` addresses the
	 * requisite preset and not the field, so the family is named once (`resolveFieldIcon`).
	 * @type {FieldIcons}
	 */
	const CRM_FIELD_ICONS = {
		...CommonFieldIcons,

		// naming of a person and of a document
		NAME: Icon.PERSON,
		SECOND_NAME: Icon.PERSON,
		LAST_NAME: Icon.PERSON,
		POST: Icon.PERSON_OFFICE,
		BIRTHDATE: Icon.CALENDAR,
		ACCOUNT_NUMBER: Icon.QUANTITY,
		QUOTE_NUMBER: Icon.QUANTITY,

		// who moved the item along the funnel
		MOVED_BY_ID: Icon.PERSON,
		MOVED_BY: Icon.PERSON,

		// stages and kinds
		STAGE_ID: Icon.STAGE,
		STAGE_SEMANTIC_ID: Icon.STAGE,
		STATUS_ID: Icon.STAGE,
		STATUS_SEMANTIC_ID: Icon.STAGE,
		PREVIOUS_STAGE_ID: Icon.STAGES,
		CATEGORY_ID: Icon.FOLDER,
		TYPE_ID: Icon.CHECK_LIST,
		COMPANY_TYPE: Icon.CHECK_LIST,
		EVENT_ID: Icon.CHECK_LIST,
		DELIVERY_STAGE: Icon.DELIVERY,
		PAYMENT_STAGE: Icon.PAYMENT,

		// the same stages, asked of the history of the item
		STAGE_ID_FROM_HISTORY: Icon.CLOCK_BACK,
		STAGE_ID_FROM_SUPPOSED_HISTORY: Icon.CLOCK_BACK,
		STAGE_SEMANTIC_ID_FROM_HISTORY: Icon.CLOCK_BACK,
		STATUS_ID_FROM_HISTORY: Icon.CLOCK_BACK,
		STATUS_ID_FROM_SUPPOSED_HISTORY: Icon.CLOCK_BACK,
		STATUS_SEMANTIC_ID_FROM_HISTORY: Icon.CLOCK_BACK,

		// money
		OPPORTUNITY: Icon.MONEY,
		CURRENCY_ID: Icon.MONEY,
		REVENUE: Icon.MONEY,
		PROBABILITY: Icon.STATISTICS_ARROW,

		// dates
		BEGINDATE: Icon.CALENDAR,
		MOVED_TIME: Icon.CALENDAR,
		EVENT_DATE: Icon.CALENDAR,
		PAYMENT_PAID: Icon.CALENDAR,
		CLOSEDATE: Icon.CALENDAR_WITH_SLOTS,
		ACTUAL_DATE: Icon.CALENDAR_WITH_SLOTS,
		// the span an item spent in work: the hourglass belongs to the status of a task
		ACTIVE_TIME_PERIOD: Icon.CLOCK,

		// what is over
		STATUS_CONVERTED: Icon.CIRCLE_CHECK,

		// activities of the item
		ACTIVITY_COUNTER: Icon.ACTIVITY,
		LAST_ACTIVITY_TIME: Icon.PULSE,
		LAST_COMMUNICATION_TIME: Icon.MESSAGES,
		ACTIVITY_FASTSEARCH_CREATED: Icon.CALENDAR,
		ACTIVITY_FASTSEARCH_DEADLINE: Icon.CALENDAR_WITH_SLOTS,
		ACTIVITY_FASTSEARCH_RESPONSIBLE_ID: Icon.PERSON,
		ACTIVITY_FASTSEARCH_AUTHOR_ID: Icon.PERSON,
		ACTIVITY_FASTSEARCH_COMPLETED: Icon.CIRCLE_CHECK,
		ACTIVITY_FASTSEARCH_ACTIVITY_TYPE: Icon.CHECK_LIST,
		ACTIVITY_FASTSEARCH_ACTIVITY_KIND: Icon.CHECK_LIST,

		// how the client is reached, as the client field of a CRM card draws the very same three ways
		// (crm.mini-card, BUTTON_CONFIGURATION). The kind of the way is not one of them, so it is
		// drawn as every other field naming a kind here.
		COMMUNICATION_TYPE: Icon.CHECK_LIST,
		HAS_PHONE: Icon.PHONE_UP,
		PHONE: Icon.PHONE_UP,
		HAS_EMAIL: Icon.MAIL,
		EMAIL: Icon.MAIL,
		WEB: Icon.EARTH,
		IM: Icon.OPEN_CHANNELS,

		// items of CRM this one is bound to
		CONTACT_ID: Icon.CONTACT,
		CONTACT_FULL_NAME: Icon.CONTACT,
		'CONTACT.FULL_NAME': Icon.CONTACT,
		COMPANY_ID: Icon.COMPANY,
		COMPANY_TITLE: Icon.COMPANY,
		'COMPANY.TITLE': Icon.COMPANY,
		MYCOMPANY_ID: Icon.CONTACT_DETAILS,
		LEAD_ID: Icon.LEAD,
		// a deal is a handshake wherever the product draws one - the same icon its section carries
		DEAL_ID: Icon.HANDSHAKE,
		// parents of an invoice, by the type ids of CRM: a deal and a quote
		PARENT_ID_2: Icon.HANDSHAKE,
		PARENT_ID_7: Icon.QUOTE,
		RELATED_ENTITIES: Icon.CRM_FIELD_LINKED,
		ENTITIES_LINKS: Icon.CRM_FIELD_LINKED,

		// the company behind the item
		INDUSTRY: Icon.SUITCASE,
		EMPLOYEES: Icon.THREE_PERSONS,
		EXPORT: Icon.EXPORT,

		// what is being sold
		PRODUCT_ROW_PRODUCT_ID: Icon.PRODUCT,
		'PRODUCT_ROWS.PRODUCT_ID': Icon.PRODUCT,
		ORDER_SOURCE: Icon.SHOPPING_CART,

		// where the item came from
		SOURCE_ID: Icon.PATH,
		// what was written about that source by hand, and so a text and not a way of its own
		SOURCE_DESCRIPTION: Icon.TEXT,
		ORIGINATOR_ID: Icon.CONNECTION,
		WEBFORM_ID: Icon.CRM_FORM,
		IS_NEW: Icon.IDEA_LAMP,
		IS_RETURN_CUSTOMER: Icon.REPEAT,
		IS_REPEATED_APPROACH: Icon.REPEAT,
		REPEAT_SALE_SEGMENT_ID: Icon.REPEAT_SALES,
		ROBOT_DEBUGGER: Icon.BUG,

		// analytics of the traffic
		TRACKING_SOURCE_ID: Icon.CRM_ANALYTICS,
		TRACKING_CHANNEL_CODE: Icon.PATH,
		UTM_SOURCE: Icon.MARKETING,
		UTM_MEDIUM: Icon.MARKETING,
		UTM_CAMPAIGN: Icon.MARKETING,
		UTM_CONTENT: Icon.MARKETING,
		UTM_TERM: Icon.MARKETING,

		// address of a lead
		ADDRESS: Icon.LOCATION,
		ADDRESS_2: Icon.LOCATION,
		ADDRESS_CITY: Icon.LOCATION,
		ADDRESS_REGION: Icon.LOCATION,
		ADDRESS_PROVINCE: Icon.LOCATION,
		ADDRESS_POSTAL_CODE: Icon.LOCATION,
		ADDRESS_COUNTRY: Icon.LOCATION,

		// requisites, by the code of the family
		RQ_FIRST_NAME: Icon.CONTACT_DETAILS,
		RQ_SECOND_NAME: Icon.CONTACT_DETAILS,
		RQ_LAST_NAME: Icon.CONTACT_DETAILS,
		RQ_COMPANY_NAME: Icon.CONTACT_DETAILS,
		RQ_COMPANY_FULL_NAME: Icon.CONTACT_DETAILS,
		RQ_INN: Icon.CONTACT_DETAILS,
		RQ_KPP: Icon.CONTACT_DETAILS,
		RQ_OKPO: Icon.CONTACT_DETAILS,
		RQ_IDENT_DOC_SER: Icon.DOCUMENT_SIGN,
		RQ_IDENT_DOC_NUM: Icon.DOCUMENT_SIGN,
		RQ_ADDR: Icon.LOCATION,

		// fields of the client of a deal or an invoice: the same meanings, asked of the contact
		CONTACT_NAME: Icon.CONTACT,
		CONTACT_SECOND_NAME: Icon.CONTACT,
		CONTACT_LAST_NAME: Icon.CONTACT,
		CONTACT_BIRTHDATE: Icon.CALENDAR,
		CONTACT_DATE_CREATE: Icon.CALENDAR,
		CONTACT_DATE_MODIFY: Icon.CALENDAR,
		CONTACT_CREATED_BY_ID: Icon.PERSON,
		CONTACT_MODIFY_BY_ID: Icon.PERSON,
		CONTACT_ASSIGNED_BY_ID: Icon.PERSON,
		CONTACT_SOURCE_ID: Icon.PATH,
		CONTACT_TYPE_ID: Icon.CHECK_LIST,
		CONTACT_EXPORT: Icon.EXPORT,
		CONTACT_POST: Icon.PERSON_OFFICE,
		CONTACT_COMMENTS: Icon.MESSAGE,
		CONTACT_HAS_PHONE: Icon.PHONE_UP,
		CONTACT_HAS_EMAIL: Icon.MAIL,
		CONTACT_WEBFORM_ID: Icon.CRM_FORM,
		CONTACT_ORIGINATOR_ID: Icon.CONNECTION,
		CONTACT_LAST_ACTIVITY_TIME: Icon.PULSE,

		// and of the company
		COMPANY_DATE_CREATE: Icon.CALENDAR,
		COMPANY_DATE_MODIFY: Icon.CALENDAR,
		COMPANY_CREATED_BY_ID: Icon.PERSON,
		COMPANY_MODIFY_BY_ID: Icon.PERSON,
		COMPANY_ASSIGNED_BY_ID: Icon.PERSON,
		COMPANY_HAS_PHONE: Icon.PHONE_UP,
		COMPANY_HAS_EMAIL: Icon.MAIL,
		COMPANY_INDUSTRY: Icon.SUITCASE,
		COMPANY_REVENUE: Icon.MONEY,
		COMPANY_CURRENCY_ID: Icon.MONEY,
		COMPANY_EMPLOYEES: Icon.THREE_PERSONS,
		COMPANY_COMMENTS: Icon.MESSAGE,
		COMPANY_WEBFORM_ID: Icon.CRM_FORM,
		COMPANY_ORIGINATOR_ID: Icon.CONNECTION,
		COMPANY_LAST_ACTIVITY_TIME: Icon.PULSE,
	};

	module.exports = { CRM_FIELD_ICONS };
});
