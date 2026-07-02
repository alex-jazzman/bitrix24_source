/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_buttons, main_core_events) {
	'use strict';

	class Step {
		actual = null; // does not use yet
		correct = null;
		started = false;
		finished = false;
		statusAttributeName = "data-bx-status";
		url = "";
		errors = new Map();
		notes = new Map();
		constructor(options, iterator) {
			this.id = String(options["ID"]);
			this.iterator = iterator;
			this.nodeMain = document.querySelector("#" + options["NODE_ID"]);
			this.node = this.nodeMain.querySelector("[data-bx-block=\"info-block\"]");
			this.actual = options["IS_ACTUAL"];
			this.correct = options["IS_CORRECT"];
			this.started = options["IS_STARTED"];
			this.finished = options["IS_FINISHED"];
			main_core_events.EventEmitter.subscribe(this.iterator, "Iterator:reset", this.reset.bind(this));
			main_core_events.EventEmitter.subscribe(this.iterator, "Iterator:response", this.checkResponse.bind(this));
			main_core_events.EventEmitter.subscribe(this.iterator, "Iterator:error", this.setError.bind(this));
			this.adjustNode();
			this.adjustInfoBlock(options["ERRORS"], options["NOTES"]);
			const button = this.nodeMain.querySelector("[data-bx-url]");
			if (button) {
				this.url = button.getAttribute("data-bx-url");
				button.addEventListener("click", this.onClickUrl.bind(this));
			}
		}
		reset() {
			this.started = true;
			this.finished = false;
			this.actual = null;
			this.correct = null;
			this.adjustNode();
		}
		checkResponse({
			data: steps
		}) {
			for (const stepId in steps) {
				if (steps.hasOwnProperty(stepId) && this.id === stepId) {
					this.actual = steps[stepId].actual;
					this.correct = steps[stepId].correct;
					this.started = steps[stepId].started;
					this.finished = steps[stepId].finished;
					this.adjustNode();
					this.adjustInfoBlock(steps[stepId]["errors"], steps[stepId]["notes"]);
				}
			}
		}
		adjustNode() {
			let status = "ok";
			if (!this.started) {
				status = "not-checked";
			} else if (!this.finished) {
				status = "in-progress";
			} else if (!this.actual) {
				status = "not-actual";
			} else if (!this.correct) {
				status = "not-correct";
			}
			this.nodeMain.setAttribute(this.statusAttributeName, status);
		}
		setError() {
			this.node.innerHTML = "Some error was occurred.";
		}
		adjustInfoBlock(errors, notes) {
			let child = this.node.lastChild;
			while (child) {
				this.node.removeChild(child);
				child = this.node.lastChild;
			}
			this.parseErrors(errors, notes);
			if (this.node.hasChildNodes()) {
				main_core.Tag.style(this.node.parentNode)`
				height: ${this.node.offsetHeight}px;
				opacity: 1;
			`;
			} else {
				main_core.Tag.style(this.node.parentNode)`
				height: 0;
				opacity: 0;
			`;
			}
		}
		onClickUrl() {
			if (main_core.Type.isStringFilled(this.url)) {
				BX.SidePanel.Instance.open(this.url);
			}
		}
		parseErrors(errors, notes) {}
	}

	class StepTelephony extends Step {
		constructor(options, iterator) {
			super(options, iterator);
		}
		parseErrors(errors, notes) {
			for (let [key, error] of Object.entries(errors)) {
				if (key !== "VOXIMPLANT_IS_NOT_CONFIGURED") {
					this.node.append(main_core.Tag.render`<span class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${error["message"]}</span>`);
				}
			}
		}
	}

	class StepCrmForm extends Step {
		constructor(options, iterator) {
			super(options, iterator);
		}
		onChange({
			target
		}) {
			const select = this.node.querySelector("#crm_numbers");
			if (select.value !== null) {
				main_core_events.EventEmitter.emit(this, "Step:action", {
					action: "setNumber",
					data: {
						numberId: select.value
					}
				});
			}
			const butt = this.node.querySelector("#crm_button");
			if (butt) {
				main_core.Dom.addClass(butt, "ui-btn-wait");
				setTimeout(() => {
					main_core.Dom.removeClass(butt, "ui-btn-wait");
				}, 2000);
			}
		}
		parseErrors(errors, notes) {
			for (let [key, error] of Object.entries(errors)) {
				this.node.append(main_core.Tag.render`<span class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${error["message"]}</span>`);
			}
			if (notes && main_core.Type.isArray(notes["items"])) {
				let numberIsInUse = [];
				notes["items"].forEach(number => {
					if (number['IS_IN_USE'] === true) {
						numberIsInUse.push(number['LINE_NUMBER']);
					}
				});
				let numbers = '';
				if (numberIsInUse.length > 1) {
					numbers = `<option value="null" selected>${main_core.Loc.getMessage("CRM_SEVERAL_NUMBERS_IS_IN_USE")}</option>`;
				} else if (numberIsInUse.length <= 0) {
					numbers = `<option value="null" selected>${main_core.Loc.getMessage("CRM_PICK_UP_THE_NUMBER_FOR_CRMFORM")}</option>`;
				}
				notes["items"].forEach(number => {
					numbers += `
					<option value="${number['LINE_NUMBER']}" ${numberIsInUse.length === 1 && number['IS_IN_USE'] ? "selected" : ""}>
						[${number['LINE_NUMBER']}] ${number['SHORT_NAME']}
					</option>
			`;
				});
				main_core.Dom.append(main_core.Tag.render`
					<div class="crm-wizard-settings-block-hidden-input">
						<div class="crm-wizard-settings-block-hidden-input-inner">
							<div class="crm-wizard-settings-block-hidden-input-label">${main_core.Loc.getMessage("CRM_CHANGE_CRM_FORM_NUMBER")}</div>
							<div class="ui-ctl ui-ctl-w100 ui-ctl-after-icon ui-ctl-dropdown">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select class="ui-ctl-element" id="crm_numbers">
									${numbers}
								</select>
							</div>
						</div>
						<button class="ui-btn ui-btn-light-border" id="crm_button" onclick="${this.onChange.bind(this)}">${main_core.Loc.getMessage("CRM_BUTTON_APPLY")}</button>
					</div>
`, this.node);
			}
		}
	}

	class StepImconnector extends Step {
		constructor(options, iterator) {
			super(options, iterator);
		}
		parseErrors(errors, notes) {
			let node = null;
			for (let [key, error] of Object.entries(errors)) {
				if (error["code"] === "IMCONNECTOR_IS_NOT_CORRECT" && main_core.Type.isArray(error["customData"])) {
					node = main_core.Tag.render`<ul class="crm-wizard-settings-block-list"></ul>`;
					error["customData"].forEach(item => {
						node.append(main_core.Tag.render`
	<li class="${item["icon_class"]}">
		<a href="${item["link"]}" onclick="BX.SidePanel.Instance.open(this.href); return false;">${item["name"]}</a>
	</li>
						`);
					});
					node = main_core.Tag.render`<div class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${error["message"]}${node}</div>`;
				} else {
					node = main_core.Tag.render`<div class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${error["message"]}</div>`;
				}
				this.node.append(node);
			}
		}
	}

	class StepMessageService extends Step {
		constructor(options, iterator) {
			super(options, iterator);
		}
		onClickUrl() {
			if (main_core.Type.isStringFilled(this.url)) {
				window.open(this.url);
			}
		}
		parseErrors(errors) {
			let node = null,
				node2 = null;
			const errorNode = main_core.Tag.render`<div class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected"></div>`;
			for (let [key, error] of Object.entries(errors)) {
				if (error["code"] === "NONEXISTENT_PROVIDER") {
					if (node2 === null) {
						node2 = main_core.Tag.render`<ul class="crm-wizard-settings-block-provider-list"></ul>`;
						errorNode.append(main_core.Tag.render`<div class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${node2}</div>`);
					}
					node2.append(main_core.Tag.render`<li>${error["message"]}</li>`);
				} else if (error["code"] === "NONWORKING_PROVIDER") {
					if (node === null) {
						node = main_core.Tag.render`<ul class="crm-wizard-settings-block-provider-list"></ul>`;
						errorNode.append(main_core.Tag.render`<div class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${node}</div>`);
					}
					node.append(main_core.Tag.render`
	<li>
		${error["message"]}
		<a href="${error["customData"]["manageUrl"]}" onclick="BX.SidePanel.Instance.open(this.href); return false;">${error["customData"]["shortName"]}</a>
	</li>
						`);
				} else {
					errorNode.append(main_core.Tag.render`<div>${error["message"]}</div>`);
				}
			}
			if (errorNode.hasChildNodes()) {
				this.node.append(errorNode);
			}
		}
	}

	class StepPaySystem extends Step {
		constructor(options, iterator) {
			super(options, iterator);
		}
		onClickUrl() {
			if (main_core.Type.isStringFilled(this.url)) {
				window.open(this.url);
			}
		}
		parseErrors(errors, notes) {
			for (let [key, error] of Object.entries(errors)) {
				if (key !== "PAY_SYSTEM_IS_NOT_CONFIGURED") {
					this.node.append(main_core.Tag.render`<span class="crm-wizard-settings-block-hidden-notice crm-wizard-settings-block-hidden-notice-unselected">${error["message"]}</span>`);
				}
			}
		}
	}

	const stepMappings = {
		'Step': Step,
		'StepTelephony': StepTelephony,
		'StepCrmForm': StepCrmForm,
		'StepImconnector': StepImconnector,
		'StepMessageService': StepMessageService,
		'StepPaySystem': StepPaySystem
	};
	class Iterator {
		started = false;
		finished = false;
		steps = new Map();
		resetButton = null;
		closeButton = null;
		constructor(id, data) {
			this.id = id;
			this.started = data.started;
			this.finished = data.finished;
			this.steps = new Map();
			data.steps.map(stepOption => {
				this.addStep(stepOption);
			});
			if (data["buttons"]["start"]) {
				this.resetButton = ui_buttons.ButtonManager.createFromNode(data["buttons"]["start"]);
				main_core.Event.bind(this.resetButton.getContainer(), "click", event => {
					event.preventDefault();
					this.start();
				});
				main_core_events.EventEmitter.subscribe(this, "Iterator:reset", () => {
					this.resetButton.setWaiting(true);
				});
				main_core_events.EventEmitter.subscribe(this, "Iterator:finish", () => {
					this.resetButton.setWaiting(false);
				});
				main_core_events.EventEmitter.subscribe(this, "Iterator:error", () => {
					this.resetButton.setWaiting(false);
				});
			}
			this.componentName = data["componentName"];
			this.signedParameters = data["signedParameters"];
		}
		addStep(stepOption) {
			const id = String(stepOption["ID"]);
			const stepClassName = id.substring(id.lastIndexOf("\\") + 1);
			let step;
			if (stepMappings[stepClassName]) {
				step = new stepMappings[stepClassName](stepOption, this);
			} else {
				step = new Step(stepOption, this);
			}
			main_core_events.EventEmitter.subscribe(step, "Step:action", ({
				target,
				data
			}) => {
				this.execute(target.id, data.action, data.data);
			});
			this.steps.set(id, step);
		}
		getId() {
			return this.id;
		}
		start() {
			main_core_events.EventEmitter.emit(this, "Iterator:reset", []);
			this.send("reset");
		}
		continue() {
			main_core_events.EventEmitter.emit(this, "Iterator:continue", []);
			this.send("continue");
		}
		finish() {
			main_core_events.EventEmitter.emit(this, "Iterator:finish", []);
			this.resetButton.setDisabled(true);
		}
		error({
			errors
		}) {
			main_core_events.EventEmitter.emit(this, "Iterator:error", data);
		}
		execute(stepId, stepAction, stepData) {
			this.send("executeStep", {
				stepId: stepId,
				stepAction: stepAction,
				stepData: stepData
			});
		}
		send(action, data) {
			data = main_core.Type.isPlainObject(data) ? data : {};
			main_core.ajax.runComponentAction(this.componentName, action, {
				signedParameters: this.signedParameters,
				mode: "class",
				data: data
			}).then(this.response.bind(this), this.error.bind(this));
		}
		response({
			data
		}) {
			this.started = data.started;
			this.finished = data.finished;
			main_core_events.EventEmitter.emit(this, "Iterator:response", data["stepSteps"]);
			if (this.finished !== true) {
				this.continue();
			} else {
				this.finish();
			}
		}
	}

	exports.Iterator = Iterator;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.UI, BX.Event);
//# sourceMappingURL=script.js.map
