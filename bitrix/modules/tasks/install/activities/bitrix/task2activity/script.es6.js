import { SelectorManager } from 'bizproc.automation';
import { Reflection, Type, Tag, Dom, Text, Event, Loc } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { TagSelector } from 'ui.entity-selector';
import { Footer } from 'tasks.entity-selector';
import { LiveAnnouncer } from 'ui.a11y';

const namespace = Reflection.namespace('BX.Tasks.Automation.Activity');

const TagType = {
	EXPRESSION: 'expression',
	NEW: 'new',
	SIMPLE: 'simple',
};

const CheckListRole = {
	BLOCKS: 'tasks-check-list-blocks',
	BLOCK: 'tasks-check-list-block',
	BLOCK_ADD: 'tasks-check-list-block-add',
	BLOCK_REMOVE: 'tasks-check-list-block-remove',
	BLOCK_TEMPLATE: 'tasks-check-list-block-template',
	BLOCKS_LIMIT_NOTE: 'tasks-check-list-blocks-limit-note',
	NAME: 'tasks-check-list-name',
	NAME_ADD: 'tasks-check-list-name-add',
	NAME_LABEL: 'tasks-check-list-name-label',
	NAME_SLOT: 'tasks-check-list-name-slot',
	NAME_TEMPLATE: 'tasks-check-list-name-template',
	FOOTER: 'tasks-check-list-footer',
	ITEMS: 'tasks-check-list-items',
	ITEM: 'tasks-check-list-item',
	ITEM_LABEL: 'tasks-check-list-item-label',
	ITEM_ERROR: 'tasks-check-list-item-error',
	ITEM_REMOVE: 'tasks-check-list-item-remove',
	ITEM_TEMPLATE: 'tasks-check-list-item-template',
	ADD: 'tasks-check-list-add',
	COUNTER: 'tasks-check-list-counter',
	LIMIT_NOTE: 'tasks-check-list-limit-note',
	EMPTY: 'tasks-check-list-empty',
};

const CheckListClass = {
	ITEM_ERROR: '--error',
	READ_ONLY: '--readonly',
};

const SETTINGS_READ_ONLY_MARK = '--js-bp-settings-readonly';
const DEFAULT_ITEM_INDEX_PLACEHOLDER = '#INDEX#';
const EXPRESSION_BUILDER_TRIGGER = '[data-role="expression-builder-trigger"]';
const SELECTOR_BUTTON = '[data-role="bp-selector-button"]';
// controls holding the text of a row: `readonly` keeps their text selectable, unlike `disabled`
const TEXT_CONTROL = 'textarea, input:not([type]), input[type="text"]';
// the kind of a row: nothing the user works with, and a disabled one would leave the form
const HIDDEN_CONTROL = 'input[type="hidden"]';

class Task2Activity
{
	#form: HTMLFormElement;
	#selectedGroupId: ?(number | string);
	#groupIdSelector: ?TagSelector;
	#selectedFlowId: ?(number | string);
	#flowIdSelector: ?TagSelector;

	#selectedTags: Map<number, string> = new Map();
	#expressionTags: Set<string> = new Set();
	#newTags: Set<string> = new Set();
	#tagsSelector: ?TagSelector;

	#dependsOnSelector: ?TagSelector;
	#selectedDependentTasks: Set<string | number>;
	#designersControlledByFlowFields: HTMLElement[];
	#gottenFromFlowFields: HTMLElement[] = [];
	#flowId: Element;
	#flowIdExpression: Element;
	#flowDistributionType: string;
	#flowModifiedFieldsMap: Map<string, string>;
	#flowDistributionMap: Map<number, string>;
	#controlledByFlowFields: [];
	#robotControlledByFlowFieldSelector: [];
	#robotControlledByFlowFields: [];
	#fakeRobotControlledByFlowFields: [] = [];

