import 'ui.design-tokens';
import 'ui.design-tokens.air';
import {Hint} from 'ui.hint';

import {Dom, Event, Loc, Reflection, Runtime, Tag, Text, Type} from 'main.core';
import {Menu, PopupManager} from 'main.popup';
import {BaseField} from 'landing.ui.field.basefield';
import {Draggable} from 'ui.draganddrop.draggable';
import {RadioButtonField} from 'landing.ui.field.radiobuttonfield';
import { SmallSwitch } from 'landing.ui.field.smallswitch';
import { TextareaField } from 'landing.ui.field.textareafield';
import {FormSettingsForm} from 'landing.ui.form.formsettingsform';
import {FormClient} from 'crm.form.client';
import {ListItem} from 'landing.ui.component.listitem';
import {ActionPanel} from 'landing.ui.component.actionpanel';
import {Loader} from 'main.loader';
import {Backend} from 'landing.backend';
import {FormSettingsPanel} from 'landing.ui.panel.formsettingspanel';

import {
	getAgreementBehaviorType,
	getInitialAgreementBehavior as getInitialAgreementBehaviorValue,
	PERSONAL_DATA_AGREEMENT_CODE,
} from './agreement-behavior';

import './css/style.css';

type Agreement = {
	id: string,
	checked: boolean,
	label: string,
	name: string,
	required: boolean,
	acceptBySubmit: boolean,
	acceptBySubmitAllowed?: boolean,
	isPersonalDataAgreement?: boolean,
	agreementNoticeEnabled?: boolean,
	agreementNoticeText?: string,
	value: 'Y' | 'N',
	content: {
		text: string,
		title: string,
		url: ?string,
	},
};

type AgreementsListItem = {
	id: string | number,
	name: string,
	labelText: string,
	code?: string,
};

/**
 * @memberOf BX.Landing.UI.Field
 */
export class AgreementsList extends BaseField
{
	constructor(options)
	{
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

		Dom.attr(this.layout, 'data-testid', 'landing-agreements-root');
		Dom.replace(this.input, this.getListContainer());
		Dom.append(this.getActionsContainer(), this.layout);

		void this.showAgreementLoader();

		FormClient
			.getInstance()
			.prepareOptions(this.options.formOptions, {agreements: this.options.value})
			.then((result) => {
				if (this.destroyed)
				{
					return;
				}

				this.replaceItems(result.data.agreements, this.options.value);
				this.emit('onChange', {skipPrepare: true});
			})
			.catch((errors) => {
				if (!this.destroyed)
				{
					this.options.value.forEach((agreement) => this.addItem(agreement, false));
					this.emit('onError', {errors});
				}
			})
			.finally(() => {
				void this.hideAgreementLoader();
			});

		this.draggable = new Draggable({
			context: window.parent,
			container: this.getListContainer(),
			draggable: '.landing-ui-component-list-item',
			dragElement: '.landing-ui-button-icon-drag',
			type: Draggable.MOVE,
			offset: {
				y: -62,
			},
		});

		this.draggable.subscribe('end', this.onDragEnd);

		const addCustomEvent = Reflection.getClass('top.BX.addCustomEvent');
		addCustomEvent(window.top, 'main-user-consent-to-list', this.onUserConsentEditCancel);
		addCustomEvent(window.top, 'main-user-consent-saved', this.onUserConsentEditSave);
	}

	getAgreementsList(): Array<AgreementsListItem>
	{
		return this.cache.remember('agreementsList', () => {
			return this.options.agreementsList || [];
		});
	}

	setAgreementsList(agreements: Array<AgreementsListItem>)
	{
		this.cache.set('agreementsList', agreements);
	}

	isNewForm(): boolean
	{
		return !this.options.formOptions.id;
	}

	supportsAcceptBySubmit(): boolean
	{
		const data = this.options.formOptions?.data;
		return data?.schemaVersion >= 2 && data.acceptBySubmitEnabled === true;
	}

	getInitialAgreementBehavior(agreementCode: ?string): Object
	{
		const behavior = getInitialAgreementBehaviorValue(agreementCode, this.isNewForm() && this.supportsAcceptBySubmit());
		if (this.options.formOptions?.data?.agreementNoticeSupported === true
			&& agreementCode !== PERSONAL_DATA_AGREEMENT_CODE)
		{
			return { ...behavior, agreementNoticeEnabled: false, agreementNoticeText: '' };
		}

		return behavior;
	}

