/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
this.BX.Sign.V2 = this.BX.Sign.V2 || {};
(function (exports, main_core, main_sidepanel, ui_vue3_pinia, ui_wizard, main_core_events, ui_system_alert, ui_system_typography, sign_type, sign_v2_api, sign_v2_b2e_userParty, main_loader, bizproc_a11y, bizproc_fields) {
	'use strict';

	const USER_ENTITY_TYPE = 'user';
	const STRUCTURE_NODE_ENTITY_TYPE = 'structure-node';
	const SIGNERS_LIST_ENTITY_TYPE = 'signers-list';
	const SIGN_DOCUMENT_ENTITY_TYPE = 'sign-document';
	const ALLOWED_ENTITY_TYPES = new Set([USER_ENTITY_TYPE, STRUCTURE_NODE_ENTITY_TYPE, SIGNERS_LIST_ENTITY_TYPE, SIGN_DOCUMENT_ENTITY_TYPE]);
	const FLAT_STRUCTURE_NODE_ID_PATTERN = /^([1-9]\d*):F$/;
	const NUMERIC_ID_PATTERN = /^[1-9]\d*$/;
	function normalizeMembers(entities) {
		const members = [];
		const keys = new Set();
		entities.forEach(entity => {
			if (!ALLOWED_ENTITY_TYPES.has(entity?.entityType)) {
				return;
			}
			const entityId = normalizeEntityId(entity.entityType, entity.entityId);
			if (entityId === null) {
				return;
			}
			const key = `${entity.entityType}:${entityId}`;
			if (keys.has(key)) {
				return;
			}
			keys.add(key);
			members.push({
				entityType: entity.entityType,
				entityId
			});
		});
		return members;
	}
	function normalizeEntityId(entityType, rawEntityId) {
		if (main_core.Type.isNumber(rawEntityId)) {
			return isValidNumericId(rawEntityId) ? rawEntityId : null;
		}
		if (!main_core.Type.isString(rawEntityId)) {
			return null;
		}
		const entityId = rawEntityId.trim();
		if (NUMERIC_ID_PATTERN.test(entityId)) {
			const numericId = Number(entityId);
			return isValidNumericId(numericId) ? numericId : null;
		}
		if (entityType !== STRUCTURE_NODE_ENTITY_TYPE) {
			return null;
		}
		const flatStructureNodeMatch = entityId.match(FLAT_STRUCTURE_NODE_ID_PATTERN);
		if (flatStructureNodeMatch === null) {
			return null;
		}
		const structureNodeId = Number(flatStructureNodeMatch[1]);
		return isValidNumericId(structureNodeId) ? `${structureNodeId}:F` : null;
	}
	function isValidNumericId(entityId) {
		return Number.isSafeInteger(entityId) && entityId > 0;
	}

	function hasFieldErrors(errors) {
		return errors.some(error => error.name !== '');
	}
	function readStartForm(response) {
		return {
			documentType: readDocumentType(response?.documentType),
			items: readItems(response?.fields)
		};
	}
	function readErrors(exception) {
		if (!main_core.Type.isObjectLike(exception)) {
			return [];
		}
		if (main_core.Type.isArray(exception.errors)) {
			return exception.errors.map(error => readError(error)).filter(error => error.message !== '');
		}
		return main_core.Type.isStringFilled(exception.message) ? [{
			name: '',
			message: exception.message
		}] : [];
	}
	function readDocumentType(documentType) {
		if (!main_core.Type.isArray(documentType)) {
			return [];
		}
		return documentType.filter(part => main_core.Type.isString(part));
	}
	function readItems(fields) {
		if (!main_core.Type.isArray(fields)) {
			return [];
		}
		return fields.filter(field => main_core.Type.isPlainObject(field) && main_core.Type.isStringFilled(field.Id)).map(field => ({
			property: field,
			fieldName: field.Id,
			value: readValue(field.Default)
		}));
	}
	function readValue(value) {
		if (main_core.Type.isArray(value)) {
			return value.filter(item => main_core.Type.isString(item));
		}
		if (main_core.Type.isString(value)) {
			return value;
		}
		return main_core.Type.isNumber(value) || main_core.Type.isBoolean(value) ? String(value) : null;
	}
	function readError(error) {
		if (!main_core.Type.isPlainObject(error)) {
			return {
				name: '',
				message: ''
			};
		}
		const parameter = main_core.Type.isPlainObject(error.customData) ? error.customData.parameter : null;
		return {
			name: main_core.Type.isStringFilled(parameter) ? parameter : '',
			message: main_core.Type.isStringFilled(error.message) ? error.message : ''
		};
	}

	const EXTENSION_NAME = 'sign.v2.b2e.run-process';
	const RECOUNT_DELAY = 100;
	const SELECTION_EVENTS = ['BX.UI.EntitySelector.TagSelector:onAfterTagAdd', 'BX.UI.EntitySelector.TagSelector:onAfterTagRemove', 'BX.Sign.V2.B2E.UserPartyRefused:onChange'];
	class EmployeesStep {
		title;
		#store;
		#onLaunchRefused;
		#api = new sign_v2_api.Api();
		#userParty;
		#container;
		#errorBox;
		#noticeBox;
		#recountTimeout = null;
		#recountToken = 0;
		#unsubscribe = [];
		constructor(options) {
			this.title = options.title;
			this.#store = options.store;
			this.#onLaunchRefused = options.onLaunchRefused;
			const region = getRegion();
			const partyOptions = {
				mode: 'edit',
				region,
				b2eSignersLimitCount: null,
				preselectedUserIds: [],
				preselectedSigners: null,
				role: sign_type.MemberRole.signer
			};
			this.#userParty = new sign_v2_b2e_userParty.UserParty(partyOptions);
			this.#errorBox = main_core.Tag.render`<div class="sign-b2e-run-process-employees__errors"></div>`;
			this.#noticeBox = main_core.Tag.render`
			<div
				class="sign-b2e-run-process-employees__notice"
				data-testid="sign-b2e-run-process-exclusion"
			></div>
		`;
			this.#container = main_core.Tag.render`
			<div
				class="sign-b2e-run-process__step sign-b2e-run-process-employees"
				data-testid="sign-b2e-run-process-step-employees"
			>
				${this.#errorBox}
				${this.#userParty.getLayout(region)}
				${this.#noticeBox}
			</div>
		`;
			this.#subscribe();
		}
		get content() {
			return this.#container;
		}
		async beforeCompletion() {
			if (!this.#store.canLaunch) {
				this.#explainRefusedLaunch();
				return false;
			}
			this.#clearErrors();
			this.#store.setLaunching(true);
			try {
				const {
					launchId
				} = await this.#api.process.start(this.#store.process?.id ?? 0, this.#store.members, this.#store.parameters, this.#userParty.isRejectExcludedEnabled());
				this.#store.setLaunchId(launchId);
				this.#store.setLaunching(false);
				return true;
			} catch (exception) {
				this.#store.setLaunching(false);
				this.#showLaunchErrors(readErrors(exception));
				return false;
			}
		}
		destroy() {
			this.#recountToken += 1;
			if (this.#recountTimeout !== null) {
				clearTimeout(this.#recountTimeout);
				this.#recountTimeout = null;
			}
			this.#unsubscribe.forEach(unsubscribe => unsubscribe());
			this.#unsubscribe = [];
			this.#userParty.closeCounterGuide();
		}
		#subscribe() {
			const recount = () => this.#scheduleRecount();
			SELECTION_EVENTS.forEach(eventName => {
				main_core_events.EventEmitter.subscribe(eventName, recount);
				this.#unsubscribe.push(() => main_core_events.EventEmitter.unsubscribe(eventName, recount));
			});
		}
		#scheduleRecount() {
			this.#recountToken += 1;
			if (this.#recountTimeout !== null) {
				clearTimeout(this.#recountTimeout);
			}
			const members = normalizeMembers(this.#userParty.getEntities());
			const excludeRefused = this.#userParty.isRejectExcludedEnabled();
			this.#store.setMembers(members);
			this.#store.setCountPending(members.length > 0);
			this.#clearErrors();
			this.#renderNotice();
			if (members.length === 0) {
				this.#recountTimeout = null;
				return;
			}
			const token = this.#recountToken;
			this.#recountTimeout = setTimeout(() => {
				this.#recountTimeout = null;
				void this.#recount(token, members, excludeRefused);
			}, RECOUNT_DELAY);
		}
		async #recount(token, members, excludeRefused) {
			try {
				const countResult = await this.#api.getUniqUserCountForMembers(members, excludeRefused);
				if (token !== this.#recountToken) {
					return;
				}
				this.#store.setCountResult(countResult);
				this.#store.setCountPending(false);
				this.#renderNotice();
			} catch {
				if (token === this.#recountToken) {
					this.#store.setCountPending(false);
				}
			}
		}
		#renderNotice() {
			main_core.Dom.clean(this.#noticeBox);
			const message = this.#getNoticeMessage();
			if (message === null) {
				return;
			}
			const design = this.#store.isNobodyLeft ? ui_system_alert.AlertDesign.tintedAlert : ui_system_alert.AlertDesign.tintedWarning;
			main_core.Dom.append(renderMessage(message, design), this.#noticeBox);
		}
		#getNoticeMessage() {
			if (this.#store.isNobodyLeft) {
				return main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_NOBODY_LEFT') ?? null;
			}
			if (this.#store.hasExclusion) {
				return main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_EXCLUDED', {
					'#EXCLUDED_COUNT#': String(this.#store.excludedCount),
					'#LAUNCH_COUNT#': String(this.#store.launchCount)
				}) ?? null;
			}
			return null;
		}
		#showLaunchErrors(errors) {
			if (this.#onLaunchRefused(errors)) {
				return;
			}
			errors.filter(error => error.name === '').forEach(error => {
				main_core.Dom.append(renderMessage(error.message, ui_system_alert.AlertDesign.tintedAlert), this.#errorBox);
			});
		}
		#explainRefusedLaunch() {
			if (this.#store.members.length > 0) {
				return;
			}
			this.#clearErrors();
			main_core.Dom.append(renderMessage(main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_EMPLOYEES_NOBODY_CHOSEN') ?? '', ui_system_alert.AlertDesign.tintedAlert), this.#errorBox);
		}
		#clearErrors() {
			main_core.Dom.clean(this.#errorBox);
		}
	}
	function renderMessage(message, design) {
		const alert = new ui_system_alert.Alert({
			design,
			content: ui_system_typography.Text.render(message, {
				size: '2xs',
				tag: 'div'
			})
		});
		return main_core.Tag.render`<div role="alert">${alert.render()}</div>`;
	}
	function getRegion() {
		return main_core.Extension.getSettings(EXTENSION_NAME).get('region') ?? '';
	}

	const ERROR_ID_PREFIX = 'sign-b2e-run-process-parameter-error';
	const FIELD_ERROR_CLASS = '--error';
	const LOADER_SIZE = 48;
	class ParametersStep {
		title;
		#store;
		#api = new sign_v2_api.Api();
		#container;
		#errorBox;
		#fieldBox;
		#manager = null;
		#loading = null;
		constructor(options) {
			this.title = options.title;
			this.#store = options.store;
			this.#errorBox = main_core.Tag.render`<div class="sign-b2e-run-process-parameters__errors"></div>`;
			this.#fieldBox = main_core.Tag.render`<div class="sign-b2e-run-process-parameters__fields"></div>`;
			this.#container = main_core.Tag.render`
			<div
				class="sign-b2e-run-process__step sign-b2e-run-process-parameters"
				data-testid="sign-b2e-run-process-step-parameters"
			>
				${this.#errorBox}
				${this.#fieldBox}
			</div>
		`;
		}
		get content() {
			void this.#load();
			return this.#container;
		}
		async beforeCompletion() {
			await this.#load();
			if (this.#manager === null) {
				return false;
			}
			this.#clearErrors();
			this.#store.setParameters(this.#manager.getValues());
			return true;
		}
		showParameterErrors(errors) {
			this.#showErrors(errors.filter(error => error.name !== ''));
			return hasFieldErrors(errors);
		}
		destroy() {
			this.#manager?.destroy();
			this.#manager = null;
		}
		#load() {
			this.#loading ??= this.#loadFields();
			return this.#loading;
		}
		async #loadFields() {
			const loader = new main_loader.Loader({
				target: this.#fieldBox,
				size: LOADER_SIZE,
				mode: 'inline'
			});
			void loader.show();
			main_core.Dom.attr(this.#fieldBox, 'aria-busy', 'true');
			try {
				this.#renderFields(readStartForm(await this.#api.process.getStartFields(this.#getProcessId())));
			} catch (exception) {
				this.#loading = null;
				this.#showErrors(readErrors(exception));
			} finally {
				loader.destroy();
				main_core.Dom.attr(this.#fieldBox, 'aria-busy', null);
			}
		}
		#renderFields(form) {
			this.#manager = new bizproc_fields.FieldManager({
				documentType: form.documentType,
				renderMode: bizproc_fields.RenderMode.Public,
				showLabels: true,
				showDescriptions: true
			});
			const rendered = this.#manager.renderCollection(form.items);
			form.items.forEach((item, index) => {
				main_core.Dom.append(this.#renderField(item, rendered[index].node), this.#fieldBox);
			});
		}
		#renderField(item, control) {
			const field = main_core.Tag.render`
			<div class="sign-b2e-run-process-parameters__field" data-testid="sign-b2e-run-process-parameter">
				${control}
			</div>
		`;
			main_core.Dom.attr(field, 'data-field', item.fieldName);
			return field;
		}
		#showErrors(errors) {
			this.#clearErrors();
			if (errors.length === 0) {
				return;
			}
			const described = errors.map((error, index) => ({
				...error,
				messageId: `${ERROR_ID_PREFIX}-${index}`
			}));
			main_core.Dom.append(this.#renderAlert(described), this.#errorBox);
			described.forEach(({
				name
			}) => {
				const field = this.#findField(name);
				if (field !== null) {
					main_core.Dom.addClass(field, FIELD_ERROR_CLASS);
				}
			});
			bizproc_a11y.markInvalidControls(this.#fieldBox, described)?.focus();
		}
		#renderAlert(described) {
			const alert = new ui_system_alert.Alert({
				design: ui_system_alert.AlertDesign.tintedAlert,
				content: main_core.Tag.render`
				<div class="sign-b2e-run-process-parameters__messages">
					${described.map(error => this.#renderMessage(error))}
				</div>
			`
			});
			return main_core.Tag.render`<div role="alert">${alert.render()}</div>`;
		}
		#renderMessage(error) {
			const message = ui_system_typography.Text.render(error.message, {
				size: '2xs',
				tag: 'div'
			});
			main_core.Dom.attr(message, 'id', error.messageId);
			return message;
		}
		#clearErrors() {
			main_core.Dom.clean(this.#errorBox);
			bizproc_a11y.clearInvalidControls(this.#fieldBox);
			[...this.#fieldBox.children].forEach(field => {
				main_core.Dom.removeClass(field, FIELD_ERROR_CLASS);
			});
		}
		#findField(name) {
			const field = [...this.#fieldBox.children].find(node => node.dataset.field === name);
			return field ?? null;
		}
		#getProcessId() {
			return this.#store.process?.id ?? 0;
		}
	}

	const RunProcessStepId = {
		Parameters: 'parameters',
		Employees: 'employees'
	};
	function getSteps(process) {
		if (process === null) {
			return [];
		}
		return process.hasParameters ? [RunProcessStepId.Parameters, RunProcessStepId.Employees] : [RunProcessStepId.Employees];
	}
	const useRunProcessStore = ui_vue3_pinia.defineStore('signB2eRunProcess', {
		state: () => ({
			process: null,
			parameters: {},
			members: [],
			count: 0,
			totalCount: 0,
			excludedCount: 0,
			countPending: false,
			hasFreshCount: false,
			launching: false,
			launchId: null
		}),
		getters: {
			steps: state => getSteps(state.process),
			hasBreadcrumbs: state => getSteps(state.process).length > 1,
			launchCount: state => state.count,
			canLaunch: state => state.members.length > 0 && state.hasFreshCount && !state.countPending && state.totalCount > 0 && state.count > 0 && !state.launching,
			hasExclusion: state => state.hasFreshCount && !state.countPending && state.excludedCount > 0 && state.count > 0,
			isNobodyLeft: state => state.hasFreshCount && !state.countPending && state.totalCount > 0 && state.count === 0
		},
		actions: {
			setProcess(process) {
				this.process = process;
			},
			setParameters(parameters) {
				this.parameters = parameters;
			},
			setMembers(members) {
				this.members = members;
				this.count = 0;
				this.totalCount = 0;
				this.excludedCount = 0;
				this.hasFreshCount = false;
			},
			setCountResult(result) {
				this.count = result.count;
				this.totalCount = result.totalCount;
				this.excludedCount = result.excludedCount;
				this.hasFreshCount = true;
			},
			setCountPending(countPending) {
				this.countPending = countPending;
			},
			setLaunching(launching) {
				this.launching = launching;
			},
			setLaunchId(launchId) {
				this.launchId = launchId;
			}
		}
	});

	const SLIDER_WIDTH = 900;
	const SLIDER_URL_PREFIX = 'sign-b2e-run-process-';
	const CATALOG_PATH = 'b2e/processes/catalog/';
	const PRIMARY_BUTTON_CLASS = 'ui-btn-primary';
	const SECONDARY_BUTTON_CLASS = 'ui-btn-light-border';
	const STEP_TITLE_MESSAGE = Object.freeze({
		[RunProcessStepId.Parameters]: 'SIGN_B2E_RUN_PROCESS_STEP_PARAMETERS',
		[RunProcessStepId.Employees]: 'SIGN_B2E_RUN_PROCESS_STEP_EMPLOYEES'
	});
	class RunProcess {
		static open(process, options = {}) {
			new RunProcess(process, options).#open();
		}
		#process;
		#options;
		#pinia = ui_vue3_pinia.createPinia();
		#slider = null;
		#wizard = null;
		#unsubscribeStore = null;
		#parametersStep = null;
		#employeesStep = null;
		#launchButton = null;
		constructor(process, options) {
			this.#process = process;
			this.#options = options;
		}
		#open() {
			main_sidepanel.SidePanel.Instance.open(`${SLIDER_URL_PREFIX}${this.#process.id}`, {
				width: SLIDER_WIDTH,
				cacheable: false,
				title: this.#process.name,
				contentCallback: slider => this.#render(slider),
				events: {
					onDestroy: () => this.#destroy()
				}
			});
		}
		#render(slider) {
			this.#slider = slider;
			const store = this.#getStore();
			store.setProcess(this.#process);
			const launchTitle = main_core.Loc.getMessage('SIGN_B2E_RUN_PROCESS_LAUNCH') ?? '';
			this.#wizard = new ui_wizard.Wizard(this.#getStepsMetadata(store.steps), {
				back: {
					className: SECONDARY_BUTTON_CLASS
				},
				next: {
					className: PRIMARY_BUTTON_CLASS
				},
				complete: {
					className: PRIMARY_BUTTON_CLASS,
					title: launchTitle,
					onComplete: () => this.#complete()
				},
				cancel: {
					className: SECONDARY_BUTTON_CLASS,
					onCancel: () => this.#closeSlider()
				},
				swapButtons: true
			});
			const wizardLayout = this.#wizard.getLayout();
			this.#launchButton = findLaunchButton(wizardLayout, launchTitle);
			const layout = main_core.Tag.render`
			<div class="sign-b2e-run-process" data-testid="sign-b2e-run-process">
				<span class="sign-b2e-run-process__title" aria-hidden="true">${main_core.Text.encode(this.#process.name)}</span>
				${wizardLayout}
			</div>
		`;
			if (!store.hasBreadcrumbs) {
				main_core.Dom.addClass(layout, '--single-step');
			}
			this.#wizard.moveOnStep(0);
			this.#subscribeStore();
			return layout;
		}
		#getStepsMetadata(steps) {
			return Object.fromEntries(steps.map(stepId => [stepId, this.#getStepMetadata(stepId)]));
		}
		#getStepMetadata(stepId) {
			const title = main_core.Loc.getMessage(STEP_TITLE_MESSAGE[stepId]) ?? '';
			if (stepId === RunProcessStepId.Parameters) {
				this.#parametersStep = new ParametersStep({
					title,
					store: this.#getStore()
				});
				return toWizardStep(this.#parametersStep);
			}
			this.#employeesStep = new EmployeesStep({
				title,
				store: this.#getStore(),
				onLaunchRefused: errors => this.#returnToParameters(errors)
			});
			return toWizardStep(this.#employeesStep);
		}
		#returnToParameters(errors) {
			if (!hasFieldErrors(errors)) {
				return false;
			}
			this.#wizard?.moveOnStep(0);
			return this.#parametersStep?.showParameterErrors(errors) ?? false;
		}
		#complete() {
			const {
				launchId
			} = this.#getStore();
			if (launchId === null) {
				this.#closeSlider();
				return;
			}
			this.#closeCatalogSlider();
			this.#closeSlider();
			this.#options.onLaunched?.(launchId);
		}
		#closeCatalogSlider() {
			const previousSlider = main_sidepanel.SidePanel.Instance.getPreviousSlider(this.#slider);
			if (previousSlider !== null && isProcessCatalogUrl(previousSlider.getUrl())) {
				previousSlider.close();
			}
		}
		#closeSlider() {
			this.#slider?.close();
		}
		#subscribeStore() {
			this.#unsubscribeStore = this.#getStore().$subscribe(() => this.#syncLaunchButton());
			this.#syncLaunchButton();
		}
		#syncLaunchButton() {
			const shouldDisable = !this.#getStore().canLaunch;
			this.#wizard?.toggleBtnActiveState('complete', shouldDisable);
			main_core.Dom.attr(this.#launchButton, 'aria-disabled', shouldDisable ? 'true' : null);
		}
		#destroy() {
			this.#unsubscribeStore?.();
			this.#unsubscribeStore = null;
			this.#parametersStep?.destroy();
			this.#parametersStep = null;
			this.#employeesStep?.destroy();
			this.#employeesStep = null;
			this.#launchButton = null;
		}
		#getStore() {
			ui_vue3_pinia.setActivePinia(this.#pinia);
			return useRunProcessStore();
		}
	}
	function toWizardStep(step) {
		return {
			get content() {
				return step.content;
			},
			title: step.title,
			beforeCompletion: () => step.beforeCompletion()
		};
	}
	function findLaunchButton(wizardLayout, title) {
		if (title === '') {
			return null;
		}
		const buttons = [...wizardLayout.querySelectorAll('button')];
		return buttons.find(button => button.title === title) ?? null;
	}
	function isProcessCatalogUrl(url) {
		const [path] = url.split(/[#?]/);
		return path.endsWith(CATALOG_PATH);
	}

	exports.RunProcess = RunProcess;

})(this.BX.Sign.V2.B2e = this.BX.Sign.V2.B2e || {}, BX, BX.SidePanel, BX.Vue3.Pinia, BX.Ui, BX.Event, BX.UI.System.Alert, BX.UI.System.Typography, BX.Sign, BX.Sign.V2, BX.Sign.V2.B2e, BX, BX.Bizproc.A11y, BX.Bizproc.Fields);
//# sourceMappingURL=index.bundle.js.map
