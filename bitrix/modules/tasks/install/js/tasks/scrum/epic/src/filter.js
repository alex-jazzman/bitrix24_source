import { Dom } from 'main.core';
import { EventEmitter } from 'main.core.events';

type Props = {
	filterId: string,
};

export class Filter
{
	#props: Props;
	#filter: BX.Main.Filter;
	#popupManager: BX.Main.PopupManager;
	#fields: any;
	#applyFilter: Function;
	#getStopBlur: Function;

	constructor(props: Props)
	{
		this.#props = props;
		this.#applyFilter = this.#applyFilterHandler.bind(this);
		this.#getStopBlur = this.#onGetStopBlur.bind(this);
		this.#init();
	}

	#init()
	{
		this.#filter = BX.Main.filterManager.getById(this.#props.filterId);
		this.#popupManager = BX.Main.PopupManager;
		this.#updateFields();
		this.#subscribeToEvents();
	}

	#updateFields()
	{
		this.#fields = this.#filter.getFilterFieldsValues();
	}

	#unSubscribeToEvents()
	{
		EventEmitter.unsubscribe('BX.Main.Filter:apply', this.#applyFilter);
		EventEmitter.unsubscribe('BX.Main.Filter:onGetStopBlur', this.#getStopBlur);
	}

	#subscribeToEvents()
	{
		EventEmitter.subscribe('BX.Main.Filter:apply', this.#applyFilter);
		EventEmitter.subscribe('BX.Main.Filter:onGetStopBlur', this.#getStopBlur);
	}

	#applyFilterHandler()
	{
		this.#updateFields();
	}

	#onGetStopBlur(event)
	{
		const { target, path } = event.getCompatData()[0];
		const popupWindow = path.find(el => {
			return el.classList?.contains('popup-window') || el.classList?.contains('main-ui-square')
		});
		const popups = [
			this.#filter.popup.popupContainer,
			this.#filter.getFieldsPopup().popupContainer
		];

		if (
			this.#filter.popup.isShown()
			&& !popups.some(el => el.contains(target))
			&& !popupWindow
		)
		{
			this.#filter.closePopup();
		}
	}

	#resetFilter()
	{
		const preset = this.#filter.getPreset();
		this.#filter.getSearch().clearInput();
		preset.deactivateAllPresets();
		preset.resetPreset(true);

		return this.#filter.saveOptions(
			{
				preset_id: 'default_filter',
				fields: this.#filter.getFilterFieldsValues(),
				rows: preset.getFields().map((field) => Dom.attr(field, 'data-name')).join(','),
				additional: {},
				clear_filter: 'Y',
				save: 'Y',
			},
			{
				FILTER_ID: this.#props.filterId,
				GRID_ID: this.#filter.getParam('GRID_ID'),
				action: 'SET_FILTER',
			},
		);
	}

	destroyPopups()
	{
		this.#filter.popup.destroy();
		this.#popupManager.getPopupById(this.#props.filterId + '_fields_popup')?.destroy();
		this.#popupManager.getPopupById(this.#props.filterId + '-grid-settings-window')?.destroy();
	}

	release()
	{
		this.#unSubscribeToEvents();
		const reset = this.#resetFilter();
		this.destroyPopups();

		return reset;
	}
}
