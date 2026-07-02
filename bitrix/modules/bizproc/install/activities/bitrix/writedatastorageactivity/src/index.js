import { Tag, Dom, Type, Event, Runtime } from 'main.core';
import { Context, Document, getGlobalContext, setGlobalContext } from 'bizproc.automation';
import { EventEmitter, BaseEvent } from 'main.core.events';

import { FilterFieldsManager } from './filter-fields-manager';
import { WriteFieldsManager } from './write-fields-manager';

import type { PropertyOptions, WriteFieldsOptions, ControlRenderers } from './types';

export class WriteDataStorageActivityRenderer
{
	#form: ?HTMLFormElement = null;
	#options: ?PropertyOptions = null;
	#writeFieldsOptions: ?WriteFieldsOptions = null;

	#documentType: Array<string> = [];
	#currentStorageId: string = '';
	#rewriteModeElement: ?HTMLElement = null;
	#rewriteModeSelect: ?HTMLSelectElement = null;
	#currentRewriteMode: string = '';
	#document: ?Document = null;
	#storageSelector: ?Object;
	#onRewriteModeChangeHandler: ?Function;
	#storageBlocks: Array<Object> = [];

	#filterFieldsManager: ?FilterFieldsManager = null;
	#writeFieldsManager: ?WriteFieldsManager = null;

	constructor()
	{
		this.#onRewriteModeChangeHandler = this.#onRewriteModeChange.bind(this);
	}

	getControlRenderers(): ControlRenderers
	{
		return {
			filterFields: (field: Object) => {
				this.#options = field.property.Options || {};
				this.#options.headCaption = field.property.Name;

				return Tag.render`
					<div data-role="bpa-sra-storage-id-dependent">
						<div data-role="bpa-sra-filter-fields-container"></div>
					</div>
				`;
			},
			writeFields: (field: Object) => {
				this.#writeFieldsOptions = field.property.Options || {};
				const addFieldCaption = this.#writeFieldsOptions.addFieldCaption || '';
				const newFieldCaption = this.#writeFieldsOptions.newFieldCaption || '';

				return Tag.render`
					<div data-role="bpa-write-fields-block">
						<div data-role="bpa-write-fields-outer" class="bizproc-write-activity__outer-block">
							<div id="fieldsContainer" class="bizproc-write-activity__fields-container"></div>
							<div id="add_field" class="node-settings-add-item-button"><div class="ui-icon-set --plus-m node-settings-add-item-button__plus bizproc-write-activity__icon-plus"></div><span>${addFieldCaption}</span></div>
							<div id="create_field" class="add-construction-field create-field-card"><div class="ui-icon-set --plus-m bizproc-write-activity__icon-plus"></div><span>${newFieldCaption}</span></div>
						</div>
					</div>
				`;
			},
		};
	}

	async afterFormRender(form: HTMLFormElement): void
	{
		const { StorageSelector, mapStorageBlocksToFilterFields, resolveCurrentStorageId } = await Runtime
			.loadExtension('bizproc.storage-selector');

		this.#form = form;

		if (Type.isPlainObject(this.#options))
		{
			this.#documentType = this.#options.documentType;

			if (!Type.isNil(this.#form))
			{
				this.#currentStorageId = resolveCurrentStorageId(this.#form, 'StorageCode');

				this.#rewriteModeElement = this.#form.querySelector(
					'[data-role="bpa-sra-storage-id-dependent"]',
				);

				this.#rewriteModeSelect = this.#form.RewriteMode ?? this.#form.rewrite_mode ?? null;
				this.#currentRewriteMode = this.#rewriteModeSelect?.value || '';
			}

			this.#document = new Document({
				rawDocumentType: this.#documentType,
				documentFields: [],
				title: 'document',
			});

			EventEmitter.subscribeOnce('BX.Bizproc.CommonNodeSettings:onBlocksReady', (event: BaseEvent) => {
				const { blocks } = event.getData();
				this.#storageBlocks = (blocks || []).filter(
					(block) => block.activity?.Type === 'CreateStorageNode',
				);

				this.#filterFieldsManager = new FilterFieldsManager({
					form: this.#form,
					options: this.#options,
					currentStorageId: this.#currentStorageId,
					storageBlocks: this.#storageBlocks,
					mapStorageBlocksToFilterFields,
				});

				if (this.#writeFieldsManager)
				{
					this.#writeFieldsManager.setStorageBlocks(this.#storageBlocks);
				}

				this.#writeFieldsManager = new WriteFieldsManager({
					form: this.#form,
					writeFieldsOptions: this.#writeFieldsOptions,
					documentType: this.#documentType,
					currentStorageId: this.#currentStorageId,
					storageBlocks: this.#storageBlocks,
				});
				this.#writeFieldsManager.init();

				this.#render();
			});

			this.#initAutomationContext();
			this.#initStorageSelector(StorageSelector);

			if (this.#rewriteModeSelect)
			{
				Event.bind(this.#rewriteModeSelect, 'change', this.#onRewriteModeChangeHandler);
			}

			this.#render();
		}
	}

	destroy(): void
	{
		if (this.#rewriteModeSelect)
		{
			Event.unbind(this.#rewriteModeSelect, 'change', this.#onRewriteModeChangeHandler);
		}

		if (this.#writeFieldsManager)
		{
			this.#writeFieldsManager.destroy();
		}

		if (this.#storageSelector)
		{
			this.#storageSelector.destroy();
			this.#storageSelector = null;
		}
	}

	#initAutomationContext(): void
	{
		try
		{
			getGlobalContext();
		}
		catch
		{
			setGlobalContext(new Context({ document: this.#document }));
		}
	}

	#initStorageSelector(StorageSelector): void
	{
		this.#storageSelector = new StorageSelector({
			dialogId: 'entityselector_storage_id',
			onStateChange: this.#onStorageStateChange.bind(this),
			initialValue: this.#currentStorageId,
			storageCodeInput: this.#form?.querySelector('[name="StorageCode"]'),
			footerOptions: {
				label: this.#writeFieldsOptions?.newStorageCaption || '',
				itemLink: '/bitrix/components/bitrix/bizproc.storage.item.list/?storageId=',
			},
		});
		this.#storageSelector.init();
	}

	async #onStorageStateChange(newStorageId: string): Promise<void>
	{
		if (this.#currentStorageId !== String(newStorageId))
		{
			this.#currentStorageId = String(newStorageId);

			if (this.#filterFieldsManager)
			{
				this.#filterFieldsManager.resetConditions();
				this.#filterFieldsManager.setCurrentStorageId(this.#currentStorageId);
			}

			this.#render();

			if (this.#writeFieldsManager)
			{
				await this.#writeFieldsManager.onStorageChange(this.#currentStorageId);
			}
		}
	}

	#onRewriteModeChange(): void
	{
		this.#currentRewriteMode = this.#rewriteModeSelect?.value || '';
		this.#render();
	}

	#render(): void
	{
		const hasStorage = this.#currentStorageId && this.#currentStorageId !== '0';
		const isMergeOrRewrite = ['mergeFields', 'rewriteFields'].includes(this.#currentRewriteMode);

		if (hasStorage && isMergeOrRewrite)
		{
			Dom.show(this.#rewriteModeElement);
			this.#filterFieldsManager?.render();
		}
		else
		{
			Dom.hide(this.#rewriteModeElement);
		}
	}
}
