import { Loc, Type } from 'main.core';
import 'sidepanel';
import { BaseSettingsPage } from 'ui.form-elements.field';
import 'ui.icon.set';

import { Metrika } from 'landing.metrika';
import { VibeSection, type VibeOptions } from './vibe-section';

export class VibePage extends BaseSettingsPage
{
	titlePage: string = '';
	descriptionPage: string = '';

	#metrika: Metrika;

	constructor()
	{
		super();
		this.titlePage = Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_WELCOME');
		this.descriptionPage = Loc.getMessage('INTRANET_SETTINGS_TITLE_DESCRIPTION_PAGE_VIBE');
		this.#metrika = new Metrika(true, 'vibe');
	}

	getType(): string
	{
		return 'welcome';
	}

	appendSections(contentNode: HTMLElement): void
	{
		let subSection = 'from_settings';
		const analyticContext = this.getAnalytic()?.getContext();
		if (
			Type.isString(analyticContext.analyticContext)
			&& analyticContext.analyticContext === 'widget_settings_settings'
		)
		{
			subSection = 'from_widget_vibe_point';
		}

		this.#sendAnalytic({
			event: 'open_settings_main',
			c_sub_section: subSection,
		});

		const vibes: VibeOptions[] = this.getValue('vibes') || [];
		vibes.forEach((options) => {
			const vibeSection = new VibeSection(options);
			vibeSection.subscribe('sendAnalytic', (event) => {
				this.#sendAnalytic(event.getData());
			});
			vibeSection.appendSections(contentNode);
		});
	}

	#sendAnalytic(data: Object): void
	{
		if (!Type.isString(data.event))
		{
			return;
		}

		data.category = 'vibe';

		this.#metrika.sendData(data);
	}
}
