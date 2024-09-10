import { Tag, Dom, Loc, Type } from 'main.core';
import { Api } from 'sign.v2.api';
import { Dialog } from 'ui.entity-selector';
import { DocumentSetup as BaseDocumentSetup } from 'sign.v2.document-setup';
import { type BlankSelectorConfig } from 'sign.v2.blank-selector';
import { DateSelector } from './date-selector';
import { Hint } from 'sign.v2.helper';

import './style.css';

type RegionDocumentType = {
	code: string,
	description: string,
};

export class DocumentSetup extends BaseDocumentSetup
{
	#api: Api;
	#region: string;
	#regionDocumentTypes: Array<RegionDocumentType>;
	#documentTypeSelector: Dialog;
	#documentTypeDropdown: HTMLElement;
	#documentNumberInput: HTMLInputElement | null = null;
	#documentTitleInput: HTMLInputElement;
	#dateSelector: DateSelector | null = null;

	constructor(blankSelectorConfig: BlankSelectorConfig)
	{
		super(blankSelectorConfig);
		const { region, regionDocumentTypes } = blankSelectorConfig;
		this.#api = new Api();
		this.#region = region;
		this.#regionDocumentTypes = regionDocumentTypes;
		this.#documentTitleInput = Tag.render`
			<input
				type="text"
				class="ui-ctl-element"
				maxlength="255"
				oninput="${({ target }) => this.setDocumentTitle(target.value)}"
			/>
		`;
		if (this.#isRuRegion())
		{
			this.#documentNumberInput = Tag.render`<input type="text" class="ui-ctl-element" maxlength="255" />`;
			this.#dateSelector = new DateSelector();
		}

		this.blankSelector.subscribe('toggleSelection', ({ data }) => {
			this.setDocumentTitle(data.title);
		});
		this.blankSelector.subscribe('addFile', ({ data }) => {
			this.setDocumentTitle(data.title);
		});
		this.#init();
	}

	#init(): void
	{
		this.#initDocumentType();
		const documentTypeLayout = this.#getDocumentTypeLayout();
		const titleLayout = Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					${Loc.getMessage('SIGN_DOCUMENT_SETUP_TITLE_HEAD_LABEL')}
				</p>
				${this.#getDocumentTitleLayout()}
			</div>
		`;
		Dom.append(documentTypeLayout, this.layout);
		Dom.append(titleLayout, this.layout);
		Hint.create(this.layout);
	}

	#isDocumentTypeVisible(): boolean
	{
		return this.#regionDocumentTypes?.length;
	}

	#isRuRegion(): boolean
	{
		return this.#region === 'ru';
	}

