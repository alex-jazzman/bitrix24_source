import { Slider } from 'crm.ai.slider';
import { addCustomEvent, removeCustomEvent } from 'main.core';

import { SettingsSliderApplication } from './app';

export class SettingsSliderApp
{
	constructor(entityTypeId, categoryId = null)
	{
		this.entityTypeId = entityTypeId;
		this.categoryId = categoryId;
		this.containerId = `crm-ai-settings-slider-${entityTypeId}-${categoryId ?? 'default'}`;
		this.sliderUrl = `crm:ai-settings-slider-${entityTypeId}-${categoryId ?? 'default'}`;
		this.boundHandleLoad = this.handleLoad.bind(this);
		this.boundHandleClose = this.handleClose.bind(this);
		this.application = null;
		this.slider = null;
	}

	open(): void
	{
		this.slider = new Slider({
			content: () => `<div id="${this.containerId}"></div>`,
			sliderTitle: '',
			sliderContentClass: 'crm-ai-settings-slider-surface',
			extensions: ['crm.ai.settings-slider'],
			url: this.sliderUrl,
			width: 795,
		});

		addCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
		addCustomEvent('SidePanel.Slider:onClose', this.boundHandleClose);

		this.slider.open();
	}

	handleLoad(event): void
	{
		if (event.getSlider().getUrl() !== this.sliderUrl)
		{
			return;
		}

		if (this.application)
		{
			return;
		}

		this.application = new SettingsSliderApplication(this.containerId, {
			entityTypeId: this.entityTypeId,
			categoryId: this.categoryId,
		});
		this.application.start();

		removeCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
	}

	handleClose(event): void
	{
		if (event.getSlider().getUrl() !== this.sliderUrl)
		{
			return;
		}

		this.application?.stop?.();
		this.application = null;
		this.slider = null;

		removeCustomEvent('SidePanel.Slider:onLoad', this.boundHandleLoad);
		removeCustomEvent('SidePanel.Slider:onClose', this.boundHandleClose);
	}
}
