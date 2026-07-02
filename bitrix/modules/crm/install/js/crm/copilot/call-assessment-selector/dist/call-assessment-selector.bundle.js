/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_core_events, ui_entitySelector, pull_client) {
	'use strict';

	const TAG = 'CRM_COPILOT_CALL_ASSESSMENT_SCRIPT_SELECTOR';
	const COMMAND_UPDATE = 'update_call_assessment';
	const COMMAND_SELECT = 'select_call_assessment';
	class PullManager {
		#unsubscribeUpdate;
		#unsubscribeSelect;
		constructor(options) {
			this.#unsubscribeUpdate = this.#subscribe(COMMAND_UPDATE, options.onUpdate);
			this.#unsubscribeSelect = this.#subscribe(COMMAND_SELECT, options.onSelect);
			this.#extendsWatch();
		}
		#subscribe(command, callback) {
			if (!pull_client.PULL) {
				return () => {};
			}
			return pull_client.PULL.subscribe({
				moduleId: 'crm',
				command,
				callback
			});
		}
		#extendsWatch() {
			if (pull_client.PULL) {
				pull_client.PULL.extendWatch(TAG);
			}
		}
		#clearWatch() {
			if (pull_client.PULL) {
				pull_client.PULL.clearWatch(TAG);
			}
		}
		unsubscribe() {
			this.#unsubscribeUpdate();
			this.#unsubscribeSelect();
			this.#clearWatch();
		}
	}

	const ENTITY_ID = 'copilot_call_script'; /** @php \Bitrix\Crm\Copilot\CallAssessment\EntitySelector\CallScriptProvider */

	// todo: maybe put it in a separate model class?

	class CallAssessmentSelector {
		#id;
		#currentCallAssessmentId = null;
		#additionalSelectorOptions;
		#displayStrategy;
		#emptyScriptListTitle;
		#container;
		#currentSelectorItem = null;
		#dialog = null;
		#eventEmitter;
		#pull;
		#isDisplayLoadingState = true;
		#isDisabled = false;
		isSelectsByPull = false;
		#changesByPullQueue = [];
		constructor(options) {
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : main_core.Text.getRandom(16);
			const currentCallAssessment = options.currentCallAssessment;
			if (main_core.Type.isNumber(currentCallAssessment.id) && currentCallAssessment.id > 0) {
				this.#currentCallAssessmentId = currentCallAssessment.id;
			}
			this.#additionalSelectorOptions = options.additionalSelectorOptions ?? {};
			this.#emptyScriptListTitle = options.emptyScriptListTitle ?? null;
			this.#displayStrategy = options.displayStrategy;
			this.#displayStrategy.updateTitle(currentCallAssessment.title ?? this.#emptyScriptListTitle);
			this.#container = this.#displayStrategy.getTargetNode();
			main_core.Event.bind(this.#container, 'click', this.#toggleDialog.bind(this));
			this.#bindEvents(options.events);
			this.#subscribePull();
		}
		getId() {
			return this.#id;
		}
		isSelectByPull() {
			return this.isSelectsByPull;
		}
		getCurrentCallAssessmentId() {
			return this.#currentCallAssessmentId;
		}
		getCurrentCallAssessmentItem() {
			const customData = this.#currentSelectorItem?.getCustomData() ?? null;
			if (customData === null) {
				return null;
			}
			return Object.fromEntries(customData);
		}
		getCurrentSelectorItem() {
			return this.#currentSelectorItem;
		}
		#toggleDialog() {
			if (this.#isDisabled) {
				return;
			}
			const dialog = this.getDialog();
			if (dialog.isOpen()) {
				dialog.hide();
			} else {
				dialog.show();
			}
		}
		getContainer() {
			return this.#container;
		}
		#loading(isLoading) {
			if (this.#isDisplayLoadingState) {
				this.#displayStrategy.setLoading(isLoading);
			}
		}
		getDialog() {
			if (this.#dialog === null) {
				const parentPopupContainer = this.#container.closest('body');
				const dialogOptions = {
					...this.#additionalSelectorOptions.dialog,
					targetNode: this.#container,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					showAvatars: false,
					preselectedItems: [[ENTITY_ID, this.#currentCallAssessmentId]],
					entities: [{
						id: ENTITY_ID,
						dynamicLoad: true,
						dynamicSearch: true
					}],
					popupOptions: this.#additionalSelectorOptions.popup ?? {},
					events: {
						...this.#additionalSelectorOptions.dialog?.events,
						onLoad: this.#onLoadDialog.bind(this),
						'Item:onBeforeSelect': this.#onItemBeforeSelect.bind(this),
						'Item:onBeforeDeselect': this.#onItemBeforeDeselect.bind(this),
						onShow: event => {
							main_core.Event.bindOnce(parentPopupContainer, 'click', this.#onPopupContainerClick.bind(this));
						},
						onHide: () => {
							main_core.Event.unbind(parentPopupContainer, this.#onPopupContainerClick);
						}
					}
				};
				this.#dialog = new ui_entitySelector.Dialog(dialogOptions);
			}
			return this.#dialog;
		}
		#onLoadDialog(event) {
			this.#applyChangesByPull();
			const item = this.#getDialogItem(this.#currentCallAssessmentId);
			if (item === null) {
				return;
			}
			this.#updateCurrentSelectorItem(item);
			this.#callAdditionalEvent(event, 'onLoad');
		}
		#onItemBeforeSelect(event) {
			const targetItem = event.getData().item;
			if (targetItem === null) {
				return;
			}
			this.#updateCurrentSelectorItem(targetItem);
			this.#callAdditionalEvent(event, 'Item:onBeforeSelect');
		}
		#onItemBeforeDeselect(event) {
			this.#preventDeselectCurrentSelectorItem(event);
			this.#callAdditionalEvent(event, 'Item:onBeforeDeselect');
		}
		#callAdditionalEvent(event, eventName) {
			const eventCallback = this.#additionalSelectorOptions?.dialog?.events?.[eventName];
			if (main_core.Type.isFunction(eventCallback)) {
				eventCallback(event);
			}
		}
		#preventDeselectCurrentSelectorItem(event) {
			const targetItem = event.getData().item;
			if (targetItem === null) {
				return;
			}
			if (targetItem.id === this.#currentCallAssessmentId) {
				event.preventDefault();
			}
			event.getTarget().hide();
		}
		#updateCurrentSelectorItem(item) {
			this.#currentSelectorItem = item ?? null;
			this.#currentCallAssessmentId = item?.getId() ?? null;
			this.#adjustTitle();
		}
		#adjustTitle() {
			const title = this.#currentSelectorItem?.getTitle() ?? this.#emptyScriptListTitle;
			this.#displayStrategy.updateTitle(title);
		}
		#onPopupContainerClick(clickEvent) {
			const {
				target
			} = clickEvent;
			if (target?.closest('.call-quality__script-selector') === null && target?.closest('.ui-selector-dialog') === null && this.#displayStrategy.getTargetNode() !== target) {
				this.close();
			}
		}
		destroy() {
			this.#dialog?.destroy();
			this.#pull.unsubscribe();
		}
		close() {
			this.#dialog?.hide();
		}
		disable() {
			this.#isDisabled = true;
			const node = this.#displayStrategy?.getTargetNode();
			main_core.Dom.addClass(node, '--disabled');
			main_core.Dom.style(node, {
				cursor: 'not-allowed',
				opacity: '.6'
			});
		}
		enable() {
			this.#isDisabled = false;
			const node = this.#displayStrategy?.getTargetNode();
			main_core.Dom.removeClass(node, '--disabled');
			main_core.Dom.style(node, {
				cursor: 'inherit',
				opacity: '1'
			});
		}
		#subscribePull() {
			this.#pull = new PullManager({
				onUpdate: this.#onUpdateItemByPull.bind(this),
				onSelect: eventData => {
					this.isSelectsByPull = true;
					this.#onSelectItemByPull(eventData);
					this.isSelectsByPull = false;
				}
			});
		}
		#bindEvents(events) {
			this.#eventEmitter = new main_core_events.EventEmitter();
			this.#eventEmitter.setEventNamespace('Crm.Copilot.CallAssessmentSelector');
			if (main_core.Type.isObject(events)) {
				Object.entries(events).forEach(([eventName, listener]) => {
					this.#eventEmitter.subscribe(eventName, listener);
				});
			}
		}
		#onSelectItemByPull(eventData) {
			const {
				selectorId,
				itemOptions
			} = eventData;
			if (selectorId !== this.getId()) {
				return;
			}
			if (!this.#isDialogLoaded()) {
				const item = new ui_entitySelector.Item(itemOptions);
				const event = new main_core_events.BaseEvent({
					data: {
						item
					}
				});
				this.#updateCurrentSelectorItem(item);
				this.#callAdditionalEvent(event, 'Item:onBeforeSelect');
				return;
			}
			if (!itemOptions.id) {
				this.#currentCallAssessmentId = null;
				this.getDialog().deselectAll();
				this.#adjustTitle();
				return;
			}
			this.#getDialogItem(itemOptions.id)?.select();
		}
		#onUpdateItemByPull(eventData) {
			const {
				itemOptions
			} = eventData;
			if (itemOptions.id === this.#currentCallAssessmentId) {
				this.#displayStrategy.updateTitle(itemOptions.title ?? this.#emptyScriptListTitle);
			}
			if (this.#isDialogLoaded()) {
				this.#updateItem(itemOptions);
				return;
			}
			this.#addChangeByPull(itemOptions);
			this.#eventEmitter.emit('onCallAssessmentUpdate', {
				callAssessment: itemOptions?.customData
			});
		}
		#updateItem(itemOptions, isEmit = true) {
			const item = this.#getDialogItem(String(itemOptions.id));
			if (item === null) {
				return;
			}
			item.setTitle(itemOptions.title);
			item.setSupertitle(itemOptions.supertitle);
			item.setBadges(itemOptions.badgesOptions);
			item.customData = new Map(Object.entries(itemOptions.customData));
			if (isEmit) {
				this.#eventEmitter.emit('onCallAssessmentUpdate', {
					callAssessment: itemOptions.customData
				});
			}
		}
		#addChangeByPull(callAssessment) {
			this.#changesByPullQueue.push(callAssessment);
		}
		#applyChangesByPull() {
			this.#changesByPullQueue.forEach(itemOptions => this.#updateItem(itemOptions, false));
			this.#changesByPullQueue = [];
		}
		#isDialogLoaded() {
			return this.#dialog !== null && !this.getDialog().isLoading();
		}
		#getDialogItem(id) {
			if (id === null) {
				return null;
			}
			return this.getDialog().getItem([ENTITY_ID, id]);
		}
	}

	exports.CallAssessmentSelector = CallAssessmentSelector;

})(this.BX.Crm.Copilot = this.BX.Crm.Copilot || {}, BX, BX.Event, BX.UI.EntitySelector, BX);
//# sourceMappingURL=call-assessment-selector.bundle.js.map
