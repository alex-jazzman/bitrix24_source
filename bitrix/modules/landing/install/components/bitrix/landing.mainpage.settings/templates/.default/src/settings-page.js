import { Type } from 'main.core';
import { VibePage, VibeOptions } from 'landing.integration.intranet-setting.vibe-page';

type VibeSettingsOptions = {
	data: VibeOptions[] | { vibes: VibeOptions[] },
	contentNode: HTMLElement,
};

export class SettingsPage
{
	constructor(options: VibeSettingsOptions)
	{
		this.data = options.data;
		this.contentNode = options.contentNode;
	}

	render()
	{
		const page = new VibePage();
		const payload = Type.isArray(this.data) ? { vibes: this.data } : this.data;
		page.setData(payload);
		page.setAnalytic({
			context: {
				analyticContext: 'from_custom_point',
			},
		});
		page.appendSections(this.contentNode);
	}
}
