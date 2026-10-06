import { Type, Dom, Event, Tag, Loc, Text } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';
// Side-effect import declares the runtime dependency so `ui.draganddrop.draggable`
// stays in the extension rel and its `BX.UI.DragAndDrop` namespace is loaded on the
// page; `Draggable` itself is dereferenced lazily at call time in #initDragNDrop.
import 'ui.draganddrop.draggable';

import { Condition } from '../condition/condition';
import { ConditionGroup } from '../condition/condition-group';
import { ConditionContext, SimpleConditionContext } from '../context/condition-context';
import { ConditionSelector } from './condition-selector';

type ConditionGroupSelectorOptions = {
	fields: Array<Object>,
	fieldPrefix: string,
	rootGroupTitle: string,
	onOpenFieldMenu: ?(BaseEvent) => void,
	onOpenMenu: ?(BaseEvent) => void,
	customSelectorFn: ?Function;
	showValuesSelector: boolean,
	caption: ?{
		head: string,
		add: string,
		collapsed: string,
	},
	isExpanded: boolean,
	renderExpandedInput: boolean,
	documentType: ?Array<any>,
	context: ?ConditionContext,
};

export class ConditionGroupSelector extends EventEmitter
{
	modern: boolean = true;// todo: remove 2024

	#conditionGroup: ConditionGroup;
	#fields: Array<Object>;
	#fieldPrefix: string;
	#itemSelectors: Array<ConditionSelector>;
	#onOpenFieldMenu: ?(BaseEvent) => void;
	#onOpenMenu: ?(BaseEvent) => void;
	#showValuesSelector: boolean;
	#rootGroupTitle: ?string;
	#context: ConditionContext;

	#options: ConditionGroupSelectorOptions = {};
	#toggleButtonNode: HTMLDivElement;
	#draggableNode: HTMLDivElement;
	#conditionContentNode: ?HTMLElement = null;
	#toggleTextNode: ?HTMLElement = null;
	#customSelectorFn: ?Function = null;
	#expandedInputNode: ?HTMLInputElement = null;
	#renderExpandedInput: boolean = false;

	constructor(conditionGroup: ConditionGroup, options: ConditionGroupSelectorOptions)
	{
		super();
		this.setEventNamespace('BX.Bizproc.Condition');

		this.#conditionGroup = conditionGroup;
		this.#fields = [];
		this.#fieldPrefix = 'condition_';
		this.#itemSelectors = [];

		if (Type.isPlainObject(options))
		{
			if (Type.isArray(options.fields))
			{
				this.#fields = options.fields;
			}

			if (options.fieldPrefix)
			{
				this.#fieldPrefix = options.fieldPrefix;
			}

			this.#rootGroupTitle = options.rootGroupTitle;
			this.#onOpenFieldMenu = options.onOpenFieldMenu;
			this.#onOpenMenu = options.onOpenMenu;
			this.#customSelectorFn = options.customSelectorFn;
			this.#showValuesSelector = options.showValuesSelector ?? true;
			this.#context = options.context;
			this.#renderExpandedInput = options.renderExpandedInput === true;

			this.#options = options;
		}

		if (!(this.#context instanceof ConditionContext))
		{
			this.#context = new SimpleConditionContext({
				fields: this.#fields,
				documentType: this.#options.documentType,
				title: this.#rootGroupTitle,
			});
		}
	}

	#buildConditionSelector(condition: Condition, joiner: ?string): ConditionSelector
	{
		const conditionSelector = new ConditionSelector(condition, {
			fields: this.#fields,
			joiner,
			fieldPrefix: this.#fieldPrefix,
			rootGroupTitle: this.#rootGroupTitle,
			onOpenFieldMenu: this.#onOpenFieldMenu,
			onOpenMenu: this.#onOpenMenu,
			showValuesSelector: this.#showValuesSelector,
			customSelectorFn: this.#customSelectorFn,
			context: this.#context,
		});
		conditionSelector.subscribe('onRemoveConditionClick', this.#onRemoveConditionClick.bind(this));

		return conditionSelector;
	}

	createNode()
	{
		this.#conditionGroup.getItems().forEach((item) => {
			this.#itemSelectors.push(this.#buildConditionSelector(item[0], item[1]));
		});

		const hasConditions = this.#conditionGroup.items.length > 0;
		const isCollapsed = this.#options.isExpanded !== true && hasConditions;

