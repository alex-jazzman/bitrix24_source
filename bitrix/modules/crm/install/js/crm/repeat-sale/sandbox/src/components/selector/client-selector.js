import { Dialog } from 'crm.vue3.dialog';

export const ClientSelector = {
	components: {
		Dialog,
	},

	props: {
		currentEntityId: {
			type: Number,
		},
		currentEntityTypeId: {
			type: Number,
		},
		entityTypes: {
			type: Array,
			required: true,
		},
	},

	created()
	{
		this.entities = [];

		const entityTypeMap = {
			contact: BX.CrmEntityType.names.contact,
			company: BX.CrmEntityType.names.company,
			deal: BX.CrmEntityType.names.deal,
		};

		const commonOptions = {
			dynamicLoad: true,
			dynamicSearch: true,
			options: {
				showTab: true,
				showPhones: true,
				showMails: true,
				hideReadMoreLink: false,
			},
		};

		this.entities = Object.entries(entityTypeMap)
			.filter(([entityId, entityName]) => this.entityTypes.includes(entityName.toLowerCase()))
			.map(([entityId]) => ({
				id: entityId,
				...commonOptions,
			}))
		;
	},

	computed: {
		preselectedItems(): Array<string, number>
		{
			if (this.currentEntityTypeId === null)
			{
				return [];
			}

			return [
				[
					BX.CrmEntityType.resolveName(this.currentEntityTypeId).toLowerCase(),
					this.currentEntityId,
				],
			];
		},
	},

	// language=Vue
	template: `
		<Dialog 
			:entities="entities"
			:show-avatars="true"
			:preselected-items="preselectedItems"
		/>
	`,
};
