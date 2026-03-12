import {
	ConditionGroup,
	ConditionGroupSelector,
	Context,
	Document,
	getGlobalContext,
	setGlobalContext,
} from 'bizproc.automation';
import { Dom, Event, Type } from 'main.core';
import { BaseEvent } from 'main.core.events';

type Options = {
	documentType: Array,
	headCaption: string,
	collapsedCaption: string,
	filterFieldsMap: Object,
	conditions: Object,
	filteringFieldsPrefix: string,
	formName: string,
};

export class StorageFilter
{
	#form: ?HTMLFormElement = null;
	#options = null;
	#documentType: Array<string> = [];
	#storageIdSelect: ?HTMLSelectElement = null;
	#writeModeElement: ?HTMLElement = null;
	#writeModeSelect: ?HTMLSelectElement = null;
	#currentWriteMode: string = '';
	#document: ?Document = null;
	#conditionGroup: ?ConditionGroup = null;
	#filteringFieldsPrefix: string = '';
	#filterFieldsMap: Map<number, any> = new Map();
	#onWriteModeChangeHandler: Function | null;
	#container: ?HTMLElement = null;

	static Mode = {
		NEW: 'newItem',
		MERGE: 'mergeFields',
		REWRITE: 'rewriteFields',
	};

	constructor(options: Options)
	{
		if (!Type.isPlainObject(options))
		{
			return;
		}
		this.#options = options;
		this.#form = document.forms[options.formName];

		if (!this.#form)
		{
			return;
		}

		this.#documentType = options.documentType;
		this.#onWriteModeChangeHandler = this.#onWriteModeChange.bind(this);

		if (!Type.isNil(this.#form))
		{
			this.#storageIdSelect = this.#form.StorageId;
			this.#writeModeElement = this.#form.querySelector(
				'[data-role="bpa-sra-storage-id-dependent"]',
			);

			this.#writeModeSelect = this.#form.RewriteMode;
			this.#currentWriteMode = this.#writeModeSelect?.value || '';
		}

		this.#document = new Document({
			rawDocumentType: this.#documentType,
			documentFields: [],
			title: 'document',
		});

		this.#initAutomationContext();
		this.#initFilterFields(options);

		if (this.#writeModeSelect)
		{
			Event.bind(this.#writeModeSelect, 'change', this.#onWriteModeChangeHandler);
		}

		this.#render();
	}

	#renderFilterFields(): void
	{
		if (!Type.isNil(this.#conditionGroup))
		{
			const storageId = Number(this.#storageIdSelect?.value || 0);
			const selector = new ConditionGroupSelector(this.#conditionGroup, {
				fields: Object.values(this.#filterFieldsMap.get(storageId) || {}),
				fieldPrefix: this.#filteringFieldsPrefix,
				customSelector: Type.isFunction(window.BPAShowSelector) ? this.#showFieldSelector : null,
				caption: {
					head: this.#options.headCaption,
					collapsed: this.#options.collapsedCaption,
				},
				isExpanded: this.#getFilterExpandedState(),
			});

			selector.subscribe('onToggleGroupViewClick', (event: BaseEvent) => {
				const data = event.getData();
				this.#saveFilterExpandedState(data.isExpanded);
			});

			Dom.clean(this.#container);
			Dom.append(selector.createNode(), this.#container);
		}
	}

	#getFilterExpandedState(): boolean
	{
		return this.#form.IsExpanded?.value === 'Y';
	}

	#saveFilterExpandedState(isExpanded: boolean): void
	{
		if (this.#form.IsExpanded)
		{
			this.#form.IsExpanded.value = isExpanded ? 'Y' : 'N';
		}
	}

	#showFieldSelector(targetInputId: string): void
	{
		window.BPAShowSelector(targetInputId, 'string', '');
	}

	#onWriteModeChange(): void
	{
		this.#currentWriteMode = this.#writeModeSelect?.value || '';
		this.#render();
	}

	renderTo(container: HTMLElement): void
	{
		if (Type.isNil(container))
		{
			return;
		}

		this.#container = container;
		this.#render();
	}

	#render(): void
	{
		if (Type.isNil(this.#container))
		{
			return;
		}

		if (this.#currentWriteMode === StorageFilter.Mode.MERGE || this.#currentWriteMode === StorageFilter.Mode.REWRITE)
		{
			Dom.show(this.#writeModeElement);
			this.#renderFilterFields();
		}
		else
		{
			Dom.hide(this.#writeModeElement);
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

	#initFilterFields(options: Object): void
	{
		const filterFieldsMap = Type.isPlainObject(options.filterFieldsMap) ? options.filterFieldsMap : {};
		const conditions = options.conditions ?? null;
		this.#filteringFieldsPrefix = options.filteringFieldsPrefix ?? '';
		this.#filterFieldsMap = new Map(
			Object.entries(filterFieldsMap)
				.map(([storageId, fieldsMap]) => [Number(storageId), fieldsMap]),
		);

		this.#conditionGroup = new ConditionGroup(conditions);
	}
}

export default StorageFilter;
