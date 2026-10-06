/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, sign_v2_b2e_representativeSelector, sign_type, sign_v2_helper) {
	'use strict';

	const HelpdeskCodes = Object.freeze({
		EditorRoleDetails: '19740766'
	});
	const currentUserId = main_core.Extension.getSettings('sign.v2.b2e.document-validation').get('currentUserId');
	const maxReviewersCount = 20;
	class DocumentValidation {
		#reviewerRepresentativeSelectorList;
		#isTemplate;
		#onReviewerDelete = null;
		constructor(isTemplate = false, onReviewerDelete = null) {
			this.#isTemplate = isTemplate;
			this.#reviewerRepresentativeSelectorList = [];
			this.#onReviewerDelete = onReviewerDelete;
			this.addReviewerRepresentativeSelector();
			this.editorRepresentativeSelector = new sign_v2_b2e_representativeSelector.RepresentativeSelector({
				context: `sign_b2e_representative_selector_editor_${currentUserId}`,
				description: `
				<span>
					${sign_v2_helper.Helpdesk.replaceLink(main_core.Loc.getMessage('SIGN_B2E_DOCUMENT_VALIDATION_HINT_EDITOR'), HelpdeskCodes.EditorRoleDetails)}
				</span>
			`,
				roleEnabled: isTemplate
			});
		}
		addReviewerRepresentativeSelector() {
			if (this.getReviewerRepresentativeSelectorCount() >= maxReviewersCount) {
				return null;
			}
			const excludedEntityList = this.#getSelectedReviewerEntityList();
			const selector = new sign_v2_b2e_representativeSelector.RepresentativeSelector({
				cacheable: false,
				context: `sign_b2e_representative_selector_reviewer_${currentUserId}`,
				roleEnabled: this.#isTemplate,
				isDescriptionVisible: false,
				isMenuButtonVisible: Object.keys(this.#reviewerRepresentativeSelectorList).length > 0,
				onDelete: elementId => this.#onDeleteCallback(elementId),
				onHide: () => this.#setExcludedIdListForRepresentativeReviewerList(),
				excludedEntityList
			});
			selector.formatSelectButton('ui-btn-xs ui-btn-round ui-btn-light-border');
			this.#reviewerRepresentativeSelectorList[selector.getContainerId()] = selector;
			return main_core.Tag.render`
			<div class="sign_b2e_representative_selector_reviewer">
				${selector.getLayout()}
			</div>
		`;
		}
		#onDeleteCallback(elementId) {
			if (!Object.hasOwn(this.#reviewerRepresentativeSelectorList, elementId)) {
				return;
			}
			delete this.#reviewerRepresentativeSelectorList[elementId];
			this.#setExcludedIdListForRepresentativeReviewerList();
			this.#onReviewerDelete(elementId);
		}
		#setExcludedIdListForRepresentativeReviewerList() {
			const excludedEntityList = this.#getSelectedReviewerEntityList();
			for (const representativeSelector of Object.values(this.#reviewerRepresentativeSelectorList)) {
				const excludedEntityListWithoutSelected = excludedEntityList.filter(entity => !(entity.entityId === representativeSelector.getRepresentativeId() && entity.entityType === representativeSelector.getRepresentativeItemType()));
				representativeSelector.setExcludedEntityList(excludedEntityListWithoutSelected);
			}
		}
		getReviewerLayoutList() {
			const result = main_core.Tag.render`<span></span>`;
			for (const representativeSelector of Object.values(this.#reviewerRepresentativeSelectorList)) {
				const representativeLayout = representativeSelector.getLayout();
				const block = main_core.Tag.render`
				<div class="sign_b2e_representative_selector_reviewer">
					${representativeLayout}
				</div>
			`;
				main_core.Dom.append(block, result);
			}
			return result;
		}
		getEditorLayout() {
			const representativeLayout = this.editorRepresentativeSelector.getLayout();
			this.editorRepresentativeSelector.formatSelectButton('ui-btn-xs ui-btn-round ui-btn-light-border');
			return main_core.Tag.render`
			<div>
				${representativeLayout}
			</div>
		`;
		}
		getValidationData() {
			const validationData = this.#getSelectedReviewerEntityList();
			const editorId = this.editorRepresentativeSelector.getRepresentativeId();
			const editorType = this.editorRepresentativeSelector.getRepresentativeItemType();
			if (editorId && editorType) {
				validationData.push({
					entityId: editorId,
					entityType: editorType,
					role: sign_type.MemberRole.editor
				});
			}
			return validationData;
		}
		#getSelectedReviewerEntityList() {
			const result = [];
			for (const representativeSelector of Object.values(this.#reviewerRepresentativeSelectorList)) {
				const reviewerId = representativeSelector.getRepresentativeId();
				if (!reviewerId) {
					continue;
				}
				const reviewerType = representativeSelector.getRepresentativeItemType();
				if (!reviewerType) {
					continue;
				}
				result.push({
					entityId: reviewerId,
					entityType: reviewerType,
					role: sign_type.MemberRole.reviewer
				});
			}
			return result;
		}
		loadReviewers(reviewerList) {
			if (reviewerList.length === 0) {
				return;
			}
			if (reviewerList.length > this.getReviewerRepresentativeSelectorCount()) {
				for (let i = 1; i < reviewerList.length; i++) {
					this.addReviewerRepresentativeSelector();
				}
			}
			let selectorIndex = 0;
			for (const representativeSelector of Object.values(this.#reviewerRepresentativeSelectorList)) {
				const reviewer = reviewerList[selectorIndex] ?? null;
				if (reviewer === null) {
					continue;
				}
				representativeSelector.load(reviewer.entityId, reviewer.entityType);
				selectorIndex++;
			}
			this.#setExcludedIdListForRepresentativeReviewerList();
		}
		loadEditors(editorList) {
			if (editorList.length === 0) {
				return;
			}
			const editor = editorList[0];
			this.editorRepresentativeSelector.load(editor.entityId, editor.entityType);
		}
		getReviewerRepresentativeSelectorCount() {
			return Object.keys(this.#reviewerRepresentativeSelectorList).length;
		}
	}

	exports.DocumentValidation = DocumentValidation;
	exports.maxReviewersCount = maxReviewersCount;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.Sign.V2.B2e, BX.Sign, BX.Sign.V2);
