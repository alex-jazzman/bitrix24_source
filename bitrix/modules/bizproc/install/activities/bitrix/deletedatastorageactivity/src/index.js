import { Type, Dom, Event, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import './style.css';

type Settings = {
	documentType: Array<string>;
	Prefix: string;
	Fields: Array<Object>;
	filterFieldsMap: Object;
};

/**
 * The "filter by fields" control is a standard `conditiongroup` field now: it renders
 * itself server-side and mounts via the field pipeline (self-bootstrap → initControl →
 * decorateConditionGroupField). This renderer keeps only the activity-specific wiring
 * around it — the delete-mode dependency, per-storage dynamic fields (API-02 setFields)
 * and the value selector (API-02 setValueSelector). No robot global context anymore.
 */
export class DeleteDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#settings: Settings = ({}: any);

	#currentStorageId: string = '';
	#currentDeleteMode: string = '';
	#deleteModeSelect: ?HTMLSelectElement = null;
	#onDeleteModeChangeHandler: ?Function;
	#dialog: ?Object = null;

	#filterFieldRow: ?HTMLElement = null;
	#conditionGroupControl: ?Object = null;
	#filterFieldsMap: Map<string, any> = new Map();
	#storageBlocks: Array<Object> = [];

	constructor()
	{
		this.#onDeleteModeChangeHandler = this.#onDeleteModeChange.bind(this);
	}

	async afterFormRender(form: HTMLFormElement, activityFields: Object): void
	{
		this.#form = form;

		const field = Type.isPlainObject(activityFields) ? activityFields.filter_fields : null;
		this.#settings = (field && Type.isPlainObject(field.property?.Settings)) ? field.property.Settings : ({}: any);

		const { StorageSelector, mapStorageBlocksToFilterFields, resolveCurrentStorageId } = await Runtime
			.loadExtension('bizproc.storage-selector');
		const { decorateConditionGroupField } = await Runtime.loadExtension('bizproc.condition');

		this.#currentStorageId = resolveCurrentStorageId(this.#form);
		this.#deleteModeSelect = this.#form.delete_mode;
		this.#currentDeleteMode = this.#deleteModeSelect?.value || '';

		// The control is mounted by the field pipeline; decorate again is idempotent and
		// returns the same instance, which also covers a mount/afterFormRender race.
		this.#filterFieldRow = this.#form.querySelector('#row_filter_fields');
		const controlNode = this.#form.querySelector('[data-role="bp-condition-group"]');
		this.#conditionGroupControl = controlNode ? decorateConditionGroupField(controlNode) : null;

		if (this.#conditionGroupControl && Type.isFunction(window.BPAShowSelector))
		{
			this.#conditionGroupControl.setValueSelector(
				(targetInputId: string) => window.BPAShowSelector(targetInputId, 'string', ''),
			);
		}

		// Full per-storage field map arrives via the activity-private Settings channel;
		// canvas storage nodes augment it once the blocks are ready.
		this.#filterFieldsMap = new Map(
			Object.entries(Type.isPlainObject(this.#settings.filterFieldsMap) ? this.#settings.filterFieldsMap : {})
				.map(([storageId, fieldsMap]) => [String(storageId), fieldsMap]),
		);

		EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', (event) => {
			const { blocks } = event.getData();
			this.#storageBlocks = (blocks || []).filter((block) => block.activity?.Type === 'CreateStorageNode');
			this.#filterFieldsMap = mapStorageBlocksToFilterFields(this.#storageBlocks, this.#filterFieldsMap);
			this.#applyFields();
		});

		this.#initStorageSelector(StorageSelector);

		if (this.#deleteModeSelect)
		{
			Event.bind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
		}

		this.#applyFields();
		this.#render();
	}

	#initStorageSelector(StorageSelector): void
	{
		this.#dialog = new StorageSelector({
			dialogId: 'entityselector_storage_id',
			onStateChange: this.#onStorageStateChange.bind(this),
			initialValue: this.#currentStorageId,
			storageCodeInput: this.#form?.querySelector('[name="storage_code"]'),
		});
		this.#dialog.init();
	}

	#onStorageStateChange(newStorageId: string): void
	{
		if (this.#currentStorageId !== String(newStorageId))
		{
			this.#currentStorageId = String(newStorageId);
			// Conditions built for the previous storage reference its fields; those fields are
			// invalid for the new storage (backend drops them and the activity errors out), so
			// reset the group before feeding the new field set.
			if (this.#conditionGroupControl && Type.isFunction(this.#conditionGroupControl.clear))
			{
				this.#conditionGroupControl.clear();
			}
			this.#applyFields();
		}

		this.#render();
	}

	#onDeleteModeChange(): void
	{
		this.#currentDeleteMode = this.#deleteModeSelect.value;
		this.#render();
	}

	#applyFields(): void
	{
		if (!this.#conditionGroupControl)
		{
			return;
		}

		// Editors that call afterFormRender without activityFields (edit-base-settings,
		// edit-extended-action) leave the per-storage map empty. When there is no entry for
		// the current storage, keep the server-rendered fields (DTO-01) instead of wiping them
		// with an empty set. An explicit map entry (even an empty one) is still applied.
		if (!this.#filterFieldsMap.has(this.#currentStorageId))
		{
			return;
		}

		const storageFields = this.#filterFieldsMap.get(this.#currentStorageId) || {};
		this.#conditionGroupControl.setFields(Object.values(storageFields));
	}

	#render(): void
	{
		if (!this.#filterFieldRow)
		{
			return;
		}

		if (this.#currentStorageId && this.#currentDeleteMode === 'multiple')
		{
			Dom.show(this.#filterFieldRow);
		}
		else
		{
			Dom.hide(this.#filterFieldRow);
		}
	}

	destroy(): void
	{
		if (this.#deleteModeSelect)
		{
			Event.unbind(this.#deleteModeSelect, 'change', this.#onDeleteModeChangeHandler);
		}

		if (this.#dialog)
		{
			this.#dialog.destroy();
			this.#dialog = null;
		}

		if (this.#conditionGroupControl && Type.isFunction(this.#conditionGroupControl.destroy))
		{
			this.#conditionGroupControl.destroy();
			this.#conditionGroupControl = null;
		}
	}
}
