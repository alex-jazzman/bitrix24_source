export type CrmIntegrationSettingsType = {
	enabled: {
		type: Boolean,
		required: true
	},
	sync: {
		type: Object,
		required: true
	},
	incoming: {
		type: Object,
		required: true
	},
	outgoing: {
		type: Object,
		required: true
	},
	assignKnownClientEmails: {
		type: Boolean,
		required: true
	},
	source: {
		type: String,
		required: true
	},
	leadCreationAddresses: {
		type: String,
		required: true
	},
	responsibleQueue: {
		type: Array,
		required: true
	},
}
