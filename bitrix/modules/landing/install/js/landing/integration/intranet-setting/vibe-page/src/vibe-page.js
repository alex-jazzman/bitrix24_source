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
		const analyticContext = this.#getAnalyticContext();

		if (
			analyticContext !== null
			&& Type.isString(analyticContext.analyticContext)
		)
		{
			if (analyticContext.analyticContext === 'widget_settings_settings_mainpage')
			{
				subSection = 'from_widget_vibe_point';
			}
			else if (analyticContext.analyticContext === 'from_custom_point')
			{
				subSection = 'from_custom_point';
			}
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

	#getAnalyticContext(): void
	{
		const analytic = this.getAnalytic?.();
		if (!analytic)
		{
			return null;
		}

		if (Type.isFunction(analytic.getContext))
		{
			return analytic.getContext();
		}

		if (Type.isPlainObject(analytic) && !Type.isNil(analytic.context))
		{
			return analytic.context;
		}

		return null;
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
