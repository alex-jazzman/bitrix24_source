import { Dom, Tag, Loc } from 'main.core';
import { Switcher, SwitcherSize } from 'ui.switcher';
import { CollapsibleCard } from '../card/collapsible-card';
import { CardHint } from '../card/card-hint';
import { SettingsApi } from '../api/settings-api';
import { type DatasetTypingData, type CardConstructorOptions } from '../types';

declare const BX: any;

export class DatasetTypingCard
{
	#card: CollapsibleCard;
	#data: DatasetTypingData;
	#enabled: boolean;
	#componentName: string;
	#signedParameters: string;
	#switcher: Switcher | null = null;

	constructor(
		data: DatasetTypingData,
		componentName: string,
		signedParameters: string,
		options: CardConstructorOptions = {},
	)
	{
		this.#data = data;
		this.#enabled = data.enabled;
		this.#componentName = componentName;
		this.#signedParameters = signedParameters;

		this.#card = new CollapsibleCard({
			id: 'dataset-typing',
			title: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_TITLE') ?? '',
			iconClass: '--o-database',
			collapsed: options.collapsed,
		});
	}

	getLayout(): HTMLElement
	{
		const layout = this.#card.getLayout();
		const content = this.#card.getContentContainer();

		const hint = new CardHint({
			text: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_HINT') ?? '',
		});
		Dom.append(hint.getLayout(), content);

		const switcherNode: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__switcher-control"></div>
		`;

		this.#switcher = new Switcher({
			node: switcherNode,
			size: SwitcherSize.large,
			useAirDesign: true,
			checked: this.#enabled,
			disabled: this.#data.locked,
			handlers: {
				toggled: () => {
					if (this.#data.locked)
					{
						return;
					}

					this.#enabled = !this.#enabled;
					void this.#save();
				},
			},
		} as any);

		const optionRow: HTMLElement = Tag.render`
			<div class="biconnector-settings-card__option-row">
				${switcherNode}
				<span class="biconnector-settings-card__option-label">
					${Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_TOGGLE') ?? ''}
				</span>
			</div>
		`;

		Dom.append(optionRow, content);

		return layout;
	}

	async #save(): Promise<void>
	{
		try
		{
			await SettingsApi.saveDatasetTyping(
				this.#componentName,
				this.#signedParameters,
				this.#enabled,
			);
		}
		catch
		{
			BX.UI.Notification.Center.notify({
				content: Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR'),
				autoHideDelay: 2000,
			});
			this.#enabled = !this.#enabled;
			this.#switcher?.check(this.#enabled, false);
		}
	}
}
