import { type Store } from 'ui.vue3.vuex';

import { SilentModeService, CrmFormService } from 'imopenlines.v2.provider.service';
import { type ImolModelCrmForm } from 'imopenlines.v2.model';

import { SilentModeManager } from 'imopenlines.v2.lib.silent-mode';
import { CrmFormManager } from 'imopenlines.v2.lib.crm-form';
import { QuickCommandManager } from 'imopenlines.v2.lib.quick-command';

export class ToolbarButtonsManager
{
	#silentModeManager: SilentModeManager;
	#crmFormManager: CrmFormManager;
	#quickCommandManager: QuickCommandManager;

	constructor(store: Store, dialogId: string)
	{
		this.#silentModeManager = new SilentModeManager(store, new SilentModeService());
		this.#crmFormManager = new CrmFormManager(store, new CrmFormService());
		this.#quickCommandManager = new QuickCommandManager(dialogId);
	}

	destroy()
	{
		this.#quickCommandManager.destroy();
	}
	getSilentModeStatus(dialogId: string): boolean
	{
		return this.#silentModeManager.getStatus(dialogId);
	}
	toggleSilentMode(dialogId: string): Promise<void>
	{
		return this.#silentModeManager.toggle(dialogId);
	}
	loadCrmForms(): Promise<ImolModelCrmForm[]>
	{
		return this.#crmFormManager.loadForms();
	}
	sendCrmForm(dialogId: string, form: ImolModelCrmForm): Promise<void>
	{
		return this.#crmFormManager.sendForm(dialogId, form);
	}
}
