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
import { ConditionViewMode, ConditionViewRenderer, normalizeConditionViewMode } from './condition-view-renderer';

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
	viewMode?: string,
	renderHeaderAction?: (container: HTMLElement) => void,
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
	#draggable: ?Object = null;
	#conditionContentNode: ?HTMLElement = null;
	#toggleTextNode: ?HTMLElement = null;
	#customSelectorFn: ?Function = null;
	#expandedInputNode: ?HTMLInputElement = null;
	#renderExpandedInput: boolean = false;
	#viewMode: string = ConditionViewMode.Legacy;
	#renderHeaderAction: ?(container: HTMLElement) => void = null;
	#removeButtons: WeakMap<ConditionSelector, HTMLElement> = new WeakMap();

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
			this.#viewMode = normalizeConditionViewMode(options.viewMode);
			this.#renderHeaderAction = options.renderHeaderAction;

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
			viewMode: this.#viewMode,
		});
		conditionSelector.subscribe('onRemoveConditionClick', this.#onRemoveConditionClick.bind(this));
		conditionSelector.subscribe('onChange', this.#emitChange.bind(this));

		return conditionSelector;
	}

	createNode()
	{
		this.#conditionGroup.getItems().forEach((item) => {
			this.#itemSelectors.push(this.#buildConditionSelector(item[0], item[1]));
		});

		if (this.#viewMode === ConditionViewMode.New)
		{
			// Seeding the initial render is not a change made by the user, so nothing is emitted here.
			this.#seedFirstRow();

			const renderer = new ConditionViewRenderer();
			const conditionNodes = this.#itemSelectors.map((selector, index) => this.#createConditionNode(selector, index, renderer));
			const { root, draggableNode, addButton } = renderer.createGroupNode(conditionNodes);
			this.#draggableNode = draggableNode;
			Event.bind(addButton, 'click', this.addItem.bind(this));
			this.#mountHeaderAction();
			this.#initDragNDrop();

			return root;
		}

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

	#createConditionNode(
		selector: ConditionSelector,
		index: number,
		renderer: ?ConditionViewRenderer = null,
	): HTMLElement
	{
		if (this.#viewMode !== ConditionViewMode.New)
		{
			return selector.createNode();
		}

		// A row that is already painted is moved into the new card as it stands: the position in the
		// list belongs to the card, while the row holds live value controls built by the host - and
		// the values the user typed into them.
		const conditionNode = selector.node ?? selector.createNode();
		const viewRenderer = renderer || new ConditionViewRenderer();
		if (index === 0)
		{
			const rootNode = viewRenderer.createRootGroupNode(conditionNode);
			this.#mountRemoveButton(selector, rootNode);

			return rootNode;
		}

		// The joiner is stored the way the backend reads it: items[i][1] links condition i to the
		// next one, and the joiner of the last condition is never looked at. The switch is painted
		// in the header of a card, above its own condition, so it describes the link to the
		// previous one and belongs to the previous selector.
		const joinerOwner = this.#itemSelectors[index - 1];
		const nestedNode = viewRenderer.createNestedGroupNode(
			conditionNode,
			joinerOwner.getJoiner(),
		);
		this.#mountRemoveButton(selector, nestedNode);
		const andButton = nestedNode.querySelector('[data-role="condition-joiner-and"]');
		const orButton = nestedNode.querySelector('[data-role="condition-joiner-or"]');
		const descriptionNode = nestedNode.querySelector('[data-role="condition-joiner-description"]');
		const setJoiner = (joiner) => {
			joinerOwner.setJoiner(joiner);
			this.#paintJoinerButton(andButton, joiner === ConditionGroup.JOINER.And);
			this.#paintJoinerButton(orButton, joiner === ConditionGroup.JOINER.Or);
			Dom.adjust(descriptionNode, { text: viewRenderer.getJoinerDescription(joiner) });
		};
		Event.bind(andButton, 'click', () => setJoiner(ConditionGroup.JOINER.And));
		Event.bind(orButton, 'click', () => setJoiner(ConditionGroup.JOINER.Or));

		return nestedNode;
	}

	// The two buttons of the switch differ by the class the theme paints and by the pressed state a
	// screen reader reads out, so both are set from the same choice.
	#paintJoinerButton(button: HTMLElement, isActive: boolean)
	{
		Dom.toggleClass(button, '--active', isActive);
		Dom.attr(button, 'aria-pressed', isActive ? 'true' : 'false');
	}

	// The new view always shows the first row, so a group left with no conditions is painted with one
	// blank condition instead of a lone "add" button - both when it arrives empty and when the user
	// empties it. The blank row carries no field, so getValue() drops it until it gets one.
	#seedFirstRow()
	{
		if (this.#viewMode !== ConditionViewMode.New || this.#itemSelectors.length > 0)
		{
			return;
		}

		this.#itemSelectors.push(this.#buildConditionSelector(new Condition({}, this.#conditionGroup)));
	}

	// The button is drawn inside the row and lives in the header of the card. A row that is remounted
	// has already given its button away, so the button is remembered instead of being looked for in
	// the row it has left.
	#mountRemoveButton(selector: ConditionSelector, cardNode: HTMLElement)
	{
		const removeButton = (
			this.#removeButtons.get(selector)
			?? selector.node?.querySelector('[data-testid="bp-condition-remove"]')
		);
		const headerAction = cardNode.querySelector('[data-role="condition-header-action"]');
		if (removeButton && headerAction)
		{
			this.#removeButtons.set(selector, removeButton);
			Dom.append(removeButton, headerAction);
		}
	}

	// The host is handed one slot, the one of the first card. Headers are built with their cards and
	// go with them on every repaint, so the action is placed again into the slot that replaced it.
	#mountHeaderAction()
	{
		if (!this.#renderHeaderAction || !Type.isDomNode(this.#draggableNode))
		{
			return;
		}

		const container = this.#draggableNode.querySelector('[data-role="condition-header-action"]');
		if (container)
		{
			this.#renderHeaderAction(container);
		}
	}

	// Cards carry their position (root card vs joined card), so after a removal or a reorder the cards
	// are built anew around the rows, which carry nothing of the sort and are kept as they are.
	#rerenderItems()
	{
		if (this.#viewMode !== ConditionViewMode.New || !this.#draggableNode)
		{
			return;
		}

		const renderer = new ConditionViewRenderer();
		// The cards are built before the list is emptied: building one moves the row it wraps out of
		// the card it came from, so what is dropped here are the headers alone.
		const cards = this.#itemSelectors.map((selector, index) => this.#createConditionNode(selector, index, renderer));
		Dom.clean(this.#draggableNode);
		cards.forEach((card) => Dom.append(card, this.#draggableNode));
		this.#mountHeaderAction();
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

		// Its sensors listen on `document`, so a previous instance has to go before a new one
		// is mounted onto the same group.
		this.#destroyDragNDrop();
		this.#draggable = new Draggable({
			container: this.#draggableNode,
			type: Draggable.CLONE,
			draggable: this.#viewMode === ConditionViewMode.New
				? '.ui-draggable--item'
				: '.bizproc-automation-popup-settings__condition-selector',
			dragElement: this.#viewMode === ConditionViewMode.New
				? '.bizproc-condition-group__drag'
				: '.bizproc-automation-popup-settings__condition-item_draggable',
		});
		this.#draggable.subscribe('end', this.#onDragEnd.bind(this));
	}

	#destroyDragNDrop()
	{
		this.#draggable?.destroy();
		this.#draggable = null;
	}

	// Dragging moves the cards in the DOM only, so the order is read back from there: the value
	// is built from #itemSelectors, and in the new view a card also carries its position (root
	// card with the badge vs card joined by AND/OR), which has to be repainted for the new order.
	#onDragEnd()
	{
		if (!Type.isDomNode(this.#draggableNode))
		{
			return;
		}

		const reordered = [...this.#draggableNode.children]
			.map((card) => this.#itemSelectors.find((selector) => selector.node && card.contains(selector.node)))
			.filter(Boolean)
		;
		if (reordered.length !== this.#itemSelectors.length)
		{
			return;
		}

		const isSameOrder = reordered.every((selector, index) => selector === this.#itemSelectors[index]);
		if (isSameOrder)
		{
			return;
		}

		this.#itemSelectors = reordered;
		this.#rerenderItems();
		this.#emitChange();
	}

	addItem()
	{
		const conditionSelector = this.#buildConditionSelector(new Condition({}, this.#conditionGroup));
		this.#itemSelectors.push(conditionSelector);

		Dom.append(
			this.#createConditionNode(conditionSelector, this.#itemSelectors.length - 1),
			this.#draggableNode,
		);
		if (this.#viewMode === ConditionViewMode.Legacy && Dom.hasClass(this.#toggleButtonNode, '--disabled'))
		{
			Dom.removeClass(this.#toggleButtonNode, '--disabled');
		}
		this.#emitChange();
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
	 * Public post-mount API: drop all conditions and repaint an empty group - in the new view the
	 * card stays and is emptied, exactly as an empty group is first painted. Used by activities
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

		if (this.#viewMode === ConditionViewMode.New)
		{
			this.#seedFirstRow();
			this.#rerenderItems();

			return;
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

		currentItems.forEach(([condition, joiner], index) => {
			const conditionSelector = this.#buildConditionSelector(condition, joiner);
			this.#itemSelectors.push(conditionSelector);
			Dom.append(this.#createConditionNode(conditionSelector, index), this.#draggableNode);
		});

		if (this.#viewMode === ConditionViewMode.New)
		{
			this.#mountHeaderAction();
		}
	}

	#onRemoveConditionClick(event: BaseEvent)
	{
		const conditionSelector = event.getData().conditionSelector;
		// Only the new view wraps a row into a card of its own; in the legacy view the class belongs
		// to whatever the host painted around the group, and that must not be searched for.
		if (this.#viewMode === ConditionViewMode.New)
		{
			const cardNode = conditionSelector?.node?.closest('.bizproc-condition-group');
			if (cardNode)
			{
				Dom.remove(cardNode);
			}
		}
		if (conditionSelector)
		{
			const index = this.#itemSelectors.indexOf(conditionSelector);
			if (index > -1)
			{
				this.#itemSelectors.splice(index, 1);
			}
		}
		this.#seedFirstRow();
		this.#rerenderItems();

		if (
			this.#viewMode === ConditionViewMode.Legacy
			&& this.#itemSelectors.length <= 0
			&& !Dom.hasClass(this.#toggleButtonNode, '--disabled')
		)
		{
			Dom.addClass(this.#toggleButtonNode, '--disabled');
		}
		this.#emitChange();
	}

	getValue()
	{
		const initialValue = this.#conditionGroup.serialize();

		return new ConditionGroup({
			type: initialValue.type,
			activityNames: initialValue.activityNames,
			// A row the user added but never filled in is dropped by createFromForm, so it must
			// not reach the backend through this channel either. ConditionGroup.serialize() has
			// its own guard, but it reads `.field` off the [condition, joiner] tuple and never
			// fires; that behaviour is shared with the robots and is locked by its own test.
			items: this.#itemSelectors
				.map((selector) => [selector.getCondition().serialize(), selector.getJoiner()])
				.filter(([condition]) => condition.field !== '')
			,
		}).serialize();
	}

	#emitChange()
	{
		this.emit('onChange', new BaseEvent({ data: { value: this.getValue() } }));
	}

	destroy()
	{
		this.#destroyDragNDrop();
		this.#itemSelectors.forEach((selector) => selector.destroy());
		this.#itemSelectors = [];
	}
}
