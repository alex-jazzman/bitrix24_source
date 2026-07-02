/* eslint-disable */
this.BX = this.BX || {};
(function (exports, crm_ai_call, crm_ai_nameService, crm_integration_ui_settings, main_core, ui_buttons, ui_vue3, ui_vue3_vuex, ui_dialogs_messagebox, crm_ai_feedback, crm_integration_analytics, ui_analytics, ui_notification) {
	'use strict';

	const timeout = ms => {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	};
	const myScrollTo = async (element, to, duration) => {
		if (duration <= 0) {
			return;
		}
		const difference = to - element.scrollTop;
		const perTick = difference / duration * 10;
		await timeout(10);
		element.scrollTop += perTick;
		if (element.scrollTop === to) {
			return;
		}
		await myScrollTo(element, to, duration - 10);
	};

	let sliderButtonsAdapter = null;
	let copilotSliderInstance = null;
	let entityEditorProxy = null;
	function setSliderButtonsAdapter(value) {
		sliderButtonsAdapter = value;
	}
	function setCopilotSliderInstance(value) {
		copilotSliderInstance = value;
	}
	function setEntityEditorProxy(value) {
		entityEditorProxy = value;
	}

	const CloseConfirm = {
		name: 'CloseConfirm',
		data() {
			return {
				uniquePopupId: `ai-form-fill-feedback-popup_${main_core.Text.getRandom(20).toLowerCase()}`
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isFooterHiddenAndSaveDisabled'])
		},
		methods: {
			...ui_vue3_vuex.mapMutations(['setIsConfirmPopupShow']),
			onMessageClose(event) {
				if (event.uniquePopupId === this.uniquePopupId) {
					this.setIsConfirmPopupShow(false);
				}
			}
		},
		mounted() {
			this.messageBoxInstance = ui_dialogs_messagebox.MessageBox.create({
				message: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_CANCEL_CONFIRM_TEXT'),
				title: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_CANCEL_CONFIRM_TITLE'),
				okCaption: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_CANCEL_CONFIRM_CLOSE'),
				cancelCaption: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_CANCEL_CONFIRM_CANCEL'),
				onOk: () => {
					this.$Bitrix.eventEmitter.emit('crm:ai:form-fill:close-confirm:confirmClose', {});
				},
				onCancel: () => {
					this.setIsConfirmPopupShow(false);
				},
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					targetContainer: this.$refs.closeConfirmRoot,
					id: this.uniquePopupId
				}
			});
			main_core.addCustomEvent(window, 'BX.Main.Popup:onClose', this.onMessageClose);
			this.messageBoxInstance.show();
		},
		unmounted() {
			if (this.messageBoxInstance) {
				this.messageBoxInstance.close();
			}
			main_core.removeCustomEvent(window, 'BX.Main.Popup:onClose', this.onMessageClose);
		},
		template: `
		<div 
			ref="closeConfirmRoot" 
			class="crm-ai-form-fill__close-confirm"
			:class="{'hidden-footer': isFooterHiddenAndSaveDisabled}"
		></div>
	`
	};

	const EntityEditorWrapper = {
		name: 'EntityEditorWrapper',
		computed: {
			...ui_vue3_vuex.mapGetters(['mergeUuid']),
			entityEditorContainerId() {
				return `crm-ai-merge-fields__container__${this.mergeUuid}_container`;
			}
		},
		template: '<div v-bind:id="entityEditorContainerId"></div>'
	};

	const FeedbackMessage = {
		name: 'FeedbackMessage',
		data() {
			return {
				uniquePopupId: `ai-form-fill-feedback-popup_${main_core.Text.getRandom(20).toLowerCase()}`
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['isFooterHiddenAndSaveDisabled'])
		},
		methods: {
			...ui_vue3_vuex.mapActions(['closeFeedbackMessage', 'sendAiCallParsingData']),
			async onOKButton() {
				this.closeFeedbackMessage(true);
			},
			onCancelButton() {
				this.closeFeedbackMessage(false);
				this.sendAiCallParsingData('feedback_refused');
			},
			onMessageClose(event) {
				if (event.uniquePopupId === this.uniquePopupId) {
					this.closeFeedbackMessage(false);
				}
			}
		},
		mounted() {
			this.messageBoxInstance = crm_ai_feedback.createFeedbackMessageBox({
				onOk: this.onOKButton,
				onCancel: this.onCancelButton,
				popupOptions: {
					targetContainer: this.$refs.feedbackMessageRoot,
					id: this.uniquePopupId
				}
			});
			main_core.addCustomEvent(window, 'BX.Main.Popup:onClose', this.onMessageClose);
			this.messageBoxInstance.show();
		},
		unmounted() {
			if (this.messageBoxInstance) {
				this.messageBoxInstance.close();
			}
			main_core.removeCustomEvent(window, 'BX.Main.Popup:onClose', this.onMessageClose);
		},
		template: `
		<div 
			ref="feedbackMessageRoot" 
			class="crm-ai-form-fill__confirm" 
			:class="{'hidden-footer': isFooterHiddenAndSaveDisabled}"
		></div>
	`
	};

	const FloatingActionButton = {
		name: 'FloatingActionButton',
		computed: {
			...ui_vue3_vuex.mapGetters({
				count: 'getNotVisibleUnresolvedCount'
			}),
			showCounter() {
				return this.count > 0;
			}
		},
		methods: {
			click() {
				this.$Bitrix.eventEmitter.emit('crm:ai:form-fill:scroll-to-next', {});
			}
		},
		template: `
		<div @click="click" class="bx-crm-ai-merge-fields-fab">
			<div
				v-if="showCounter"
				class="bx-crm-ai-merge-fields-fab_counter"
			>{{count}}</div>
			<i class="bx-crm-ai-merge-fields-fab_icon"></i>
		</div>
	`
	};

	const Loader = {
		name: 'Loader',
		data() {
			return {
				loaderInstance: null
			};
		},
		template: `
		<div ref="root" class="bx-crm-ai-merge-fields-loading">
			<div class="bx-crm-ai-merge-fields-loading__image"></div>
		</div>
	`
	};

	const MergeControl = {
		name: 'MergeControl',
		props: {
			field: {
				type: Object,
				required: true
			},
			tmp: Number
		},
		data() {
			return {
				hasLargeContent: true,
				isExpanded: false,
				coveredByAnother: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['getexpandedConflictControls', 'eeControlPositions']),
			replaceBtnText() {
				return this.field.isAiValuesUsed ? main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_REPLACE_BTN_BACK') : main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_REPLACE_BTN_FORTH');
			},
			value() {
				return this.field.isAiValuesUsed ? this.field.originalValue : this.field.aiValue;
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(['setEditorFieldValue', 'showEntityEditorControlOutline']),
			...ui_vue3_vuex.mapMutations(['toggleExpandedConflictControls']),
			async toggleAiValue(field) {
				await this.setEditorFieldValue(field);
				await this.expand(false);
				this.hasLargeContent = this.checkHasLargeContent();
			},
			async expand(expand) {
				if (!this.hasLargeContent) {
					return;
				}
				this.isExpanded = expand;
				await ui_vue3.nextTick();
				this.toggleExpandedConflictControls({
					fieldId: this.field.name,
					size: this.$refs.root.getBoundingClientRect().height,
					isExpanded: expand
				});
			},
			onControlsExpandedModeChange() {
				let coveredByAnother = false;
				const selfPosY = this.eeControlPositions.get(this.field.name, 0);
				for (const [fieldName, size] of this.getexpandedConflictControls) {
					const expandedPosY = this.eeControlPositions.get(fieldName, 0);
					if (selfPosY > expandedPosY && selfPosY - expandedPosY < size) {
						coveredByAnother = true;
						break;
					}
				}
				this.coveredByAnother = coveredByAnother;
			},
			checkHasLargeContent() {
				return this.$refs.fieldValue.scrollWidth > this.$refs.fieldValue.clientWidth;
			},
			onMouseenter(e) {
				this.showEntityEditorControlOutline({
					fieldName: this.field.name,
					isShow: true
				});
				this.expand(true);
			},
			onMouseleave(e) {
				this.showEntityEditorControlOutline({
					fieldName: this.field.name,
					isShow: false
				});
				this.expand(false);
			}
		},
		mounted() {
			this.hasLargeContent = this.checkHasLargeContent();
			ui_vue3.watch(this.getexpandedConflictControls, this.onControlsExpandedModeChange);
		},
		template: `
		<div 
			class="bx-crm-ai-form-fill-merge-control__container"
			:class="{'expanded': isExpanded, 'covered': coveredByAnother}"
			@mouseenter="onMouseenter"
			@mouseleave="onMouseleave"
			ref="root"
		>
			<div 
				class="bx-crm-ai-form-fill-merge-control-icon"
				@click="toggleAiValue(field)"
			>

			</div>
			<div class="bx-crm-ai-form-fill-merge-control-field">
				<div
					class="bx-crm-ai-form-fill-merge-control-field-title"
					:title="field.title"
				>{{ field.title }}</div>
				<div class="bx-crm-ai-form-fill-merge-control-field-value-container">
					<div
						ref="fieldValue"
						class="bx-crm-ai-form-fill-merge-control-field-value-container__value"
						:class="{'expanded': isExpanded, 'ai-value': !field.isAiValuesUsed}"
						:title="this.value"
					>{{ this.value }}</div>
					<div
						class="bx-crm-ai-form-fill-merge-control-field-value-container__control"
						:class="{'expanded': isExpanded}"
						:style="{display: hasLargeContent ? 'block': 'none'}"
					></div>
				</div>
			</div>
			<div
				class="bx-crm-ai-form-fill-merge-control-right-column"
				@click="toggleAiValue(field)"
			>
				<div 
					class="bx-crm-ai-form-fill-merge-control-button">
					{{ replaceBtnText }}
				</div>
			</div>
		</div>
	`
	};

	const Merger = {
		name: 'Merger',
		components: {
			MergeControl
		},
		data() {
			return {
				isRootMounted: false
			};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['conflictFields', 'eeControlPosition', 'eeControlPositions', 'getMainLayoutScrollPosition'])
		},
		methods: {
			getControlTopOffset(field) {
				return this.eeControlPositions.get(field.name, 0);
			}
		},
		mounted() {
			this.isRootMounted = true;
		},
		template: `
		<div ref="root" class="bx-crm-ai-merge-fields-merger ">
			<MergeControl
				v-if="isRootMounted"
				v-for="field in conflictFields" :key="field.name"
				class="bx-crm-ai-merge-fields-merger__field"
				:style="{top: getControlTopOffset(field) + 'px'}"
				:field="field"
				:tmp="getControlTopOffset(field)"
			></MergeControl>
		</div>
	`
	};

	const ToolBar = {
		name: 'ToolBar',
		computed: {
			...ui_vue3_vuex.mapGetters(['conflictFields']),
			conflictCount() {
				return this.conflictFields.length;
			},
			resolvedCount() {
				return this.conflictFields.filter(f => f.isAiValuesUsed).length;
			},
			isApplyAllDisabled() {
				return this.conflictCount === this.resolvedCount;
			},
			isRevertDisabled() {
				return this.resolvedCount === 0;
			},
			titleText() {
				return main_core.Loc.getMessage('CRM_AI_FORM_FILL_TOOLBAR_CONFLICT_COUNT_TITLE');
			},
			applyAllBtnText() {
				return main_core.Loc.getMessage('CRM_AI_FORM_FILL_TOOLBAR_BUTTON_APPLY_ALL');
			},
			revertText() {
				return main_core.Loc.getMessage('CRM_AI_FORM_FILL_TOOLBAR_BUTTON_ROLLBACK');
			}
		},
		methods: {
			...ui_vue3_vuex.mapActions(['applyAllAiFields', 'revertAllAiFields'])
		},
		template: `
		<div class="bx-crm-ai-form-fill__toolbar">
			<div class="bx-crm-ai-form-fill__toolbar__conflict_count">
				{{ titleText }}<span class="bx-crm-ai-form-fill__toolbar__conflict_count__count">{{conflictCount}}</span>
			</div>
			<div
				class="bx-crm-ai-form-fill__toolbar__button"
				@click="applyAllAiFields"
			>{{ applyAllBtnText }}</div>
			<div
				class="bx-crm-ai-form-fill__toolbar__button"
				@click="revertAllAiFields"
			>{{ revertText }}</div>
		</div>
	`
	};

	const Main = {
		name: 'Main',
		components: {
			Loader,
			EntityEditorWrapper,
			ToolBar,
			Merger,
			FloatingActionButton,
			CloseConfirm,
			FeedbackMessage
		},
		data() {
			return {};
		},
		computed: {
			...ui_vue3_vuex.mapGetters(['conflictFields', 'isLoading', 'eeControlPositions', 'getFirstUnseenFieldPosition', 'aiValuesAppliedCount', 'mergeUuid', 'isSliderConfirmPopupShown', 'isFeedbackMessageShown', 'isFooterHiddenAndSaveDisabled'])
		},
		methods: {
			...ui_vue3_vuex.mapActions(['initialize', 'saveFormFieldsToMerge', 'updateControlPositionInfo', 'updateSliderFooter', 'closeFormWithoutConfirm', 'sendAiCallParsingData']),
			...ui_vue3_vuex.mapMutations(['changeMainLayoutScrollPosition', 'startLoading', 'stopLoading', 'setMainLayoutScrollHeight']),
			onFooterSaveBtn() {
				this.saveFormFieldsToMerge().then(() => this.sendAiCallParsingData('conflict_accept_changes')).catch(() => {});
			},
			onFooterCancelBtn() {
				this.closeFormWithoutConfirm();
				this.sendAiCallParsingData('conflict_cancel_changes');
			},
			onCloseConfirm() {
				this.closeFormWithoutConfirm();
			},
			handleScroll: null,
			// will be assigned in the mounted callback
			positionChanged() {
				this.setMainLayoutScrollHeight(this.$refs.layout.scrollHeight);
				this.changeMainLayoutScrollPosition({
					scrollTop: this.$refs.layout.scrollTop,
					containerHeight: this.$refs.layout.getBoundingClientRect().height
				});
			},
			resizeHandler() {
				this.handleScroll();
			},
			scrollToNext() {
				const scrollTo = this.getFirstUnseenFieldPosition;
				if (scrollTo) {
					myScrollTo(this.$refs.layout, scrollTo, 300);
				}
			},
			subscribeInternalEvents() {
				this.$Bitrix.eventEmitter.subscribe('crm:ai:form-fill:scroll-to-next', this.scrollToNext);
				this.$Bitrix.eventEmitter.subscribe('crm:ai:form-fill:close-confirm:confirmClose', this.onCloseConfirm);
				this.$Bitrix.eventEmitter.subscribe('crm:ai:form-fill:close-confirm:cancelClose', this.scrollToNext);
			},
			unSubscribeInternalEvents() {
				this.$Bitrix.eventEmitter.unsubscribe('crm:ai:form-fill:scroll-to-next', this.scrollToNext);
				this.$Bitrix.eventEmitter.unsubscribe('crm:ai:form-fill:close-confirm:confirmClose', this.onCloseConfirm);
				this.$Bitrix.eventEmitter.unsubscribe('crm:ai:form-fill:close-confirm:cancelClose', this.scrollToNext);
			},
			autoScrollToFirst() {
				const height = this.$refs.layout.getBoundingClientRect().height;
				const firstPosY = this.getFirstUnseenFieldPosition;
				if (firstPosY && firstPosY > height) {
					myScrollTo(this.$refs.layout, firstPosY, 800);
				}
			}
		},
		async mounted() {
			this.updateSliderFooter();
			this.startLoading();
			this.handleScroll = main_core.Runtime.throttle(() => {
				this.positionChanged();
			}, 300);
			await this.initialize();
			this.positionChanged();
			this.subscribeInternalEvents();
			await this.$nextTick(() => {
				main_core.Event.bind(window, 'resize', this.resizeHandler);
			});
			this.stopLoading();
			this.autoScrollToFirst();
			sliderButtonsAdapter.onSaveCallback = this.onFooterSaveBtn;
			sliderButtonsAdapter.onCancelCallback = this.onFooterCancelBtn;
		},
		watch: {
			aiValuesAppliedCount: {
				handler(newVal, oldVal) {
					this.updateSliderFooter();
				},
				immediate: true
			}
		},
		unmounted() {
			this.unSubscribeInternalEvents();
			main_core.Event.unbind(window, 'resize', this.resizeHandler);
		},
		template: `
		<div class="bx-crm-ai-merge-fields" :class="{'hidden-footer': isFooterHiddenAndSaveDisabled}">
			<div 
				class="bx-crm-ai-merge-fields-layout" 
				@scroll="handleScroll"
				ref="layout"
				:style="{'visibility': !isLoading ? 'visible' : 'hidden'}"
				:class="{'hidden-footer': isFooterHiddenAndSaveDisabled}"
			>
				<EntityEditorWrapper class="bx-crm-ai-merge-fields-layout__ee_column"/>
				<Merger class="bx-crm-ai-merge-fields-layout__aifields_column"/>
				<div class="bx-crm-ai-merge-fields-layout__floating-button_column">
					<FloatingActionButton/>
				</div>
			</div>
			<Loader v-if="isLoading" />
			<CloseConfirm v-if="isSliderConfirmPopupShown" />
			<FeedbackMessage v-if="isFeedbackMessageShown" />
		</div>
	`
	};

	const controlOutlineClassName = 'bx-crm-ai-merge-fields-ee-control-outline';
	const controlAiValueClassName = 'bx-crm-ai-merge-fields-ee-control-ai-value';
	class EntityEditorProxy {
		#editor = null;
		#initialContainerTop;
		#onUserFieldDeployedCb = null;
		async init(entityEditor) {
			this.#editor = entityEditor;
			const correctionY = 5;
			this.#initialContainerTop = this.#editor.getContainer().getBoundingClientRect().y + correctionY;
			main_core.addCustomEvent(window, 'BX.UI.EntityUserFieldLayoutLoader:onUserFieldDeployed', field => {
				if (!main_core.Type.isFunction(this.#onUserFieldDeployedCb)) {
					return;
				}
				this.#onUserFieldDeployedCb(field);
			});
		}
		setOnUserFieldDeployedCb(cb) {
			this.#onUserFieldDeployedCb = cb;
		}
		async getEditorControlsParams(fieldsIds) {
			await timeout(10);
			const result = [];
			let counter = 0;
			for (const control of this.#editor.getAllControls()) {
				if (!fieldsIds.has(control.getId()) || !control.getWrapper()) {
					continue;
				}
				const [value, model] = this.#getValueFromControl(control);
				result.push({
					fieldId: control.getId(),
					relatedFieldOffsetY: control.getWrapper().getBoundingClientRect().y,
					originalValue: value,
					originalModel: model,
					order: counter
				});
				counter++;
			}
			return result;
		}
		async getEditorControlsPositions(fieldsIds) {
			const result = new Map();
			for (const control of this.#editor.getAllControls()) {
				if (!fieldsIds.has(control.getId()) || !control.getWrapper()) {
					continue;
				}
				const y = control.getWrapper().getBoundingClientRect().y;
				result.set(control.getId(), y - this.#initialContainerTop);
			}
			return result;
		}
		setControlOutline(fieldId, show) {
			const control = this.#editor.getControlById(fieldId);
			if (!control) {
				return;
			}
			const wrapper = control.getWrapper();
			if (show) {
				main_core.Dom.addClass(wrapper, controlOutlineClassName);
			} else {
				main_core.Dom.removeClass(wrapper, controlOutlineClassName);
			}
		}
		setControlAiClass(fieldId, show) {
			const control = this.#editor.getControlById(fieldId);
			if (!control) {
				return;
			}
			const wrapper = control.getWrapper();
			if (show) {
				main_core.Dom.addClass(wrapper, controlAiValueClassName);
			} else {
				main_core.Dom.removeClass(wrapper, controlAiValueClassName);
			}
		}
		async setFieldValue(fieldName, newValue) {
			const control = this.#editor.getControlById(fieldName);
			if (!control) {
				return;
			}
			switch (control.constructor) {
				case BX.Crm.EntityEditorText:
					this.#setPlainTextFieldValue(fieldName, newValue.value);
					break;
				case BX.UI.EntityEditorBB:
					this.#setEntityEditorBBValue(fieldName, newValue.value);
					this.#refreshControlLayout(control);
					break;
				case BX.Crm.EntityEditorUserField:
					this.#setUserFieldValue(fieldName, newValue.model);
					this.#refreshControlLayout(control);
					break;
				default:
					throw new Error('Not supported field type');
			}
		}
		#refreshControlLayout(control) {
			control.refreshLayout({
				reset: true
			});
		}
		#setEntityEditorBBValue(fieldId, value) {
			const fieldKey = `${fieldId}_HTML`;
			const model = this.#editor.getModel();
			model.setField(fieldKey, value, {
				enableNotification: true
			});
		}
		#setPlainTextFieldValue(fieldId, value) {
			const model = this.#editor.getModel();
			model.setField(fieldId, value, {
				enableNotification: true
			});
		}
		#setUserFieldValue(fieldId, signedModel) {
			const model = this.#editor.getModel();
			model.setField(fieldId, signedModel);
		}
		#getValueFromControl(control) {
			const controlValue = control.getValue();
			let value = null;
			let ufModel = null;
			if (control.constructor === BX.UI.EntityEditorBB) {
				const model = this.#editor.getModel();
				const fieldKey = `${control.getId()}_HTML`;
				value = model.getField(fieldKey, '');
			} else if (main_core.Type.isObject(controlValue) && Object.hasOwn(controlValue, 'VALUE')) {
				value = controlValue.VALUE;
				ufModel = controlValue;
			} else if (main_core.Type.isString(controlValue) || main_core.Type.isNumber(controlValue)) {
				value = controlValue;
				ufModel = null;
			}
			return [value, ufModel];
		}
	}

	var getters = {
		isLoading(state) {
			return state.isLoading;
		},
		conflictFields(state) {
			return state.conflictFields.sort((a, b) => a.order - b.order);
		},
		mergeUuid(state) {
			return state.mergeUuid;
		},
		activityId(state) {
			return state.activityId;
		},
		activityDirection(state) {
			return state.activityDirection;
		},
		activityProvider(state) {
			return state.activityProvider;
		},
		summarizeJobId(state) {
			return state.summarizeJobId;
		},
		getEntityInfo(state) {
			return state.entityInfo;
		},
		isEntityEditorLoaded(state) {
			return state.isEntityEditorLoaded;
		},
		eeControlPosition: state => fieldId => {
			return state.eeControlPositions.get(fieldId, 0);
		},
		eeControlPositions: state => {
			return state.eeControlPositions;
		},
		getexpandedConflictControls: state => {
			return state.expandedConflictControls;
		},
		getNotVisibleUnresolvedCount: state => {
			return state.notVisibleUnresolvedCount;
		},
		getMainLayoutScrollPosition: state => {
			return state.mainLayoutScrollPosition;
		},
		getMainLayoutContainerHeight: state => {
			return state.mainLayoutContainerHeight;
		},
		getMainLayoutScrollHeight: state => {
			return state.mainLayoutScrollHeight;
		},
		getFirstUnseenFieldPosition: state => {
			const position = state.mainLayoutScrollPosition;
			let lowerField = null;
			let min = Infinity;
			for (const [fieldName, value] of state.eeControlPositions) {
				const field = state.conflictFields.find(f => f.name === fieldName);
				if (!field || field.isAiValuesUsed || position + 120 > value) {
					continue;
				}
				if (value < min) {
					min = value;
					lowerField = fieldName;
				}
			}
			if (!lowerField) {
				return null;
			}
			return state.eeControlPositions.get(lowerField);
		},
		isFieldsTouched: state => {
			return state.isFieldsTouched;
		},
		aiValuesAppliedCount: state => {
			return state.aiValuesAppliedCount;
		},
		isFooterHiddenAndSaveDisabled(state) {
			return state.aiValuesAppliedCount === 0;
		},
		isSliderConfirmPopupShown: state => {
			return state.isSliderConfirmPopupShown;
		},
		isNeededShowCloseConfirm: state => {
			return state.isNeededShowCloseConfirm;
		},
		isFeedbackMessageShown: state => {
			return state.aiFeedback.isMessageComponentShown;
		},
		isAiFeedbackShowBeforeClose(state) {
			return state.aiFeedback.showBeforeClose && state.activityProvider === crm_ai_call.ActivityProvider.call;
		},
		aiFeedback(state) {
			return state.aiFeedback;
		}
	};

	const FEEDBACK_TRIGGER_CONTROL = 'FEEDBACK_TRIGGER_CONTROL';
	const FEEDBACK_TRIGGER_APP_CLOSE = 'FEEDBACK_TRIGGER_APP_CLOSE';

	/* eslint no-param-reassign: off */
	var mutations = {
		setMergeUUID: (state, val) => {
			state.mergeUuid = val;
		},
		setActivityId: (state, val) => {
			state.activityId = val;
		},
		setActivityDirection: (state, val) => {
			state.activityDirection = val;
		},
		setActivityProvider: (state, val) => {
			state.activityProvider = val;
		},
		setSummarizeJobId: (state, val) => {
			state.summarizeJobId = val;
		},
		startLoading: state => {
			state.isLoading = true;
		},
		stopLoading: state => {
			state.isLoading = false;
		},
		setEntityInfo: (state, entityInfo) => {
			state.entityInfo = entityInfo;
		},
		setConflictFields: (state, conflictFields) => {
			state.conflictFields = conflictFields;
		},
		setEditMode: (state, isEditMode) => {
			state.isEditMode = isEditMode;
		},
		setIsEntityEditorLoaded(state, isEntityEditorLoaded) {
			state.isEntityEditorLoaded = isEntityEditorLoaded;
		},
		updateConflictField: (state, {
			name,
			field
		}) => {
			state.conflictFields = state.conflictFields.map(f => {
				if (f.name === name) {
					return {
						...f,
						...field
					};
				}
				return f;
			});
			const aiAppliedCount = state.conflictFields.filter(f => f.isAiValuesUsed).length;
			state.aiValuesAppliedCount = aiAppliedCount;
			state.isNeededShowCloseConfirm = aiAppliedCount > 0;
		},
		setEeControlPositions: (state, {
			fieldId,
			topPosition
		}) => {
			state.eeControlPositions.set(fieldId, topPosition);
		},
		toggleExpandedConflictControls: (state, {
			fieldId,
			size,
			isExpanded
		}) => {
			if (isExpanded) {
				state.expandedConflictControls.set(fieldId, size);
			} else {
				state.expandedConflictControls.delete(fieldId);
			}
		},
		changeMainLayoutScrollPosition: (state, {
			scrollTop,
			containerHeight
		}) => {
			const containerBottomPosition = scrollTop + containerHeight;
			state.mainLayoutScrollPosition = scrollTop;
			state.mainLayoutContainerHeight = containerHeight;
			const hidden = [];
			const controlHeight = 30;
			for (const [key, value] of state.eeControlPositions) {
				if (containerBottomPosition < value + controlHeight) {
					hidden.push(key);
				}
			}
			if (hidden.length === 0) {
				state.notVisibleUnresolvedCount = 0;
				return;
			}
			let counter = 0;
			for (const hideName of hidden) {
				const field = state.conflictFields.find(f => f.name === hideName);
				if (!field || field.isAiValuesUsed) {
					continue;
				}
				counter++;
			}
			state.notVisibleUnresolvedCount = counter;
		},
		setIsFieldsTouched(state, isFieldsTouched) {
			state.isFieldsTouched = isFieldsTouched;
		},
		setIsConfirmPopupShow(state, isSliderConfirmPopupShown) {
			state.isSliderConfirmPopupShown = isSliderConfirmPopupShown;
		},
		setNeededShowCloseConfirm(state, isNeededShowCloseConfirm) {
			state.isNeededShowCloseConfirm = isNeededShowCloseConfirm;
		},
		showFeedbackMessageIfNeeded(state, source) {
			if (state.aiFeedback.feedbackWasSent || source === FEEDBACK_TRIGGER_CONTROL && state.aiFeedback.isShownByReturnBtn || state.activityProvider === crm_ai_call.ActivityProvider.openLine) {
				return;
			}
			state.aiFeedback.lastTriggeredBy = source;
			if (source === FEEDBACK_TRIGGER_CONTROL) {
				state.aiFeedback.isShownByReturnBtn = true;
			}
			state.aiFeedback.isMessageComponentShown = true;
		},
		hideFeedbackMessage(state) {
			state.aiFeedback.isMessageComponentShown = false;
		},
		setAiFeedbackWasSent(state, isFeedbackWasSent) {
			state.aiFeedback.feedbackWasSent = isFeedbackWasSent;
		},
		setAiFeedbackShowBeforeClose(state, showBeforeClose) {
			state.aiFeedback.showBeforeClose = showBeforeClose;
		},
		setMainLayoutScrollHeight(state, height) {
			state.mainLayoutScrollHeight = height;
		}
	};
	/* eslint no-param-reassign: 2 */

	class EntityEditorRender {
		#params;
		constructor(params) {
			this.#params = params;
		}
		async render() {
			this.#fetchEntityEditor(this.#params);
			return new Promise(resolve => {
				main_core.addCustomEvent(window, 'BX.Crm.EntityEditor:onUserFieldsDeployed', async editor => {
					if (editor.getId() !== this.#params.domContainerId) {
						return;
					}
					resolve(editor);
				});
			});
		}
		#fetchEntityEditor(params) {
			let eeUrl = '';
			switch (params.entityTypeName) {
				case 'DEAL':
					eeUrl = '/bitrix/components/bitrix/crm.deal.details/ajax.php';
					break;
				case 'LEAD':
					eeUrl = '/bitrix/components/bitrix/crm.lead.details/ajax.php';
					break;
				default:
					throw new Error(`Unknown entity type: ${params.entityTypeName}`);
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			eeUrl = `${eeUrl}?sessid=${BX.bitrix_sessid()}`;
			BX.ajax.post(eeUrl, {
				ACTION: 'PREPARE_EDITOR_HTML',
				ACTION_ENTITY_TYPE_NAME: params.entityTypeName,
				ACTION_ENTITY_ID: params.entityId,
				GUID: params.domContainerId,
				CONFIG_ID: params.configId,
				FORCE_DEFAULT_CONFIG: 'N',
				FORCE_DEFAULT_OPTIONS: 'Y',
				IS_EMBEDDED: 'Y',
				ENABLE_CONFIG_SCOPE_TOGGLE: 'N',
				ENABLE_CONFIGURATION_UPDATE: 'N',
				ENABLE_REQUIRED_USER_FIELD_CHECK: 'N',
				ENABLE_FIELDS_CONTEXT_MENU: 'N',
				CONTEXT: {},
				READ_ONLY: 'Y',
				MODULE_ID: 'crm'
			}, () => {});
		}
	}

	var actions = {
		async initialize({
			dispatch,
			getters
		}) {
			await dispatch('fetchFormFieldsToMerge');
			await dispatch('createEntityEditor');
			await dispatch('collectFieldDataFromEntityEditor');
			await dispatch('updateControlPositionInfo');
		},
		async fetchFormFieldsToMerge({
			commit,
			getters
		}) {
			const data = await fetchMergeFields(getters.mergeUuid);
			const fields = data.fields.map(field => {
				return {
					name: field.name,
					type: field.type,
					title: field.title,
					aiModel: field.aiModel,
					isMultiple: field.isMultiple,
					isUserField: field.isUserField,
					aiValue: field.aiModel.VALUE,
					originalValue: null,
					originalModel: null,
					isAiValuesUsed: false
				};
			});
			commit('setConflictFields', fields);
			commit('setEditMode', data.editMode);
			commit('setEntityInfo', data.target);
			commit('setAiFeedbackWasSent', data.target.feedbackWasSent);
			commit('setAiFeedbackShowBeforeClose', !data.target.feedbackWasSent);
		},
		async saveFormFieldsToMerge({
			getters,
			commit,
			dispatch
		}) {
			const fieldNamesToApply = getters.conflictFields.filter(field => field.isAiValuesUsed).map(field => field.name);
			const mergeUuid = getters.mergeUuid;
			const response = await BX.ajax.runAction('crm.timeline.ai.applyMerge', {
				method: 'GET',
				getParameters: {
					mergeUuid,
					fieldNamesToApply
				}
			});
			commit('setAiFeedbackShowBeforeClose', false);
			if (response.status === 'success') {
				dispatch('closeFormWithoutConfirm');
			} else {
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_SAVE_ERROR'),
					autoHideDelay: 5000
				});
			}
		},
		showFeedbackMessageBeforeClose({
			getters,
			commit
		}) {
			commit('showFeedbackMessageIfNeeded', FEEDBACK_TRIGGER_APP_CLOSE);
			commit('setAiFeedbackShowBeforeClose', false);
		},
		closeFeedbackMessage({
			getters,
			commit,
			dispatch
		}, sendFeedback = false) {
			if (sendFeedback) {
				dispatch('sendFeedBack');
				commit('setAiFeedbackShowBeforeClose', false);
			}
			commit('hideFeedbackMessage');
			if (getters.aiFeedback.lastTriggeredBy === FEEDBACK_TRIGGER_APP_CLOSE) {
				dispatch('closeFormWithoutConfirm');
			}
		},
		closeFormWithoutConfirm({
			getters,
			commit
		}) {
			commit('setNeededShowCloseConfirm', false);
			commit('setIsConfirmPopupShow', false);
			const mergeUuid = getters.mergeUuid;
			main_core.onCustomEvent(window, 'BX.Crm.AiFormFill:CloseSlider', {
				mergeUuid
			});
		},
		async setEditorFieldValue({
			dispatch,
			getters,
			commit
		}, conflictField) {
			const fieldName = conflictField.name;
			const isSetAiValue = !conflictField.isAiValuesUsed;
			const value = isSetAiValue ? conflictField.aiValue : conflictField.originalValue;
			const model = isSetAiValue ? conflictField.aiModel : conflictField.originalModel;
			if (!isSetAiValue) {
				setTimeout(() => {
					commit('showFeedbackMessageIfNeeded', FEEDBACK_TRIGGER_CONTROL);
				}, 300);
			}
			const controlValue = {
				value,
				model
			};
			await entityEditorProxy.setFieldValue(fieldName, controlValue);
			await entityEditorProxy.setControlAiClass(fieldName, isSetAiValue);
			commit('setIsFieldsTouched', true);
			commit('updateConflictField', {
				name: fieldName,
				field: {
					isAiValuesUsed: !conflictField.isAiValuesUsed
				}
			});
		},
		async createEntityEditor({
			getters,
			commit,
			dispatch
		}) {
			const getEntityInfo = getters.getEntityInfo;
			const entityEditorRender = new EntityEditorRender({
				entityId: getEntityInfo.entityId,
				configId: getEntityInfo.editorId,
				entityTypeName: getEntityInfo.entityTypeName,
				domContainerId: `crm-ai-merge-fields__container__${getters.mergeUuid}`
			});
			const editor = await entityEditorRender.render();
			await entityEditorProxy.init(editor);
			entityEditorProxy.setOnUserFieldDeployedCb(async () => {
				const scrollPositionThreshold = 40;
				const scrollPosY = Math.floor(getters.getMainLayoutScrollPosition + getters.getMainLayoutContainerHeight);
				const scrollHeight = getters.getMainLayoutScrollHeight || 0;
				let waitMs = 0;
				if (scrollHeight - scrollPosY < scrollPositionThreshold) {
					waitMs = 400;
				}
				// at the scroll bottom position entity editor will shake and resize, to prevent it do some timeout before
				// update control positions info
				await timeout(waitMs);
				dispatch('updateControlPositionInfo');
			});
		},
		async collectFieldDataFromEntityEditor({
			getters,
			commit,
			dispatch
		}) {
			const conflictFields = getters.conflictFields;
			const fieldsIds = new Set(conflictFields.map(field => field.name));
			const fieldParams = await entityEditorProxy.getEditorControlsParams(fieldsIds);
			if (fieldParams.length === 0) {
				return;
			}
			for (const param of fieldParams) {
				commit('updateConflictField', {
					name: param.fieldId,
					field: {
						originalValue: param.originalValue,
						originalModel: param.originalModel,
						order: param.order
					}
				});
				commit('setEeControlPositions', {
					fieldId: param.fieldId,
					topPosition: param.relatedFieldOffsetY
				});
			}
			commit('setIsEntityEditorLoaded', true);
		},
		async updateControlPositionInfo({
			getters,
			commit
		}, {
			updateOnlyFrom
		} = {}) {
			const conflictFields = getters.conflictFields;
			if (conflictFields.length === 0) {
				return;
			}
			const fieldsIds = new Set(conflictFields.map(field => field.name));
			const positions = await entityEditorProxy.getEditorControlsPositions(fieldsIds);
			const scrollPosition = getters.getMainLayoutScrollPosition || 0;
			for (const [fieldId, topPosition] of positions) {
				positions.set(fieldId, scrollPosition + topPosition);
			}
			for (const field of conflictFields) {
				const fieldId = field.name;
				if (!updateOnlyFrom && updateOnlyFrom > field.order) {
					continue;
				}
				if (!positions.has(fieldId)) {
					continue;
				}
				commit('setEeControlPositions', {
					fieldId,
					topPosition: positions.get(fieldId)
				});
			}
		},
		async applyAllAiFields({
			dispatch,
			getters
		}) {
			for (const field of getters.conflictFields) {
				if (field.isAiValuesUsed) {
					continue;
				}
				dispatch('setEditorFieldValue', field);
			}
		},
		revertAllAiFields({
			dispatch,
			getters
		}) {
			for (const field of getters.conflictFields) {
				if (!field.isAiValuesUsed) {
					continue;
				}
				dispatch('setEditorFieldValue', field);
			}
		},
		showEntityEditorControlOutline(store, {
			fieldName,
			isShow
		}) {
			entityEditorProxy.setControlOutline(fieldName, isShow);
		},
		updateSliderFooter({
			getters
		}) {
			const disable = getters.isFooterHiddenAndSaveDisabled;
			sliderButtonsAdapter.saveButton.setDisabled(disable);
			copilotSliderInstance?.footerDisplay(!disable);
		},
		async sendFeedBack({
			commit,
			getters
		}) {
			const mergeUuid = getters.mergeUuid;
			if (getters.aiFeedback.checkFeedbackBeforeSend) {
				const checkResult = await checkIsFeedbackAlreadySend(mergeUuid);
				if (checkResult) {
					commit('setAiFeedbackWasSent', true);
					return;
				}
			}
			const getEntityInfo = getters.getEntityInfo;
			const ownerType = getEntityInfo.entityTypeName;
			crm_ai_feedback.sendFeedback(mergeUuid, ownerType, getters.activityId);
			commit('setAiFeedbackWasSent', true);
		},
		sendAiCallParsingData({
			getters
		}, element) {
			const getEntityInfo = getters.getEntityInfo;
			const ownerType = getEntityInfo.entityTypeName;
			const activityId = getters.activityId;
			const activityDirection = getters.activityDirection;
			ui_analytics.sendData(crm_integration_analytics.Builder.AI.CallParsingEvent.createDefault(ownerType, activityId, crm_integration_analytics.Dictionary.STATUS_SUCCESS).setElement(element).setActivityDirection(activityDirection).buildData());
			ui_analytics.sendData(crm_integration_analytics.Builder.AI.CallParsingEvent.createDefault(ownerType, activityId, crm_integration_analytics.Dictionary.STATUS_SUCCESS).setTool(crm_integration_analytics.Dictionary.TOOL_CRM).setCategory(crm_integration_analytics.Dictionary.CATEGORY_AI_OPERATIONS).setElement(element).setActivityDirection(activityDirection).buildData());
		}
	};
	const checkIsFeedbackAlreadySend = async mergeUuid => {
		return crm_ai_feedback.wasFeedbackSent(mergeUuid);
	};
	const fetchMergeFields = async mergeUuid => {
		const response = await BX.ajax.runAction('crm.timeline.ai.mergeFields', {
			method: 'GET',
			getParameters: {
				mergeUuid
			}
		});
		return response.data;
	};

	var store = () => {
		return {
			state: {
				mergeUuid: null,
				isLoading: true,
				conflictFields: [],
				isEditMode: false,
				isEntityEditorLoaded: false,
				entityInfo: null,
				eeControlPositions: new Map(),
				expandedConflictControls: new Map(),
				mainLayoutScrollPosition: null,
				mainLayoutContainerHeight: null,
				mainLayoutScrollHeight: null,
				notVisibleUnresolvedCount: 0,
				isFieldsTouched: false,
				aiValuesAppliedCount: 0,
				isSliderConfirmPopupShown: false,
				isNeededShowCloseConfirm: false,
				aiFeedback: {
					feedbackWasSent: false,
					isShownByReturnBtn: false,
					isMessageComponentShown: false,
					lastTriggeredBy: null,
					showBeforeClose: true,
					checkFeedbackBeforeSend: false // Send check request before sending
				}
			},
			getters,
			mutations,
			actions
		};
	};

	// export default store;

	class AiFormFillApplication {
		#application;
		#options;
		#store;
		constructor(rootNode, options = {}) {
			this.#options = options;
			this.rootNode = document.querySelector(`#${rootNode}`);
			if (!this.#options.mergeUuid) {
				throw new Error('param mergeUuid is required');
			}
		}
		get application() {
			return this.#application;
		}
		get store() {
			return this.#store;
		}
		start() {
			setEntityEditorProxy(new EntityEditorProxy());
			this.#store = ui_vue3_vuex.createStore(store());
			this.#application = ui_vue3.BitrixVue.createApp({
				name: 'AiFormFill',
				components: {
					Main
				},
				beforeCreate() {
					this.$bitrix.Application.set(this);
				},
				template: `
				<Main/>
			`
			});
			this.#store.commit('setMergeUUID', this.#options.mergeUuid);
			this.#store.commit('setActivityId', this.#options.activityId);
			this.#store.commit('setActivityDirection', this.#options.activityDirection);
			this.#store.commit('setActivityProvider', this.#options.activityProvider);
			this.#store.commit('setSummarizeJobId', this.#options.summarizeJobId);
			this.#application.use(this.#store);
			this.#application.mount(this.rootNode);
		}
		stop() {
			this.#application.unmount();
			this.#application = null;
			this.#store = null;
			setEntityEditorProxy(null);
		}
		isNeededShowCloseConfirm() {
			return this.#store.getters.isNeededShowCloseConfirm;
		}
		showCloseConfirm() {
			this.#store.commit('setIsConfirmPopupShow', true);
		}
		isShowAiFeedbackBeforeClose() {
			return this.#store.getters.isAiFeedbackShowBeforeClose;
		}
		showAiFeedbackBeforeClose() {
			this.#store.dispatch('showFeedbackMessageBeforeClose');
		}
		isAppLoading() {
			return this.#store.getters.isLoading;
		}
	}

	class SliderButtonsAdapter {
		#onSaveCallback = null;
		#onCancelCallback = null;
		#saveButton = null;
		#cancelButton = null;
		constructor() {
			this.#createButtons();
		}
		set onSaveCallback(cb) {
			this.#onSaveCallback = cb;
		}
		set onCancelCallback(cb) {
			this.#onCancelCallback = cb;
		}
		get saveButton() {
			return this.#saveButton;
		}
		get cancelButton() {
			return this.#cancelButton;
		}
		#createButtons() {
			this.#saveButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_SAVE'),
				size: ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.SUCCESS,
				dependOnTheme: true,
				onclick: () => {
					if (main_core.Type.isFunction(this.#onSaveCallback)) {
						this.#onSaveCallback();
					}
				}
			});
			this.#cancelButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_CANCEL'),
				size: ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				onclick: () => {
					if (main_core.Type.isFunction(this.#onCancelCallback)) {
						this.#onCancelCallback();
					}
				}
			});
		}
		getButtons() {
			return [this.#saveButton, this.#cancelButton];
		}
	}

	class ConflictFieldsliderCreator {
		#options;
		#copilotSliderClass;
		#app;
		#sliderInstance;
		constructor(options, CopilotSliderWrapper) {
			this.#options = options;
			this.#copilotSliderClass = CopilotSliderWrapper;
			setSliderButtonsAdapter(new SliderButtonsAdapter());
		}
		get #onLoadEventName() {
			return `CopilotSliderWrapper:onLoad_${this.#options.mergeUuid}`;
		}
		get #onCloseEventName() {
			return `CopilotSliderWrapper:onClose_${this.#options.mergeUuid}`;
		}
		get #sliderUrl() {
			return `crm:copilot-wrapper-slider-${this.#options.mergeUuid}`;
		}
		get #containerId() {
			return `crm-ai-merge-fields__container__${this.#options.mergeUuid}`;
		}
		create() {
			this.#sliderInstance = this.#createSliderWrapper();
			main_core.addCustomEvent('SidePanel.Slider:onLoad', this.#onSliderLoadFn.bind(this), this.#onLoadEventName);
			main_core.addCustomEvent('SidePanel.Slider:onClose', this.#onSliderCloseFn.bind(this), this.#onCloseEventName);
			main_core.addCustomEvent(window, 'BX.Crm.AiFormFill:CloseSlider', this.#onAiFormFillDownFn.bind(this));
			this.#sliderInstance.open();
		}
		#makeSliderToolbar() {
			const toolbarButtons = this.#copilotSliderClass.makeDefaultToolbarButtons();
			const transcriptButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_TRANSCRIPTION'),
				size: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign) ? ui_buttons.Button.Size.SMALL : ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				dependOnTheme: true,
				useAirDesign: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign),
				style: ui_buttons.Button.AirStyle.OUTLINE,
				onclick: () => {
					if (top.BX.Helper) {
						const transcription = new crm_ai_call.Call.Transcription({
							activityId: this.#options.activityId,
							ownerTypeId: this.#options.ownerTypeId,
							ownerId: this.#options.ownerId,
							languageTitle: this.#options.languageTitle
						});
						transcription.open();
					}
				}
			});
			const resumeButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_RESUME'),
				size: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign) ? ui_buttons.Button.Size.SMALL : ui_buttons.Button.Size.MEDIUM,
				color: ui_buttons.Button.Color.LIGHT_BORDER,
				dependOnTheme: true,
				useAirDesign: crm_integration_ui_settings.Settings.get(crm_integration_ui_settings.Setting.UseAirDesign),
				style: ui_buttons.Button.AirStyle.OUTLINE,
				onclick: () => {
					if (top.BX.Helper) {
						const resume = new crm_ai_call.Call.Summary({
							activityId: this.#options.activityId,
							ownerTypeId: this.#options.ownerTypeId,
							ownerId: this.#options.ownerId,
							languageTitle: this.#options.languageTitle,
							activityProvider: this.#options.activityProvider,
							jobId: this.#options.summarizeJobId
						});
						resume.open();
					}
				}
			});
			let result = [resumeButton, ...toolbarButtons];
			if (this.#options.activityProvider === crm_ai_call.ActivityProvider.call) {
				result = [transcriptButton, ...result];
			}
			return result;
		}
		#createSliderWrapper() {
			const buttons = sliderButtonsAdapter.getButtons();
			const toolbarButtons = this.#makeSliderToolbar();
			return new this.#copilotSliderClass({
				content: () => `<div id="${this.#containerId}"></div>`,
				sliderTitle: main_core.Loc.getMessage('CRM_AI_FORM_FILL_MERGER_TITLE', crm_ai_nameService.NameService.copilotNameReplacement()),
				label: this.#options.label,
				extensions: ['crm.ai.form-fill', 'crm.entity-editor'],
				url: this.#sliderUrl,
				width: this.#calculateSliderWidth(),
				toolbar: () => toolbarButtons,
				buttons: () => buttons
			});
		}
		#calculateSliderWidth() {
			const topSlider = BX.SidePanel.Instance.getTopSlider();
			const width = topSlider.getWidth() || window.screen.width * 0.86;
			return Math.floor(width * 0.86);
		}
		#onSliderLoadFn(event) {
			if (event.getSlider().getUrl() !== this.#sliderUrl) {
				return;
			}
			setCopilotSliderInstance(this.#sliderInstance);
			this.#app = new AiFormFillApplication(this.#containerId, {
				mergeUuid: this.#options.mergeUuid,
				activityId: this.#options.activityId,
				activityDirection: this.#options.activityDirection,
				activityProvider: this.#options.activityProvider,
				summarizeJobId: this.#options.summarizeJobId
			});
			this.#app.start();
			main_core.removeAllCustomEvents('SidePanel.Slider:onLoad', this.#onLoadEventName);
		}
		#onSliderCloseFn(event) {
			if (event.getSlider().getUrl() !== this.#sliderUrl) {
				return;
			}
			if (!this.#app || this.#app.isAppLoading()) {
				event.denyAction();
				return;
			}
			if (this.#app.isNeededShowCloseConfirm()) {
				this.#app.showCloseConfirm();
				event.denyAction();
				return;
			}
			if (this.#app.isShowAiFeedbackBeforeClose()) {
				this.#app.showAiFeedbackBeforeClose();
				event.denyAction();
				return;
			}
			main_core.removeAllCustomEvents('SidePanel.Slider:onClose', this.#onCloseEventName);
			main_core.removeAllCustomEvents(window, 'BX.Crm.AiFormFill:CloseSlider');
			if (this.#app) {
				this.#app.stop();
				this.#app = null;
			}
			setSliderButtonsAdapter(null);
			setCopilotSliderInstance(null);
		}
		#onAiFormFillDownFn(event) {
			const mergeUuid = event?.data?.mergeUuid;
			if (mergeUuid === this.#options.mergeUuid) {
				this.#sliderInstance.close();
			}
		}
	}
	const createAiFormFillApplicationInsideSlider = function (options) {
		const makeApp = CopilotSliderWrapper => {
			const creator = new ConflictFieldsliderCreator(options, CopilotSliderWrapper);
			creator.create();
		};
		if (main_core.Type.isFunction(BX?.Crm?.AI?.Slider)) {
			makeApp(BX.Crm.AI.Slider);
		} else {
			top.BX.Runtime.loadExtension('crm.ai.slider').then(exports$1 => {
				const {
					Slider
				} = exports$1;
				makeApp(Slider);
			}).catch(() => {
				throw new Error('Cant load Crm.AI.Slider extension');
			});
		}
	};

	exports.createAiFormFillApplicationInsideSlider = createAiFormFillApplicationInsideSlider;

})(this.BX.Crm = this.BX.Crm || {}, BX.Crm.AI, BX.Crm.AI, BX.Crm.Integration.UI, BX, BX.UI, BX.Vue3, BX.Vue3.Vuex, BX.UI.Dialogs, BX.Crm.AI.Feedback, BX.Crm.Integration.Analytics, BX.UI.Analytics, BX);
//# sourceMappingURL=ai-form-fill.bundle.js.map
