/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.AutomatedSolution = this.BX.Crm.AutomatedSolution || {};
(function (exports, crm_router, main_core, ui_vue3, ui_vue3_vuex, crm_integration_analytics, main_core_events, ui_analytics, ui_dialogs_messagebox, ui_entitySelector, crm_toolbarComponent, ui_infoHelper) {
	'use strict';

	function createSaveAnalyticsBuilder(store) {
		const builder = store.getters.isNew ? new crm_integration_analytics.Builder.Automation.AutomatedSolution.CreateEvent() : new crm_integration_analytics.Builder.Automation.AutomatedSolution.EditEvent();
		return builder.setId(store.state.automatedSolution.id).setTypeIds(store.state.automatedSolution.typeIds);
	}

	const Card = {
		props: {
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				required: true
			}
		},
		data() {
			return {
				isShown: true
			};
		},
		template: `
		<div v-if="isShown" class="crm-type-ui-card crm-type-ui-card-message">
			<div class="crm-type-ui-card-header">
				<div class="crm-type-ui-card-message-icon crm-type-ui-card-message-icon--custom-fields"></div>
				<div class="crm-type-ui-card-message-title">{{ title }}</div>
			</div>
			<div class="crm-type-ui-card-body">
				<div class="crm-type-ui-card-message-description">{{ description }}</div>
			</div>
			<div 
				class="crm-type-ui-card-message-close-button" 
				:title="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_CARD_CLOSE_TITLE')"
				@click="isShown = false"
			></div>
		</div>
	`
	};

	const CommonTab = {
		components: {
			Card
		},
		computed: {
			title: {
				get() {
					return this.$store.state.automatedSolution.title;
				},
				set(title) {
					this.$store.dispatch('setTitle', title);
				}
			}
		},
		template: `
		<div data-tab="common">
			<div class="ui-title-3">{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TITLE_COMMON') }}</div>
			<Card
				:title="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_CARD_COMMON_TITLE')"
				:description="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_CARD_COMMON_DESCRIPTION')"
			/>
			<div class="ui-form-row crm-automated-solution-details-form-label-xs">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_TITLE') }}</div>
				</div>
				<div class="ui-form-content">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							v-model="title"
							type="text"
							class="ui-ctl-element"
							:placeholder="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_PLACEHOLDER_TITLE')"
						/>
					</div>
				</div>
			</div>
		</div>
	`
	};

	const TypesTab = {
		components: {
			Card
		},
		// tag selector should not be reactive (recreated on store mutations)
		boundTypesTagSelector: null,
		externalTypesTagSelector: null,
		crmTypesTagSelector: null,
		computed: {
			isShowPermissionsResetAlert() {
				if (!this.$store.state.isPermissionsLayoutV2Enabled) {
					return false;
				}
				const currentTypeIds = [...this.$store.state.automatedSolution.typeIds];
				const originallyTypeIds = [...this.$store.state.automatedSolutionOrigTypeIds];
				return currentTypeIds.some(id => !originallyTypeIds.includes(id)) || originallyTypeIds.some(id => !currentTypeIds.includes(id));
			}
		},
		mounted() {
			this.boundTypesTagSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				showAddButton: false,
				showCreateButton: true,
				// all preselected items go to this selector
				items: this.$store.state.automatedSolution.typeIds.map(typeId => {
					return {
						id: typeId,
						entityId: 'dynamic_type',
						title: this.$store.state.dynamicTypesTitles[typeId]
					};
				}),
				events: {
					onCreateButtonClick: this.handleCreateTypeClick,
					onTagRemove: this.removeTypeIdByTagRemoveEvent
				}
			});
			this.boundTypesTagSelector.renderTo(this.$refs.boundTypesTagSelectorContainer);

			// these selectors contain types only if there were added here in the app lifetime by user interaction
			// selector states are not synced reactively in the app lifetime
			this.crmTypesTagSelector = this.initFilteredTagSelector(true, false, !this.$store.state.permissions.canMoveSmartProcessFromCrm);
			this.crmTypesTagSelector.renderTo(this.$refs.crmTypesTagSelectorContainer);
			this.externalTypesTagSelector = this.initFilteredTagSelector(false, true, !this.$store.state.permissions.canMoveSmartProcessFromAnotherAutomatedSolution);
			this.externalTypesTagSelector.renderTo(this.$refs.externalTypesTagSelectorContainer);
		},
		methods: {
			initFilteredTagSelector(isOnlyCrmTypes, isOnlyExternalTypes, locked) {
				const tagSlector = new ui_entitySelector.TagSelector({
					multiple: true,
					addButtonCaption: this.$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_TAG_SELECTOR_ADD_BUTTON_CAPTION'),
					addButtonCaptionMore: this.$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_TAG_SELECTOR_ADD_BUTTON_CAPTION'),
					dialogOptions: {
						height: 200,
						enableSearch: true,
						context: 'crm.automated_solutions.details',
						dropdownMode: true,
						showAvatars: false,
						entities: [{
							id: 'dynamic_type',
							dynamicLoad: true,
							dynamicSearch: true,
							options: {
								showAutomatedSolutionBadge: true,
								isOnlyExternalTypes,
								isOnlyCrmTypes
							}
						}]
					},
					events: {
						onTagAdd: this.addTypeIdByTagAddEvent,
						onTagRemove: this.removeTypeIdIfNotContainsInBoundTypes
					}
				});
				if (locked) {
					tagSlector.setLocked(true);
				}
				return tagSlector;
			},
			addTypeIdByTagAddEvent(event) {
				const {
					tag
				} = event.getData();
				this.$store.dispatch('addTypeId', tag.getId());
			},
			removeTypeIdByTagRemoveEvent(event) {
				const {
					tag
				} = event.getData();
				this.$store.dispatch('removeTypeId', tag.getId());
			},
			removeTypeIdIfNotContainsInBoundTypes(event) {
				const {
					tag
				} = event.getData();
				const boundSelectedTags = this.boundTypesTagSelector.getTags();
				const isTagContainsInBoundTags = boundSelectedTags.some(boundTag => boundTag.getId() === tag.getId());
				if (!isTagContainsInBoundTags) {
					this.removeTypeIdByTagRemoveEvent(event);
				}
			},
			handleCreateTypeClick() {
				if (this.$store.getters.isSaved) {
					this.openTypeCreationSlider();
					return;
				}
				ui_dialogs_messagebox.MessageBox.confirm(this.$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_MESSAGE'), messageBox => {
					return this.save().then(() => this.openTypeCreationSlider()).finally(() => messageBox.close());
				}, this.$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_YES_CAPTION'));
			},
			openTypeCreationSlider() {
				void crm_router.Router.Instance.openTypeDetail(0, null, {
					automatedSolutionId: this.$store.state.automatedSolution.id,
					activeTabId: 'common',
					isExternal: 'Y'
				}).then(() => {
					this.$Bitrix.Application.get().reloadWithNewUri(this.$store.state.automatedSolution.id, {
						activeTabId: 'types'
					});
				});
			},
			save() {
				const builder = createSaveAnalyticsBuilder(this.$store).setElement(crm_integration_analytics.Dictionary.ELEMENT_SAVE_IS_REQUIRED_TO_PROCEED_POPUP);
				return this.$store.dispatch('save').then(() => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).setId(this.$store.state.automatedSolution.id).buildData());
				}).catch(error => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).setId(this.$store.state.automatedSolution.id).buildData());
					throw error;
				});
			}
		},
		template: `
		<div>
			<div class="ui-title-3">{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TITLE_TYPES') }}</div>
			<Card
				:title="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_CARD_TYPES_TITLE')"
				:description="$Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_CARD_TYPES_DESCRIPTION')"
			/>
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_CREATE_TYPE') }}
					</div>
				</div>
				<div class="ui-form-content">
					<div ref="boundTypesTagSelectorContainer"></div>
				</div>
			</div>
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_CRM_TYPES') }}
					</div>
				</div>
				<div class="ui-form-content">
					<div ref="crmTypesTagSelectorContainer"></div>
				</div>
			</div>
			<div class="ui-form-row">
				<div class="ui-form-label">
					<div class="ui-ctl-label-text">
						{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_EXTERNAL_TYPES') }}
					</div>
				</div>
				<div class="ui-form-content">
					<div ref="externalTypesTagSelectorContainer"></div>
				</div>
			</div>
			<div v-if="isShowPermissionsResetAlert" class="ui-alert ui-alert-warning">
				<span class="ui-alert-message">
					{{ $Bitrix.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_PERMISSIONS_WILL_BE_RESET_ALERT') }}
				</span>
			</div>
		</div>
	`
	};

	const Main = {
		components: {
			CommonTab,
			TypesTab
		},
		props: {
			initialActiveTabId: String
		},
		data() {
			return {
				tabs: {
					// tab show flags
					common: this.initialActiveTabId === 'common',
					types: this.initialActiveTabId === 'types'
				},
				isCancelEventAlreadyRegistered: false
			};
		},
		computed: {
			allTabIds() {
				return Object.keys(this.tabs);
			},
			saveButton() {
				return document.getElementById('ui-button-panel-save');
			},
			cancelButton() {
				return document.getElementById('ui-button-panel-cancel');
			},
			deleteButton() {
				return document.getElementById('ui-button-panel-remove');
			},
			allButtons() {
				const buttons = [this.saveButton, this.cancelButton];
				if (this.deleteButton) {
					buttons.push(this.deleteButton);
				}
				return buttons;
			},
			slider() {
				return BX.SidePanel.Instance.getSliderByWindow(window);
			},
			errors() {
				return this.$store.state.errors;
			},
			hasErrors() {
				return main_core.Type.isArrayFilled(this.errors);
			},
			// eslint-disable-next-line max-len
			analyticsBuilder() {
				return createSaveAnalyticsBuilder(this.$store);
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:showTab', this.showTabFromEvent);
			main_core_events.EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:save', this.save);
			main_core_events.EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:delete', this.delete);
			main_core_events.EventEmitter.subscribe('BX.Crm.AutomatedSolution.Details:close', this.onCloseByCancelButton);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', this.onCloseByEsc);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.onClose);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:showTab', this.showTabFromEvent);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:save', this.save);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:delete', this.delete);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.AutomatedSolution.Details:close', this.onCloseByCancelButton);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', this.onCloseByEsc);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.onClose);
		},
		methods: {
			showTabFromEvent(event) {
				const {
					tabId
				} = event.getData();
				this.showTab(tabId);
			},
			showTab(tabId) {
				if (!this.allTabIds.includes(tabId)) {
					throw new Error('invalid tab id');
				}
				for (const id of this.allTabIds) {
					this.tabs[id] = false;
				}
				this.tabs[tabId] = true;
			},
			save() {
				const builder = this.analyticsBuilder.setElement(crm_integration_analytics.Dictionary.ELEMENT_CREATE_BUTTON);
				this.$store.dispatch('save').then(() => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).setId(this.$store.state.automatedSolution.id).buildData());

					// don't register cancel event when this slider closes
					this.isCancelEventAlreadyRegistered = true;
					this.$Bitrix.Application.get().closeSliderOrRedirect();
				}).catch(() => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).setId(this.$store.state.automatedSolution.id).buildData());
				}).finally(() => this.unlockButtons());
			},
			delete() {
				const builder = new crm_integration_analytics.Builder.Automation.AutomatedSolution.DeleteEvent().setId(this.$store.state.automatedSolution.id).setElement(crm_integration_analytics.Dictionary.ELEMENT_DELETE_BUTTON);

				// don't register cancel event when this slider closes.
				// we set this flag here because for some reason slider starts to close before the promise is resolved
				this.isCancelEventAlreadyRegistered = true;
				this.$store.dispatch('delete').then(() => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).buildData());
					this.$Bitrix.Application.get().closeSliderOrRedirect();
				}).catch(() => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).buildData());

					// errors will be displayed reactively

					// okay, may be the slider won't be closed after all since we've failed
					this.isCancelEventAlreadyRegistered = false;
				}).finally(() => this.unlockButtons());
			},
			onCloseByCancelButton() {
				if (this.isCancelEventAlreadyRegistered) {
					return;
				}
				this.isCancelEventAlreadyRegistered = true;
				ui_analytics.sendData(this.analyticsBuilder.setElement(crm_integration_analytics.Dictionary.ELEMENT_CANCEL_BUTTON).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
			},
			onCloseByEsc(event) {
				if (this.isCancelEventAlreadyRegistered) {
					return;
				}
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== this.slider) {
					return;
				}
				this.isCancelEventAlreadyRegistered = true;
				ui_analytics.sendData(this.analyticsBuilder.setElement(crm_integration_analytics.Dictionary.ELEMENT_ESC_BUTTON).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
			},
			onClose(event) {
				if (this.isCancelEventAlreadyRegistered) {
					return;
				}
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== this.slider) {
					return;
				}
				this.isCancelEventAlreadyRegistered = true;
				ui_analytics.sendData(this.analyticsBuilder.setElement(null).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
			},
			unlockButtons() {
				this.allButtons.forEach(button => {
					main_core.Dom.removeClass(button, 'ui-btn-wait');
				});
			},
			hideError(error) {
				this.$store.dispatch('removeError', error);
			}
		},
		template: `
		<div class="crm-automated-solution-details">
			<form class="ui-form">
				<div v-if="hasErrors" class="ui-alert ui-alert-danger">
					<template
						v-for="error in errors"
						:key="error.message"
					>
						<span class="ui-alert-message">{{error.message}}</span>
						<span class="ui-alert-close-btn" @click="hideError(error)"></span>
					</template>
				</div>
				<CommonTab v-show="tabs.common"/>
				<TypesTab v-show="tabs.types"/>
			</form>
		</div>
	`
	};

	function normalizeId(id) {
		if (main_core.Type.isNil(id)) {
			return null;
		}
		return main_core.Text.toInteger(id);
	}
	function normalizeDynamicTypesTitles(titles) {
		if (!main_core.Type.isPlainObject(titles)) {
			return {};
		}
		const result = {};
		for (const [key, value] of Object.entries(titles)) {
			if (main_core.Text.toInteger(key) > 0 && main_core.Type.isStringFilled(value)) {
				result[key] = value;
			}
		}
		return result;
	}
	function normalizeTitle(title) {
		if (main_core.Type.isNil(title)) {
			return null;
		}
		return String(title);
	}
	function normalizeTypesIds(typeIds) {
		if (!main_core.Type.isArrayFilled(typeIds)) {
			return [];
		}
		return typeIds.map(x => normalizeTypeId(x)).filter(x => x > 0);
	}
	function normalizeTypeId(typeId) {
		return main_core.Text.toInteger(typeId);
	}
	function normalizeErrors(errors) {
		if (!main_core.Type.isArrayFilled(errors)) {
			return [];
		}
		return errors.filter(x => isValidError(x));
	}
	function isValidError(error) {
		return main_core.Type.isStringFilled(error.message) && (main_core.Type.isNil(error.code) || main_core.Type.isStringFilled(error.code) || main_core.Type.isInteger(error.code)) && (main_core.Type.isNil(error.customData) || main_core.Type.isPlainObject(error.customData));
	}

	var actions = {
		setState: (store, stateToSet) => {
			store.commit('setState', stateToSet);
		},
		setErrors: (store, errors) => {
			store.commit('setErrors', errors);
		},
		removeError: (store, error) => {
			store.commit('removeError', error);
		},
		setTitle: (store, title) => {
			store.commit('setTitle', title);
		},
		addTypeId: (store, typeId) => {
			store.commit('addTypeId', typeId);
		},
		removeTypeId: (store, typeId) => {
			store.commit('removeTypeId', typeId);
		},
		save: store => {
			let savePromise = null;
			const fields = main_core.Runtime.clone(store.state.automatedSolution);
			if (fields.typeIds.length <= 0) {
				// we cant send an empty array in form data
				fields.typeIds = false;
			}
			if (store.getters.isNew) {
				savePromise = runAjaxAction('crm.automatedsolution.add', {
					data: {
						fields
					}
				});
			} else {
				savePromise = runAjaxAction('crm.automatedsolution.update', {
					data: {
						id: store.state.automatedSolution.id,
						fields
					}
				});
			}
			return savePromise.then(({
				data
			}) => {
				store.dispatch('setState', {
					automatedSolution: data.automatedSolution
				});
				emitUpdateEventToOutsideWorld(data.automatedSolution);
			}).catch(response => {
				// eslint-disable-next-line no-console
				console.warn('could not save automated solution', {
					response,
					state: main_core.Runtime.clone(store.state)
				});
				const {
					errors
				} = response;
				let wasErrorHandled = false;
				for (const error of errors) {
					if (main_core.Type.isStringFilled(error.customData?.sliderCode)) {
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							code: error.customData.sliderCode
						}).show();
						wasErrorHandled = true;
					}
				}
				if (!wasErrorHandled) {
					// to show errors in ui
					store.dispatch('setErrors', errors);
				}
				throw errors;
			});
		},
		delete: store => {
			return runAjaxAction('crm.automatedsolution.delete', {
				data: {
					id: store.state.automatedSolution.id
				}
			}).then(() => {
				store.dispatch('setState', {});
				emitUpdateEventToOutsideWorld({
					id: store.state.automatedSolution.id
				});
			}).catch(response => {
				// eslint-disable-next-line no-console
				console.warn('could not delete automated solution', {
					response,
					state: main_core.Runtime.clone(store.state)
				});
				const {
					errors
				} = response;
				for (const error of errors) {
					if (main_core.Type.isStringFilled(error.customData?.sliderCode)) {
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							code: error.customData.sliderCode
						}).show();
					}
				}
				store.dispatch('setErrors', response.errors);
				throw response.errors;
			});
		}
	};
	function runAjaxAction(...ajaxRunActionArgs) {
		// vuex don't understand BX.Promise. 'this.$store.dispatch.then' and 'subscribeAction({after})' won't work
		// wrap it in native Promise to fix it

		return new Promise((resolve, reject) => {
			main_core.ajax.runAction(...ajaxRunActionArgs).then(resolve).catch(reject);
		});
	}
	function emitUpdateEventToOutsideWorld({
		id,
		title,
		intranetCustomSectionId
	}) {
		const data = {
			id: normalizeId(id),
			title: normalizeTitle(title),
			intranetCustomSectionId: normalizeId(intranetCustomSectionId)
		};
		crm_toolbarComponent.ToolbarComponent.Instance.emitAutomatedSolutionUpdatedEvent(data);
	}

	/* eslint-disable no-param-reassign */
	var mutations = {
		/**
		 * Sets new initial state for the store. Modification flag is reset
		 */
		setState: (state, stateToSet) => {
			state.automatedSolution.id = normalizeId(stateToSet.automatedSolution?.id);
			state.automatedSolution.title = normalizeTitle(stateToSet.automatedSolution?.title);
			const typeIds = normalizeTypesIds(stateToSet.automatedSolution?.typeIds);
			state.automatedSolution.typeIds = [...typeIds];
			state.automatedSolutionOrigTypeIds = [...typeIds];
			state.permissions.canMoveSmartProcessFromCrm = main_core.Text.toBoolean(stateToSet.permissions?.canMoveSmartProcessFromCrm ?? false);
			state.permissions.canMoveSmartProcessFromAnotherAutomatedSolution = main_core.Text.toBoolean(stateToSet.permissions?.canMoveSmartProcessFromAnotherAutomatedSolution ?? false);
			state.dynamicTypesTitles = normalizeDynamicTypesTitles(stateToSet.dynamicTypesTitles);
			state.errors = normalizeErrors(stateToSet.errors);
			state.isModified = false;
			state.isPermissionsLayoutV2Enabled = main_core.Text.toBoolean(stateToSet.isPermissionsLayoutV2Enabled ?? false);
		},
		setErrors: (state, errors) => {
			state.errors = normalizeErrors(errors);
		},
		removeError: (state, error) => {
			if (!isValidError(error)) {
				return;
			}
			state.errors = state.errors.filter(x => x !== error);
		},
		setTitle: (state, title) => {
			const newTitle = normalizeTitle(title);
			if (newTitle !== state.automatedSolution.title) {
				state.isModified = true;
			}
			state.automatedSolution.title = newTitle;
		},
		addTypeId: (state, typeId) => {
			const normalizedTypeId = normalizeTypeId(typeId);
			if (normalizedTypeId <= 0) {
				return;
			}
			if (state.automatedSolution.typeIds.includes(normalizedTypeId)) {
				return;
			}
			state.automatedSolution.typeIds.push(normalizedTypeId);
			state.isModified = true;
		},
		removeTypeId: (state, typeId) => {
			const normalizedTypeId = normalizeTypeId(typeId);
			if (normalizedTypeId <= 0) {
				return;
			}
			const newTypeIds = state.automatedSolution.typeIds.filter(id => id !== normalizedTypeId);
			if (newTypeIds.length !== state.automatedSolution.typeIds.length) {
				state.isModified = true;
			}
			state.automatedSolution.typeIds = newTypeIds;
		}
	};

	const store = {
		strict: true,
		state() {
			return {
				automatedSolutionOrigTypeIds: [],
				automatedSolution: {
					id: null,
					title: null,
					typeIds: []
				},
				permissions: {
					canMoveSmartProcessFromCrm: false,
					canMoveSmartProcessFromAnotherAutomatedSolution: false
				},
				dynamicTypesTitles: {},
				errors: [],
				isModified: false,
				isPermissionsLayoutV2Enabled: false
			};
		},
		getters: {
			isNew: state => {
				return state.automatedSolution.id <= 0;
			},
			isSaved: (state, getters) => {
				return !state.isModified && !getters.isNew;
			}
		},
		actions,
		mutations
	};

	class App {
		#container;
		#initialActiveTabId;
		#initialState;
		#readOnly;
		#app = null;
		constructor({
			containerId,
			activeTabId,
			state,
			readOnly
		}) {
			this.#container = document.getElementById(containerId);
			if (!main_core.Type.isDomNode(this.#container)) {
				throw new Error('container not found');
			}
			this.#initialActiveTabId = String(activeTabId);
			this.#readOnly = Boolean(readOnly);
			if (main_core.Type.isPlainObject(state)) {
				this.#initialState = state;
			}
		}
		start() {
			// eslint-disable-next-line unicorn/no-this-assignment
			const appWrapperRef = this;
			this.#app = ui_vue3.BitrixVue.createApp({
				...Main,
				beforeCreate() {
					this.$bitrix.Application.set(appWrapperRef);
				}
			}, {
				initialActiveTabId: this.#initialActiveTabId,
				readOnly: this.#readOnly
			});
			const vuexStore = ui_vue3_vuex.createStore(store);
			if (this.#initialState) {
				vuexStore.dispatch('setState', this.#initialState);
			}
			this.#app.use(vuexStore);
			this.#app.mount(this.#container);
		}
		stop() {
			this.#app.unmount();
			this.#app = null;
		}
		reloadWithNewUri(automatedSolutionId, queryParams = {}) {
			setTimeout(() => {
				const uri = crm_router.Router.Instance.getAutomatedSolutionDetailUrl(automatedSolutionId);
				uri.setQueryParams({
					...queryParams,
					IFRAME: 'Y',
					IFRAME_TYPE: 'SIDE_SLIDER'
				});
				window.location.href = uri.toString();
			});
		}
		closeSliderOrRedirect() {
			setTimeout(() => {
				crm_router.Router.Instance.closeSliderOrRedirect(crm_router.Router.Instance.getAutomatedSolutionListUrl(), window);
			});
		}
	}

	exports.App = App;

})(this.BX.Crm.AutomatedSolution.Details = this.BX.Crm.AutomatedSolution.Details || {}, BX.Crm, BX, BX.Vue3, BX.Vue3.Vuex, BX.Crm.Integration.Analytics, BX.Event, BX.UI.Analytics, BX.UI.Dialogs, BX.UI.EntitySelector, BX.Crm, BX.UI);
//# sourceMappingURL=script.js.map
