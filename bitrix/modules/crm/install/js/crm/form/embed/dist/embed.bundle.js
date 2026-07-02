/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_sidepanel_layout, main_qrcode, ui_stepbystep, ui_switcher, main_loader, ui_notification, landing_ui_field_color, ui_feedback_form, popup, main_core_events) {
	'use strict';

	/**
	 * @package
	 */
	class DataProvider {
		#data = {
			loaded: false,
			data: {},
			errors: {}
		};
		updateValues(type, values) {
			if (type === 'click') {
				if (values.button.plain === '1' && main_core.Type.isStringFilled(values?.link?.align)) {
					values.button.align = values.link.align;
				}
				delete values.link;
			}
			this.data.embed.viewValues[type] = values;
		}
		getValues(type) {
			const values = this.data.embed.viewValues[type];
			if (type === 'click' && main_core.Type.isStringFilled(values?.button?.align)) {
				values.link = {
					align: values?.button?.align
				};
			}
			return BX.mergeEx(this.#getDefaultValues(type), values);
		}
		getOptions(type) {
			return this.data.embed.viewOptions[type];
		}
		getDict() {
			const dict = this.data.dict;
			dict.viewOptions.link = {
				aligns: dict?.viewOptions?.button?.aligns
			};
			return dict;
		}

		/**
		 * @package
		 */
		get data() {
			return this.#data.data;
		}

		/**
		 * @package
		 */
		set data(data) {
			this.#data.data = data;
		}

		/**
		 * @package
		 */
		get errors() {
			return this.#data.errors;
		}

		/**
		 * @package
		 */
		set errors(errors) {
			this.#data.errors = errors;
		}

		/**
		 * @package
		 */
		get loaded() {
			return this.#data.loaded || false;
		}

		/**
		 * @package
		 */
		set loaded(value) {
			this.#data.loaded = value;
		}
		#getDefaultValues(type) {
			const defaults = {
				inline: {},
				auto: {},
				// 'type', 'position', 'vertical', 'delay'
				click: {
					// 'type', 'position', 'vertical',
					button: {
						use: "0",
						// 1|0
						text: BX.Loc.getMessage('EMBED_SLIDER_OPTION_BUTTONSTYLE_LABEL'),
						font: "modern",
						// modern|classic|elegant
						align: "center",
						// left|right|center|inline
						plain: "0",
						rounded: "0",
						outlined: "0",
						decoration: "",
						// ""|dotted|solid
						color: {
							text: "#ffffffff",
							textHover: "#ffffffff",
							background: "#3eddffff",
							backgroundHover: "#3eddffa6"
						}
					}
				}
			};
			return !main_core.Type.isUndefined(defaults[type]) ? defaults[type] : {};
		}
	}

	// fallback values
	const HELP_CENTER_ID = 13003062;
	const HELP_CENTER_URL = `BX.Helper?.show('redirect=detail&code=${HELP_CENTER_ID}')`;
	class Tab {
		#loader;
		constructor() {
			this.#loader = new BX.Loader();
		}
		get loader() {
			return this.#loader;
		}
		renderBubble(text, withoutFrame = false) {
			return main_core.Tag.render`
			<div class="crm-form-embed__customization-info">
				<div class="crm-form-embed__customization-info--avatar">
					<img src="/bitrix/js/crm/images/crm-form-info-avatar.svg" alt="avatar">
				</div>
				<div class="crm-form-embed__customization-info--text ${withoutFrame ? '--without-frame' : ''}">${text}</div>
			</div>
		`;
		}
		renderCopySection(title = null, btnText = null, copyText = null, innerContent = null, iconClass = null) {
			const section = this.renderSection();
			if (!main_core.Type.isNull(title)) {
				main_core.Dom.append(main_core.Tag.render`
					<div class="crm-form-embed__title-block">
						<div class="ui-slider-heading-4 --no-border-bottom">${main_core.Text.encode(title)}</div>
					</div>
			`, section);
			}
			const inner = main_core.Tag.render`<div class="crm-form-embed__copy-block"></div>`;
			if (main_core.Type.isDomNode(innerContent)) {
				main_core.Dom.append(innerContent, inner);
			}
			if (!main_core.Type.isNull(btnText) && !main_core.Type.isNull(copyText)) {
				main_core.Dom.append(main_core.Tag.render`
				<div class="crm-form-embed__btn-box --center">
					<button
						class="crm-form-embed-btn-copy-publink ui-btn ui-btn-lg ui-btn-primary ui-btn-round ${iconClass ? iconClass : ''}">
							${main_core.Text.encode(btnText)}
					</button>
				</div>
			`, inner);
				top.BX.clipboard.bindCopyClick(inner.querySelector('.crm-form-embed-btn-copy-publink'), {
					text: copyText,
					popup: {
						offsetLeft: 60
					}
				});
			}
			main_core.Dom.append(inner, section);
			return section;
		}
		renderPreviewSection(title, desc, btn, url) {
			const qr = main_core.Tag.render`<div class="crm-form-embed__qr-block--qr"></div>`;
			new QRCode(qr, {
				text: url,
				width: 147,
				height: 147
			});
			const section = this.renderSection();
			main_core.Dom.addClass(section, '--crm-qr-bg');
			main_core.Dom.append(main_core.Tag.render`
				<div class="crm-form-embed__qr-block">
					<div class="crm-form-embed__qr-block--info">
						<div class="crm-form-embed__qr-block--info-name">${main_core.Text.encode(title)}</div>
						<div class="crm-form-embed__qr-block--info-text">
							<div class="ui-icon ui-icon-service-light-messenger ui-icon-md" style="float: left; margin-right: 10px;"><i></i></div>
							${main_core.Text.encode(desc)}
						</div>
						<button
							class="ui-btn ui-btn-light-border ui-btn-round crm-form-embed__qr-block--btn"
							onclick="window.open('${main_core.Text.encode(url)}');">
								${main_core.Text.encode(btn)}
						</button>
					</div>
					<div class="crm-form-embed__qr-block">
						${qr}
					</div>
				</div>
			`, section);
			return section;
		}

		/**
		 * @protected
		 */
		renderHeaderSection(icon, title, text, helpCenterId, helpCenterUrl) {
			const section = this.renderSection(null, true, true);
			main_core.Dom.append(main_core.Tag.render`
			<span class="ui-icon ui-slider-icon ui-icon-service-${main_core.Text.encode(icon)}">
				<i></i>
			</span>
		`, section);
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-slider-content-box">
				<div class="ui-slider-heading-2">${main_core.Text.encode(title)}</div>
				<div class="ui-slider-inner-box">
					<p class="ui-slider-paragraph-2 crm-form-embed-header-section">${main_core.Text.encode(text)}</p>
					${this.renderHelp(helpCenterId, helpCenterUrl)}
				</div>
			</div>
		`, section);
			return section;
		}
		renderStepperSection(content) {
			const section = this.renderSection();
			const step = new ui_stepbystep.StepByStep({
				target: section,
				content: content
			});
			step.init();
			return section;
		}

		/**
		 * @protected
		 * @param elem HTMLElement
		 * @param rounding boolean
		 * @param withIcon boolean
		 */
		renderSection(elem, rounding = true, withIcon = false) {
			const section = main_core.Tag.render`
			<div 
				class="
					ui-slider-section
					${rounding ? '--rounding' : ''}
					${withIcon ? 'ui-slider-section-icon --icon-sm' : ''}
				"
			></div>
		`;
			if (main_core.Type.isDomNode(elem)) {
				main_core.Dom.append(elem, section);
			}
			return section;
		}

		/**
		 * @protected
		 * @param elem HTMLElement
		 */
		renderContainer(elem) {
			const container = main_core.Tag.render`<div class="crm-form-embed__wrapper crm-form-embed__scope"></div>`;
			if (main_core.Type.isDomNode(elem)) {
				main_core.Dom.append(elem, container);
			}
			return container;
		}
		renderHelp(helpCenterId, helpCenterUrl, caption = BX.Loc.getMessage('EMBED_SLIDER_MORE_INFO')) {
			const showHelp = function (event) {
				if (top.BX.Helper) {
					top.BX.Helper.show("redirect=detail&code=" + this.dataset.helpId);
					event.preventDefault();
				}
				return false;
			};
			return main_core.Tag.render`
			<a
				data-help-id="${main_core.Text.encode(helpCenterId)}"
				onclick="${showHelp}"
				href="${main_core.Text.encode(helpCenterUrl)}"
				class="ui-slider-link" target="_blank"
			>
				${main_core.Text.encode(caption)}
			</a>
		`;
		}
	}

	const ERROR_CODE_FORM_READ_ACCESS_DENIED = 1;
	const ERROR_CODE_WIDGET_READ_ACCESS_DENIED = 3;
	const ERROR_CODE_WIDGET_WRITE_ACCESS_DENIED = 4;
	const ERROR_CODE_OPENLINES_WRITE_ACCESS_DENIED = 6;

	function handlerToggleSwitcher() {
		const selection = window.getSelection().toString();
		if (selection === "") {
			this.parentElement.querySelector('.crm-form-embed-widgets-control > .ui-switcher').click();
		}
	}
	function handlerToggleCodeBlock(event) {
		const section = event.currentTarget.closest('.ui-slider-section');
		const toggleBtn = section.querySelector('[data-roll="data-show-code"]');
		const blockCode = section.querySelector('[data-roll="crm-form-embed__code"]');
		if (main_core.Dom.style(blockCode, 'height') === "0px") {
			main_core.Dom.addClass(toggleBtn, "--up");
			main_core.Dom.addClass(blockCode, "--open");
			main_core.Dom.style(blockCode, "height", main_core.Text.encode(blockCode.scrollHeight) + "px");
		} else {
			main_core.Dom.removeClass(toggleBtn, "--up");
			main_core.Dom.removeClass(blockCode, "--open");
			main_core.Dom.style(blockCode, "height", main_core.Text.encode(blockCode.scrollHeight) + "px");
			// blockCode.clientHeight;
			main_core.Dom.style(blockCode, "height", "0");
		}
		main_core.Event.unbind(blockCode, 'transitionend', transitionHandlerForCodeBlock);
		main_core.Event.bind(blockCode, 'transitionend', transitionHandlerForCodeBlock);
	}
	function transitionHandlerForCodeBlock(event) {
		const section = event.currentTarget.closest('.ui-slider-section');
		const blockCode = section.querySelector('[data-roll="crm-form-embed__code"]');
		if (main_core.Dom.style(blockCode, "height") !== "0px") {
			main_core.Dom.style(blockCode, "height", "auto");
		}
	}

	class Widget extends Tab {
		#formId;
		#options;
		#loaded = false;
		#data;
		#errors;
		#container;
		constructor(formId, options = {}) {
			super();
			this.#formId = formId;
			this.#options = options;
			Widget.prototype.actionGet = 'crm.form.getWidgetsForEmbed';
			this.#container = this.renderContainer();
		}
		get formId() {
			return this.#formId;
		}
		load() {
			if (this.#loaded) {
				return Promise.resolve();
			}
			return BX.ajax.runAction(this.actionGet, {
				json: {
					formId: this.#formId,
					count: this.#options.widgetsCount
				}
			}).then(response => {
				this.#data = response.data;
				this.#loaded = true;
				this.render();
			}).catch(response => {
				this.#data = response.data;
				this.#errors = response.errors;
				this.#loaded = false;
				this.renderError(response.data);
			});
		}
		render() {
			this.#container.innerHTML = '';
			const headerSection = this.renderHeader(HELP_CENTER_ID, HELP_CENTER_URL);
			main_core.Dom.append(headerSection, this.#container);
			if (!this.#loaded) {
				this.loader.show(this.#container);
			} else {
				main_core.Dom.replace(headerSection, this.renderHeader(this.#data.helpCenterId, this.#data.helpCenterUrl));
				this.renderPreview(this.#container, this.#data);
				main_core.Dom.append(this.renderWidgets(this.#data), this.#container);
				this.renderFinalBlock(this.#container);
			}
			return this.#container;
		}
		renderTo(node) {
			if (!main_core.Type.isDomNode(node)) {
				throw new Error('Parameter `node` not an element.');
			}
			main_core.Dom.append(this.render(), node);
		}
		renderError(responseData) {
			this.#container.innerHTML = '';
			let errorMessage = BX.Loc.getMessage('EMBED_SLIDER_GENERAL_ERROR');
			if (main_core.Type.isObject(responseData) && main_core.Type.isObject(responseData.error) && responseData.error.status === 'access denied') {
				if (responseData.error.code === ERROR_CODE_FORM_READ_ACCESS_DENIED) {
					errorMessage = BX.Loc.getMessage('EMBED_SLIDER_FORM_ACCESS_DENIED');
				}
				if (responseData.error.code === ERROR_CODE_WIDGET_READ_ACCESS_DENIED) {
					errorMessage = BX.Loc.getMessage('EMBED_SLIDER_WIDGET_ACCESS_DENIED');
				}
			}
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-alert ui-alert-warning">
				<span class="ui-alert-message">${errorMessage}</span>
			</div>
		`, this.#container);
		}
		renderPreview(container, data) {
			if (!main_core.Type.isNull(data.previewLink)) {
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_OPEN_IN_NEW_TAB'), data.previewLink), container);
			}
		}
		renderFinalBlock(container) {
			main_core.Dom.append(this.renderCopySection(null, null, null, this.renderBubble(BX.Loc.getMessage('EMBED_SLIDER_WIDGET_COPY_BUBBLE'), true)), container);
		}
		renderHeader(helpCenterId, helpCenterUrl) {
			return this.renderHeaderSection('message-widget', BX.Loc.getMessage('EMBED_SLIDER_WIDGET_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_WIDGET_DESC'), helpCenterId, helpCenterUrl);
		}
		renderWidgets(data) {
			const section = this.renderSection();
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__title-block">
				<div class="ui-slider-heading-4">${BX.Loc.getMessage('EMBED_SLIDER_WIDGET_SETTINGS_TITLE')}</div>
			</div>
		`, section);
			// Dom.append(
			// 	this.renderBubble("text", false),
			// 	section
			// );

			const allIds = Object.keys(data.widgets);
			const contentInner = allIds.length === 0 ? this.renderEmptyInner() : this.renderWidgetRows(data.widgets, data.formName, data.formType);

			// let showMoreLink = '';
			// if (data.showMoreLink)
			// {
			// 	const allWidgetsUrl = Type.isStringFilled(data.url.allWidgets) ? data.url.allWidgets : '/crm/button/';
			// 	showMoreLink = Tag.render`
			// 		<p class="crm-form-embed-widgets-all-buttons">
			// 			<a href="${Text.encode(allWidgetsUrl)}" target="_blank" onclick="BX.SidePanel.Instance.open('${Text.encode(allWidgetsUrl)}'); return false;">
			// 				${BX.Loc.getMessage('EMBED_SLIDER_WIDGET_FORM_ALL_WIDGETS')}
			// 			</a>
			// 		</p>
			// 	`;
			// }

			main_core.Dom.append(main_core.Tag.render`
				<div class="crm-form-embed__customization-settings">
					${contentInner}

					<button
						class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-round ui-btn-no-caps ui-btn-icon-add crm-form-embed__customization-settings--btn crm-form-embed__customization-settings--btn-add"
						onclick="window.open('/crm/button/edit/0/')"
					>
						${BX.Loc.getMessage('EMBED_SLIDER_WIDGET_SETTINGS_BUTTON')}
					</button>

					<a
						class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-round ui-btn-no-caps crm-form-embed__customization-settings--btn"
						href="${main_core.Text.encode(data.url.allWidgets)}"
						style="float: right"
					>
						${BX.Loc.getMessage('EMBED_SLIDER_WIDGET_FORM_ALL_WIDGETS')}
					</a>
				</div>
			`, section);
			return section;
		}
		renderEmptyInner() {
			return BX.Loc.getMessage('EMBED_SLIDER_WIDGET_EMPTY');
		}
		renderWidgetRows(widgets, currentFormName, currentFormType) {
			// TODO remove data-attr and div
			const widgetsList = main_core.Tag.render`<div class="crm-form-embed-widgets" data-form-name="${main_core.Text.encode(currentFormName)}" data-form-type="${main_core.Text.encode(currentFormType)}"></div>`;
			const widgetIds = Widget.getOrderedWidgetIds(widgets);
			widgetIds.forEach(id => {
				const widget = widgets[id];
				widgetsList.append(Widget.#renderWidgetRow(widget, this.#formId, currentFormType));
			});
			return widgetsList;
		}
		static #renderWidgetRow(widget, formId, currentFormType) {
			const switcher = Widget.createSwitcher(widget.checked, 'crm-form-embed-widget-input-' + widget.id);
			switcher.handlers = {
				toggled: Widget.#handleSwitcher.bind(switcher, formId, widget.id)
			};
			const formNames = Object.values(widget.relatedFormNames);
			const sFormType = Widget.#getFormTypeMessage(currentFormType);
			const sFormNames = main_core.Type.isArray(formNames) && formNames.length > 0 ? formNames.join(', ') : '';
			const sFormNamesField = sFormNames.length > 0 ? sFormType + ': ' + sFormNames : '';
			const row = main_core.Tag.render`
			<div class="crm-form-embed__customization-settings--row crm-form-embed-widgets-block">
				<div class="crm-form-embed__customization-settings--switcher crm-form-embed-widgets-control"></div>
				<div class="crm-form-embed__customization-settings--row-label" onclick="${handlerToggleSwitcher}">
					${main_core.Text.encode(widget.name)}
				</div>
				<div
					class="crm-form-embed-widgets-detail crm-form-embed__customization-settings--row-label-secondary"
					title="${main_core.Text.encode(sFormNamesField)}"
					data-form-name="${main_core.Text.encode(sFormNames)}"
					data-form-type="${main_core.Text.encode(sFormType)}"
				>
					${main_core.Text.encode(sFormNamesField)}
				</div>
			</div>
		`;
			row.querySelector('.crm-form-embed-widgets-control').append(switcher.getNode());
			return row;
		}
		static getOrderedWidgetIds(widgets) {
			const widgetIds = Object.keys(widgets);
			widgetIds.sort((a, b) => {
				const aData = widgets[a];
				const bData = widgets[b];
				switch (true) {
					case aData.checked && bData.checked || !aData.checked && !bData.checked:
						return 0;
					case aData.checked && !bData.checked:
						return -1;
					case !aData.checked && bData.checked:
						return 1;
				}
			});
			return widgetIds;
		}
		static #getFormTypeMessage(formType) {
			const formTypeLangKey = 'EMBED_SLIDER_WIDGET_FORM_TYPE_MESSAGE_' + formType.toUpperCase();
			return BX.Loc.hasMessage(formTypeLangKey) ? BX.Loc.getMessage(formTypeLangKey) : formType;
		}

		/**
		 * @this Switcher
		 * @param formId number
		 * @param widgetId number
		 */
		static #handleSwitcher(formId, widgetId) {
			this.setLoading(true);

			// save old widget values for rollback on error
			const dataSetOld = this.getNode().closest('.crm-form-embed-widgets-block').querySelector('.crm-form-embed-widgets-detail').dataset;
			const formNameOld = dataSetOld.formName;
			const formTypeOld = dataSetOld.formType;

			// get values for current form
			const dataSetCurrent = this.getNode().closest('.crm-form-embed-widgets').dataset;
			const formName = dataSetCurrent.formName;
			const formType = dataSetCurrent.formType;

			// set related forms field to new values
			Widget.#updateRelatedForms(this.isChecked(), formName, formType, this);
			return BX.ajax.runAction('crm.form.assignWidgetToForm', {
				json: {
					formId: formId,
					buttonId: widgetId,
					assigned: this.isChecked() ? 'Y' : 'N'
				}
			}).then(response => {
				this.setLoading(false);

				// set to returned values (must match current)
				this.check(response.data.assigned, false);
				Widget.#updateRelatedForms(this.isChecked(), response.data.formName, response.data.formType, this);
				top.BX.UI.Notification.Center.notify({
					content: BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_FORM_ALERT_SETTINGS_SAVED')
				});
			}).catch(response => {
				this.setLoading(false);

				// rollback on error
				this.check(!this.isChecked(), false);
				Widget.#updateRelatedForms(formNameOld.length > 0, formNameOld, formTypeOld, this);
				let messageId = 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR';
				if (!main_core.Type.isUndefined(response.data.error) && !main_core.Type.isUndefined(response.data.error.status) && response.data.error.status === 'access denied') {
					messageId = response.data.error.code === ERROR_CODE_WIDGET_WRITE_ACCESS_DENIED ? 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED_WIDGET' : 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED_FORM';
				}
				top.BX.UI.Notification.Center.notify({
					content: BX.Loc.getMessage(messageId)
				});
			});
		}
		static #updateRelatedForms(assign, formName, formType, switcher) {
			if (assign) {
				Widget.#setRelatedForms(switcher, formName, formType);
			} else {
				Widget.#clearRelatedForms(switcher);
			}
		}
		static #setRelatedForms(switcher, formName, formType) {
			const formTypeMessage = Widget.#getFormTypeMessage(formType);
			const elem = switcher.getNode().closest('.crm-form-embed-widgets-block').querySelector('.crm-form-embed-widgets-detail');
			elem.textContent = formTypeMessage + ': ' + formName;
			elem.setAttribute('data-form-name', formName);
			elem.setAttribute('data-form-type', formTypeMessage);
		}
		static #clearRelatedForms(switcher) {
			const elem = switcher.getNode().closest('.crm-form-embed-widgets-block').querySelector('.crm-form-embed-widgets-detail');
			elem.textContent = '';
			elem.setAttribute('data-form-name', '');
			elem.setAttribute('data-form-type', '');
		}

		/**
		 * @protected
		 */
		static createSwitcher(checked, inputName) {
			const switcherNode = document.createElement('span');
			switcherNode.className = 'ui-switcher';
			return new top.BX.UI.Switcher({
				node: switcherNode,
				checked: checked,
				inputName: inputName
			});
		}
	}

	class Openlines extends Widget {
		constructor(formId, options = {}) {
			super(formId, options);
			Openlines.prototype.actionGet = 'crm.form.getOpenlinesForEmbed';
		}
		renderHeader(helpCenterId, helpCenterUrl) {
			return this.renderHeaderSection('message-widget', BX.Loc.getMessage('EMBED_SLIDER_OL_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_OL_DESC'), helpCenterId, helpCenterUrl);
		}
		renderPreview(container, data) {
			if (!main_core.Type.isNull(data.previewLink)) {
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_OPEN_IN_NEW_TAB'), data.previewLink), container);
			}
		}
		renderFinalBlock(container) {}
		renderWidgets(data) {
			// FIXME test, moved to error handler in widgets
			// if (Type.isNull(data))
			// {
			// 	return this.renderAccessDeniedAlert();
			// }

			const section = this.renderSection();
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__title-block">
				<div class="ui-slider-heading-4">${BX.Loc.getMessage('EMBED_SLIDER_OL_SETTINGS_TITLE')}</div>
			</div>
		`, section);
			// Dom.append(
			// 	this.renderBubble("text", false),
			// 	section
			// );

			const allIds = Object.keys(data.lines);
			const contentInner = allIds.length === 0 ? this.renderEmptyInner() : this.renderLineRows(data.lines, data.formName);

			// let showMoreLink = '';
			// if (data.showMoreLink)
			// {
			// 	const allLinesUrl = Type.isStringFilled(data.url.allLines) ? data.url.allLines : '/services/contact_center/openlines';
			// 	showMoreLink = Tag.render`
			// 		<p class="crm-form-embed-widgets-all-buttons">
			// 			<a href="${Text.encode(allLinesUrl)}" target="_blank" onclick="BX.SidePanel.Instance.open('${Text.encode(allLinesUrl)}'); return false;">
			// 				${BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_FORM_ALL_LINES')}
			// 			</a>
			// 		</p>
			// 	`;
			// }

			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__customization-settings"> <!-- --without-btn -->
				${contentInner}
				
				<a
					class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-round ui-btn-no-caps crm-form-embed__customization-settings--btn"
					href="${main_core.Text.encode(data.url.allLines)}"
					style="float: right;"
				>
					${BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_FORM_ALL_LINES')}
				</a>
				<div style="clear: both"></div>
			</div>
		`, section);
			return section;
		}
		renderEmptyInner() {
			return BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_EMPTY');
		}
		renderAccessDeniedAlert() {
			return main_core.Tag.render`
			<div class="ui-alert ui-alert-warning">
				<span class="ui-alert-message">${BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_ACCESS_DENIED')}</span>
			</div>
		`;
		}
		renderLineRows(lines, currentFormName) {
			const linesList = main_core.Tag.render`<div class="crm-form-embed-widgets" data-form-name="${main_core.Text.encode(currentFormName)}"></div>`;
			const lineIds = Openlines.getOrderedWidgetIds(lines);
			lineIds.forEach(id => {
				const data = lines[id];
				const checked = data.formEnabled && data.checked;
				const formName = data.formEnabled ? data.formName : '';
				linesList.append(Openlines.#renderLineRow(data.id, data.name, formName, checked, this.formId));
			});
			return linesList;
		}
		static #renderLineRow(lineId, lineName, formName, checked, formId) {
			const switcher = Openlines.createSwitcher(checked, 'crm-form-embed-line-input-' + lineId);
			switcher.handlers = {
				toggled: Openlines.#handleSwitcher.bind(switcher, formId, lineId)
			};
			const row = main_core.Tag.render`
			<div class="crm-form-embed__customization-settings--row crm-form-embed-widgets-block">
				<div class="crm-form-embed__customization-settings--switcher crm-form-embed-widgets-control"></div>
				<div class="crm-form-embed__customization-settings--row-label" onclick="${handlerToggleSwitcher}">
					${main_core.Text.encode(lineName)}
				</div>
				<div
					class="crm-form-embed-widgets-detail crm-form-embed__customization-settings--row-label-secondary"
					title="${main_core.Text.encode(formName)}"
					data-form-name="${main_core.Text.encode(formName)}"
				>
					${main_core.Text.encode(formName)}
				</div>
			</div>
		`;
			row.querySelector('.crm-form-embed-widgets-control').append(switcher.getNode());
			return row;
		}

		/**
		 * @this Switcher
		 * @param formId number
		 * @param lineId number
		 */
		static #handleSwitcher(formId, lineId) {
			this.setLoading(true);

			// save old widget values for rollback on error
			const formNameOld = this.getNode().closest('.crm-form-embed-widgets-block').querySelector('.crm-form-embed-widgets-detail').dataset.formName;
			// get values for current form
			const formName = this.getNode().closest('.crm-form-embed-widgets').dataset.formName;
			// set related forms field to new values
			Openlines.#updateRelatedOpenlineForms(this.isChecked() ? formName : '', this);
			return BX.ajax.runAction('crm.form.assignOpenlinesToForm', {
				json: {
					formId: formId,
					lineId: lineId,
					assigned: this.isChecked() ? 'Y' : 'N'
					// afterMessage: 'N',
				}
			}).then(response => {
				this.setLoading(false);

				// set to returned values (must match current)
				this.check(response.data.assigned, false);
				Openlines.#updateRelatedOpenlineForms(this.isChecked() ? response.data.formName : '', this);
				top.BX.UI.Notification.Center.notify({
					content: BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_FORM_ALERT_SETTINGS_SAVED')
				});
			}).catch(response => {
				this.setLoading(false);

				// rollback on error
				this.check(!this.isChecked(), false);
				Openlines.#updateRelatedOpenlineForms(formNameOld.length > 0 ? formNameOld : '', this);
				let messageId = 'EMBED_SLIDER_OPENLINES_FORM_ALERT_ERROR';
				if (!main_core.Type.isUndefined(response.data.error) && !main_core.Type.isUndefined(response.data.error.status) && response.data.error.status === 'access denied') {
					messageId = response.data.error.code === ERROR_CODE_OPENLINES_WRITE_ACCESS_DENIED ? 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED' // 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED_OPENLINES'
					: 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED_FORM';
				}
				top.BX.UI.Notification.Center.notify({
					content: BX.Loc.getMessage(messageId)
				});
			});
		}
		static #updateRelatedOpenlineForms(formName, switcher) {
			const elem = switcher.getNode().closest('.crm-form-embed-widgets-block').querySelector('.crm-form-embed-widgets-detail');
			elem.textContent = formName;
			elem.setAttribute('data-form-name', formName);
		}
	}

	class Form extends Tab {
		#formId;
		#dataProvider;
		constructor(formId, dataProvider) {
			super();
			this.#formId = formId;
			this.#dataProvider = dataProvider;
		}
		get dataProvider() {
			return this.#dataProvider;
		}
		get loaded() {
			return this.dataProvider.loaded;
		}

		/**
		 * @protected
		 * @deprecated this.dataProvider.data
		 */
		get data() {
			return this.dataProvider.data;
		}

		/**
		 * @deprecated this.dataProvider.data
		 */
		set data(data) {
			this.dataProvider.data = data;
		}
		get formId() {
			return this.#formId;
		}
		load(force = false) {
			if (!force && this.dataProvider.loaded) {
				return Promise.resolve();
			}
			if (main_core.Type.isObject(this.dataProvider.errors) && Object.keys(this.dataProvider.errors).length > 0) {
				return Promise.reject();
			}
			return new Promise((resolve, reject) => {
				BX.ajax.runAction('crm.form.getEmbed', {
					json: {
						formId: this.#formId
					}
				}).then(response => {
					this.dataProvider.data = response.data;
					this.dataProvider.loaded = true;
					resolve(response);
				}).catch(response => {
					this.dataProvider.data = response.data;
					this.dataProvider.errors = response.errors;
					this.dataProvider.loaded = false;
					reject(response);
				});
			});
		}
		save() {
			return new Promise((resolve, reject) => {
				return BX.ajax.runAction('crm.form.saveEmbed', {
					json: {
						formId: this.formId,
						data: this.dataProvider.data.embed.viewValues
					}
				}).then(response => {
					// TODO move to controls
					// const elem = renderedOptions.querySelector(`#crm-form-embed-wrapper-${formId}-${type}-vertical`);
					// if (key === "type")
					// {
					// 	item.value === "popup" && Dom.hide(elem);
					// 	item.value === "panel" && Dom.show(elem);
					// }

					top.BX.UI.Notification.Center.notify({
						content: BX.Loc.getMessage('EMBED_SLIDER_OPENLINES_FORM_ALERT_SETTINGS_SAVED')
					});
					resolve(response);
				}).catch(response => {
					// FIXME move to controls
					// if (key === "type")
					// {
					// 	item.value === "popup" && Dom.show(elem);
					// 	item.value === "panel" && Dom.hide(elem);
					// }

					let messageId = 'EMBED_SLIDER_FORM_SETTINGS_ALERT_ERROR';
					if (!main_core.Type.isUndefined(response.data.error.status) && response.data.error.status === 'access denied') {
						messageId = 'EMBED_SLIDER_WIDGET_FORM_ALERT_ERROR_ACCESS_DENIED_FORM';
					}
					top.BX.UI.Notification.Center.notify({
						content: BX.Loc.getMessage(messageId)
					});
					reject(response);
				});
			});
		}
		render() {
			return this.renderContainer();
		}
		renderTo(node) {
			if (!main_core.Type.isDomNode(node)) {
				throw new Error('Parameter `node` not an element.');
			}
			main_core.Dom.append(this.render(), node);
		}
		renderError(responseData) {
			let errorMessage = BX.Loc.getMessage('EMBED_SLIDER_GENERAL_ERROR');
			if (main_core.Type.isObject(responseData) && main_core.Type.isObject(responseData.error) && responseData.error.status === 'access denied') {
				if (responseData.error.code === ERROR_CODE_FORM_READ_ACCESS_DENIED) {
					errorMessage = BX.Loc.getMessage('EMBED_SLIDER_FORM_ACCESS_DENIED');
				}
			}
			return main_core.Tag.render`
			<div class="ui-alert ui-alert-warning">
				<span class="ui-alert-message">${errorMessage}</span>
			</div>
		`;
		}
		renderSettingsHeader(title, switcher = false, expertMode = null) {
			const switcherNode = switcher ? main_core.Tag.render`<div class="crm-form-embed__customization-settings--switcher"></div>` : '';
			const headingBox = main_core.Tag.render`
			<div class="ui-slider-heading-box ${switcher ? '--toggle' : ''}" data-roll="heading-block">
				<div class="ui-slider-heading-main">
					${switcherNode}
					<div class="ui-slider-heading-4">${title ? title : BX.Loc.getMessage('EMBED_SLIDER_SETTINGS_HEADING')}</div>
				</div>
				${expertMode ? main_core.Tag.render`
					<div class="ui-slider-heading-rest">
						<a 
							class="ui-slider-link crm-form-embed__link --expert-mode --visible"
							data-roll="data-more-settings"
							onclick="${expertMode.bind(this)}"
						>
							${BX.Loc.getMessage('EMBED_SLIDER_EXPERT_MODE')}
						</a>
					</div>
				` : ''}
			</div>
		`;
			if (switcher) {
				const heading = headingBox.querySelector('.ui-slider-heading-4');
				main_core.Event.bind(heading, 'click', event => {
					// event.preventDefault();
					// const switcherId = event.currentTarget
					// 	.closest('.ui-slider-heading-main')
					// 	.querySelector('.ui-switcher[data-switcher-init="y"][data-switcher-id]')
					// 	.dataset.switcherId
					// ;
					// const innerSwitcher = top.BX.UI.Switcher.getById(switcherId);
					// innerSwitcher.toggle();

					event.currentTarget.closest('.ui-slider-heading-main').querySelector('.ui-switcher[data-switcher-init="y"]').click();
				});
			}
			return headingBox;
		}

		/**
		 * @protected
		 */
		renderCodeBlock(code) {
			const section = this.renderSection();
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__customization--show-code">
				<div class="ui-icon ui-icon-service-code crm-form-embed__customization--show-code-icon"><i></i></div>
				<a class="ui-slider-link crm-form-embed__link --with-arrow" data-roll="data-show-code">${BX.Loc.getMessage('EMBED_SLIDER_SHOW_CODE')}</a>
			</div>
		`, section);
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__code" data-roll="crm-form-embed__code" style="height: 0px;">
				<pre class="crm-form-embed__code-block"><span>${main_core.Text.encode(code)}</span></pre>
			</div>
		`, section);
			const toggleBtn = section.querySelector('[data-roll="data-show-code"]');
			main_core.Event.unbind(toggleBtn, 'click', handlerToggleCodeBlock);
			main_core.Event.bind(toggleBtn, 'click', handlerToggleCodeBlock);
			return section;
		}
		updateDependentFields(container, name, value) {
			switch (name) {
				case 'type':
					const containerVertical = container.querySelector('[data-option="vertical"]');
					if (value === 'panel') {
						main_core.Dom.show(containerVertical);
					} else {
						main_core.Dom.hide(containerVertical);
					}
					break;
				case 'button.plain':
					const containerButtonStyle = container.querySelector('[data-option="buttonStyle"]');
					const containerLinkStyle = container.querySelector('[data-option="button.decoration"]');
					// const containerFont = container.querySelector('[data-option="button.font"]');
					const containerButtonPosition = container.querySelector('[data-option="button.align"]');
					const containerLinkPosition = container.querySelector('[data-option="link.align"]');
					if (value === '1') {
						main_core.Dom.hide(containerButtonStyle);
						main_core.Dom.show(containerLinkStyle);
						main_core.Dom.hide(containerButtonPosition);
						main_core.Dom.show(containerLinkPosition);

						// // Dom.hide(containerFont);
						// containerFont?.querySelectorAll('.crm-form-embed__settings-main--option').forEach((node) => {
						// 	Dom.attr(node, 'disabled', true);
						// })
					} else {
						main_core.Dom.hide(containerLinkStyle);
						main_core.Dom.show(containerButtonStyle);
						main_core.Dom.hide(containerLinkPosition);
						main_core.Dom.show(containerButtonPosition);

						// // Dom.show(containerFont);
						// containerFont?.querySelectorAll('.crm-form-embed__settings-main--option').forEach((node) => {
						// 	Dom.attr(node, 'disabled', false);
						// })
					}
					break;
			}
		}
	}

	class Inline extends Form {
		#container;
		#rendered = false;
		constructor(formId, dataProvider) {
			super(formId, dataProvider);
			this.#container = super.render();
		}
		load(force = false) {
			return super.load(force).then(() => {
				if (!this.#rendered) {
					this.render();
				}
			}).catch(error => {
				console.error(error);
				if (!this.#rendered) {
					this.#renderError();
				}
			});
		}
		render() {
			this.#container.innerHTML = '';
			const headerSection = this.renderHeaderSection('code', BX.Loc.getMessage('EMBED_SLIDER_INLINE_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_INLINE_DESC'), HELP_CENTER_ID, HELP_CENTER_URL);
			main_core.Dom.append(headerSection, this.#container);
			if (!super.loaded) {
				this.loader.show(this.#container);
			} else {
				// update with actual help-center link
				main_core.Dom.replace(headerSection, this.renderHeaderSection('code', BX.Loc.getMessage('EMBED_SLIDER_INLINE_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_INLINE_DESC'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl));
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_OPEN_IN_NEW_TAB'), this.dataProvider.data.embed.previewLink.replace('#preview#', 'inline') // this.dataProvider.data.embed.pubLink
				), this.#container);
				const code = this.dataProvider.data.embed.scripts['inline'].text;
				main_core.Dom.append(this.renderCodeBlock(code), this.#container);
				main_core.Dom.append(this.renderCopySection(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE'), BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE2'), code, this.renderBubble(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE_BUBBLE_INLINE'), true)), this.#container);
				this.#rendered = true;
			}
			return this.#container;
		}
		#renderError() {
			this.#container.innerHTML = '';
			main_core.Dom.append(super.renderError(this.dataProvider.data), this.#container);
			this.#rendered = true;
			return this.#container;
		}
	}

	function getSvg(option, value) {
		switch (option) {
			case 'position':
				switch (value) {
					case 'left':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M42.1597 39.1886C42.5214 38.7916 42.5214 38.1845 42.1598 37.7874L38.8098 34.1094L51.9669 34.1094C52.5703 34.1094 53.0595 33.6202 53.0595 33.0167C53.0595 32.4132 52.5703 31.924 51.9669 31.924L38.8098 31.924L42.1598 28.2459C42.5214 27.8489 42.5214 27.2418 42.1598 26.8448C41.7471 26.3917 41.0341 26.3917 40.6214 26.8448L35.9947 31.9245C35.431 32.5435 35.431 33.4898 35.9947 34.1088L40.6215 39.1886C41.0341 39.6416 41.7471 39.6417 42.1597 39.1886Z" />
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M9 26.0002C9 24.8957 9.89543 24.0002 11 24.0002H25C26.1046 24.0002 27 24.8957 27 26.0002V40.0002C27 41.1048 26.1046 42.0002 25 42.0002H11C9.89543 42.0002 9 41.1048 9 40.0002V26.0002ZM14 33.0002C14 32.448 14.4477 32.0002 15 32.0002H21C21.5523 32.0002 22 32.448 22 33.0002C22 33.5525 21.5523 34.0002 21 34.0002H15C14.4477 34.0002 14 33.5525 14 33.0002ZM14 28.0002C13.4477 28.0002 13 28.448 13 29.0002C13 29.5525 13.4477 30.0002 14 30.0002H22C22.5523 30.0002 23 29.5525 23 29.0002C23 28.448 22.5523 28.0002 22 28.0002H14Z"/>
							</svg>
						`;
					case 'center':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M26.4471 26.7989C26.006 27.24 26.006 27.9552 26.4471 28.3963L30.1754 32.1246H21.1297C20.5058 32.1246 20 32.6304 20 33.2543C20 33.8783 20.5058 34.384 21.1297 34.384H30.1754L26.4471 38.1124C26.006 38.5535 26.006 39.2687 26.4471 39.7098C26.8882 40.151 27.6034 40.151 28.0446 39.7098L33.1811 34.5733C33.9095 33.8449 33.9095 32.6639 33.1811 31.9355L28.0445 26.7989C27.6034 26.3578 26.8883 26.3578 26.4471 26.7989Z"/>
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M71.8799 39.6907C72.3031 39.2572 72.3031 38.5652 71.8799 38.1317L68.2216 34.3842L76.8822 34.3842C77.5061 34.3842 78.0119 33.8784 78.0119 33.2545C78.0119 32.6306 77.5061 32.1248 76.8822 32.1248L68.2216 32.1248L71.8799 28.3772C72.3031 27.9437 72.3031 27.2517 71.8799 26.8182C71.4421 26.3697 70.7208 26.3697 70.2829 26.8182L65.2375 31.9867C64.5493 32.6917 64.5493 33.8171 65.2375 34.5221L70.283 39.6907C70.7208 40.1392 71.4421 40.1392 71.8799 39.6907Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M41 26.0002C41 24.8957 41.8954 24.0002 43 24.0002H57C58.1046 24.0002 59 24.8957 59 26.0002V40.0002C59 41.1048 58.1046 42.0002 57 42.0002H43C41.8954 42.0002 41 41.1048 41 40.0002V26.0002ZM46 33.0002C46 32.448 46.4477 32.0002 47 32.0002H53C53.5523 32.0002 54 32.448 54 33.0002C54 33.5525 53.5523 34.0002 53 34.0002H47C46.4477 34.0002 46 33.5525 46 33.0002ZM46 28.0002C45.4477 28.0002 45 28.448 45 29.0002C45 29.5525 45.4477 30.0002 46 30.0002H54C54.5523 30.0002 55 29.5525 55 29.0002C55 28.448 54.5523 28.0002 54 28.0002H46Z"/>
							</svg>
						`;
					case 'right':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M59.4471 26.7989C59.006 27.24 59.006 27.9552 59.4471 28.3963L63.1754 32.1246H48.1297C47.5058 32.1246 47 32.6304 47 33.2543C47 33.8783 47.5058 34.384 48.1297 34.384H63.1754L59.4471 38.1124C59.006 38.5535 59.006 39.2687 59.4471 39.7098C59.8882 40.151 60.6034 40.151 61.0446 39.7098L66.1811 34.5733C66.9095 33.8449 66.9095 32.6639 66.1811 31.9355L61.0445 26.7989C60.6034 26.3578 59.8883 26.3578 59.4471 26.7989Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M75 26.0002C75 24.8957 75.8954 24.0002 77 24.0002H91C92.1046 24.0002 93 24.8957 93 26.0002V40.0002C93 41.1048 92.1046 42.0002 91 42.0002H77C75.8954 42.0002 75 41.1048 75 40.0002V26.0002ZM80 33.0002C80 32.448 80.4477 32.0002 81 32.0002H87C87.5523 32.0002 88 32.448 88 33.0002C88 33.5525 87.5523 34.0002 87 34.0002H81C80.4477 34.0002 80 33.5525 80 33.0002ZM80 28.0002C79.4477 28.0002 79 28.448 79 29.0002C79 29.5525 79.4477 30.0002 80 30.0002H88C88.5523 30.0002 89 29.5525 89 29.0002C89 28.448 88.5523 28.0002 88 28.0002H80Z"/>
							</svg>
						`;
				}
				break;
			case 'button.align':
				switch (value) {
					case 'left':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M42.1597 39.1883C42.5214 38.7913 42.5214 38.1842 42.1598 37.7872L38.8098 34.1091L51.9669 34.1091C52.5703 34.1091 53.0595 33.6199 53.0595 33.0164C53.0595 32.413 52.5703 31.9238 51.9669 31.9238L38.8098 31.9238L42.1598 28.2457C42.5214 27.8486 42.5214 27.2416 42.1598 26.8445C41.7471 26.3914 41.0341 26.3914 40.6214 26.8445L35.9947 31.9243C35.431 32.5432 35.431 33.4896 35.9947 34.1085L40.6215 39.1883C41.0341 39.6414 41.7471 39.6414 42.1597 39.1883Z" />
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M7 27C5.89543 27 5 27.8954 5 29V37C5 38.1046 5.89543 39 7 39H27C28.1046 39 29 38.1046 29 37V29C29 27.8954 28.1046 27 27 27H7ZM13 32C12.4477 32 12 32.4477 12 33C12 33.5523 12.4477 34 13 34H21C21.5523 34 22 33.5523 22 33C22 32.4477 21.5523 32 21 32H13Z" />
							</svg>
						`;
					case 'center':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M26.4471 26.7986C26.006 27.2397 26.006 27.9549 26.4471 28.3961L30.1754 32.1244H21.1297C20.5058 32.1244 20 32.6302 20 33.2541C20 33.878 20.5058 34.3838 21.1297 34.3838H30.1754L26.4471 38.1121C26.006 38.5532 26.006 39.2685 26.4471 39.7096C26.8882 40.1507 27.6034 40.1507 28.0446 39.7096L33.1811 34.5731C33.9095 33.8447 33.9095 32.6637 33.1811 31.9352L28.0445 26.7987C27.6034 26.3576 26.8883 26.3576 26.4471 26.7986Z"/>
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M71.8799 39.6905C72.3031 39.257 72.3031 38.565 71.8799 38.1315L68.2216 34.3839L76.8822 34.3839C77.5061 34.3839 78.0119 33.8782 78.0119 33.2542C78.0119 32.6303 77.5061 32.1245 76.8822 32.1245L68.2216 32.1245L71.8799 28.377C72.3031 27.9435 72.3031 27.2515 71.8799 26.818C71.4421 26.3694 70.7208 26.3694 70.2829 26.818L65.2375 31.9864C64.5493 32.6915 64.5493 33.8169 65.2375 34.5219L70.283 39.6904C70.7208 40.1389 71.4421 40.1389 71.8799 39.6905Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M39 27C37.8954 27 37 27.8954 37 29V37C37 38.1046 37.8954 39 39 39H59C60.1046 39 61 38.1046 61 37V29C61 27.8954 60.1046 27 59 27H39ZM45 32C44.4477 32 44 32.4477 44 33C44 33.5523 44.4477 34 45 34H53C53.5523 34 54 33.5523 54 33C54 32.4477 53.5523 32 53 32H45Z"/>
							</svg>
						`;
					case 'right':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M59.4471 26.7986C59.006 27.2397 59.006 27.9549 59.4471 28.3961L63.1754 32.1244H48.1297C47.5058 32.1244 47 32.6302 47 33.2541C47 33.878 47.5058 34.3838 48.1297 34.3838H63.1754L59.4471 38.1121C59.006 38.5532 59.006 39.2685 59.4471 39.7096C59.8882 40.1507 60.6034 40.1507 61.0446 39.7096L66.1811 34.5731C66.9095 33.8447 66.9095 32.6637 66.1811 31.9352L61.0445 26.7987C60.6034 26.3576 59.8883 26.3576 59.4471 26.7986Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M73 27C71.8954 27 71 27.8954 71 29V37C71 38.1046 71.8954 39 73 39H93C94.1046 39 95 38.1046 95 37V29C95 27.8954 94.1046 27 93 27H73ZM79 32C78.4477 32 78 32.4477 78 33C78 33.5523 78.4477 34 79 34H87C87.5523 34 88 33.5523 88 33C88 32.4477 87.5523 32 87 32H79Z"/>
							</svg>
						`;
				}
				break;
			case 'link.align':
				switch (value) {
					case 'inline':
						return `
					<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M27 27C27 25.8954 27.8954 25 29 25H45C46.1046 25 47 25.8954 47 27V39C47 40.1046 46.1046 41 45 41H29C27.8954 41 27 40.1046 27 39V27ZM35.3454 35L34.8202 33.3406H32.1798L31.6546 35H30L32.5563 28H34.4338L37 35H35.3454ZM34.4536 32.1008C33.9682 30.5972 33.694 29.7468 33.6313 29.5497C33.5718 29.3526 33.5289 29.1969 33.5025 29.0824C33.3935 29.4893 33.0814 30.4955 32.5662 32.1008H34.4536ZM30.75 37C30.3358 37 30 37.3358 30 37.75C30 38.1642 30.3358 38.5 30.75 38.5H43.25C43.6642 38.5 44 38.1642 44 37.75C44 37.3358 43.6642 37 43.25 37H30.75Z"/>
						<path class="crm-form-embed__settings--svg-block" d="M56.5684 36.9998H55.168V29.6345H52.6484V28.4333H59.0879V29.6345H56.5684V36.9998ZM63.0898 37.1169C62.082 37.1169 61.293 36.824 60.7227 36.238C60.1562 35.6482 59.873 34.8376 59.873 33.8064C59.873 32.7478 60.1367 31.9158 60.6641 31.3103C61.1914 30.7048 61.916 30.4021 62.8379 30.4021C63.6934 30.4021 64.3691 30.6619 64.8652 31.1814C65.3613 31.7009 65.6094 32.4158 65.6094 33.3259V34.0701H61.291C61.3105 34.699 61.4805 35.1833 61.8008 35.5232C62.1211 35.8591 62.5723 36.0271 63.1543 36.0271C63.5371 36.0271 63.8926 35.9919 64.2207 35.9216C64.5527 35.8474 64.9082 35.7263 65.2871 35.5583V36.6775C64.9512 36.8376 64.6113 36.9509 64.2676 37.0173C63.9238 37.0837 63.5312 37.1169 63.0898 37.1169ZM62.8379 31.4451C62.4004 31.4451 62.0488 31.5837 61.7832 31.8611C61.5215 32.1384 61.3652 32.5427 61.3145 33.074H64.2559C64.248 32.5388 64.1191 32.1345 63.8691 31.8611C63.6191 31.5837 63.2754 31.4451 62.8379 31.4451ZM68.6152 33.6892L66.4414 30.5193H68.0117L69.4883 32.7869L70.9766 30.5193H72.5352L70.3555 33.6892L72.6465 36.9998H71.0879L69.4883 34.574L67.8945 36.9998H66.3359L68.6152 33.6892ZM76.1973 36.0037C76.5332 36.0037 76.8691 35.9509 77.2051 35.8455V36.8826C77.0527 36.949 76.8555 37.0037 76.6133 37.0466C76.375 37.0935 76.127 37.1169 75.8691 37.1169C74.5645 37.1169 73.9121 36.4294 73.9121 35.0544V31.5623H73.0273V30.9529L73.9766 30.449L74.4453 29.0779H75.2949V30.5193H77.1406V31.5623H75.2949V35.031C75.2949 35.363 75.377 35.6091 75.541 35.7693C75.709 35.9255 75.9277 36.0037 76.1973 36.0037Z"/>
					</svg>
					`;
					case 'left':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M42.1598 39.1883C42.5214 38.7913 42.5214 38.1842 42.1598 37.7872L38.8098 34.1091L51.9669 34.1091C52.5704 34.1091 53.0596 33.6199 53.0596 33.0164V33.0164C53.0596 32.413 52.5704 31.9238 51.9669 31.9238L38.8098 31.9238L42.1598 28.2457C42.5214 27.8486 42.5214 27.2416 42.1598 26.8445V26.8445C41.7471 26.3914 41.0341 26.3914 40.6214 26.8445L35.9948 31.9242C35.431 32.5432 35.431 33.4895 35.9948 34.1085L40.6215 39.1883C41.0342 39.6414 41.7471 39.6414 42.1598 39.1883V39.1883Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M8 27C8 25.8954 8.89543 25 10 25H26C27.1046 25 28 25.8954 28 27V39C28 40.1046 27.1046 41 26 41H10C8.89543 41 8 40.1046 8 39V27ZM16.3454 35L15.8202 33.3406H13.1798L12.6546 35H11L13.5563 28H15.4338L18 35H16.3454ZM15.4536 32.1008C14.9682 30.5972 14.694 29.7468 14.6313 29.5497C14.5718 29.3526 14.5289 29.1969 14.5025 29.0824C14.3935 29.4893 14.0814 30.4955 13.5662 32.1008H15.4536ZM11.75 37C11.3358 37 11 37.3358 11 37.75C11 38.1642 11.3358 38.5 11.75 38.5H24.25C24.6642 38.5 25 38.1642 25 37.75C25 37.3358 24.6642 37 24.25 37H11.75Z"/>
							</svg>
						`;
					case 'center':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M26.4471 26.7986C26.006 27.2397 26.006 27.9549 26.4471 28.3961L30.1754 32.1244H21.1297C20.5058 32.1244 20 32.6302 20 33.2541V33.2541C20 33.878 20.5058 34.3838 21.1297 34.3838H30.1754L26.4471 38.1121C26.006 38.5532 26.006 39.2685 26.4471 39.7096V39.7096C26.8882 40.1507 27.6034 40.1507 28.0446 39.7096L33.1811 34.5731C33.9095 33.8447 33.9095 32.6636 33.1811 31.9352L28.0445 26.7987C27.6034 26.3576 26.8883 26.3576 26.4471 26.7986V26.7986Z"/>
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M71.88 39.6904C72.3032 39.257 72.3032 38.565 71.88 38.1315L68.2217 34.3839L76.8823 34.3839C77.5062 34.3839 78.012 33.8781 78.012 33.2542V33.2542C78.012 32.6303 77.5062 32.1245 76.8823 32.1245L68.2217 32.1245L71.88 28.377C72.3032 27.9434 72.3032 27.2515 71.88 26.818V26.818C71.4421 26.3694 70.7208 26.3694 70.283 26.818L65.2376 31.9864C64.5493 32.6915 64.5493 33.8169 65.2376 34.5219L70.2831 39.6904C70.7209 40.1389 71.4421 40.1389 71.88 39.6904V39.6904Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M40 27C40 25.8954 40.8954 25 42 25H58C59.1046 25 60 25.8954 60 27V39C60 40.1046 59.1046 41 58 41H42C40.8954 41 40 40.1046 40 39V27ZM48.3454 35L47.8202 33.3406H45.1798L44.6546 35H43L45.5563 28H47.4338L50 35H48.3454ZM47.4536 32.1008C46.9682 30.5972 46.694 29.7468 46.6313 29.5497C46.5718 29.3526 46.5289 29.1969 46.5025 29.0824C46.3935 29.4893 46.0814 30.4955 45.5662 32.1008H47.4536ZM43.75 37C43.3358 37 43 37.3358 43 37.75C43 38.1642 43.3358 38.5 43.75 38.5H56.25C56.6642 38.5 57 38.1642 57 37.75C57 37.3358 56.6642 37 56.25 37H43.75Z"/>
							</svg>
						`;
					case 'right':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M59.4471 26.7986C59.006 27.2397 59.006 27.9549 59.4471 28.3961L63.1754 32.1244H48.1297C47.5058 32.1244 47 32.6302 47 33.2541V33.2541C47 33.878 47.5058 34.3838 48.1297 34.3838H63.1754L59.4471 38.1121C59.006 38.5532 59.006 39.2685 59.4471 39.7096V39.7096C59.8882 40.1507 60.6034 40.1507 61.0446 39.7096L66.1811 34.5731C66.9095 33.8447 66.9095 32.6636 66.1811 31.9352L61.0445 26.7987C60.6034 26.3576 59.8883 26.3576 59.4471 26.7986V26.7986Z"/>
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M74 27C74 25.8954 74.8954 25 76 25H92C93.1046 25 94 25.8954 94 27V39C94 40.1046 93.1046 41 92 41H76C74.8954 41 74 40.1046 74 39V27ZM82.3454 35L81.8202 33.3406H79.1798L78.6546 35H77L79.5563 28H81.4338L84 35H82.3454ZM81.4536 32.1008C80.9682 30.5972 80.694 29.7468 80.6313 29.5497C80.5718 29.3526 80.5289 29.1969 80.5025 29.0824C80.3935 29.4893 80.0814 30.4955 79.5662 32.1008H81.4536ZM77.75 37C77.3358 37 77 37.3358 77 37.75C77 38.1642 77.3358 38.5 77.75 38.5H90.25C90.6642 38.5 91 38.1642 91 37.75C91 37.3358 90.6642 37 90.25 37H77.75Z"/>
							</svg>
						`;
				}
				break;
			case 'vertical':
				switch (value) {
					case 'bottom':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M66 60.0002C66 61.1048 65.1046 62.0002 64 62.0002L36 62.0002C34.8954 62.0002 34 61.1048 34 60.0002L34 50.0002C34 48.3434 35.3431 47.0002 37 47.0002L63 47.0002C64.6569 47.0002 66 48.3434 66 50.0002L66 60.0002ZM63 58.0002C63 58.5525 62.5523 59.0002 62 59.0002L38 59.0002C37.4477 59.0002 37 58.5525 37 58.0002C37 57.448 37.4477 57.0002 38 57.0002L62 57.0002C62.5523 57.0002 63 57.448 63 58.0002ZM58 55.0002C58.5523 55.0002 59 54.5525 59 54.0002C59 53.448 58.5523 53.0002 58 53.0002L42 53.0002C41.4477 53.0002 41 53.448 41 54.0002C41 54.5525 41.4477 55.0002 42 55.0002L58 55.0002Z"/>
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M43.7986 29.0531C44.2397 29.4942 44.9549 29.4943 45.3961 29.0531L49.1244 25.3248L49.1244 40.3705C49.1244 40.9945 49.6302 41.5002 50.2541 41.5002C50.878 41.5002 51.3838 40.9945 51.3838 40.3705L51.3838 25.3248L55.1121 29.0531C55.5532 29.4943 56.2685 29.4943 56.7096 29.0531C57.1507 28.612 57.1507 27.8968 56.7096 27.4557L51.5731 22.3192C50.8447 21.5907 49.6636 21.5908 48.9352 22.3192L43.7987 27.4557C43.3576 27.8968 43.3576 28.612 43.7986 29.0531Z"/>
							</svg>
						`;
					case 'top':
						return `
							<svg width="100" height="66" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path class="crm-form-embed__settings--svg-block" fill-rule="evenodd" clip-rule="evenodd" d="M34 6.00024C34 4.89567 34.8954 4.00024 36 4.00024L64 4.00024C65.1046 4.00024 66 4.89567 66 6.00024L66 16.0002C66 17.6571 64.6569 19.0002 63 19.0002L37 19.0002C35.3431 19.0002 34 17.6571 34 16.0002L34 6.00024ZM63 8.00024C63 8.55253 62.5523 9.00024 62 9.00024L38 9.00024C37.4477 9.00024 37 8.55253 37 8.00024C37 7.44796 37.4477 7.00024 38 7.00024L62 7.00025C62.5523 7.00025 63 7.44796 63 8.00024ZM58 13.0002C58.5523 13.0002 59 12.5525 59 12.0002C59 11.448 58.5523 11.0002 58 11.0002L42 11.0002C41.4477 11.0002 41 11.448 41 12.0002C41 12.5525 41.4477 13.0002 42 13.0002L58 13.0002Z"/>
								<path class="crm-form-embed__settings--svg-arrow" fill-rule="evenodd" clip-rule="evenodd" d="M56.7097 37.4474C56.2686 37.0062 55.5534 37.0062 55.1122 37.4474L51.3839 41.1757L51.3839 26.1299C51.3839 25.506 50.8781 25.0002 50.2542 25.0002C49.6303 25.0002 49.1245 25.506 49.1245 26.1299L49.1245 41.1757L45.3962 37.4474C44.9551 37.0062 44.2398 37.0062 43.7987 37.4474C43.3576 37.8885 43.3576 38.6037 43.7987 39.0448L48.9352 44.1813C49.6636 44.9097 50.8446 44.9097 51.5731 44.1813L56.7096 39.0448C57.1507 38.6037 57.1507 37.8885 56.7097 37.4474Z"/>
							</svg>
						`;
				}
				break;
		}
	}

	function isHexDark(hex) {
		return Color.isHexDark(hex);
	}
	function hexToRgba(hex) {
		return Color.hexToRgba(hex);
	}
	function getHexFromOpacity(opacity) {
		if (main_core.Type.isString(opacity) && opacity.includes('%')) {
			opacity = Number.parseInt(opacity) / 100;
		}
		const hex = Math.round(opacity * 255).toString(16);
		return hex.length === 1 ? '0' + hex : hex;
	}
	function openFeedbackForm() {
		BX.UI.Feedback.Form.open({
			id: 'crm.webform.embed.feedback',
			forms: [{
				zones: ['en', 'eu', 'in', 'uk'],
				id: 372,
				lang: 'en',
				sec: 'qxzl3o'
			}, {
				zones: ['by'],
				id: 362,
				lang: 'by',
				sec: 'gha9ge'
			}, {
				zones: ['kz'],
				id: 362,
				lang: 'kz',
				sec: 'gha9ge'
			}, {
				zones: ['ru'],
				id: 362,
				lang: 'ru',
				sec: 'gha9ge'
			}, {
				zones: ['com.br'],
				id: 364,
				lang: 'br',
				sec: 'g649rj'
			}, {
				zones: ['la', 'co', 'mx'],
				id: 366,
				lang: 'es',
				sec: 's80g9o'
			}, {
				zones: ['de'],
				id: 368,
				lang: 'de',
				sec: 'bcmkrl'
			}, {
				zones: ['ua'],
				id: 370,
				lang: 'ua',
				sec: 'ue05ne'
			}
			// {zones: ['pl'], id: 994, lang: 'pl', sec: 'qtxmku'},
			]
		});
	}

	// copy from crm.site.form
	const Color = {
		parseHex(hex) {
			hex = this.fillHex(hex);
			let parts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
			if (!parts) {
				parts = [0, 0, 0, 1];
			} else {
				parts = [parseInt(parts[1], 16), parseInt(parts[2], 16), parseInt(parts[3], 16), parseInt(100 * (parseInt(parts[4] || 'ff', 16) / 255)) / 100];
			}
			return parts;
		},
		hexToRgba(hex) {
			return 'rgba(' + this.parseHex(hex).join(', ') + ')';
		},
		toRgba(numbers) {
			return 'rgba(' + numbers.join(', ') + ')';
		},
		fillHex(hex, fillAlpha = false, alpha = null) {
			if (hex.length === 4 || fillAlpha && hex.length === 5) {
				hex = hex.replace(/([a-f0-9])/gi, "$1$1");
			}
			if (fillAlpha && hex.length === 7) {
				hex += 'ff';
			}
			if (alpha) {
				hex = hex.substr(0, 7) + (alpha.toLowerCase() + 'ff').substr(0, 2);
			}
			return hex;
		},
		isHexDark(hex) {
			hex = this.parseHex(hex);
			const r = hex[0];
			const g = hex[1];
			const b = hex[2];
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			return brightness < 155;
		}
	};

	const loader = new BX.Loader({
		mode: 'inline'
	});
	class Controls {
		static renderDropdown(options) {
			const handler = event => {
				main_core.Dom.attr(event.currentTarget, 'disabled', true);
				loader.setOptions({
					size: 40
				});
				loader.show(options.node.querySelector('.ui-ctl-after.ui-ctl-icon-angle'));
				options.callback(event.currentTarget.value);
			};
			main_core.Dom.append(this.renderLabel(options.keyName), options.node);
			const select = main_core.Tag.render`<select class="ui-ctl-element embed-control-node" onchange="${main_core.Text.encode(handler)}"></select>`;
			Object.entries(options.options).forEach(([option, name]) => {
				main_core.Dom.append(main_core.Tag.render`
					<option
						value="${main_core.Text.encode(option)}"
						${!main_core.Type.isUndefined(options.value) && options.value.toString() === option.toString() ? 'selected' : ''}
					>
						${main_core.Text.encode(name)}
					</option>
				`, select);
			});
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				${select}
			</div>
		`, options.node);
		}
		static renderText(options, advanced) {
			const handler = event => {
				main_core.Dom.attr(event.currentTarget, 'disabled', true);
				loader.setOptions({
					size: 40
				});
				loader.show(options.node.querySelector('.ui-ctl-after'));
				options.callback(event.currentTarget.value);
			};
			const handlerShowSaveBtn = event => {
				main_core.Dom.show(options.node.querySelector('.ui-ctl-after'));
			};
			const afterIcon = advanced ? '' : '<button class="ui-ctl-after" hidden><svg width="20" height="15" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg"><path fill="#535C69" d="M7.34223 14.351L0.865356 8.03879L3.13226 5.82951L7.34223 9.93246L16.8678 0.648987L19.1348 2.85827L7.34223 14.351Z"/></svg></button>';
			main_core.Dom.append(this.renderLabel(options.keyName), options.node);
			const input = main_core.Tag.render`
			<input
				type="text"
				class="ui-ctl-element"
				value="${!main_core.Type.isUndefined(options.value) ? main_core.Text.encode(options.value) : ''}"
				data-onfocus="${main_core.Text.encode(handlerShowSaveBtn)}"
				data-onblur="${main_core.Text.encode(handler)}"
			>
		`;
			main_core.Event.bindOnce(input, 'blur', handler);
			if (!advanced) {
				main_core.Event.bindOnce(input, 'focus', handlerShowSaveBtn);
			}
			main_core.Dom.append(main_core.Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon">
				${afterIcon}
				${input}
			</div>
		`, options.node);
		}
		static renderTypeface(forValue, extended, options) {
			const handler = event => {
				if (event.currentTarget.getAttribute('disabled') === 'true') {
					return;
				}
				const nodeList = event.currentTarget.closest('.crm-form-embed__settings').querySelectorAll('.crm-form-embed__settings--hide-button');
				nodeList.forEach(node => {
					// node.disabled = true;
					main_core.Dom.attr(node, 'disabled', true);
				});
				if (!extended) {
					animateSwitching(event.currentTarget.closest('.crm-form-embed__settings--option.--typeface'), 0, 0, true);
				}
				options.callback(forValue);
			};
			const className = extended ? 'crm-form-embed__settings-main--option --option-big' : 'crm-form-embed__settings--option --typeface';
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__settings--hide-button ${className} ${forValue === options.value ? '--active' : ''}" onclick="${main_core.Text.encode(handler)}">
				<span class="crm-form-embed__settings--option-font --${main_core.Text.encode(forValue)}">${main_core.Text.encode(options.keyName)}</span>
			</div>
		`, options.node);
		}
		static renderSquareButton(forValue, options) {
			const handler = event => {
				if (event.currentTarget.getAttribute('disabled') === 'true') {
					return;
				}
				const nodeList = event.currentTarget.closest('.crm-form-embed__settings').querySelectorAll('.crm-form-embed__settings--option-layout');
				nodeList.forEach(node => {
					// node.disabled = true;
					main_core.Dom.attr(node, 'disabled', true);
				});
				animateSwitching(event.currentTarget.closest('.crm-form-embed__settings--option-layout').querySelector('.crm-form-embed__settings-main--option-svg'), 100, 66, false);
				options.callback(forValue);
			};
			main_core.Dom.append(main_core.Tag.render`
			<div class="crm-form-embed__settings--option-layout ${forValue === options.value ? '--active' : ''}" onclick="${main_core.Text.encode(handler)}">
				<div class="crm-form-embed__settings-main--option-svg">
					${getSvg(options.key, forValue)}
				</div>
				<span class="crm-form-embed__settings--option-layout-text">${main_core.Text.encode(options.keyName)}</span>
			</div>
		`, options.node);
		}
		static renderButton(forValue, type, advanced, options) {
			const handler = event => {
				if (event.currentTarget.getAttribute('disabled') === 'true') {
					return;
				}
				const nodeList = event.currentTarget.closest('.crm-form-embed__settings').querySelectorAll('.crm-form-embed__settings--hide-button');
				nodeList.forEach(node => {
					// node.disabled = true;
					main_core.Dom.attr(node, 'disabled', true);
				});
				if (!advanced) {
					animateSwitching(event.currentTarget.closest('.crm-form-embed__settings--option'), 0, 0, true);
				}
				options.callback(forValue);
			};
			const className = advanced ? 'crm-form-embed__settings-main--option --option-big' : 'crm-form-embed__settings--option';
			main_core.Dom.append(main_core.Tag.render`
			<div
				class="crm-form-embed__settings--hide-button ${className} ${forValue === options.value ? '--active' : ''}"
				onclick="${main_core.Text.encode(handler)}"
				data-embed-key="${main_core.Text.encode(options.key)}"
				data-embed-value="${main_core.Text.encode(forValue)}"
				title="${main_core.Text.encode(BX.Loc.getMessage('EMBED_SLIDER_OPTION_BUTTONSTYLE_LABEL'))}"
			>
				<button class="ui-btn ui-btn-md ${main_core.Text.encode(type)}">${main_core.Text.encode(BX.Loc.getMessage('EMBED_SLIDER_OPTION_BUTTONSTYLE_LABEL'))}</button>
			</div>
		`, options.node);
		}
		static renderLink(forValue, type, advanced, options) {
			const handler = event => {
				if (event.currentTarget.getAttribute('disabled') === 'true') {
					return;
				}
				const nodeList = event.currentTarget.closest('.crm-form-embed__settings').querySelectorAll('.crm-form-embed__settings--hide-link');
				nodeList.forEach(node => {
					// node.disabled = true;
					main_core.Dom.attr(node, 'disabled', true);
				});
				if (!advanced) {
					animateSwitching(event.currentTarget.closest('.crm-form-embed__settings--option'), 0, 0, true);
				}
				options.callback(forValue);
			};
			const className = advanced ? 'crm-form-embed__settings-main--option --option-big' : 'crm-form-embed__settings--option';
			main_core.Dom.append(main_core.Tag.render`
			<div
				class="crm-form-embed__settings--hide-link ${className} ${forValue === options.value ? '--active' : ''}"
				onclick="${main_core.Text.encode(handler)}"
				data-embed-key="${main_core.Text.encode(options.key)}"
				data-embed-value="${main_core.Text.encode(forValue)}"
			>
				<a href ="#" class="crm-form-embed__option-link ${main_core.Text.encode(type)}">${main_core.Text.encode(BX.Loc.getMessage('EMBED_SLIDER_OPTION_LINKSTYLE_LABEL'))}</a>
			</div>
		`, options.node);
		}
		static renderSwitcher(options) {
			/**
			 * @this Switcher
			 */
			const handler = function (event) {
				this.setLoading(true);
				options.callback(this.isChecked() ? '1' : '0').then(() => {
					this.setLoading(false);
				});
			};
			const switcherNode = document.createElement('span');
			const switcherId = options.formId + '-' + options.key;
			switcherNode.className = 'ui-switcher';
			switcherNode.dataset.switcherId = switcherId;
			const switcher = new top.BX.UI.Switcher({
				id: switcherId,
				node: switcherNode,
				checked: options.value === '1',
				handlers: {
					toggled: handler
				}
			});
			main_core.Dom.append(switcher.getNode(), options.node);
		}
		static renderColorPicker(subtype, options) {
			/**
			 * @this ColorField
			 */
			const handler = function (event) {
				if (this instanceof landing_ui_field_color.ColorField)
					// double events with different context
					{
						/** @var IColorValue|ColorValue value */
						const value = this.getValue();
						const hexA = value.getHex() + getHexFromOpacity(value.getOpacity());
						options.callback(hexA);
					}
			};
			const colorPicker = createColorPicker(subtype, handler, handler);
			colorPicker.setValue({
				'--color': hexToRgba(options.value)
			});
			// colorPicker.processor.setValue(options.value.substring(0,6));
			// colorPicker.processor.setOpacity(getOpacityFromHex(options.value.substring(6)));
			main_core.Dom.append(colorPicker.getLayout(), options.node);
		}
		static renderOptionTitle(text) {
			return main_core.Tag.render`
			<div class="crm-form-embed__settings--option-title">${text ? main_core.Text.encode(text) : ''}</div>
		`;
		}
		static renderLabel(text, buttonSetting = false) {
			return main_core.Tag.render`
			<div class="crm-form-embed__label-text ${buttonSetting ? '--button-setting' : ''}">${text ? main_core.Text.encode(text) : ''}</div>
		`;
		}
	}
	function createColorPicker(subtype, onChange, onReset) {
		return new landing_ui_field_color.ColorField({
			subtype: subtype,
			onChange: onChange,
			onReset: onReset
		});
	}
	function animateSwitching(loaderTarget, targetWidth, targetHeight, resetPadding) {
		loaderTarget.innerHTML = '';
		if (targetWidth) {
			main_core.Dom.style(loaderTarget, 'width', targetWidth + 'px');
		}
		if (targetHeight) {
			main_core.Dom.style(loaderTarget, 'height', targetHeight + 'px');
		}
		if (resetPadding) {
			main_core.Dom.style(loaderTarget, 'padding', '0');
		}
		loader.setOptions({
			size: 40
		});
		loader.show(loaderTarget);
	}

	function handlerToggleClickMode(container, checked) {
		const section = container.closest('.ui-slider-section');
		const headerBlock = section.querySelector('[data-roll="heading-block"]');
		const moreSettingsBtn = section.querySelector('[data-roll="data-more-settings"]');
		const blockCode = section.querySelector('[data-roll="crm-form-embed__settings"]');
		if (checked) {
			if (moreSettingsBtn) {
				main_core.Dom.addClass(moreSettingsBtn, "--visible");
			}
			main_core.Dom.removeClass(headerBlock, "--collapse");
			main_core.Dom.style(blockCode, 'height', blockCode.scrollHeight + "px");
		} else {
			if (moreSettingsBtn) {
				main_core.Dom.removeClass(moreSettingsBtn, "--visible");
			}
			main_core.Dom.addClass(headerBlock, "--collapse");
			main_core.Dom.style(blockCode, 'height', blockCode.scrollHeight + "px");
			// blockCode.clientHeight;
			main_core.Dom.style(blockCode, 'height', "0");
		}
		main_core.Event.unbind(blockCode, "transitionend", transitionHandlerForSettingsSection);
		main_core.Event.bind(blockCode, "transitionend", transitionHandlerForSettingsSection);
	}
	function transitionHandlerForSettingsSection(event) {
		const section = event.currentTarget.closest('.ui-slider-section');
		const blockCode = section.querySelector('[data-roll="crm-form-embed__settings"]');
		if (main_core.Dom.style(blockCode, 'height') !== "0px") {
			main_core.Dom.style(blockCode, 'height', 'auto');
		}
	}

	class Wizard extends main_core_events.EventEmitter {
		#type;
		#options;
		#values;
		#dict;
		#formId;
		constructor(type, formId, values, options, dict) {
			super();
			this.setEventNamespace("BX:Crm:Form:Embed");
			this.#type = type;
			this.#options = options;
			this.#values = values;
			this.#dict = dict;
			this.#formId = formId;
		}
		getValues() {
			return this.#values;
		}
		#updateValues(data, instantSave) {
			const promises = [];
			data.forEach(field => {
				promises.push(this.#updateValue(field.name, field.value));
			});
			return Promise.all(promises).then(() => {
				if (instantSave) {
					const event = new main_core_events.BaseEvent({
						data: {
							type: this.#type
						}
					});
					return this.emitAsync('BX:Crm:Form:Embed:needToSave', event);
				}
				return Promise.resolve;
			});
		}
		#updateValue(name, value) {
			const aNames = name.split('.');
			const updatedValues = this.#values;
			const buildOption = function (values, names) {
				const nextName = names.shift();
				if (names.length > 0) {
					values[nextName] = main_core.Type.isUndefined(values[nextName]) ? {} : values[nextName];
					buildOption(values[nextName], names);
				} else {
					values[nextName] = value;
				}
			};
			buildOption(updatedValues, aNames);
			this.#values = updatedValues;
			const event = new main_core_events.BaseEvent({
				data: {
					type: this.#type,
					name: name,
					value: value
				}
			});
			this.emit('BX:Crm:Form:Embed:valueChanged', event);
			return Promise.resolve();
		}
		renderControlContainer(elem = null) {
			if (main_core.Type.isDomNode(elem)) {
				elem = [elem];
			}
			const container = main_core.Tag.render`
			<div class="crm-form-embed__settings"></div>
		`;
			if (main_core.Type.isArray(elem)) {
				elem.forEach(item => main_core.Dom.append(item, container));
			}
			return container;
		}
		renderRow(elem = null, last = false) {
			if (main_core.Type.isDomNode(elem)) {
				elem = [elem];
			}
			const row = main_core.Tag.render`
			<div class="crm-form-embed__settings-row ${last ? '--last' : ''}"></div>
		`;
			if (main_core.Type.isArray(elem)) {
				elem.forEach(item => main_core.Dom.append(item, row));
			}
			return row;
		}
		renderBlock(elem = null) {
			if (main_core.Type.isDomNode(elem)) {
				elem = [elem];
			}
			const block = main_core.Tag.render`
			<div class="crm-form-embed__settings--block"></div>
		`;
			if (main_core.Type.isArray(elem)) {
				elem.forEach(item => main_core.Dom.append(item, block));
			}
			return block;
		}
		renderCol(elem = null, first = false) {
			if (main_core.Type.isDomNode(elem)) {
				elem = [elem];
			}
			const col = main_core.Tag.render`
			<div class="crm-form-embed__settings--block-col ${first ? '--first' : ''}"></div>
		`;
			if (main_core.Type.isArray(elem)) {
				elem.forEach(item => main_core.Dom.append(item, col));
			}
			return col;
		}
		renderTitle(text, line = false) {
			return main_core.Tag.render`
			<div class="crm-form-embed__subtitle ${line ? '--line' : ''}">${text ? text : ''}</div>
		`;
		}
		renderLabel(text, buttonSetting = false) {
			return Renderer.renderLabel(text, buttonSetting);
		}
		renderOptionTo(container, name, instantSave = true) {
			const funcName = this.#getFuncName(name),
				fieldOptions = this.#getOptions(name),
				fieldValue = this.#getValue(name);
			if (main_core.Type.isFunction(Renderer["renderField" + funcName])) {
				Renderer["renderField" + funcName](container, fieldValue, {
					options: fieldOptions,
					dict: this.#dict,
					callback: data => this.#updateValues(data, instantSave),
					formId: this.#formId,
					data: this.#options,
					values: this.#values
				});
			} else {
				console.error('embed: ' + name + ' is not valid type');
			}
		}
		renderOption(name, instantSave = true) {
			const container = this.renderControlContainer();
			this.renderOptionTo(container, name, instantSave);
			return container;
		}
		renderColorInline(container, name, instantSave = true) {
			this.renderOptionTo(container, name, instantSave);
		}
		renderColorPopup(container, name, instantSave = true) {
			const value = this.#getValue(name, '#FFFFFF');
			const picker = this.renderOption(name, instantSave);
			const popup = new BX.PopupWindow({
				content: picker,
				bindElement: container,
				autoHide: true,
				closeByEsc: true
			});

			// hack: hide color picker elements, embed.css
			main_core.Dom.addClass(picker, 'crm-form-embed__color_popup');
			const getStyle = function (valueHex) {
				const fgColor = isHexDark(valueHex) ? 'white' : 'black';
				return `background-color: ${main_core.Text.encode(valueHex)}; color: ${fgColor}`;
			};
			const getThemeClass = function (valueHex) {
				return isHexDark(valueHex) ? 'bitrix24-light-theme' : 'bitrix24-dark-theme';
			};
			const button = main_core.Tag.render`
			<button class="ui-btn ui-btn-xs ui-btn-link ui-btn-hover ui-btn-icon-edit ui-btn-themes"></button>
		`;
			main_core.Event.bind(button, "click", event => popup.show());
			const text = main_core.Tag.render`
			<span class="crm-form-embed__settings--color-text">${main_core.Text.encode(value)}</span>
		`;
			main_core.Dom.append(Controls.renderLabel(Renderer.getOptionKeyName(name), true), container);
			const colorBox = main_core.Tag.render`
			<div class="crm-form-embed__settings--color ${getThemeClass(value)}" style="${getStyle(value)}">
				${text}
				${button}
			</div>
		`;
			main_core.Dom.append(colorBox, container);
			this.subscribe('BX:Crm:Form:Embed:valueChanged', event => {
				if (event.data.name === name) {
					text.innerText = main_core.Text.encode(event.data.value);
					colorBox.style = getStyle(event.data.value);
					main_core.Dom.removeClass(colorBox, getThemeClass(event.data.value) === 'bitrix24-dark-theme' ? 'bitrix24-light-theme' : 'bitrix24-dark-theme');
					main_core.Dom.addClass(colorBox, getThemeClass(event.data.value));
				}
			});
		}
		#getValue(name, defaultValue = '') {
			const aName = name.split('.');
			let fieldValue = this.#values;
			aName.forEach(part => {
				fieldValue = !main_core.Type.isUndefined(fieldValue[part]) ? fieldValue[part] : defaultValue;
			});
			return fieldValue;
		}
		#getOptions(name) {
			const aName = name.split('.');
			let fieldOptions = this.#options;
			aName.forEach(part => {
				fieldOptions = !main_core.Type.isUndefined(fieldOptions[part]) ? fieldOptions[part] : [];
			});
			return fieldOptions;
		}
		#getFuncName(name) {
			const aName = name.split('.');
			let funcName = '';
			aName.forEach(part => {
				funcName = funcName.concat(part.charAt(0).toUpperCase() + part.slice(1));
			});
			return funcName;
		}
	}
	const Renderer = {
		renderFieldDelay: function (container, value, options) {
			container.innerHTML = '';
			const handler = val => {
				options.callback([{
					name: 'delay',
					value: val
				}]).then(() => {
					Renderer.renderFieldDelay(container, val, options);
				});
			};
			const block = main_core.Tag.render`<div class="crm-form-embed__settings--block-input"></div>`;
			Controls.renderDropdown({
				callback: handler,
				node: block,
				options: this.getOptions(options.options, 'delay', options.dict),
				value: value,
				key: 'delay',
				keyName: Renderer.getOptionKeyName('delay'),
				formId: options.formId
			});
			main_core.Dom.append(block, container);
		},
		renderFieldType: function (container, value, options) {
			container.innerHTML = '';
			const handler = val => {
				options.callback([{
					name: 'type',
					value: val
				}]).then(() => {
					Renderer.renderFieldType(container, val, options);
				});
			};
			const block = main_core.Tag.render`<div class="crm-form-embed__settings--block-input"></div>`;
			Controls.renderDropdown({
				callback: handler,
				node: block,
				options: this.getOptions(options.options, 'type', options.dict),
				value: value,
				key: 'type',
				keyName: Renderer.getOptionKeyName('type'),
				formId: options.formId
			});
			main_core.Dom.append(block, container);
		},
		renderFieldPosition: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'position', options.dict);
			const handler = val => {
				options.callback([{
					name: 'position',
					value: val
				}]).then(() => {
					Renderer.renderFieldPosition(container, val, options);
				});
			};
			const handlerLeft = () => handler('left');
			const handlerCenter = () => handler('center');
			const handlerRight = () => handler('right');
			main_core.Dom.append(Controls.renderOptionTitle(Renderer.getOptionKeyName('position')), container);
			const row = main_core.Tag.render`<div class="crm-form-embed__settings"></div>`;
			Controls.renderSquareButton('left', {
				callback: handlerLeft,
				node: row,
				options: controlOptions,
				value: value,
				key: 'position',
				keyName: Renderer.getOptionValueName('position', 'left', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('center', {
				callback: handlerCenter,
				node: row,
				options: controlOptions,
				value: value,
				key: 'position',
				keyName: Renderer.getOptionValueName('position', 'center', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('right', {
				callback: handlerRight,
				node: row,
				options: controlOptions,
				value: value,
				key: 'position',
				keyName: Renderer.getOptionValueName('position', 'right', options.dict),
				formId: options.formId
			});
			main_core.Dom.append(row, container);
		},
		renderFieldVertical: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'vertical', options.dict);
			const handler = val => {
				options.callback([{
					name: 'vertical',
					value: val
				}]).then(() => {
					Renderer.renderFieldVertical(container, val, options);
				});
			};
			const handlerBottom = () => handler('bottom');
			const handlerTop = () => handler('top');
			main_core.Dom.append(Controls.renderOptionTitle(Renderer.getOptionKeyName('vertical')), container);
			const row = main_core.Tag.render`<div class="crm-form-embed__settings"></div>`;
			Controls.renderSquareButton('bottom', {
				callback: handlerBottom,
				node: row,
				options: controlOptions,
				value: value,
				key: 'vertical',
				keyName: Renderer.getOptionValueName('vertical', 'bottom', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('top', {
				callback: handlerTop,
				node: row,
				options: controlOptions,
				value: value,
				key: 'vertical',
				keyName: Renderer.getOptionValueName('vertical', 'top', options.dict),
				formId: options.formId
			});
			main_core.Dom.append(row, container);
		},
		renderFieldButtonStyle: function (container, value, options) {
			if (main_core.Type.isStringFilled(options?.values?.button?.rounded) && main_core.Type.isStringFilled(options?.values?.button?.outlined)) {
				value = options.values.button.rounded + ':' + options.values.button.outlined;
			}
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'buttonStyle', options.dict);
			const handler = val => {
				const values = val.split(':');
				options.callback([{
					name: 'button.rounded',
					value: values[0]
				}, {
					name: 'button.outlined',
					value: values[1]
				}]).then(() => {
					Renderer.renderFieldButtonStyle(container, val, options);
				});
			};
			const handlerPm = () => handler('0:0');
			const handlerPmr = () => handler('1:0');
			const handlerLb = () => handler('0:1');
			const handlerLbr = () => handler('1:1');
			const advanced = container.dataset.controlMode === 'advanced';
			Controls.renderButton('0:0', 'ui-btn-primary', advanced, {
				callback: handlerPm,
				node: container,
				options: controlOptions,
				value: value,
				key: 'buttonStyle',
				keyName: Renderer.getOptionValueName('buttonStyle', '0:0', options.dict),
				formId: options.formId
			});
			Controls.renderButton('1:0', 'ui-btn-primary ui-btn-round', advanced, {
				callback: handlerPmr,
				node: container,
				options: controlOptions,
				value: value,
				key: 'buttonStyle',
				keyName: Renderer.getOptionValueName('buttonStyle', '1:0', options.dict),
				formId: options.formId
			});
			Controls.renderButton('0:1', 'ui-btn-light-border', advanced, {
				callback: handlerLb,
				node: container,
				options: controlOptions,
				value: value,
				key: 'buttonStyle',
				keyName: Renderer.getOptionValueName('buttonStyle', '0:1', options.dict),
				formId: options.formId
			});
			Controls.renderButton('1:1', 'ui-btn-light-border ui-btn-round', advanced, {
				callback: handlerLbr,
				node: container,
				options: controlOptions,
				value: value,
				key: 'buttonStyle',
				keyName: Renderer.getOptionValueName('buttonStyle', '1:1', options.dict),
				formId: options.formId
			});
		},
		renderFieldButtonDecoration: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'button.decoration', options.dict);
			const handler = val => {
				options.callback([{
					name: 'button.decoration',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonDecoration(container, val, options);
				});
			};
			const handlerNoBorder = () => handler('');
			const handlerDotted = () => handler('dotted');
			const handlerLine = () => handler('solid');
			const advanced = container.dataset.controlMode === 'advanced';
			Controls.renderLink('', '--border-no', advanced, {
				callback: handlerNoBorder,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.decoration',
				keyName: Renderer.getOptionValueName('button.decoration', '', options.dict),
				formId: options.formId
			});
			Controls.renderLink('dotted', '--border-dotted', advanced, {
				callback: handlerDotted,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.decoration',
				keyName: Renderer.getOptionValueName('button.decoration', 'dotted', options.dict),
				formId: options.formId
			});
			Controls.renderLink('solid', '--border-line', advanced, {
				callback: handlerLine,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.decoration',
				keyName: Renderer.getOptionValueName('button.decoration', 'solid', options.dict),
				formId: options.formId
			});
		},
		renderFieldButtonFont: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'button.font', options.dict);
			const handler = val => {
				options.callback([{
					name: 'button.font',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonFont(container, val, options);
				});
			};
			const handlerModern = () => handler('modern');
			const handlerClassic = () => handler('classic');
			const handlerElegant = () => handler('elegant');
			const advanced = container.dataset.controlMode === 'advanced';
			Controls.renderTypeface('modern', advanced, {
				callback: handlerModern,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.font',
				keyName: Renderer.getOptionValueName('button.font', 'modern', options.dict),
				formId: options.formId
			});
			Controls.renderTypeface('classic', advanced, {
				callback: handlerClassic,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.font',
				keyName: Renderer.getOptionValueName('button.font', 'classic', options.dict),
				formId: options.formId
			});
			Controls.renderTypeface('elegant', advanced, {
				callback: handlerElegant,
				node: container,
				options: controlOptions,
				value: value,
				key: 'button.font',
				keyName: Renderer.getOptionValueName('button.font', 'elegant', options.dict),
				formId: options.formId
			});
		},
		renderFieldButtonAlign: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'button.align', options.dict);
			const handler = val => {
				options.callback([{
					name: 'button.align',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonAlign(container, val, options);
				});
			};
			const handlerLeft = () => handler('left');
			const handlerCenter = () => handler('center');
			const handlerRight = () => handler('right');

			// container.appendChild(Controls.renderOptionTitle(Renderer.getOptionKeyName('button.align')));

			const row = main_core.Tag.render`<div class="crm-form-embed__settings"></div>`;
			Controls.renderSquareButton('left', {
				callback: handlerLeft,
				node: row,
				options: controlOptions,
				value: value,
				key: 'button.align',
				keyName: Renderer.getOptionValueName('button.align', 'left', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('center', {
				callback: handlerCenter,
				node: row,
				options: controlOptions,
				value: value,
				key: 'button.align',
				keyName: Renderer.getOptionValueName('button.align', 'center', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('right', {
				callback: handlerRight,
				node: row,
				options: controlOptions,
				value: value,
				key: 'button.align',
				keyName: Renderer.getOptionValueName('button.align', 'right', options.dict),
				formId: options.formId
			});
			main_core.Dom.append(row, container);
		},
		renderFieldLinkAlign: function (container, value, options) {
			container.innerHTML = '';
			const controlOptions = this.getOptions(options.options, 'link.align', options.dict);
			const handler = val => {
				options.callback([{
					name: 'link.align',
					value: val
				}]).then(() => {
					Renderer.renderFieldLinkAlign(container, val, options);
				});
			};
			const handlerInline = () => handler('inline');
			const handlerLeft = () => handler('left');
			const handlerCenter = () => handler('center');
			const handlerRight = () => handler('right');

			// container.appendChild(Controls.renderOptionTitle(Renderer.getOptionKeyName('button.align')));

			const row = main_core.Tag.render`<div class="crm-form-embed__settings"></div>`;
			Controls.renderSquareButton('inline', {
				callback: handlerInline,
				node: row,
				options: controlOptions,
				value: value,
				key: 'link.align',
				keyName: Renderer.getOptionValueName('link.align', 'inline', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('left', {
				callback: handlerLeft,
				node: row,
				options: controlOptions,
				value: value,
				key: 'link.align',
				keyName: Renderer.getOptionValueName('link.align', 'left', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('center', {
				callback: handlerCenter,
				node: row,
				options: controlOptions,
				value: value,
				key: 'link.align',
				keyName: Renderer.getOptionValueName('link.align', 'center', options.dict),
				formId: options.formId
			});
			Controls.renderSquareButton('right', {
				callback: handlerRight,
				node: row,
				options: controlOptions,
				value: value,
				key: 'link.align',
				keyName: Renderer.getOptionValueName('link.align', 'right', options.dict),
				formId: options.formId
			});
			main_core.Dom.append(row, container);
		},
		renderFieldButtonPlain: function (container, value, options) {
			container.innerHTML = '';
			const handler = val => {
				options.callback([{
					name: 'button.plain',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonPlain(container, val, options);
				});
			};
			const block = main_core.Tag.render`<div class="crm-form-embed__settings--block-input"></div>`;
			Controls.renderDropdown({
				callback: handler,
				node: block,
				options: this.getOptions(options.options, 'button.plain', options.dict),
				value: value,
				key: 'button.plain',
				keyName: Renderer.getOptionKeyName('button.plain'),
				formId: options.formId
			});
			main_core.Dom.append(block, container);
		},
		renderFieldButtonText: function (container, value, options) {
			container.innerHTML = '';
			const handler = val => {
				if (!main_core.Type.isStringFilled(val)) {
					val = BX.Loc.getMessage('EMBED_SLIDER_BUTTONTEXT_PLACEHOLDER');
				}
				options.callback([{
					name: 'button.text',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonText(container, val, options);
				});
			};
			const block = main_core.Tag.render`<div class="crm-form-embed__settings--block-input"></div>`;
			const advanced = container.dataset.controlMode === 'advanced';
			Controls.renderText({
				callback: handler,
				node: block,
				options: null,
				value: value ? value : BX.Loc.getMessage('EMBED_SLIDER_BUTTONTEXT_PLACEHOLDER'),
				key: 'button.text',
				keyName: Renderer.getOptionKeyName('button.text'),
				formId: options.formId
			}, advanced);
			main_core.Dom.append(block, container);
		},
		renderFieldButtonColorBackground: function (container, value, options) {
			container.innerHTML = '';
			const advanced = container.dataset.controlMode === 'advanced';
			const handler = val => {
				const fields = [{
					name: 'button.color.background',
					value: val
				}];
				if (!advanced) {
					fields.push({
						name: 'button.color.backgroundHover',
						value: val
					});
				}
				options.callback(fields).then(() => {
					// Renderer.renderFieldButtonColorBackground(container, val, options);
				});
			};
			Controls.renderColorPicker('color', {
				callback: handler,
				node: container,
				options: null,
				value: value,
				key: 'button.color.background',
				keyName: Renderer.getOptionKeyName('button.color.background'),
				formId: options.formId
			});
		},
		renderFieldButtonColorBackgroundHover: function (container, value, options) {
			container.innerHTML = '';
			container.dataset.controlMode === 'advanced';
			const handler = val => {
				options.callback([{
					name: 'button.color.backgroundHover',
					value: val
				}]).then(() => {
					// Renderer.renderFieldButtonColorBackgroundHover(container, val, options);
				});
			};
			Controls.renderColorPicker('color', {
				callback: handler,
				node: container,
				options: null,
				value: value,
				key: 'button.color.backgroundHover',
				keyName: Renderer.getOptionKeyName('button.color.backgroundHover'),
				formId: options.formId
			});
		},
		renderFieldButtonColorText: function (container, value, options) {
			container.innerHTML = '';
			const advanced = container.dataset.controlMode === 'advanced';
			const handler = val => {
				const fields = [{
					name: 'button.color.text',
					value: val
				}];
				if (!advanced) {
					fields.push({
						name: 'button.color.textHover',
						value: val
					});
				}
				options.callback(fields).then(() => {
					// Renderer.renderFieldButtonColorText(container, val, options);
				});
			};
			Controls.renderColorPicker('color', {
				callback: handler,
				node: container,
				options: null,
				value: value,
				key: 'button.color.text',
				keyName: Renderer.getOptionKeyName('button.color.text'),
				formId: options.formId
			});
		},
		renderFieldButtonColorTextHover: function (container, value, options) {
			container.innerHTML = '';
			container.dataset.controlMode === 'advanced';
			const handler = val => {
				options.callback([{
					name: 'button.color.textHover',
					value: val
				}]).then(() => {
					// Renderer.renderFieldButtonColorTextHover(container, val, options);
				});
			};
			Controls.renderColorPicker('color', {
				callback: handler,
				node: container,
				options: null,
				value: value,
				key: 'button.color.textHover',
				keyName: Renderer.getOptionKeyName('button.color.textHover'),
				formId: options.formId
			});
		},
		renderFieldButtonUse: function (container, value, options) {
			container.innerHTML = '';
			const handler = val => {
				return options.callback([{
					name: 'button.use',
					value: val
				}]).then(() => {
					Renderer.renderFieldButtonUse(container, val, options);
					handlerToggleClickMode(container, val === '1');
				});
			};
			Controls.renderSwitcher({
				callback: handler,
				node: container,
				options: null,
				value: value,
				key: 'button.use',
				keyName: Renderer.getOptionKeyName('button.use'),
				formId: options.formId
			});
		},
		renderLabel: function (text, buttonSetting = false) {
			return Controls.renderLabel(text, buttonSetting);
		},
		getOptions: function (options, optionName, dict) {
			const result = {};
			options.forEach(value => {
				result[value] = Renderer.getOptionValueName(optionName, value, dict);
			});
			return result;
		},
		getOptionKeyName: function (key) {
			const msgKey = 'EMBED_SLIDER_OPTION_' + key.toUpperCase();
			return BX.Loc.hasMessage(msgKey) ? BX.Loc.getMessage(msgKey) : main_core.Text.encode(key);
		},
		getOptionValueName: function (key, value, dict) {
			const keySplit = key.split('.');
			const getDictValues = (parts, dict) => {
				const nextKey = parts.shift();
				if (parts.length > 0) {
					return getDictValues(parts, !main_core.Type.isUndefined(dict[nextKey]) ? dict[nextKey] : {});
				}
				return !main_core.Type.isUndefined(dict[nextKey + 's']) ? dict[nextKey + 's'] : [];
			};
			const dictValues = getDictValues(keySplit, dict['viewOptions']);
			let result = value;
			if (main_core.Type.isArray(dictValues)) {
				dictValues.forEach(elem => {
					if (elem.id.toString() === value.toString()) {
						result = elem.name;
					}
				});
			}
			return main_core.Text.encode(result);
		}
	};

	class Auto extends Form {
		#container;
		#wizard;
		#rendered = false;
		constructor(formId, dataProvider) {
			super(formId, dataProvider);
			this.#container = super.render();
		}
		load(force = false) {
			return super.load(force).then(() => {
				this.#wizard = new Wizard('auto', this.formId, this.dataProvider.getValues('auto'), this.dataProvider.getOptions('auto'), this.dataProvider.getDict());
				this.#wizard.subscribe('BX:Crm:Form:Embed:needToSave', event => {
					return this.save();
				});
				this.#wizard.subscribe('BX:Crm:Form:Embed:valueChanged', event => {
					this.updateDependentFields(this.#container, event.data.name, event.data.value);
				});
				if (!this.#rendered) {
					this.render();
				}
			}).catch(error => {
				console.error(error);
				if (!this.#rendered) {
					this.#renderError();
				}
			});
		}
		save() {
			this.data.embed.viewValues['auto'] = this.#wizard.getValues();
			return super.save();
		}
		render() {
			this.#container.innerHTML = '';
			const headerSection = this.renderHeaderSection('clock', BX.Loc.getMessage('EMBED_SLIDER_AUTO_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_AUTO_DESC'), HELP_CENTER_ID, HELP_CENTER_URL);
			main_core.Dom.append(headerSection, this.#container);
			if (!super.loaded) {
				this.loader.show(this.#container);
			} else {
				// update with actual help-center link
				main_core.Dom.replace(headerSection, this.renderHeaderSection('clock', BX.Loc.getMessage('EMBED_SLIDER_AUTO_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_AUTO_DESC'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl));
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_OPEN_IN_NEW_TAB'), this.dataProvider.data.embed.previewLink.replace('#preview#', 'auto')), this.#container);
				main_core.Dom.append(this.renderBaseSettings(), this.#container);
				const code = this.data.embed.scripts['auto'].text;
				main_core.Dom.append(this.renderCodeBlock(code), this.#container);
				main_core.Dom.append(this.renderCopySection(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE'), BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE2'), code, this.renderBubble(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE_BUBBLE_AUTO'), true)), this.#container);
				this.#rendered = true;
			}
			return this.#container;
		}
		#renderError() {
			this.#container.innerHTML = '';
			main_core.Dom.append(super.renderError(super.data), this.#container);
			this.#rendered = true;
		}
		renderBaseSettings() {
			const section = this.renderSection(this.renderSettingsHeader(BX.Loc.getMessage('EMBED_SLIDER_SETTINGS_HEADING'), false, () => {
				BX.SidePanel.Instance.open("crm.webform:embed:" + this.formId + ":auto:expert", {
					width: 920,
					cacheable: false,
					contentCallback: () => this.#createAdvancedSettingsLayout(),
					events: {
						onCloseComplete: event => {
							this.load(true).then(() => {
								this.render();
							});
						}
					}
				});
			}));
			const wrapper = main_core.Tag.render`<div class="crm-form-embed__basic"></div>`;
			this.#wizard.renderOptionTo(wrapper, 'delay', true);
			main_core.Dom.addClass(wrapper.querySelector('.ui-ctl-dropdown'), 'crm-form-embed__select--time');
			main_core.Dom.append(wrapper, section);
			return section;
		}
		#createAdvancedSettingsLayout() {
			const layoutContent = this.#renderAdvancedSettingsLayoutContent();
			this.#wizard.subscribe('BX:Crm:Form:Embed:valueChanged', event => {
				this.updateDependentFields(layoutContent, event.data.name, event.data.value);
			});
			return ui_sidepanel_layout.Layout.createContent({
				extensions: ['crm.form.embed', 'ui.sidepanel-content', 'ui.forms', 'landing.ui.field.color', 'ui.switcher'],
				title: BX.Loc.getMessage('EMBED_SLIDER_EXPERT_MODE_TITLE'),
				design: {
					section: false
				},
				toolbar({
					Button
				}) {
					return [new Button({
						// icon: Button.Icon.SETTING,
						color: Button.Color.LIGHT_BORDER,
						text: BX.Loc.getMessage('EMBED_SLIDER_TOOLBAR_BTN_FEEDBACK'),
						onclick: openFeedbackForm
					})];
				},
				content: () => layoutContent,
				buttons: ({
					SaveButton,
					ApplyButton,
					cancelButton
				}) => {
					return [new SaveButton({
						onclick: btn => {
							btn.setWaiting(true);
							this.save().then(() => {
								btn.setWaiting(false);
								this.render();
								BX.SidePanel.Instance.close();
							});
						}
					}), new ApplyButton({
						onclick: btn => {
							btn.setWaiting(true);
							this.save().then(() => {
								btn.setWaiting(false);
								this.render();
							});
						}
					}), cancelButton];
				}
			});
		}
		#renderAdvancedSettingsLayoutContent() {
			const container = this.renderContainer();
			main_core.Dom.append(this.renderHeaderSection('clock', BX.Loc.getMessage('EMBED_SLIDER_AUTO_TITLE2'), BX.Loc.getMessage('EMBED_SLIDER_AUTO_DESC2'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl), container);
			const stepperInner = main_core.Tag.render`<div></div>`;
			main_core.Dom.append(this.#wizard.renderControlContainer([this.#wizard.renderOption('delay', false), this.#wizard.renderOption('type', false)]), stepperInner);
			const containerPosition = main_core.Tag.render`<div class="crm-form-embed__settings--side-block"></div>`;
			const containerVertical = main_core.Tag.render`<div data-option="vertical"></div>`;
			this.#wizard.renderOptionTo(containerPosition, 'position', false);
			this.#wizard.renderOptionTo(containerVertical, 'vertical', false);
			const containerPositionVertical = this.#wizard.renderControlContainer([containerPosition, containerVertical]);
			main_core.Dom.append(containerPositionVertical, stepperInner);
			const stepperContent = [{
				html: [{
					header: BX.Loc.getMessage('EMBED_SLIDER_AUTO_WIZARD_TITLE'),
					node: stepperInner
				}]
			}];
			main_core.Dom.append(this.renderStepperSection(stepperContent), container);

			// TODO field dependency
			this.updateDependentFields(container, 'type', this.data.embed.viewValues['auto']['type']);
			return container;
		}
	}

	class Click extends Form {
		#container;
		#wizard;
		#rendered = false;
		constructor(formId, dataProvider) {
			super(formId, dataProvider);
			this.#container = super.render();
		}
		load(force = false) {
			return super.load(force).then(() => {
				this.#wizard = new Wizard('click', this.formId, this.dataProvider.getValues('click'), this.dataProvider.getOptions('click'), this.dataProvider.getDict());
				this.#wizard.subscribe('BX:Crm:Form:Embed:needToSave', event => {
					return this.save();
				});
				this.#wizard.subscribe('BX:Crm:Form:Embed:valueChanged', event => {
					this.updateDependentFields(this.#container, event.data.name, event.data.value);
				});
				if (!this.#rendered) {
					this.render();
				}
			}).catch(error => {
				console.error(error);
				if (!this.#rendered) {
					this.#renderError();
				}
			});
		}
		save() {
			this.dataProvider.updateValues('click', {
				...this.#wizard.getValues()
			});
			return super.save();
		}
		render() {
			this.#container.innerHTML = '';
			const headerSection = this.renderHeaderSection('click', BX.Loc.getMessage('EMBED_SLIDER_CLICK_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_CLICK_DESC'), HELP_CENTER_ID, HELP_CENTER_URL);
			main_core.Dom.append(headerSection, this.#container);
			if (!super.loaded) {
				this.loader.show(this.#container);
			} else {
				// update with actual help-center link
				main_core.Dom.replace(headerSection, this.renderHeaderSection('click', BX.Loc.getMessage('EMBED_SLIDER_CLICK_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_CLICK_DESC'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl));
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_OPEN_IN_NEW_TAB'), this.dataProvider.data.embed.previewLink.replace('#preview#', 'click')), this.#container);
				main_core.Dom.append(this.renderFormSettings(), this.#container);
				main_core.Dom.append(this.renderButtonSettings(), this.#container);
				const code = this.dataProvider.data.embed.scripts['click'].text;
				main_core.Dom.append(this.renderCodeBlock(code), this.#container);
				main_core.Dom.append(this.renderCopySection(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE'), BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE2'), code, this.renderBubble(BX.Loc.getMessage('EMBED_SLIDER_COPY_CODE_BUBBLE_CLICK'), true)), this.#container);
				this.#rendered = true;
			}
			return this.#container;
		}
		#renderError() {
			this.#container.innerHTML = '';
			main_core.Dom.append(super.renderError(super.dataProvider.data), this.#container);
			this.#rendered = true;
		}
		renderFormSettings() {
			const section = this.renderSection(this.renderSettingsHeader(BX.Loc.getMessage('EMBED_SLIDER_SETTINGS_HEADING'), false));
			const formSettings = main_core.Tag.render`<div></div>`;
			main_core.Dom.append(this.#wizard.renderOption('type', true), formSettings);
			const containerPosition = main_core.Tag.render`<div class="crm-form-embed__settings--side-block --compact"></div>`;
			this.#wizard.renderOptionTo(containerPosition, 'position', true);
			const containerVertical = main_core.Tag.render`<div data-option="vertical"></div>`;
			this.#wizard.renderOptionTo(containerVertical, 'vertical', true);
			const containerPositionVertical = this.#wizard.renderControlContainer([containerPosition, containerVertical]);
			main_core.Dom.append(containerPositionVertical, formSettings);
			this.updateDependentFields(formSettings, 'type', this.dataProvider.getValues('click')['type']);
			main_core.Dom.append(formSettings, section);
			return section;
		}
		renderButtonSettings() {
			const enhancedMode = !main_core.Type.isUndefined(this.dataProvider.getValues('click')['button']) && !main_core.Type.isUndefined(this.dataProvider.getValues('click')['button']['use']) && this.dataProvider.getValues('click')['button']['use'] === '1';
			// const linkMode =
			// 	!Type.isUndefined(this.dataProvider.getValues('click')?.button?.plain)
			// 	&& this.dataProvider.getValues('click')['button']['plain'] === '1'
			// ;

			const section = this.renderSection(main_core.Tag.render`
				<div class="ui-alert ui-alert-primary crm-form-embed-click-button-alert" id ='crm-form-embed-click-button-alert-${this.formId}'>
					<span class="ui-alert-message">${BX.Loc.getMessage('EMBED_SLIDER_CLICK_BUTTON_ALERT')}</span>
					<span class="ui-alert-close-btn" onclick="BX.hide(BX('crm-form-embed-click-button-alert-${this.formId}'));"></span>
				</div>
			`);
			main_core.Dom.append(this.renderSettingsHeader(BX.Loc.getMessage('EMBED_SLIDER_SETTINGS_HEADING_CLICK'), true, () => {
				BX.SidePanel.Instance.open("crm.webform:embed:" + this.formId + ":click:expert", {
					width: 920,
					cacheable: false,
					contentCallback: () => this.#createAdvancedSettingsLayout(),
					events: {
						onCloseComplete: event => {
							this.load(true).then(() => {
								this.render();
							});
						}
					}
				});
			}), section);
			main_core.Dom.append(this.#wizard.renderOption('button.use', true), section.querySelector('.crm-form-embed__customization-settings--switcher'));
			if (enhancedMode) {
				main_core.Dom.addClass(section.querySelector('.crm-form-embed__link.--expert-mode'), '--visible');
				main_core.Dom.removeClass(section.querySelector('[data-roll="heading-block"]'), '--collapse');
			} else {
				main_core.Dom.removeClass(section.querySelector('.crm-form-embed__link.--expert-mode'), '--visible');
				main_core.Dom.addClass(section.querySelector('[data-roll="heading-block"]'), '--collapse');
			}
			const containerPlainAndText = this.#wizard.renderControlContainer([this.#wizard.renderOption('button.plain', true), this.#wizard.renderOption('button.text', true)]);

			// const optionStyle = (linkMode)
			// 	? this.#wizard.renderOption('button.decoration', true)
			// 	: this.#wizard.renderOption('buttonStyle', true)
			// ;
			const optionLinkStyle = this.#wizard.renderOption('button.decoration', true);
			optionLinkStyle.dataset.option = 'button.decoration';
			const optionButtonStyle = this.#wizard.renderOption('buttonStyle', true);
			optionButtonStyle.dataset.option = 'buttonStyle';
			const rowButtonSettings = this.#wizard.renderRow([
			// this.#wizard.renderTitle(BX.Loc.getMessage('EMBED_SLIDER_SUBTITLE_BUTTON_SETTINGS'), true),
			containerPlainAndText,
			// this.#wizard.renderTitle(BX.Loc.getMessage('EMBED_SLIDER_SUBTITLE_STYLE')),
			// optionStyle,
			optionButtonStyle, optionLinkStyle]);
			const colBtnColor = this.#wizard.renderCol();
			const colTxtColor = this.#wizard.renderCol();
			this.#wizard.renderColorPopup(colBtnColor, 'button.color.background', true);
			this.#wizard.renderColorPopup(colTxtColor, 'button.color.text', true);
			const rowDesign = this.#wizard.renderRow([
			// this.#wizard.renderTitle(
			// 	BX.Loc.getMessage('EMBED_SLIDER_SUBTITLE_DESIGN'),
			// 	true
			// ),
			this.#wizard.renderBlock([this.#wizard.renderCol([this.#wizard.renderLabel(BX.Loc.getMessage('EMBED_SLIDER_OPTION_BUTTON.FONT'), true), this.#wizard.renderOption('button.font', true)], true), colBtnColor, colTxtColor])], true);
			const wrapper = main_core.Tag.render`
			<div class="crm-form-embed__basic" data-roll="crm-form-embed__settings" ${enhancedMode ? '' : 'style="height: 0px;"'}></div>
		`;
			main_core.Dom.append(rowButtonSettings, wrapper);
			main_core.Dom.append(rowDesign, wrapper);
			main_core.Dom.append(wrapper, section);
			this.updateDependentFields(section, 'button.plain', this.dataProvider.getValues('click')['button']['plain']);
			return section;
		}
		#createAdvancedSettingsLayout() {
			return ui_sidepanel_layout.Layout.createContent({
				extensions: ['crm.form.embed', 'ui.sidepanel-content', 'ui.forms', 'landing.ui.field.color', 'ui.switcher'],
				title: BX.Loc.getMessage('EMBED_SLIDER_EXPERT_MODE_TITLE'),
				design: {
					section: false
				},
				toolbar({
					Button
				}) {
					return [new Button({
						// icon: Button.Icon.SETTING,
						color: Button.Color.LIGHT_BORDER,
						text: BX.Loc.getMessage('EMBED_SLIDER_TOOLBAR_BTN_FEEDBACK'),
						onclick: openFeedbackForm
					})];
				},
				content: () => this.#renderAdvancedSettingsLayoutContent(),
				buttons: ({
					cancelButton,
					ApplyButton,
					SaveButton
				}) => {
					return [new SaveButton({
						onclick: btn => {
							btn.setWaiting(true);
							this.save().then(() => {
								btn.setWaiting(false);
								this.render();
								BX.SidePanel.Instance.close();
							});
						}
					}), new ApplyButton({
						onclick: btn => {
							btn.setWaiting(true);
							this.save().then(() => {
								btn.setWaiting(false);
								this.render();
							});
						}
					}), cancelButton];
				}
			});
		}
		#renderAdvancedSettingsLayoutContent() {
			return new Promise((resolve, reject) => {
				const container = this.renderContainer();
				main_core.Dom.append(this.renderHeaderSection('click', BX.Loc.getMessage('EMBED_SLIDER_CLICK_TITLE_ADVANCED'), BX.Loc.getMessage('EMBED_SLIDER_CLICK_DESC_ADVANCED'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl), container);
				this.loader.show(container);
				main_core_events.EventEmitter.subscribeOnce('SidePanel.Slider:onOpenComplete', event => {
					if (event.target.getUrl() === "crm.webform:embed:" + this.formId + ":click:expert") {
						this.loader.hide();
						const containerButtonStyle = this.#wizard.renderControlContainer();
						containerButtonStyle.dataset.controlMode = 'advanced';
						containerButtonStyle.dataset.option = 'buttonStyle';
						this.#wizard.renderOptionTo(containerButtonStyle, 'buttonStyle', false);
						const containerLinkStyle = this.#wizard.renderControlContainer();
						containerLinkStyle.dataset.controlMode = 'advanced';
						containerLinkStyle.dataset.option = 'button.decoration';
						this.#wizard.renderOptionTo(containerLinkStyle, 'button.decoration', false);
						const containerText = this.#wizard.renderControlContainer();
						containerText.dataset.controlMode = 'advanced';
						this.#wizard.renderOptionTo(containerText, 'button.text', false);
						const containerTypeAndText = this.#wizard.renderControlContainer([this.#wizard.renderOption('button.plain', false), containerText]);
						const step1 = main_core.Tag.render`<div></div>`;
						main_core.Dom.append(containerTypeAndText, step1);
						main_core.Dom.append(containerButtonStyle, step1);
						main_core.Dom.append(containerLinkStyle, step1);
						const rowFont = this.#wizard.renderControlContainer();
						rowFont.dataset.controlMode = 'advanced';
						rowFont.dataset.option = 'button.font';
						this.#wizard.renderOptionTo(rowFont, 'button.font', false);
						const stepButtonFont = main_core.Tag.render`
						<div>
							${rowFont}
						</div>
					`;

						// TODO white container
						const stepColor = this.renderSection();
						const containerColorBg = this.#wizard.renderControlContainer();
						const containerColorBgHover = this.#wizard.renderControlContainer();
						const containerColorText = this.#wizard.renderControlContainer();
						const containerColorTextHover = this.#wizard.renderControlContainer();
						containerColorBg.dataset.controlMode = 'advanced';
						containerColorBgHover.dataset.controlMode = 'advanced';
						containerColorText.dataset.controlMode = 'advanced';
						containerColorTextHover.dataset.controlMode = 'advanced';
						this.#wizard.renderColorInline(containerColorBg, 'button.color.background', false);
						this.#wizard.renderColorInline(containerColorText, 'button.color.text', false);
						this.#wizard.renderColorInline(containerColorBgHover, 'button.color.backgroundHover', false);
						this.#wizard.renderColorInline(containerColorTextHover, 'button.color.textHover', false);
						const getColorLabel = messageId => {
							const label = this.#wizard.renderLabel(BX.Loc.getMessage(messageId));
							main_core.Dom.addClass(label, 'crm-form-embed__label-text-color');
							return label;
						};
						main_core.Dom.append(main_core.Tag.render`<div>
						${this.#wizard.renderBlock([this.#wizard.renderCol([getColorLabel('EMBED_SLIDER_OPTION_BUTTON.COLOR.BACKGROUND'), containerColorBg]), this.#wizard.renderCol([getColorLabel('EMBED_SLIDER_OPTION_BUTTON.COLOR.TEXT'), containerColorText]), this.#wizard.renderCol([getColorLabel('EMBED_SLIDER_OPTION_BUTTON.COLOR.BACKGROUNDHOVER'), containerColorBgHover]), this.#wizard.renderCol([getColorLabel('EMBED_SLIDER_OPTION_BUTTON.COLOR.TEXTHOVER'), containerColorTextHover])])}
					</div>`, stepColor);
						const step4 = main_core.Tag.render`<div></div>`;
						const containerButtonPosition = main_core.Tag.render`<div class="crm-form-embed__settings--side-block" data-option="button.align"></div>`;
						this.#wizard.renderOptionTo(containerButtonPosition, 'button.align', false);
						const containerLinkPosition = main_core.Tag.render`<div class="crm-form-embed__settings--side-block" data-option="link.align"></div>`;
						this.#wizard.renderOptionTo(containerLinkPosition, 'link.align', false);
						main_core.Dom.append(this.#wizard.renderControlContainer([containerButtonPosition, containerLinkPosition]), step4);
						const step4Message = !main_core.Type.isUndefined(this.dataProvider.getValues('click')?.button?.plain) && this.dataProvider.getValues('click')['button']['plain'] === '1' ? 'EMBED_SLIDER_CLICK_STEP_4_TITLE_2' : 'EMBED_SLIDER_CLICK_STEP_4_TITLE';
						const stepperContent = [{
							html: [{
								header: {
									title: BX.Loc.getMessage('EMBED_SLIDER_CLICK_STEP_1_TITLE')
									// hint: 'hint text',
								},
								node: step1
							}]
						}, {
							html: [{
								header: BX.Loc.getMessage('EMBED_SLIDER_CLICK_STEP_2_TITLE'),
								node: stepButtonFont
							}]
						}, {
							html: [{
								header: BX.Loc.getMessage('EMBED_SLIDER_CLICK_STEP_3_TITLE'),
								node: stepColor
							}]
						}, {
							html: [{
								header: BX.Loc.getMessage(step4Message),
								node: step4
							}]
						}];
						main_core.Dom.append(this.renderStepperSection(stepperContent), container);

						// TODO field dependency
						this.updateDependentFields(container, 'type', this.dataProvider.getValues('click')['type']);
						this.updateDependentFields(container, 'button.plain', this.dataProvider.getValues('click')['button']['plain']);
						this.#wizard.subscribe('BX:Crm:Form:Embed:valueChanged', event => {
							this.updateDependentFields(container, event.data.name, event.data.value);
						});
					}
				});
				resolve(container);
			});
		}
	}

	class Publink extends Form {
		#container;
		#rendered = false;
		constructor(formId, dataProvider) {
			super(formId, dataProvider);
			this.#container = super.render();
		}
		load(force = false) {
			return super.load(force).then(() => {
				if (!this.#rendered) {
					this.render();
				}
			}).catch(error => {
				console.error(error);
				if (!this.#rendered) {
					this.#renderError();
				}
			});
		}
		render() {
			this.#container.innerHTML = '';
			const headerSection = this.renderHeaderSection('linked-link', BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_DESCRIPTION'), HELP_CENTER_ID, HELP_CENTER_URL);
			main_core.Dom.append(headerSection, this.#container);
			if (!super.loaded) {
				this.loader.show(this.#container);
			} else {
				// update with actual help-center link
				main_core.Dom.replace(headerSection, this.renderHeaderSection('linked-link', BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_DESCRIPTION'), this.dataProvider.data.embed.helpCenterId, this.dataProvider.data.embed.helpCenterUrl));
				main_core.Dom.append(this.renderPreviewSection(BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_QR_TITLE'), BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_QR_DESC'), BX.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_OPEN_IN_NEW_TAB'), this.dataProvider.data.embed.pubLink), this.#container);
				main_core.Dom.append(this.renderCopySection(null,
				// BX.Loc.getMessage('EMBED_SLIDER_COPY_LINK'),
				BX.Loc.getMessage('EMBED_SLIDER_COPY_LINK2'), this.dataProvider.data.embed.pubLink, null, 'ui-btn-icon-follow crm-form-embed__btn-icon--link'), this.#container);
				this.#rendered = true;
			}
			return this.#container;
		}
		#renderError() {
			this.#container.innerHTML = '';
			main_core.Dom.append(super.renderError(this.dataProvider.data), this.#container);
			this.#rendered = true;
			return this.#container;
		}
	}

	const DEFAULT_WIDGETS_COUNT = 10;
	class Embed {
		#options;
		#publink;
		#inline;
		#auto;
		#click;
		#widget;
		#openlines;
		constructor(formId, options = {}) {
			this.#options = options;
			const dataProvider = new DataProvider();
			this.#publink = new Publink(formId, dataProvider);
			this.#inline = new Inline(formId, dataProvider);
			this.#click = new Click(formId, dataProvider);
			this.#auto = new Auto(formId, dataProvider);
			const widgetsCount = options.widgetsCount ? options.widgetsCount : DEFAULT_WIDGETS_COUNT;
			this.#widget = new Widget(formId, {
				widgetsCount: widgetsCount
			});
			this.#openlines = new Openlines(formId, {
				widgetsCount: widgetsCount
			});
		}
		static openSlider(formId, options = {
			activeMenuItemId: 'link'
		}) {
			const instance = new Embed(formId, {
				...options
			});
			BX.SidePanel.Instance.open("crm.webform:embed:" + formId, {
				width: 1046,
				cacheable: false,
				...options.sliderOptions,
				contentCallback: () => instance.#render(options),
				events: {
					onCloseComplete: event => {
						if (main_core.Type.isFunction(options.onCloseComplete)) {
							options.onCloseComplete();
						}
					},
					onLoad: event => {
						// BX.UI.Switcher.initByClassName();
						instance.#loadTab(options.activeMenuItemId);
					}
				}
			});
		}

		/**
		 * @deprecated open => openSlider
		 * @see Embed.openSlider
		 */
		static open(formId, options = {
			widgetsCount: DEFAULT_WIDGETS_COUNT,
			activeMenuItemId: 'inline'
		}) {
			Embed.openSlider(formId, options);
		}
		#render(options) {
			return ui_sidepanel_layout.Layout.createContent({
				extensions: ['crm.form.embed', 'ui.sidepanel-content', 'ui.forms', 'landing.ui.field.color', 'ui.switcher'],
				title: BX.Loc.getMessage('EMBED_SLIDER_MAIN_TITLE'),
				design: {
					section: false
				},
				toolbar({
					Button
				}) {
					return [new Button({
						// icon: Button.Icon.SETTING,
						color: Button.Color.LIGHT_BORDER,
						text: BX.Loc.getMessage('EMBED_SLIDER_TOOLBAR_BTN_FEEDBACK'),
						onclick: openFeedbackForm
					})];
				},
				content: () => {
					return main_core.Tag.render`
					<div class="crm-form-embed-slider-wrapper">
						<div data-menu-item-id="widgets">${this.#widget.render()}</div>
						<div data-menu-item-id="openlines">${this.#openlines.render()}</div>
						<div data-menu-item-id="inline">${this.#inline.render()}</div>
						<div data-menu-item-id="click">${this.#click.render()}</div>
						<div data-menu-item-id="auto">${this.#auto.render()}</div>
						<div data-menu-item-id="link">${this.#publink.render()}</div>
					</div>
				`;
				},
				menu: {
					items: [{
						label: main_core.Loc.getMessage('EMBED_SLIDER_PUBLIC_LINK_MENU'),
						id: 'link',
						onclick: () => this.#loadTab('link'),
						active: options.activeMenuItemId === 'link'
					}, {
						label: main_core.Loc.getMessage('EMBED_SLIDER_WIDGET_MENU'),
						id: 'widgets',
						onclick: () => this.#loadTab('widgets'),
						active: options.activeMenuItemId === 'widgets'
					}, {
						label: main_core.Loc.getMessage('EMBED_SLIDER_OPENLINES_MENU'),
						id: 'openlines',
						onclick: () => this.#loadTab('openlines'),
						active: options.activeMenuItemId === 'openlines'
					}, {
						label: main_core.Loc.getMessage('EMBED_SLIDER_INLINE_MENU'),
						id: 'inline',
						onclick: () => this.#loadTab('inline'),
						active: options.activeMenuItemId === 'inline'
					}, {
						label: main_core.Loc.getMessage('EMBED_SLIDER_CLICK_MENU'),
						id: 'click',
						onclick: () => this.#loadTab('click'),
						active: options.activeMenuItemId === 'click'
					}, {
						label: main_core.Loc.getMessage('EMBED_SLIDER_AUTO_MENU'),
						id: 'auto',
						onclick: () => this.#loadTab('auto'),
						active: options.activeMenuItemId === 'auto'
					}]
				},
				buttons: ({
					closeButton
				}) => {
					return [closeButton];
				}
			});
		}
		#loadTab(tabName) {
			switch (tabName) {
				case 'widgets':
					this.#widget.load();
					break;
				case 'openlines':
					this.#openlines.load();
					break;
				case 'inline':
					this.#inline.load();
					break;
				case 'click':
					this.#click.load();
					break;
				case 'auto':
					this.#auto.load();
					break;
				case 'link':
				default:
					this.#publink.load();
					break;
			}
		}
	}

	exports.Embed = Embed;

})(this.BX.Crm.Form = this.BX.Crm.Form || {}, BX, BX.UI.SidePanel, BX, BX.UI, BX.UI, BX, BX, BX.Landing.UI.Field, BX.UI.Feedback, BX, BX.Event);
//# sourceMappingURL=embed.bundle.js.map