	#initDocumentType(): void
	{
		if (!this.#isDocumentTypeVisible())
		{
			return;
		}

		this.#documentTypeDropdown = Tag.render`
			<div
				class="sign-b2e-document-setup__type"
				onclick="${() => {
					this.#documentTypeSelector.show();
				}}"
			>
				<div class="sign-b2e-document-setup__type_text">
					<span class="sign-b2e-document-setup__type_title"></span>
					<span class="sign-b2e-document-setup__type_caption"></span>
				</div>
				<span class="sign-b2e-document-setup__type_btn"></span>
			</div>
		`;
		this.#documentTypeSelector = new Dialog({
			targetNode: this.#documentTypeDropdown,
			width: 500,
			height: 350,
			tabs: [{ id: 'b2e-document-codes', title: ' ' }],
			showAvatars: false,
			dropdownMode: true,
			multiple: false,
			enableSearch: true,
			entities: [
				{ id: 'b2e-document-code', searchFields: [{ name: 'caption', system: true }] },
			],
			hideOnSelect: true,
			events: {
				'Item:OnSelect': ({ data }) => this.#onTypeSelect(data.item),
			},
		});
		const container = this.#documentTypeSelector.getContainer();
		Dom.addClass(container, 'sign-b2e-document-setup__type-selector');
		this.#regionDocumentTypes.forEach((item) => {
			if (Type.isPlainObject(item)
				&& Type.isStringFilled(item.code)
				&& Type.isStringFilled(item.description))
			{
				const { code, description } = item;
				this.#documentTypeSelector.addItem({
					id: code,
					title: code,
					caption: `(${description})`,
					entityId: 'b2e-document-code',
					tabs: 'b2e-document-codes',
					deselectable: false,
				});
			}
		});
		const [firstItem] = this.#documentTypeSelector.getItems();
		firstItem?.select();
	}

	#getDocumentTypeLayout(): HTMLElement | null
	{
		if (!this.#isDocumentTypeVisible())
		{
			return null;
		}

		return Tag.render`
			<div class="sign-b2e-settings__item">
				<p class="sign-b2e-settings__item_title">
					<span>${Loc.getMessage('SIGN_DOCUMENT_SETUP_TYPE')}</span>
					<span
						data-hint="${Loc.getMessage('SIGN_DOCUMENT_SETUP_TYPE_HINT')}"
					></span>
				</p>
				${this.#documentTypeDropdown}
			</div>
		`;
	}

	#getDocumentNumberLayout(): HTMLElement | null
	{
		if (!this.#isRuRegion())
		{
			return null;
		}

		return Tag.render`
			<div class="sign-b2e-document-setup__title-item --num">
				<p class="sign-b2e-document-setup__title-text">
					<span>${Loc.getMessage('SIGN_DOCUMENT_SETUP_NUM_LABEL')}</span>
					<span
						data-hint="${Loc.getMessage('SIGN_DOCUMENT_SETUP_NUM_LABEL_HINT')}"
					></span>
				</p>
				<div class="ui-ctl ui-ctl-textbox">
					${this.#documentNumberInput}
				</div>
			</div>
		`;
	}

	#getDocumentTitleLayout(): HTMLElement
	{
		return Tag.render`
			<div>
				<div class="sign-b2e-document-setup__title-item ${this.#getDocumentTitleFullClass()}">
					<p class="sign-b2e-document-setup__title-text">
						${Loc.getMessage('SIGN_DOCUMENT_SETUP_TITLE_LABEL')}
					</p>
					<div class="ui-ctl ui-ctl-textbox">
						${this.#documentTitleInput}
					</div>
				</div>
				${this.#getDocumentNumberLayout()}
				<p class="sign-b2e-document-setup__title-text">
					${Loc.getMessage('SIGN_DOCUMENT_SETUP_TITLE_HINT')}
				</p>
				${this.#dateSelector?.getLayout()}
			</div>
		`;
	}

	#getDocumentTitleFullClass(): string
	{
		return this.#isRuRegion() ? '' : '--full';
	}

	#onTypeSelect(item): void
	{
		const { title, caption } = item;
		const { firstElementChild: textNode } = this.#documentTypeDropdown;
		textNode.title = `${title} ${caption}`;
		const {
			firstElementChild: titleNode,
			lastElementChild: captionNode,
		} = textNode;
		titleNode.textContent = title;
		captionNode.textContent = caption;
	}

	#sendDocumentType(uid: string): Promise<void>
	{
		if (!this.#isDocumentTypeVisible())
		{
			return Promise.resolve();
		}

		const type = [...this.#documentTypeSelector.selectedItems][0].id;

		return this.#api.changeRegionDocumentType(uid, type);
	}

	#sendDocumentNumber(uid: string): Promise<void>
	{
		if (!this.#isRuRegion())
		{
			return Promise.resolve();
		}

		return this.#api.changeExternalId(uid, this.#documentNumberInput.value);
	}

	#sendDocumentDate(uid: string): Promise<void>
	{
		if (!this.#isRuRegion())
		{
			return Promise.resolve();
		}

		return this.#api.changeExternalDate(uid, this.#dateSelector.getSelectedDate());
	}

	#setDocumentNumber(number: string): void
	{
		this.#documentNumberInput.value = number;
	}

	setDocumentTitle(title: string = ''): void
	{
		this.#documentTitleInput.value = title;
		this.#documentTitleInput.title = title;
	}

	initLayout(): void
	{
		this.layout = Tag.render`
			<div class="sign-document-setup">
				<h1 class="sign-b2e-settings__header">${Loc.getMessage('SIGN_DOCUMENT_SETUP_HEADER')}</h1>
				<div class="sign-b2e-settings__item">
					<p class="sign-b2e-settings__item_title">
						${Loc.getMessage('SIGN_DOCUMENT_SETUP_ADD_TITLE')}
					</p>
					${this.blankSelector.getLayout()}
				</div>
			</div>
		`;
	}

	async setup(uid: ?string): Promise<void>
	{
		try
		{
			await super.setup(uid);
			if (!this.setupData)
			{
				return;
			}

			if (uid)
			{
				const { title, externalId, externalDateCreate } = this.setupData;
				this.setDocumentTitle(title);

				if (this.#isRuRegion())
				{
					this.#setDocumentNumber(externalId);
					this.#dateSelector.setDateInCalendar(new Date(externalDateCreate));
				}

				return;
			}

			const { uid: documentUid } = this.setupData;
			const { value: title } = this.#documentTitleInput;
			const externalId = this.#documentNumberInput?.value;
			this.ready = false;
			await Promise.all([
				this.#sendDocumentType(documentUid),
				this.#sendDocumentNumber(documentUid),
				this.#sendDocumentDate(documentUid),
			]);

			const modifyDocumentTitleResponse = await this.#api.modifyTitle(documentUid, title);
			const { blankTitle } = modifyDocumentTitleResponse;
			if (blankTitle)
			{
				const { blankId } = this.setupData;
				this.blankSelector.modifyBlankTitle(blankId, blankTitle);
			}

			this.setupData = { ...this.setupData, title, externalId };
		}
		catch
		{
			const { blankId } = this.setupData;
			this.handleError(blankId);
		}

		this.ready = true;
	}

	#validateInput(input: HTMLElement): boolean
	{
		if (!input)
		{
			return true;
		}

		const { parentNode, value } = input;
		if (value.trim() !== '')
		{
			Dom.removeClass(parentNode, 'ui-ctl-warning');

			return true;
		}

		Dom.addClass(parentNode, 'ui-ctl-warning');
		input.focus();

		return false;
	}

	validate(): boolean
	{
		const isValidTitle = this.#validateInput(this.#documentTitleInput);
		const isValidNumber = this.#validateInput(this.#documentNumberInput);

		return isValidTitle && isValidNumber;
	}
}
