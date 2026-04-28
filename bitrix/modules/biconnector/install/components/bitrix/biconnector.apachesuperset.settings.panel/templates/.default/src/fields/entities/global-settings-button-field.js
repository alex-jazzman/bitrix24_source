import { Loc, Tag, Type } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { Button, ButtonColor, ButtonSize } from 'ui.buttons';
import 'ui.forms';

export class GlobalSettingsButtonField extends BX.UI.EntityEditorCustom
{
	#settingsUrl;
	#sectionName;
	#changeButton;

	static create(id, settings): GlobalSettingsButtonField
	{
		const self = new this(id, settings);
		self.initialize(id, settings);

		return self;
	}

	initialize(id, settings): void
	{
		super.initialize(id, settings);

		const fieldSettings = settings.model.getData();
		this.#settingsUrl = fieldSettings.settingsUrl;
		this.#sectionName = fieldSettings.sectionName;
	}

	layout(options): void
	{
		this.ensureWrapperCreated({ classNames: ['ui-entity-editor-field-text'] });
		this.adjustWrapper();

		this.setVisible(false);

		this.#initChangeButton();
		this.registerLayout(options);
		this._hasLayout = true;
	}

	#initChangeButton(): void
	{
		const buttonContainer = Tag.render`<div></div>`;
		this.#changeButton = new Button({
			text: Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CHANGE_GLOBAL_SETTINGS'),
			color: ButtonColor.LIGHT_BORDER,
			size: ButtonSize.SMALL,
			onclick: this.#onChangeClick.bind(this),
		});
		this.#changeButton.renderTo(buttonContainer);

		EventEmitter.subscribe('BX.UI.EntityEditorSection:onLayout', (event) => {
			if (event.data[1].id === 'DASHBOARD_GLOBAL_SETTINGS')
			{
				event.data[1].customNodes.push(buttonContainer);
			}
		});
	}

	#onChangeClick(): void
	{
		this.#openGlobalSettings();
	}

	#openGlobalSettings(): void
	{
		const hostWindow = window.top ?? window;
		const hostBX = hostWindow.BX;

		hostBX?.Event.EventEmitter.subscribeOnce(
			hostBX?.Event.EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onLoad',
			(baseEvent) => {
				const slider = baseEvent.getTarget();

				slider.getWindow().BX.Event.EventEmitter.subscribeOnce(
					slider.getWindow().BX.Event.EventEmitter.GLOBAL_TARGET,
					'BX.Intranet.Settings:onSuccessSave',
					(innerBaseEvent: BaseEvent) => {
						const extraSettings = innerBaseEvent.getData();
						if (Type.isObject(extraSettings))
						{
							extraSettings.reloadAfterClose = false;
						}
					},
				);
			},
		);

		BX.SidePanel.Instance.open(
			this.#settingsUrl,
			{
				cacheable: false,
				width: 1034,
				events: {
					onCloseComplete: () => {
						EventEmitter.emit('biconnector:onGlobalSettingsChange');
					},
				},
			},
		);
	}
}
