import {Popup} from 'main.popup';
import {ajax, Cache, Event as EventBinder, Loc, Tag, Type} from 'main.core';
import type {Editor} from '../editor/product-list-editor';

declare const BX: any;

type CrmEntityProductListSettingItem = {
	id: string;
	title: string;
	desc?: string;
	hint?: string;
	checked?: boolean;
	disabled?: boolean;
	action?: string;
	columns?: string[];
};

export default class SettingsPopup
{
	private readonly target: HTMLElement;
	private readonly settings: CrmEntityProductListSettingItem[];
	private readonly editor: Editor;
	private readonly cache = new Cache.MemoryCache<Popup>();

	constructor(target: HTMLElement, settings: CrmEntityProductListSettingItem[] = [], editor: Editor)
	{
		this.target = target;
		this.settings = settings;
		this.editor = editor;
	}

	public show(): void
	{
		this.getPopup().show();
	}

	public getPopup(): Popup
	{
		return this.cache.remember('settings-popup', () => {
			return new Popup({
				id: this.editor.getId() + '_' + Math.random() * 100,
				bindElement: this.target,
				autoHide: true,
				draggable: false,
				angle: {position: 'top', offset: 43},
				noAllPaddings: true,
				bindOptions: {forceBindPosition: true},
				closeByEsc: true,
				content: this.prepareSettingsContent(),
			});
		}) as Popup;
	}

	public getSetting(id: string): CrmEntityProductListSettingItem | undefined
	{
		return this.settings.filter(item => {
			return item.id === id;
		})[0];
	}

	private prepareSettingsContent(): HTMLElement
	{
		const content = Tag.render`
			<div class='ui-entity-editor-popup-create-field-list'></div>
		`;

		this.settings.forEach(item => {
			content.append(this.getCrmEntityProductListSettingItem(item));
		});

		return content;
	}

	private getCrmEntityProductListSettingItem(item: CrmEntityProductListSettingItem): HTMLElement
	{
		const input = Tag.render`
			<input type="checkbox">
		` as HTMLInputElement;
		input.checked = item.checked ?? false;
		input.disabled = item.disabled ?? false;
		input.dataset.settingId = item.id;

		const descriptionNode = (
			Type.isStringFilled(item.desc)
				? Tag.render`<span class="ui-entity-editor-popup-create-field-item-desc">${item.desc}</span>`
				: ''
		);

		const hintNode = (
			Type.isStringFilled(item.hint)
				? Tag.render`<span class="crm-entity-product-list-setting-hint" data-hint="${item.hint}"></span>`
				: ''
		);

		const setting = Tag.render`
			<label class="ui-ctl-block ui-entity-editor-popup-create-field-item ui-ctl-w100">
				<div class="ui-ctl-w10" style="text-align: center">${input}</div>
				<div class="ui-ctl-w75">
					<span class="ui-entity-editor-popup-create-field-item-title ${item.disabled ? 'crm-entity-product-list-disabled-setting' : ''}">${item.title}${hintNode}</span>
					${descriptionNode}
				</div>
			</label>
		`;

		BX.UI.Hint.init(setting);

		EventBinder.bind(setting, 'change', this.setSetting.bind(this));

		return setting;
	}

	private setSetting(event: Event): void
	{
		const target = event.target as HTMLInputElement;
		const settingItem = this.getSetting(target.dataset.settingId as string);
		if (!settingItem)
		{
			return;
		}

		const settingEnabled = target.checked;
		this.requestGridSettings(settingItem, settingEnabled);
	}

	public requestGridSettings(setting: CrmEntityProductListSettingItem, enabled: boolean): void
	{
		const headers: string[] = [];
		const cells = this.editor.gridLifecycle.getGrid().getRows().getHeadFirstChild().getCells();

		Array.from(cells).forEach((header: any) => {
			if ('name' in header.dataset)
			{
				headers.push(header.dataset.name);
			}
		});

		ajax.runComponentAction(
			this.editor.getComponentName(),
			'setGridSetting',
			{
				mode: 'class',
				data: {
					signedParameters: this.editor.getSignedParameters(),
					settingId: setting.id,
					selected: enabled,
					currentHeaders: headers
				}
			}
		).then(() => {
			let message: string;
			setting.checked = enabled;
			if (setting.id === 'ADD_NEW_ROW_TOP')
			{
				const panel = enabled ? 'top' : 'bottom';
				this.editor.setSettingValue('newRowPosition', panel);
				const activePanel = this.editor.changeActivePanelButtons(panel);
				const settingButton = activePanel?.querySelector('[data-role="product-list-settings-button"]') ?? null;
				if (settingButton)
				{
					this.getPopup().setBindElement(settingButton);
				}

				message = (enabled
					? Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED')
					: Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED')
				) as string;
				message = message.replace('#NAME#', setting.title);
			}
			else if (setting.id === 'WAREHOUSE')
			{
				this.editor.reloadGrid(false);
				message = (enabled
					? Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_ENABLED')
					: Loc.getMessage('CRM_ENTITY_CARD_WAREHOUSE_DISABLED')
				) as string;
			}
			else
			{
				this.editor.reloadGrid();

				message = (enabled
					? Loc.getMessage('CRM_ENTITY_PL_SETTING_ENABLED')
					: Loc.getMessage('CRM_ENTITY_PL_SETTING_DISABLED')
				) as string;
				message = message.replace('#NAME#', setting.title);
			}
			this.getPopup().close();

			this.showNotification(message, {
				category: 'popup-settings'
			});
		});
	}

	private showNotification(content: string, options?: Record<string, any>): void
	{
		options = options || {};

		BX.UI.Notification.Center.notify({
			content: content,
			stack: options.stack || null,
			position: 'top-right',
			width: 'auto',
			category: options.category || null,
			autoHideDelay: options.autoHideDelay || 3000
		});
	}

	public updateCheckboxState(): void
	{
		const popupContainer = this.getPopup().getContentContainer();

		this.settings
			.filter(item => item.action === 'grid' && Type.isArray(item.columns))
			.forEach(item => {
				let allColumnsExist = true;

				item.columns!.forEach(columnName => {
					if (!this.editor.gridLifecycle.getGrid().getColumnHeaderCellByName(columnName))
					{
						allColumnsExist = false;
					}
				});

				const checkbox = popupContainer.querySelector('input[data-setting-id="' + item.id + '"]') as HTMLInputElement | null;
				if (Type.isElementNode(checkbox))
				{
					checkbox!.checked = allColumnsExist;
				}
			});
	}
}