	loadAgreementsList(): Promise<Array<AgreementsListItem>>
	{
		return Backend.getInstance()
			.action('Form::getAgreements')
			.then((agreements) => {
				return Runtime.orderBy(agreements, ['id'], ['asc']);
			});
	}

	getAgreementById(id: string | number): ?AgreementsListItem
	{
		return this.getAgreementsList().find((agreement) => {
			return String(id) === String(agreement.id);
		});
	}

	addItem(itemOptions, available: boolean = true)
	{
		if (this.destroyed || this.items.some((item) => String(item.options.id) === String(itemOptions.id)))
		{
			return;
		}

		const item = this.createItem(itemOptions, available);
		item.appendTo(this.getListContainer());
		this.items.push(item);
	}

	replaceItems(agreements: Array<Agreement>, value: Array<Agreement>)
	{
		this.items.forEach((item) => this.destroyItem(item));
		this.items = [];
		value.forEach((agreement) => {
			const prepared = agreements.find((item) => String(item.id) === String(agreement.id));
			this.addItem(prepared || agreement, Boolean(prepared));
		});
	}

	getListContainer(): HTMLDivElement
	{
		return this.cache.remember('listContainer', () => {
			return Tag.render`<div class="landing-ui-field-agreements-list-container" data-testid="landing-agreements-list"></div>`;
		});
	}

	getActionsContainer(): HTMLDivElement
	{
		return this.cache.remember('actionsContainer', () => {
			return Tag.render`
				<div class="landing-ui-field-agreements-list-actions-container">
					${this.getSelectAgreementButton()}
					${this.getCreateAgreementButton()}
				</div>
			`;
		});
	}

	getSelectAgreementButton(): HTMLSpanElement
	{
		return this.cache.remember('selectAgreementButton', () => {
			return Tag.render`
				<span class="landing-ui-field-agreements-list-actions-button" role="button" tabindex="0"
						data-testid="landing-agreements-select-btn" onclick="${this.onSelectAgreementClick}"
						onkeydown="${this.onActionKeyDown.bind(this)}">
					${Loc.getMessage('LANDING_AGREEMENT_LIST_SELECT_BUTTON_LABEL')}
				</span>
			`;
		});
	}

	getCreateAgreementButton(): HTMLSpanElement
	{
		return this.cache.remember('createAgreementButton', () => {
			return Tag.render`
				<span class="landing-ui-field-agreements-list-actions-button" role="button" tabindex="0"
						data-testid="landing-agreements-create-btn" onclick="${this.onCreateAgreementClick}"
						onkeydown="${this.onActionKeyDown.bind(this)}">
					${Loc.getMessage('LANDING_AGREEMENT_LIST_CREATE_BUTTON_LABEL')}
				</span>
			`;
		});
	}

	onActionKeyDown(event: KeyboardEvent)
	{
		if (event.key === 'Enter' || event.key === ' ')
		{
			event.preventDefault();
			event.currentTarget.click();
		}
	}

	getSelectedAgreements(): Array<number>
	{
		return [...this.getListContainer().children].map((item) => {
			return Dom.attr(item, 'data-value');
		});
	}

	getAgreementsMenu(): Menu
	{
		return this.cache.remember('agreementsMenu', () => {
			const menu = new Menu({
				bindElement: this.getSelectAgreementButton(),
				autoHide: true,
				maxWidth: 400,
				maxHeight: 205,
				events: {
					onPopupShow: () => {
						clearTimeout(this.menuPositionTimer);
						this.menuPositionTimer = setTimeout(() => {
							if (this.destroyed)
							{
								return;
							}

							Dom.style(menu.getMenuContainer(), {
								left: '0px',
								right: 'auto',
								top: '30px',
							});
						});
					},
				},
			});

			Dom.attr(menu.getMenuContainer(), 'data-testid', 'landing-agreements-select-menu');

			this.getAgreementsList()
				.filter((agreement) => {
					return !this.items.some((item) => {
						return String(item.options.id) === String(agreement.id);
					});
				})
				.forEach((agreement) => {
					menu.addMenuItem({
						id: agreement.id,
						dataset: {testid: `landing-agreements-select-item-${agreement.id}`},
						text: agreement.name,
						onclick: this.onAgreementsMenuItemClick.bind(this, agreement),
					});
				});

			Dom.append(menu.getMenuContainer(), this.getActionsContainer());

			return menu;
		});
	}

