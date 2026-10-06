/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_cache, main_core_events, main_loader, sign_v2_api, sign_v2_b2e_companySelector, sign_v2_b2e_signDropdown) {
	'use strict';

	const dropdownTemplateEntityId = 'sign-b2e-start-process-type';
	const dropdownProcessTabId = 'sign-b2e-start-process-types';
	class StartProcess extends main_core_events.EventEmitter {
		events = {
			onProcessTypeSelect: 'onProcessTypeSelect'
		};
		#resettableCache = new main_core_cache.MemoryCache();
		#api = new sign_v2_api.Api();
		#templatesList = this.#api.template.getList();
		constructor() {
			super();
			this.setEventNamespace('BX.V2.B2e.StartProcess');
			void this.#getProcessTypeLayoutLoader().show();
		}
		getLayout() {
			return this.#resettableCache.remember('layout', () => {
				return main_core.Tag.render`
				<div>
					<h1 class="sign-b2e-settings__header">${main_core.Loc.getMessage('SIGN_START_PROCESS_HEAD')}</h1>
					<div class="sign-b2e-settings__item">
						<p class="sign-b2e-settings__item_title">
							${main_core.Loc.getMessage('SIGN_START_PROCESS_COMPANY')}
						</p>
						${this.#getCompanySelector().getLayout()}
					</div>
					<div class="sign-b2e-settings__item">
						<p class="sign-b2e-settings__item_title">
							${main_core.Loc.getMessage('SIGN_START_PROCESS_TYPE')}
						</p>
						${this.#getProcessTypeDropdown().getLayout()}
					</div>
				</div>
			`;
			});
		}
		getSelectedTemplateUid() {
			return this.#getProcessTypeDropdown().getSelectedId();
		}
		getTemplates() {
			return this.#templatesList;
		}
		getFields(templateUid) {
			return this.#api.template.getFields(templateUid);
		}
		#getProcessTypeLayoutLoader() {
			return this.#resettableCache.remember('processTypeLayoutLoader', () => new main_loader.Loader({
				target: this.#getProcessTypeDropdown().getLayout()
			}));
		}
		#getProcessTypeDropdown() {
			return this.#resettableCache.remember('processTypeDropdown', () => {
				const signDropdown = new sign_v2_b2e_signDropdown.SignDropdown({
					tabs: [{
						id: dropdownProcessTabId,
						title: ' '
					}],
					entities: [{
						id: dropdownTemplateEntityId
					}],
					items: [],
					isEnableSearch: true
				});
				signDropdown.subscribe(signDropdown.events.onSelect, event => this.emit(this.events.onProcessTypeSelect, event));
				return signDropdown;
			});
		}
		#getCompanySelector() {
			return this.#resettableCache.remember('companySelector', () => {
				const companySelector = new sign_v2_b2e_companySelector.CompanySelector({
					loadCompanyPromise: this.#getCompanySelectorLoadCompanyPromise(),
					canCreateCompany: false,
					canEditCompany: false,
					isCompaniesDeselectable: false
				});
				companySelector.subscribe(companySelector.events.onCompaniesLoad, () => this.#onCompaniesSelectorCompaniesLoad());
				companySelector.subscribe(companySelector.events.onSelect, event => this.#onCompanySelectorSelect(event));
				return companySelector;
			});
		}
		#createProcessTypeDropdownItemByTemplate(template) {
			return {
				id: template.uid,
				title: template.title,
				entityId: dropdownTemplateEntityId,
				tabs: dropdownProcessTabId,
				deselectable: false
			};
		}
		async #getCompanySelectorLoadCompanyPromise() {
			const uniqueCompanies = await this.#getUniqueCompanies();
			const companySelectorCompanies = uniqueCompanies.map(({
				id,
				name,
				taxId
			}) => ({
				id,
				title: name,
				rqInn: taxId
			}));

			// todo: get actual showTaxId
			return {
				companies: companySelectorCompanies,
				showTaxId: true
			};
		}
		async #getUniqueCompanies() {
			const templates = await this.#templatesList;
			const companies = templates.map(template => template.company);
			const uniqCompanyIds = new Set(companies.map(({
				id
			}) => id));
			return [...uniqCompanyIds].map(id => companies.find(company => company.id === id));
		}
		async #onCompaniesSelectorCompaniesLoad() {
			const companySelector = this.#getCompanySelector();
			const templates = await this.#templatesList;
			const lastUsedTemplate = templates.find(({
				isLastUsed
			}) => isLastUsed);
			let selectedCompanyId = lastUsedTemplate?.company?.id;
			if (main_core.Type.isUndefined(selectedCompanyId)) {
				const companies = await this.#getUniqueCompanies();
				selectedCompanyId = companies.at(0)?.id;
			}
			if (main_core.Type.isUndefined(selectedCompanyId)) {
				return;
			}
			companySelector.selectCompany(selectedCompanyId);
		}
		async #onCompanySelectorSelect(event) {
			void this.#getProcessTypeLayoutLoader().show();
			const companyId = event.getData().companyId;
			const templates = await this.#templatesList;
			const processTypeItems = templates.filter(({
				company
			}) => company.id === companyId).map(template => this.#createProcessTypeDropdownItemByTemplate(template));
			const signDropdown = this.#getProcessTypeDropdown();
			signDropdown.removeItems();
			signDropdown.addItems(processTypeItems);
			signDropdown.selectFirstItem();
			void this.#getProcessTypeLayoutLoader().hide();
		}
		resetCache() {
			this.#resettableCache = new main_core_cache.MemoryCache();
		}
	}

	exports.StartProcess = StartProcess;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Cache, BX.Event, BX, BX.Sign.V2, BX.Sign.V2.B2e, BX.Sign.V2.B2e);
//# sourceMappingURL=start-process.bundle.js.map
