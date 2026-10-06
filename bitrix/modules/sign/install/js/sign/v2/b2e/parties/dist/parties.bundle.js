/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_core_events, sign_v2_b2e_companySelector, sign_v2_b2e_documentValidation, sign_v2_b2e_representativeSelector, sign_type, sign_v2_helper, sign_v2_signSettings) {
	'use strict';

	const blockWarningClass = 'sign-document-b2e-parties__item_content--warning';
	const currentUserId = main_core.Extension.getSettings('sign.v2.b2e.parties').get('currentUserId');
	const reviewerSelectorContainerListId = 'reviewer-selector-list-container';
	const HelpdeskCodes = Object.freeze({
		ReviewerRoleDetails: '20801214'
	});
	class Parties extends main_core_events.EventEmitter {
		#companySelector = null;
		#representativeSelector = null;
		#documentValidation = null;
		#addReviewerButton = null;
		#ui = {
			container: HTMLDivElement = null,
			blocks: {
				companyContent: HTMLDivElement = null,
				representativeContent: HTMLDivElement = null,
				validationEditorLayout: HTMLDivElement = null
			}
		};
		constructor(blankSelectorConfig, hcmLinkAvailable) {
			super();
			this.setEventNamespace('BX.Sign.V2.B2e.Parties');
			const {
				region,
				documentInitiatedType,
				documentMode
			} = blankSelectorConfig;
			const isTemplate = sign_v2_signSettings.isTemplateMode(documentMode || sign_type.DocumentMode.document);
			this.#representativeSelector = new sign_v2_b2e_representativeSelector.RepresentativeSelector({
				roleEnabled: isTemplate,
				context: `sign_b2e_representative_selector_assignee_${currentUserId}`
			});
			this.#companySelector = new sign_v2_b2e_companySelector.CompanySelector({
				region,
				documentInitiatedType,
				isHcmLinkAvailable: hcmLinkAvailable,
				needOpenCrmSaveAndEditCompanySliders: isTemplate
			});
			this.#companySelector.subscribe('onSelect', event => {
				this.emit('onCompanySelect', event);
			});
			this.#companySelector.subscribe('onProviderSelect', event => {
				this.emit('onProviderSelect', event);
			});
			this.#documentValidation = new sign_v2_b2e_documentValidation.DocumentValidation(isTemplate, () => this.#checkAddReviewerLimit());
		}
		setEntityId(entityId) {
			this.#companySelector.setOptions({
				entityId
			});
		}
		setInitiatedByType(initiatedByType) {
			this.#companySelector.setInitiatedByType(initiatedByType);
		}
		async reloadCompanyProviders(selectFirst) {
			await this.#companySelector.reloadCompanyProviders(selectFirst);
		}
		setEditorAvailability(isAvailable) {
			if (isAvailable) {
				this.#addEditorLayout();
				return;
			}
			this.#removeEditorLayout();
			this.#documentValidation.editorRepresentativeSelector.onSelectorItemDeselectedHandler();
		}
		loadCompany(companyUid, entityId) {
			this.#companySelector.load(companyUid, entityId);
		}
		loadFirstCompany() {
			this.#companySelector.loadFirstCompany();
		}
		loadRepresentative(representativeId, entityType = sign_type.EntityType.USER) {
			this.#representativeSelector.load(representativeId, entityType);
		}
		loadFirstRepresentative() {
			this.#representativeSelector.loadFistRepresentative();
		}
		loadValidator(members) {
			const reviewers = members.filter(member => member.role === sign_type.MemberRole.reviewer);
			this.#documentValidation.loadReviewers(reviewers);
			const editors = members.filter(member => member.role === sign_type.MemberRole.editor);
			this.#documentValidation.loadEditors(editors);
		}
		getLayout() {
			this.#ui.blocks.companyContent = main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					<span>${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_COMPANY')}</span>
					<span
						data-hint="${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_COMPANY_HINT')}"
					></span>
				</p>
				${this.#companySelector.getLayout()}
			</div>
		`;
			sign_v2_helper.Hint.create(this.#ui.blocks.companyContent);
			this.#ui.blocks.representativeContent = main_core.Tag.render`
			<div class="sign-b2e-settings__item --representative">
				<p class="sign-b2e-settings__item_title">
					${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_REPRESENTATIVE')}
				</p>
				${this.#representativeSelector.getLayout()}
			</div>
		`;
			const providerLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_PROVIDER')}
				</p>
				${this.#companySelector.getProviderLayout()}
			</div>
		`;
			const validationReviewerLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item --reviewer">
				<p class="sign-b2e-settings__item_title">
					${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_VALIDATION_REVIEWER')}
				</p>
				<div id="${reviewerSelectorContainerListId}">
					${this.#documentValidation.getReviewerLayoutList()}
				</div>
				${this.#createAddReviewerButton()}
				<p class="sign-wizard__notice">
				${sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_PARTIES_ADD_REVIEWER_BUTTON_HINT', {
			'#LIMIT#': sign_v2_b2e_documentValidation.maxReviewersCount
		}), HelpdeskCodes.ReviewerRoleDetails)}
				</p>
			</div>
		`;
			this.#ui.blocks.validationEditorLayout = main_core.Tag.render`
			<div class="sign-b2e-settings__item --editor">
				<p class="sign-b2e-settings__item_title">
					${main_core.Loc.getMessage('SIGN_PARTIES_ITEM_VALIDATION_EDITOR')}
				</p>
				${this.#documentValidation.getEditorLayout()}
			</div>
		`;
			this.#ui.container = main_core.Tag.render`
			<div>
				<h1 class="sign-b2e-settings__header">${main_core.Loc.getMessage('SIGN_PARTIES_HEADER')}</h1>
				${this.#ui.blocks.companyContent}
				${providerLayout}
				${this.#ui.blocks.representativeContent}
				${validationReviewerLayout}
				${this.#ui.blocks.validationEditorLayout}
			</div>
		`;
			return this.#ui.container;
		}
		#createAddReviewerButton() {
			this.#addReviewerButton = main_core.Tag.render`
			<button type="button" class="sign-b2e-document-setup__add-button">
				<span class="sign-b2e-document-setup__add-button_text">
					${main_core.Loc.getMessage('SIGN_PARTIES_ADD_REVIEWER_BUTTON_TITLE')}
				</span>
				<span class="sign-b2e-document-setup__add-button_disabled_hint" data-hint="${main_core.Loc.getMessage('SIGN_PARTIES_ADD_REVIEWER_BUTTON_DISABLED_HINT', {
			'#LIMIT#': sign_v2_b2e_documentValidation.maxReviewersCount
		})}"></span>
			</button>
		`;
			sign_v2_helper.Hint.create(this.#addReviewerButton);
			BX.bind(this.#addReviewerButton, 'click', () => {
				const container = document.getElementById(reviewerSelectorContainerListId);
				if (container === null) {
					return;
				}
				const selector = this.#documentValidation.addReviewerRepresentativeSelector();
				main_core.Dom.append(selector, container);
				this.#checkAddReviewerLimit();
			});
			this.#checkAddReviewerLimit();
			return this.#addReviewerButton;
		}
		#checkAddReviewerLimit() {
			if (this.#addReviewerButton === null) {
				return;
			}
			this.#addReviewerButton.disabled = this.#documentValidation.getReviewerRepresentativeSelectorCount() >= sign_v2_b2e_documentValidation.maxReviewersCount;
		}
		#validate() {
			return this.#companySelector.validate() && this.#representativeSelector.validate();
		}
		async save(documentId) {
			this.#removeWarningFromBlocks();
			if (!this.#validate()) {
				throw new Error('Validation failed');
			}
			try {
				await this.#companySelector.save(documentId);
			} catch (e) {
				this.#setWarning(this.#ui.blocks.companyContent);
				throw e;
			}
		}
		getSelectedProvider() {
			return this.#companySelector.getSelectedCompanyProvider();
		}
		isProviderSelected() {
			return Boolean(this.#companySelector.getSelectedCompanyProvider());
		}
		isRepresentativeSelected() {
			return Boolean(this.#representativeSelector.getRepresentativeId());
		}
		getParties() {
			return {
				representative: {
					entityType: this.#representativeSelector.getRepresentativeItemType(),
					entityId: this.#representativeSelector.getRepresentativeId()
				},
				company: {
					entityType: 'company',
					entityId: this.#companySelector.getCompanyId()
				},
				validation: this.#documentValidation.getValidationData()
			};
		}
		getSelectedCompanyId() {
			return this.#companySelector.getCompanyId();
		}
		#setWarning(block) {
			if (main_core.Type.isNull(block) || main_core.Type.isUndefined(block)) {
				return;
			}
			main_core.Dom.addClass(block, blockWarningClass);
		}
		#removeWarningFromBlocks() {
			for (const [key, block] of Object.entries(this.#ui.blocks)) {
				if (main_core.Type.isNull(block)) {
					return;
				}
				main_core.Dom.removeClass(block, blockWarningClass);
			}
		}
		#addEditorLayout() {
			main_core.Dom.append(this.#ui.blocks.validationEditorLayout, this.#ui.container);
		}
		#removeEditorLayout() {
			main_core.Dom.remove(this.#ui.blocks.validationEditorLayout);
		}
	}

	exports.Parties = Parties;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Event, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign.V2.B2e, BX.Sign, BX.Sign.V2, BX.Sign.V2);
//# sourceMappingURL=parties.bundle.js.map