	refreshAgreementsMenu()
	{
		clearTimeout(this.menuPositionTimer);
		const agreementsMenu = this.cache.get('agreementsMenu');
		if (agreementsMenu)
		{
			agreementsMenu.close();
			agreementsMenu.destroy();
			this.cache.delete('agreementsMenu');
		}
	}

	createItemForm(agreement: Agreement, agreementCode: ?string)
	{
		const personal = this.isPersonalDataAgreement(agreement, agreementCode);
		const acceptBySubmitEnabled = this.supportsAcceptBySubmit();
		const acceptBySubmitAllowed = acceptBySubmitEnabled && (
			Type.isBoolean(agreement.acceptBySubmitAllowed)
				? agreement.acceptBySubmitAllowed
				: agreementCode === PERSONAL_DATA_AGREEMENT_CODE
		)
		;

		const typeField = new RadioButtonField({
			selector: 'type',
			value: getAgreementBehaviorType({
				...agreement,
				acceptBySubmit: acceptBySubmitAllowed && agreement.acceptBySubmit === true,
			}),
			items: [
				{
					id: 'type1',
					title: Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_1'),
					icon: 'landing-ui-agreement-type-1-icon',
				},
				{
					id: 'type2',
					title: Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_2'),
					icon: 'landing-ui-agreement-type-2-icon',
				},
				...(acceptBySubmitEnabled ? [{
					id: 'type5',
					title: Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_5'),
					icon: 'landing-ui-agreement-type-5-icon',
					disabled: !acceptBySubmitAllowed,
				}] : []),
				{
					id: 'type3',
					title: Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_3'),
					icon: 'landing-ui-agreement-type-3-icon',
				},
				{
					id: 'type4',
					title: Loc.getMessage('LANDING_AGREEMENT_FORM_TYPE_FIELD_ITEM_4'),
					icon: 'landing-ui-agreement-type-4-icon',
				},
			],
		});

		this.configureBehaviorAccessibility(typeField);
		this.updateOptionalBehaviors(typeField, personal);
		const notice = this.createNoticeFields(agreement, agreementCode, typeField);
		const actions = [
			{
				id: 'edit',
				text: Loc.getMessage('LANDING_AGREEMENT_EDIT_BUTTON_LABEL'),
				onClick: () => this.editAgreement(agreement),
			},
		];
		if (this.options.formOptions?.data?.canViewAcceptedList === true)
		{
			actions.push({
				id: 'list',
				text: Loc.getMessage('LANDING_AGREEMENT_CONSENTS_BUTTON_LABEL'),
				onClick: () => this.openConsentsList(agreement),
			});
		}

		const form = new FormSettingsForm({
			id: agreement.id,
			title: Loc.getMessage('LANDING_AGREEMENT_FORM_TITLE'),
			onChange: (event) => {
				if (this.destroyed)
				{
					return;
				}

				this.updateOptionalBehaviors(typeField, personal);
				this.updateBehaviorAccessibility(typeField);
				notice.update();
				this.emit('onChange', { ...event.getData(), skipPrepare: true });
			},
			serializeModifier(value) {
				const type = value.type === 'type5' && !acceptBySubmitAllowed ? 'type1' : value.type;
				const behavior = {
					type5: {
						checked: true,
						required: true,
						acceptBySubmit: true,
					},
					type1: {
						checked: true,
						required: true,
						acceptBySubmit: false,
					},
					type2: {
						checked: false,
						required: true,
						acceptBySubmit: false,
					},
					type3: {
						checked: true,
						required: false,
						acceptBySubmit: false,
					},
					type4: {
						checked: false,
						required: false,
						acceptBySubmit: false,
					},
				}[type];

				if (!behavior)
				{
					return {};
				}

				return { ...behavior, ...notice.serialize(value) };
			},
			fields: [
				typeField,
				...notice.fields,
				new ActionPanel({
					left: actions,
				}),
			],
		});
		Dom.attr(form.getLayout(), 'data-testid', `landing-agreements-behavior-form-${agreement.id}`);

		return form;
	}

