import { Loc, Runtime, Tag, Type, Extension, type AjaxResponse, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Alert, AlertColor, AlertSize } from 'ui.alerts';
import { BaseField, Checker } from 'ui.form-elements.view';
import { Row } from 'ui.section';
import { SelectorField } from 'ai.ui.field.selectorfield';
import { SettingsSection, SettingsRow, SettingsField, BaseSettingsPage } from 'ui.form-elements.field';
import { type BitrixGptAgreementPopupOptions } from 'ai.bitrixgpt-agreement-popup';
import { AiSettingsItem, AiSettingsGroup, AiSettingsItemRelations, AiSettingsItemField } from '../types';

import '../css/ai_page.css';

export class AiPage extends BaseSettingsPage
{
	static #groupIconDefaultSet = 'ui.icon-set.main';
	static #groupIconDefaultIcon = '--copilot-ai';

	titlePage: string = '';
	descriptionPage: string = '';

	#itemRelations: [AiSettingsItemRelations] = [];
	#itemFields: {[string]: AiSettingsItemField} = {};
	#onSaveCheckers: [Checker] = [];
	#agreementCheckers: [Checker] = [];
	#isAgreementAccepted: boolean = false;
	#isSwitcherProgrammaticChange: boolean = false;

	constructor()
	{
		super();
		const copilotName = Extension.getSettings('ai.integration.intranet-settings').copilotName;
		this.titlePage = Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_AI_MSGVER_1', {
			'#COPILOT_NAME#': copilotName,
		});
		this.descriptionPage = Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_AI_DESC_MSGVER_1', {
			'#COPILOT_NAME#': copilotName,
		});
	}

	getType(): string
	{
		return 'ai';
	}

	appendSections(contentNode: HTMLElement): void
	{
		const groups: ?{[string]: AiSettingsGroup} = this.getValue('fields');
		if (groups)
		{
			this.isOpen = true;
			for (const groupCode in groups)
			{
				const section = this.#buildGroup(groups[groupCode]);
				if (this.isOpen === true)
				{
					this.isOpen = false;
				}

				if (section)
				{
					section.renderTo(contentNode);
				}

				if (groups[groupCode].relations)
				{
					groups[groupCode].relations.forEach((relation) => {
						this.#itemRelations.push(relation);
					});
				}
			}
		}

		this.#bindEvents();
	}

	#buildGroup(group: AiSettingsGroup): ?SettingsSection
	{
		if (!group.items)
		{
			return;
		}
		const items = Object.values(group.items);
		if (items.length <= 0)
		{
			return;
		}

		const { title, helpdesk, icon } = group;
		Runtime.loadExtension(icon.set ?? AiPage.#groupIconDefaultSet);

		const section = new SettingsSection({
			parent: this,
			section: {
				title,
				titleIconClasses: `ui-icon-set ${icon.code ?? AiPage.#groupIconDefaultIcon}`,
				isOpen: this.isOpen,
			},
		});

		if (group.description)
		{
			let description = group.description;
			if (helpdesk)
			{
				const helpdeskCode = `redirect=detail&code=${helpdesk}`;
				description += ' <a href="javascript: void();"'
					+ ` onclick="BX.PreventDefault(); top.BX.Helper.show('${helpdeskCode}');"`
					+ `>${
					 Loc.getMessage('INTRANET_SETTINGS_HELPDESK_LINK')
					 }</a>`
				;
			}

			section.getSectionView().append(
				(new Row({
					content: (new Alert({
						row: {
							separator: 'null',
						},
						text: description,
						inline: true,
						size: AlertSize.SMALL,
						color: AlertColor.PRIMARY,
					})).getContainer(),
				})).render(),
			)
			;
		}

		items.forEach((item) => {
			const row = this.#buildItem(item);
			if (row.getChildrenElements().length > 0)
			{
				row.setParentElement(section);
			}
		});

		return section;
	}

	#buildItem(
		{ code, header, onSave, options, recommended, restriction, title, type, value }: AiSettingsItem,
	): SettingsRow
	{
		const withOnSave = onSave && onSave.switcher;

		const row = new SettingsRow({
			row: {
				className: withOnSave ? '--with-on-save' : '',
			},
		});

		let field = null;
		if (type === 'boolean')
		{
			const checkerOptions = {
				title,
				inputName: code,
				checked: value,
				hintOn: header,
				hintOff: header,
			};

			if (restriction)
			{
				checkerOptions.isEnable = false;
				checkerOptions.checked = false;

				const messageNode = Tag.render`<span>${restriction.helpMessage}</span>`;
				checkerOptions.helpMessageProvider = this.helpMessageProviderFactory(messageNode);
				checkerOptions.bannerCode = restriction.bannerCode;
			}

			field = new Checker(checkerOptions);
			if (!restriction)
			{
				this.#agreementCheckers.push(field);
			}
		}

		else if (type === 'list' && options && value)
		{
			const items = [];
			const additionalItems = [];
			for (const option in options)
			{
				if (Type.isString(options[option]))
				{
					items.push({
						name: options[option],
						value: option,
						selected: option === value,
					});
				}
				else if (Type.isPlainObject(options[option]))
				{
					additionalItems.push(options[option]);
				}
			}

			if (items.length > 0)
			{
				field = new SelectorField({
					inputName: code,
					label: title,
					name: code,
					items,
					additionalItems,
					recommendedItems: recommended,
					current: value,
				});
			}
		}

		if (field)
		{
			this.#addField(code, field, row);
		}

		if (withOnSave)
		{
			const onSaveField = new Checker({
				inputName: `${code}_onsave`,
				title: onSave.switcher,
				checked: false,
				size: 'extra-small',
				noMarginBottom: true,
			});

			this.#addField(code, onSaveField, row);
			this.#onSaveCheckers.push(onSaveField);
		}

		return row;
	}

	#addField(code: string, field: BaseField, row: SettingsRow)
	{
		row.addChild(new SettingsField({
			fieldView: field,
		}));

		this.#itemFields[code] = {
			code,
			field,
			row,
		};
	}

	#setCheckerState(checker: Checker, isChecked: boolean): void
	{
		this.#isSwitcherProgrammaticChange = true;
		checker.switcher?.check(isChecked);
		this.#isSwitcherProgrammaticChange = false;
	}

	#showBitrixGptAgreementPopup(checker: Checker): void
	{
		Runtime.loadExtension('ai.bitrixgpt-agreement-popup')
			.then(({ showBitrixGptAgreementPopup }) => ajax.runAction('ai.bitrixgptagreement.getPopupData')
				.then((response: AjaxResponse<BitrixGptAgreementPopupOptions>) => {
					const data = response?.data;
					if (
						!Type.isPlainObject(data)
						|| !Type.isNumber(data.attempt)
					)
					{
						this.#isAgreementAccepted = true;

						return;
					}

					this.#setCheckerState(checker, false);

					showBitrixGptAgreementPopup({
						...data,
						useQueue: false,
						showSkip: false,
						messages: {
							accept: Loc.getMessage('INTRANET_SETTINGS_AI_ENABLE_BUTTON'),
						},
						onAccept: () => {
							this.#isAgreementAccepted = true;
							this.#setCheckerState(checker, true);
						},
						onDecline: () => {
							this.#setCheckerState(checker, false);
						},
					});
				}));
	}

	#bindEvents()
	{
		if (this.#agreementCheckers.length > 0)
		{
			this.#agreementCheckers.forEach((checker) => {
				EventEmitter.subscribe(checker, 'change', (event) => {
					if (
						this.#isSwitcherProgrammaticChange
						|| this.#isAgreementAccepted
						|| event.getData() !== true
					)
					{
						return;
					}

					this.#showBitrixGptAgreementPopup(checker);
				});
			});
		}

		if (this.#onSaveCheckers.length > 0)
		{
			EventEmitter.subscribe(EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onBeforeSave', () => {
				this.#onSaveCheckers.forEach((field) => {
					field.switcher?.check(false, false);
				});
			});
		}

		if (this.#itemRelations.length > 0)
		{
			this.#itemRelations.forEach((relation) => {
				const parent = this.#itemFields[relation.parent];
				if (parent && parent.field && parent.field instanceof Checker)
				{
					if (!parent.field.isChecked())
					{
						relation.children.forEach((child) => {
							const node = this.#itemFields[child]?.row?.getRowView();
							if (node)
							{
							node.hide();
							}
						});
					}

					EventEmitter.subscribe(parent.field, 'change', (event) => {
						const isActive = event.getData();
						relation.children.forEach((child) => {
							const node = this.#itemFields[child]?.row?.getRowView();
							if (node)
							{
								isActive ? node.show() : node.hide();
							}
						});
					});
				}
			});
		}
	}
}
