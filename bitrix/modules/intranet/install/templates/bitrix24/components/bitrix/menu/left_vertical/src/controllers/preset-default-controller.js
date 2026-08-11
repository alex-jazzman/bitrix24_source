import { Loc, Runtime, Tag } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PopupManager } from 'main.popup';
import { Loader } from 'main.loader';
import DefaultController from './default-controller';
import Options from '../options';
import Utils from '../utils';
import { CancelButton, CreateButton } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';

export default class PresetDefaultController extends DefaultController
{
	isReady: boolean = true;
	#unavailableToolPopup: ?MessageBox;
	#mode: string;
	currentPresetId: ?string;

	constructor(container, { events }, currentPresetId)
	{
		super(container, { events });
		this.currentPresetId = currentPresetId;
	}

	createPopup(mode)
	{
		this.#mode = mode;
		let button;
		const content = Tag.render`
			<div class="left-menu-popup-wrapper-skeleton"><div>
		`;

		new Loader({
			size: 100,
		}).show(content);

		const popup = PopupManager.create(this.constructor.name.toString(), null, {
			overlay: true,
			contentColor: 'white',
			contentNoPaddings: true,
			lightShadow: true,
			draggable: { restrict: true },
			closeByEsc: true,
			offsetTop: 1,
			offsetLeft: 20,
			cacheable: false,
			closeIcon: true,
			content,
			buttons: [
				(button = new CreateButton({
					text: Loc.getMessage('MENU_CONFIRM_BUTTON'),
					onclick: () => {
						if (button.isWaiting())
						{
							return;
						}
						button.setWaiting(true);
						const currentPreset = this.getSelectedPreset();

						if (
							!Options.isAdmin
							&& Options.availablePresetTools
							&& Options.availablePresetTools[currentPreset] === false
						)
						{
							button.setWaiting(false);
							this.showUnavailableToolPopup();

							return;
						}

						EventEmitter.emit(
							this,
							Options.eventName('onPresetIsSet'),
							{ presetId: currentPreset, mode },
						)
							.forEach((promise) => {
								promise
									.then((response) => {
										button.setWaiting(false);
										this.hide();
										if (response.data.hasOwnProperty('url'))
										{
											document.location.href = response.data.url;
										}
										else
										{
											document.location.reload();
										}
									}).catch(Utils.catchError);
							});
					},
				})),
				new CancelButton({
					text: Loc.getMessage('MENU_DELAY_BUTTON'),
					onclick: () => {
						EventEmitter.emit(this, Options.eventName('onPresetIsPostponed'), { mode });
						this.hide();
					},
				}),
			],
		});

		Runtime.loadExtension('intranet.menu-preset').then((exports) => {
			const menuPreset = new exports.MenuPreset({
				containerNode: document.querySelector('#left-menu-preset-popup'),
				currentPresetId: this.currentPresetId,
			});

			popup.setContent(menuPreset.getContent());
			popup.adjustPosition();
		}).catch(() => {});

		return popup;
	}

	show(mode)
	{
		if (this.popup === null)
		{
			this.popup = this.createPopup(mode);
			this.bindPopupEvents();
		}

		this.popup.show();
	}

	getMode(): string
	{
		return this.#mode;
	}

	getSelectedPreset()
	{
		let currentPreset = '';
		if (document.forms['left-menu-preset-form'])
		{
			[...document.forms['left-menu-preset-form']
				.elements['presetType']]
				.forEach((node) => {
					if (node.checked)
					{
						currentPreset = node.value;
					}
				})
			;
		}

		return currentPreset;
	}

	showUnavailableToolPopup(): void
	{
		if (!(this.#unavailableToolPopup instanceof MessageBox))
		{
			this.#unavailableToolPopup = MessageBox.create({
				message: Loc.getMessage('MENU_UNAVAILABLE_TOOL_POPUP_DESCRIPTION'),
				buttons: MessageBoxButtons.OK,
			});
		}

		this.#unavailableToolPopup.show();
	}
}