	configureBehaviorAccessibility(typeField: RadioButtonField)
	{
		const layout = typeField.getLayout();
		Dom.attr(layout, 'role', 'radiogroup');
		Dom.attr(layout, 'aria-label', Loc.getMessage('LANDING_AGREEMENT_FORM_TITLE'));
		layout.querySelectorAll('[data-value]').forEach((card) => {
			Dom.attr(card, 'role', 'radio');
			Event.bind(card, 'keydown', (event) => {
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.preventDefault();
					card.click();

					return;
				}

				const direction = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
				if (!direction)
				{
					return;
				}

				event.preventDefault();
				const cards = [...layout.querySelectorAll('[data-value]')];
				const index = cards.indexOf(card);
				for (let offset = 1; offset <= cards.length; offset += 1)
				{
					const next = cards[(index + direction * offset + cards.length) % cards.length];
					if (next.getAttribute('aria-disabled') !== 'true')
					{
						next.focus();
						next.click();
						break;
					}
				}
			});
		});
		this.updateBehaviorAccessibility(typeField);
	}

	updateBehaviorAccessibility(typeField: RadioButtonField)
	{
		typeField.getLayout().querySelectorAll('[data-value]').forEach((card) => {
			const selected = Dom.attr(card, 'data-value') === typeField.getValue();
			Dom.attr(card, 'aria-checked', String(selected));
			Dom.attr(card, 'tabindex', selected || card.getAttribute('aria-disabled') === 'true' ? '0' : '-1');
		});
	}

	isPersonalDataAgreement(agreement: Agreement, agreementCode: ?string): boolean
	{
		return Type.isBoolean(agreement.isPersonalDataAgreement)
			? agreement.isPersonalDataAgreement
			: agreementCode === PERSONAL_DATA_AGREEMENT_CODE;
	}

	createNoticeFields(agreement: Agreement, agreementCode: ?string, typeField: RadioButtonField): Object
	{
		const supported = this.options.formOptions?.data?.agreementNoticeSupported === true;
		const enabled = this.supportsAcceptBySubmit();
		const personal = this.isPersonalDataAgreement(agreement, agreementCode);
		if (!supported || !enabled || personal)
		{
			return { fields: [], update: () => {}, serialize: () => ({}) };
		}

		const textField = new TextareaField({
			selector: 'agreementNoticeText',
			title: Loc.getMessage('LANDING_AGREEMENT_NOTICE_TEXT_FIELD_LABEL'),
			className: 'landing-ui-field-agreements-list-notice-text',
			content: '',
			height: 120,
			onValueChange: () => {
				const maximum = this.options.formOptions?.data?.agreementNoticeTextMaxLength;
				if (Number.isInteger(maximum) && maximum > 0)
				{
					textField.input.value = [...textField.input.value].slice(0, maximum).join('');
				}
			},
		});
		Event.bind(textField.input, 'input', () => textField.emit('onChange', { debouncePreview: true }));
		textField.input.value = agreement.agreementNoticeText || Loc.getMessage('LANDING_AGREEMENT_NOTICE_DEFAULT_TEXT') || '';
		Dom.attr(textField.input, 'data-testid', `landing-agreements-notice-text-${agreement.id}`);
		const helpLayout = Tag.render`
			<details class="landing-ui-field-agreements-list-notice-help">
				<summary>${Text.encode(Loc.getMessage('LANDING_AGREEMENT_NOTICE_HELP_LINK_TEXT') || '')}</summary>
				<div class="landing-ui-field-agreements-list-notice-help-text">
					${Text.encode(Loc.getMessage('LANDING_AGREEMENT_NOTICE_HELP_TEXT') || '')}
				</div>
			</details>
		`;
		Dom.attr(helpLayout, 'data-testid', `landing-agreements-notice-help-${agreement.id}`);
		Event.bind(helpLayout, 'click', (event) => {
			if (!event.target.closest('summary'))
			{
				helpLayout.open = !helpLayout.open;
			}
		});
		Dom.append(helpLayout, textField.getLayout());
		const switchField = new SmallSwitch({
			selector: 'agreementNoticeEnabled',
			title: Loc.getMessage('LANDING_AGREEMENT_NOTICE_SWITCH_LABEL'),
			className: 'landing-ui-field-agreements-list-notice-switch',
			value: agreement.agreementNoticeEnabled === true,
		});
		const switchLayout = switchField.getLayout();
		Dom.prepend(switchField.slider, switchField.label);
		Dom.prepend(switchField.checkbox, switchField.label);
		let disabledHintKey = null;
		Dom.attr(switchField.checkbox, 'data-testid', `landing-agreements-notice-switch-${agreement.id}`);
		const update = () => {
			const available = supported && enabled && !personal && ['type3', 'type4'].includes(typeField.getValue());
			if (supported && enabled && !personal && !['type3', 'type4'].includes(typeField.getValue())
				&& switchField.getValue())
			{
				switchField.setValue(false);
				switchField.adjustLabel();
			}

			switchField.checkbox.disabled = !available;
			Dom.attr(switchLayout, 'aria-disabled', String(!available));
			Dom.attr(switchLayout, 'tabindex', available ? null : '0');
			Dom.toggleClass(switchLayout, '--disabled', !available);
			const showText = available && switchField.getValue();
			Dom.style(textField.getLayout(), 'display', showText ? null : 'none');
			if (!showText)
			{
				helpLayout.open = false;
			}
			const key = available ? null : (typeField.getValue() === 'type5'
				? 'LANDING_AGREEMENT_NOTICE_DISABLED_ACCEPT_BY_SUBMIT_HINT'
				: 'LANDING_AGREEMENT_NOTICE_DISABLED_REQUIRED_HINT');
			if (disabledHintKey !== key)
			{
				disabledHintKey = key;
				this.removeHint(switchLayout);
				if (!available)
				{
					this.bindHint(switchLayout, Loc.getMessage(key) || '', 'top');
				}
			}
		};
		update();

		return {
			fields: [switchField, textField],
			update,
			serialize: (value) => (supported && !personal ? {
				agreementNoticeEnabled: value.agreementNoticeEnabled === true,
				agreementNoticeText: String(value.agreementNoticeText || '').trim(),
			} : {}),
		};
	}

	removeHint(element: HTMLElement)
	{
		this.hintBindings = this.hintBindings.filter((binding) => {
			if (binding.element === element)
			{
				binding.destroy();

				return false;
			}

			return true;
		});
	}

	updateOptionalBehaviors(typeField: RadioButtonField, personal: boolean)
	{
		const disabled = personal && typeField.getValue() === 'type5';
		typeField.options.items.filter((item) => item.id === 'type3' || item.id === 'type4').forEach((item) => {
			if (item.disabled === disabled)
			{
				return;
			}

			item.disabled = disabled;
			const element = typeField.getLayout().querySelector(`[data-value="${item.id}"]`);
			Dom.toggleClass(element, 'landing-ui-disabled', disabled);
			Dom.attr(element, 'aria-disabled', String(disabled));
			Dom.attr(element, 'tabindex', disabled ? '0' : '-1');
			Dom.style(element, 'pointer-events', disabled ? 'auto' : null);
			this.removeHint(element);
			const hint = Loc.getMessage('LANDING_AGREEMENT_ACCEPT_BY_SUBMIT_HINT');
			if (disabled && Type.isStringFilled(hint))
			{
				this.bindHint(element, hint);
			}
		});
	}

	getAgreementLoader(): Loader
	{
		return this.cache.remember('agreementLoader', () => {
			return new Loader({
				size: 50,
				mode: 'inline',
				offset: {
					top: '5px',
					left: '225px',
				},
			});
		});
	}

	showAgreementLoader(): Promise
	{
		if (this.destroyed)
		{
			return Promise.resolve();
		}

		const loader = this.getAgreementLoader();
		const container = this.getListContainer();
		Dom.append(loader.layout, container);
		return loader.show(container);
	}

	hideAgreementLoader(): Promise
	{
		const loader = this.cache.get('agreementLoader');
		if (this.destroyed || !loader)
		{
			return Promise.resolve();
		}

		Dom.remove(loader.layout);
		return loader.hide();
	}

	onAgreementsMenuItemClick(itemOptions)
	{
		if (this.destroyed)
		{
			return;
		}

		void this.showAgreementLoader();

		FormClient
			.getInstance()
			.prepareOptions(this.options.formOptions, {
				agreements: [{
					id: itemOptions.id,
					...this.getInitialAgreementBehavior(itemOptions.code),
				}],
			})
			.then((result) => {
				if (this.destroyed)
				{
					return;
				}

				const agreement = result.data.agreements.find((item) => String(item.id) === String(itemOptions.id));
				if (agreement)
				{
					this.addItem(agreement);
					this.emit('onChange', {skipPrepare: true});
				}
			})
			.catch((errors) => {
				if (!this.destroyed)
				{
					this.emit('onError', {errors});
				}
			})
			.finally(() => {
				void this.hideAgreementLoader();
			});

		this.refreshAgreementsMenu();
	}

	onSelectAgreementClick(event: MouseEvent)
	{
		event.preventDefault();
		if (this.destroyed)
		{
			return;
		}

		const menu = this.getAgreementsMenu();
		if (!menu.getPopupWindow().isShown())
		{
			menu.show();
		}
		else
		{
			menu.close();
		}
	}

	onCreateAgreementClick(event: MouseEvent)
	{
		event.preventDefault();
		this.editAgreement({id: 0});
	}

	// eslint-disable-next-line class-methods-use-this
	onItemHeaderClick(agreement: Agreement, event: MouseEvent)
	{
		event.preventDefault();

		const {parentElement} = event.currentTarget;

		Dom.toggleClass(parentElement, 'landing-ui-field-agreements-list-item-active');
	}

	createItem(options: Agreement, available: boolean = true): ListItem
	{
		const agreementListItem = this.getAgreementById(options.id);

		const item = new ListItem({
			id: options.id,
			title: agreementListItem?.name || options.content?.title || options.name || String(options.id),
			description: agreementListItem?.labelText || options.label || '',
			sourceOptions: options,
			draggable: true,
			editable: Boolean(agreementListItem) && available,
			removable: true,
			form: agreementListItem && available
				? this.createItemForm(options, agreementListItem.code)
				: null,
			onRemove: this.onItemRemoveClick,
		});
		if (item.options.editable)
		{
			Dom.attr(item.getEditButtonLayout(), 'data-testid', `landing-agreements-item-settings-${options.id}`);
		}

		Dom.attr(item.getRemoveButtonLayout(), 'data-testid', `landing-agreements-item-remove-${options.id}`);
		Dom.attr(item.getDragButtonLayout(), 'data-testid', `landing-agreements-item-drag-${options.id}`);

		return item;
	}

	setCurrentlyEdited(agreement: ?Agreement)
	{
		this.cache.set('setCurrentlyEdited', agreement);
	}

	getCurrentlyEdited(): ?Agreement
	{
		return this.cache.get('setCurrentlyEdited') || null;
	}

	// eslint-disable-next-line
	buildEditPath(agreementId): string
	{
		return `/settings/configs/userconsent/edit/${agreementId}/?crm_webform_consent=Y`;
	}

	// eslint-disable-next-line
	buildConsentsListPath(agreementId)
	{
		return `/settings/configs/userconsent/consents/${agreementId}/`;
	}

	editAgreement(agreement: Agreement)
	{
		if (this.destroyed)
		{
			return;
		}

		this.setCurrentlyEdited(agreement);

		const editPath = this.buildEditPath(agreement.id);
		BX.SidePanel.Instance.open(
			editPath,
			{
				cacheable: false,
				allowChangeHistory: false,
				events: {
					onClose: () => {
						if (this.getCurrentlyEdited() === agreement)
						{
							this.setCurrentlyEdited(null);
						}
					},
				},
			},
		);
	}

	closeEditAgreementSlider()
	{
		const currentlyEdited = this.getCurrentlyEdited();
		this.setCurrentlyEdited(null);
		if (Type.isPlainObject(currentlyEdited))
		{
			const path = this.buildEditPath(currentlyEdited.id);
			const slider = BX.SidePanel.Instance.getSlider(path);
			if (slider)
			{
				slider.close();
			}
		}
	}

	openConsentsList(agreement: Agreement)
	{
		const editPath = this.buildConsentsListPath(agreement.id);
		BX.SidePanel.Instance.open(
			editPath,
			{
				cacheable: false,
				allowChangeHistory: false,
			},
		);
	}

	onUserConsentEditCancel()
	{
		if (!this.destroyed && this.getCurrentlyEdited())
		{
			this.closeEditAgreementSlider();
		}
	}

	onUserConsentEditSave(payload)
	{
		const currentlyEdited = this.getCurrentlyEdited();
		if (this.destroyed || !currentlyEdited)
		{
			return;
		}

		const agreementId = payload?.agreementId;
		const hasAgreementId = Number.isInteger(agreementId) && agreementId > 0;
		if (payload !== undefined && !hasAgreementId)
		{
			return;
		}

		if (hasAgreementId && Number(currentlyEdited.id) !== 0 && String(currentlyEdited.id) !== String(agreementId))
		{
			return;
		}

		this.closeEditAgreementSlider();
		void this.showAgreementLoader();

		return this.loadAgreementsList()
			.then((agreements) => {
				if (this.destroyed)
				{
					return;
				}

				this.setAgreementsList(agreements);
				FormSettingsPanel.getInstance().setAgreements(agreements);
				this.refreshAgreementsMenu();

				if (!hasAgreementId)
				{
					this.getAgreementsMenu().show();
					return;
				}

				const value = this.getValue();
				if (Number(currentlyEdited.id) === 0)
				{
					const agreement = this.getAgreementById(agreementId);
					if (!agreement)
					{
						this.getAgreementsMenu().show();
						return;
					}

					if (!value.some((item) => String(item.id) === String(agreementId)))
					{
						value.push({id: agreementId, ...this.getInitialAgreementBehavior(agreement.code)});
					}
				}

				return FormClient.getInstance()
					.prepareOptions(this.options.formOptions, {agreements: value})
					.then((result) => {
						if (this.destroyed)
						{
							return;
						}

						this.replaceItems(result.data.agreements, value);
						this.refreshAgreementsMenu();
						this.emit('onChange', {skipPrepare: true});
					});
			})
			.catch((errors) => {
				if (!this.destroyed)
				{
					this.emit('onError', {errors});
				}
			})
			.finally(() => {
				void this.hideAgreementLoader();
			});
	}

	onItemRemoveClick(event)
	{
		if (this.destroyed)
		{
			return;
		}

		const value = event.getTarget().getValue();
		this.destroyItem(event.getTarget());

		this.items = this.items.filter((item) => {
			return String(item.options.id) !== String(value.id);
		});

		this.refreshAgreementsMenu();
		this.emit('onItemRemove', {item: value});
		this.emit('onChange', {skipPrepare: true});
	}

	onDragEnd()
	{
		if (this.destroyed)
		{
			return;
		}

		const items = this.items;
		this.items = [];

		[...this.getListContainer().children].forEach((element) => {
			const id = Dom.attr(element, 'data-id');
			const item = items.find((currentItem) => {
				return String(currentItem.options.id) === String(id);
			});

			if (item)
			{
				this.items.push(item);
			}
		});

		this.emit('onChange', {skipPrepare: true});
	}

	bindHint(element: HTMLElement, text: string, position: 'top' | 'bottom' = 'bottom')
	{
		const description = Tag.render`<span id="${Text.getRandom()}" hidden>${text}</span>`;
		Dom.append(description, element);
		Dom.attr(element, 'aria-describedby', description.id);
		Dom.attr(element, Hint.attributeInteractivityName, true);
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
			if (popupContainer)
			{
				Event.unbind(popupContainer, 'mouseenter', enterPopup);
				Event.unbind(popupContainer, 'mouseleave', leavePopup, true);
				Dom.attr(popupContainer, 'role', popupRole);
			}

			Event.unbind(ownerDocument, 'keydown', keydown, true);
			popup?.unsubscribe('onClose', releasePopup);
			popup?.unsubscribe('onDestroy', releasePopup);
			popup = null;
			popupContainer = null;
		};
		const hide = () => {
			clearTimeout(hideTimer);
			if (PopupManager.getPopupById(Hint.id)?.bindElement === element)
			{
				Hint.hide();
			}

			releasePopup();
		};
		const scheduleHide = () => {
			clearTimeout(hideTimer);
			hideTimer = setTimeout(() => {
				if (!cardHovered && !popupHovered && ownerDocument.activeElement !== element)
				{
					hide();
				}
			}, 100);
		};
		const enterPopup = () => {
			popupHovered = true;
			clearTimeout(hideTimer);
		};
		const leavePopup = (event) => {
			if (popup?.bindElement === element)
			{
				event.stopImmediatePropagation();
				popupHovered = false;
				scheduleHide();
			}
		};
		const keydown = (event) => {
			if (event.key === 'Escape' && popup?.isShown() && popup.bindElement === element)
			{
				event.stopPropagation();
				hide();
			}
		};
		const show = () => {
			if (this.destroyed)
			{
				return;
			}

			releasePopup();
			Hint.show(element, text);
			popup = PopupManager.getPopupById(Hint.id);
			if (position === 'top')
			{
				popup.adjustPosition({ position: 'top', forceBindPosition: true });
			}

			popupContainer = popup.getPopupContainer();
			popupRole = Dom.attr(popupContainer, 'role');
			Dom.attr(popupContainer, 'role', 'tooltip');
			Event.bind(popupContainer, 'mouseenter', enterPopup);
			Event.bind(popupContainer, 'mouseleave', leavePopup, true);
			Event.bind(ownerDocument, 'keydown', keydown, true);
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
		const activate = (event) => {
			if (event.key === 'Enter' || event.key === ' ')
			{
				event.preventDefault();
				show();
			}
		};
		const destroy = () => {
			hide();
			Event.unbind(element, 'mouseenter', enter);
			Event.unbind(element, 'mouseleave', leave);
			Event.unbind(element, 'focus', show);
			Event.unbind(element, 'blur', scheduleHide);
			Event.unbind(element, 'click', show);
			Event.unbind(element, 'keydown', activate);
			Dom.attr(element, 'aria-describedby', null);
			Dom.attr(element, Hint.attributeInteractivityName, null);
			Dom.remove(description);
		};
		Event.bind(element, 'mouseenter', enter);
		Event.bind(element, 'mouseleave', leave);
		Event.bind(element, 'focus', show);
		Event.bind(element, 'blur', scheduleHide);
		Event.bind(element, 'click', show);
		Event.bind(element, 'keydown', activate);
		const binding = { element, destroy, show, hide };
		this.hintBindings.push(binding);

		return binding;
	}

	destroyItem(item: ListItem)
	{
		const form = item.options.form;
		if (form)
		{
			const layout = form.getLayout();
			const popup = PopupManager.getPopupById(Hint.id);
			if (popup && Type.isDomNode(popup.bindElement) && layout.contains(popup.bindElement))
			{
				Hint.hide();
				popup.setBindElement(layout.ownerDocument.body);
			}

			this.hintBindings = this.hintBindings.filter(({element, destroy}) => {
				if (layout.contains(element))
				{
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
		Dom.remove(item.getLayout());
	}

	unbindLayout(layout: HTMLElement)
	{
		[layout, ...layout.querySelectorAll('*')].forEach((element) => Event.unbindAll(element));
	}

	destroy()
	{
		if (this.destroyed)
		{
			return;
		}

		this.destroyed = true;
		const removeCustomEvent = Reflection.getClass('top.BX.removeCustomEvent');
		removeCustomEvent(window.top, 'main-user-consent-to-list', this.onUserConsentEditCancel);
		removeCustomEvent(window.top, 'main-user-consent-saved', this.onUserConsentEditSave);
		this.closeEditAgreementSlider();
		this.refreshAgreementsMenu();
		this.draggable.unsubscribe('end', this.onDragEnd);
		this.draggable.destroy();
		this.draggable = null;
		this.items.forEach((item) => this.destroyItem(item));
		this.items = [];
		const loader = this.cache.get('agreementLoader');
		if (loader)
		{
			loader.destroy();
			this.cache.delete('agreementLoader');
		}

		Event.unbind(this.input, 'paste', this.onPaste);
		this.unbindLayout(this.layout);
		this.unsubscribeAll('onChange');
		this.unsubscribeAll('onItemRemove');
		this.unsubscribeAll('onError');
		Dom.remove(this.layout);
	}

	getValue(): Array<Agreement>
	{
		return this.items.map((item) => item.getValue());
	}

}
