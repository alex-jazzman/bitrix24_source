/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, sign_v2_api, ui_vue3, sign_v2_b2e_userParty, sign_v2_b2e_signSettingsTemplates) {
	'use strict';

	// @vue/component
	const UserPartyApp = {
		name: 'UserPartyApp',
		props: {
			userParty: {
				/** @type UserParty */
				type: Object,
				required: true
			},
			region: {
				type: String,
				required: true
			}
		},
		mounted() {
			const userPartyLayout = this.userParty.getLayout(this.region);
			this.$refs.userPartyContainer.appendChild(userPartyLayout);
		},
		template: `
		<div ref="userPartyContainer" class="sign-b2e-user-party-container"></div>
	`
	};

	class DocumentTemplateUserParty {
		#app;
		#vueApp;
		#container;
		#userParty;
		#store;
		#api;
		constructor(store = null, preselectedSigners = null) {
			const b2eSignersLimitCount = this.#getB2eSignersCountLimit();
			const region = this.#getRegion();
			this.#store = store;
			this.#userParty = new sign_v2_b2e_userParty.UserParty({
				mode: 'edit',
				b2eSignersLimitCount,
				region,
				preselectedSigners
			});
			this.#api = new sign_v2_api.Api();
		}
		#createApp(container) {
			this.#app = ui_vue3.BitrixVue.createApp(UserPartyApp, {
				userParty: this.#userParty,
				region: this.#getRegion()
			});
			this.#app.use(this.#store);
			this.#vueApp = this.#app.mount(container);
		}
		async syncMembers() {
			const documentStore = sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore();
			const storeDocuments = documentStore.createdDocuments;
			const ids = storeDocuments.map(value => value.document.id);
			const {
				shouldCheckDepartmentsSync,
				documents
			} = await this.#api.template.setupSigners(ids, this.#userParty.getEntities(), this.#userParty.isRejectExcludedEnabled());
			this.#updatePartiesCountInStore(documents); // can rid of this if make syncDepartmentForSigners method
			if (shouldCheckDepartmentsSync) {
				await this.#waitForDepartmentSync();
			}
		}
		#updatePartiesCountInStore(documents) {
			sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore().createdDocuments.forEach(templateCreatedDocument => {
				const storeDocument = templateCreatedDocument.document;
				const id = storeDocument.id;
				const document = documents.find(value => value.id === id);
				if (!document) {
					throw new Error('Created document not found in update parties documents');
				}
				storeDocument.parties = document.parties;
			});
		}
		async #waitForDepartmentSync() {
			const createdDocuments = sign_v2_b2e_signSettingsTemplates.useDocumentTemplateFillingStore().createdDocuments;
			const syncMemberPromises = createdDocuments.map(value => this.#syncMembersWithDepartments(value.document.uid, value.document.parties));
			await Promise.all(syncMemberPromises);
		}
		async #syncMembersWithDepartments(uid, signerParty) {
			let syncFinished = false;
			while (!syncFinished) {
				// eslint-disable-next-line no-await-in-loop
				const response = await this.#api.syncB2eMembersWithDepartments(uid, signerParty, this.#userParty.isRejectExcludedEnabled());
				syncFinished = response.syncFinished;
				// eslint-disable-next-line no-await-in-loop
				await this.#sleep(1000);
			}
		}
		#sleep(ms) {
			return new Promise(resolve => {
				setTimeout(resolve, ms);
			});
		}
		getLayout() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = BX.Tag.render`<div></div>`;
			this.#createApp(this.#container);
			return this.#container;
		}
		validate() {
			if (!this.#userParty.validate()) {
				return false;
			}
			const limit = this.#getB2eSignersCountLimit();
			if (limit > 0 && this.#userParty.getUniqueUsersCount() > limit) {
				top.BX.UI.InfoHelper.show('limit_office_e_signature');
				return false;
			}
			return true;
		}
		#getB2eSignersCountLimit() {
			return main_core.Extension.getSettings('sign.v2.b2e.document-template-user-party').get('signersLimitCount');
		}
		#getRegion() {
			return main_core.Extension.getSettings('sign.v2.b2e.document-template-user-party').get('region');
		}
		unmount() {
			this.closeCounterGuide();
			this.#app?.unmount();
		}
		closeCounterGuide() {
			this.#userParty.closeCounterGuide();
		}
		isRejectExcludedEnabled() {
			return this.#userParty.isRejectExcludedEnabled();
		}
	}

	exports.DocumentTemplateUserParty = DocumentTemplateUserParty;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Sign.V2, BX.Vue3, BX.Sign.V2.B2e, BX.Sign.V2.B2e);
//# sourceMappingURL=document-template-user-party.bundle.js.map
