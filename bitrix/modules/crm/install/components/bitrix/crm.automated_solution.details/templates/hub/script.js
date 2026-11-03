/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_vue3, ui_vue3_components_button, ui_vue3_vuex, ui_vue3_mixins_locMixin, main_core_events, main_core, crm_integration_analytics, crm_dialog, ui_analytics, crm_settingsHub, ui_system_typography_vue, crm_toolbarComponent, ui_infoHelper, crm_router, ui_dialogs_messagebox, ui_entitySelector, ui_a11y, ui_system_skeleton_vue) {
	'use strict';

	function hasPassportAddress(addressUrl, addressRecord) {
		return addressRecord !== null && addressRecord !== undefined && addressUrl !== '';
	}

	function readSectionUrl(state) {
		const raw = state?.intranetCustomSectionUrl;
		return typeof raw === 'string' && raw !== '' ? raw : null;
	}

	function isCreateMode(state) {
		return !(Number(state?.automatedSolution?.id ?? 0) > 0);
	}
	function canSubmitCreate(title) {
		return String(title ?? '').trim() !== '';
	}
	function isCreateTypeLocked(isCreateMode) {
		return isCreateMode;
	}
	function shouldLeaveCreateMode(isCreateModeLatched, state) {
		if (!isCreateModeLatched || isCreateMode(state)) {
			return false;
		}
		const solutionId = Number(state?.automatedSolution?.id);
		return state?.recovery?.status !== 'idle' && Number(state?.recovery?.solutionId ?? 0) === solutionId;
	}
	function shouldCloseOnCancel(isCreateModeLatched) {
		return isCreateModeLatched;
	}
	function resolveRecoveryControls(status) {
		const isLoading = status === 'loading';
		const isFailed = status === 'failed';
		return {
			isLoading,
			isFailed,
			isBaselinePending: isLoading || isFailed
		};
	}
	function runHubSave(deps) {
		if (deps.isBlocked()) {
			return Promise.resolve();
		}
		deps.setWaiting(true);
		return deps.dispatchSave().then(() => deps.onSuccess()).catch(() => deps.onFailure()).finally(() => deps.setWaiting(false));
	}

	const UPDATE_ACTIONS = Object.freeze({
		title: 'setTitle',
		description: 'setDescription',
		isVibeEnabled: 'setIsVibeEnabled'
	});
	function buildPassportUpdate(records, recordId, value) {
		const record = records.find(item => item.id === recordId);
		if (!record || !record.valueKey) {
			return null;
		}
		return {
			id: record.id,
			valueKey: record.valueKey,
			value
		};
	}
	function resolveUpdateAction(valueKey) {
		return Object.hasOwn(UPDATE_ACTIONS, valueKey) ? UPDATE_ACTIONS[valueKey] : null;
	}

	function isPickerAvailable(permissions) {
		return Boolean(permissions?.canMoveSmartProcessFromCrm) || Boolean(permissions?.canMoveSmartProcessFromAnotherAutomatedSolution);
	}
	function buildPickerEntityOptions(permissions) {
		const canCrm = Boolean(permissions?.canMoveSmartProcessFromCrm);
		const canExternal = Boolean(permissions?.canMoveSmartProcessFromAnotherAutomatedSolution);
		if (canCrm && !canExternal) {
			return {
				showAutomatedSolutionBadge: true,
				isOnlyCrmTypes: true
			};
		}
		if (canExternal && !canCrm) {
			return {
				showAutomatedSolutionBadge: true,
				isOnlyExternalTypes: true
			};
		}
		return {
			showAutomatedSolutionBadge: true
		};
	}

	function computeTypesLocks(readOnly, permissions) {
		return {
			rowsLocked: readOnly,
			pickerLocked: readOnly || !isPickerAvailable(permissions),
			showCreateButton: !readOnly
		};
	}
	function shouldShowDeleteButton(isNew, readOnly) {
		return !isNew && !readOnly;
	}
	function isSavePanelFixed(isCreateMode, readOnly) {
		return !isCreateMode && !readOnly;
	}
	function isPassportReadOnly(readOnly, isCreateMode, isWaiting) {
		return readOnly || isWaiting;
	}
	async function applyPassportReadOnlyTransition(transition) {
		if (transition.readOnly) {
			transition.stopEdit();
			return;
		}
		if (!transition.isCreateMode) {
			return;
		}
		await transition.waitForRender();
		transition.focusTitle();
	}
	function isCreateEditPinned(isCreateMode, readOnly) {
		return isCreateMode && !readOnly;
	}

	const CREATE_TITLE_PLACEHOLDER_PHRASE = 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_TITLE_PLACEHOLDER';
	const DESCRIPTION_PLACEHOLDER_PHRASE = 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION_PLACEHOLDER';
	const CrmHubCrmPassport = ui_vue3.defineComponent({
		name: 'CrmHubCrmPassport',
		components: {
			CrmHubPassportHero: crm_settingsHub.CrmHubPassportHero,
			TextXs: ui_system_typography_vue.TextXs,
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
			isCreateMode: {
				type: Boolean,
				default: false
			},
			isWaiting: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update', 'save', 'cancel'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			heroReadOnly() {
				return isPassportReadOnly(this.readOnly, this.isCreateMode, this.isWaiting);
			},
			titleRecord() {
				return this.records.find(record => record.id === 'crm-title') ?? null;
			},
			title() {
				return String(this.snapshot.title ?? '');
			},
			description() {
				return String(this.snapshot.description ?? '');
			},
			descriptionPlaceholder() {
				return this.isCreateMode ? '' : DESCRIPTION_PLACEHOLDER_PHRASE;
			},
			titleLabelPhrase() {
				if (this.isCreateMode) {
					return CREATE_TITLE_PLACEHOLDER_PHRASE;
				}
				return this.titleRecord ? this.titleRecord.title : '';
			},
			addressRecord() {
				return this.records.find(record => record.id === 'crm-section-address') ?? null;
			},
			addressUrl() {
				return readSectionUrl(this.snapshot) ?? '';
			},
			hasAddress() {
				return hasPassportAddress(this.addressUrl, this.addressRecord);
			},
			canSave() {
				return canSubmitCreate(this.title);
			}
		},
		watch: {
			async heroReadOnly(readOnly) {
				await applyPassportReadOnlyTransition({
					isCreateMode: this.isCreateMode,
					readOnly,
					stopEdit: () => this.$refs.hero?.stopEdit?.(),
					waitForRender: () => this.$nextTick(),
					focusTitle: () => this.focusTitle()
				});
			}
		},
		mounted() {
			this.pinEditMode();
			this.focusTitle();
		},
		methods: {
			pinEditMode() {
				if (!this.isCreateMode) {
					return;
				}
				const hero = this.$refs.hero;
				hero?.$watch?.('isEditing', editing => {
					if (!editing && isCreateEditPinned(this.isCreateMode, this.heroReadOnly)) {
						hero.isEditing = true;
					}
				});
			},
			focusTitle() {
				if (!this.isCreateMode) {
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
			handleSave() {
				this.$emit('save');
			},
			handleCancel() {
				this.$emit('cancel');
			},
			handleDescriptionUpdate(value) {
				const update = buildPassportUpdate(this.records, 'crm-description', value);
				if (update) {
					this.$emit('update', update);
				}
			}
		},
		template: `
		<CrmHubPassportHero
			ref="hero"
			class="crm-automated-solution-hub-passport"
			:title="title"
			:title-label="titleLabelPhrase"
			:description="description"
			:description-placeholder="descriptionPlaceholder"
			limit-description
			icon="o-crm"
			:read-only="heroReadOnly"
			@update:title="handleTitleUpdate"
			@update:description="handleDescriptionUpdate"
		>
			<!--
				Описание правится на обоих экранах: на создании режим правки закреплён и textarea всегда под
				названием, на настройке его открывают карандаш или клик по тексту. Длину ограничивает кит
				(limit-description) по правилу поля; запрет правки и блокировку на время запроса даёт
				heroReadOnly, как у названия.
			-->
			<!--
				Кнопки создания — в слот #details героя, как «Сохранить» на эталоне создания СП (D-19):
				кит рисует его прямым потомком карточки под верхним рядом, через корневой gap и от левого
				края карточки, под картинкой. Слот #action того же места не даёт даром: он рисует
				тонированную строку __location с иконкой и пустой подписью, которую пришлось бы гасить.
				Кнопки теперь вне __content, и уход фокуса на них закрыл бы режим правки, — его держит
				закрепка pinEditMode().

				Отмены у панели кита на создании нет — панели нет вовсе, поэтому «Отменить» здесь своя.
				Фразы тоже свои: сообщения кита до шаблона не доезжают (см. lang/ru/template.php).
			-->
			<template v-if="isCreateMode" #details>
				<div class="crm-automated-solution-hub-passport__save">
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_SAVE')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.FILLED"
						:loading="isWaiting"
						:disabled="isWaiting || !canSave"
						:dataset="{ testid: 'crm-automated-solution-hub-create-save-btn' }"
						@click="handleSave"
					/>
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CREATE_CANCEL')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.PLAIN"
						:disabled="isWaiting"
						:dataset="{ testid: 'crm-automated-solution-hub-create-cancel-btn' }"
						@click="handleCancel"
					/>
				</div>
			</template>
			<!--
				Адрес — в слот placement (под названием и подписью), а НЕ в prop locationTitle: тот
				прогоняется через loc() и ждёт код фразы, поэтому URL там стал бы пустой строкой.
			-->
			<template v-if="hasAddress" #placement>
				<span
					class="crm-automated-solution-hub-passport__address"
					data-testid="crm-automated-solution-hub-passport-address"
				>
					<TextXs class="crm-automated-solution-hub-passport__address-label">{{ loc(addressRecord.title) }}</TextXs>
					<TextXs accent class="crm-automated-solution-hub-passport__address-value">{{ addressUrl }}</TextXs>
				</span>
			</template>
		</CrmHubPassportHero>
	`
	});

	const CrmHubCrmSectionCard = ui_vue3.defineComponent({
		name: 'CrmHubCrmSectionCard',
		components: {
			CrmHubCard: crm_settingsHub.CrmHubCard,
			CrmHubControlRenderer: crm_settingsHub.CrmHubControlRenderer
		},
		props: {
			cardId: {
				type: String,
				required: true
			},
			title: {
				type: String,
				default: ''
			},
			icon: {
				type: String,
				default: ''
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
			},
			isCreateMode: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update', 'action'],
		template: `
		<div class="crm-automated-solution-hub-section" :inert="isCreateMode || null">
			<CrmHubCard :card-id="cardId" :title="title" :icon="icon" collapsible>
				<div class="crm-automated-solution-hub-section__rows">
					<CrmHubControlRenderer
						v-for="record in records"
						:key="record.id"
						:descriptor="record"
						:snapshot="snapshot"
						:read-only="readOnly"
						:controls="controls"
						@update="$emit('update', $event)"
						@action="$emit('action', $event)"
					/>
				</div>
			</CrmHubCard>
		</div>
	`
	});

	class VibeService {
		static getSolution(id) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.automatedsolution.get', {
					data: {
						id
					}
				}).then(response => {
					const solution = mapSolutionDto(response?.data?.automatedSolution);
					if (solution?.id === id) {
						resolve(solution);
						return;
					}
					reject(new Error(`The read-back has no automated solution ${id}`));
				}).catch(reject);
			});
		}
		static getSettings(id) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.automatedsolution.getVibeSettings', {
					data: {
						automatedSolutionId: id
					}
				}).then(response => {
					if (response?.status !== 'success') {
						reject(response);
						return;
					}
					const html = response.data?.html;
					resolve(main_core.Type.isStringFilled(html) ? html : '');
				}).catch(reject);
			});
		}
	}
	const FIELD_MAPPERS = {
		title: value => main_core.Type.isNil(value) ? null : String(value),
		description: value => main_core.Type.isNil(value) ? '' : String(value),
		typeIds: value => {
			const typeIds = Array.isArray(value) ? value : [];
			return typeIds.map(typeId => main_core.Text.toInteger(typeId)).filter(typeId => typeId > 0);
		},
		isVibeEnabled: value => main_core.Text.toBoolean(value),
		vibeId: value => Math.max(main_core.Text.toInteger(value), 0),
		intranetCustomSectionId: value => {
			const sectionId = main_core.Text.toInteger(value);
			return sectionId > 0 ? sectionId : null;
		}
	};
	function mapSolutionDto(dto) {
		if (!main_core.Type.isPlainObject(dto)) {
			return null;
		}
		const source = dto;
		const id = main_core.Text.toInteger(source.id);
		if (id <= 0) {
			return null;
		}
		const solution = {
			id
		};
		for (const [key, mapValue] of Object.entries(FIELD_MAPPERS)) {
			if (Object.hasOwn(source, key)) {
				solution[key] = mapValue(source[key]);
			}
		}
		return solution;
	}

	function reconcileSave(input) {
		const {
			previousBaseline,
			current,
			server
		} = input;
		const baseline = {
			id: pickServerValue(server, previousBaseline, 'id'),
			title: pickServerValue(server, previousBaseline, 'title'),
			description: pickServerValue(server, previousBaseline, 'description'),
			typeIds: [...pickServerValue(server, previousBaseline, 'typeIds')],
			isVibeEnabled: pickServerValue(server, previousBaseline, 'isVibeEnabled'),
			vibeId: pickServerValue(server, previousBaseline, 'vibeId'),
			intranetCustomSectionId: pickServerValue(server, previousBaseline, 'intranetCustomSectionId')
		};
		const takeServer = field => {
			return Object.hasOwn(server, field) && !isEditedAfterSubmit(input, field);
		};
		const draft = {
			title: takeServer('title') ? baseline.title : current.title,
			description: takeServer('description') ? baseline.description : current.description,
			typeIds: [...current.typeIds],
			isVibeEnabled: takeServer('isVibeEnabled') ? baseline.isVibeEnabled : current.isVibeEnabled
		};
		return {
			baseline,
			draft,
			isModified: !isDraftSaved(draft, baseline)
		};
	}
	function pickServerValue(server, previousBaseline, key) {
		return Object.hasOwn(server, key) ? server[key] : previousBaseline[key];
	}
	function isEditedAfterSubmit({
		submitted,
		current,
		revisions
	}, field) {
		return revisions.current[field] !== revisions.submitted[field] && current[field] !== submitted[field];
	}
	function isDraftSaved(draft, baseline) {
		return draft.title === baseline.title && draft.description === baseline.description && draft.isVibeEnabled === baseline.isVibeEnabled && isSameTypeIds(draft.typeIds, baseline.typeIds);
	}
	function isSameTypeIds(left, right) {
		const rightSet = new Set(right);
		return new Set(left).size === rightSet.size && left.every(typeId => rightSet.has(typeId));
	}

	const pendingContexts = new WeakMap();
	class RecoverSolution {
		static captureContext(state) {
			const solution = state.automatedSolution;
			return {
				previousBaseline: {
					id: solution.id,
					title: solution.title,
					description: solution.description,
					typeIds: [...state.automatedSolutionOrigTypeIds],
					isVibeEnabled: state.automatedSolutionOrigIsVibeEnabled,
					vibeId: solution.vibeId,
					intranetCustomSectionId: solution.intranetCustomSectionId
				},
				submitted: readDraft(state),
				revisions: {
					...state.revisions
				}
			};
		}
		static isPending(state) {
			return ['loading', 'failed'].includes(state.recovery.status);
		}
		static startFromSaveError(store, response, context, deps) {
			const answer = mapSolutionDto(response?.data?.automatedSolution);
			if (!answer || !isPartialSave(response, context)) {
				return null;
			}
			store.commit('acceptIdentity', {
				id: answer.id,
				vibeId: answer.vibeId ?? store.state.automatedSolution.vibeId
			});
			const identified = {
				...context,
				previousBaseline: {
					...context.previousBaseline,
					id: answer.id
				}
			};
			const answerVibe = pickPresent(answer, ['id', 'vibeId', 'isVibeEnabled']);
			const verified = reconcile(store.state, identified, answerVibe);
			if (verified.draft.isVibeEnabled !== store.state.automatedSolution.isVibeEnabled) {
				identified.submitted = {
					...identified.submitted,
					isVibeEnabled: verified.draft.isVibeEnabled
				};
				identified.revisions = {
					...identified.revisions,
					isVibeEnabled: store.state.revisions.isVibeEnabled
				};
			}
			store.commit('applyVerifiedState', verified);
			pendingContexts.set(store.state, identified);
			return readBack(store, identified, deps);
		}
		static retry(store, deps) {
			const context = pendingContexts.get(store.state);
			if (store.state.recovery.status !== 'failed' || !context) {
				return Promise.resolve();
			}
			return readBack(store, context, deps);
		}
	}
	function isPartialSave(response, context) {
		if (context.previousBaseline.id === null) {
			return true;
		}
		const errors = Array.isArray(response?.errors) ? response.errors : [];
		if (errors.some(error => main_core.Type.isStringFilled(error?.code) && error.code.startsWith('VIBE_'))) {
			return true;
		}
		return !Object.hasOwn(response.data.automatedSolution, 'intranetCustomSectionId');
	}
	function readBack(store, context, deps) {
		const solutionId = context.previousBaseline.id;
		const token = store.state.recovery.token + 1;
		store.commit('setRecovery', {
			token,
			solutionId,
			status: 'loading',
			baseline: context.previousBaseline,
			draft: context.submitted
		});
		const isCurrent = () => {
			return store.state.recovery.token === token && store.state.automatedSolution.id === solutionId;
		};
		return deps.getSolution(solutionId).then(server => {
			if (!isCurrent()) {
				return;
			}
			if (server?.id !== solutionId) {
				store.commit('setRecovery', {
					status: 'failed'
				});
				return;
			}
			const verified = reconcile(store.state, context, server);
			store.commit('applyVerifiedState', verified);
			store.commit('setRecovery', {
				status: 'ready',
				baseline: verified.baseline,
				draft: verified.draft
			});
			pendingContexts.delete(store.state);
			deps.notifyUpdated(server);
		}, () => {
			if (isCurrent()) {
				store.commit('setRecovery', {
					status: 'failed'
				});
			}
		});
	}
	function reconcile(state, context, server) {
		return reconcileSave({
			previousBaseline: context.previousBaseline,
			submitted: context.submitted,
			current: readDraft(state),
			server,
			revisions: {
				submitted: context.revisions,
				current: {
					...state.revisions
				}
			}
		});
	}
	function readDraft(state) {
		const solution = state.automatedSolution;
		return {
			title: solution.title,
			description: solution.description,
			typeIds: [...solution.typeIds],
			isVibeEnabled: solution.isVibeEnabled
		};
	}
	function pickPresent(solution, keys) {
		const picked = {};
		for (const key of keys) {
			if (Object.hasOwn(solution, key)) {
				picked[key] = solution[key];
			}
		}
		return picked;
	}

	function canShowVibe({
		featureEnabled,
		available,
		readOnly
	}) {
		return featureEnabled === true && available === true && readOnly !== true;
	}

	function buildSaveFields(automatedSolution, normalizeDescription, vibeVisibility = null) {
		const fields = main_core.Runtime.clone(automatedSolution);
		fields.description = normalizeDescription(automatedSolution.description);
		delete fields.vibeId;
		if (!vibeVisibility || !canShowVibe(vibeVisibility)) {
			delete fields.isVibeEnabled;
		}
		if (automatedSolution.typeIds.length <= 0) {
			fields.typeIds = false;
		}
		return fields;
	}

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
				result[key] = String(value);
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
	function toDescriptionValue(description) {
		if (main_core.Type.isNil(description)) {
			return '';
		}
		return String(description);
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
		setDescription: (store, description) => {
			store.commit('setDescription', description);
		},
		addTypeId: (store, typeId) => {
			store.commit('addTypeId', typeId);
		},
		removeTypeId: (store, typeId) => {
			store.commit('removeTypeId', typeId);
		},
		setIsVibeEnabled: (store, isVibeEnabled) => {
			store.commit('setIsVibeEnabled', isVibeEnabled);
		},
		save: (store, payload = {}) => {
			if (RecoverSolution.isPending(store.state)) {
				return Promise.reject(new Error('The created automated solution is not read back yet'));
			}
			let savePromise = null;
			const saveContext = RecoverSolution.captureContext(store.state);
			const fields = buildSaveFields(store.state.automatedSolution, payload.normalizeDescription ?? toDescriptionValue, resolveVibeVisibility(store.state, payload.readOnly));
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
				console.warn('could not save automated solution', {
					response,
					state: main_core.Runtime.clone(store.state)
				});
				const errors = Array.isArray(response?.errors) ? response.errors : [];
				void RecoverSolution.startFromSaveError(store, response, saveContext, createRecoveryDeps(payload));
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
					store.dispatch('setErrors', errors);
				}
				throw errors;
			});
		},
		retryRecovery: (store, payload = {}) => {
			return RecoverSolution.retry(store, createRecoveryDeps(payload));
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
				store.dispatch('setErrors', errors);
				throw errors;
			});
		}
	};
	function runAjaxAction(...ajaxRunActionArgs) {
		return new Promise((resolve, reject) => {
			main_core.ajax.runAction(...ajaxRunActionArgs).then(resolve).catch(reject);
		});
	}
	function resolveVibeVisibility(state, readOnly) {
		if (main_core.Type.isNil(readOnly)) {
			return null;
		}
		return {
			featureEnabled: state.isVibeFeatureEnabled,
			available: state.isVibeAvailable,
			readOnly
		};
	}
	function createRecoveryDeps(payload) {
		return {
			getSolution: id => VibeService.getSolution(id),
			notifyUpdated: payload.notifyUpdated ?? emitUpdateEventToOutsideWorld
		};
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

	var mutations = {
		setState: (state, stateToSet) => {
			state.automatedSolution.id = normalizeId(stateToSet.automatedSolution?.id);
			state.automatedSolution.title = normalizeTitle(stateToSet.automatedSolution?.title);
			state.automatedSolution.description = toDescriptionValue(stateToSet.automatedSolution?.description);
			const typeIds = normalizeTypesIds(stateToSet.automatedSolution?.typeIds);
			state.automatedSolution.typeIds = [...typeIds];
			state.automatedSolutionOrigTypeIds = [...typeIds];
			state.automatedSolution.isVibeEnabled = normalizeVibeEnabled(stateToSet.automatedSolution?.isVibeEnabled);
			state.automatedSolutionOrigIsVibeEnabled = state.automatedSolution.isVibeEnabled;
			state.automatedSolution.vibeId = normalizeVibeId(stateToSet.automatedSolution?.vibeId);
			if (Object.hasOwn(stateToSet, 'isVibeFeatureEnabled')) {
				state.isVibeFeatureEnabled = main_core.Text.toBoolean(stateToSet.isVibeFeatureEnabled);
			}
			if (Object.hasOwn(stateToSet, 'isVibeAvailable')) {
				state.isVibeAvailable = main_core.Text.toBoolean(stateToSet.isVibeAvailable);
			}
			state.permissions.canMoveSmartProcessFromCrm = main_core.Text.toBoolean(stateToSet.permissions?.canMoveSmartProcessFromCrm ?? false);
			state.permissions.canMoveSmartProcessFromAnotherAutomatedSolution = main_core.Text.toBoolean(stateToSet.permissions?.canMoveSmartProcessFromAnotherAutomatedSolution ?? false);
			state.dynamicTypesTitles = normalizeDynamicTypesTitles(stateToSet.dynamicTypesTitles);
			state.errors = normalizeErrors(stateToSet.errors);
			state.isModified = false;
			state.isPermissionsLayoutV2Enabled = main_core.Text.toBoolean(stateToSet.isPermissionsLayoutV2Enabled ?? false);
		},
		applyVerifiedState: (state, {
			baseline,
			draft,
			isModified
		}) => {
			const draftTypeIds = normalizeTypesIds(draft.typeIds);
			state.automatedSolution = {
				id: normalizeId(baseline.id),
				title: normalizeTitle(draft.title),
				typeIds: [...draftTypeIds],
				intranetCustomSectionId: normalizeId(baseline.intranetCustomSectionId),
				description: toDescriptionValue(draft.description),
				isVibeEnabled: normalizeVibeEnabled(draft.isVibeEnabled),
				vibeId: normalizeVibeId(baseline.vibeId)
			};
			state.automatedSolutionOrigTypeIds = [...normalizeTypesIds(baseline.typeIds)];
			state.automatedSolutionOrigIsVibeEnabled = normalizeVibeEnabled(baseline.isVibeEnabled);
			state.isModified = Boolean(isModified);
		},
		acceptIdentity: (state, {
			id,
			vibeId
		}) => {
			state.automatedSolution.id = normalizeId(id);
			state.automatedSolution.vibeId = normalizeVibeId(vibeId);
		},
		setRecovery: (state, recovery) => {
			if (Object.hasOwn(recovery, 'status') && !RECOVERY_STATUSES.has(recovery.status)) {
				return;
			}
			state.recovery = {
				...state.recovery,
				...main_core.Runtime.clone(recovery)
			};
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
				markEdited(state, 'title');
			}
			state.automatedSolution.title = newTitle;
		},
		setDescription: (state, description) => {
			const newDescription = toDescriptionValue(description);
			if (newDescription !== state.automatedSolution.description) {
				markEdited(state, 'description');
			}
			state.automatedSolution.description = newDescription;
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
			markEdited(state, 'typeIds');
		},
		removeTypeId: (state, typeId) => {
			const normalizedTypeId = normalizeTypeId(typeId);
			if (normalizedTypeId <= 0) {
				return;
			}
			const newTypeIds = state.automatedSolution.typeIds.filter(id => id !== normalizedTypeId);
			if (newTypeIds.length !== state.automatedSolution.typeIds.length) {
				markEdited(state, 'typeIds');
			}
			state.automatedSolution.typeIds = newTypeIds;
		},
		setIsVibeEnabled: (state, isVibeEnabled) => {
			const newIsVibeEnabled = normalizeVibeEnabled(isVibeEnabled);
			if (newIsVibeEnabled !== state.automatedSolution.isVibeEnabled) {
				markEdited(state, 'isVibeEnabled');
			}
			state.automatedSolution.isVibeEnabled = newIsVibeEnabled;
		}
	};
	const RECOVERY_STATUSES = new Set(['idle', 'loading', 'failed', 'ready']);
	function markEdited(state, field) {
		state.isModified = true;
		state.revisions[field] += 1;
	}
	function normalizeVibeEnabled(isVibeEnabled) {
		return main_core.Text.toBoolean(isVibeEnabled ?? false);
	}
	function normalizeVibeId(vibeId) {
		return Math.max(main_core.Text.toInteger(vibeId ?? 0), 0);
	}

	const store = {
		strict: true,
		state() {
			return {
				automatedSolutionOrigTypeIds: [],
				automatedSolutionOrigIsVibeEnabled: false,
				automatedSolution: {
					id: null,
					title: null,
					typeIds: [],
					intranetCustomSectionId: null,
					description: '',
					isVibeEnabled: false,
					vibeId: 0
				},
				isVibeFeatureEnabled: false,
				isVibeAvailable: false,
				permissions: {
					canMoveSmartProcessFromCrm: false,
					canMoveSmartProcessFromAnotherAutomatedSolution: false
				},
				dynamicTypesTitles: {},
				intranetCustomSectionUrl: null,
				errors: [],
				isModified: false,
				isPermissionsLayoutV2Enabled: false,
				revisions: {
					title: 0,
					description: 0,
					typeIds: 0,
					isVibeEnabled: 0
				},
				recovery: {
					token: 0,
					solutionId: null,
					status: 'idle',
					baseline: null,
					draft: null
				}
			};
		},
		getters: {
			isNew: state => {
				return (state.automatedSolution.id ?? 0) <= 0;
			},
			isSaved: (state, getters) => {
				return !state.isModified && !getters.isNew;
			}
		},
		actions,
		mutations
	};

	function createSaveAnalyticsBuilder(store) {
		const builder = store.getters.isNew ? new crm_integration_analytics.Builder.Automation.AutomatedSolution.CreateEvent() : new crm_integration_analytics.Builder.Automation.AutomatedSolution.EditEvent();
		return builder.setId(store.state.automatedSolution.id).setTypeIds(store.state.automatedSolution.typeIds);
	}

	const CrmControlType = Object.freeze({
		Types: 'types',
		Vibe: 'vibe'
	});
	const CrmSectionId = Object.freeze({
		Main: 'main',
		Types: 'types',
		Vibe: 'vibe'
	});
	[{
		id: CrmSectionId.Main,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_COMMON'
	}, {
		id: CrmSectionId.Types,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TYPES'
	}, {
		id: CrmSectionId.Vibe,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE'
	}];
	const CRM_HUB_RECORDS = [{
		id: 'crm-title',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_FIELD_LABEL_TITLE',
		availableFromStep: 1,
		valueKey: 'title',
		legacyBinding: {
			name: 'title'
		}
	}, {
		id: 'crm-section-address',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'text',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_ADDRESS',
		availableFromStep: 1,
		valueKey: 'intranetCustomSectionId',
		legacyBinding: {
			name: 'intranetCustomSectionId'
		}
	}, {
		id: 'crm-description',
		sectionId: CrmSectionId.Main,
		kind: 'scalar',
		controlType: 'field',
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DESCRIPTION',
		availableFromStep: 2,
		valueKey: 'description',
		legacyBinding: {
			name: 'description'
		}
	}, {
		id: 'crm-types',
		sectionId: CrmSectionId.Types,
		kind: 'relation',
		controlType: CrmControlType.Types,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_TYPES',
		availableFromStep: 1,
		source: {
			selectedItemsKey: 'automatedSolution.typeIds'
		},
		selector: {
			entityType: 'dynamic_type',
			multiple: true
		},
		adapterKey: 'types',
		legacyBinding: {
			name: 'typeIds'
		}
	}, {
		id: 'crm-vibe',
		sectionId: CrmSectionId.Vibe,
		kind: 'scalar',
		controlType: CrmControlType.Vibe,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE',
		availableFromStep: 1,
		valueKey: 'isVibeEnabled',
		legacyBinding: {
			name: 'isVibeEnabled'
		}
	}];

	const CrmHubTreeSectionId = Object.freeze({
		Passport: 'passport',
		Types: 'types',
		Vibe: 'vibe'
	});
	const HUB_TREE_SECTION_BY_RECORD = {
		'crm-title': CrmHubTreeSectionId.Passport,
		'crm-description': CrmHubTreeSectionId.Passport,
		'crm-section-address': CrmHubTreeSectionId.Passport,
		'crm-types': CrmHubTreeSectionId.Types,
		'crm-vibe': CrmHubTreeSectionId.Vibe
	};
	const HUB_TREE_SECTIONS = [{
		id: CrmHubTreeSectionId.Types,
		title: 'CRM_AUTOMATED_SOLUTION_DETAILS_TAB_COMMON',
		hideTitle: true
	}];
	const HUB_TREE_SECTION_BY_TAB = {
		common: CrmHubTreeSectionId.Types,
		types: CrmHubTreeSectionId.Types
	};
	const HUB_TREE_DEFAULT_SECTION_ID = CrmHubTreeSectionId.Types;
	function applyHubTree(records) {
		return records.map(record => {
			const sectionId = HUB_TREE_SECTION_BY_RECORD[record.id];
			return sectionId ? {
				...record,
				sectionId
			} : record;
		});
	}
	function pickSectionRecords(records, sectionId, supplyStep) {
		return records.filter(record => record.sectionId === sectionId && record.availableFromStep <= supplyStep);
	}

	function revertForm(snapshot, deps) {
		if (!snapshot || deps.isBaselineKnown?.() === false) {
			return;
		}
		deps.applyVuexState(snapshot.vuexState);
		if (snapshot.typesControlState) {
			deps.applyTypesControl(snapshot.typesControlState);
		}
	}
	function commitBaseline(previous, server, typesBaseline) {
		if (!previous) {
			return null;
		}
		return {
			vuexState: {
				...previous.vuexState,
				automatedSolution: {
					...previous.vuexState.automatedSolution,
					id: server.id,
					title: server.title,
					description: server.description,
					typeIds: [...server.typeIds],
					intranetCustomSectionId: server.intranetCustomSectionId,
					isVibeEnabled: server.isVibeEnabled,
					vibeId: server.vibeId
				},
				automatedSolutionOrigTypeIds: [...server.typeIds],
				automatedSolutionOrigIsVibeEnabled: server.isVibeEnabled,
				isModified: false
			},
			typesControlState: typesBaseline
		};
	}

	function canRegisterCancelEvent(isDirty, isCloseConfirmed) {
		return !isDirty || isCloseConfirmed;
	}
	function resolveCancelElement(deferredElement, element) {
		return deferredElement ?? element;
	}

	function runInternalSave(deps) {
		return deps.dispatchSave().then(() => {
			deps.commitSnapshot();
			deps.reportSuccess();
		}).catch(error => {
			deps.reportError();
			throw error;
		});
	}

	function buildReloadQuery() {
		return {
			activeTabId: 'types'
		};
	}
	function shouldReloadAfterSave(id) {
		return Number(id ?? 0) > 0;
	}
	function buildFrameQuery(isInSlider) {
		return isInSlider ? {
			IFRAME: 'Y',
			IFRAME_TYPE: 'SIDE_SLIDER'
		} : {};
	}

	function buildTypeRows(revealedTypeIds, boundTypeIds, titles) {
		const bound = new Set((boundTypeIds ?? []).map(id => Number(id)));
		return revealedTypeIds.map(typeId => ({
			typeId,
			title: titles[String(typeId)] ?? '',
			checked: bound.has(typeId)
		}));
	}

	function seedRevealedTypeIds(typeIds) {
		const seen = new Set();
		const result = [];
		(typeIds ?? []).forEach(rawId => {
			const typeId = Number(rawId);
			if (Number.isInteger(typeId) && typeId > 0 && !seen.has(typeId)) {
				seen.add(typeId);
				result.push(typeId);
			}
		});
		return result;
	}
	function withRevealedTypeId(ids, typeId) {
		return ids.includes(typeId) ? ids : [...ids, typeId];
	}

	function seedTypeTitles(titles) {
		const result = {};
		if (titles === null || typeof titles !== 'object') {
			return result;
		}
		Object.entries(titles).forEach(([key, value]) => {
			const typeId = Number(key);
			if (Number.isInteger(typeId) && typeId > 0 && typeof value === 'string' && value !== '') {
				result[String(typeId)] = value;
			}
		});
		return result;
	}
	function withTypeTitle(titles, typeId, title) {
		if (title === '') {
			return titles;
		}
		return {
			...titles,
			[String(typeId)]: title
		};
	}

	function captureTypesSnapshot(revealedTypeIds, titles) {
		return {
			revealedTypeIds: [...revealedTypeIds],
			titles: {
				...titles
			}
		};
	}
	function applyTypesSnapshot(snapshot) {
		return {
			revealedTypeIds: [...(snapshot?.revealedTypeIds ?? [])],
			titles: {
				...(snapshot?.titles ?? {})
			}
		};
	}
	function rebaseTypesSnapshot(previous, serverTypeIds, knownTitles) {
		const rebased = applyTypesSnapshot(previous);
		for (const typeId of serverTypeIds) {
			const key = String(typeId);
			if (!rebased.revealedTypeIds.includes(typeId)) {
				rebased.revealedTypeIds.push(typeId);
			}
			if (!Object.hasOwn(rebased.titles, key) && Object.hasOwn(knownTitles, key)) {
				rebased.titles[key] = knownTitles[key];
			}
		}
		return rebased;
	}

	function dispatchSave(store, normalizeDescription, readOnly) {
		return store.dispatch('save', {
			normalizeDescription,
			readOnly
		});
	}

	class SaveSolution {
		#deps;
		constructor(deps) {
			this.#deps = deps;
		}
		execute() {
			const store = this.#deps.getStore();
			const builder = createSaveAnalyticsBuilder(store).setElement(crm_integration_analytics.Dictionary.ELEMENT_CREATE_BUTTON);
			void runHubSave({
				isBlocked: () => RecoverSolution.isPending(store.state),
				setWaiting: waiting => this.#deps.setWaiting(waiting),
				dispatchSave: () => dispatchSave(store, this.#deps.normalizeDescription, this.#deps.readOnly),
				onSuccess: () => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).setId(store.state.automatedSolution.id).buildData());
					this.#deps.markCancelEventRegistered();
					this.#deps.commitSnapshot();
					const solutionId = store.state.automatedSolution.id;
					if (shouldReloadAfterSave(solutionId)) {
						reloadWithNewUri(solutionId, buildReloadQuery());
					}
				},
				onFailure: () => {
					ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).setId(store.state.automatedSolution.id).buildData());
					this.#deps.reportFailure();
				}
			});
		}
	}
	function closeSliderOrRedirect() {
		setTimeout(() => {
			crm_router.Router.Instance.closeSliderOrRedirect(crm_router.Router.Instance.getAutomatedSolutionListUrl(), window);
		});
	}
	function reloadWithNewUri(automatedSolutionId, queryParams = {}) {
		setTimeout(() => {
			const uri = crm_router.Router.Instance.getAutomatedSolutionDetailUrl(automatedSolutionId);
			const isInSlider = Boolean(BX.SidePanel?.Instance?.getSliderByWindow(window));
			uri.setQueryParams({
				...queryParams,
				...buildFrameQuery(isInSlider)
			});
			window.location.href = uri.toString();
		});
	}

	const TYPE_ROW_ICON = 'o-smart-process';
	const CrmHubCrmTypesControl = ui_vue3.defineComponent({
		name: 'CrmHubCrmTypesControl',
		components: {
			CrmHubFeatureCard: crm_settingsHub.CrmHubFeatureCard,
			UiButton: ui_vue3_components_button.Button
		},
		inject: {
			hubControlRegistry: {
				default: null
			},
			hubCommitSnapshot: {
				default: null
			},
			hubReportSaveFailure: {
				default: null
			},
			hubIsCreateMode: {
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
			reason: {
				type: String,
				default: ''
			}
		},
		emits: ['update', 'action'],
		setup() {
			const store = ui_vue3_vuex.useStore();
			const isCreateModeOnMount = isCreateMode(store.state);
			return {
				store,
				isCreateModeOnMount,
				TYPE_ROW_ICON,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				typeDialog: null,
				revealedTypeIds: [],
				typeTitles: {}
			};
		},
		computed: {
			isTypeCreationLocked() {
				const readCreateMode = this.hubIsCreateMode;
				return isCreateTypeLocked(readCreateMode ? readCreateMode() : this.isCreateModeOnMount);
			},
			rows() {
				return buildTypeRows(this.revealedTypeIds, this.store.state.automatedSolution.typeIds, this.typeTitles);
			},
			locks() {
				return computeTypesLocks(this.readOnly, this.store.state.permissions);
			},
			isShowPermissionsResetAlert() {
				if (!this.store.state.isPermissionsLayoutV2Enabled) {
					return false;
				}
				const currentTypeIds = [...this.store.state.automatedSolution.typeIds];
				const originallyTypeIds = [...this.store.state.automatedSolutionOrigTypeIds];
				return currentTypeIds.some(id => !originallyTypeIds.includes(id)) || originallyTypeIds.some(id => !currentTypeIds.includes(id));
			}
		},
		created() {
			this.typeTitles = seedTypeTitles(this.store.state.dynamicTypesTitles);
			this.revealedTypeIds = seedRevealedTypeIds(this.store.state.automatedSolution.typeIds);
			this.registerInRegistry();
		},
		beforeUnmount() {
			this.unregisterFromRegistry();
			this.destroyTypeDialog();
		},
		methods: {
			handleRowToggle(row, checked) {
				if (this.typeDialog?.isOpen?.()) {
					return;
				}
				if (this.locks.rowsLocked) {
					return;
				}
				this.store.dispatch(checked ? 'addTypeId' : 'removeTypeId', row.typeId);
			},
			openTypePicker() {
				if (this.locks.pickerLocked) {
					return;
				}
				if (this.typeDialog?.isOpen?.()) {
					this.typeDialog.hide?.();
					return;
				}
				const anchor = this.$refs.pickerAnchor;
				const targetNode = anchor?.$el ?? anchor;
				if (!targetNode) {
					return;
				}
				this.destroyTypeDialog();
				const boundTypeIds = [...this.store.state.automatedSolution.typeIds];
				this.typeDialog = ui_vue3.markRaw(new ui_entitySelector.Dialog({
					targetNode,
					multiple: true,
					dropdownMode: true,
					enableSearch: true,
					showAvatars: false,
					height: 200,
					context: 'crm.automated_solutions.details',
					entities: [{
						id: 'dynamic_type',
						dynamicLoad: true,
						dynamicSearch: true,
						options: buildPickerEntityOptions(this.store.state.permissions)
					}],
					preselectedItems: boundTypeIds.map(typeId => ['dynamic_type', typeId]),
					events: {
						'Item:onSelect': event => this.handlePickerToggle(event, true),
						'Item:onDeselect': event => this.handlePickerToggle(event, false)
					}
				}));
				this.typeDialog.show();
			},
			handlePickerToggle(event, checked) {
				const {
					item
				} = event.getData();
				const typeId = Number(item.getId());
				if (!Number.isInteger(typeId) || typeId <= 0) {
					return;
				}
				if (!checked) {
					this.store.dispatch('removeTypeId', typeId);
					return;
				}
				this.typeTitles = withTypeTitle(this.typeTitles, typeId, String(item.getTitle() ?? ''));
				this.revealedTypeIds = withRevealedTypeId(this.revealedTypeIds, typeId);
				this.store.dispatch('addTypeId', typeId);
			},
			destroyTypeDialog() {
				this.typeDialog?.destroy?.();
				this.typeDialog = null;
			},
			handleCreateTypeClick() {
				if (this.isTypeCreationLocked) {
					return;
				}
				if (RecoverSolution.isPending(this.store.state)) {
					return;
				}
				if (this.store.getters.isSaved) {
					this.openTypeCreationSlider();
					return;
				}
				ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_MESSAGE') ?? '', messageBox => {
					return this.save().then(() => this.openTypeCreationSlider()).finally(() => messageBox.close());
				}, main_core.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_NEED_SAVE_POPUP_YES_CAPTION') ?? '');
			},
			openTypeCreationSlider() {
				void crm_router.Router.Instance.openTypeDetail(0, null, {
					automatedSolutionId: this.store.state.automatedSolution.id,
					activeTabId: 'common',
					isExternal: 'Y'
				}).then(() => {
					reloadWithNewUri(this.store.state.automatedSolution.id, buildReloadQuery());
				});
			},
			save() {
				const builder = createSaveAnalyticsBuilder(this.store).setElement(crm_integration_analytics.Dictionary.ELEMENT_SAVE_IS_REQUIRED_TO_PROCEED_POPUP);
				return runInternalSave({
					dispatchSave: () => this.store.dispatch('save', {
						readOnly: this.readOnly
					}),
					commitSnapshot: () => this.commitHubSnapshot(),
					reportSuccess: () => {
						ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).setId(this.store.state.automatedSolution.id).buildData());
					},
					reportError: () => {
						ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).setId(this.store.state.automatedSolution.id).buildData());
						this.reportHubSaveFailure();
					}
				});
			},
			reportHubSaveFailure() {
				const reportSaveFailure = this.hubReportSaveFailure;
				reportSaveFailure?.();
			},
			commitHubSnapshot() {
				const commitSnapshot = this.hubCommitSnapshot;
				commitSnapshot?.();
			},
			captureSnapshot() {
				return captureTypesSnapshot(this.revealedTypeIds, this.typeTitles);
			},
			applySnapshot(snapshot) {
				const restored = applyTypesSnapshot(snapshot);
				this.revealedTypeIds = restored.revealedTypeIds;
				this.typeTitles = restored.titles;
			},
			rebaseSnapshot(previous, serverTypeIds) {
				return rebaseTypesSnapshot(previous, serverTypeIds, this.typeTitles);
			},
			registerInRegistry() {
				const registry = this.hubControlRegistry;
				if (registry) {
					registry[this.descriptor.id] = {
						captureSnapshot: () => this.captureSnapshot(),
						applySnapshot: snapshot => this.applySnapshot(snapshot),
						rebaseSnapshot: (previous, serverTypeIds) => {
							return this.rebaseSnapshot(previous, serverTypeIds);
						}
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
		<div class="crm-automated-solution-hub-types">
			<div v-if="rows.length" class="crm-automated-solution-hub-types__rows">
				<CrmHubFeatureCard
					v-for="row in rows"
					:key="row.typeId"
					:feature-id="'crm-type-' + row.typeId"
					:title-text="row.title"
					:icon="TYPE_ROW_ICON"
					:checked="row.checked"
					:disabled="locks.rowsLocked"
					@update="handleRowToggle(row, $event)"
				/>
			</div>
			<div class="crm-automated-solution-hub-types__actions">
				<span ref="pickerAnchor">
					<UiButton
						:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_PICK')"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.OUTLINE_NO_ACCENT"
						:left-icon="'plus-l'"
						:disabled="locks.pickerLocked"
						:dataset="{ testid: 'crm-automated-solution-types-pick-btn' }"
						@click="openTypePicker"
					/>
				</span>
				<UiButton
					v-if="locks.showCreateButton"
					:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_TYPES_CREATE')"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE_NO_ACCENT"
					:dataset="{ testid: 'crm-automated-solution-types-create-btn' }"
					@click="handleCreateTypeClick"
				/>
			</div>
			<div
				v-if="isShowPermissionsResetAlert"
				class="ui-alert ui-alert-warning crm-automated-solution-details-hub-types__reset-alert"
			>
				<span class="ui-alert-message">
					{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_PERMISSIONS_WILL_BE_RESET_ALERT') }}
				</span>
			</div>
		</div>
	`
	});

	const VibeWidgetStatus = {
		Hidden: 'hidden',
		Pending: 'pending',
		Loading: 'loading',
		Ready: 'ready',
		Empty: 'empty',
		Error: 'error'
	};

	class VibeSettings {
		#deps;
		#status = VibeWidgetStatus.Hidden;
		#generation = 0;
		#context = null;
		#isDisposed = false;
		constructor(deps) {
			this.#deps = deps;
		}
		getStatus() {
			return this.#status;
		}
		update(input) {
			if (this.#isDisposed) {
				return;
			}
			const context = resolveContext(input);
			if (context === null) {
				this.#stop(isFirstSaveOfPage(input) ? VibeWidgetStatus.Pending : VibeWidgetStatus.Hidden);
				return;
			}
			if (context !== this.#context) {
				void this.#load(context, input.solutionId);
			}
		}
		dispose() {
			this.#isDisposed = true;
			this.#generation++;
			this.#context = null;
		}
		#stop(status) {
			this.#generation++;
			this.#context = null;
			this.#setStatus(status);
		}
		async #load(context, solutionId) {
			const generation = ++this.#generation;
			const isCurrent = () => !this.#isDisposed && generation === this.#generation;
			this.#context = context;
			this.#setStatus(VibeWidgetStatus.Loading);
			let html = '';
			try {
				html = await (this.#deps.getSettings ?? VibeService.getSettings)(solutionId);
			} catch {
				this.#fail(isCurrent);
				return;
			}
			if (!isCurrent()) {
				return;
			}
			if (html.trim() === '') {
				this.#setStatus(VibeWidgetStatus.Empty);
				return;
			}
			this.#setStatus(VibeWidgetStatus.Ready);
			const container = await this.#deps.getContainer();
			if (!isCurrent()) {
				return;
			}
			if (!container) {
				this.#setStatus(VibeWidgetStatus.Error);
				return;
			}
			try {
				await (this.#deps.renderHtml ?? renderHtml)(container, html);
			} catch {
				this.#fail(isCurrent);
			}
		}
		#fail(isCurrent) {
			if (isCurrent()) {
				this.#setStatus(VibeWidgetStatus.Error);
			}
		}
		#setStatus(status) {
			if (this.#status === status) {
				return;
			}
			this.#status = status;
			this.#deps.onStatus(status);
		}
	}
	function resolveContext({
		visible,
		enabled,
		vibeId,
		solutionId
	}) {
		if (!visible || !enabled || vibeId <= 0 || !solutionId || solutionId <= 0) {
			return null;
		}
		return `${solutionId}:${vibeId}`;
	}
	function isFirstSaveOfPage({
		visible,
		enabled,
		saving
	}) {
		return visible && enabled && saving;
	}
	function renderHtml(container, html) {
		return Promise.resolve(main_core.Runtime.html(container, html));
	}

	const VIBE_SWITCH_ID = 'crm-vibe';
	const VibeMessage = {
		Switch: 'CRM_AUTOMATED_SOLUTION_DETAILS_ENABLE_VIBE',
		Loading: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADING',
		Loaded: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOADED',
		Empty: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_EMPTY',
		LoadError: 'CRM_AUTOMATED_SOLUTION_DETAILS_VIBE_SETTINGS_LOAD_ERROR'
	};
	function readVibeSection(snapshot, readOnly) {
		return {
			visible: canShowVibe({
				featureEnabled: snapshot.isVibeFeatureEnabled === true,
				available: snapshot.isVibeAvailable === true,
				readOnly
			}),
			enabled: snapshot.isVibeEnabled === true,
			vibeId: toPositiveInteger(snapshot.vibeId) ?? 0,
			saving: snapshot.isVibeSettingsPending === true,
			solutionId: toPositiveInteger(snapshot.automatedSolutionId)
		};
	}
	function buildVibeSwitch(section, disabled) {
		return {
			featureId: VIBE_SWITCH_ID,
			title: VibeMessage.Switch,
			checked: section.enabled,
			disabled
		};
	}
	function resolveVibeToggle(section, checked) {
		return {
			...section,
			enabled: checked
		};
	}
	function resolveWidgetView(status) {
		const showSkeleton = status === VibeWidgetStatus.Pending || status === VibeWidgetStatus.Loading;
		return {
			isShown: status !== VibeWidgetStatus.Hidden,
			isBusy: showSkeleton,
			showSkeleton,
			showEmpty: status === VibeWidgetStatus.Empty,
			showError: status === VibeWidgetStatus.Error,
			showSettings: status === VibeWidgetStatus.Ready
		};
	}
	const ANNOUNCEMENTS = {
		[VibeWidgetStatus.Loading]: {
			code: VibeMessage.Loading,
			politeness: 'polite'
		},
		[VibeWidgetStatus.Ready]: {
			code: VibeMessage.Loaded,
			politeness: 'polite'
		},
		[VibeWidgetStatus.Empty]: {
			code: VibeMessage.Empty,
			politeness: 'polite'
		},
		[VibeWidgetStatus.Error]: {
			code: VibeMessage.LoadError,
			politeness: 'assertive'
		}
	};
	function resolveWidgetAnnouncement(status) {
		const announcement = ANNOUNCEMENTS[status];
		return announcement ? {
			...announcement
		} : null;
	}
	function toPositiveInteger(value) {
		const number = Number(value);
		return Number.isInteger(number) && number > 0 ? number : null;
	}

	const CrmHubCrmVibeSection = ui_vue3.defineComponent({
		name: 'CrmHubCrmVibeSection',
		components: {
			CrmHubFeatureCard: crm_settingsHub.CrmHubFeatureCard,
			BLine: ui_system_skeleton_vue.BLine
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
			reason: {
				type: String,
				default: ''
			}
		},
		emits: ['update', 'action'],
		setup() {
			return {
				VibeMessage
			};
		},
		data() {
			return {
				widgetStatus: VibeWidgetStatus.Hidden,
				settings: null
			};
		},
		computed: {
			section() {
				return readVibeSection(this.snapshot, this.readOnly);
			},
			vibeSwitch() {
				return buildVibeSwitch(this.section, this.disabled);
			},
			widget() {
				return resolveWidgetView(this.widgetStatus);
			}
		},
		watch: {
			section(section) {
				this.settings?.update(section);
			}
		},
		created() {
			this.settings = ui_vue3.markRaw(new VibeSettings({
				onStatus: status => this.handleWidgetStatus(status),
				getContainer: () => this.$nextTick().then(() => {
					const container = this.$refs.settingsWrapper;
					return container instanceof HTMLElement ? container : null;
				})
			}));
		},
		mounted() {
			this.settings?.update(this.section);
		},
		beforeUnmount() {
			this.settings?.dispose();
			this.settings = null;
		},
		methods: {
			handleToggle(checked) {
				this.settings?.update(resolveVibeToggle(this.section, checked));
				this.$emit('update', checked);
			},
			handleWidgetStatus(status) {
				this.widgetStatus = status;
				const announcement = resolveWidgetAnnouncement(status);
				if (announcement) {
					ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage(announcement.code) ?? '', announcement.politeness);
				}
			}
		},
		template: `
		<div v-if="section.visible" class="crm-automated-solution-hub-vibe">
			<CrmHubFeatureCard
				:feature-id="vibeSwitch.featureId"
				:title="vibeSwitch.title"
				:checked="vibeSwitch.checked"
				:disabled="vibeSwitch.disabled"
				:reason="reason"
				@update="handleToggle"
			/>
			<div
				v-if="widget.isShown"
				class="crm-automated-solution-hub-vibe__settings"
				:aria-busy="widget.isBusy ? 'true' : null"
				data-testid="crm-automated-solution-hub-vibe-settings"
			>
				<BLine v-if="widget.showSkeleton" :height="430" :radius="8"/>
				<div
					v-else-if="widget.showEmpty"
					class="ui-alert ui-alert-warning crm-automated-solution-hub-vibe__alert"
					data-testid="crm-automated-solution-hub-vibe-settings-empty"
				>
					<span class="ui-alert-message">{{ loc(VibeMessage.Empty) }}</span>
				</div>
				<div
					v-else-if="widget.showError"
					class="ui-alert ui-alert-danger crm-automated-solution-hub-vibe__alert"
					data-testid="crm-automated-solution-hub-vibe-settings-error"
				>
					<span class="ui-alert-message">{{ loc(VibeMessage.LoadError) }}</span>
				</div>
				<div
					v-else-if="widget.showSettings"
					ref="settingsWrapper"
					class="crm-automated-solution-hub-vibe__content"
					data-testid="crm-automated-solution-hub-vibe-settings-content"
				></div>
			</div>
		</div>
	`
	});

	const VIBE_CARD_ID = 'vibe';
	function isVibeCardShown(state, readOnly) {
		return canShowVibe({
			featureEnabled: state.isVibeFeatureEnabled,
			available: state.isVibeAvailable,
			readOnly
		});
	}
	function buildVibeSnapshot(state, isSettingsPending) {
		return {
			automatedSolutionId: state.automatedSolution.id,
			isVibeEnabled: state.automatedSolution.isVibeEnabled,
			vibeId: state.automatedSolution.vibeId,
			isVibeFeatureEnabled: state.isVibeFeatureEnabled,
			isVibeAvailable: state.isVibeAvailable,
			isVibeSettingsPending: isSettingsPending
		};
	}
	function isPageCreatingSave(state, readOnly) {
		return isVibeCardShown(state, readOnly) && state.automatedSolution.isVibeEnabled && state.automatedSolution.vibeId <= 0;
	}
	function trackPageCreatingSave(deps, isPageCreating, setPending) {
		return {
			...deps,
			setWaiting: waiting => {
				if (waiting) {
					setPending(isPageCreating());
				}
				deps.setWaiting(waiting);
			},
			reportFailure: () => {
				setPending(false);
				deps.reportFailure();
			}
		};
	}
	function isCardLockedOnCreate(cardId, isCreateMode) {
		return isCreateMode && cardId !== VIBE_CARD_ID;
	}

	class DeleteSolution {
		#deps;
		constructor(deps) {
			this.#deps = deps;
		}
		execute() {
			const store = this.#deps.getStore();
			const builder = new crm_integration_analytics.Builder.Automation.AutomatedSolution.DeleteEvent().setId(store.state.automatedSolution.id).setElement(crm_integration_analytics.Dictionary.ELEMENT_DELETE_BUTTON);
			this.#deps.markCancelEventRegistered();
			this.#deps.setWaiting(true);
			store.dispatch('delete').then(() => {
				ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_SUCCESS).buildData());
				closeSliderOrRedirect();
			}).catch(() => {
				ui_analytics.sendData(builder.setStatus(crm_integration_analytics.Dictionary.STATUS_ERROR).buildData());
				this.#deps.unmarkCancelEventRegistered();
			}).finally(() => this.#deps.setWaiting(false));
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

	function mapActiveSection(activeTabId) {
		return HUB_TREE_SECTION_BY_TAB[activeTabId] ?? HUB_TREE_DEFAULT_SECTION_ID;
	}
	function getCurrentSlider() {
		return BX.SidePanel?.Instance?.getSliderByWindow(window);
	}
	const HOST_CLASS = 'crm-automated-solution-hub-host';
	const FORM_CONTROLS = ui_vue3.markRaw({
		[CrmControlType.Types]: CrmHubCrmTypesControl,
		[CrmControlType.Vibe]: CrmHubCrmVibeSection
	});
	const HubApp = ui_vue3.defineComponent({
		name: 'CrmAutomatedSolutionDetailsHubApp',
		components: {
			CrmHubShell: crm_settingsHub.CrmHubShell,
			CrmHubSavePanel: crm_settingsHub.CrmHubSavePanel,
			CrmHubCrmPassport,
			CrmHubCrmSectionCard,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			params: {
				type: Object,
				required: true
			}
		},
		setup(props) {
			const params = props.params;
			const store = ui_vue3_vuex.useStore();
			const createModeLatch = ui_vue3.ref(isCreateMode(store.state));
			const reportSaveFailure = () => {
				if (shouldLeaveCreateMode(createModeLatch.value, store.state)) {
					createModeLatch.value = false;
				}
			};
			const isWaiting = ui_vue3.ref(false);
			const isVibeSettingsPending = ui_vue3.ref(false);
			const isCancelEventRegistered = ui_vue3.ref(false);
			const deferredCancelElement = ui_vue3.ref(null);
			const currentSliderEvent = ui_vue3.ref(null);
			const activeSectionId = ui_vue3.ref(mapActiveSection(String(params.activeTabId ?? 'common')));
			const savedSnapshot = ui_vue3.shallowRef(null);
			const controlRegistry = {};
			ui_vue3.provide('hubControlRegistry', controlRegistry);
			const captureSnapshot = () => {
				const typesControl = controlRegistry['crm-types'];
				savedSnapshot.value = {
					vuexState: main_core.Runtime.clone(store.state),
					typesControlState: typesControl ? typesControl.captureSnapshot() : null
				};
			};
			ui_vue3.provide('hubCommitSnapshot', captureSnapshot);
			ui_vue3.provide('hubReportSaveFailure', reportSaveFailure);
			ui_vue3.provide('hubIsCreateMode', () => createModeLatch.value);
			const saveSolution = ui_vue3.markRaw(new SaveSolution(trackPageCreatingSave({
				getStore: () => store,
				setWaiting: waiting => {
					isWaiting.value = waiting;
				},
				commitSnapshot: captureSnapshot,
				markCancelEventRegistered: () => {
					isCancelEventRegistered.value = true;
				},
				normalizeDescription: crm_settingsHub.normalizeHubDescription,
				readOnly: Boolean(params.readOnly),
				reportFailure: reportSaveFailure
			}, () => isPageCreatingSave(store.state, Boolean(params.readOnly)), pending => {
				isVibeSettingsPending.value = pending;
			})));
			const deleteSolution = ui_vue3.markRaw(new DeleteSolution({
				getStore: () => store,
				setWaiting: waiting => {
					isWaiting.value = waiting;
				},
				markCancelEventRegistered: () => {
					isCancelEventRegistered.value = true;
				},
				unmarkCancelEventRegistered: () => {
					isCancelEventRegistered.value = false;
				}
			}));
			const openConfirmDialog = () => new Promise(resolve => {
				const dialog = crm_dialog.ConfirmationDialog.create('crm-as-hub-close', {
					title: main_core.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TITLE'),
					content: main_core.Loc.getMessage('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_CLOSE_CONFIRM_TEXT')
				});
				dialog.open().then(result => resolve(!result.cancel)).catch(() => resolve(false));
			});
			const confirmClose = ui_vue3.markRaw(new ConfirmCloseGuard({
				isDirty: () => Boolean(store.state.isModified),
				denyClose: () => currentSliderEvent.value?.denyAction?.(),
				openConfirm: () => openConfirmDialog().then(confirmed => {
					if (!confirmed) {
						deferredCancelElement.value = null;
					}
					return confirmed;
				}),
				closeSlider: () => getCurrentSlider()?.close?.()
			}));
			return {
				store,
				isCreateMode: createModeLatch,
				sections: HUB_TREE_SECTIONS,
				formControls: FORM_CONTROLS,
				controlRegistry,
				saveSolution,
				deleteSolution,
				confirmClose,
				commitSnapshot: captureSnapshot,
				savedSnapshot,
				isWaiting,
				isVibeSettingsPending,
				isCancelEventRegistered,
				deferredCancelElement,
				currentSliderEvent,
				activeSectionId,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
			isReadOnly() {
				return Boolean(this.params.readOnly);
			},
			showDeleteButton() {
				return shouldShowDeleteButton(this.isCreateMode, this.isReadOnly);
			},
			isDirty() {
				return Boolean(this.store.state.isModified);
			},
			isPanelFixed() {
				return isSavePanelFixed(this.isCreateMode, this.isReadOnly);
			},
			errors() {
				return this.store.state.errors;
			},
			hasErrors() {
				return main_core.Type.isArrayFilled(this.errors);
			},
			recoveryControls() {
				return resolveRecoveryControls(this.store.state.recovery.status);
			},
			readyRecoveryToken() {
				const recovery = this.store.state.recovery;
				return recovery.status === 'ready' ? recovery.token : null;
			},
			records() {
				return applyHubTree(CRM_HUB_RECORDS);
			},
			vibeRecords() {
				return pickSectionRecords(this.records, CrmHubTreeSectionId.Vibe, crm_settingsHub.SUPPLY_STEP);
			},
			showVibeCard() {
				return isVibeCardShown(this.store.state, this.isReadOnly);
			},
			isVibeCardLocked() {
				return isCardLockedOnCreate(VIBE_CARD_ID, this.isCreateMode);
			},
			snapshot() {
				const state = this.store.state;
				return {
					title: state.automatedSolution.title,
					description: state.automatedSolution.description,
					typeIds: state.automatedSolution.typeIds,
					intranetCustomSectionId: this.params.state?.automatedSolution?.intranetCustomSectionId ?? null,
					intranetCustomSectionUrl: readSectionUrl(this.params.state),
					dynamicTypesTitles: state.dynamicTypesTitles,
					permissions: state.permissions,
					automatedSolutionOrigTypeIds: state.automatedSolutionOrigTypeIds,
					isPermissionsLayoutV2Enabled: state.isPermissionsLayoutV2Enabled,
					...buildVibeSnapshot(state, this.isVibeSettingsPending)
				};
			}
		},
		watch: {
			readyRecoveryToken(token) {
				if (token !== null) {
					this.commitRecoveredBaseline();
				}
			}
		},
		mounted() {
			document.documentElement.classList.add(HOST_CLASS);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', this.handleSliderClose);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
			this.commitSnapshot();
		},
		beforeUnmount() {
			document.documentElement.classList.remove(HOST_CLASS);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', this.handleSliderClose);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onCloseByEsc', this.handleSliderCloseByEsc);
			main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onLoad', this.handleSliderLoad);
		},
		methods: {
			handleUpdate(payload) {
				const action = resolveUpdateAction(payload.valueKey);
				if (action) {
					this.store.dispatch(action, payload.value);
				}
			},
			handleAction() {
			},
			handleSave() {
				this.saveSolution.execute();
			},
			handleCancel() {
				this.revert();
			},
			handleCreateCancel() {
				this.revert();
				if (shouldCloseOnCancel(this.isCreateMode)) {
					closeSliderOrRedirect();
				}
			},
			handleDelete() {
				this.deleteSolution.execute();
			},
			hideError(error) {
				this.store.dispatch('removeError', error);
			},
			handleRetryRecovery() {
				void this.store.dispatch('retryRecovery');
			},
			revert() {
				revertForm(this.savedSnapshot, {
					isBaselineKnown: () => !this.recoveryControls.isBaselinePending,
					applyVuexState: vuexState => this.store.dispatch('setState', vuexState),
					applyTypesControl: typesControlState => {
						const typesControl = this.controlRegistry['crm-types'];
						if (typesControl) {
							typesControl.applySnapshot(typesControlState);
						}
					}
				});
			},
			commitRecoveredBaseline() {
				const server = this.store.state.recovery.baseline;
				if (!server) {
					return;
				}
				const typesControl = this.controlRegistry['crm-types'];
				const previousTypes = this.savedSnapshot?.typesControlState ?? null;
				const typesBaseline = typesControl ? typesControl.rebaseSnapshot(previousTypes, server.typeIds) : previousTypes;
				this.savedSnapshot = commitBaseline(this.savedSnapshot, server, typesBaseline);
			},
			handleSliderLoad(event) {
				if (!this.isCreateMode) {
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
				if (canRegisterCancelEvent(this.isDirty, this.confirmClose.isCloseConfirmed)) {
					this.registerCancelEvent(null);
				}
				this.confirmClose.handleClose();
			},
			handleSliderCloseByEsc(event) {
				const [sliderEvent] = event.getData();
				if (sliderEvent.getSlider() !== getCurrentSlider()) {
					return;
				}
				if (canRegisterCancelEvent(this.isDirty, this.confirmClose.isCloseConfirmed)) {
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
				ui_analytics.sendData(createSaveAnalyticsBuilder(this.store).setElement(resolveCancelElement(this.deferredCancelElement, element)).setStatus(crm_integration_analytics.Dictionary.STATUS_CANCEL).buildData());
			}
		},
		template: `
		<div
			class="crm-automated-solution-details-hub crm-automated-solution-hub"
			:class="{ 'crm-automated-solution-hub--create': isCreateMode }"
			data-testid="crm-automated-solution-hub-root"
		>
			<div v-if="hasErrors" class="crm-automated-solution-details-hub__errors ui-alert ui-alert-danger" role="alert">
				<template v-for="error in errors" :key="error.message">
					<span class="ui-alert-message">{{ error.message }}</span>
					<button
						type="button"
						class="ui-alert-close-btn crm-automated-solution-details-hub__error-close"
						:aria-label="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_ERROR_CLOSE')"
						data-testid="crm-automated-solution-hub-error-close"
						@click="hideError(error)"
					></button>
				</template>
			</div>
			<div
				v-if="recoveryControls.isLoading"
				class="crm-automated-solution-details-hub__errors ui-alert ui-alert-primary"
				role="status"
				data-testid="crm-automated-solution-hub-recovery-loading"
			>
				<span class="ui-alert-message">{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_LOADING') }}</span>
			</div>
			<div
				v-else-if="recoveryControls.isFailed"
				class="crm-automated-solution-details-hub__errors ui-alert ui-alert-warning"
				role="alert"
				data-testid="crm-automated-solution-hub-recovery-failed"
			>
				<span class="ui-alert-message">{{ loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_FAILED') }}</span>
				<UiButton
					:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_RECOVERY_RETRY')"
					:size="ButtonSize.SMALL"
					:style="AirButtonStyle.OUTLINE"
					:dataset="{ testid: 'crm-automated-solution-hub-recovery-retry-btn' }"
					@click="handleRetryRecovery"
				/>
			</div>
			<CrmHubShell
				:sections="sections"
				:records="records"
				:snapshot="snapshot"
				:active-section-id="activeSectionId"
				:read-only="isReadOnly"
				:is-panel-fixed="isPanelFixed"
				:controls="formControls"
				@update="handleUpdate"
				@action="handleAction"
			>
				<template #passport>
					<CrmHubCrmPassport
						ref="passport"
						:records="records"
						:snapshot="snapshot"
						:read-only="isReadOnly"
						:is-create-mode="isCreateMode"
						:is-waiting="isWaiting"
						@update="handleUpdate"
						@save="handleSave"
						@cancel="handleCreateCancel"
					/>
				</template>
				<!--
					Раздел один, меню нет: обе карточки на одном экране, сверху вниз — «Смарт-процессы»,
					«Главная страница». Записи первой приходят из слота шелла, второй — из псевдо-секции
					vibe (vibeRecords). Своя обёртка даёт 20px между карточками, как паспорт → карточка.
				-->
				<template #section-types="{ records: typesRecords }">
					<div class="crm-automated-solution-hub-cards">
						<CrmHubCrmSectionCard
							card-id="types"
							title="CRM_AUTOMATED_SOLUTION_DETAILS_TAB_TYPES"
							icon="o-smart-process"
							:records="typesRecords"
							:snapshot="snapshot"
							:read-only="isReadOnly"
							:is-create-mode="isCreateMode"
							:controls="formControls"
							@update="handleUpdate"
							@action="handleAction"
						/>
						<CrmHubCrmSectionCard
							v-if="showVibeCard"
							card-id="vibe"
							title="CRM_AUTOMATED_SOLUTION_DETAILS_HUB_SECTION_VIBE"
							icon="o-home"
							:records="vibeRecords"
							:snapshot="snapshot"
							:read-only="isReadOnly"
							:is-create-mode="isVibeCardLocked"
							:controls="formControls"
							@update="handleUpdate"
							@action="handleAction"
						/>
					</div>
				</template>
				<!--
					v-if стоит на САМОМ template, а не внутри слота: иначе $slots.panel остаётся
					определённым и шелл отрисует пустой div.crm-settings-hub-shell__panel
					(hub-shell.ts:110). На создании панели не должно быть в DOM, а не быть скрытой —
					её место занимает кнопка «Сохранить» в слоте паспорта.
				-->
				<template v-if="!isCreateMode" #panel>
					<div class="crm-automated-solution-details-hub__panel">
						<!-- Save and revert wait for the baseline of a failed save: its read-back status is above. -->
						<CrmHubSavePanel
							v-if="!recoveryControls.isBaselinePending"
							:is-dirty="isDirty"
							:is-waiting="isWaiting"
							:read-only="isReadOnly"
							@save="handleSave"
							@cancel="handleCancel"
						/>
						<div v-if="showDeleteButton" class="crm-automated-solution-details-hub__delete-action">
							<UiButton
								:text="loc('CRM_AUTOMATED_SOLUTION_DETAILS_HUB_DELETE')"
								:disabled="isWaiting"
								:size="ButtonSize.MEDIUM"
								:style="AirButtonStyle.OUTLINE"
								:dataset="{ testid: 'crm-automated-solution-hub-delete-btn' }"
								@click="handleDelete"
							/>
						</div>
					</div>
				</template>
			</CrmHubShell>
		</div>
	`
	});
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
			const vuexStore = ui_vue3_vuex.createStore(store);
			if (main_core.Type.isPlainObject(this.#params.state)) {
				vuexStore.dispatch('setState', this.#params.state);
			}
			this.#app.use(vuexStore);
			this.#app.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.#app.mount(this.#container);
		}
		stop() {
			this.#app?.unmount();
			this.#app = null;
		}
	}

	exports.App = App;

})(this.BX.Crm.AutomatedSolutionDetailsHub = this.BX.Crm.AutomatedSolutionDetailsHub || {}, BX.Vue3, BX.Vue3.Components, BX.Vue3.Vuex, BX.Vue3.Mixins, BX.Event, BX, BX.Crm.Integration.Analytics, BX.Crm, BX.UI.Analytics, BX.Crm.SettingsHub, BX.UI.System.Typography.Vue, BX.Crm, BX.UI, BX.Crm, BX.UI.Dialogs, BX.UI.EntitySelector, BX.UI.Accessibility, BX.UI.System.Skeleton.Vue);
//# sourceMappingURL=script.js.map
