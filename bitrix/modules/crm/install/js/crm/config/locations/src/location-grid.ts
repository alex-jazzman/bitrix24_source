import { Loc, Uri } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Dialog } from 'ui.system.dialog';

import { NavigationManager } from './navigation-manager';
import { SliderManager } from './slider-manager';
import { BatchDeleteManager } from './batch-delete-manager';

export type LocationGridConfig = {
	gridId: string,
	filterId: string,
	addUrl: string,
	editUrlTemplate: string,
	importUrl: string,
	batchController: string,
};

type Grid = {
	reload: () => void,
};

type ConfirmationDialog = {
	show: () => void,
	hide: () => void,
};

type ConfirmationButtonOptions = {
	text: string,
	size: string,
	style: string,
	useAirDesign: boolean,
	onclick: () => void,
};

type ConfirmationDialogOptions = {
	title: string,
	content: HTMLElement,
	centerButtons: unknown[],
	hasOverlay: boolean,
	hasCloseButton: boolean,
	closeByEsc: boolean,
};

type ConfirmationDialogDependencies = {
	Dialog: new (options: ConfirmationDialogOptions) => ConfirmationDialog,
	Button: new (options: ConfirmationButtonOptions) => unknown,
	buttonSizeLarge: string,
	buttonStyleFilled: string,
	buttonStyleOutline: string,
};

const EDIT_EVENT = 'BX.Crm.Config.LocationGrid:edit';
const SHOW_CHILDREN_EVENT = 'BX.Crm.Config.LocationGrid:showChildren';
const BATCH_DELETE_BUTTON_ID = 'grid_remove_button_control';
const DefaultConfirmationDialogDependencies: ConfirmationDialogDependencies = {
	Dialog,
	Button: Button as unknown as ConfirmationDialogDependencies['Button'],
	buttonSizeLarge: ButtonSize.LARGE,
	buttonStyleFilled: AirButtonStyle.FILLED,
	buttonStyleOutline: AirButtonStyle.OUTLINE,
};

export class LocationGridManager
{
	static Instance: LocationGridManager | null = null;

	#config: LocationGridConfig;
	#navigationManager: NavigationManager;
	#sliderManager: SliderManager;
	#batchDeleteManager: BatchDeleteManager;
	#confirmationDialogDependencies: ConfirmationDialogDependencies;
	#grid: Grid | null = null;

	constructor(
		config: LocationGridConfig,
		confirmationDialogDependencies: ConfirmationDialogDependencies = DefaultConfirmationDialogDependencies,
	)
	{
		this.#config = config;
		this.#confirmationDialogDependencies = confirmationDialogDependencies;
		this.#navigationManager = new NavigationManager(config.filterId);
		this.#sliderManager = new SliderManager(() => this.reload());
		this.#batchDeleteManager = new BatchDeleteManager({
			gridId: config.gridId,
			filterId: config.filterId,
			controller: config.batchController,
			onReload: () => this.reload(),
		});
	}

	init(): void
	{
		this.#grid = BX.Main.gridManager.getInstanceById(this.#config.gridId) ?? null;
		this.#navigationManager.init();
		void this.#batchDeleteManager.init();
		const batchDeleteButton = document.getElementById(BATCH_DELETE_BUTTON_ID);
		if (batchDeleteButton !== null)
		{
			batchDeleteButton.dataset.testid = 'crm-locations-batch-delete';
		}
		EventEmitter.subscribe(EDIT_EVENT, (event: BaseEvent) => {
			this.#sliderManager.open(String(event.getData().url));
		});
		EventEmitter.subscribe(SHOW_CHILDREN_EVENT, (event: BaseEvent) => {
			this.#navigationManager.showChildren(Number(event.getData().parentId));
		});
	}

	reload(): void
	{
		this.#getGrid().reload();
	}

	openAdd(): void
	{
		const uri = new Uri(this.#config.addUrl);
		uri.setQueryParam('PARENT_ID', String(this.#navigationManager.getParentId()));

		this.#sliderManager.open(uri.toString());
	}

	openImport(): void
	{
		this.#sliderManager.open(this.#config.importUrl, { width: 900 });
	}

	deleteSelected(): void
	{
		this.#batchDeleteManager.execute();
	}

	confirmDelete(locationName: string, onConfirm: () => void): void
	{
		const dependencies = this.#confirmationDialogDependencies;
		const content = document.createElement('div');
		content.dataset.testid = 'crm-locations-delete-confirm';
		content.textContent = Loc.getMessage(
			'CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_TEXT',
			{ '#NAME#': locationName },
		) ?? '';

		const dialog = new dependencies.Dialog({
			title: Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_TITLE') ?? '',
			content,
			centerButtons: [
				new dependencies.Button({
					text: Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_BUTTON') ?? '',
					size: dependencies.buttonSizeLarge,
					style: dependencies.buttonStyleFilled,
					useAirDesign: true,
					onclick: () => {
						dialog.hide();
						onConfirm();
					},
				}),
				new dependencies.Button({
					text: Loc.getMessage('CRM_CONFIG_LOCATIONS_DELETE_CONFIRM_CANCEL') ?? '',
					size: dependencies.buttonSizeLarge,
					style: dependencies.buttonStyleOutline,
					useAirDesign: true,
					onclick: () => dialog.hide(),
				}),
			],
			hasOverlay: true,
			hasCloseButton: true,
			closeByEsc: true,
		});
		dialog.show();
	}

	#getGrid(): Grid
	{
		this.#grid ??= BX.Main.gridManager.getInstanceById(this.#config.gridId) ?? null;
		if (this.#grid === null)
		{
			throw new Error(`Grid "${this.#config.gridId}" is not initialized.`);
		}

		return this.#grid;
	}
}
