/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, ui_designTokens, ui_designTokens_air, ui_hint, main_core, main_popup, landing_ui_field_basefield, ui_draganddrop_draggable, landing_ui_field_radiobuttonfield, landing_ui_field_smallswitch, landing_ui_field_textareafield, landing_ui_form_formsettingsform, crm_form_client, landing_ui_component_listitem, landing_ui_component_actionpanel, main_loader, landing_backend, landing_ui_panel_formsettingspanel) {
	'use strict';

	const PERSONAL_DATA_AGREEMENT_CODE = 'crm_def';
	function getAgreementBehaviorType(agreement) {
		if (agreement.acceptBySubmit === true) {
			return 'type5';
		}
		if (agreement.checked === true && agreement.required === true) {
			return 'type1';
		}
		if (agreement.checked === false && agreement.required === true) {
			return 'type2';
		}
		if (agreement.checked === true && agreement.required === false) {
			return 'type3';
		}
		return 'type4';
	}
	function getInitialAgreementBehavior(agreementCode, isNewForm) {
		if (agreementCode === PERSONAL_DATA_AGREEMENT_CODE && isNewForm) {
			return {
				acceptBySubmit: true
			};
		}
		return {
			checked: true,
			required: true,
			acceptBySubmit: false
		};
	}

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	class AgreementsList extends landing_ui_field_basefield.BaseField {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Landing.UI.Field.AgreementsList');
			this.onSelectAgreementClick = this.onSelectAgreementClick.bind(this);
			this.onCreateAgreementClick = this.onCreateAgreementClick.bind(this);
			this.onUserConsentEditSave = this.onUserConsentEditSave.bind(this);
			this.onUserConsentEditCancel = this.onUserConsentEditCancel.bind(this);
			this.onItemRemoveClick = this.onItemRemoveClick.bind(this);
			this.onDragEnd = this.onDragEnd.bind(this);
			this.items = [];
			this.destroyed = false;
			this.hintBindings = [];
			main_core.Dom.attr(this.layout, 'data-testid', 'landing-agreements-root');
			main_core.Dom.replace(this.input, this.getListContainer());
			main_core.Dom.append(this.getActionsContainer(), this.layout);
			void this.showAgreementLoader();
			crm_form_client.FormClient.getInstance().prepareOptions(this.options.formOptions, {
				agreements: this.options.value
			}).then(result => {
				if (this.destroyed) {
					return;
				}
				this.replaceItems(result.data.agreements, this.options.value);
				this.emit('onChange', {
					skipPrepare: true
				});
			}).catch(errors => {
				if (!this.destroyed) {
					this.options.value.forEach(agreement => this.addItem(agreement, false));
					this.emit('onError', {
						errors
					});
				}
			}).finally(() => {
				void this.hideAgreementLoader();
			});
			this.draggable = new ui_draganddrop_draggable.Draggable({
				context: window.parent,
				container: this.getListContainer(),
				draggable: '.landing-ui-component-list-item',
				dragElement: '.landing-ui-button-icon-drag',
				type: ui_draganddrop_draggable.Draggable.MOVE,
				offset: {
					y: -62
				}
			});
			this.draggable.subscribe('end', this.onDragEnd);
			const addCustomEvent = main_core.Reflection.getClass('top.BX.addCustomEvent');
			addCustomEvent(window.top, 'main-user-consent-to-list', this.onUserConsentEditCancel);
			addCustomEvent(window.top, 'main-user-consent-saved', this.onUserConsentEditSave);
		}
		getAgreementsList() {
			return this.cache.remember('agreementsList', () => {
				return this.options.agreementsList || [];
			});
		}
		setAgreementsList(agreements) {
			this.cache.set('agreementsList', agreements);
		}
		isNewForm() {
			return !this.options.formOptions.id;
		}
		supportsAcceptBySubmit() {
			const data = this.options.formOptions?.data;
			return data?.schemaVersion >= 2 && data.acceptBySubmitEnabled === true;
		}
		getInitialAgreementBehavior(agreementCode) {
			const behavior = getInitialAgreementBehavior(agreementCode, this.isNewForm() && this.supportsAcceptBySubmit());
			if (this.options.formOptions?.data?.agreementNoticeSupported === true && agreementCode !== PERSONAL_DATA_AGREEMENT_CODE) {
				return {
					...behavior,
					agreementNoticeEnabled: false,
					agreementNoticeText: ''
				};
			}
			return behavior;
		}
		loadAgreementsList() {
			return landing_backend.Backend.getInstance().action('Form::getAgreements').then(agreements => {
				return main_core.Runtime.orderBy(agreements, ['id'], ['asc']);
			});
		}
		getAgreementById(id) {
			return this.getAgreementsList().find(agreement => {
				return String(id) === String(agreement.id);
			});
		}
		addItem(itemOptions, available = true) {
			if (this.destroyed || this.items.some(item => String(item.options.id) === String(itemOptions.id))) {
				return;
			}
			const item = this.createItem(itemOptions, available);
			item.appendTo(this.getListContainer());
			this.items.push(item);
		}
		replaceItems(agreements, value) {
			this.items.forEach(item => this.destroyItem(item));
			this.items = [];
			value.forEach(agreement => {
				const prepared = agreements.find(item => String(item.id) === String(agreement.id));
				this.addItem(prepared || agreement, Boolean(prepared));
			});
		}
		getListContainer() {
			return this.cache.remember('listContainer', () => {
				return main_core.Tag.render`<div class="landing-ui-field-agreements-list-container" data-testid="landing-agreements-list"></div>`;
			});
		}
		getActionsContainer() {
			return this.cache.remember('actionsContainer', () => {
				return main_core.Tag.render`
				<div class="landing-ui-field-agreements-list-actions-container">
					${this.getSelectAgreementButton()}
					${this.getCreateAgreementButton()}
				</div>
			`;
			});
		}
		getSelectAgreementButton() {
			return this.cache.remember('selectAgreementButton', () => {
				return main_core.Tag.render`
				<span class="landing-ui-field-agreements-list-actions-button" role="button" tabindex="0"
						data-testid="landing-agreements-select-btn" onclick="${this.onSelectAgreementClick}"
						onkeydown="${this.onActionKeyDown.bind(this)}">
					${main_core.Loc.getMessage('LANDING_AGREEMENT_LIST_SELECT_BUTTON_LABEL')}
				</span>
			`;
			});
		}
		getCreateAgreementButton() {
			return this.cache.remember('createAgreementButton', () => {
				return main_core.Tag.render`
				<span class="landing-ui-field-agreements-list-actions-button" role="button" tabindex="0"
						data-testid="landing-agreements-create-btn" onclick="${this.onCreateAgreementClick}"
						onkeydown="${this.onActionKeyDown.bind(this)}">
					${main_core.Loc.getMessage('LANDING_AGREEMENT_LIST_CREATE_BUTTON_LABEL')}
				</span>
			`;
			});
		}
		onActionKeyDown(event) {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				event.currentTarget.click();
			}
		}
		getSelectedAgreements() {
			return [...this.getListContainer().children].map(item => {
				return main_core.Dom.attr(item, 'data-value');
			});
		}
		getAgreementsMenu() {
			return this.cache.remember('agreementsMenu', () => {
				const menu = new main_popup.Menu({
					bindElement: this.getSelectAgreementButton(),
					autoHide: true,
					maxWidth: 400,
					maxHeight: 205,
					events: {
						onPopupShow: () => {
							clearTimeout(this.menuPositionTimer);
							this.menuPositionTimer = setTimeout(() => {
								if (this.destroyed) {
									return;
								}
								main_core.Dom.style(menu.getMenuContainer(), {
									left: '0px',
									right: 'auto',
									top: '30px'
								});
							});
						}
					}
				});
				main_core.Dom.attr(menu.getMenuContainer(), 'data-testid', 'landing-agreements-select-menu');
				this.getAgreementsList().filter(agreement => {
					return !this.items.some(item => {
						return String(item.options.id) === String(agreement.id);
					});
				}).forEach(agreement => {
					menu.addMenuItem({
						id: agreement.id,
						dataset: {
							testid: `landing-agreements-select-item-${agreement.id}`
						},
						text: agreement.name,
						onclick: this.onAgreementsMenuItemClick.bind(this, agreement)
					});
				});
				main_core.Dom.append(menu.getMenuContainer(), this.getActionsContainer());
				return menu;
			});
		}
		refreshAgreementsMenu() {
			clearTimeout(this.menuPositionTimer);
			const agreementsMenu = this.cache.get('agreementsMenu');
			if (agreementsMenu) {
				agreementsMenu.close();
				agreementsMenu.destroy();
				this.cache.delete('agreementsMenu');
			}
		}
		createItemForm(agreement, agreementCode) {
			const personal = this.isPersonalDataAgreement(agreement, agreementCode);
			const acceptBySubmitEnabled = this.supportsAcceptBySubmit();
			const acceptBySubmitAllowed = acceptBySubmitEnabled && (main_core.Type.isBoolean(agreement.acceptBySubmitAllowed) ? agreement.acceptBySubmitAllowed : agreementCode === PERSONAL_DATA_AGREEMENT_CODE);
			const typeField = new landing_ui_field_radiobuttonfield.RadioButtonField({
				selector: 'type',
				value: getAgreementBehaviorType({
					...agreement,
					acceptBySubmit: acceptBySubmitAllowed && agreement.acceptBySubmit === true
				}),
				items: [{
					id: 'type1',
					title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_1'),
					icon: 'landing-ui-agreement-type-1-icon'
				}, {
					id: 'type2',
					title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_2'),
					icon: 'landing-ui-agreement-type-2-icon'
				}, ...(acceptBySubmitEnabled ? [{
					id: 'type5',
					title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_5'),
					icon: 'landing-ui-agreement-type-5-icon',
					disabled: !acceptBySubmitAllowed
				}] : []), {
					id: 'type3',
					title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_3'),
					icon: 'landing-ui-agreement-type-3-icon'
				}, {
					id: 'type4',
					title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_4'),
					icon: 'landing-ui-agreement-type-4-icon'
				}]
			});
			this.configureBehaviorAccessibility(typeField);
			this.updateOptionalBehaviors(typeField, personal);
			const notice = this.createNoticeFields(agreement, agreementCode, typeField);
			const actions = [{
				id: 'edit',
				text: main_core.Loc.getMessage('LANDING_AGREEMENT_EDIT_BUTTON_LABEL'),
				onClick: () => this.editAgreement(agreement)
			}];
			if (this.options.formOptions?.data?.canViewAcceptedList === true) {
				actions.push({
					id: 'list',
					text: main_core.Loc.getMessage('LANDING_AGREEMENT_CONSENTS_BUTTON_LABEL'),
					onClick: () => this.openConsentsList(agreement)
				});
			}
			const form = new landing_ui_form_formsettingsform.FormSettingsForm({
				id: agreement.id,
				title: main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TITLE'),
				onChange: event => {
					if (this.destroyed) {
						return;
					}
					this.updateOptionalBehaviors(typeField, personal);
					this.updateBehaviorAccessibility(typeField);
					notice.update();
					this.emit('onChange', {
						...event.getData(),
						skipPrepare: true
					});
				},
				serializeModifier(value) {
					const type = value.type === 'type5' && !acceptBySubmitAllowed ? 'type1' : value.type;
					const behavior = {
						type5: {
							checked: true,
							required: true,
							acceptBySubmit: true
						},
						type1: {
							checked: true,
							required: true,
							acceptBySubmit: false
						},
						type2: {
							checked: false,
							required: true,
							acceptBySubmit: false
						},
						type3: {
							checked: true,
							required: false,
							acceptBySubmit: false
						},
						type4: {
							checked: false,
							required: false,
							acceptBySubmit: false
						}
					}[type];
					if (!behavior) {
						return {};
					}
					return {
						...behavior,
						...notice.serialize(value)
					};
				},
				fields: [typeField, ...notice.fields, new landing_ui_component_actionpanel.ActionPanel({
					left: actions
				})]
			});
			main_core.Dom.attr(form.getLayout(), 'data-testid', `landing-agreements-behavior-form-${agreement.id}`);
			return form;
		}
		configureBehaviorAccessibility(typeField) {
			const layout = typeField.getLayout();
			main_core.Dom.attr(layout, 'role', 'radiogroup');
			main_core.Dom.attr(layout, 'aria-label', main_core.Loc.getMessage('LANDING_AGREEMENT_FORM_TITLE'));
			layout.querySelectorAll('[data-value]').forEach(card => {
				main_core.Dom.attr(card, 'role', 'radio');
				main_core.Event.bind(card, 'keydown', event => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						card.click();
						return;
					}
					const direction = {
						ArrowRight: 1,
						ArrowDown: 1,
						ArrowLeft: -1,
						ArrowUp: -1
					}[event.key];
					if (!direction) {
						return;
					}
					event.preventDefault();
					const cards = [...layout.querySelectorAll('[data-value]')];
					const index = cards.indexOf(card);
					for (let offset = 1; offset <= cards.length; offset += 1) {
						const next = cards[(index + direction * offset + cards.length) % cards.length];
						if (next.getAttribute('aria-disabled') !== 'true') {
							next.focus();
							next.click();
							break;
						}
					}
				});
			});
			this.updateBehaviorAccessibility(typeField);
		}
		updateBehaviorAccessibility(typeField) {
			typeField.getLayout().querySelectorAll('[data-value]').forEach(card => {
				const selected = main_core.Dom.attr(card, 'data-value') === typeField.getValue();
				main_core.Dom.attr(card, 'aria-checked', String(selected));
				main_core.Dom.attr(card, 'tabindex', selected || card.getAttribute('aria-disabled') === 'true' ? '0' : '-1');
			});
		}
		isPersonalDataAgreement(agreement, agreementCode) {
			return main_core.Type.isBoolean(agreement.isPersonalDataAgreement) ? agreement.isPersonalDataAgreement : agreementCode === PERSONAL_DATA_AGREEMENT_CODE;
		}
		createNoticeFields(agreement, agreementCode, typeField) {
			const supported = this.options.formOptions?.data?.agreementNoticeSupported === true;
			const enabled = this.supportsAcceptBySubmit();
			const personal = this.isPersonalDataAgreement(agreement, agreementCode);
			if (!supported || !enabled || personal) {
				return {
					fields: [],
					update: () => {},
					serialize: () => ({})
				};
			}
			const textField = new landing_ui_field_textareafield.TextareaField({
				selector: 'agreementNoticeText',
				title: main_core.Loc.getMessage('LANDING_AGREEMENT_NOTICE_TEXT_FIELD_LABEL'),
				className: 'landing-ui-field-agreements-list-notice-text',
				content: '',
				height: 120,
				onValueChange: () => {
					const maximum = this.options.formOptions?.data?.agreementNoticeTextMaxLength;
					if (Number.isInteger(maximum) && maximum > 0) {
						textField.input.value = [...textField.input.value].slice(0, maximum).join('');
					}
				}
			});
			main_core.Event.bind(textField.input, 'input', () => textField.emit('onChange', {
				debouncePreview: true
			}));
			textField.input.value = agreement.agreementNoticeText || main_core.Loc.getMessage('LANDING_AGREEMENT_NOTICE_DEFAULT_TEXT') || '';
			main_core.Dom.attr(textField.input, 'data-testid', `landing-agreements-notice-text-${agreement.id}`);
			const helpLayout = main_core.Tag.render`
			<details class="landing-ui-field-agreements-list-notice-help">
				<summary>${main_core.Text.encode(main_core.Loc.getMessage('LANDING_AGREEMENT_NOTICE_HELP_LINK_TEXT') || '')}</summary>
				<div class="landing-ui-field-agreements-list-notice-help-text">
					${main_core.Text.encode(main_core.Loc.getMessage('LANDING_AGREEMENT_NOTICE_HELP_TEXT') || '')}
				</div>
			</details>
		`;
			main_core.Dom.attr(helpLayout, 'data-testid', `landing-agreements-notice-help-${agreement.id}`);
			main_core.Event.bind(helpLayout, 'click', event => {
				if (!event.target.closest('summary')) {
					helpLayout.open = !helpLayout.open;
				}
			});
			main_core.Dom.append(helpLayout, textField.getLayout());
			const switchField = new landing_ui_field_smallswitch.SmallSwitch({
				selector: 'agreementNoticeEnabled',
				title: main_core.Loc.getMessage('LANDING_AGREEMENT_NOTICE_SWITCH_LABEL'),
				className: 'landing-ui-field-agreements-list-notice-switch',
				value: agreement.agreementNoticeEnabled === true
			});
			const switchLayout = switchField.getLayout();
			main_core.Dom.prepend(switchField.slider, switchField.label);
			main_core.Dom.prepend(switchField.checkbox, switchField.label);
			let disabledHintKey = null;
			main_core.Dom.attr(switchField.checkbox, 'data-testid', `landing-agreements-notice-switch-${agreement.id}`);
			const update = () => {
				const available = supported && enabled && !personal && ['type3', 'type4'].includes(typeField.getValue());
				if (supported && enabled && !personal && !['type3', 'type4'].includes(typeField.getValue()) && switchField.getValue()) {
					switchField.setValue(false);
					switchField.adjustLabel();
				}
				switchField.checkbox.disabled = !available;
				main_core.Dom.attr(switchLayout, 'aria-disabled', String(!available));
				main_core.Dom.attr(switchLayout, 'tabindex', available ? null : '0');
				main_core.Dom.toggleClass(switchLayout, '--disabled', !available);
				const showText = available && switchField.getValue();
				main_core.Dom.style(textField.getLayout(), 'display', showText ? null : 'none');
				if (!showText) {
					helpLayout.open = false;
				}
				const key = available ? null : typeField.getValue() === 'type5' ? 'LANDING_AGREEMENT_NOTICE_DISABLED_ACCEPT_BY_SUBMIT_HINT' : 'LANDING_AGREEMENT_NOTICE_DISABLED_REQUIRED_HINT';
				if (disabledHintKey !== key) {
					disabledHintKey = key;
					this.removeHint(switchLayout);
					if (!available) {
						this.bindHint(switchLayout, main_core.Loc.getMessage(key) || '', 'top');
					}
				}
			};
			update();
			return {
				fields: [switchField, textField],
				update,
				serialize: value => supported && !personal ? {
					agreementNoticeEnabled: value.agreementNoticeEnabled === true,
					agreementNoticeText: String(value.agreementNoticeText || '').trim()
				} : {}
			};
		}
		removeHint(element) {
			this.hintBindings = this.hintBindings.filter(binding => {
				if (binding.element === element) {
					binding.destroy();
					return false;
				}
				return true;
			});
		}
		updateOptionalBehaviors(typeField, personal) {
			const disabled = personal && typeField.getValue() === 'type5';
			typeField.options.items.filter(item => item.id === 'type3' || item.id === 'type4').forEach(item => {
				if (item.disabled === disabled) {
					return;
				}
				item.disabled = disabled;
				const element = typeField.getLayout().querySelector(`[data-value="${item.id}"]`);
				main_core.Dom.toggleClass(element, 'landing-ui-disabled', disabled);
				main_core.Dom.attr(element, 'aria-disabled', String(disabled));
				main_core.Dom.attr(element, 'tabindex', disabled ? '0' : '-1');
				main_core.Dom.style(element, 'pointer-events', disabled ? 'auto' : null);
				this.removeHint(element);
				const hint = main_core.Loc.getMessage('LANDING_AGREEMENT_ACCEPT_BY_SUBMIT_HINT');
				if (disabled && main_core.Type.isStringFilled(hint)) {
					this.bindHint(element, hint);
				}
			});
		}
		getAgreementLoader() {
			return this.cache.remember('agreementLoader', () => {
				return new main_loader.Loader({
					size: 50,
					mode: 'inline',
					offset: {
						top: '5px',
						left: '225px'
					}
				});
			});
		}
		showAgreementLoader() {
			if (this.destroyed) {
				return Promise.resolve();
			}
			const loader = this.getAgreementLoader();
			const container = this.getListContainer();
			main_core.Dom.append(loader.layout, container);
			return loader.show(container);
		}
		hideAgreementLoader() {
			const loader = this.cache.get('agreementLoader');
			if (this.destroyed || !loader) {
				return Promise.resolve();
			}
			main_core.Dom.remove(loader.layout);
			return loader.hide();
		}
		onAgreementsMenuItemClick(itemOptions) {
			if (this.destroyed) {
				return;
			}
			void this.showAgreementLoader();
			crm_form_client.FormClient.getInstance().prepareOptions(this.options.formOptions, {
				agreements: [{
					id: itemOptions.id,
					...this.getInitialAgreementBehavior(itemOptions.code)
				}]
			}).then(result => {
				if (this.destroyed) {
					return;
				}
				const agreement = result.data.agreements.find(item => String(item.id) === String(itemOptions.id));
				if (agreement) {
					this.addItem(agreement);
					this.emit('onChange', {
						skipPrepare: true
					});
				}
			}).catch(errors => {
				if (!this.destroyed) {
					this.emit('onError', {
						errors
					});
				}
			}).finally(() => {
				void this.hideAgreementLoader();
			});
			this.refreshAgreementsMenu();
		}
		onSelectAgreementClick(event) {
			event.preventDefault();
			if (this.destroyed) {
				return;
			}
			const menu = this.getAgreementsMenu();
			if (!menu.getPopupWindow().isShown()) {
				menu.show();
			} else {
				menu.close();
			}
		}
		onCreateAgreementClick(event) {
			event.preventDefault();
			this.editAgreement({
				id: 0
			});
		}

		// eslint-disable-next-line class-methods-use-this
		onItemHeaderClick(agreement, event) {
			event.preventDefault();
			const {
				parentElement
			} = event.currentTarget;
			main_core.Dom.toggleClass(parentElement, 'landing-ui-field-agreements-list-item-active');
		}
		createItem(options, available = true) {
			const agreementListItem = this.getAgreementById(options.id);
			const item = new landing_ui_component_listitem.ListItem({
				id: options.id,
				title: agreementListItem?.name || options.content?.title || options.name || String(options.id),
				description: agreementListItem?.labelText || options.label || '',
				sourceOptions: options,
				draggable: true,
				editable: Boolean(agreementListItem) && available,
				removable: true,
				form: agreementListItem && available ? this.createItemForm(options, agreementListItem.code) : null,
				onRemove: this.onItemRemoveClick
			});
			if (item.options.editable) {
				main_core.Dom.attr(item.getEditButtonLayout(), 'data-testid', `landing-agreements-item-settings-${options.id}`);
			}
			main_core.Dom.attr(item.getRemoveButtonLayout(), 'data-testid', `landing-agreements-item-remove-${options.id}`);
			main_core.Dom.attr(item.getDragButtonLayout(), 'data-testid', `landing-agreements-item-drag-${options.id}`);
			return item;
		}
		setCurrentlyEdited(agreement) {
			this.cache.set('setCurrentlyEdited', agreement);
		}
		getCurrentlyEdited() {
			return this.cache.get('setCurrentlyEdited') || null;
		}

		// eslint-disable-next-line
		buildEditPath(agreementId) {
			return `/settings/configs/userconsent/edit/${agreementId}/?crm_webform_consent=Y`;
		}

		// eslint-disable-next-line
		buildConsentsListPath(agreementId) {
			return `/settings/configs/userconsent/consents/${agreementId}/`;
		}
		editAgreement(agreement) {
			if (this.destroyed) {
				return;
			}
			this.setCurrentlyEdited(agreement);
			const editPath = this.buildEditPath(agreement.id);
			BX.SidePanel.Instance.open(editPath, {
				cacheable: false,
				allowChangeHistory: false,
				events: {
					onClose: () => {
						if (this.getCurrentlyEdited() === agreement) {
							this.setCurrentlyEdited(null);
						}
					}
				}
			});
		}
		closeEditAgreementSlider() {
			const currentlyEdited = this.getCurrentlyEdited();
			this.setCurrentlyEdited(null);
			if (main_core.Type.isPlainObject(currentlyEdited)) {
				const path = this.buildEditPath(currentlyEdited.id);
				const slider = BX.SidePanel.Instance.getSlider(path);
				if (slider) {
					slider.close();
				}
			}
		}
		openConsentsList(agreement) {
			const editPath = this.buildConsentsListPath(agreement.id);
			BX.SidePanel.Instance.open(editPath, {
				cacheable: false,
				allowChangeHistory: false
			});
		}
		onUserConsentEditCancel() {
			if (!this.destroyed && this.getCurrentlyEdited()) {
				this.closeEditAgreementSlider();
			}
		}
		onUserConsentEditSave(payload) {
			const currentlyEdited = this.getCurrentlyEdited();
			if (this.destroyed || !currentlyEdited) {
				return;
			}
			const agreementId = payload?.agreementId;
			const hasAgreementId = Number.isInteger(agreementId) && agreementId > 0;
			if (payload !== undefined && !hasAgreementId) {
				return;
			}
			if (hasAgreementId && Number(currentlyEdited.id) !== 0 && String(currentlyEdited.id) !== String(agreementId)) {
				return;
			}
			this.closeEditAgreementSlider();
			void this.showAgreementLoader();
			return this.loadAgreementsList().then(agreements => {
				if (this.destroyed) {
					return;
				}
				this.setAgreementsList(agreements);
				landing_ui_panel_formsettingspanel.FormSettingsPanel.getInstance().setAgreements(agreements);
				this.refreshAgreementsMenu();
				if (!hasAgreementId) {
					this.getAgreementsMenu().show();
					return;
				}
				const value = this.getValue();
				if (Number(currentlyEdited.id) === 0) {
					const agreement = this.getAgreementById(agreementId);
					if (!agreement) {
						this.getAgreementsMenu().show();
						return;
					}
					if (!value.some(item => String(item.id) === String(agreementId))) {
						value.push({
							id: agreementId,
							...this.getInitialAgreementBehavior(agreement.code)
						});
					}
				}
				return crm_form_client.FormClient.getInstance().prepareOptions(this.options.formOptions, {
					agreements: value
				}).then(result => {
					if (this.destroyed) {
						return;
					}
					this.replaceItems(result.data.agreements, value);
					this.refreshAgreementsMenu();
					this.emit('onChange', {
						skipPrepare: true
					});
				});
			}).catch(errors => {
				if (!this.destroyed) {
					this.emit('onError', {
						errors
					});
				}
			}).finally(() => {
				void this.hideAgreementLoader();
			});
		}
		onItemRemoveClick(event) {
			if (this.destroyed) {
				return;
			}
			const value = event.getTarget().getValue();
			this.destroyItem(event.getTarget());
			this.items = this.items.filter(item => {
				return String(item.options.id) !== String(value.id);
			});
			this.refreshAgreementsMenu();
			this.emit('onItemRemove', {
				item: value
			});
			this.emit('onChange', {
				skipPrepare: true
			});
		}
		onDragEnd() {
			if (this.destroyed) {
				return;
			}
			const items = this.items;
			this.items = [];
			[...this.getListContainer().children].forEach(element => {
				const id = main_core.Dom.attr(element, 'data-id');
				const item = items.find(currentItem => {
					return String(currentItem.options.id) === String(id);
				});
				if (item) {
					this.items.push(item);
				}
			});
			this.emit('onChange', {
				skipPrepare: true
			});
		}
		bindHint(element, text, position = 'bottom') {
			const description = main_core.Tag.render`<span id="${main_core.Text.getRandom()}" hidden>${text}</span>`;
			main_core.Dom.append(description, element);
			main_core.Dom.attr(element, 'aria-describedby', description.id);
			main_core.Dom.attr(element, ui_hint.Hint.attributeInteractivityName, true);
			let popup = null;
			let popupContainer = null;
			let popupRole = null;
			let hideTimer = null;
			let cardHovered = false;
			let popupHovered = false;
			const ownerDocument = element.ownerDocument;
			const releasePopup = () => {
				clearTimeout(hideTimer);
				popupHovered = false;
				if (popupContainer) {
					main_core.Event.unbind(popupContainer, 'mouseenter', enterPopup);
					main_core.Event.unbind(popupContainer, 'mouseleave', leavePopup, true);
					main_core.Dom.attr(popupContainer, 'role', popupRole);
				}
				main_core.Event.unbind(ownerDocument, 'keydown', keydown, true);
				popup?.unsubscribe('onClose', releasePopup);
				popup?.unsubscribe('onDestroy', releasePopup);
				popup = null;
				popupContainer = null;
			};
			const hide = () => {
				clearTimeout(hideTimer);
				if (main_popup.PopupManager.getPopupById(ui_hint.Hint.id)?.bindElement === element) {
					ui_hint.Hint.hide();
				}
				releasePopup();
			};
			const scheduleHide = () => {
				clearTimeout(hideTimer);
				hideTimer = setTimeout(() => {
					if (!cardHovered && !popupHovered && ownerDocument.activeElement !== element) {
						hide();
					}
				}, 100);
			};
			const enterPopup = () => {
				popupHovered = true;
				clearTimeout(hideTimer);
			};
			const leavePopup = event => {
				if (popup?.bindElement === element) {
					event.stopImmediatePropagation();
					popupHovered = false;
					scheduleHide();
				}
			};
			const keydown = event => {
				if (event.key === 'Escape' && popup?.isShown() && popup.bindElement === element) {
					event.stopPropagation();
					hide();
				}
			};
			const show = () => {
				if (this.destroyed) {
					return;
				}
				releasePopup();
				ui_hint.Hint.show(element, text);
				popup = main_popup.PopupManager.getPopupById(ui_hint.Hint.id);
				if (position === 'top') {
					popup.adjustPosition({
						position: 'top',
						forceBindPosition: true
					});
				}
				popupContainer = popup.getPopupContainer();
				popupRole = main_core.Dom.attr(popupContainer, 'role');
				main_core.Dom.attr(popupContainer, 'role', 'tooltip');
				main_core.Event.bind(popupContainer, 'mouseenter', enterPopup);
				main_core.Event.bind(popupContainer, 'mouseleave', leavePopup, true);
				main_core.Event.bind(ownerDocument, 'keydown', keydown, true);
				popup.subscribe('onClose', releasePopup);
				popup.subscribe('onDestroy', releasePopup);
			};
			const enter = () => {
				cardHovered = true;
				show();
			};
			const leave = () => {
				cardHovered = false;
				scheduleHide();
			};
			const activate = event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					show();
				}
			};
			const destroy = () => {
				hide();
				main_core.Event.unbind(element, 'mouseenter', enter);
				main_core.Event.unbind(element, 'mouseleave', leave);
				main_core.Event.unbind(element, 'focus', show);
				main_core.Event.unbind(element, 'blur', scheduleHide);
				main_core.Event.unbind(element, 'click', show);
				main_core.Event.unbind(element, 'keydown', activate);
				main_core.Dom.attr(element, 'aria-describedby', null);
				main_core.Dom.attr(element, ui_hint.Hint.attributeInteractivityName, null);
				main_core.Dom.remove(description);
			};
			main_core.Event.bind(element, 'mouseenter', enter);
			main_core.Event.bind(element, 'mouseleave', leave);
			main_core.Event.bind(element, 'focus', show);
			main_core.Event.bind(element, 'blur', scheduleHide);
			main_core.Event.bind(element, 'click', show);
			main_core.Event.bind(element, 'keydown', activate);
			const binding = {
				element,
				destroy,
				show,
				hide
			};
			this.hintBindings.push(binding);
			return binding;
		}
		destroyItem(item) {
			const form = item.options.form;
			if (form) {
				const layout = form.getLayout();
				const popup = main_popup.PopupManager.getPopupById(ui_hint.Hint.id);
				if (popup && main_core.Type.isDomNode(popup.bindElement) && layout.contains(popup.bindElement)) {
					ui_hint.Hint.hide();
					popup.setBindElement(layout.ownerDocument.body);
				}
				this.hintBindings = this.hintBindings.filter(({
					element,
					destroy
				}) => {
					if (layout.contains(element)) {
						destroy();
						return false;
					}
					return true;
				});
				this.unbindLayout(layout);
				form.clear();
				form.unsubscribeAll('onChange');
			}
			item.unsubscribeAll('onRemove');
			item.unsubscribeAll('onFormChange');
			this.unbindLayout(item.getLayout());
			main_core.Dom.remove(item.getLayout());
		}
		unbindLayout(layout) {
			[layout, ...layout.querySelectorAll('*')].forEach(element => main_core.Event.unbindAll(element));
		}
		destroy() {
			if (this.destroyed) {
				return;
			}
			this.destroyed = true;
			const removeCustomEvent = main_core.Reflection.getClass('top.BX.removeCustomEvent');
			removeCustomEvent(window.top, 'main-user-consent-to-list', this.onUserConsentEditCancel);
			removeCustomEvent(window.top, 'main-user-consent-saved', this.onUserConsentEditSave);
			this.closeEditAgreementSlider();
			this.refreshAgreementsMenu();
			this.draggable.unsubscribe('end', this.onDragEnd);
			this.draggable.destroy();
			this.draggable = null;
			this.items.forEach(item => this.destroyItem(item));
			this.items = [];
			const loader = this.cache.get('agreementLoader');
			if (loader) {
				loader.destroy();
				this.cache.delete('agreementLoader');
			}
			main_core.Event.unbind(this.input, 'paste', this.onPaste);
			this.unbindLayout(this.layout);
			this.unsubscribeAll('onChange');
			this.unsubscribeAll('onItemRemove');
			this.unsubscribeAll('onError');
			main_core.Dom.remove(this.layout);
		}
		getValue() {
			return this.items.map(item => item.getValue());
		}
	}

	exports.AgreementsList = AgreementsList;

})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, window, window, BX.UI, BX, BX.Main, BX.Landing.UI.Field, BX.UI.DragAndDrop, BX.Landing.UI.Field, BX.Landing.UI.Field, BX.Landing.UI.Field, BX.Landing.UI.Form, BX.Crm.Form, BX.Landing.UI.Component, BX.Landing.UI.Component, BX, BX.Landing, BX.Landing.UI.Panel);
//# sourceMappingURL=agreementslist.bundle.js.map