	constructor(options: {
		isRobot: boolean,
		controlledByFlowFields: ?Array<string>;
		flowModifiedFieldsMap: Map<string, string>,
		flowDistributionMap: Map<number, string>,
		flowDistributionType: ?string,
		flowList: ?Array<Map<string, string>>,
		formName: ?string,
		selectedGroupId: ?(number | string),
		selectedFlowId: ?number,
		selectedTags: Array<{ type: string, id: ?number, name: string } | string>,
		dependsOn: Array<string | number>,
	})
	{
		this.#flowModifiedFieldsMap = options.flowModifiedFieldsMap;
		this.#flowDistributionMap = options.flowDistributionMap;

		if (options.isRobot)
		{
			this.#form = document.forms.namedItem(options.formName);
			if (!Type.isDomNode(this.#form.GROUP_ID))
			{
				Dom.append(Tag.render`<select name="GROUP_ID" hidden="true"></select>`, this.#form);
			}

			if (!Type.isDomNode(this.#form.FLOW_ID))
			{
				Dom.append(Tag.render`<select name="FLOW_ID" hidden="true"></select>`, this.#form);
			}

			this.#selectedGroupId = options.selectedGroupId;
			this.#selectedFlowId = options.selectedFlowId;
			this.#getControlledByFlowFields(options.controlledByFlowFields);

			options.selectedTags.forEach((tag) => {
				if (tag.type === TagType.EXPRESSION)
				{
					this.#expressionTags.add(tag.name);
				}
				else if (tag.type === TagType.SIMPLE && Type.isNumber(tag.id))
				{
					this.#selectedTags.set(tag.id, tag.name);
				}
				else if (tag.type === TagType.NEW)
				{
					this.#newTags.add(tag.name);
				}
			});

			this.#selectedDependentTasks = new Set(options.dependsOn);
		}
		else
		{
			this.#designersControlledByFlowFields = [];
			this.#controlledByFlowFields = [];

			if (options.selectedFlowId > 0)
			{
				this.#selectedFlowId = options.selectedFlowId;
				this.#flowDistributionType = options.flowDistributionMap[this.#selectedFlowId];
				this.#controlledByFlowFields = options.flowModifiedFieldsMap[this.#flowDistributionType];
			}

			for (const fieldName of this.#controlledByFlowFields)
			{
				const field = document.querySelector(`[name="${fieldName}"]`)?.closest('td[width="60%"]');
				if (field)
				{
					this.#designersControlledByFlowFields.push(field);
				}
			}

			this.#flowId = document.querySelector('[name="FLOW_ID"]');
			this.#flowIdExpression = document.querySelector('[name="FLOW_ID_text"]');

			Event.bind(this.#flowId, 'change', this.#onChangedFlow.bind(this));
			Event.bind(this.#flowIdExpression, 'blur', this.#onChangedFlow.bind(this));

			this.#onChangedFlow();
		}
	}

	#getControlledByFlowFields(controlledByFlowFields: Array<string>)
	{
		const fieldSelectors = [];
		const fields = [];
		for (const fieldName of (controlledByFlowFields ?? []))
		{
			const target =
				document.getElementById(`id_${fieldName}`)
				?? document.querySelector(`[name="${fieldName}"]:not([type="hidden"])`)
			;

			if (!target)
			{
				continue;
			}

			const selector = SelectorManager.getSelectorByTarget(target)?.userSelector?.tagSelector;
			if (selector)
			{
				selector.setTagMaxWidth(240);
				fieldSelectors.push(selector);
			}
			else
			{
				fields.push(selector?.target ?? target);
			}
		}

		this.#robotControlledByFlowFieldSelector = fieldSelectors;
		this.#robotControlledByFlowFields = fields;
	}

	render(): void
	{
		this.watchAllowTimeTracking();

		this.renderGroupId();
		this.renderTags();
		this.renderDependsOn();
		this.#renderFlowId();
	}

	watchAllowTimeTracking()
	{
		const allowTrackingElement = this.#form.ALLOW_TIME_TRACKING[1];

		const timeEstimateElements = [this.#form.TIME_ESTIMATE_H, this.#form.TIME_ESTIMATE_M];
		const timeEstimateFieldElements = timeEstimateElements.map((element) => element.parentElement.parentElement);

		if (allowTrackingElement)
		{
			const manageTimeEstimateFields = () => {
				if (allowTrackingElement.checked)
				{
					timeEstimateFieldElements.forEach((element) => {
						element.style.display = '';
					});
				}
				else
				{
					timeEstimateFieldElements.forEach((element) => {
						element.style.display = 'none';
					});
				}
			};

			manageTimeEstimateFields();
			allowTrackingElement.onchange = manageTimeEstimateFields;
		}
	}

	renderGroupId(): void
	{
		const groupIdElement = document.getElementById('bizproc-task2activity-group-id');
		if (groupIdElement)
		{
			const selector = SelectorManager.getSelectorByTarget(groupIdElement);

			if (selector)
			{
				selector.subscribe('Field:Selected', (event) => {
					if (this.#getGroupIdSelector().isLocked())
					{
						return;
					}
					const { field } = event.getData();
					this.#selectedGroupId = field.Expression;
					this.#getGroupIdSelector().addTag({
						id: field.Expression,
						title: field.Expression,
						entityId: 'project',
					});
					this.#recreateTagSelector();
				});
			}
			this.#getGroupIdSelector().renderTo(groupIdElement);
		}
	}

	#getGroupIdSelector(): TagSelector
	{
		if (Type.isNil(this.#groupIdSelector))
		{
			const self = this;

			this.#groupIdSelector = new TagSelector({
				multiple: false,
				events: {
					onTagAdd(event: BaseEvent)
					{
						const { tag } = event.getData();

						Dom.clean(self.#form.GROUP_ID);
						self.#selectedGroupId = tag.id;
						self.#form.GROUP_ID.append(new Option(tag.getTitle(), tag.getId(), true, true));
						self.#recreateTagSelector();
					},
					onTagRemove()
					{
						Dom.clean(self.#form.GROUP_ID);
						self.#selectedGroupId = undefined;
						self.#recreateTagSelector();
					},
				},
				dialogOptions: {
					preselectedItems: (
						Type.isNumber(this.#selectedGroupId)
							? [['project', this.#selectedGroupId]]
							: undefined
					),
					entities: [
						{
							id: 'project',
						},
					],
					preload: true,
				},
			});

			if (Type.isString(this.#selectedGroupId))
			{
				this.#groupIdSelector.addTag({
					id: this.#selectedGroupId,
					entityId: 'project',
					title: this.#selectedGroupId,
				});
			}

			this.#groupIdSelector.setTagMaxWidth(240);
		}

		return this.#groupIdSelector;
	}

	#renderFlowId()
	{
		const flowIdElement = document.getElementById('bizproc-task2activity-flow-id');
		if (flowIdElement)
		{
			const selector = SelectorManager.getSelectorByTarget(flowIdElement);
			if (selector)
			{
				selector.subscribe('Field:Selected', (event) => {
					const { field } = event.getData();
					this.#selectedFlowId = field.Expression;
					this.#getFlowIdSelector().addTag({
						id: field.Expression,
						title: field.Expression,
						entityId: 'flow',
					});
				});
			}
			this.#getFlowIdSelector().renderTo(flowIdElement);
		}
	}

	#getFlowIdSelector(): TagSelector
	{
		if (Type.isNil(this.#flowIdSelector))
		{
			this.#flowIdSelector = new TagSelector({
				multiple: false,
				events: {
					onTagAdd: (event: BaseEvent) => {
						const { tag } = event.getData();
						Dom.clean(this.#form.FLOW_ID);
						this.#form.FLOW_ID.append(new Option(tag.getTitle(), tag.getId(), true, true));

						this.#flowDistributionType = this.#getFlowDistributionType(event.target.getDialog(), tag);
						const newFieldsControlledByFlow = this.#flowModifiedFieldsMap[this.#flowDistributionType];
						this.#getControlledByFlowFields(newFieldsControlledByFlow);

						this.#setFlowValues(this.#getGroupByFlow(event.target.getDialog(), tag));
						this.#lockFieldsControlledByFlow();
					},
					onTagRemove: () => {
						Dom.clean(this.#form.FLOW_ID);
						this.#selectedFlowId = undefined;

						this.#unlockFieldsControlledByFlow();
					},
				},
				dialogOptions: {
					preselectedItems: (
						Type.isNumber(this.#selectedFlowId)
							? [['flow', this.#selectedFlowId]]
							: undefined
					),
					entities: [
						{
							id: 'flow',
							options: {
								onlyActive: true,
							},
						},
					],
					preload: true,
				},
			});

			if (Type.isStringFilled(this.#selectedFlowId))
			{
				this.#flowIdSelector.addTag({
					id: this.#selectedFlowId,
					entityId: 'flow',
					title: this.#selectedFlowId,
				});
			}
		}

		return this.#flowIdSelector;
	}

	renderTags()
	{
		const tagsElement = document.getElementById('bizproc-task2activity-tags');
		if (tagsElement)
		{
			const selector = SelectorManager.getSelectorByTarget(tagsElement);
			if (selector)
			{
				selector.subscribe('Field:Selected', (event) => {
					const { field } = event.getData();

					this.#getTagsSelector().addTag({
						id: field.Expression,
						title: field.Expression,
						entityId: 'task-tag',
						customData: {
							type: TagType.EXPRESSION,
						},
					});
				});
			}
			this.#getTagsSelector().renderTo(tagsElement);
		}
	}

	async #recreateTagSelector(): Promise
	{
		await this.#loadTagsDialog();

		if (!Type.isNil(this.#tagsSelector))
		{
			// Due to the display of the dialog loader by timeout, have to wait for the timer
			await new Promise((resolve, reject) => setTimeout(400, resolve));
			this.#tagsSelector.getDialog().destroy();
			Dom.remove(this.#tagsSelector.getOuterContainer());
			this.#tagsSelector = null;
		}
		this.#form
			.querySelectorAll('input[name="TAG_NAMES[]"]')
			.forEach((element) => Dom.remove(element));

		this.renderTags();
	}

	async #loadTagsDialog(): Promise
	{
		if (this.#tagsSelector.getDialog().isLoading())
		{
			await this.#fetchTags();
		}
	}

	#getTagsSelector(): TagSelector
	{
		if (Type.isNil(this.#tagsSelector))
		{
			const self = this;
			const selectedGroupId = Type.isString(this.#selectedGroupId) ? undefined : this.#selectedGroupId;

			this.#tagsSelector = new TagSelector({
				multiple: true,
				events: {
					onTagAdd(event: BaseEvent)
					{
						const { tag } = event.getData();
						const type = tag.getCustomData().get('type') ?? TagType.SIMPLE;

						self.#addTag(type, tag.getId(), tag.getTitle());
					},
					onTagRemove(event: BaseEvent)
					{
						const { tag } = event.getData();

						self.#removeTag(tag.getId());
					},
				},
				dialogOptions: {
					width: 400,
					height: 300,
					dropdownMode: true,
					enableSearch: true,
					compactView: true,
					searchOptions: {
						allowCreateItem: false,
					},
					footer: Footer,
					footerOptions: {
						groupId: selectedGroupId,
					},
					offsetTop: 12,
					entities: [
						{
							id: 'task-tag',
							options: {
								groupId: selectedGroupId,
							},
						},
					],
				},
			});

			this.#fillTagsSelector();
		}

		return this.#tagsSelector;
	}

	#fillTagsSelector()
	{
		this.#updateSavedTags().then(({ newTags, newSelectedTags }) => {
			const expressionTags = this.#expressionTags;
			this.#expressionTags = new Set();

			for (const [tagId, tagName] of newSelectedTags.entries())
			{
				this.#tagsSelector.addTag({
					id: tagId,
					title: tagName,
					entityId: 'task-tag',
					customData: {
						type: TagType.SIMPLE,
					},
				});
			}

			for (const tagName of newTags.values())
			{
				this.#tagsSelector.addTag({
					id: tagName,
					title: tagName,
					entityId: 'task-tag',
					customData: {
						type: TagType.NEW,
					},
				});
			}

			for (const tagName of expressionTags.values())
			{
				this.#tagsSelector.addTag({
					id: tagName,
					title: tagName,
					entityId: 'task-tag',
					customData: {
						type: TagType.EXPRESSION,
					},
				});
			}

			// const preselectedItems = Array.from(this.#selectedTags.keys()).map(tagId => ['task-tag', tagId]);
			// this.#tagsSelector.getDialog().setPreselectedItems(preselectedItems);
		});
	}

	async #updateSavedTags(): Promise<{ newTags: Set<string>, newSelectedTags: Map<number, string> }>
	{
		await this.#fetchTags();

		const knownTags = new Set();
		const knownTagNames = new Map();
		for (const tag of this.#tagsSelector.getDialog().getItems())
		{
			knownTags.add(tag.getId());
			knownTagNames.set(tag.getTitle(), tag.getId());
		}

		const newSelectedTags = new Map();
		const newTags = new Set();
		for (const [tagId, tagName] of this.#selectedTags.entries())
		{
			if (knownTags.has(tagId))
			{
				newSelectedTags.set(tagId, tagName);
			}
			else
			{
				newTags.add(tagName);
			}
		}

		for (const tagName of this.#newTags.values())
		{
			if (knownTagNames.has(tagName))
			{
				newSelectedTags.set(knownTagNames.get(tagName), tagName);
			}
			else
			{
				newTags.add(tagName);
			}
		}

		return {
			newSelectedTags,
			newTags,
		};
	}

	async #fetchTags(): Promise
	{
		const tagsDialog = this.#tagsSelector.getDialog();
		if (!tagsDialog.isLoaded())
		{
			await new Promise((resolve, reject) => {
				const onLoad = () => {
					tagsDialog.unsubscribe('onLoadError', onLoadError);
					resolve();
				};

				const onLoadError = () => {
					tagsDialog.unsubscribe('onLoad', onLoad);
					reject();
				};

				tagsDialog.subscribeOnce('onLoad', onLoad);
				tagsDialog.subscribeOnce('onLoadError', onLoadError);

				tagsDialog.load();
			});
		}
	}

	#addTag(type: string, id: ?(number | string), name: string)
	{
		switch (type)
		{
			case TagType.SIMPLE: {
				this.#selectedTags.set(id, name);

				break;
			}

			case TagType.EXPRESSION: {
				this.#expressionTags.add(name);

				break;
			}

			case TagType.NEW: {
				this.#newTags.add(name);

				break;
			}

			default: {
				return;
			}
		}

		Dom.append(Tag.render`<input name="TAG_NAMES[]" value="${Text.encode(name)}" hidden/>`, this.#form);
	}

	#removeTag(id: string | number)
	{
		let name = null;
		if (this.#expressionTags.has(id))
		{
			name = id;
			this.#expressionTags.delete(id);
		}
		else if (this.#selectedTags.has(id))
		{
			name = this.#selectedTags.get(id);
			this.#selectedTags.delete(id);
		}
		else if (this.#newTags.has(id))
		{
			name = id;
			this.#newTags.delete(id);
		}

		const tagValueElement = this.#form.querySelector(
			`input[name="TAG_NAMES[]"][value="${Text.encode(name)}"]`,
		);
		if (tagValueElement)
		{
			Dom.remove(tagValueElement);
		}
	}

	renderDependsOn()
	{
		const dependsOnElement = document.getElementById('bizproc-task2activity-depends-on');
		if (dependsOnElement)
		{
			const selector = SelectorManager.getSelectorByTarget(dependsOnElement);
			if (selector)
			{
				selector.subscribe('Field:Selected', (event) => {
					const { field } = event.getData();

					this.#getDependsOnSelector().addTag({
						id: field.Expression,
						title: field.Expression,
						entityId: 'task',
					});
				});
			}
			this.#getDependsOnSelector().renderTo(dependsOnElement);
		}
	}

	#getDependsOnSelector(): TagSelector
	{
		if (Type.isNil(this.#dependsOnSelector))
		{
			const self = this;

			this.#dependsOnSelector = new TagSelector({
				multiple: true,
				events: {
					onTagAdd(event: BaseEvent)
					{
						const { tag } = event.getData();

						self.#addDependsOnTaskId(tag.getId());
					},
					onTagRemove(event: BaseEvent)
					{
						const { tag } = event.getData();

						self.#removeDependsOnTaskId(tag.getId());
					},
				},
				dialogOptions: {
					width: 400,
					height: 300,
					dropdownMode: true,
					compactView: true,
					enableSearch: true,
					searchOptions: {
						allowCreateItem: false,
					},
					offsetTop: 12,
					entities: [
						{
							id: 'task',
						},
					],
					preselectedItems: (
						[...this.#selectedDependentTasks]
							.filter((taskId) => Type.isNumber(taskId))
							.map((taskId) => ['task', taskId])
					),
				},
			});

			for (const taskId of this.#selectedDependentTasks.values())
			{
				if (Type.isString(taskId))
				{
					this.#dependsOnSelector.addTag({
						id: taskId,
						title: taskId,
						entityId: 'task',
					});
				}
			}
		}

		return this.#dependsOnSelector;
	}

	#addDependsOnTaskId(id: string | number)
	{
		this.#selectedDependentTasks.add(id);

		Dom.append(Tag.render`<input name="DEPENDS_ON[]" value="${Text.encode(id)}" hidden/>`, this.#form);
	}

	#removeDependsOnTaskId(id: string | number)
	{
		this.#selectedDependentTasks.delete(id);

		const taskIdElement = this.#form.querySelector(
			`input[name="DEPENDS_ON[]"][value="${Text.encode(id)}"]`,
		);

		if (taskIdElement)
		{
			Dom.remove(taskIdElement);
		}
	}

	#onChangedFlow()
	{
		this.#showFieldsControlledByFlow();

		if (this.#flowId.value || this.#flowIdExpression.value)
		{
			this.#updateFieldsControlledByFlow();
			this.#hideFieldsControlledByFlow();
		}
	}

	#hideFieldsControlledByFlow()
	{
		const gottenFromFlowFields = [];
		for (const [index, field] of this.#designersControlledByFlowFields.entries())
		{
			field.hidden = true;
			if (this.#gottenFromFlowFields[index])
			{
				this.#gottenFromFlowFields[index].hidden = false;
			}
			else
			{
				const gottenFromFlow = Tag.render`<td class="adm-detail-content-cell-r">${Loc.getMessage('TASKS_BP_FLOW_CONTROLLED_VALUE')}</td>`;
				Dom.append(gottenFromFlow, field.parentNode);
				gottenFromFlowFields[index] = gottenFromFlow;
			}
		}

		if (!Type.isArrayFilled(this.#gottenFromFlowFields))
		{
			this.#gottenFromFlowFields = gottenFromFlowFields;
		}
	}

	#showFieldsControlledByFlow()
	{
		for (const [index, field] of this.#designersControlledByFlowFields.entries())
		{
			field.hidden = false;
			if (this.#gottenFromFlowFields[index])
			{
				this.#gottenFromFlowFields[index].hidden = true;
			}
		}
	}

	#updateFieldsControlledByFlow()
	{
		this.#flowDistributionType = this.#flowDistributionMap[this.#flowId.value];
		this.#controlledByFlowFields = this.#flowModifiedFieldsMap[this.#flowDistributionType] ?? [];
		this.#designersControlledByFlowFields = [];
		this.#gottenFromFlowFields = [];

		for (const fieldName of this.#controlledByFlowFields)
		{
			const field = document.querySelector(`[name="${fieldName}"]`)?.closest('td[width="60%"]');
			if (field)
			{
				this.#designersControlledByFlowFields.push(field);
			}
		}
	}

	#lockFieldsControlledByFlow()
	{
		this.#getGroupIdSelector().lock();
		for (const selector of this.#robotControlledByFlowFieldSelector)
		{
			selector.lock();
		}

		for (const [index, field] of this.#robotControlledByFlowFields.entries())
		{
			field.disabled = true;

			const fakeField = field.cloneNode(true);
			fakeField.value = Loc.getMessage('TASKS_BP_RPD_FLOW_CONTROLLED_SHORT_VALUE');
			Dom.replace(field, fakeField);
			this.#fakeRobotControlledByFlowFields[index] = fakeField;
		}
	}

	#unlockFieldsControlledByFlow()
	{
		this.#unlockSelector(this.#getGroupIdSelector());
		for (const selector of this.#robotControlledByFlowFieldSelector)
		{
			this.#unlockSelector(selector);
		}

		for (const [index, field] of this.#robotControlledByFlowFields.entries())
		{
			field.disabled = false;

			if (this.#fakeRobotControlledByFlowFields[index])
			{
				const fakeField = this.#fakeRobotControlledByFlowFields[index];
				Dom.replace(fakeField, field);
			}
		}
	}

	#unlockSelector(selector)
	{
		selector.removeTags();
		selector.unlock();
	}

	#setFlowValues(group)
	{
		this.#getGroupIdSelector().addTag({
			id: group?.id ?? Text.getRandom(),
			title: group?.getTitleNode().text ?? Loc.getMessage('TASKS_BP_RPD_FLOW_CONTROLLED_VALUE'),
			entityId: 'project',
			avatar: group?.getAvatar(),
		});

		for (const selector of this.#robotControlledByFlowFieldSelector)
		{
			selector.addTag({
				id: Text.getRandom(),
				title: Loc.getMessage('TASKS_BP_RPD_FLOW_CONTROLLED_VALUE'),
				entityId: 'employee',
			});
		}

		for (const field of this.#robotControlledByFlowFields)
		{
			this.#setFieldFlowValue(field);
		}
	}

	#setFieldFlowValue(field: Element)
	{
		if (field.type === 'checkbox')
		{
			field.checked = false;
		}
		else
		{
			field.value = '';
		}
	}

	#getFlowDistributionType(dialog, flow)
	{
		return dialog?.items?.get('flow')?.get(String(flow.id))?.customData?.get('distributionType');
	}

	#getGroupByFlow(dialog, flow)
	{
		const groupId = dialog?.items?.get('flow')?.get(String(flow.id))?.customData?.get('groupId');

		return this.#getGroupIdSelector().getDialog().items?.get('project')?.get(String(groupId));
	}
}

namespace.Task2Activity = Task2Activity;

/**
 * Check list of the task settings form.
 * The field holds blocks, a block holds rows, and a row is rendered by the bizproc field type: the
 * control only adds, removes and counts them, and a new row is a copy of the hidden sample rendered
 * by the same field type. The nodes of the wrapper are printed by the dialog in one block with the
 * container the constructor bails out on, so they are taken as given: checked is only what the field
 * type prints inside a row.
 */
class CheckListControl
{
	#container: ?HTMLElement;
	#blocksContainer: ?HTMLElement;
	#itemTemplate: ?HTMLTemplateElement;
	#blockTemplate: ?HTMLTemplateElement;
	#nameTemplate: ?HTMLTemplateElement;
	#addBlockButton: ?HTMLElement;
	#blocksLimitNote: ?HTMLElement;

	#itemIndexPlaceholder: string;
	#maxItemsCount: number;
	#maxItemLength: number;
	#maxListsCount: number;
	#nextIndex: number = 0;

	constructor(options: {
		container: ?HTMLElement,
		itemIndexPlaceholder: ?string,
		maxItemsCount: ?number,
		maxItemLength: ?number,
		maxListsCount: ?number,
	} = {})
	{
		// the dialog hands the container over: a page may hold more than one settings form, and a
		// lookup across the document would bind every control to the first check list on the page
		this.#container = options.container;
		if (!Type.isDomNode(this.#container))
		{
			return;
		}

		this.#blocksContainer = this.#queryRole(CheckListRole.BLOCKS);
		this.#itemTemplate = this.#queryRole(CheckListRole.ITEM_TEMPLATE);
		this.#blockTemplate = this.#queryRole(CheckListRole.BLOCK_TEMPLATE);
		this.#nameTemplate = this.#queryRole(CheckListRole.NAME_TEMPLATE);
		this.#addBlockButton = this.#queryRole(CheckListRole.BLOCK_ADD);
		this.#blocksLimitNote = this.#queryRole(CheckListRole.BLOCKS_LIMIT_NOTE);

		this.#itemIndexPlaceholder = options.itemIndexPlaceholder ?? DEFAULT_ITEM_INDEX_PLACEHOLDER;
		// the limits are the ones the server checks on saving: the dialog hands them over as numbers
		this.#maxItemsCount = Text.toNumber(options.maxItemsCount);
		this.#maxItemLength = Text.toNumber(options.maxItemLength);
		this.#maxListsCount = Text.toNumber(options.maxListsCount);

		// blocks and rows keep their numbers forever and draw them from one running count: the number
		// names the control the field type printed, and handing one out twice would give two of them
		// the same id
		[...this.#getBlocks(), ...this.#getRows()].forEach((node) => {
			this.#nextIndex = Math.max(this.#nextIndex, Text.toNumber(node.dataset.index) + 1);
		});

		this.#getRows().forEach((row) => {
			this.#markLayoutTables(row);
			this.#watchRowValue(row);
			this.#checkRowLength(row);
		});

		Event.bind(this.#container, 'click', this.#onContainerClick.bind(this));

		if (this.#isReadOnly())
		{
			this.#lock();
		}

		// the rows printed by the dialog are numbered here once, block by block; later a click
		// renumbers the rows of the block it changed and no others
		this.#getBlocks().forEach((block) => this.#refreshBlockItems(block));
		this.#refresh();
	}

	#addItem(block: ?HTMLElement): ?HTMLElement
	{
		if (!Type.isDomNode(block) || this.#isReadOnly() || this.#getItems(block).length >= this.#maxItemsCount)
		{
			return null;
		}

		const item = this.#createFromTemplate(this.#itemTemplate);

		this.#copyExpressionBuilderTrigger(item);
		Dom.append(item, this.#queryRole(CheckListRole.ITEMS, block));
		this.#watchRowValue(item);
		this.#refresh(block);
		this.#revealItem(item, block);

		const itemsCount = this.#getItems(block).length;
		this.#announce(Loc.getMessage('TASKS_BP_CHECK_LIST_ITEM_ADDED', { '#NUM#': String(itemsCount) }));
		if (itemsCount >= this.#maxItemsCount)
		{
			this.#announce(this.#getLimitReachedText());
		}

		return item;
	}

	/**
	 * Brings the row just added and the footer of its block into view (ALG-03).
	 *
	 * Both calls are needed and neither is a safety net. Measured on the stand: the browser already
	 * pulls the focused field of the new row up by some twenty pixels, so the row itself comes out
	 * whole while the footer stays about as much below the edge: the footer is what breaks the
	 * promise today. The call on the row matters in exactly one position, when the row is cut by the
	 * upper edge while the footer is already in sight; elsewhere it does nothing.
	 *
	 * The scrolling container is not looked for: the native call climbs every scrollable ancestor on
	 * its own and honours their scroll padding, so the control needs to know neither the settings
	 * panel of the designer nor the modal window of the classic editor. `nearest` leaves the scroll
	 * where it is when the element is already whole in view, and that is what keeps an untouched
	 * position untouched. Smoothness is deliberately not asked for: two smooth calls in a row race
	 * each other and the result stops being predictable. The footer goes last, so the button of the
	 * block is the anchor that survives.
	 */
	#revealItem(item: HTMLElement, block: HTMLElement): void
	{
		// without `preventScroll` the browser scrolls to its own taste before either call below
		item.querySelector('textarea')?.focus({ preventScroll: true });

		item.scrollIntoView({ block: 'nearest' });
		this.#queryRole(CheckListRole.FOOTER, block)?.scrollIntoView({ block: 'nearest' });
	}

	#addBlock(): ?HTMLElement
	{
		if (this.#isReadOnly() || this.#getBlocks().length >= this.#maxListsCount)
		{
			return null;
		}

		const block = this.#createFromTemplate(this.#blockTemplate);
		const name = this.#queryRole(CheckListRole.NAME, block);

		this.#copyExpressionBuilderTrigger(name);
		Dom.append(block, this.#blocksContainer);
		this.#watchRowValue(name);

		const blocksCount = this.#getBlocks().length;
		const control = name?.querySelector('textarea');
		if (control)
		{
			control.value = this.#getDefaultTitle(blocksCount);
		}

		// the pass follows the default title just written: the name of the block is built out of it
		this.#refresh();
		control?.focus();

		this.#announce(Loc.getMessage('TASKS_BP_CHECK_LIST_ADDED', { '#NUM#': String(blocksCount) }));
		if (blocksCount >= this.#maxListsCount)
		{
			this.#announce(this.#getListsLimitReachedText());
		}

		return block;
	}

	/**
	 * The row of the name is never printed for a block that came without one, because printing it
	 * would write a heading into the value of a template nobody edited. This action is what puts the
	 * row there instead, and once put it stays: an emptied name is still a name, and a row taken back
	 * would make the value depend on whether the dialog had been opened.
	 */
	#addName(block: ?HTMLElement): ?HTMLElement
	{
		if (!Type.isDomNode(block) || this.#isReadOnly() || this.#queryRole(CheckListRole.NAME, block))
		{
			return null;
		}

		const name = this.#createFromTemplate(this.#nameTemplate);

		this.#copyExpressionBuilderTrigger(name);
		Dom.append(name, this.#queryRole(CheckListRole.NAME_SLOT, block));
		this.#watchRowValue(name);
		this.#refresh();
		// the row comes up empty: a name the user did not write is no name of theirs
		name.querySelector('textarea')?.focus();

		this.#announce(Loc.getMessage('TASKS_BP_CHECK_LIST_NAME_ADDED', {
			'#NUM#': String(this.#getBlocks().indexOf(block) + 1),
		}));

		return name;
	}

	/**
	 * The designer mounts its expression builder over the rendered form once and watches for no new
	 * rows, so an added row gets the trigger the same way a cloned legacy row gets it: as a copy of a
	 * live one, put right before the selector button, where a mounted trigger sits and where the click
	 * delegation of the designer looks for it. A copy is what the next mounting pass expects as well —
	 * it replaces a cloned trigger with one of its own. Nothing to copy means no trigger: composing one
	 * here would mean printing the markup of another module by hand.
	 *
	 * The donor is looked for over the whole field rather than inside the block of the row: a block
	 * just added holds nothing but the row asking for the trigger.
	 */
	#copyExpressionBuilderTrigger(row: ?HTMLElement): void
	{
		const button = row?.querySelector(SELECTOR_BUTTON);
		const mountedTrigger = this.#container.querySelector(EXPRESSION_BUILDER_TRIGGER);
		if (!button || !mountedTrigger)
		{
			return;
		}

		Dom.insertBefore(mountedTrigger.cloneNode(true), button);
	}

	/**
	 * The selector of the panel writes the value without typing and reports it with an event that does
	 * not bubble, so the length is watched on the field of the row rather than on the container.
	 */
	#watchRowValue(row: ?HTMLElement): void
	{
		const control = row?.querySelector('textarea');
		if (!control)
		{
			return;
		}

		const onValue = this.#onRowValue.bind(this, row);
		Event.bind(control, 'input', onValue);
		Event.bind(control, 'change', onValue);
	}

	// the title of a block is part of the name of that block, so it follows what is typed into the row
	#onRowValue(row: HTMLElement): void
	{
		this.#checkRowLength(row);

		if (row.dataset.role === CheckListRole.NAME)
		{
			const block = row.closest(`[data-role="${CheckListRole.BLOCK}"]`);
			if (Type.isDomNode(block))
			{
				this.#applyBlockName(block, this.#getBlocks().indexOf(block) + 1);
			}
		}
	}

	#removeItem(item: ?HTMLElement): void
	{
		if (!Type.isDomNode(item) || this.#isReadOnly())
		{
			return;
		}

		const block = item.closest(`[data-role="${CheckListRole.BLOCK}"]`);
		const position = this.#getItems(block).indexOf(item) + 1;

		this.#moveFocusOut(item, this.#queryRole(CheckListRole.ADD, block));
		Dom.remove(item);
		this.#refresh(block);
		this.#announce(Loc.getMessage('TASKS_BP_CHECK_LIST_ITEM_REMOVED', { '#NUM#': String(position) }));
	}

	#removeBlock(block: ?HTMLElement): void
	{
		if (!Type.isDomNode(block) || this.#isReadOnly() || this.#getBlocks().length <= 1)
		{
			return;
		}

		const position = this.#getBlocks().indexOf(block) + 1;

		this.#moveFocusOut(block, this.#addBlockButton);
		Dom.remove(block);
		this.#refresh();
		this.#announce(Loc.getMessage('TASKS_BP_CHECK_LIST_REMOVED', { '#NUM#': String(position) }));
	}

	// the node taking the place of the removed one keeps the context; an emptied list hands focus on
	#moveFocusOut(node: HTMLElement, fallback: ?HTMLElement): void
	{
		if (!node.contains(document.activeElement))
		{
			return;
		}

		const neighbour = node.nextElementSibling ?? node.previousElementSibling;
		const target = neighbour?.querySelector('textarea') ?? fallback;

		target?.focus();
	}

	#onContainerClick(event: MouseEvent): void
	{
		const action = event.target.closest('[data-role]');
		if (!action)
		{
			return;
		}

		const block = action.closest(`[data-role="${CheckListRole.BLOCK}"]`);

		if (action.dataset.role === CheckListRole.ITEM_REMOVE)
		{
			this.#removeItem(action.closest(`[data-role="${CheckListRole.ITEM}"]`));
		}
		else if (action.dataset.role === CheckListRole.ADD)
		{
			this.#addItem(block);
		}
		else if (action.dataset.role === CheckListRole.NAME_ADD)
		{
			this.#addName(block);
		}
		else if (action.dataset.role === CheckListRole.BLOCK_REMOVE)
		{
			this.#removeBlock(block);
		}
		else if (action.dataset.role === CheckListRole.BLOCK_ADD)
		{
			this.#addBlock();
		}
	}

	/**
	 * The pass over the blocks carries what their number decides and what a block says about itself.
	 * Rows are numbered inside their own block, so only the block a click changed is renumbered:
	 * walking every row of the field on every addition is the cost this split takes away.
	 */
	#refresh(changedBlock: ?HTMLElement = null): void
	{
		const blocks = this.#getBlocks();
		const isAtLimit = blocks.length >= this.#maxListsCount;

		blocks.forEach((block, position) => this.#refreshBlock(block, position + 1, blocks.length));

		if (Type.isDomNode(changedBlock))
		{
			this.#refreshBlockItems(changedBlock);
		}

		this.#markAtLimit(this.#addBlockButton, isAtLimit);
		this.#blocksLimitNote.textContent = isAtLimit && !this.#isReadOnly()
			? this.#getListsLimitReachedText()
			: ''
		;
	}

	#refreshBlock(block: HTMLElement, number: number, total: number): void
	{
		const itemsCount = this.#getItems(block).length;
		const isAtLimit = itemsCount >= this.#maxItemsCount;
		const isReadOnly = this.#isReadOnly();

		// `aria-posinset` and `aria-setsize` are no part of the `group` role, so the position is told
		// by the name alone; the container of the blocks carries no role of a set for them either
		this.#applyBlockName(block, number);

		const name = this.#queryRole(CheckListRole.NAME, block);
		if (name)
		{
			this.#applyNamePosition(name, number);
		}

		const nameAdd = this.#queryRole(CheckListRole.NAME_ADD, block);
		if (nameAdd)
		{
			nameAdd.hidden = name !== null || isReadOnly;
		}

		const blockRemove = this.#queryRole(CheckListRole.BLOCK_REMOVE, block);
		// the field always holds a check list, the way the server draws it: the only one is not removed,
		// and its items are emptied instead
		blockRemove.hidden = total <= 1 || isReadOnly;
		blockRemove.setAttribute(
			'aria-label',
			Loc.getMessage('TASKS_BP_CHECK_LIST_DELETE_LIST', { '#NUM#': String(number) }) ?? '',
		);

		this.#queryRole(CheckListRole.EMPTY, block).hidden = itemsCount > 0;
		this.#markAtLimit(this.#queryRole(CheckListRole.ADD, block), isAtLimit);
		this.#queryRole(CheckListRole.COUNTER, block).textContent = (
			isReadOnly
				? Loc.getMessage('TASKS_BP_CHECK_LIST_COUNTER_READ_ONLY', {
					'#COUNT#': String(itemsCount),
				})
				: Loc.getMessage('TASKS_BP_CHECK_LIST_COUNTER', {
					'#COUNT#': String(itemsCount),
					'#LIMIT#': String(this.#maxItemsCount),
				})
		) ?? '';

		this.#queryRole(CheckListRole.LIMIT_NOTE, block).textContent = isAtLimit && !isReadOnly
			? this.#getLimitReachedText()
			: ''
		;
	}

	/**
	 * A button that adds nothing more says so with `aria-disabled` and keeps its place in the tab
	 * order: the note telling why nothing can be added is the description of that very button, and a
	 * natively disabled button never takes the focus, so the note would be out of reach in the only
	 * state it is written for. The refusal itself belongs to the actions, which count the rows before
	 * adding one, so a click and a key press alike come to nothing here.
	 */
	#markAtLimit(button: HTMLElement, isAtLimit: boolean): void
	{
		if (isAtLimit)
		{
			button.setAttribute('aria-disabled', 'true');
		}
		else
		{
			button.removeAttribute('aria-disabled');
		}
	}

	#refreshBlockItems(block: HTMLElement): void
	{
		const items = this.#getItems(block);

		items.forEach((item, position) => this.#applyItemPosition(item, position + 1, items.length));
	}

	// names follow the position in the list, so what is heard matches what is counted on the screen
	#applyItemPosition(item: HTMLElement, number: number, total: number): void
	{
		item.setAttribute('aria-posinset', String(number));
		item.setAttribute('aria-setsize', String(total));

		const label = this.#queryRole(CheckListRole.ITEM_LABEL, item);
		label.textContent = Loc.getMessage(
			'TASKS_BP_CHECK_LIST_ITEM_LABEL',
			{ '#NUM#': String(number) },
		) ?? '';

		// the name is put on the field rather than around it: a label wrapping the row would take in
		// the selector button of the field type and read its value as part of the name
		item.querySelector('textarea')?.setAttribute('aria-labelledby', label.id);

		this.#queryRole(CheckListRole.ITEM_REMOVE, item).setAttribute(
			'aria-label',
			Loc.getMessage('TASKS_BP_CHECK_LIST_ITEM_DELETE', { '#NUM#': String(number) }) ?? '',
		);
	}

	#applyNamePosition(name: HTMLElement, number: number): void
	{
		const label = this.#queryRole(CheckListRole.NAME_LABEL, name);
		label.textContent = Loc.getMessage(
			'TASKS_BP_CHECK_LIST_NAME_LABEL',
			{ '#NUM#': String(number) },
		) ?? '';

		name.querySelector('textarea')?.setAttribute('aria-labelledby', label.id);
	}

	// the field type wraps the control in a table of its own: that table is layout, not data, and
	// the tables of a row never change after it is created
	#markLayoutTables(row: HTMLElement): void
	{
		row.querySelectorAll('table').forEach((table) => {
			table.setAttribute('role', 'presentation');
		});
	}

	/**
	 * The name of a block carries the title the user wrote, not only the position: ten blocks named
	 * alike are told apart on the screen by their titles and have to be told apart by ear as well.
	 * The title is read off the row instead of being pointed at with `aria-labelledby`, because the
	 * row is a form control and would be read as one inside the name.
	 */
	#applyBlockName(block: HTMLElement, number: number): void
	{
		const position = Loc.getMessage('TASKS_BP_CHECK_LIST_LABEL', { '#NUM#': String(number) }) ?? '';
		const title = this.#getBlockTitle(block);
		// the title left as it was filled in says the position again: the phrase compared against is
		// the very one that writes it, so no two phrases have to read alike
		const name = (title === '' || title === this.#getDefaultTitle(number))
			? position
			: Loc.getMessage('TASKS_BP_CHECK_LIST_LABEL_NAMED', {
				'#NUM#': String(number),
				'#NAME#': title,
			})
		;

		block.setAttribute('aria-label', name ?? '');
	}

	// the name the control fills a new check list in with, shared with the title the activity gives a
	// root of that number on execution
	#getDefaultTitle(number: number): string
	{
		return Loc.getMessage('BPSA_CHECK_LIST_TITLE', { '#NUMBER#': String(number) }) ?? '';
	}

	#getBlockTitle(block: HTMLElement): string
	{
		const control = this.#queryRole(CheckListRole.NAME, block)?.querySelector('textarea');

		return control ? control.value.trim() : '';
	}

	#getLimitReachedText(): string
	{
		return Loc.getMessage('TASKS_BP_CHECK_LIST_LIMIT_REACHED', {
			'#LIMIT#': String(this.#maxItemsCount),
		}) ?? '';
	}

	#getListsLimitReachedText(): string
	{
		return Loc.getMessage('TASKS_BP_CHECK_LIST_COUNT_LIMIT_REACHED', {
			'#LIMIT#': String(this.#maxListsCount),
		}) ?? '';
	}

	#announce(message: ?string): void
	{
		if (Type.isStringFilled(message))
		{
			LiveAnnouncer.announce(message);
		}
	}

	#checkRowLength(row: HTMLElement): void
	{
		const control = row.querySelector('textarea');
		if (!control)
		{
			return;
		}

		// the server counts characters with mb_strlen(), so the value is spread into code points
		const isTooLong = [...control.value].length > this.#maxItemLength;
		if (isTooLong)
		{
			Dom.addClass(row, CheckListClass.ITEM_ERROR);
			control.setAttribute('aria-invalid', 'true');
		}
		else
		{
			Dom.removeClass(row, CheckListClass.ITEM_ERROR);
			control.removeAttribute('aria-invalid');
		}

		const errorNode = this.#queryRole(CheckListRole.ITEM_ERROR, row);
		errorNode.hidden = !isTooLong;
		// a referenced node is read even while hidden, so the link follows the state, not only the text
		if (isTooLong)
		{
			control.setAttribute('aria-describedby', errorNode.id);
		}
		else
		{
			control.removeAttribute('aria-describedby');
		}
	}

	#lock(): void
	{
		Dom.addClass(this.#container, CheckListClass.READ_ONLY);

		this.#lockControls();
		// the designer mounts its expression builder over the form after the inline script of that form
		// has raised this control, so a row locked once would get a live trigger back
		new MutationObserver(() => this.#lockControls()).observe(this.#container, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * The rows are printed by code of their own: the field type prints the control with the selector
	 * button, the designer mounts an expression builder trigger next to them — so what is switched off
	 * is stated by what an element can do instead of by a list of tags that the next kind of button
	 * would slip past: every form control of the field goes off, and only the text stays selectable.
	 * The actions adding and removing rows and blocks are hidden outright, and they are looked for
	 * over the whole field: all but one of them lie outside the rows.
	 */
	#lockControls(): void
	{
		[
			CheckListRole.ADD,
			CheckListRole.BLOCK_ADD,
			CheckListRole.BLOCK_REMOVE,
			CheckListRole.ITEM_REMOVE,
			CheckListRole.NAME_ADD,
		].forEach((role) => {
			this.#container.querySelectorAll(`[data-role="${role}"]`).forEach((node) => {
				node.hidden = true;
			});
		});

		this.#container.querySelectorAll('*').forEach((node) => {
			if (node.matches(TEXT_CONTROL))
			{
				node.readOnly = true;
			}
			else if ('disabled' in node && !node.matches(HIDDEN_CONTROL))
			{
				node.disabled = true;
			}
		});
	}

	#isReadOnly(): boolean
	{
		// the mark class starts with a double hyphen, so it is matched as an attribute value
		return this.#container.closest(`[class~="${SETTINGS_READ_ONLY_MARK}"]`) !== null;
	}

	#createFromTemplate(template: HTMLTemplateElement): HTMLElement
	{
		// markup comes from the sample rendered by the field type, only the number is substituted
		const holder = Dom.create('div', {
			html: template.innerHTML.split(this.#itemIndexPlaceholder).join(String(this.#nextIndex)),
		});
		this.#nextIndex++;

		const row = holder.firstElementChild;
		this.#markLayoutTables(row);

		return row;
	}

	#getBlocks(): HTMLElement[]
	{
		return [...this.#blocksContainer.querySelectorAll(`[data-role="${CheckListRole.BLOCK}"]`)];
	}

	#getItems(block: HTMLElement): HTMLElement[]
	{
		const itemsContainer = this.#queryRole(CheckListRole.ITEMS, block);

		return [...itemsContainer.querySelectorAll(`[data-role="${CheckListRole.ITEM}"]`)];
	}

	// rows of both kinds: the length of a name is checked the way the length of an item is
	#getRows(): HTMLElement[]
	{
		return [...this.#blocksContainer.querySelectorAll(
			`[data-role="${CheckListRole.NAME}"], [data-role="${CheckListRole.ITEM}"]`,
		)];
	}

	#queryRole(role: string, scope: HTMLElement = this.#container): ?HTMLElement
	{
		return scope.querySelector(`[data-role="${role}"]`);
	}
}

namespace.CheckListControl = CheckListControl;
