/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_vue3, ui_vue3_pinia, ui_vue3_mixins_locMixin, main_core_events, main_core, crm_integration_analytics, crm_dialog, crm_router, crm_toolbarComponent, ui_dialogs_messagebox, ui_vue3_components_button, ui_analytics, crm_settingsHub, crm_typeModel, ui_vue3_components_switcher, ui_system_typography_vue, ui_entitySelector, ui_alerts, ui_buttons, ui_system_input_vue, ui_a11y, ui_vue3_directives_hint, ui_iconSet_api_vue, ui_iconSet_outline, ui_system_chip, ui_system_skeleton_vue) {
	'use strict';

	const CATEGORY_LIST_ACTION = 'categoryList';
	const PERMISSIONS_ACTION = 'permissions';
	const BIZ_PROC_DESIGNER_ACTION = 'bizProcDesigner';
	const DOCUMENT_TEMPLATES_ACTION = 'documentTemplates';
	const REQUISITES_ACTION = 'requisites';
	const RECYCLE_BIN_ACTION = 'recycleBin';
	const SERVER_ADDRESSED_ACTION_KEYS = new Set([BIZ_PROC_DESIGNER_ACTION, DOCUMENT_TEMPLATES_ACTION, REQUISITES_ACTION, RECYCLE_BIN_ACTION]);
	const ADDRESSED_ACTION_KEYS = new Set([...SERVER_ADDRESSED_ACTION_KEYS, CATEGORY_LIST_ACTION]);
	const HANDLED_ACTION_KEYS = new Set([PERMISSIONS_ACTION, CATEGORY_LIST_ACTION, ...SERVER_ADDRESSED_ACTION_KEYS]);

	const SpControlType = Object.freeze({
		Relation: 'relation',
		CustomSection: 'custom-section',
		LinkedUserFields: 'linked-user-fields'
	});
	const LIVE_BOOLEAN_FIELD_NAMES = ['isCategoriesEnabled', 'isStagesEnabled', 'isBeginCloseDatesEnabled', 'isClientEnabled', 'isLinkWithProductsEnabled', 'isMycompanyEnabled', 'isDocumentsEnabled', 'isSourceEnabled', 'isUseInUserfieldEnabled', 'isObserversEnabled', 'isRecurringEnabled', 'isRecyclebinEnabled', 'isAutomationEnabled', 'isBizProcEnabled', 'isSetOpenPermissions', 'isCountersEnabled'];
	const DAYS_BEFORE_CLOSE_MIN = 0;
	const DAYS_BEFORE_CLOSE_MAX = 365;
	const SpSectionId = Object.freeze({
		Main: 'main',
		Features: 'features',
		Relations: 'relations',
		Products: 'products',
		Permissions: 'permissions'
	});
	[{
		id: SpSectionId.Main,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_MAIN',
		hideTitle: true
	}, {
		id: SpSectionId.Features,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_FEATURES',
		hideTitle: true
	}, {
		id: SpSectionId.Relations,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS',
		hideTitle: true
	}, {
		id: SpSectionId.Products,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS',
		hideTitle: true
	}, {
		id: SpSectionId.Permissions,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS',
		hideTitle: true
	}];
	const SP_HUB_RECORDS = [{
		id: 'sp-title',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_FIELD_TITLE',
		availableFromStep: 1,
		valueKey: 'title',
		legacyBinding: {
			name: 'title'
		}
	}, {
		id: 'sp-description',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_HUB_DESCRIPTION',
		availableFromStep: 2,
		valueKey: 'description',
		legacyBinding: {
			name: 'description'
		}
	}, {
		id: 'sp-custom-section',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: SpControlType.CustomSection,
		title: 'CRM_TYPE_DETAIL_TAB_CUSTOM_SECTION_MSGVER_1',
		availableFromStep: 1,
		valueKey: 'customSectionId',
		legacyBinding: {
			switcherId: 'crm-type-custom-section-switcher',
			dataRole: 'crm-type-custom-section-container'
		}
	}, {
		id: 'sp-source',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_SOURCE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_SOURCE_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isSourceEnabled',
		legacyBinding: {
			name: 'isSourceEnabled',
			dataName: 'isSourceEnabled'
		}
	}, {
		id: 'sp-begin-close-dates',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_DATES',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_DATES_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isBeginCloseDatesEnabled',
		legacyBinding: {
			name: 'isBeginCloseDatesEnabled',
			dataName: 'isBeginCloseDatesEnabled'
		}
	}, {
		id: 'sp-observers',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_OBSERVERS',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_OBSERVERS_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isObserversEnabled',
		legacyBinding: {
			name: 'isObserversEnabled',
			dataName: 'isObserversEnabled'
		}
	}, {
		id: 'sp-recurring',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_RECURRING',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECURRING_DESCRIPTION',
		availableFromStep: 1,
		valueKey: 'isRecurringEnabled',
		legacyBinding: {
			name: 'isRecurringEnabled',
			dataName: 'isRecurringEnabled'
		}
	}, {
		id: 'sp-days-before-close',
		sectionId: SpSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_TYPE_DETAIL_FIELD_DAYS_BEFORE_CLOSE',
		availableFromStep: 1,
		valueKey: 'daysBeforeClose',
		legacyBinding: {
			name: 'daysBeforeClose'
		},
		field: {
			inputType: 'number',
			min: DAYS_BEFORE_CLOSE_MIN,
			max: DAYS_BEFORE_CLOSE_MAX
		}
	}, {
		id: 'sp-card-view',
		sectionId: SpSectionId.Main,
		kind: 'navigation',
		controlType: 'navigation',
		title: 'CRM_TYPE_DETAIL_TAB_FIELDS_MSGVER_1',
		availableFromStep: 2,
		actionKey: 'cardView'
	}, {
		id: 'sp-categories',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_CATEGORIES_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isCategoriesEnabled',
		legacyBinding: {
			name: 'isCategoriesEnabled',
			dataName: 'isCategoriesEnabled'
		},
		disabled: {
			condition: 'isCategoriesControlDisabled',
			reasonSource: 'CRM_TYPE_DETAIL_CATEGORIES_DISABLED_HINT'
		},
		description: 'CRM_TYPE_DETAIL_CATEGORIES_CARD_DESCRIPTION'
	}, {
		id: 'sp-stages',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_STAGES_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isStagesEnabled',
		legacyBinding: {
			name: 'isStagesEnabled',
			dataName: 'isStagesEnabled'
		},
		description: 'CRM_TYPE_DETAIL_STAGES_CARD_DESCRIPTION'
	}, {
		id: 'sp-automation',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_AUTOMATION_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isAutomationEnabled',
		legacyBinding: {
			name: 'isAutomationEnabled',
			dataName: 'isAutomationEnabled'
		},
		description: 'CRM_TYPE_DETAIL_AUTOMATION_CARD_DESCRIPTION'
	}, {
		id: 'sp-biz-proc',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_BIZ_PROC_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isBizProcEnabled',
		legacyBinding: {
			name: 'isBizProcEnabled',
			dataName: 'isBizProcEnabled'
		},
		description: 'CRM_TYPE_DETAIL_BIZ_PROC_CARD_DESCRIPTION'
	}, {
		id: 'sp-counters',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_COUNTERS_ENABLED_TITLE_MSGVER_1',
		availableFromStep: 1,
		valueKey: 'isCountersEnabled',
		legacyBinding: {
			name: 'isCountersEnabled',
			dataName: 'isCountersEnabled'
		}
	}, {
		id: 'sp-recyclebin',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_RECYCLEBIN_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isRecyclebinEnabled',
		legacyBinding: {
			name: 'isRecyclebinEnabled',
			dataName: 'isRecyclebinEnabled'
		},
		disabled: {
			condition: 'isRecyclebinControlDisabled',
			reasonSource: 'CRM_TYPE_DETAIL_RECYCLE_DISABLED_HINT'
		}
	}, {
		id: 'sp-set-open-permissions',
		sectionId: SpSectionId.Features,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_SET_OPEN_PERMISSIONS_TITLE',
		availableFromStep: 1,
		valueKey: 'isSetOpenPermissions',
		legacyBinding: {
			name: 'isSetOpenPermissions',
			dataName: 'isSetOpenPermissions'
		},
		description: 'CRM_TYPE_DETAIL_IS_SET_OPEN_PERMISSIONS_DESCRIPTION'
	}, {
		id: 'sp-client',
		sectionId: SpSectionId.Relations,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_CLIENT',
		availableFromStep: 1,
		valueKey: 'isClientEnabled',
		legacyBinding: {
			name: 'isClientEnabled',
			dataName: 'isClientEnabled'
		}
	}, {
		id: 'sp-relation-parent',
		sectionId: SpSectionId.Relations,
		kind: 'relation',
		controlType: SpControlType.Relation,
		title: 'CRM_TYPE_DETAIL_RELATION_PARENT',
		availableFromStep: 1,
		direction: 'parent',
		source: {
			availableItemsKey: 'relationsCatalog.parent',
			selectedItemsKey: 'relations.parent'
		},
		selector: {
			entityType: 'crmType',
			multiple: true
		},
		adapterKey: 'parentRelation',
		legacyBinding: {
			switcherId: 'crm-type-relation-parent-switcher',
			dataName: 'isRelationParentShowChildrenEnabled',
			dataRole: 'crm-type-relation-parent-items'
		}
	}, {
		id: 'sp-relation-child',
		sectionId: SpSectionId.Relations,
		kind: 'relation',
		controlType: SpControlType.Relation,
		title: 'CRM_TYPE_DETAIL_RELATION_CHILD',
		availableFromStep: 1,
		direction: 'child',
		source: {
			availableItemsKey: 'relationsCatalog.child',
			selectedItemsKey: 'relations.child'
		},
		selector: {
			entityType: 'crmType',
			multiple: true
		},
		adapterKey: 'childRelation',
		legacyBinding: {
			switcherId: 'crm-type-relation-child-switcher',
			dataName: 'isRelationChildShowChildrenEnabled',
			dataRole: 'crm-type-relation-child-items'
		}
	}, {
		id: 'sp-use-in-userfield',
		sectionId: SpSectionId.Relations,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_IS_USE_IN_USERFIELD_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isUseInUserfieldEnabled',
		legacyBinding: {
			name: 'isUseInUserfieldEnabled',
			dataName: 'isUseInUserfieldEnabled'
		}
	}, {
		id: 'sp-linked-user-fields',
		sectionId: SpSectionId.Relations,
		kind: 'array',
		controlType: SpControlType.LinkedUserFields,
		title: 'CRM_TYPE_DETAIL_TAB_USER_FIELDS_TITLE',
		availableFromStep: 1,
		itemsKey: 'linkedUserFields',
		itemIdKey: 'name',
		itemTitleKey: 'title',
		itemValueKey: 'isEnabled'
	}, {
		id: 'sp-link-with-products',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_LINK_WITH_PRODUCTS_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isLinkWithProductsEnabled',
		legacyBinding: {
			name: 'isLinkWithProductsEnabled',
			dataName: 'isLinkWithProductsEnabled'
		}
	}, {
		id: 'sp-documents',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_TYPE_IS_DOCUMENTS_ENABLED_TITLE',
		availableFromStep: 1,
		valueKey: 'isDocumentsEnabled',
		legacyBinding: {
			name: 'isDocumentsEnabled',
			dataName: 'isDocumentsEnabled'
		}
	}, {
		id: 'sp-mycompany',
		sectionId: SpSectionId.Products,
		kind: 'scalar',
		controlType: 'toggle',
		title: 'CRM_TYPE_DETAIL_FIELD_MY_COMPANY',
		availableFromStep: 1,
		valueKey: 'isMycompanyEnabled',
		legacyBinding: {
			name: 'isMycompanyEnabled',
			dataName: 'isMycompanyEnabled'
		}
	}, {
		id: 'sp-permissions',
		sectionId: SpSectionId.Permissions,
		kind: 'navigation',
		controlType: 'navigation',
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS',
		availableFromStep: 1,
		actionKey: PERMISSIONS_ACTION
	}];

	const HUB_VALUE_KEYS = [...LIVE_BOOLEAN_FIELD_NAMES, 'title', 'description', 'daysBeforeClose', 'linkedUserFields', 'relations', 'customSectionId', 'customSections', 'isExternal'];
	function defaultHubValues() {
		const values = {};
		LIVE_BOOLEAN_FIELD_NAMES.forEach(name => {
			values[name] = false;
		});
		values.title = '';
		values.description = '';
		values.daysBeforeClose = '';
		values.linkedUserFields = {};
		values.relations = {
			parent: [],
			child: []
		};
		values.customSectionId = 0;
		values.customSections = [];
		values.isExternal = false;
		return values;
	}
	function pickHubValues(source) {
		const values = {};
		HUB_VALUE_KEYS.forEach(key => {
			values[key] = source[key];
		});
		return JSON.parse(JSON.stringify(values));
	}
	function areHubValuesEqual(a, b) {
		return JSON.stringify(a) === JSON.stringify(b);
	}
	function normalizeDaysBeforeClose(raw) {
		if (raw === null || raw === undefined || raw === '') {
			return null;
		}
		const days = Number(raw);
		if (Number.isNaN(days)) {
			return null;
		}
		return Math.min(Math.max(days, DAYS_BEFORE_CLOSE_MIN), DAYS_BEFORE_CLOSE_MAX);
	}
	function formatDaysBeforeClose(raw) {
		const days = normalizeDaysBeforeClose(raw);
		return days === null ? '' : String(days);
	}

	function toDescriptionValue(raw) {
		return Object.prototype.toString.call(raw) === '[object String]' ? String(raw) : '';
	}
	function readSavedDescription(responseData) {
		if (responseData === null || responseData === undefined || !Object.hasOwn(responseData, 'description')) {
			return undefined;
		}
		return toDescriptionValue(responseData.description);
	}
	function reconcileSavedDescription({
		sent,
		saved,
		live
	}) {
		return {
			snapshot: saved,
			live: live === sent ? saved : live
		};
	}
	function resolveSavedDescriptionState(state, saved) {
		const result = reconcileSavedDescription({
			sent: toDescriptionValue(state.snapshot.description),
			saved,
			live: toDescriptionValue(state.description)
		});
		return {
			description: result.live,
			snapshot: {
				...state.snapshot,
				description: result.snapshot
			}
		};
	}
	function settleSavedDescription(store, responseData) {
		const saved = readSavedDescription(responseData);
		if (saved !== undefined) {
			store.applySavedDescription(saved);
		}
		return !store.isDirty;
	}

	const useTypeHubStore = ui_vue3_pinia.defineStore('crmTypeHub', {
		state: () => ({
			...defaultHubValues(),
			snapshot: defaultHubValues(),
			activeSectionId: 'main'
		}),
		getters: {
			isDirty(state) {
				return !areHubValuesEqual(pickHubValues(state), state.snapshot);
			},
			values(state) {
				return pickHubValues(state);
			}
		},
		actions: {
			init(values, activeSectionId) {
				const next = {
					...defaultHubValues(),
					...values
				};
				HUB_VALUE_KEYS.forEach(key => {
					this[key] = next[key];
				});
				this.activeSectionId = activeSectionId;
				this.commitSnapshot();
			},
			setField(key, value) {
				this[key] = value;
			},
			setLinkedUserFields(linkedUserFields) {
				this.linkedUserFields = {
					...linkedUserFields
				};
			},
			setRelations(relations) {
				this.relations = {
					parent: [...relations.parent],
					child: [...relations.child]
				};
			},
			setRelationDirection(direction, items) {
				this.relations = {
					...this.relations,
					[direction]: [...items]
				};
			},
			setCustomSectionState(state) {
				this.customSectionId = state.customSectionId;
				this.customSections = [...state.customSections];
			},
			setActiveSection(sectionId) {
				this.activeSectionId = sectionId;
			},
			normalizeDaysBeforeClose() {
				this.daysBeforeClose = formatDaysBeforeClose(this.daysBeforeClose);
			},
			applySavedDescription(saved) {
				const next = resolveSavedDescriptionState(this, saved);
				this.snapshot = next.snapshot;
				this.description = next.description;
			},
			commitSnapshot(values) {
				this.snapshot = pickHubValues(values ?? this);
			},
			revertToSnapshot() {
				const snapshot = JSON.parse(JSON.stringify(this.snapshot));
				HUB_VALUE_KEYS.forEach(key => {
					this[key] = snapshot[key];
				});
			}
		}
	});

	function collectTypeFields(seed, values, hasCustomSection, normalizeDescription) {
		const fields = {
			...seed
		};
		fields.title = values.title;
		fields.description = normalizeDescription(values.description);
		fields.daysBeforeClose = normalizeDaysBeforeClose(values.daysBeforeClose);
		LIVE_BOOLEAN_FIELD_NAMES.forEach(name => {
			fields[name] = Boolean(values[name]);
		});
		fields.linkedUserFields = values.linkedUserFields;
		fields.relations = {
			parent: values.relations.parent,
			child: values.relations.child
		};
		if (hasCustomSection) {
			fields.customSectionId = values.customSectionId;
			fields.customSections = values.customSections;
			fields.isExternal = values.isExternal;
			fields.isSaveFromTypeDetail = true;
		}
		return fields;
	}

	class TypeFormAdapter {
		#seed;
		#hasCustomSection;
		#normalizeDescription;
		#model;
		constructor(seed, hasCustomSection, normalizeDescription) {
			this.#seed = clone(seed);
			this.#hasCustomSection = hasCustomSection;
			this.#normalizeDescription = normalizeDescription;
			this.#model = new crm_typeModel.TypeModel(clone(seed));
		}
		getModel() {
			return this.#model;
		}
		isSaved() {
			return this.#model.isSaved();
		}
		save(values) {
			this.#model.setData(collectTypeFields(this.#seed, values, this.#hasCustomSection, this.#normalizeDescription));
			return this.#model.save();
		}
		delete() {
			return this.#model.delete();
		}
	}
	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function createSaveRequest(getValues, commitSnapshot) {
		const values = getValues();
		return {
			values,
			commit: () => commitSnapshot(values)
		};
	}

	class SaveType {
		#deps;
		#inProgress = false;
		constructor(deps) {
			this.#deps = deps;
		}
		execute() {
			const deps = this.#deps;
			if (deps.isRestricted) {
				deps.showRestriction();
				return;
			}
			if (this.#inProgress || deps.isWaiting()) {
				return;
			}
			this.#inProgress = true;
			deps.normalizeValues();
			const request = createSaveRequest(deps.getValues, deps.commitSnapshot);
			deps.setWaiting(true);
			deps.sendAnalytics('attempt');
			deps.adapter.save(request.values).then(response => {
				deps.sendAnalytics('success', deps.getTypeId());
				deps.markCancelEventRegistered();
				request.commit();
				this.#inProgress = false;
				deps.setWaiting(false);
				deps.afterSave(response);
			}).catch(errors => {
				deps.sendAnalytics('error', deps.getTypeId());
				deps.showErrors(errors);
				this.#inProgress = false;
				deps.setWaiting(false);
			});
		}
	}
	function getCurrentSlider() {
		return BX.SidePanel?.Instance?.getSliderByWindow(window);
	}

	class DeleteType {
		#deps;
		#isDialogOpen = false;
		#inProgress = false;
		constructor(deps) {
			this.#deps = deps;
		}
		execute() {
			const deps = this.#deps;
			if (this.#isDialogOpen || this.#inProgress || deps.isWaiting()) {
				return;
			}
			this.#isDialogOpen = true;
			deps.confirm({
				onAccept: () => this.#delete(),
				onCancel: () => {
					if (this.#inProgress || !this.#isDialogOpen) {
						return;
					}
					this.#isDialogOpen = false;
					deps.sendAnalytics('cancel');
				}
			});
		}
		async #delete() {
			const deps = this.#deps;
			if (this.#inProgress || !this.#isDialogOpen) {
				return;
			}
			if (deps.isWaiting()) {
				this.#isDialogOpen = false;
				return;
			}
			this.#inProgress = true;
			deps.setWaiting(true);
			deps.sendAnalytics('attempt');
			try {
				const response = await deps.requestDelete();
				deps.sendAnalytics('success');
				deps.markCancelEventRegistered();
				deps.commitSnapshot();
				this.#inProgress = false;
				this.#isDialogOpen = false;
				deps.setWaiting(false);
				deps.afterDelete(response);
			} catch (errors) {
				deps.sendAnalytics('error');
				deps.showErrors(Array.isArray(errors) ? errors : [String(errors)]);
				this.#inProgress = false;
				this.#isDialogOpen = false;
				deps.setWaiting(false);
			}
		}
	}

	class ConfirmCloseGuard {
		#deps;
		#isCloseConfirmed = false;
		#isDialogOpen = false;
		constructor(deps) {
			this.#deps = deps;
		}
		handleClose() {
			if (this.#isCloseConfirmed) {
				return;
			}
			if (!this.#deps.isDirty()) {
				return;
			}
			this.#deps.denyClose();
			if (this.#isDialogOpen) {
				return;
			}
			this.#isDialogOpen = true;
			this.#deps.openConfirm().then(confirmed => {
				this.#isDialogOpen = false;
				if (confirmed) {
					this.#isCloseConfirmed = true;
					this.#deps.closeSlider();
				}
			}).catch(() => {
				this.#isDialogOpen = false;
			});
		}
		get isDialogOpen() {
			return this.#isDialogOpen;
		}
		get isCloseConfirmed() {
			return this.#isCloseConfirmed;
		}
	}

	const PENDING_KEY = 'crmTypeDetailHubPendingTypeUpdate';
	class DeferredTypeUpdate {
		#emit;
		#isPending = false;
		#isUrlChanged = false;
		constructor(emit) {
			this.#emit = emit;
		}
		defer(isUrlChanged) {
			this.#isPending = true;
			this.#isUrlChanged = this.#isUrlChanged || isUrlChanged;
		}
		flush(storage) {
			if (storage) {
				this.pickUp(storage);
			}
			if (!this.#isPending) {
				return;
			}
			const payload = {
				isUrlChanged: this.#isUrlChanged
			};
			this.#forget();
			this.#emit(payload);
		}
		absorb(isUrlChanged) {
			const result = isUrlChanged || this.#isUrlChanged;
			this.#forget();
			return result;
		}
		handOver(storage, isUrlChanged) {
			storage.set(PENDING_KEY, isUrlChanged || this.#isUrlChanged);
			this.#forget();
		}
		pickUp(storage) {
			if (!storage.has(PENDING_KEY)) {
				return;
			}
			this.defer(storage.get(PENDING_KEY) === true);
			storage.delete(PENDING_KEY);
		}
		#forget() {
			this.#isPending = false;
			this.#isUrlChanged = false;
		}
	}

	const IFRAME_PARAMS = [
	['IFRAME', 'Y'], ['IFRAME_TYPE', 'SIDE_SLIDER']];
	function readNumber(raw) {
		if (typeof raw === 'number') {
			return Number.isFinite(raw) ? raw : null;
		}
		if (typeof raw === 'string' && raw.trim() !== '') {
			const parsed = Number(raw);
			return Number.isFinite(parsed) ? parsed : null;
		}
		return null;
	}
	function readRecord$1(raw) {
		return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : null;
	}
	function readCreatedType(responseData) {
		const data = readRecord$1(responseData);
		if (data === null) {
			return null;
		}
		const type = readRecord$1(data.type);
		if (type === null) {
			return null;
		}
		const id = readNumber(type.id);
		const entityTypeId = readNumber(type.entityTypeId);
		if (id === null || entityTypeId === null) {
			return null;
		}
		return {
			id,
			entityTypeId
		};
	}
	function shouldReloadAfterSave(input) {
		if (!input.wasCreationPreview || input.created === null) {
			return false;
		}
		if (input.created.entityTypeId <= 0) {
			return false;
		}
		if (input.reloadUri !== undefined && (input.reloadUri === null || input.reloadUri.trim() === '')) {
			return false;
		}
		return true;
	}
	function splitOnce(value, separator) {
		const at = value.indexOf(separator);
		return at === -1 ? [value, null] : [value.slice(0, at), value.slice(at + separator.length)];
	}
	function decodeQueryPart(value) {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}
	function parseQuery(query) {
		if (query === '') {
			return [];
		}
		return query.split('&').filter(pair => pair !== '').map(pair => {
			const [name, value] = splitOnce(pair, '=');
			return [name, value ?? ''];
		});
	}
	function setParam(pairs, name, value) {
		const encodedName = encodeURIComponent(name);
		const encodedValue = encodeURIComponent(value);
		const at = pairs.findIndex(pair => pair[0] === encodedName || decodeQueryPart(pair[0]) === name);
		if (at === -1) {
			pairs.push([encodedName, encodedValue]);
			return;
		}
		pairs[at] = [encodedName, encodedValue];
	}
	function buildTypeDetailReloadUri(input) {
		if (!input.typeDetailUrl) {
			return '';
		}
		const [withoutHash, hash] = splitOnce(input.typeDetailUrl, '#');
		const [path, query] = splitOnce(withoutHash, '?');
		const pairs = parseQuery(query ?? '');
		const carried = readRecord$1(input.carryQueryParams) ?? {};
		Object.keys(carried).forEach(name => {
			const value = carried[name];
			if (name === '' || typeof value !== 'string' || value.trim() === '') {
				return;
			}
			setParam(pairs, name, value);
		});
		const activeTabId = typeof input.activeTabId === 'string' ? input.activeTabId.trim() : '';
		if (activeTabId !== '') {
			setParam(pairs, 'activeTabId', activeTabId);
		}
		IFRAME_PARAMS.forEach(([name, value]) => {
			setParam(pairs, name, value);
		});
		const built = `${path}?${pairs.map(([name, value]) => `${name}=${value}`).join('&')}`;
		return hash === null ? built : `${built}#${hash}`;
	}

	function resolveAfterSaveAction(input) {
		if (!input.wasCreationPreview) {
			return 'stay';
		}
		if (shouldReloadAfterSave({
			wasCreationPreview: input.wasCreationPreview,
			created: input.created,
			reloadUri: input.reloadUri
		})) {
			return 'navigate';
		}
		return input.isInSlider ? 'close' : 'stay';
	}
	const FRAME_QUERY_PARAM_NAMES = ['IFRAME', 'IFRAME_TYPE'];
	function decodeQueryName(name) {
		try {
			return decodeURIComponent(name);
		} catch {
			return name;
		}
	}
	function dropFrameQueryParams(uri) {
		const hashAt = uri.indexOf('#');
		const withoutHash = hashAt === -1 ? uri : uri.slice(0, hashAt);
		const hash = hashAt === -1 ? '' : uri.slice(hashAt);
		const queryAt = withoutHash.indexOf('?');
		if (queryAt === -1) {
			return uri;
		}
		const path = withoutHash.slice(0, queryAt);
		const pairs = withoutHash.slice(queryAt + 1).split('&').filter(pair => pair !== '').filter(pair => {
			const at = pair.indexOf('=');
			const name = decodeQueryName(at === -1 ? pair : pair.slice(0, at));
			return !FRAME_QUERY_PARAM_NAMES.includes(name);
		});
		return `${path}${pairs.length > 0 ? `?${pairs.join('&')}` : ''}${hash}`;
	}
	function readRecord(raw) {
		return typeof raw === 'object' && raw !== null && !Array.isArray(raw) ? raw : null;
	}
	function readCustomSectionId(raw) {
		if (typeof raw === 'number') {
			return Number.isFinite(raw) ? raw : 0;
		}
		if (typeof raw === 'string' && raw.trim() !== '') {
			const parsed = Number(raw);
			return Number.isFinite(parsed) ? parsed : 0;
		}
		return 0;
	}
	function readSavedCustomSectionState(responseData) {
		const data = readRecord(responseData);
		if (data === null) {
			return null;
		}
		const type = readRecord(data.type);
		if (type === null || !Array.isArray(type.customSections)) {
			return null;
		}
		return {
			customSectionId: readCustomSectionId(type.customSectionId),
			customSections: type.customSections.filter(section => readRecord(section) !== null).map(section => ({
				...section
			}))
		};
	}

	function hasAnyChecked(items) {
		return Object.values(items).some(Boolean);
	}
	function applyMasterToggle(state) {
		if (state.master) {
			return {
				master: true,
				items: {
					...state.items
				}
			};
		}
		const items = {};
		Object.keys(state.items).forEach(name => {
			items[name] = false;
		});
		return {
			master: false,
			items
		};
	}
	function applyChildToggle(state) {
		if (!state.master && hasAnyChecked(state.items)) {
			return {
				master: true,
				items: {
					...state.items
				}
			};
		}
		return {
			master: state.master,
			items: {
				...state.items
			}
		};
	}

	function canRegisterCancelEvent(isDirty, isCloseConfirmed) {
		return !isDirty || isCloseConfirmed;
	}
	function resolveCancelElement(deferredElement, element) {
		return deferredElement ?? element;
	}

	const CREATION_PREVIEW_ROOT_CLASS = 'crm-type-hub--creation-preview';
	function shouldInertContent(active) {
		return active;
	}
	function resolveCreationPreviewState(params) {
		const active = Boolean(params.isCreationPreview === true);
		return {
			active,
			rootModifierClass: active ? CREATION_PREVIEW_ROOT_CLASS : null,
			contentInert: shouldInertContent(active),
			hideGlobalSavePanel: active,
			showHeroSaveButton: active
		};
	}

	const HubTreeSectionId = Object.freeze({
		Passport: 'passport',
		Card: 'card',
		Process: 'process',
		Automation: 'automation',
		Products: 'products',
		Relations: 'relations',
		Permissions: 'permissions'
	});
	const HUB_TREE_SECTION_BY_RECORD = {
		'sp-title': HubTreeSectionId.Passport,
		'sp-description': HubTreeSectionId.Passport,
		'sp-custom-section': HubTreeSectionId.Passport,
		'sp-card-view': HubTreeSectionId.Card,
		'sp-begin-close-dates': HubTreeSectionId.Card,
		'sp-days-before-close': HubTreeSectionId.Card,
		'sp-observers': HubTreeSectionId.Card,
		'sp-source': HubTreeSectionId.Card,
		'sp-counters': HubTreeSectionId.Card,
		'sp-client': HubTreeSectionId.Card,
		'sp-stages': HubTreeSectionId.Process,
		'sp-categories': HubTreeSectionId.Process,
		'sp-set-open-permissions': HubTreeSectionId.Process,
		'sp-recyclebin': HubTreeSectionId.Process,
		'sp-automation': HubTreeSectionId.Automation,
		'sp-biz-proc': HubTreeSectionId.Automation,
		'sp-recurring': HubTreeSectionId.Automation
	};
	const HUB_TREE_SECTIONS = [{
		id: HubTreeSectionId.Card,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_CARD',
		hideTitle: true
	}, {
		id: HubTreeSectionId.Process,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PROCESS',
		hideTitle: true
	}, {
		id: HubTreeSectionId.Relations,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS_V2',
		hideTitle: true
	}, {
		id: HubTreeSectionId.Products,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS',
		hideTitle: true
	}, {
		id: HubTreeSectionId.Automation,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION',
		hideTitle: true
	}, {
		id: HubTreeSectionId.Permissions,
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS',
		hideTitle: true
	}];
	const HUB_TREE_SECTION_BY_TAB = {
		common: HubTreeSectionId.Card,
		fields: HubTreeSectionId.Card,
		'custom-section': HubTreeSectionId.Card,
		relation: HubTreeSectionId.Relations,
		'user-fields': HubTreeSectionId.Relations
	};
	const HUB_TREE_DEFAULT_SECTION_ID = HubTreeSectionId.Card;

	function resolveHubRecords(isCustomSectionsAvailable) {
		const records = isCustomSectionsAvailable ? SP_HUB_RECORDS : SP_HUB_RECORDS.filter(record => record.id !== 'sp-custom-section');
		return records.map(record => {
			const sectionId = HUB_TREE_SECTION_BY_RECORD[record.id];
			return sectionId && sectionId !== record.sectionId ? {
				...record,
				sectionId
			} : record;
		});
	}

	function resolveHubSections() {
		return HUB_TREE_SECTIONS;
	}
	function resolveActiveSectionId(activeTabId, isExternal) {
		if (isExternal) {
			return HUB_TREE_DEFAULT_SECTION_ID;
		}
		return HUB_TREE_SECTION_BY_TAB[activeTabId] ?? HUB_TREE_DEFAULT_SECTION_ID;
	}
	function resolveDesignedSectionIds() {
		return resolveHubSections().map(section => section.id);
	}

	const AUTOMATION_SECTION_CARDS = [{
		recordId: 'sp-automation',
		icon: 'o-robot',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_DESCRIPTION'
	}, {
		recordId: 'sp-biz-proc',
		icon: 'o-business-process',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_BIZ_PROC_ACTION',
			actionKey: BIZ_PROC_DESIGNER_ACTION,
			icon: 'go-to-l'
		}
	}, {
		recordId: 'sp-recurring',
		icon: 'process'
	}];
	const AUTOMATION_SECTION_ICON = 'o-magic-wand';
	const AUTOMATION_SECTION_LAYOUT = {
		sectionId: 'automation',
		rootClass: 'crm-type-hub-cards-section',
		cardId: 'automation',
		title: 'CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION',
		icon: AUTOMATION_SECTION_ICON,
		intro: {
			text: 'CRM_TYPE_DETAIL_HUB_CARD_AUTOMATION_INTRO'
		},
		cards: AUTOMATION_SECTION_CARDS,
		layoutRecordIds: AUTOMATION_SECTION_CARDS.map(card => card.recordId)
	};

	const DAYS_OWNER_RECORD_ID = 'sp-begin-close-dates';
	const DAYS_RECORD_ID = 'sp-days-before-close';

	const CARD_SECTION_CARDS = [{
		recordId: 'sp-source',
		icon: 'o-cloud-time'
	}, {
		recordId: 'sp-client',
		icon: 'o-person',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_CLIENT_DESCRIPTION'
	}, {
		recordId: 'sp-counters',
		icon: 'statistics-arrow',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_DESCRIPTION'
	}, {
		recordId: 'sp-observers',
		icon: 'o-observer'
	}, {
		recordId: 'sp-begin-close-dates',
		icon: 'o-calendar-with-slots',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_DATES_TITLE'
	}];
	const CARD_SECTION_ICON = 'o-card';
	const CARD_SECTION_LAYOUT = {
		sectionId: 'card',
		rootClass: 'crm-type-hub-cards-section',
		cardId: 'card-fields',
		title: 'CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS',
		icon: CARD_SECTION_ICON,
		intro: {
			text: 'CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS_INTRO'
		},
		cards: CARD_SECTION_CARDS,
		layoutRecordIds: [...CARD_SECTION_CARDS.map(card => card.recordId), DAYS_RECORD_ID]
	};

	const PROCESS_SECTION_CARDS = [{
		recordId: 'sp-stages',
		icon: 'o-kanban',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_DESCRIPTION'
	}, {
		recordId: 'sp-categories',
		icon: 'o-change-funnel',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_FUNNELS_EDITOR_TITLE',
			actionKey: CATEGORY_LIST_ACTION,
			icon: 'go-to-l'
		}
	}, {
		recordId: 'sp-set-open-permissions',
		icon: 'o-three-persons-check',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_DESCRIPTION'
	}, {
		recordId: 'sp-recyclebin',
		icon: 'o-trashcan',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_FEATURES_BIN_ACTION',
			actionKey: RECYCLE_BIN_ACTION,
			icon: 'go-to-l'
		}
	}];
	const PROCESS_SECTION_ICON = 'o-busines-process-stages';
	const PROCESS_SECTION_LAYOUT = {
		sectionId: 'process',
		rootClass: 'crm-type-hub-cards-section',
		cardId: 'process',
		title: 'CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT',
		icon: PROCESS_SECTION_ICON,
		intro: {
			text: 'CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT_INTRO'
		},
		cards: PROCESS_SECTION_CARDS,
		layoutRecordIds: PROCESS_SECTION_CARDS.map(card => card.recordId)
	};

	const PRODUCTS_CARD_ICON = 'o-invoice';
	const PRODUCTS_FEATURE_CARDS = [{
		recordId: 'sp-link-with-products',
		icon: 'o-box',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_DESCRIPTION'
	}, {
		recordId: 'sp-documents',
		icon: 'o-file',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_TEMPLATES_ACTION',
			actionKey: DOCUMENT_TEMPLATES_ACTION,
			icon: 'go-to-l'
		}
	}, {
		recordId: 'sp-mycompany',
		icon: 'o-company',
		title: 'CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_TITLE',
		description: 'CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_DESCRIPTION',
		action: {
			text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_REQUISITES_ACTION',
			actionKey: REQUISITES_ACTION,
			icon: 'go-to-l'
		}
	}];
	const PRODUCTS_SECTION_LAYOUT = {
		sectionId: 'products',
		rootClass: 'crm-type-hub-products',
		cardId: 'products',
		title: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_TITLE',
		icon: PRODUCTS_CARD_ICON,
		intro: {
			text: 'CRM_TYPE_DETAIL_HUB_PRODUCTS_INTRO'
		},
		cards: PRODUCTS_FEATURE_CARDS,
		layoutRecordIds: PRODUCTS_FEATURE_CARDS.map(card => card.recordId)
	};

	function resolveCardsLayouts() {
		return [CARD_SECTION_LAYOUT, PROCESS_SECTION_LAYOUT, AUTOMATION_SECTION_LAYOUT, PRODUCTS_SECTION_LAYOUT];
	}

	function resolveFeatureCardAction(action, checked, urls) {
		if (!action || !checked || !HANDLED_ACTION_KEYS.has(action.actionKey)) {
			return false;
		}
		if (!ADDRESSED_ACTION_KEYS.has(action.actionKey)) {
			return true;
		}
		return resolveActionUrl(action.actionKey, urls) !== null;
	}
	function resolveActionUrl(actionKey, urls) {
		const value = urls[actionKey];
		return typeof value === 'string' && value.length > 0 ? value : null;
	}

	function revertForm(store, controls, readBaseline) {
		store.revertToSnapshot();
		const baseline = readBaseline();
		controls.forEach(control => {
			if (control.applySnapshot) {
				control.applySnapshot(baseline);
				return;
			}
			control.reset?.(baseline);
		});
	}

	function isTypeHubPanelFixed(isDirty, isNew, isCreationPreview = false) {
		if (isCreationPreview) {
			return false;
		}
		return isDirty || !isNew;
	}

	function destroyTagSelectors(selectors) {
		selectors.forEach(selector => {
			selector?.getDialog?.()?.destroy?.();
			selector?.unsubscribeAll?.();
		});
	}

	const DEFAULT_CUSTOM_SECTION_META = Object.freeze({
		isCreateSectionsViaAutomatedSolutionDetails: false,
		canEditAutomatedSolution: false,
		switcherDisabled: false,
		isNew: true,
		permissionsUrl: null
	});
	function readRelationCatalog(baseline, direction) {
		const catalog = baseline.relationsCatalog;
		const byDirection = isObjectLike(catalog) ? catalog[direction] : null;
		return Array.isArray(byDirection) ? byDirection : [];
	}
	function readRelationEntries(baseline, direction) {
		const relations = baseline.relations;
		const byDirection = isObjectLike(relations) ? relations[direction] : null;
		return Array.isArray(byDirection) ? byDirection : [];
	}
	function readCustomSections(baseline) {
		const raw = baseline.customSections;
		return Array.isArray(raw) ? raw.map(section => ({
			...section
		})) : [];
	}
	function hasSelectedCustomSection(sections) {
		return sections.some(section => section.isSelected);
	}
	function isCustomSectionSelected(selectedId, sectionId) {
		return String(selectedId) === String(sectionId);
	}
	function readCustomSectionMeta(baseline) {
		const raw = baseline.customSectionMeta;
		return isObjectLike(raw) ? {
			...DEFAULT_CUSTOM_SECTION_META,
			...raw
		} : {
			...DEFAULT_CUSTOM_SECTION_META
		};
	}
	function canEditCustomSection(baseline, readOnly = false, disabled = false) {
		return !readOnly && !disabled && readCustomSectionMeta(baseline).canEditAutomatedSolution;
	}
	function canDetachCustomSection(baseline, readOnly = false, disabled = false) {
		return canEditCustomSection(baseline, readOnly, disabled) && !readCustomSectionMeta(baseline).switcherDisabled;
	}
	function readLinkedUserFieldsMeta(baseline) {
		const raw = baseline.linkedUserFieldsMeta;
		return Array.isArray(raw) ? raw : [];
	}
	function readLinkedUserFields(baseline) {
		const raw = baseline.linkedUserFields;
		return isObjectLike(raw) ? raw : {};
	}
	function isObjectLike(value) {
		return value !== null && Object(value) === value;
	}

	const CrmTypeHubRelationControl = ui_vue3.defineComponent({
		name: 'CrmTypeHubRelationControl',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm
		},
		inject: {
			hubControlRegistry: {
				default: null
			}
		},
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update'],
		setup() {
			return {
				switcherOptions: {
					size: 'small',
					showStateTitle: false
				}
			};
		},
		data() {
			return {
				enabled: false,
				showChildrenList: false,
				typeSelector: null,
				tabsSelector: null
			};
		},
		computed: {
			direction() {
				return this.descriptor.direction ?? 'parent';
			},
			switcherLabelId() {
				return `crm-type-hub-relation-${this.descriptor.id}-label`;
			},
			ariaChecked() {
				return this.enabled ? 'true' : 'false';
			}
		},
		mounted() {
			this.applySnapshot(this.snapshot);
			this.registerInRegistry();
		},
		beforeUnmount() {
			this.destroySelectors();
			this.unregisterFromRegistry();
		},
		methods: {
			buildSelectors(catalog, selectedEntries) {
				this.destroySelectors();
				const selectedById = new Map();
				selectedEntries.forEach(entry => selectedById.set(Number(entry.entityTypeId), entry));
				const unselectedTypes = [];
				const selectedTypes = [];
				const unselectedTabs = [];
				const selectedTabs = [];
				catalog.forEach(relation => {
					const item = {
						id: relation.entityTypeId,
						entityId: 'crmType',
						title: relation.title,
						tabs: 'recents'
					};
					const entry = selectedById.get(Number(relation.entityTypeId));
					const isChecked = entry ? true : relation.isChecked;
					const withList = entry ? entry.isChildrenListEnabled : relation.isChildrenListEnabled;
					if (isChecked) {
						selectedTypes.push(item);
						(withList ? selectedTabs : unselectedTabs).push(item);
					} else {
						unselectedTypes.push(item);
					}
				});
				this.typeSelector = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
					dialogOptions: {
						enableSearch: false,
						multiple: false,
						items: unselectedTypes,
						selectedItems: selectedTypes,
						dropdownMode: true,
						height: 200,
						showAvatars: false
					},
					events: {
						onAfterTagAdd: this.handleSelectorChange.bind(this),
						onAfterTagRemove: this.handleSelectorChange.bind(this)
					}
				}));
				this.typeSelector.renderTo(this.$refs.typeSelector);
				this.tabsSelector = ui_vue3.markRaw(new ui_entitySelector.TagSelector({
					dialogOptions: {
						enableSearch: false,
						multiple: false,
						items: unselectedTabs,
						selectedItems: selectedTabs,
						dropdownMode: true,
						height: 200,
						showAvatars: false
					}
				}));
				this.tabsSelector.renderTo(this.$refs.tabsSelector);
				this.enabled = selectedTypes.length > 0;
				this.showChildrenList = selectedTabs.length > 0;
			},
			handleSwitcherCheck() {
				this.enabled = true;
				this.emitUpdate();
			},
			handleSwitcherUncheck() {
				this.enabled = false;
				this.emitUpdate();
			},
			handleSwitcherKeydown(event) {
				if (this.disabled || this.readOnly || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				if (this.enabled) {
					this.handleSwitcherUncheck();
				} else {
					this.handleSwitcherCheck();
				}
			},
			handleChildrenListToggle(event) {
				this.showChildrenList = event.target.checked;
				this.reconcileTabs();
				this.emitUpdate();
			},
			handleSelectorChange() {
				this.reconcileTabs();
				this.emitUpdate();
			},
			reconcileTabs() {
				if (!this.typeSelector || !this.tabsSelector) {
					return;
				}
				const selectedTypes = this.typeSelector.getDialog().getSelectedItems();
				this.tabsSelector.getDialog().getItems().forEach(item => {
					const stillSelected = selectedTypes.some(type => type.getId() === item.getId());
					if (!stillSelected) {
						item.deselect();
						this.tabsSelector.getDialog().removeItem(item);
						this.tabsSelector.removeTag({
							id: item.getId(),
							entityId: item.getEntityId()
						});
					}
				});
				selectedTypes.forEach(type => {
					const itemData = {
						id: type.getId(),
						entityId: type.getEntityId(),
						title: type.getTitle(),
						tabs: 'recents'
					};
					const existing = this.tabsSelector.getDialog().getItem(itemData);
					if (!existing) {
						this.tabsSelector.getDialog().addItem(itemData).select();
					}
				});
			},
			getData() {
				if (!this.enabled || !this.typeSelector) {
					return [];
				}
				const selectedTabIds = new Set(this.tabsSelector.getDialog().getSelectedItems().map(item => item.getId()));
				return this.typeSelector.getDialog().getSelectedItems().map(type => ({
					entityTypeId: type.getId(),
					isChildrenListEnabled: this.showChildrenList && selectedTabIds.has(type.getId())
				}));
			},
			emitUpdate() {
				this.$emit('update', this.getData());
			},
			applySnapshot(baseline) {
				this.buildSelectors(readRelationCatalog(baseline, this.direction), readRelationEntries(baseline, this.direction));
			},
			destroySelectors() {
				destroyTagSelectors([this.typeSelector, this.tabsSelector]);
				main_core.Dom.clean(this.$refs.typeSelector);
				main_core.Dom.clean(this.$refs.tabsSelector);
				this.typeSelector = null;
				this.tabsSelector = null;
			},
			reset(baseline) {
				this.applySnapshot(baseline);
			},
			registerInRegistry() {
				const registry = this.hubControlRegistry;
				if (registry) {
					registry[this.descriptor.id] = {
						applySnapshot: baseline => this.applySnapshot(baseline),
						reset: baseline => this.reset(baseline)
					};
				}
			},
			unregisterFromRegistry() {
				const registry = this.hubControlRegistry;
				if (registry) {
					delete registry[this.descriptor.id];
				}
			}
		},
		template: `
		<div class="crm-type-hub-relation" :class="{ '--disabled': disabled }">
			<div class="crm-type-hub-relation__switch">
				<div
					class="crm-type-hub-relation__switch-toggle"
					:tabindex="(disabled || readOnly) ? -1 : 0"
					role="switch"
					:aria-checked="ariaChecked"
					:aria-labelledby="switcherLabelId"
					:data-testid="'crm-type-detail-relation-' + direction + '-switch'"
					@keydown="handleSwitcherKeydown"
				>
					<Switcher
						:is-checked="enabled"
						:is-disabled="disabled || readOnly"
						:options="switcherOptions"
						:data-switcher-id="descriptor.legacyBinding && descriptor.legacyBinding.switcherId"
						aria-hidden="true"
						@check="handleSwitcherCheck"
						@uncheck="handleSwitcherUncheck"
					/>
				</div>
				<TextSm :id="switcherLabelId" class="crm-type-hub-relation__switch-label">{{ loc(descriptor.title) }}</TextSm>
			</div>
			<div v-show="enabled" class="crm-type-hub-relation__items">
				<div ref="typeSelector" class="crm-type-hub-relation__selector"></div>
				<label class="crm-type-hub-relation__children">
					<input
						type="checkbox"
						:data-name="descriptor.legacyBinding && descriptor.legacyBinding.dataName"
						:checked="showChildrenList"
						:disabled="disabled || readOnly"
						@change="handleChildrenListToggle"
					/>
					<span>{{ loc('CRM_TYPE_DETAIL_RELATION_CHILDREN_LIST') }}</span>
				</label>
				<div v-show="showChildrenList" ref="tabsSelector" class="crm-type-hub-relation__tabs-selector"></div>
			</div>
		</div>
	`
	});

	const DETACH_ITEM_ID = 0;
	const CrmTypeHubCustomSectionControl = ui_vue3.defineComponent({
		name: 'CrmTypeHubCustomSectionControl',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm
		},
		inject: {
			hubControlRegistry: {
				default: null
			}
		},
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			},
			compact: {
				type: Boolean,
				default: false
			},
			targetNode: {
				type: Object,
				default: null
			}
		},
		emits: ['update'],
		setup() {
			return {
				switcherOptions: {
					size: 'small',
					showStateTitle: false
				}
			};
		},
		data() {
			return {
				enabled: false,
				selector: null,
				settingsContainer: null,
				sectionsListContainer: null,
				permissionsResetAlert: null,
				isPermissionsResetAlertShown: false,
				customSections: [],
				originallySelectedCustomSection: null
			};
		},
		computed: {
			meta() {
				return readCustomSectionMeta(this.snapshot);
			},
			isSwitcherDisabled() {
				return this.disabled || this.readOnly || this.meta.switcherDisabled;
			},
			ariaChecked() {
				return this.enabled ? 'true' : 'false';
			},
			switcherLabelId() {
				return `crm-type-hub-custom-section-${this.descriptor.id}-label`;
			}
		},
		created() {
			this.loadSections(this.snapshot);
		},
		mounted() {
			this.initSelector();
			this.enabled = hasSelectedCustomSection(this.customSections);
			if (this.meta.isCreateSectionsViaAutomatedSolutionDetails) {
				crm_toolbarComponent.ToolbarComponent.Instance.subscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
			}
			getTopEventEmitter()?.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			this.registerInRegistry();
		},
		beforeUnmount() {
			this.releaseTopWindowSubscriptions();
			this.destroySelector();
			this.unregisterFromRegistry();
		},
		methods: {
			loadSections(baseline) {
				this.customSections = readCustomSections(baseline);
				this.originallySelectedCustomSection = this.customSections.find(s => s.isSelected) ?? null;
			},
			handleSliderDestroy(event) {
				const [sliderEvent] = event.getData();
				if (sliderEvent?.getSlider?.()?.getFrameWindow?.() !== window) {
					return;
				}
				this.releaseTopWindowSubscriptions();
				this.destroySelector();
			},
			releaseTopWindowSubscriptions() {
				crm_toolbarComponent.ToolbarComponent.Instance.unsubscribeAutomatedSolutionUpdatedEvent(this.onAutomatedSolutionUpdate);
				getTopEventEmitter()?.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			},
			destroySelector() {
				this.selector?.getDialog?.()?.destroy?.();
				this.selector?.unsubscribeAll?.();
				this.selector = null;
			},
			initSelector() {
				const items = [];
				const selectedItems = [];
				if (this.compact && canDetachCustomSection(this.snapshot, this.readOnly, this.disabled)) {
					const detachItem = {
						id: DETACH_ITEM_ID,
						entityId: 'custom-section',
						title: main_core.Loc.getMessage('CRM_TYPE_DETAIL_HUB_LOCATION_EMPTY') ?? '',
						tabs: 'recents'
					};
					items.push(detachItem);
					if (!hasSelectedCustomSection(this.customSections)) {
						selectedItems.push(detachItem);
					}
				}
				this.customSections.forEach(section => {
					const item = {
						id: section.id,
						entityId: 'custom-section',
						title: section.title,
						tabs: 'recents'
					};
					items.push(item);
					if (section.isSelected) {
						selectedItems.push(item);
					}
				});
				const adjustAlert = main_core.Runtime.debounce(this.adjustResetPermissionsAlert.bind(this), 200);
				const options = {
					multiple: false,
					dialogOptions: {
						items,
						selectedItems,
						dropdownMode: true,
						height: 200,
						showAvatars: false,
						targetNode: this.compact ? this.targetNode : null
					},
					events: {
						onAfterTagAdd: () => {
							this.syncEnabledFromSelection();
							adjustAlert();
							this.emitUpdate();
						},
						onAfterTagRemove: () => {
							this.syncEnabledFromSelection();
							adjustAlert();
							this.emitUpdate();
						}
					}
				};
				if (this.meta.isCreateSectionsViaAutomatedSolutionDetails) {
					options.showCreateButton = false;
					options.dialogOptions.footer = main_core.Tag.render`
					<a
						onclick="${this.onOpenAutomatedSolutionCreationSliderClick.bind(this)}"
						class="ui-selector-footer-link ui-selector-footer-link-add"
					>${main_core.Loc.getMessage('CRM_COMMON_ACTION_CREATE')}</a>
				`;
				} else {
					options.showCreateButton = true;
					options.createButtonCaption = main_core.Loc.getMessage('CRM_COMMON_ACTION_CONFIG');
					options.events.onCreateButtonClick = this.onCreateButtonClick.bind(this);
				}
				if (!this.meta.canEditAutomatedSolution) {
					options.locked = true;
				}
				this.selector = ui_vue3.markRaw(new ui_entitySelector.TagSelector(options));
				this.selector.renderTo(this.$refs.selector);
				this.settingsContainer = ui_vue3.markRaw(main_core.Tag.render`
				<div class="crm-type-hidden crm-type-custom-sections-settings-container">
					<div class="crm-type-relation-subtitle">${main_core.Loc.getMessage('CRM_TYPE_DETAIL_CUSTOM_SECTION_LIST_MSGVER_1')}</div>
				</div>
			`);
				this.$refs.container.append(this.settingsContainer);
			},
			reInitSelector() {
				this.destroySelector();
				main_core.Dom.clean(this.$refs.selector);
				this.initSelector();
			},
			syncEnabledFromSelection() {
				if (!this.compact) {
					return;
				}
				const selected = this.getSelectedSection();
				this.enabled = Boolean(selected) && String(selected?.id) !== String(DETACH_ITEM_ID);
			},
			openSelector() {
				if (!canEditCustomSection(this.snapshot, this.readOnly, this.disabled)) {
					return;
				}
				const dialog = this.selector?.getDialog?.();
				if (!dialog) {
					return;
				}
				if (this.compact && this.targetNode) {
					dialog.setTargetNode(this.targetNode);
				}
				if (dialog.isOpen?.()) {
					dialog.hide?.();
					return;
				}
				dialog.show?.();
			},
			getSelectedSection() {
				const selected = this.selector?.getDialog?.()?.getSelectedItems?.() ?? [];
				if (selected.length > 0) {
					return {
						id: selected[0].getId(),
						title: selected[0].getTitle()
					};
				}
				return null;
			},
			adjustResetPermissionsAlert() {
				if (this.meta.permissionsUrl === null || this.meta.isNew) {
					return;
				}
				const selected = this.getSelectedSection();
				const alert = this.getPermissionsResetAlert();
				const isItemChanged = selected?.id !== this.originallySelectedCustomSection?.id && this.enabled;
				const isDetach = this.originallySelectedCustomSection && !this.enabled;
				if (isItemChanged || isDetach) {
					if (!this.isPermissionsResetAlertShown) {
						this.isPermissionsResetAlertShown = true;
						alert.renderTo(this.$refs.container.parentNode);
						alert.show();
					}
					return;
				}
				if (this.isPermissionsResetAlertShown) {
					this.isPermissionsResetAlertShown = false;
					alert.hide();
				}
			},
			getPermissionsResetAlert() {
				if (this.permissionsResetAlert === null) {
					const text = (main_core.Loc.getMessage('CRM_TYPE_DETAIL_PERMISSIONS_WILL_BE_RESET_ALERT') ?? '').replace('#LINK#', this.meta.permissionsUrl ?? '');
					this.permissionsResetAlert = ui_vue3.markRaw(new ui_alerts.Alert({
						size: ui_alerts.AlertSize.MD,
						color: ui_alerts.AlertColor.WARNING,
						customClass: 'crm-type-permissions-reset-alert',
						text
					}));
				}
				return this.permissionsResetAlert;
			},
			onOpenAutomatedSolutionCreationSliderClick() {
				void crm_router.Router.Instance.openAutomatedSolutionDetail();
			},
			onCreateButtonClick() {
				main_core.Dom.addClass(this.$refs.selector, 'crm-type-hidden');
				this.showSectionsList();
			},
			onAutomatedSolutionUpdate(event) {
				const id = main_core.Text.toInteger(event.getData().intranetCustomSectionId);
				const title = String(event.getData().title);
				if (id <= 0 || !main_core.Type.isStringFilled(title)) {
					return;
				}
				const current = this.customSections.find(s => main_core.Text.toInteger(s.id) === id);
				if (current) {
					current.title = title;
				} else {
					this.customSections.push({
						id,
						title
					});
				}
				this.reInitSelector();
				this.selectCustomSectionById(id);
				this.emitUpdate();
			},
			selectCustomSectionById(id) {
				const dialog = this.selector?.getDialog?.();
				dialog?.deselectAll?.();
				dialog?.getItem?.({
					entityId: 'custom-section',
					id
				})?.select?.();
			},
			showSectionsList() {
				this.renderSectionsConfig();
				main_core.Dom.removeClass(this.settingsContainer, 'crm-type-hidden');
			},
			hideSectionsList() {
				if (this.sectionsListContainer) {
					main_core.Dom.clean(this.sectionsListContainer);
				}
				main_core.Dom.addClass(this.settingsContainer, 'crm-type-hidden');
			},
			renderSectionsConfig() {
				if (!this.sectionsListContainer) {
					this.sectionsListContainer = ui_vue3.markRaw(main_core.Tag.render`<div class="crm-type-custom-sections-list-container"></div>`);
					this.settingsContainer.append(this.sectionsListContainer);
					const addButton = new ui_buttons.Button({
						text: main_core.Loc.getMessage('CRM_COMMON_ACTION_CREATE') ?? '',
						icon: ui_buttons.Button.Icon.ADD,
						collapsedIcon: ui_buttons.Button.Icon.ADD,
						size: ui_buttons.ButtonSize.SMALL,
						style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
						useAirDesign: true,
						props: {
							'data-testid': 'crm-type-detail-custom-section-add-btn'
						},
						onclick: () => {
							this.sectionsListContainer.append(this.renderSectionItem());
							return {};
						}
					});
					this.settingsContainer.append(main_core.Tag.render`
					<div class="crm-type-custom-section-add-item-container">${addButton.render()}</div>
				`);
					this.settingsContainer.append(main_core.Tag.render`<hr class="crm-type-custom-sections-line">`);
					const buttons = main_core.Tag.render`<div class="crm-type-custom-sections-buttons-container"></div>`;
					buttons.append(new ui_buttons.Button({
						text: main_core.Loc.getMessage('CRM_COMMON_ACTION_SAVE') ?? '',
						collapsedIcon: ui_buttons.Button.Icon.DONE,
						size: ui_buttons.ButtonSize.MEDIUM,
						style: ui_buttons.AirButtonStyle.FILLED,
						useAirDesign: true,
						onclick: (_button, event) => {
							this.onSaveConfig(event);
							return {};
						}
					}).render());
					buttons.append(new ui_buttons.Button({
						text: main_core.Loc.getMessage('CRM_COMMON_ACTION_CANCEL') ?? '',
						collapsedIcon: ui_buttons.Button.Icon.CANCEL,
						size: ui_buttons.ButtonSize.MEDIUM,
						style: ui_buttons.AirButtonStyle.OUTLINE_NO_ACCENT,
						useAirDesign: true,
						onclick: (_button, event) => {
							this.onCancelConfig(event);
							return {};
						}
					}).render());
					this.settingsContainer.append(buttons);
				}
				main_core.Dom.clean(this.sectionsListContainer);
				this.customSections.forEach(section => {
					this.sectionsListContainer.append(this.renderSectionItem(section));
				});
				this.sectionsListContainer.append(this.renderSectionItem());
			},
			renderSectionItem(section = null) {
				const id = section ? section.id : `new_${main_core.Text.getRandom()}`;
				const value = section ? section.title : '';
				const node = main_core.Tag.render`
				<div class="crm-type-custom-sections-item ui-ctl ui-ctl-textbox ui-ctl-w100 ui-ctl-row">
					<input type="hidden" name="id" value="${id}" />
					<input class="ui-ctl-element" name="value" type="text" aria-label="${main_core.Text.encode(main_core.Loc.getMessage('CRM_TYPE_DETAIL_CUSTOM_SECTION_ITEM_NAME_LABEL') ?? '')}" value="${main_core.Text.encode(value)}">
				</div>
			`;
				const removeButton = new ui_buttons.Button({
					icon: ui_buttons.Button.Icon.REMOVE,
					collapsedIcon: ui_buttons.Button.Icon.REMOVE,
					style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
					useAirDesign: true,
					props: {
						'aria-label': main_core.Loc.getMessage('CRM_COMMON_ACTION_DELETE') ?? '',
						'data-testid': 'crm-type-detail-custom-section-remove-btn'
					},
					onclick: (_button, event) => {
						event.preventDefault();
						node.remove();
						return {};
					}
				});
				node.append(removeButton.render());
				return node;
			},
			onSaveConfig(event) {
				event.preventDefault();
				const selected = this.getSelectedSection();
				const next = [];
				[...this.sectionsListContainer.children].forEach(node => {
					const idInput = node.querySelector('[name="id"]');
					const valueInput = node.querySelector('[name="value"]');
					if (!idInput || !valueInput) {
						return;
					}
					const title = valueInput.value;
					if (title) {
						next.push({
							id: idInput.value,
							title,
							isSelected: Boolean(selected && isCustomSectionSelected(selected.id, idInput.value))
						});
					}
				});
				this.customSections = next;
				this.reInitSelector();
				main_core.Dom.removeClass(this.$refs.selector, 'crm-type-hidden');
				this.hideSectionsList();
				this.emitUpdate();
			},
			onCancelConfig(event) {
				event.preventDefault();
				main_core.Dom.removeClass(this.$refs.selector, 'crm-type-hidden');
				this.hideSectionsList();
			},
			handleSwitcherCheck() {
				this.enabled = true;
				this.adjustResetPermissionsAlert();
				this.emitUpdate();
			},
			handleSwitcherUncheck() {
				this.enabled = false;
				this.adjustResetPermissionsAlert();
				this.emitUpdate();
			},
			handleSwitcherKeydown(event) {
				if (this.isSwitcherDisabled || !['Enter', ' '].includes(event.key)) {
					return;
				}
				event.preventDefault();
				if (this.enabled) {
					this.handleSwitcherUncheck();
				} else {
					this.handleSwitcherCheck();
				}
			},
			getData() {
				let customSectionId = 0;
				if (this.enabled) {
					const selected = this.getSelectedSection();
					if (selected) {
						customSectionId = selected.id;
					}
				}
				return {
					customSectionId,
					customSections: this.customSections
				};
			},
			emitUpdate() {
				this.$emit('update', this.getData());
			},
			applySnapshot(baseline) {
				this.loadSections(baseline);
				this.reInitSelector();
				this.enabled = hasSelectedCustomSection(this.customSections);
				if (this.isPermissionsResetAlertShown) {
					this.isPermissionsResetAlertShown = false;
					this.permissionsResetAlert?.hide?.();
				}
			},
			reset(baseline) {
				this.applySnapshot(baseline);
			},
			registerInRegistry() {
				const registry = this.hubControlRegistry;
				if (registry) {
					registry[this.descriptor.id] = {
						applySnapshot: baseline => this.applySnapshot(baseline),
						reset: baseline => this.reset(baseline),
						openSelector: () => this.openSelector()
					};
				}
			},
			unregisterFromRegistry() {
				const registry = this.hubControlRegistry;
				if (registry) {
					delete registry[this.descriptor.id];
				}
			}
		},
		template: `
		<div class="crm-type-hub-custom-section" :class="{ '--disabled': disabled, '--compact': compact }">
			<div v-show="!compact" class="crm-type-hub-custom-section__switch">
				<div
					class="crm-type-hub-custom-section__switch-toggle"
					:tabindex="isSwitcherDisabled ? -1 : 0"
					role="switch"
					:aria-checked="ariaChecked"
					:aria-labelledby="switcherLabelId"
					data-testid="crm-type-detail-custom-section-switch"
					@keydown="handleSwitcherKeydown"
				>
					<Switcher
						:is-checked="enabled"
						:is-disabled="isSwitcherDisabled"
						:options="switcherOptions"
						:id="descriptor.legacyBinding && descriptor.legacyBinding.switcherId"
						aria-hidden="true"
						@check="handleSwitcherCheck"
						@uncheck="handleSwitcherUncheck"
					/>
				</div>
				<TextSm :id="switcherLabelId">{{ loc('CRM_TYPE_DETAIL_CUSTOM_SECTION_SWITCHER_MSGVER_1') }}</TextSm>
			</div>
			<div
				v-show="compact || enabled"
				ref="container"
				class="crm-type-custom-section-container"
				:class="{ 'crm-type-hub-custom-section__host': compact }"
			>
				<div v-show="!compact" class="crm-type-relation-subtitle">{{ loc('CRM_TYPE_DETAIL_CUSTOM_SECTION_LABEL_MSGVER_1') }}</div>
				<div ref="selector"></div>
			</div>
		</div>
	`
	});
	function getTopEventEmitter() {
		return window.top?.BX?.Event?.EventEmitter ?? null;
	}

	const CrmTypeHubLinkedUserFieldsControl = ui_vue3.defineComponent({
		name: 'CrmTypeHubLinkedUserFieldsControl',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			descriptor: {
				type: Object,
				required: true
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update'],
		computed: {
			items() {
				const meta = this.snapshot.linkedUserFieldsMeta;
				return Array.isArray(meta) ? meta : [];
			},
			values() {
				const raw = this.snapshot[this.descriptor.itemsKey];
				return main_core.Type.isObjectLike(raw) ? raw : {};
			}
		},
		methods: {
			isChecked(name) {
				return Boolean(this.values[name]);
			},
			iconClass(name) {
				return name.includes('CALENDAR') ? 'crm-type-field-icon-type3' : 'crm-type-field-icon-type2';
			},
			handleToggle(name, event) {
				const checked = event.target.checked;
				this.$emit('update', {
					...this.values,
					[name]: checked
				});
			}
		},
		template: `
		<div class="crm-type-hub-linked-user-fields" :class="{ '--disabled': disabled }">
			<TextSm class="crm-type-hub-linked-user-fields__title">{{ loc(descriptor.title) }}</TextSm>
			<label
				v-for="item in items"
				:key="item.name"
				class="crm-type-hub-linked-user-fields__item"
			>
				<input
					type="checkbox"
					:data-name="'linkedUserFields[' + item.name + ']'"
					:data-testid="'crm-type-detail-linked-user-field-' + item.name"
					:checked="isChecked(item.name)"
					:disabled="disabled || readOnly"
					@change="handleToggle(item.name, $event)"
				/>
				<span class="crm-type-hub-linked-user-fields__item-icon" :class="iconClass(item.name)"></span>
				<span class="crm-type-hub-linked-user-fields__item-text">{{ item.title }}</span>
			</label>
		</div>
	`
	});

	function resolveFeatureCardCopy(layoutValue, recordValue) {
		return layoutValue ?? recordValue ?? '';
	}

	function resolveFeatureCardDisabled(record, snapshot) {
		const gate = record.disabled;
		const isBackendDisabled = gate ? Boolean(snapshot[gate.condition]) : false;
		return {
			disabled: isBackendDisabled,
			reason: isBackendDisabled && gate ? gate.reasonSource : ''
		};
	}

	const CrmTypeHubCardsSection = ui_vue3.defineComponent({
		name: 'CrmTypeHubCardsSection',
		components: {
			CrmHubCard: crm_settingsHub.CrmHubCard,
			CrmHubControlRenderer: crm_settingsHub.CrmHubControlRenderer,
			CrmHubFeatureCard: crm_settingsHub.CrmHubFeatureCard,
			BInput: ui_system_input_vue.BInput,
			UiButton: ui_vue3_components_button.Button,
			TextSm: ui_system_typography_vue.TextSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			layout: {
				type: Object,
				required: true
			},
			records: {
				type: Array,
				default: () => []
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			controls: {
				type: Object,
				default: null
			}
		},
		emits: ['update', 'action'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				InputSize: ui_system_input_vue.InputSize,
				DAYS_OWNER_RECORD_ID
			};
		},
		computed: {
			actionUrls() {
				return this.snapshot.hubActionUrls ?? {};
			},
			featureCards() {
				return this.layout.cards.map(card => {
					const record = this.findRecord(card.recordId);
					if (!record) {
						return null;
					}
					const checked = Boolean(this.snapshot[record.valueKey]);
					return {
						...card,
						record,
						checked,
						...resolveFeatureCardDisabled(record, this.snapshot),
						isActionVisible: resolveFeatureCardAction(card.action, checked, this.actionUrls)
					};
				}).filter(Boolean);
			},
			daysRecord() {
				return this.findRecord(DAYS_RECORD_ID);
			},
			daysValue() {
				const raw = this.daysRecord ? this.snapshot[this.daysRecord.valueKey] : '';
				return raw === null || raw === undefined ? '' : String(raw);
			},
			restRecords() {
				return this.records.filter(record => !this.layout.layoutRecordIds.includes(record.id));
			}
		},
		methods: {
			findRecord(id) {
				return this.records.find(record => record.id === id) ?? null;
			},
			featureTitle(card) {
				return resolveFeatureCardCopy(card.title, card.record.title);
			},
			featureDescription(card) {
				return resolveFeatureCardCopy(card.description, card.record.description);
			},
			handleFeatureUpdate(card, value) {
				this.$emit('update', {
					id: card.record.id,
					valueKey: card.record.valueKey,
					value
				});
				this.announceActionRevealed(card.record.id);
			},
			announceActionRevealed(recordId) {
				void this.$nextTick(() => {
					const card = this.featureCards.find(item => item.record.id === recordId);
					if (!card || !card.isActionVisible || !card.action) {
						return;
					}
					ui_a11y.LiveAnnouncer.announce(this.loc('CRM_TYPE_DETAIL_HUB_ACTION_REVEALED', {
						'#ACTION#': this.loc(card.action.text)
					}), 'polite');
				});
			},
			handleCardAction(card) {
				if (card.action) {
					this.$emit('action', {
						id: card.record.id,
						actionKey: card.action.actionKey
					});
				}
			},
			handleDaysUpdate(value) {
				const record = this.daysRecord;
				if (record) {
					this.$emit('update', {
						id: record.id,
						valueKey: record.valueKey,
						value
					});
				}
			}
		},
		template: `
		<div :class="layout.rootClass" :data-testid="'crm-type-hub-cards-' + layout.sectionId">
			<CrmHubCard
				class="crm-type-hub-cards__card"
				:card-id="layout.cardId"
				:title="layout.title"
				:icon="layout.icon"
			>
				<div v-if="layout.intro" class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc(layout.intro.text) }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="card in featureCards"
						:key="card.record.id"
						:feature-id="card.record.id"
						:title="featureTitle(card)"
						:description="featureDescription(card)"
						:icon="card.icon"
						:checked="card.checked"
						:disabled="card.disabled || readOnly"
						:reason="card.reason"
						@update="handleFeatureUpdate(card, $event)"
					>
						<template v-if="card.isActionVisible" #action>
							<UiButton
								:text="loc(card.action.text)"
								:size="ButtonSize.MEDIUM"
								:style="AirButtonStyle.OUTLINE_NO_ACCENT"
								:left-icon="card.action.icon"
								:dataset="{ testid: 'crm-type-hub-action-' + card.record.id }"
								@click="handleCardAction(card)"
							/>
						</template>
						<!--
							The days field belongs to the switch above it: with "Сроки" off there are no dates on
							the element at all, so a deadline in days has nothing to count from. Gated on
							card.checked, the same gate the action buttons use.

							Its caption is the input's own label, not a line of text laid above it by hand. The
							hand-rolled one only looked like a label — nothing tied it to the field, and the
							accessible name came from a different phrase entirely (the descriptor's title), so a
							screen reader announced one thing while the eye read another. One phrase now does
							both jobs.
						-->
						<template v-if="card.record.id === DAYS_OWNER_RECORD_ID && daysRecord && card.checked" #control>
							<BInput
								class="crm-type-hub-cards__days"
								:model-value="daysValue"
								:size="InputSize.Md"
								type="number"
								:label="loc('CRM_TYPE_DETAIL_HUB_FEATURE_DATES_NOTE')"
								:aria-label="loc('CRM_TYPE_DETAIL_HUB_FEATURE_DATES_NOTE')"
								:readonly="readOnly"
								data-testid="crm-type-hub-main-days-input"
								@update:modelValue="handleDaysUpdate"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
			</CrmHubCard>

			<CrmHubCard v-if="restRecords.length" :card-id="layout.cardId + '-rest'">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:read-only="readOnly"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`
	});

	function isCreationEditPinned(creationMode, readOnly) {
		return creationMode && !readOnly;
	}

	function resolvePlacementTitle(sections, customSectionId) {
		const currentId = String(customSectionId ?? 0);
		if (currentId === '0' || currentId === '') {
			return null;
		}
		const selected = sections.find(section => String(section.id) === currentId);
		return selected?.title ?? null;
	}
	function resolvePlacementButtonLabel(placementTitle) {
		return placementTitle === null ? {
			code: 'CRM_TYPE_DETAIL_HUB_LOCATION_CRM',
			title: ''
		} : {
			code: '',
			title: placementTitle
		};
	}

	const CrmTypeHubPassport = ui_vue3.defineComponent({
		name: 'CrmTypeHubPassport',
		components: {
			CrmHubPassportHero: crm_settingsHub.CrmHubPassportHero,
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			records: {
				type: Array,
				default: () => []
			},
			snapshot: {
				type: Object,
				required: true
			},
			readOnly: {
				type: Boolean,
				default: false
			},
			controls: {
				type: Object,
				default: null
			},
			showCreationSaveButton: {
				type: Boolean,
				default: false
			},
			creationSaveInProgress: {
				type: Boolean,
				default: false
			},
			creationSaveDisabled: {
				type: Boolean,
				default: false
			},
			creationMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update', 'creation-save', 'creation-cancel'],
		watch: {
			readOnly(readOnly) {
				if (!this.creationMode) {
					return;
				}
				if (readOnly) {
					this.$refs.hero?.stopEdit?.();
				} else {
					this.focusTitle();
				}
			}
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				placementAnchor: null
			};
		},
		mounted() {
			this.placementAnchor = this.$refs.placementAnchor ?? null;
			this.pinEditMode();
			this.focusTitle();
		},
		computed: {
			titleRecord() {
				return this.findRecord('sp-title');
			},
			title() {
				return String(this.snapshot.title ?? '');
			},
			descriptionRecord() {
				return this.findRecord('sp-description');
			},
			description() {
				return String(this.snapshot.description ?? '');
			},
			customSectionRecord() {
				return this.findRecord('sp-custom-section');
			},
			customSectionControl() {
				const record = this.customSectionRecord;
				return record ? this.controls?.[record.controlType] ?? null : null;
			},
			placementTitle() {
				return resolvePlacementTitle(readCustomSections(this.snapshot), this.snapshot.customSectionId);
			},
			placementText() {
				const label = resolvePlacementButtonLabel(this.placementTitle);
				const name = label.title || (this.loc(label.code) ?? '');
				return this.loc('CRM_TYPE_DETAIL_HUB_LOCATION_BUTTON', {
					'#TITLE#': name
				}) ?? name;
			},
			creationSaveText() {
				return this.loc('CRM_TYPE_DETAIL_HUB_CREATION_SAVE_BUTTON') ?? '';
			},
			creationCancelText() {
				return this.loc('CRM_TYPE_DETAIL_HUB_CREATION_CANCEL_BUTTON') ?? '';
			},
			isCreationSaveBlocked() {
				return this.creationSaveDisabled || this.creationSaveInProgress;
			},
			isCreationSaveButtonDisabled() {
				return this.creationSaveDisabled && !this.creationSaveInProgress;
			},
			isPlacementDisabled() {
				return !canEditCustomSection(this.snapshot, this.readOnly);
			}
		},
		methods: {
			findRecord(id) {
				return this.records.find(record => record.id === id) ?? null;
			},
			pinEditMode() {
				if (!this.creationMode) {
					return;
				}
				const hero = this.$refs.hero;
				hero?.$watch?.('isEditing', editing => {
					if (!editing && isCreationEditPinned(this.creationMode, this.readOnly)) {
						hero.isEditing = true;
					}
				});
			},
			focusTitle() {
				if (!this.creationMode) {
					return;
				}
				const hero = this.$refs.hero;
				hero?.startEdit?.();
			},
			handleTitleUpdate(value) {
				const record = this.titleRecord;
				if (record) {
					this.$emit('update', {
						id: record.id,
						valueKey: record.valueKey,
						value
					});
				}
			},
			handleDescriptionUpdate(value) {
				const record = this.descriptionRecord;
				if (record) {
					this.$emit('update', {
						id: record.id,
						valueKey: record.valueKey,
						value
					});
				}
			},
			handleCustomSectionUpdate(value) {
				const record = this.customSectionRecord;
				if (record) {
					this.$emit('update', {
						id: record.id,
						valueKey: record.valueKey,
						value
					});
				}
			},
			openPlacementSelector() {
				this.$refs.customSectionControl?.openSelector?.();
			},
			handleCreationSave() {
				if (this.isCreationSaveBlocked) {
					return;
				}
				this.$emit('creation-save');
			},
			handleCreationCancel() {
				if (this.creationSaveInProgress) {
					return;
				}
				this.$emit('creation-cancel');
			}
		},
		template: `
		<CrmHubPassportHero
			ref="hero"
			class="crm-type-hub-passport"
			:title="title"
			:title-label="titleRecord ? titleRecord.title : ''"
			:description="description"
			:description-placeholder="creationMode ? '' : 'CRM_TYPE_DETAIL_HUB_DESCRIPTION_PLACEHOLDER'"
			:description-read-only="readOnly"
			limit-description
			:read-only="readOnly"
			@update:title="handleTitleUpdate"
			@update:description="handleDescriptionUpdate"
		>
			<!--
				Outline accent-2 on both screens, the stock AIR style and nothing painted by hand; the
				caption, the dropdown, the disabled state and the dialog are the same on both screens.
				The anchor is capped at the width of the column, so a long workplace name is cut by the
				button's own ellipsis instead of pushing the hero wider (src/style.css).
			-->
			<template v-if="customSectionRecord" #placement>
				<span ref="placementAnchor" class="crm-type-hub-passport__placement-anchor">
					<UiButton
						:text="placementText"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						:size="ButtonSize.MEDIUM"
						dropdown
						:disabled="isPlacementDisabled"
						:dataset="{ testid: 'crm-type-hub-main-location-btn' }"
						@click="openPlacementSelector"
					/>
				</span>
				<component
					:is="customSectionControl"
					v-if="customSectionControl"
					ref="customSectionControl"
					:descriptor="customSectionRecord"
					:snapshot="snapshot"
					:read-only="readOnly"
					:target-node="placementAnchor"
					compact
					data-testid="crm-type-hub-main-location-control"
					@update="handleCustomSectionUpdate"
				/>
			</template>
			<!--
				The "action" slot of the kit draws the tinted row under the hero. The v-if sits on the
				slot template itself, so with the flag off the slot is not handed over to the kit at
				all and that row stays unrendered: the editing screen keeps today's markup.
				"Сохранить" and "Отменить" stand in one row, as on the creation screen of a workplace:
				the same plain style of the cancel, the same gap between the two (src/style.css).
			-->
			<template v-if="showCreationSaveButton" #action>
				<div class="crm-type-hub-passport__creation-actions">
					<UiButton
						:text="creationSaveText"
						:style="AirButtonStyle.FILLED"
						:size="ButtonSize.MEDIUM"
						:loading="creationSaveInProgress"
						:disabled="isCreationSaveButtonDisabled"
						:dataset="{ testid: 'crm-type-hub-creation-save-btn' }"
						@click="handleCreationSave"
					/>
					<UiButton
						:text="creationCancelText"
						:style="AirButtonStyle.PLAIN"
						:size="ButtonSize.MEDIUM"
						:disabled="creationSaveInProgress"
						:dataset="{ testid: 'crm-type-hub-creation-cancel-btn' }"
						@click="handleCreationCancel"
					/>
				</div>
			</template>
		</CrmHubPassportHero>
	`
	});

	const PERMISSIONS_CARD_ICON = 'o-roles-library';
	const PERMISSIONS_RECORD_ID = 'sp-permissions';
	const PERMISSIONS_LAYOUT_RECORD_IDS = [PERMISSIONS_RECORD_ID];

	const CrmTypeHubPermissionsSection = ui_vue3.defineComponent({
		name: 'CrmTypeHubPermissionsSection',
		components: {
			CrmHubCard: crm_settingsHub.CrmHubCard,
			CrmHubControlRenderer: crm_settingsHub.CrmHubControlRenderer,
			CrmHubOptionRow: crm_settingsHub.CrmHubOptionRow,
			UiButton: ui_vue3_components_button.Button,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TextSm: ui_system_typography_vue.TextSm
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			records: {
				type: Array,
				default: () => []
			},
			snapshot: {
				type: Object,
				required: true
			},
			controls: {
				type: Object,
				default: null
			}
		},
		emits: ['update', 'action'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				PERMISSIONS_CARD_ICON
			};
		},
		computed: {
			restRecords() {
				return this.records.filter(record => !PERMISSIONS_LAYOUT_RECORD_IDS.includes(record.id));
			}
		},
		methods: {
			handleOpen() {
				this.$emit('action', {
					id: PERMISSIONS_RECORD_ID,
					actionKey: PERMISSIONS_ACTION
				});
			}
		},
		template: `
		<div class="crm-type-hub-permissions" data-testid="crm-type-detail-hub-permissions-section">
			<HeadlineSm tag="h2" class="crm-type-hub-section-title">{{ loc('CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS') }}</HeadlineSm>
			<TextSm class="crm-type-hub-section-intro">{{ loc('CRM_TYPE_DETAIL_HUB_PERMISSIONS_INTRO') }}</TextSm>
			<CrmHubCard
				card-id="permissions"
				:title="'CRM_TYPE_DETAIL_HUB_PERMISSIONS_CARD_TITLE'"
				:icon="PERMISSIONS_CARD_ICON"
				collapsible
			>
				<CrmHubOptionRow
					row-id="permissions-open"
					title="CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_TITLE"
					description="CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_DESCRIPTION"
					:checked="null"
					last
					test-id="crm-type-detail-hub-permissions-row"
				>
					<template #action>
						<UiButton
							:text="loc('CRM_TYPE_DETAIL_HUB_PERMISSIONS_OPEN')"
							:size="ButtonSize.SMALL"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:dataset="{ testid: 'crm-type-detail-hub-permissions-open-btn' }"
							@click="handleOpen"
						/>
					</template>
				</CrmHubOptionRow>
			</CrmHubCard>
			<CrmHubCard v-if="restRecords.length" card-id="permissions-rest">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`
	});

	function findEntry(entries, entityTypeId) {
		return entries.find(entry => Number(entry.entityTypeId) === entityTypeId) ?? null;
	}
	function readState(baseline) {
		return {
			parent: readRelationEntries(baseline, 'parent').map(entry => ({
				...entry
			})),
			child: readRelationEntries(baseline, 'child').map(entry => ({
				...entry
			}))
		};
	}
	function buildOptions(baseline, entityTypeId, inParentCatalog, inChildCatalog) {
		const state = readState(baseline);
		const options = [];
		if (inParentCatalog) {
			const entry = findEntry(state.parent, entityTypeId);
			options.push({
				id: `parent-field-${entityTypeId}`,
				direction: 'parent',
				kind: 'field',
				entityTypeId,
				checked: Boolean(entry)
			}, {
				id: `parent-children-list-${entityTypeId}`,
				direction: 'parent',
				kind: 'children-list',
				entityTypeId,
				checked: Boolean(entry && entry.isChildrenListEnabled)
			});
		}
		if (inChildCatalog) {
			const entry = findEntry(state.child, entityTypeId);
			options.push({
				id: `child-field-${entityTypeId}`,
				direction: 'child',
				kind: 'field',
				entityTypeId,
				checked: Boolean(entry)
			}, {
				id: `child-children-list-${entityTypeId}`,
				direction: 'child',
				kind: 'children-list',
				entityTypeId,
				checked: Boolean(entry && entry.isChildrenListEnabled)
			});
		}
		return options;
	}
	function buildRelationRows(baseline) {
		const parentCatalog = readRelationCatalog(baseline, 'parent');
		const childCatalog = readRelationCatalog(baseline, 'child');
		const parentIds = new Set(parentCatalog.map(item => Number(item.entityTypeId)));
		const childIds = new Set(childCatalog.map(item => Number(item.entityTypeId)));
		const titles = new Map();
		const order = [];
		[...parentCatalog, ...childCatalog].forEach(item => {
			const entityTypeId = Number(item.entityTypeId);
			if (!titles.has(entityTypeId)) {
				titles.set(entityTypeId, item.title);
				order.push(entityTypeId);
			}
		});
		return order.map(entityTypeId => {
			const options = buildOptions(baseline, entityTypeId, parentIds.has(entityTypeId), childIds.has(entityTypeId));
			return {
				entityTypeId,
				title: titles.get(entityTypeId) ?? '',
				options,
				checked: options.some(option => option.checked)
			};
		});
	}
	function splitRelationRowsByKind(rows, coreEntityTypeIds) {
		const core = new Set(coreEntityTypeIds);
		return {
			crmRows: rows.filter(row => core.has(row.entityTypeId)),
			smartProcessRows: rows.filter(row => !core.has(row.entityTypeId))
		};
	}
	function applyRelationOption(baseline, option, checked) {
		const state = readState(baseline);
		const entries = state[option.direction];
		const entry = findEntry(entries, option.entityTypeId);
		if (option.kind === 'children-list') {
			if (entry) {
				entry.entityTypeId = option.entityTypeId;
				entry.isChildrenListEnabled = checked;
			} else if (checked) {
				entries.push({
					entityTypeId: option.entityTypeId,
					isChildrenListEnabled: true
				});
			}
			return state;
		}
		if (checked) {
			if (!entry) {
				entries.push({
					entityTypeId: option.entityTypeId,
					isChildrenListEnabled: false
				});
			}
			return state;
		}
		state[option.direction] = entries.filter(item => Number(item.entityTypeId) !== option.entityTypeId);
		return state;
	}
	const RELATION_DIRECTIONS = ['parent', 'child'];
	function clearRelationRow(baseline, row) {
		const state = readState(baseline);
		RELATION_DIRECTIONS.forEach(direction => {
			state[direction] = state[direction].filter(item => Number(item.entityTypeId) !== row.entityTypeId);
		});
		return state;
	}
	function isDirectionOn(row, direction) {
		return row.options.some(option => option.direction === direction && option.kind === 'field' && option.checked);
	}
	function hasDirection(row, direction) {
		return row.options.some(option => option.direction === direction);
	}
	function scenarioOfRow(row) {
		const parent = isDirectionOn(row, 'parent');
		const child = isDirectionOn(row, 'child');
		if (parent && child) {
			return 'both';
		}
		if (parent) {
			return 'parent';
		}
		if (child) {
			return 'child';
		}
		return null;
	}
	function availableScenarios(row) {
		const parent = hasDirection(row, 'parent');
		const child = hasDirection(row, 'child');
		if (parent && child) {
			return ['parent', 'child', 'both'];
		}
		if (parent) {
			return ['parent'];
		}
		if (child) {
			return ['child'];
		}
		return [];
	}
	function applyRelationScenario(baseline, row, scenario) {
		const state = readState(baseline);
		const isReapply = scenarioOfRow(row) === scenario;
		RELATION_DIRECTIONS.forEach(direction => {
			if (scenario !== 'both' && scenario !== direction) {
				state[direction] = state[direction].filter(item => Number(item.entityTypeId) !== row.entityTypeId);
				return;
			}
			if (!hasDirection(row, direction)) {
				return;
			}
			const entry = findEntry(state[direction], row.entityTypeId);
			if (entry) {
				entry.entityTypeId = row.entityTypeId;
				if (isReapply) {
					entry.isChildrenListEnabled = true;
				}
			} else {
				state[direction].push({
					entityTypeId: row.entityTypeId,
					isChildrenListEnabled: true
				});
			}
		});
		return state;
	}

	function buildLinkedUserFieldRows(meta, values) {
		return meta.map(item => ({
			name: item.name,
			title: item.title,
			isEnabled: Boolean(values[item.name])
		}));
	}

	function seedRevealedSmartProcessIds(rows) {
		return rows.filter(row => row.checked).map(row => row.entityTypeId);
	}
	function withRevealedSmartProcessId(revealed, entityTypeId) {
		return revealed.includes(entityTypeId) ? revealed : [...revealed, entityTypeId];
	}
	function filterRevealedSmartProcessRows(rows, revealed) {
		return rows.filter(row => row.checked || revealed.includes(row.entityTypeId));
	}

	function buildSmartProcessDialogItems(rows) {
		const items = [];
		const selectedItems = [];
		rows.forEach(row => {
			const item = {
				id: row.entityTypeId,
				entityId: 'crmType',
				title: row.title,
				tabs: 'recents'
			};
			(row.checked ? selectedItems : items).push(item);
		});
		return {
			items,
			selectedItems
		};
	}

	function resolvePopupAnchor(source) {
		if (isElementNode(source)) {
			return source;
		}
		const element = source?.$el;
		if (isElementNode(element)) {
			return element;
		}
		return null;
	}
	function isElementNode(value) {
		return value?.nodeType === Node.ELEMENT_NODE;
	}

	const CRM_CORE_ENTITY_TYPE_IDS = [1,
	2,
	3,
	4,
	7,
	14,
	31
	];
	const SMART_PROCESS_ROWS_CONTROL_ID = 'sp-smart-process-rows';
	const USE_IN_USERFIELD_RECORD_ID = 'sp-use-in-userfield';
	const LINKED_USER_FIELDS_RECORD_ID = 'sp-linked-user-fields';
	const RELATIONS_CARD_ICON = Object.freeze({
		Crm: 'o-crm',
		Portal: 'o-settings'
	});
	const RELATIONS_LAYOUT_RECORD_IDS = ['sp-relation-parent', 'sp-relation-child', USE_IN_USERFIELD_RECORD_ID, LINKED_USER_FIELDS_RECORD_ID];
	const RELATION_ROW_ICON = Object.freeze({
		1: 'o-lead',
		2: 'o-my-deals',
		3: 'o-person',
		4: 'o-company',
		7: 'o-quote',
		14: 'o-shop-order',
		31: 'o-invoice'
	});
	const RELATION_ROW_DESCRIPTION = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_DEAL',
		3: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_CONTACT',
		4: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_COMPANY',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_INVOICE'
	});
	const SMART_PROCESS_ROW_ICON = 'o-smart-process';
	const PORTAL_ROW_ICON = Object.freeze({
		'CALENDAR_EVENT|UF_CRM_CAL_EVENT': 'o-calendar',
		'TASKS_TASK|UF_CRM_TASK': 'o-task',
		'TASKS_TASK_TEMPLATE|UF_CRM_TASK': 'o-task'
	});
	const PORTAL_ROW_DESCRIPTION = Object.freeze({
		'CALENDAR_EVENT|UF_CRM_CAL_EVENT': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_CALENDAR',
		'TASKS_TASK|UF_CRM_TASK': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK',
		'TASKS_TASK_TEMPLATE|UF_CRM_TASK': 'CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK_TEMPLATE'
	});
	const PORTAL_MASTER_ROW_ICON = 'o-crm';
	const RELATION_OPTION_PHRASE = Object.freeze({
		'parent-field': 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_NAMED',
		'parent-children-list': 'CRM_TYPE_DETAIL_HUB_RELATION_CHILDREN_LIST',
		'child-field': 'CRM_TYPE_DETAIL_HUB_RELATION_CHILD_FIELD'
	});
	const RELATION_PARENT_FIELD_TITLE = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_DEAL',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_INVOICE'
	});
	const RELATION_GROUP_KEY = Object.freeze({
		Process: 'process',
		Entity: 'entity'
	});
	const RELATION_OPTION_GROUP = Object.freeze({
		'parent-field': RELATION_GROUP_KEY.Process,
		'parent-children-list': RELATION_GROUP_KEY.Entity,
		'child-field': RELATION_GROUP_KEY.Entity,
		'child-children-list': RELATION_GROUP_KEY.Process
	});
	const RELATION_ENTITY_ONE = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_DEAL',
		3: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_CONTACT',
		4: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_COMPANY',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_INVOICE'
	});
	const RELATION_ENTITY_MANY = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_DEAL',
		3: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_CONTACT',
		4: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_COMPANY',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_INVOICE'
	});
	const RELATION_ENTITY_IN = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_DEAL',
		3: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_CONTACT',
		4: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_COMPANY',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_IN_INVOICE'
	});
	const RELATION_ENTITY_PLURAL = Object.freeze({
		1: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_LEAD',
		2: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_DEAL',
		3: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_CONTACT',
		4: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_COMPANY',
		7: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_QUOTE',
		14: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_ORDER',
		31: 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_INVOICE'
	});
	const RELATION_NAMED_ONE = 'CRM_TYPE_DETAIL_HUB_RELATION_ONE_NAMED';
	const RELATION_NAMED_MANY = 'CRM_TYPE_DETAIL_HUB_RELATION_MANY_NAMED';
	const RELATION_NAMED_IN = 'CRM_TYPE_DETAIL_HUB_RELATION_IN_NAMED';
	const RELATION_NAMED_PLURAL = 'CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_NAMED';
	const RELATION_SENTENCE = Object.freeze({
		oneToMany: 'CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_ONE_TO_MANY',
		both: 'CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_BOTH'
	});
	const RELATION_CONSEQUENCE = Object.freeze({
		parent: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_PARENT',
		child: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_CHILD',
		both: 'CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_BOTH'
	});
	const RELATION_SCENARIO_LABEL = Object.freeze({
		parent: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_PARENT',
		child: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_CHILD',
		both: 'CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_BOTH'
	});

	function verbatim(title) {
		return {
			code: '',
			title
		};
	}
	function entityPart(forms, namedCode, entityTypeId, rowTitle) {
		const code = forms[entityTypeId];
		return code ? {
			code,
			title: ''
		} : {
			code: namedCode,
			title: rowTitle
		};
	}
	function buildRelationSentence(scenario, entityTypeId, rowTitle, processTitle) {
		const entityIsHead = scenario !== 'child';
		return {
			code: scenario === 'both' ? RELATION_SENTENCE.both : RELATION_SENTENCE.oneToMany,
			parts: {
				ONE: entityIsHead ? entityPart(RELATION_ENTITY_ONE, RELATION_NAMED_ONE, entityTypeId, rowTitle) : {
					code: RELATION_NAMED_ONE,
					title: processTitle
				},
				MANY: entityIsHead ? {
					code: RELATION_NAMED_MANY,
					title: processTitle
				} : entityPart(RELATION_ENTITY_MANY, RELATION_NAMED_MANY, entityTypeId, rowTitle)
			}
		};
	}
	function buildRelationConsequence(scenario, entityTypeId, rowTitle, processTitle) {
		if (scenario === 'both') {
			return {
				code: RELATION_CONSEQUENCE.both,
				parts: {}
			};
		}
		if (scenario === 'parent') {
			return {
				code: RELATION_CONSEQUENCE.parent,
				parts: {
					PROCESS: verbatim(processTitle),
					IN: entityPart(RELATION_ENTITY_IN, RELATION_NAMED_IN, entityTypeId, rowTitle)
				}
			};
		}
		return {
			code: RELATION_CONSEQUENCE.child,
			parts: {
				PROCESS: verbatim(processTitle),
				MANY: entityPart(RELATION_ENTITY_MANY, RELATION_NAMED_MANY, entityTypeId, rowTitle)
			}
		};
	}
	function buildScenarioLabel(scenario, entityTypeId, rowTitle) {
		if (scenario === 'parent') {
			return {
				code: RELATION_SCENARIO_LABEL.parent,
				parts: {
					IN: entityPart(RELATION_ENTITY_IN, RELATION_NAMED_IN, entityTypeId, rowTitle)
				}
			};
		}
		if (scenario === 'child') {
			return {
				code: RELATION_SCENARIO_LABEL.child,
				parts: {
					PLURAL: entityPart(RELATION_ENTITY_PLURAL, RELATION_NAMED_PLURAL, entityTypeId, rowTitle)
				}
			};
		}
		return {
			code: RELATION_SCENARIO_LABEL[scenario] ?? '',
			parts: {}
		};
	}
	function splitFramePhrase(frame, values) {
		const chunks = [];
		let rest = frame;
		for (;;) {
			let at = -1;
			let key = '';
			for (const name of Object.keys(values)) {
				const index = rest.indexOf(`#${name}#`);
				if (index !== -1 && (at === -1 || index < at)) {
					at = index;
					key = name;
				}
			}
			if (at === -1) {
				break;
			}
			if (at > 0) {
				chunks.push({
					text: rest.slice(0, at),
					slot: false
				});
			}
			chunks.push({
				text: values[key],
				slot: true
			});
			rest = rest.slice(at + key.length + 2);
		}
		if (rest !== '') {
			chunks.push({
				text: rest,
				slot: false
			});
		}
		return chunks;
	}

	function groupRelationOptions(options) {
		const groups = [];
		const byTitle = new Map();
		options.forEach(option => {
			const title = RELATION_OPTION_GROUP[`${option.direction}-${option.kind}`];
			if (!title) {
				return;
			}
			let group = byTitle.get(title);
			if (!group) {
				group = {
					key: title,
					title,
					options: []
				};
				byTitle.set(title, group);
				groups.push(group);
			}
			group.options.push(option);
		});
		return groups;
	}

	const CARD_KEY_BY_GROUP = Object.freeze({
		[RELATION_GROUP_KEY.Process]: 'process',
		[RELATION_GROUP_KEY.Entity]: 'entity'
	});
	const CARD_ORDER = ['process', 'entity'];
	function buildRelationPreviewCards(options) {
		const cards = CARD_ORDER.map(key => ({
			key,
			field: null,
			tab: null
		}));
		groupRelationOptions(options).forEach(group => {
			const card = cards.find(item => item.key === CARD_KEY_BY_GROUP[group.key]);
			if (!card) {
				return;
			}
			group.options.forEach(option => {
				if (option.kind === 'field') {
					card.field ??= option;
				} else {
					card.tab ??= option;
				}
			});
		});
		return cards;
	}

	function resolveRelationOptionTitle(option, rowTitle, processTitle) {
		if (option.direction === 'parent' && option.kind === 'field') {
			const instrumental = RELATION_PARENT_FIELD_TITLE[option.entityTypeId];
			return instrumental ? {
				code: instrumental,
				title: ''
			} : {
				code: RELATION_OPTION_PHRASE['parent-field'],
				title: rowTitle
			};
		}
		if (option.direction === 'child' && option.kind === 'children-list') {
			return {
				code: RELATION_OPTION_PHRASE['parent-children-list'],
				title: rowTitle
			};
		}
		return {
			code: RELATION_OPTION_PHRASE[`${option.direction}-${option.kind}`] ?? '',
			title: processTitle
		};
	}

	function resolveRelationPhraseParts(phrase, loc) {
		const values = {};
		Object.keys(phrase.parts).forEach(key => {
			const part = phrase.parts[key];
			values[key] = part.code === '' ? part.title : (loc(part.code) ?? '').replace('#TITLE#', () => part.title);
		});
		return values;
	}
	function resolveRelationPhrase(phrase, loc) {
		const values = resolveRelationPhraseParts(phrase, loc);
		let text = loc(phrase.code) ?? '';
		Object.keys(values).forEach(key => {
			text = text.replace(`#${key}#`, () => values[key]);
		});
		return text;
	}

	const CARD_TAB_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);
	function nextRelationCardKey(keys, current, key) {
		if (!CARD_TAB_KEYS.has(key)) {
			return null;
		}
		const index = keys.indexOf(current);
		const shift = key === 'ArrowLeft' ? -1 : 1;
		let next = (index + shift + keys.length) % keys.length;
		if (key === 'Home') {
			next = 0;
		} else if (key === 'End') {
			next = keys.length - 1;
		}
		return keys[next];
	}

	const Chip = ui_system_chip.Vue.Chip;
	const CrmTypeHubRelationRow = ui_vue3.defineComponent({
		name: 'CrmTypeHubRelationRow',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			BLine: ui_system_skeleton_vue.BLine,
			Chip
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		props: {
			row: {
				type: Object,
				required: true
			},
			processTitle: {
				type: String,
				default: ''
			}
		},
		emits: ['scenario', 'option'],
		setup() {
			return {
				ChipDesign: ui_system_chip.ChipDesign,
				ChipSize: ui_system_chip.ChipSize
			};
		},
		data() {
			return {
				previewCardKey: 'process'
			};
		},
		computed: {
			scenario() {
				return scenarioOfRow(this.row);
			},
			scenarios() {
				return availableScenarios(this.row);
			},
			sentenceChunks() {
				if (this.scenario === null) {
					return [];
				}
				const phrase = buildRelationSentence(this.scenario, this.row.entityTypeId, this.row.title, this.processTitle);
				return splitFramePhrase(this.loc(phrase.code) ?? '', this.resolveParts(phrase));
			},
			consequence() {
				return this.scenario === null ? '' : this.resolvePhrase(buildRelationConsequence(this.scenario, this.row.entityTypeId, this.row.title, this.processTitle));
			},
			previewCards() {
				return buildRelationPreviewCards(this.row.options);
			},
			activeCard() {
				return this.previewCards.find(card => card.key === this.previewCardKey) ?? this.previewCards[0];
			},
			cardId() {
				return `crm-type-hub-relation-card-${this.row.entityTypeId}`;
			}
		},
		methods: {
			resolveParts(phrase) {
				return resolveRelationPhraseParts(phrase, code => this.loc(code));
			},
			resolvePhrase(phrase) {
				return resolveRelationPhrase(phrase, code => this.loc(code));
			},
			scenarioLabel(scenario) {
				return this.resolvePhrase(buildScenarioLabel(scenario, this.row.entityTypeId, this.row.title));
			},
			scenarioHint(scenario) {
				const text = this.resolvePhrase(buildRelationConsequence(scenario, this.row.entityTypeId, this.row.title, this.processTitle));
				return {
					text,
					popupOptions: {
						offsetTop: 5
					}
				};
			},
			optionTitle(option) {
				const label = resolveRelationOptionTitle(option, this.row.title, this.processTitle);
				return (this.loc(label.code) ?? '').replace('#TITLE#', () => label.title);
			},
			cardTitle(card) {
				return card.key === 'process' ? this.processTitle : this.row.title;
			},
			selectCard(key) {
				this.previewCardKey = key;
			},
			handleCardKeydown(event) {
				const next = nextRelationCardKey(this.previewCards.map(card => card.key), this.previewCardKey, event.key);
				if (next === null) {
					return;
				}
				event.preventDefault();
				this.selectCard(next);
				this.$nextTick(() => {
					const node = this.$el?.querySelector(`[data-card="${next}"]`);
					if (node instanceof HTMLElement) {
						node.focus();
					}
				});
			},
			handleSpotClick(option) {
				this.$emit('option', {
					option,
					checked: !option.checked
				});
			}
		},
		template: `
		<div v-if="scenario" class="crm-type-hub-relation-row" @click.stop>
			<div
				v-if="scenarios.length > 1"
				class="crm-type-hub-relation-row__switcher"
				role="group"
				:aria-label="loc('CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_TITLE')"
			>
				<button
					v-for="item in scenarios"
					:key="item"
					v-hint="scenarioHint(item)"
					type="button"
					class="crm-type-hub-relation-row__scenario"
					:aria-pressed="item === scenario ? 'true' : 'false'"
					:data-testid="'crm-type-detail-hub-relation-scenario-' + item + '-' + row.entityTypeId"
					@click="$emit('scenario', item)"
				>
					<Chip
						:text="scenarioLabel(item)"
						:design="item === scenario ? ChipDesign.Filled : ChipDesign.Outline"
						:size="ChipSize.Md"
						tabindex="-1"
					/>
				</button>
			</div>
			<div
				class="crm-type-hub-relation-preview --ui-context-edge-dark"
				:data-testid="'crm-type-detail-hub-relation-preview-' + row.entityTypeId"
			>
				<div class="crm-type-hub-relation-preview__bar">
					<BIcon
						class="crm-type-hub-relation-preview__glyph"
						name="o-hamburger-menu"
						:size="18"
						aria-hidden="true"
					/>
					<div
						class="crm-type-hub-relation-preview__tabs"
						role="tablist"
						:aria-label="loc('CRM_TYPE_DETAIL_HUB_RELATION_PREVIEW_TITLE')"
					>
						<button
							v-for="card in previewCards"
							:key="card.key"
							type="button"
							role="tab"
							class="crm-type-hub-relation-preview__tab"
							:class="{ '--on': card.key === previewCardKey }"
							:data-card="card.key"
							:aria-selected="card.key === previewCardKey ? 'true' : 'false'"
							:aria-controls="cardId"
							:aria-label="cardTitle(card)"
							:tabindex="card.key === previewCardKey ? 0 : -1"
							:data-testid="'crm-type-detail-hub-relation-preview-tab-' + card.key + '-' + row.entityTypeId"
							@click="selectCard(card.key)"
							@keydown="handleCardKeydown"
						>
							<span class="crm-type-hub-relation-preview__tab-name">{{ cardTitle(card) }}</span>
						</button>
					</div>
					<span class="crm-type-hub-relation-preview__plate --bar-name" aria-hidden="true"></span>
					<BIcon
						class="crm-type-hub-relation-preview__glyph --dim"
						name="o-clock"
						:size="16"
						aria-hidden="true"
					/>
					<span class="crm-type-hub-relation-preview__dot" aria-hidden="true"></span>
				</div>
				<div class="crm-type-hub-relation-preview__stage">
					<div class="crm-type-hub-relation-preview__menu" aria-hidden="true">
						<span class="crm-type-hub-relation-preview__plate --menu-glyph"></span>
						<span
							v-for="n in 5"
							:key="n"
							class="crm-type-hub-relation-preview__dot"
							:class="{ '--lit': n === 1 }"
						></span>
					</div>
					<div class="crm-type-hub-relation-preview__work --ui-context-content-light">
						<div class="crm-type-hub-relation-preview__work-bar" aria-hidden="true">
							<BLine class="crm-type-hub-relation-preview__sk --w4" />
							<span class="crm-type-hub-relation-preview__work-rest">
								<BLine class="crm-type-hub-relation-preview__sk --tab --w3" />
								<BLine class="crm-type-hub-relation-preview__sk --tab --w1" />
							</span>
						</div>
						<div class="crm-type-hub-relation-preview__stack">
							<span class="crm-type-hub-relation-preview__ghost" aria-hidden="true"></span>
							<div :id="cardId" class="crm-type-hub-relation-preview__card" role="tabpanel">
								<div class="crm-type-hub-relation-preview__head">
									<BLine class="crm-type-hub-relation-preview__sk --glyph" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w4" aria-hidden="true" />
									<div class="crm-type-hub-relation-preview__head-rest">
										<BLine class="crm-type-hub-relation-preview__sk --w3" aria-hidden="true" />
										<BLine class="crm-type-hub-relation-preview__sk --w1" aria-hidden="true" />
									</div>
								</div>
								<div class="crm-type-hub-relation-preview__tabs-row">
									<BLine class="crm-type-hub-relation-preview__sk --tab --w1" aria-hidden="true" />
									<button
										v-if="activeCard.tab"
										type="button"
										class="crm-type-hub-relation-preview__spot --tab"
										:class="activeCard.tab.checked ? '--on' : '--off'"
										:aria-pressed="activeCard.tab.checked ? 'true' : 'false'"
										:data-testid="'crm-type-detail-hub-relation-spot-' + activeCard.tab.id"
										@click="handleSpotClick(activeCard.tab)"
									>{{ optionTitle(activeCard.tab) }}</button>
									<BLine v-else class="crm-type-hub-relation-preview__sk --tab --w2" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --tab --w2" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --tab --w3" aria-hidden="true" />
								</div>
								<div class="crm-type-hub-relation-preview__body">
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w6" aria-hidden="true" />
									<button
										v-if="activeCard.field"
										type="button"
										class="crm-type-hub-relation-preview__spot"
										:class="activeCard.field.checked ? '--on' : '--off'"
										:aria-pressed="activeCard.field.checked ? 'true' : 'false'"
										:data-testid="'crm-type-detail-hub-relation-spot-' + activeCard.field.id"
										@click="handleSpotClick(activeCard.field)"
									>{{ optionTitle(activeCard.field) }}</button>
									<BLine v-else class="crm-type-hub-relation-preview__sk --w4" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w6" aria-hidden="true" />
									<BLine class="crm-type-hub-relation-preview__sk --w5" aria-hidden="true" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="crm-type-hub-relation-row__statement">
				<p
					class="crm-type-hub-relation-row__sentence"
					:data-testid="'crm-type-detail-hub-relation-sentence-' + row.entityTypeId"
				><span class="crm-type-hub-relation-row__text"><template
					v-for="(chunk, index) in sentenceChunks"
					:key="index"
				><span
					v-if="chunk.slot"
					class="crm-type-hub-relation-row__slot"
				>{{ chunk.text }}</span><template v-else>{{ chunk.text }}</template></template></span></p>
				<p
					class="crm-type-hub-relation-row__consequence"
					:data-testid="'crm-type-detail-hub-relation-consequence-' + row.entityTypeId"
				>{{ consequence }}</p>
			</div>
		</div>
	`
	});

	const CrmTypeHubRelationsSection = ui_vue3.defineComponent({
		name: 'CrmTypeHubRelationsSection',
		components: {
			CrmHubCard: crm_settingsHub.CrmHubCard,
			CrmHubControlRenderer: crm_settingsHub.CrmHubControlRenderer,
			CrmHubFeatureCard: crm_settingsHub.CrmHubFeatureCard,
			CrmTypeHubRelationRow,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		mixins: [ui_vue3_mixins_locMixin.locMixin],
		inject: {
			hubControlRegistry: {
				default: null
			}
		},
		props: {
			records: {
				type: Array,
				default: () => []
			},
			snapshot: {
				type: Object,
				required: true
			},
			controls: {
				type: Object,
				default: null
			}
		},
		emits: ['update', 'action'],
		setup() {
			return {
				RELATIONS_CARD_ICON,
				PORTAL_MASTER_ROW_ICON,
				SMART_PROCESS_ROW_ICON,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				smartProcessDialog: null,
				revealedSmartProcessIds: []
			};
		},
		computed: {
			processTitle() {
				return String(this.snapshot.title ?? '');
			},
			relationRowsByKind() {
				return splitRelationRowsByKind(buildRelationRows(this.snapshot), CRM_CORE_ENTITY_TYPE_IDS);
			},
			crmRows() {
				return this.relationRowsByKind.crmRows;
			},
			smartProcessRows() {
				return this.relationRowsByKind.smartProcessRows;
			},
			selectedSmartProcessRows() {
				return filterRevealedSmartProcessRows(this.smartProcessRows, this.revealedSmartProcessIds);
			},
			useInUserfieldRecord() {
				const record = this.records.find(item => item.id === USE_IN_USERFIELD_RECORD_ID);
				return record ?? null;
			},
			linkedUserFieldRows() {
				const values = readLinkedUserFields(this.snapshot);
				return buildLinkedUserFieldRows(readLinkedUserFieldsMeta(this.snapshot), values);
			},
			restRecords() {
				return this.records.filter(record => !RELATIONS_LAYOUT_RECORD_IDS.includes(record.id));
			}
		},
		created() {
			this.revealedSmartProcessIds = seedRevealedSmartProcessIds(this.smartProcessRows);
			const registry = this.hubControlRegistry;
			if (registry) {
				registry[SMART_PROCESS_ROWS_CONTROL_ID] = {
					applySnapshot: baseline => {
						this.revealedSmartProcessIds = seedRevealedSmartProcessIds(splitRelationRowsByKind(buildRelationRows(baseline), CRM_CORE_ENTITY_TYPE_IDS).smartProcessRows);
					}
				};
			}
		},
		beforeUnmount() {
			this.destroySmartProcessDialog();
			const registry = this.hubControlRegistry;
			if (registry) {
				delete registry[SMART_PROCESS_ROWS_CONTROL_ID];
			}
		},
		methods: {
			emitRelations(state) {
				this.$emit('update', {
					id: 'sp-relation-parent',
					valueKey: 'relations',
					value: state.parent
				});
				this.$emit('update', {
					id: 'sp-relation-child',
					valueKey: 'relations',
					value: state.child
				});
			},
			handleOptionToggle(option, checked) {
				this.emitRelations(applyRelationOption(this.snapshot, option, checked));
			},
			handleRowToggle(row, checked) {
				if (this.smartProcessDialog?.isOpen?.()) {
					return;
				}
				this.applyRowToggle(row, checked);
			},
			applyRowToggle(row, checked) {
				if (!checked) {
					this.emitRelations(clearRelationRow(this.snapshot, row));
					return;
				}
				const preferred = availableScenarios(row)[0];
				if (preferred) {
					this.emitRelations(applyRelationScenario(this.snapshot, row, preferred));
				}
			},
			handleRowScenario(row, scenario) {
				if (scenarioOfRow(row) === scenario) {
					return;
				}
				this.emitRelations(applyRelationScenario(this.snapshot, row, scenario));
			},
			rowIcon(row) {
				return RELATION_ROW_ICON[row.entityTypeId] ?? SMART_PROCESS_ROW_ICON;
			},
			rowDescription(row) {
				return RELATION_ROW_DESCRIPTION[row.entityTypeId] ?? '';
			},
			portalRowIcon(item) {
				return PORTAL_ROW_ICON[item.name] ?? PORTAL_MASTER_ROW_ICON;
			},
			portalRowDescription(item) {
				const code = PORTAL_ROW_DESCRIPTION[item.name] ?? '';
				return code === '' ? '' : this.namingProcess(code);
			},
			namingProcess(code) {
				return (this.loc(code) ?? '').replace('#TITLE#', String(this.snapshot.title ?? ''));
			},
			openSmartProcessPicker() {
				if (this.smartProcessRows.length === 0) {
					return;
				}
				if (this.smartProcessDialog?.isOpen?.()) {
					this.smartProcessDialog.hide?.();
					return;
				}
				const targetNode = resolvePopupAnchor(this.$refs.spPickerAnchor);
				if (!targetNode) {
					return;
				}
				this.destroySmartProcessDialog();
				const rows = this.smartProcessRows;
				const rowsByItemId = new Map(rows.map(row => [String(row.entityTypeId), row]));
				const toggleByItemId = (itemId, checked) => {
					const row = rowsByItemId.get(String(itemId));
					if (row) {
						if (checked) {
							this.revealedSmartProcessIds = withRevealedSmartProcessId(this.revealedSmartProcessIds, row.entityTypeId);
						}
						this.applyRowToggle(row, checked);
					}
				};
				const {
					items,
					selectedItems
				} = buildSmartProcessDialogItems(rows);
				this.smartProcessDialog = ui_vue3.markRaw(new ui_entitySelector.Dialog({
					targetNode,
					multiple: true,
					dropdownMode: true,
					enableSearch: true,
					showAvatars: false,
					height: 200,
					items,
					selectedItems,
					events: {
						'Item:onSelect': event => toggleByItemId(event.getData().item.getId(), true),
						'Item:onDeselect': event => toggleByItemId(event.getData().item.getId(), false)
					}
				}));
				this.smartProcessDialog.show();
			},
			destroySmartProcessDialog() {
				this.smartProcessDialog?.destroy?.();
				this.smartProcessDialog = null;
			},
			handleUseInUserfieldToggle(checked) {
				if (this.useInUserfieldRecord) {
					this.$emit('update', {
						id: this.useInUserfieldRecord.id,
						valueKey: this.useInUserfieldRecord.valueKey,
						value: checked
					});
				}
			},
			handleLinkedUserFieldToggle(item, checked) {
				const values = readLinkedUserFields(this.snapshot);
				this.$emit('update', {
					id: LINKED_USER_FIELDS_RECORD_ID,
					valueKey: 'linkedUserFields',
					value: {
						...values,
						[item.name]: checked
					}
				});
			}
		},
		template: `
		<div class="crm-type-hub-relations">
			<CrmHubCard
				card-id="relations-crm"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_TITLE"
				:icon="RELATIONS_CARD_ICON.Crm"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_INTRO') }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="row in crmRows"
						:key="row.entityTypeId"
						:feature-id="'relation-' + row.entityTypeId"
						:title-text="row.title"
						:description="row.checked ? '' : rowDescription(row)"
						:icon="rowIcon(row)"
						:checked="row.checked"
						@update="handleRowToggle(row, $event)"
					>
						<template v-if="row.checked" #details>
							<CrmTypeHubRelationRow
								:row="row"
								:process-title="processTitle"
								@scenario="handleRowScenario(row, $event)"
								@option="handleOptionToggle($event.option, $event.checked)"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
			</CrmHubCard>
			<CrmHubCard
				card-id="relations-sp"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_SP_TITLE"
				:icon="SMART_PROCESS_ROW_ICON"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_SP_INTRO') }}</TextSm>
				</div>
				<div v-if="selectedSmartProcessRows.length" class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-for="row in selectedSmartProcessRows"
						:key="row.entityTypeId"
						:feature-id="'relation-' + row.entityTypeId"
						:title-text="row.title"
						:icon="SMART_PROCESS_ROW_ICON"
						:checked="row.checked"
						@update="handleRowToggle(row, $event)"
					>
						<template v-if="row.checked" #details>
							<CrmTypeHubRelationRow
								:row="row"
								:process-title="processTitle"
								@scenario="handleRowScenario(row, $event)"
								@option="handleOptionToggle($event.option, $event.checked)"
							/>
						</template>
					</CrmHubFeatureCard>
				</div>
				<div class="crm-type-hub-relation-sp-picker">
					<span ref="spPickerAnchor">
						<UiButton
							:text="loc('CRM_TYPE_DETAIL_HUB_RELATIONS_SP_ACTION')"
							:size="ButtonSize.MEDIUM"
							:style="AirButtonStyle.OUTLINE_NO_ACCENT"
							:left-icon="'plus-l'"
							:disabled="!smartProcessRows.length"
							:dataset="{ testid: 'crm-type-detail-hub-relation-other-sp-btn' }"
							@click="openSmartProcessPicker"
						/>
					</span>
				</div>
			</CrmHubCard>
			<CrmHubCard
				card-id="relations-portal"
				title="CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_TITLE"
				:icon="RELATIONS_CARD_ICON.Portal"
				collapsible
			>
				<div class="crm-type-hub-cards-intro">
					<TextSm class="crm-type-hub-card-intro">{{ loc('CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_INTRO') }}</TextSm>
				</div>
				<div class="crm-type-hub-feature-rows">
					<CrmHubFeatureCard
						v-if="useInUserfieldRecord"
						feature-id="relation-use-in-userfield"
						:title="useInUserfieldRecord.title"
						:description-text="namingProcess('CRM_TYPE_DETAIL_HUB_RELATION_ROW_CRM_ITEMS')"
						:icon="PORTAL_MASTER_ROW_ICON"
						:checked="Boolean(snapshot[useInUserfieldRecord.valueKey])"
						@update="handleUseInUserfieldToggle"
					/>
					<CrmHubFeatureCard
						v-for="item in linkedUserFieldRows"
						:key="item.name"
						:feature-id="'relation-uf-' + item.name"
						:title-text="item.title"
						:description-text="portalRowDescription(item)"
						:icon="portalRowIcon(item)"
						:checked="item.isEnabled"
						@update="handleLinkedUserFieldToggle(item, $event)"
					/>
				</div>
			</CrmHubCard>
			<CrmHubCard v-if="restRecords.length" card-id="relations-rest">
				<CrmHubControlRenderer
					v-for="record in restRecords"
					:key="record.id"
					:descriptor="record"
					:snapshot="snapshot"
					:controls="controls"
					@update="$emit('update', $event)"
					@action="$emit('action', $event)"
				/>
			</CrmHubCard>
		</div>
	`
	});

	const PERMISSIONS_SECTION_ID = 'permissions';
	const HOST_CLASS = 'crm-type-hub-host';
	const CARRIED_QUERY_PARAM_NAMES = ['isExternal', 'automatedSolutionId', 'c_sub_section'];
	const HubApp = ui_vue3.defineComponent({
		name: 'CrmTypeHubApp',
		components: {
			UiButton: ui_vue3_components_button.Button,
			CrmHubShell: crm_settingsHub.CrmHubShell,
			CrmHubSavePanel: crm_settingsHub.CrmHubSavePanel,
			CrmTypeHubPassport,
			CrmTypeHubPermissionsSection,
			CrmTypeHubCardsSection,
			CrmTypeHubRelationsSection
		},
		props: {
			params: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const params = props.params;
			const store = useTypeHubStore();
			const creationPreview = resolveCreationPreviewState(params);
			const isWaiting = ui_vue3.ref(false);
			const errors = ui_vue3.ref([]);
			const isCancelEventRegistered = ui_vue3.ref(false);
			const deferredCancelElement = ui_vue3.ref(null);
			const currentSliderEvent = ui_vue3.ref(null);
			const linkedUserFieldsMeta = buildLinkedUserFieldsMeta(params.linkedUserFields);
			const customSectionMeta = {
				isCreateSectionsViaAutomatedSolutionDetails: Boolean(params.isCreateSectionsViaAutomatedSolutionDetails),
				canEditAutomatedSolution: Boolean(params.canEditAutomatedSolution),
				switcherDisabled: Boolean(params.isNew) || !params.canToggleAutomatedSolutionSwitcher,
				isNew: Boolean(params.isNew),
				permissionsUrl: params.permissionsUrl ?? null
			};
			store.init(buildInitialValues(params), resolveActiveSectionId(String(params.activeTabId ?? 'common'), Boolean(params.isExternal)));
			const adapter = ui_vue3.markRaw(new TypeFormAdapter(params.type, Boolean(params.isCustomSectionsAvailable), crm_settingsHub.normalizeHubDescription));
			const getTypeId = () => Number(adapter.getModel().getId() ?? 0);
			const showErrors = list => {
				errors.value = Array.isArray(list) ? list : [String(list)];
			};
			const deferredTypeUpdate = ui_vue3.markRaw(new DeferredTypeUpdate(payload => crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent(payload)));
			const currentSliderData = getCurrentSlider()?.data;
			if (currentSliderData) {
				deferredTypeUpdate.pickUp(currentSliderData);
			}
			let saveAnalyticsBuilder = null;
			const saveType = ui_vue3.markRaw(new SaveType({
				adapter,
				getValues: () => store.values,
				commitSnapshot: values => store.commitSnapshot(values),
				getTypeId,
				isRestricted: Boolean(params.isRestricted),
				isWaiting: () => isWaiting.value,
				sendAnalytics: (status, id) => {
					if (status === 'attempt') {
						saveAnalyticsBuilder = adapter.isSaved() ? new crm_integration_analytics.Builder.Automation.Type.EditEvent() : new crm_integration_analytics.Builder.Automation.Type.CreateEvent();
						saveAnalyticsBuilder.setIsExternal(Boolean(params.isExternal));
						saveAnalyticsBuilder.setElement(crm_integration_analytics.Dictionary.ELEMENT_CREATE_BUTTON);
						if (getTypeId() > 0) {
							saveAnalyticsBuilder.setId(getTypeId());
						}
						const currentUrl = new main_core.Uri(decodeURI(window.location.href));
						const subSection = currentUrl.getQueryParam('c_sub_section');
						if (subSection && saveAnalyticsBuilder instanceof crm_integration_analytics.Builder.Automation.Type.EditEvent) {
							saveAnalyticsBuilder.setSubSection(subSection);
						}
					} else {
						saveAnalyticsBuilder.setId(id);
					}
					ui_analytics.sendData(saveAnalyticsBuilder.setStatus(status).buildData());
				},
				showRestriction: () => {
					if (main_core.Type.isStringFilled(params.restrictionSliderCode) && main_core.Reflection.getClass('BX.UI.InfoHelper.show')) {
						BX.UI.InfoHelper.show(params.restrictionSliderCode);
					} else {
						showErrors([String(params.restrictionErrorMessage ?? '')]);
					}
				},
				afterSave: response => {
					const slider = getCurrentSlider();
					slider?.data?.set('response', response);
					const data = response.data;
					if (Object.hasOwn(data, 'urlTemplates')) {
						crm_router.Router.Instance.setUrlTemplates(data.urlTemplates);
					}
					const created = creationPreview.active ? readCreatedType(response.data) : null;
					const reloadUri = created === null ? '' : resolveCreationReloadUri(params, created, Boolean(slider));
					const action = resolveAfterSaveAction({
						isInSlider: Boolean(slider),
						wasCreationPreview: creationPreview.active,
						created,
						reloadUri
					});
					if (action === 'navigate') {
						isWaiting.value = true;
						if (slider?.data) {
							deferredTypeUpdate.handOver(slider.data, data.isUrlChanged === true);
						} else {
							crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent({
								isUrlChanged: false
							});
						}
						setTimeout(() => {
							if (slider) {
								window.location.href = reloadUri;
							} else {
								window.location.replace(reloadUri);
							}
						});
						return;
					}
					if (action === 'close') {
						slider?.close();
						crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent({
							isUrlChanged: data.isUrlChanged === true
						});
						return;
					}
					errors.value = [];
					if (slider) {
						deferredTypeUpdate.defer(data.isUrlChanged === true);
					} else {
						crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent({
							isUrlChanged: data.isUrlChanged === true
						});
					}
					main_core_events.EventEmitter.emit('BX.Crm.TypeDetailHub:savedInPlace', {
						responseData: response.data
					});
				},
				setWaiting: waiting => {
					isWaiting.value = waiting;
				},
				showErrors,
				markCancelEventRegistered: () => {
					isCancelEventRegistered.value = true;
				},
				normalizeValues: () => store.normalizeDaysBeforeClose()
			}));
			let deleteAnalyticsBuilder = null;
			const deleteType = ui_vue3.markRaw(new DeleteType({
				isWaiting: () => isWaiting.value,
				setWaiting: waiting => {
					isWaiting.value = waiting;
				},
				confirm: ({
					onAccept,
					onCancel
				}) => {
					const currentUrl = new main_core.Uri(decodeURI(window.location.href));
					deleteAnalyticsBuilder = new crm_integration_analytics.Builder.Automation.Type.DeleteEvent().setElement(crm_integration_analytics.Dictionary.ELEMENT_DELETE_BUTTON).setIsExternal(Boolean(params.isExternal)).setSubSection(currentUrl.getQueryParam('c_sub_section') ?? null).setId(getTypeId());
					const message = main_core.Loc.getMessage('CRM_TYPE_DETAIL_DELETE_CONFIRM') ?? '';
					const messageBox = ui_dialogs_messagebox.MessageBox.confirm(message, box => {
						box.getPopupWindow().setClosingByEsc(false);
						box.getCancelButton().setDisabled(true);
						return onAccept();
					}, null, () => {
						onCancel();
						return true;
					});
					const popup = messageBox.getPopupWindow();
					main_core.Dom.attr(popup.getPopupContainer(), 'aria-label', message);
					main_core.Dom.attr(popup.getPopupContainer(), 'data-testid', 'crm-type-detail-hub-delete-confirm-dialog');
					messageBox.getOkButton().getDataSet().testid = 'crm-type-detail-hub-delete-confirm-btn';
					messageBox.getCancelButton().getDataSet().testid = 'crm-type-detail-hub-delete-cancel-btn';
					popup.setClosingByEsc(true);
					popup.subscribe('onClose', onCancel);
				},
				sendAnalytics: status => {
					ui_analytics.sendData(deleteAnalyticsBuilder.setStatus(status).buildData());
				},
				requestDelete: () => adapter.delete(),
				afterDelete: response => {
					const data = response.data;
					crm_toolbarComponent.ToolbarComponent.Instance.emitTypeUpdatedEvent({
						isUrlChanged: deferredTypeUpdate.absorb(main_core.Type.isObject(data) && data.isUrlChanged === true)
					});
					const typeListUrl = crm_router.Router.Instance.getTypeListUrl();
					if (typeListUrl) {
						crm_router.Router.Instance.closeSliderOrRedirect(typeListUrl);
					} else {
						getCurrentSlider()?.close();
					}
				},
				showErrors,
				commitSnapshot: () => store.commitSnapshot(),
				markCancelEventRegistered: () => {
					isCancelEventRegistered.value = true;
				}
			}));
			const openConfirmDialog = () => new Promise(resolve => {
				const dialog = crm_dialog.ConfirmationDialog.create('crm-type-hub-close', {
					title: main_core.Loc.getMessage('CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TITLE'),
					content: main_core.Loc.getMessage('CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TEXT')
				});
				dialog.open().then(result => resolve(!result.cancel)).catch(() => resolve(false));
			});
			const confirmClose = ui_vue3.markRaw(new ConfirmCloseGuard({
				isDirty: () => store.isDirty,
				denyClose: () => currentSliderEvent.value?.denyAction?.(),
				openConfirm: () => openConfirmDialog().then(confirmed => {
					if (!confirmed) {
						deferredCancelElement.value = null;
					}
					return confirmed;
				}),
				closeSlider: () => getCurrentSlider()?.close?.()
			}));
			const records = resolveHubRecords(Boolean(params.isCustomSectionsAvailable));
			const controlRegistry = {};
			ui_vue3.provide('hubControlRegistry', controlRegistry);
			const formControls = ui_vue3.markRaw({
				[SpControlType.Relation]: CrmTypeHubRelationControl,
				[SpControlType.CustomSection]: CrmTypeHubCustomSectionControl,
				[SpControlType.LinkedUserFields]: CrmTypeHubLinkedUserFieldsControl
			});
			return {
				store,
				sections: resolveHubSections(),
				records,
				formControls,
				adapter,
				saveType,
				deleteType,
				deferredTypeUpdate,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				confirmClose,
				controlRegistry,
				linkedUserFieldsMeta,
				customSectionMeta,
				creationPreview,
				isWaiting,
				errors,
				isCancelEventRegistered,
				deferredCancelElement,
				currentSliderEvent,
				categoryListUrl: resolveCategoryListUrl(params),
				DESIGNED_SECTION_IDS: resolveDesignedSectionIds(),
				cardsSections: resolveCardsLayouts().map(layout => ({
					slotName: `section-${layout.sectionId}`,
					layout
				}))
			};
		},
		computed: {
			snapshot() {
				return this.buildSnapshot();
			},
			actionUrls() {
				const serverUrls = this.params.hubActionUrls ?? {};
				if (this.categoryListUrl === null) {
					return serverUrls;
				}
				return {
					...serverUrls,
					[CATEGORY_LIST_ACTION]: this.categoryListUrl
				};
			},
			activeSectionId() {
				return this.store.activeSectionId;
			},
			isDirty() {
				return this.store.isDirty;
			},
			isPanelFixed() {
				return isTypeHubPanelFixed(this.isDirty, Boolean(this.params.isNew), this.creationPreview.active);
			},
			contentInert() {
				return this.creationPreview.contentInert;
			},
			isHeroReadOnly() {
				return this.creationPreview.active && this.isWaiting;
			},
			isCreationSaveDisabled() {
				return String(this.store.title ?? '').trim() === '';
			}
		},
		mounted() {
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeDetailHub:showSection', this.handleShowSection);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseStart', this.handleSliderCloseStart);
			main_core_events.EventEmitter.subscribe('BX.Crm.TypeDetailHub:savedInPlace', this.handleSavedInPlace);
			main_core.Dom.addClass(document.documentElement, HOST_CLASS);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.handleSliderClose);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.TypeDetailHub:showSection', this.handleShowSection);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onCloseStart', this.handleSliderCloseStart);
			main_core_events.EventEmitter.unsubscribe('BX.Crm.TypeDetailHub:savedInPlace', this.handleSavedInPlace);
			main_core.Dom.removeClass(document.documentElement, HOST_CLASS);
		},
		methods: {
			buildSnapshot() {
				return {
					...this.store.values,
					isCategoriesControlDisabled: this.params.isCategoriesControlDisabled,
					categoriesCount: Number(this.params.categoriesCount ?? 0),
					isRecyclebinControlDisabled: this.params.isRecyclebinControlDisabled,
					hubActionUrls: this.actionUrls,
					linkedUserFieldsMeta: this.linkedUserFieldsMeta,
					relationsCatalog: this.params.relationsCatalog,
					customSectionMeta: this.customSectionMeta
				};
			},
			handleUpdate(payload) {
				const {
					id,
					valueKey,
					value
				} = payload;
				if (id === 'sp-relation-parent') {
					this.store.setRelationDirection('parent', value);
					return;
				}
				if (id === 'sp-relation-child') {
					this.store.setRelationDirection('child', value);
					return;
				}
				if (id === 'sp-custom-section') {
					this.store.setCustomSectionState(value);
					return;
				}
				if (id === 'sp-linked-user-fields') {
					const synced = applyChildToggle({
						master: Boolean(this.store.isUseInUserfieldEnabled),
						items: value
					});
					this.store.setLinkedUserFields(synced.items);
					this.store.setField('isUseInUserfieldEnabled', synced.master);
					return;
				}
				if (valueKey) {
					this.store.setField(valueKey, value);
					if (valueKey === 'isUseInUserfieldEnabled') {
						const synced = applyMasterToggle({
							master: Boolean(value),
							items: this.store.linkedUserFields
						});
						this.store.setLinkedUserFields(synced.items);
					}
				}
			},
			openPermissionsSlider() {
				if (this.creationPreview.active) {
					return false;
				}
				if (!main_core.Type.isStringFilled(this.params.permissionsUrl)) {
					return false;
				}
				BX.SidePanel?.Instance?.open(this.params.permissionsUrl);
				setTimeout(() => this.syncMenuHighlight(this.store.activeSectionId), 0);
				return true;
			},
			handleAction(payload) {
				const {
					actionKey
				} = payload;
				if (!HANDLED_ACTION_KEYS.has(actionKey)) {
					return;
				}
				if (actionKey === PERMISSIONS_ACTION) {
					this.openPermissionsSlider();
					return;
				}
				if (actionKey === CATEGORY_LIST_ACTION) {
					this.openCategoryList();
					return;
				}
				this.openServerAddressedAction(actionKey);
			},
			openCategoryList() {
				const url = resolveActionUrl(CATEGORY_LIST_ACTION, this.actionUrls);
				if (url === null) {
					return;
				}
				crm_router.Router.openSlider(url, {
					width: 900
				});
			},
			openServerAddressedAction(actionKey) {
				const url = resolveActionUrl(actionKey, this.actionUrls);
				if (url === null) {
					return;
				}
				if (actionKey === BIZ_PROC_DESIGNER_ACTION || actionKey === RECYCLE_BIN_ACTION) {
					main_core.Page.redirect(url, {
						newTab: true
					});
					return;
				}
				crm_router.Router.openSlider(url);
			},
			handleDelete() {
				this.deleteType.execute();
			},
			handleSave() {
				this.saveType.execute();
			},
			handleCancel() {
				revertForm(this.store, Object.values(this.controlRegistry), () => this.buildSnapshot());
			},
			handleSavedInPlace(event) {
				const data = event.getData();
				if (!settleSavedDescription(this.store, data?.responseData)) {
					return;
				}
				const saved = readSavedCustomSectionState(data?.responseData);
				if (saved !== null) {
					this.store.setCustomSectionState(saved);
					this.store.commitSnapshot();
				}
				revertForm(this.store, Object.values(this.controlRegistry), () => this.buildSnapshot());
			},
			handleCreationCancel() {
				if (this.isWaiting) {
					return;
				}
				this.handleCancel();
				const typeListUrl = crm_router.Router.Instance.getTypeListUrl();
				if (typeListUrl) {
					crm_router.Router.Instance.closeSliderOrRedirect(typeListUrl);
				} else {
					getCurrentSlider()?.close();
				}
			},
			hideErrors() {
				this.errors = [];
			},
			handleShowSection(event) {
				const data = event.getData();
				if (data && main_core.Type.isStringFilled(data.sectionId)) {
					const sectionId = String(data.sectionId);
					if (sectionId === PERMISSIONS_SECTION_ID && this.openPermissionsSlider()) {
						return;
					}
					const isSameSection = this.store.activeSectionId === sectionId;
					this.store.setActiveSection(sectionId);
					this.syncMenuHighlight(sectionId);
					if (!isSameSection) {
						this.scrollToSectionStart();
					}
				}
			},
			scrollToSectionStart() {
				window.scrollTo({
					top: 0,
					left: 0
				});
			},
			syncMenuHighlight(sectionId) {
				const items = document.querySelectorAll('[data-role^="hub-section-"]');
				items.forEach(item => {
					const target = item.closest('.ui-sidepanel-menu-item') ?? item;
					const isActive = item.getAttribute('data-role') === `hub-section-${sectionId}`;
					main_core.Dom.toggleClass(target, 'ui-sidepanel-menu-active', isActive);
					main_core.Dom.attr(item, 'aria-current', isActive ? 'true' : null);
				});
			},
			handleSliderLoad(event) {
				if (!this.creationPreview.active) {
					return;
				}
				const [sliderEvent] = event.getData();
				if (sliderEvent?.getSlider?.() !== getCurrentSlider()) {
					return;
				}
				this.$refs.passport?.focusTitle?.();
			},
			handleSliderClose(event) {
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== getCurrentSlider()) {
					return;
				}
				this.currentSliderEvent = sliderEvent;
				if (canRegisterCancelEvent(this.store.isDirty, this.confirmClose.isCloseConfirmed)) {
					this.registerCancelEvent(null);
				}
				this.confirmClose.handleClose();
			},
			handleSliderCloseStart(event) {
				const [sliderEvent] = event.getData();
				const slider = sliderEvent?.getSlider?.();
				if (slider?.getFrameWindow?.() !== window) {
					return;
				}
				this.deferredTypeUpdate.flush(slider.data);
			},
			handleSliderCloseByEsc(event) {
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== getCurrentSlider()) {
					return;
				}
				if (canRegisterCancelEvent(this.store.isDirty, this.confirmClose.isCloseConfirmed)) {
					this.registerCancelEvent(crm_integration_analytics.Dictionary.ELEMENT_ESC_BUTTON);
					return;
				}
				this.deferredCancelElement = crm_integration_analytics.Dictionary.ELEMENT_ESC_BUTTON;
			},
			registerCancelEvent(element) {
				if (this.isCancelEventRegistered) {
					return;
				}
				this.isCancelEventRegistered = true;
				const builder = this.adapter.isSaved() ? new crm_integration_analytics.Builder.Automation.Type.EditEvent() : new crm_integration_analytics.Builder.Automation.Type.CreateEvent();
				builder.setIsExternal(Boolean(this.params.isExternal));
				const typeId = Number(this.adapter.getModel().getId() ?? 0);
				if (typeId > 0) {
					builder.setId(typeId);
				}
				const currentUrl = new main_core.Uri(decodeURI(window.location.href));
				const subSection = currentUrl.getQueryParam('c_sub_section');
				if (subSection && builder instanceof crm_integration_analytics.Builder.Automation.Type.EditEvent) {
					builder.setSubSection(subSection);
				}
				ui_analytics.sendData(builder.setElement(resolveCancelElement(this.deferredCancelElement, element)).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
			}
		},
		template: `
		<div
			class="crm-type-hub"
			:class="[{ '--designed-section': DESIGNED_SECTION_IDS.includes(activeSectionId) }, creationPreview.rootModifierClass]"
			data-testid="crm-type-detail-hub-root"
		>
			<div
				v-if="errors.length"
				class="crm-type-hub__errors ui-alert ui-alert-danger"
				role="alert"
				data-testid="crm-type-detail-hub-errors"
			>
				<span class="ui-alert-message">{{ errors.join('') }}</span>
				<button
					type="button"
					class="ui-alert-close-btn crm-type-hub__error-close"
					:aria-label="loc('CRM_TYPE_DETAIL_HUB_ERROR_CLOSE')"
					data-testid="crm-type-detail-hub-error-close"
					@click="hideErrors"
				></button>
			</div>
			<CrmHubShell
				:sections="sections"
				:records="records"
				:snapshot="snapshot"
				:active-section-id="activeSectionId"
				:is-panel-fixed="isPanelFixed"
				:controls="formControls"
				@update="handleUpdate"
				@action="handleAction"
			>
				<!--
					The hero is the one live block of the creation screen, and it is the only slot that
					gets no inert: everything else the shell renders is handed its own below. Its Save
					button is fed from the same state the hidden save panel would have used — isWaiting is
					moved by SaveType itself, which also keeps its own double-click guard.
				-->
				<template #passport>
					<CrmTypeHubPassport
						ref="passport"
						:records="records"
						:snapshot="snapshot"
						:controls="formControls"
						:show-creation-save-button="creationPreview.showHeroSaveButton"
						:read-only="isHeroReadOnly"
						:creation-save-in-progress="isWaiting"
						:creation-save-disabled="isCreationSaveDisabled"
						:creation-mode="creationPreview.active"
						@update="handleUpdate"
						@creation-save="handleSave"
						@creation-cancel="handleCreationCancel"
					/>
				</template>
				<!--
					"contentInert || null" and not the bare flag: inert is not one of Vue's special
					boolean attributes, so a false would be written out as inert="false" — an attribute
					that is PRESENT, which is all inertness needs. null removes it instead.
				-->
				<template
					v-for="entry in cardsSections"
					:key="entry.slotName"
					#[entry.slotName]="{ records: sectionRecords }"
				>
					<CrmTypeHubCardsSection
						:layout="entry.layout"
						:records="sectionRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<template #section-permissions="{ records: permissionsRecords }">
					<CrmTypeHubPermissionsSection
						:records="permissionsRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<template #section-relations="{ records: relationsRecords }">
					<CrmTypeHubRelationsSection
						:records="relationsRecords"
						:snapshot="snapshot"
						:controls="formControls"
						:inert="contentInert || null"
						@update="handleUpdate"
						@action="handleAction"
					/>
				</template>
				<!--
					v-if on the <template> and not inside it: the shell draws the bar's wrapper — a fixed
					white strip with a border — from $slots.panel alone, so a slot that renders nothing
					still leaves the strip standing at the bottom of the creation screen.
				-->
				<template v-if="!creationPreview.hideGlobalSavePanel" #panel>
					<div class="crm-type-hub__panel">
						<CrmHubSavePanel
							:is-dirty="isDirty"
							:is-waiting="isWaiting"
							@save="handleSave"
							@cancel="handleCancel"
						/>
						<div v-if="!params.isNew" class="crm-type-hub__delete-action">
							<UiButton
								:text="loc('CRM_TYPE_DETAIL_HUB_DELETE')"
								:disabled="isWaiting"
								:style="AirButtonStyle.OUTLINE"
								:size="ButtonSize.MEDIUM"
								:dataset="{ testid: 'crm-type-detail-hub-delete-btn' }"
								@click="handleDelete"
							/>
						</div>
					</div>
				</template>
			</CrmHubShell>
		</div>
	`
	});
	function resolveCategoryListUrl(params) {
		const entityTypeId = Number(params.type?.entityTypeId ?? 0);
		if (entityTypeId <= 0) {
			return null;
		}
		const template = crm_router.Router.Instance.getTemplate?.('bitrix:crm.sales.tunnels', entityTypeId);
		if (!main_core.Type.isStringFilled(template)) {
			return null;
		}
		return String(template).replace('#entityTypeId#', String(entityTypeId));
	}
	function resolveCreationReloadUri(params, created, isInSlider) {
		if (created === null) {
			return '';
		}
		const typeDetailUri = crm_router.Router.Instance.getTypeDetailUrl(created.entityTypeId);
		if (!typeDetailUri) {
			return '';
		}
		const reloadUri = buildTypeDetailReloadUri({
			typeDetailUrl: typeDetailUri.toString(),
			activeTabId: main_core.Type.isStringFilled(params.activeTabId) ? String(params.activeTabId) : null,
			carryQueryParams: readCarriedQueryParams()
		});
		return isInSlider ? reloadUri : dropFrameQueryParams(reloadUri);
	}
	function readCarriedQueryParams() {
		const currentUrl = new main_core.Uri(decodeURI(window.location.href));
		const carried = {};
		CARRIED_QUERY_PARAM_NAMES.forEach(name => {
			const value = currentUrl.getQueryParam(name);
			if (main_core.Type.isStringFilled(value)) {
				carried[name] = String(value);
			}
		});
		return carried;
	}
	function buildLinkedUserFieldsMeta(raw) {
		if (!main_core.Type.isObjectLike(raw)) {
			return [];
		}
		return Object.entries(raw).map(([name, field]) => ({
			name,
			title: field?.title ?? name
		}));
	}
	function buildInitialValues(params) {
		const type = main_core.Type.isObjectLike(params.type) ? params.type : {};
		const catalog = main_core.Type.isObjectLike(params.relationsCatalog) ? params.relationsCatalog : {
			parent: [],
			child: []
		};
		const values = {
			title: type.title ?? '',
			description: toDescriptionValue(params.description),
			daysBeforeClose: params.daysBeforeClose === null || params.daysBeforeClose === undefined ? '' : String(params.daysBeforeClose),
			linkedUserFields: mapLinkedUserFieldValues(params.linkedUserFields),
			relations: {
				parent: catalogToEntries(catalog.parent),
				child: catalogToEntries(catalog.child)
			},
			customSectionId: Number(type.customSectionId ?? 0),
			customSections: Array.isArray(type.customSections) ? type.customSections : [],
			isExternal: Boolean(params.isExternal)
		};
		return {
			...pickBooleans(type),
			...values
		};
	}
	function pickBooleans(type) {
		const result = {};
		Object.keys(type).forEach(key => {
			if (main_core.Type.isBoolean(type[key])) {
				result[key] = type[key];
			}
		});
		return result;
	}
	function mapLinkedUserFieldValues(raw) {
		if (!main_core.Type.isObjectLike(raw)) {
			return {};
		}
		const result = {};
		Object.entries(raw).forEach(([name, field]) => {
			result[name] = Boolean(field?.isEnabled);
		});
		return result;
	}
	function catalogToEntries(list) {
		if (!Array.isArray(list)) {
			return [];
		}
		return list.filter(relation => relation && relation.isChecked).map(relation => ({
			entityTypeId: Number(relation.entityTypeId),
			isChildrenListEnabled: Boolean(relation.isChildrenListEnabled)
		}));
	}
	class App {
		#container;
		#params;
		#app = null;
		constructor(params) {
			this.#container = document.getElementById(params.containerId);
			this.#params = params;
		}
		start() {
			if (!this.#container) {
				return;
			}
			this.#app = ui_vue3.BitrixVue.createApp(HubApp, {
				params: this.#params
			});
			this.#app.use(ui_vue3_pinia.createPinia());
			this.#app.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.#app.mount(this.#container);
		}
		stop() {
			this.#app?.unmount();
			this.#app = null;
		}
	}

	exports.App = App;

})(this.BX.Crm.TypeDetailHub = this.BX.Crm.TypeDetailHub || {}, BX.Vue3, BX.Vue3.Pinia, BX.Vue3.Mixins, BX.Event, BX, BX.Crm.Integration.Analytics, BX.Crm, BX.Crm, BX.Crm, BX.UI.Dialogs, BX.Vue3.Components, BX.UI.Analytics, BX.Crm.SettingsHub, BX.Crm.Models, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.UI.EntitySelector, BX.UI, BX.UI, BX.UI.System.Input.Vue, BX.UI.Accessibility, BX.Vue3.Directives, BX.UI.IconSet, window, BX.UI.System.Chip, BX.UI.System.Skeleton.Vue);
//# sourceMappingURL=script.js.map
