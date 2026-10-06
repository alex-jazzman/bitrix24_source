import { Runtime, Type } from 'main.core';
import { Outline } from 'ui.icon-set.api.core';

import { Row } from './row';

export class StartupToolSettings extends Row
{
	getIcon(): string
	{
		return Outline.SETTINGS;
	}

	getId(): string
	{
		return 'settings_startup_tool';
	}

	handleClick(event?: Event): void
	{
		this.emit('click');

		event?.stopPropagation();
		event?.preventDefault();

		void this.#openProjectWizard();
	}

	async #openProjectWizard(): Promise<void>
	{
		const projectId = this.params.projectId;
		if (!projectId)
		{
			return;
		}

		if (Type.isFunction(this.params.onOpenStartupToolSettings))
		{
			this.params.onOpenStartupToolSettings();

			return;
		}

		try
		{
			await Runtime.loadExtension('socialnetwork.v2.application.project-wizard');

			const ProjectWizard = BX.Socialnetwork?.V2?.Application?.ProjectWizard;
			const actions = BX.Socialnetwork?.V2?.Model?.TYPES_PROJECT_WIZARD_ACTION;
			if (!ProjectWizard || !actions)
			{
				return;
			}

			const wizard = new ProjectWizard({
				action: actions.UPDATE,
				projectId,
				scrollToStartupTool: true,
				onCancel: () => {},
			});

			void wizard.show();
		}
		catch (error)
		{
			console.error('StartupToolSettings: failed to open project wizard', error);
		}
	}
}
