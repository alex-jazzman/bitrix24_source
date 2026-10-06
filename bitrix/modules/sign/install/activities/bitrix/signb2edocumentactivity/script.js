/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, sign_v2_api) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Sign');
	const roles = {
		HEAD: '1',
		DEPUTY_HEAD: '3'
	};
	const responsibleSelector = '#id_responsible';
	const assigneeSelector = '#id_representative';
	const reviewerSelector = '#id_reviewer';
	const editorSelector = '#id_editor';
	const createdTemplateUidSliderDataKey = 'signB2eDocumentActivityCreatedTemplateUid';
	class SignB2EDocumentActivity extends main_core_events.EventEmitter {
		#buttonNode = null;
		#select = null;
		#documentType = [];
		#formName;
		#api;
		#templateId;
		#previousData = {};
		#initialListWasEmpty = null;
		#initialTemplateListPromise = null;
		#firstTemplateApplyInProgress = false;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Sign.SignB2EDocumentActivity');
			this.#buttonNode = options.buttonNode;
			this.#documentType = options.documentType;
			this.#select = options.select;
			this.#api = new sign_v2_api.Api();
			this.#templateId = options.templateId;
			if (!main_core.Type.isStringFilled(options.formName)) {
				throw new Error('formName must be filled string');
			}
			this.#formName = options.formName;
		}
		init() {
			this.#initialTemplateListPromise = this.#setTemplateList();
			if (!this.#buttonNode) {
				return;
			}
			main_core.Event.bind(this.#buttonNode, 'click', this.#openSlider.bind(this));
		}
		#openSlider() {
			BX.SidePanel.Instance.open('/sign/b2e/doc/0/?mode=template&IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER&FROM_ROBOT=1', {
				width: 1250,
				cacheable: false,
				events: {
					onClose: event => {
						this.#onSliderClose(event);
					}
				}
			});
		}
		async #onSliderClose(event) {
			const slider = event.getSlider();
			if (!slider) {
				return;
			}
			await this.#initialTemplateListPromise;
			if (this.#initialListWasEmpty !== true) {
				await this.#setTemplateList(true, true);
				return;
			}
			const templateUid = slider.getData().get(createdTemplateUidSliderDataKey);
			if (!main_core.Type.isStringFilled(templateUid) || this.#firstTemplateApplyInProgress) {
				return;
			}
			this.#firstTemplateApplyInProgress = true;
			try {
				if (await this.#applyCreatedFirstTemplate(templateUid)) {
					this.#initialListWasEmpty = false;
				}
			} finally {
				this.#firstTemplateApplyInProgress = false;
			}
		}
		#setTemplateList(needUpdateTagSelectors = false, isSliderClose = false) {
			return this.#loadTemplatesList().then(async ({
				data
			}) => {
				const isEmptyList = main_core.Type.isArray(data) && data.length === 0;
				if (main_core.Type.isPlainObject(data) || isEmptyList) {
					const isTemplateListEmpty = Object.keys(data).length === 0;
					if (this.#initialListWasEmpty === null) {
						this.#initialListWasEmpty = isTemplateListEmpty;
					}
					if (!isEmptyList) {
						this.#updateTemplateListSelect(data, isSliderClose);
					}
					if (!isTemplateListEmpty) {
						Object.entries(this.#getUserSelectorsMap()).forEach(([key, selector]) => {
							const dialog = this.#getDialog(selector);
							if (dialog === null) {
								return;
							}
							dialog.subscribe('onLoad', () => {
								const templateId = this.#templateId === '' ? 0 : this.#templateId;
								const defaultUserId = Object.values(data)[templateId]?.[`${key}SelectorValue`];
								if (defaultUserId) {
									this.#setSelectorValues([defaultUserId], selector);
								}
							});
							dialog.load();
						});
					}
					if (needUpdateTagSelectors === true) {
						this.#updateTagSelectors(data);
					}
					this.#select.onchange = () => {
						this.#updateTagSelectors(data);
					};
				}
			}).catch(response => console.error(response.errors));
		}
		async #applyCreatedFirstTemplate(templateUid) {
			try {
				const {
					data
				} = await this.#loadTemplatesList();
				if (!main_core.Type.isPlainObject(data) || !main_core.Type.isPlainObject(data[templateUid])) {
					return false;
				}
				const selectedItem = data[templateUid];
				this.#setPreselectedUserItems(selectedItem);
				await this.#waitForUserSelectors();
				await this.#loadMissingUserItems(selectedItem);
				this.#templateId = templateUid;
				this.#updateTemplateListSelect(data, false);
				if (!this.#selectMembers(selectedItem, false)) {
					throw new Error('Unable to select template members');
				}
				this.#select.onchange = () => {
					this.#updateTagSelectors(data);
				};
				return true;
			} catch (response) {
				console.error(response?.errors ?? response);
				return false;
			}
		}
		#setPreselectedUserItems(selectedItem) {
			const selectorValuesMap = {
				[responsibleSelector]: [selectedItem.responsibleSelectorValue],
				[assigneeSelector]: [selectedItem.assigneeSelectorValue],
				[reviewerSelector]: selectedItem.reviewerSelectorValue,
				[editorSelector]: [selectedItem.editorSelectorValue]
			};
			Object.entries(selectorValuesMap).forEach(([selector, selectorValues]) => {
				const dialog = this.#getDialog(selector);
				if (dialog === null) {
					return;
				}
				const values = main_core.Type.isArray(selectorValues) ? selectorValues : [selectorValues];
				const preselectedItems = values.filter(value => roles[value] === undefined && main_core.Type.isInteger(Number(value)) && Number(value) > 0).map(value => ['user', value]);
				if (preselectedItems.length > 0) {
					dialog.setPreselectedItems(preselectedItems);
				}
			});
		}
		async #loadMissingUserItems(selectedItem) {
			const selectorValuesMap = {
				[responsibleSelector]: [selectedItem.responsibleSelectorValue],
				[assigneeSelector]: [selectedItem.assigneeSelectorValue],
				[reviewerSelector]: selectedItem.reviewerSelectorValue,
				[editorSelector]: [selectedItem.editorSelectorValue]
			};
			const promises = Object.entries(selectorValuesMap).map(async ([selector, selectorValues]) => {
				const dialog = this.#getDialog(selector);
				if (dialog === null) {
					return;
				}
				const values = main_core.Type.isArray(selectorValues) ? selectorValues : [selectorValues];
				const missingUserIds = values.filter(value => roles[value] === undefined && main_core.Type.isInteger(Number(value)) && Number(value) > 0 && dialog.getItem(['user', value]) === null);
				if (missingUserIds.length === 0) {
					return;
				}
				const response = await main_core.ajax.runAction('ui.entityselector.load', {
					json: {
						dialog: {
							...dialog.getAjaxJson(),
							preselectedItems: missingUserIds.map(userId => ['user', userId])
						}
					},
					getParameters: {
						context: dialog.getContext()
					}
				});
				if (!main_core.Type.isPlainObject(response?.data?.dialog)) {
					throw new Error('Unable to load user selector items');
				}
				dialog.setOptions(response.data.dialog);
			});
			await Promise.all(promises);
		}
		async #waitForUserSelectors() {
			const promises = Object.values(this.#getUserSelectorsMap()).map(selector => {
				const dialog = this.#getDialog(selector);
				if (dialog === null || dialog.isLoaded() || !dialog.hasDynamicLoad()) {
					return Promise.resolve();
				}
				return new Promise((resolve, reject) => {
					const unsubscribe = () => {
						dialog.unsubscribe('onLoad', handleLoad);
						dialog.unsubscribe('onLoadError', handleLoadError);
					};
					const handleLoad = () => {
						unsubscribe();
						resolve();
					};
					const handleLoadError = event => {
						unsubscribe();
						reject(event.getData().error);
					};
					dialog.subscribe('onLoad', handleLoad);
					dialog.subscribe('onLoadError', handleLoadError);
					dialog.load();
				});
			});
			await Promise.all(promises);
		}
		#setSelectorValues(selectorValues, selector, clearSelectedItems = true) {
			const values = (main_core.Type.isArray(selectorValues) ? selectorValues : []).filter(value => roles[value] !== undefined || main_core.Type.isInteger(Number(value)) && Number(value) > 0);
			const dialog = this.#getDialog(selector);
			if (dialog === null) {
				return values.length === 0;
			}
			if (clearSelectedItems) {
				dialog.getSelectedItems().forEach(item => {
					item.deselect();
				});
			}
			let allItemsSelected = true;
			values.forEach(value => {
				let item = null;
				const roleId = roles[value];
				if (roleId !== undefined) {
					item = dialog.getItem([roleId, value]);
				} else if (main_core.Type.isInteger(Number(value))) {
					item = dialog.getItem(['user', value]);
				}
				if (item && !item.isSelected()) {
					item.select();
				}
				allItemsSelected = allItemsSelected && item?.isSelected() === true;
			});
			return allItemsSelected;
		}
		#getUserSelectorsMap() {
			return {
				responsible: responsibleSelector,
				assignee: assigneeSelector,
				reviewer: reviewerSelector,
				editor: editorSelector
			};
		}
		#getDialog(selector) {
			const userSelector = this.#getUserSelector(selector);
			if (!userSelector) {
				return null;
			}
			return userSelector.tagSelector.getDialog();
		}
		#getUserSelector(selector) {
			return BX.Bizproc.UserSelector.getByNode(document.querySelector(selector));
		}
		#updateTemplateListSelect(data, isSliderClose) {
			if (this.#previousData && isSliderClose) {
				const previousFirstTemplateId = Object.keys(this.#previousData)[0];
				const currentFirstTemplateId = Object.keys(data)[0];
				if (previousFirstTemplateId !== currentFirstTemplateId) {
					this.#templateId = currentFirstTemplateId;
				}
			}
			if (this.#select) {
				this.#select.innerHTML = '';
			}
			Object.entries(data).forEach(([id, {
				title
			}]) => {
				const selected = this.#templateId === id ? 'selected' : '';
				const idValue = main_core.Text.encode(id);
				const titleValue = main_core.Text.encode(title);
				const option = main_core.Tag.render`<option value="${idValue}" ${selected}>${titleValue}</option>`;
				main_core.Dom.append(option, this.#select);
			});
			this.#previousData = {
				...data
			};
		}
		#updateTagSelectors(data) {
			const selectedId = this.#select.value;
			if (!(selectedId in data)) {
				return;
			}
			const selectedItem = data[selectedId];
			if (selectedItem) {
				this.#selectMembers(selectedItem);
			}
		}
		#selectMembers(selectedItem, clearSelectedItems = true) {
			if (!selectedItem) {
				return false;
			}
			return [this.#setSelectorValues([selectedItem.responsibleSelectorValue], responsibleSelector, clearSelectedItems), this.#setSelectorValues([selectedItem.assigneeSelectorValue], assigneeSelector, clearSelectedItems), this.#setSelectorValues(selectedItem.reviewerSelectorValue, reviewerSelector, clearSelectedItems), this.#setSelectorValues([selectedItem.editorSelectorValue], editorSelector, clearSelectedItems)].every(isSelected => isSelected);
		}
		#loadTemplatesList() {
			return main_core.ajax.runAction('bizproc.activity.request', {
				data: {
					activity: 'SignB2EDocumentActivity',
					documentType: this.#documentType,
					params: {
						form_name: this.#formName
					}
				}
			});
		}
	}
	namespace.SignB2EDocumentActivity = SignB2EDocumentActivity;

	exports.SignB2EDocumentActivity = SignB2EDocumentActivity;

})(this.BX.Sign = this.BX.Sign || {}, BX, BX.Event, BX.Sign.V2);
//# sourceMappingURL=script.js.map
