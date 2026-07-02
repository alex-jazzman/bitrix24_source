import { type Store } from 'ui.vue3.vuex';

import { type CrmFormService } from 'imopenlines.v2.provider.service';

import { type ImolModelCrmForm } from 'imopenlines.v2.model';

export class CrmFormManager
{
	#crmFormService: CrmFormService;
	#store: Store;

	constructor(store: Store, crmFormService: CrmFormService)
	{
		this.#crmFormService = crmFormService;
		this.#store = store;
	}

	async loadForms(): Promise<ImolModelCrmForm[]>
	{
		const cachedForms = this.#store.getters['openLines/crmForm/getList']();
		if (cachedForms.length > 0)
		{
			return cachedForms;
		}

		return this.#crmFormService.loadForms();
	}

	async sendForm(dialogId: string, formData: ImolModelCrmForm): Promise<void>
	{
		await this.#crmFormService.sendForm(dialogId, formData.id);
	}
}