		const collapseButtonTitle = (
			isCollapsed
				? Loc.getMessage('BIZPROC_JS_AUTOMATION_EXPAND_CONDITION')
				: Loc.getMessage('BIZPROC_JS_AUTOMATION_COLLAPSE_CONDITION')
		);

		const { root, conditionContent, btnToggleList, btnTextNode, addButton, draggableNode } = Tag.render`
			<div class="bizproc-automation-popup-settings" data-testid="bp-condition-group">
				<div
					ref="conditionContent"
					class="bizproc-automation-popup-settings__condition-content ${isCollapsed ? '' : '--active'}"
				>
					<div class="bizproc-automation-popup-settings__condition-header">
						<span class="bizproc-automation-popup-settings-title">
							${Text.encode(this.#options.caption?.head)}
						</span>
						<div
							ref="btnToggleList"
							class="bizproc-automation-popup-settings__btn-toggle ${hasConditions ? '' : '--disabled'}"
							data-role="condition-toggle"
							data-testid="bp-condition-group-toggle"
						>
							<span ref="btnTextNode" class="bizproc-automation-popup-settings-title">
								${collapseButtonTitle}
							</span>
							<div class="ui-icon-set --chevron-down" style="--ui-icon-set__icon-size: 16px;"></div>
						</div>
					</div>
					<div class="bizproc-automation-popup-settings__transition-height-wrapper">
						<div class="bizproc-automation-popup-settings__transition-height-content">
							<div class="bizproc-automation-popup-settings__condition-body">
								<div ref="draggableNode" class="bizproc-automation-popup-settings__condition">
									${this.#itemSelectors.map((selector) => selector.createNode())}
								</div>
								<span class="bizproc-automation-popup-settings-link-wrapper">
									<a ref="addButton" class="bizproc-automation-popup-settings-link" data-testid="bp-condition-group-add">
										${Text.encode(this.#options.caption?.add || Loc.getMessage('BIZPROC_JS_AUTOMATION_ADD_CONDITION'))}
									</a>
								</span>
							</div>
						</div>
					</div>
					<div class="bizproc-automation-popup-settings__transition-height-wrapper --revert">
						<div class="bizproc-automation-popup-settings__transition-height-content">
							<div class="bizproc-automation-popup-settings__condition-help">
								${Text.encode(this.#options.caption?.collapsed || Loc.getMessage('BIZPROC_JS_AUTOMATION_CONDITION_COLLAPSED_TITLE_1'))}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
		this.#toggleButtonNode = btnToggleList;
		this.#draggableNode = draggableNode;
		this.#conditionContentNode = conditionContent;
		this.#toggleTextNode = btnTextNode;

		Event.bind(btnToggleList, 'click', this.#onToggleGroupViewClick.bind(this));
		Event.bind(addButton, 'click', this.addItem.bind(this));
		this.#initDragNDrop();

		// The expanded/collapsed state is submitted with the form as part of the field value.
		if (this.#renderExpandedInput)
		{
			this.#expandedInputNode = Tag.render`
				<input type="hidden" name="${this.#fieldPrefix}isExpanded" value="${isCollapsed ? 'N' : 'Y'}">
			`;
			Dom.prepend(this.#expandedInputNode, root);
		}

		return root;
	}

	#onToggleGroupViewClick()
	{
		const isExpanded = !Dom.hasClass(this.#conditionContentNode, '--active');
		this.#setExpanded(isExpanded);

		this.emit(
			'onToggleGroupViewClick',
			new BaseEvent({ data: { isCollapsed: !isExpanded, isExpanded } }),
		);
	}

	#setExpanded(isExpanded: boolean)
	{
		if (!Type.isDomNode(this.#conditionContentNode))
		{
			return;
		}

		if (isExpanded)
		{
			Dom.addClass(this.#conditionContentNode, '--active');
		}
		else
		{
			Dom.removeClass(this.#conditionContentNode, '--active');
		}

		if (this.#expandedInputNode)
		{
			this.#expandedInputNode.value = isExpanded ? 'Y' : 'N';
		}

		if (Type.isDomNode(this.#toggleTextNode))
		{
			Dom.adjust(this.#toggleTextNode, {
				text: (
					isExpanded
						? Loc.getMessage('BIZPROC_JS_AUTOMATION_COLLAPSE_CONDITION')
						: Loc.getMessage('BIZPROC_JS_AUTOMATION_EXPAND_CONDITION')
				),
			});
		}
	}

	#initDragNDrop()
	{
		// `Draggable` is read from the runtime global (not a static import) so the
		// `ui.draganddrop.draggable` namespace is dereferenced at method-call time,
		// after all extensions have initialised - avoiding a module-init race in the
		// lean `bizproc.condition` bundle. The host that mounts the control provides
		// the extension (robots designer via `bizproc.automation`).
		const Draggable = BX?.UI?.DragAndDrop?.Draggable;
		if (!Draggable)
		{
			return;
		}

		new Draggable({
			container: this.#draggableNode,
			type: Draggable.CLONE,
			draggable: '.bizproc-automation-popup-settings__condition-selector',
			dragElement: '.bizproc-automation-popup-settings__condition-item_draggable',
		});
	}

	addItem()
	{
		const conditionSelector = this.#buildConditionSelector(new Condition({}, this.#conditionGroup));
		this.#itemSelectors.push(conditionSelector);

		Dom.append(conditionSelector.createNode(), this.#draggableNode);
		if (Dom.hasClass(this.#toggleButtonNode, '--disabled'))
		{
			Dom.removeClass(this.#toggleButtonNode, '--disabled');
		}
	}

	/**
	 * Public post-mount API: replace the field set and repaint the rows.
	 * Used by activities from `afterFormRender` when the field list is dynamic.
	 */
	setFields(fields: Array<Object>)
	{
		this.#fields = Type.isArray(fields) ? fields : [];
		if (this.#context && Type.isFunction(this.#context.setFields))
		{
			this.#context.setFields(this.#fields);
		}

		this.#refreshItems();
	}

	/**
	 * Public post-mount API: set a runtime value-selector callback
	 * `(targetInputId) => void` (not serialisable into `data-config`).
	 */
	setValueSelector(fn: ?Function)
	{
		this.#customSelectorFn = Type.isFunction(fn) ? fn : null;
		this.#refreshItems();
	}

	/**
	 * Public post-mount API: drop all conditions and repaint an empty group. Used by activities
	 * when the field context fully changes (e.g. a different storage) - conditions built for the
	 * previous field set are invalid there and must not leak into the new one.
	 */
	clear()
	{
		this.#itemSelectors.forEach((selector) => selector.destroy());
		this.#itemSelectors = [];

		if (Type.isDomNode(this.#draggableNode))
		{
			Dom.clean(this.#draggableNode);
		}

		// An empty group must stay editable: expand the content so the "add condition"
		// link is reachable (matching the zero-condition initial render), then disable
		// the toggle since there is nothing to collapse.
		if (!Dom.hasClass(this.#conditionContentNode, '--active'))
		{
			this.#setExpanded(true);
		}

		if (Type.isDomNode(this.#toggleButtonNode) && !Dom.hasClass(this.#toggleButtonNode, '--disabled'))
		{
			Dom.addClass(this.#toggleButtonNode, '--disabled');
		}
	}

	#refreshItems()
	{
		if (!Type.isDomNode(this.#draggableNode))
		{
			return;
		}

		// Rebuild from the live selectors (their current conditions + joiners), not from the
		// initial #conditionGroup model - user-added/removed/edited rows must survive a
		// setFields()/setValueSelector() repaint. The model is only the initial snapshot and
		// is not kept in sync with addItem / remove / joiner toggles.
		const currentItems = this.#itemSelectors.map((selector) => [selector.getCondition(), selector.getJoiner()]);

		this.#itemSelectors.forEach((selector) => selector.destroy());
		this.#itemSelectors = [];
		Dom.clean(this.#draggableNode);

		currentItems.forEach(([condition, joiner]) => {
			const conditionSelector = this.#buildConditionSelector(condition, joiner);
			this.#itemSelectors.push(conditionSelector);
			Dom.append(conditionSelector.createNode(), this.#draggableNode);
		});
	}

	#onRemoveConditionClick(event: BaseEvent)
	{
		const conditionSelector = event.getData().conditionSelector;
		if (conditionSelector)
		{
			const index = this.#itemSelectors.indexOf(conditionSelector);
			if (index > -1)
			{
				this.#itemSelectors.splice(index, 1);
			}
		}

		if (this.#itemSelectors.length <= 0 && !Dom.hasClass(this.#toggleButtonNode, '--disabled'))
		{
			Dom.addClass(this.#toggleButtonNode, '--disabled');
		}
	}

	destroy()
	{
		this.#itemSelectors.forEach((selector) => selector.destroy());
		this.#itemSelectors = [];
	}
}
