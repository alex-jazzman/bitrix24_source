import {Dom, Type, Tag, Event, Loc} from 'main.core';
import { getStageTextColor } from 'crm.stage.color';
import {Kanban} from 'main.kanban';
import { Hint } from 'ui.hint';
import createStub from './internal/create-stub';
import Marker from '../marker/marker';
import isLinkInSameCategory from '../internal/is-link-in-same-category';
import isCycleLink from '../internal/is-cycle-link';
import {
	canOpenStageEditorFromEvent,
	clearLegacyStageTitleHint,
	finalizeStageTitleRender,
	getStageEditorInteractionNode,
	getStageTooltipBindElement,
	getStageTooltipInteractionNode,
	getStageDescription,
	loadStageDescriptionTooltipForColumn,
	openStageEditorForColumn,
	shouldShowStageTooltipForControl,
	shouldRestoreStageTooltipAfterControl,
} from '../manager/internal/stage-editor-adapter';

if (BX.Kanban.Pagination)
{
	BX.Kanban.Pagination.prototype.adjust = () => {};
}

export default class Column extends Kanban.Column
{
	constructor(options)
	{
		super(options);

		this.currentName = this.getName();
		this.stageDescriptionTooltip = null;
		this.stageDescriptionTooltipRequestId = 0;
		this.handleStageTitleMouseEnter = this.handleStageTitleMouseEnter.bind(this);
		this.handleStageTitleMouseLeave = this.handleStageTitleMouseLeave.bind(this);
		this.handleStageTitleFocusIn = this.handleStageTitleFocusIn.bind(this);
		this.handleStageTitleFocusOut = this.handleStageTitleFocusOut.bind(this);
		this.handleStageTitleMouseDown = this.handleStageTitleMouseDown.bind(this);
		this.handleStageTitleClick = this.handleStageTitleClick.bind(this);
		this.handleStageTitleKeyDown = this.handleStageTitleKeyDown.bind(this);
		this.handleAddColumnButtonMouseEnter = this.handleAddColumnButtonMouseEnter.bind(this);
		this.handleAddColumnButtonMouseLeave = this.handleAddColumnButtonMouseLeave.bind(this);

		this.marker = new Marker({
			dispatcher: this.getDot(),
			receiver: this.getHeader(),
			point: this.getDot(),
			container: this.getData().appContainer,
			intermediateXPoints: () => this.getIntermediateXPoints(),
			name: `${this.getData().categoryName} (${this.getName()})`,
			data: {
				column: this,
			},
		});

		this.marker
			.subscribe('Marker:dragStart', this.onMarkerDragStart.bind(this))
			.subscribe('Marker:receiver:dragOver', this.onMarkerDragOver.bind(this))
			.subscribe('Marker:receiver:dragOut', this.onMarkerDragOut.bind(this))
			.subscribe('Marker:dragEnd', this.onMarkerDragEnd.bind(this))
			.subscribe('Marker:linkFrom', this.onMarkerLinkFrom.bind(this))
			.subscribe('Marker:stubLinkFrom', this.onMarkerStubLinkFrom.bind(this))
			.subscribe('Marker:linkTo', this.onMarkerLinkTo.bind(this))
			.subscribe('Marker:stubLinkTo', this.onMarkerStubLinkTo.bind(this))
			.subscribe('Marker:removeLinkFrom', this.onRemoveLinkFrom.bind(this))
			.subscribe('Marker:changeRobotAction', this.onChangeRobotAction.bind(this))
			.subscribe('Marker:editLink', this.onEditLink.bind(this))
			.subscribe('Marker:unlink', this.onMarkerUnlink.bind(this))
			.subscribe('Marker:unlinkStub', this.onMarkerUnlinkStub.bind(this))
			.subscribe('Marker:error', this.onMarkerError.bind(this));


		this.onTransitionStart = this.onTransitionStart.bind(this);
		this.onTransitionEnd = this.onTransitionEnd.bind(this);
	}

	isAllowedTransitionProperty(propertyName)
	{
		return [
			'width',
			'min-width',
			'max-width',
			'transform',
		].includes(propertyName);
	}

	onTransitionStart(event)
	{
		if (
			event.srcElement === this.getContainer()
			&& this.isAllowedTransitionProperty(event.propertyName)
		)
		{
			clearInterval(this.intervalId);
			this.intervalId = setInterval(Marker.adjustLinks, 16);
		}
	}

	onTransitionEnd(event)
	{
		if (
			event.srcElement === this.getContainer()
			&& this.isAllowedTransitionProperty(event.propertyName)
		)
		{
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	setOptions(options: {name?: string; color?: string; data?: {[p: string]: any}; total?: number})
	{
		super.setOptions(options);

		if (Type.isFunction(options.data.onLink))
		{
			this.onLinkHandler = options.data.onLink;
		}

		if (Type.isFunction(options.data.onRemoveLinkFrom))
		{
			this.onRemoveLinkFromHandler = options.data.onRemoveLinkFrom;
		}

		if (Type.isFunction(options.data.onChangeRobotAction))
		{
			this.onChangeRobotAction = options.data.onChangeRobotAction;
		}

		if (Type.isFunction(options.data.onEditLink))
		{
			this.onEditLinkhandler = options.data.onEditLink;
		}

		if (Type.isFunction(options.data.onNameChange))
		{
			this.onNameChangeHandler = options.data.onNameChange;
		}

		if (Type.isFunction(options.data.onColorChange))
		{
			this.onColorChangeHandler = options.data.onColorChange;
		}

		if (Type.isFunction(options.data.onAddColumn))
		{
			this.onAddColumnHandler = options.data.onAddColumn;
		}

		if (Type.isFunction(options.data.onEdit))
		{
			this.onEditHandler = options.data.onEdit;
		}

		if (Type.isFunction(options.data.onRemove))
		{
			this.onRemoveHandler = options.data.onRemove;
		}

		if (Type.isFunction(options.data.onChange))
		{
			this.onChangeHandler = options.data.onChange;
		}

		if (Type.isFunction(options.data.onError))
		{
			this.onErrorHandler = options.data.onError;
		}

		if (this.marker)
		{
			this.marker.container = this.getData().appContainer;
			if (Type.isFunction(this.marker.cache.clear))
			{
				this.marker.cache.clear();
			}
		}
	}

	onMarkerError(event)
	{
		this.onErrorHandler(event.data);
	}

	onEditLink(event)
	{
		this.onEditLinkhandler(event.data);
	}

	onMarkerLinkFrom(event)
	{
		this.onLinkHandler(event.data);
		this.activateDot();
	}

	onMarkerStubLinkFrom()
	{
		this.activateStubDot();
	}

	onMarkerStubLinkTo()
	{
		this.activateStubDot();
	}

	onRemoveLinkFrom(event)
	{
		this.onRemoveLinkFromHandler(event.data);
	}

	onMarkerLinkTo()
	{
		this.activateDot();
	}

	getIntermediateXPoints()
	{
		const {
			progressStagesGroup,
			successStagesGroup,
			failStagesGroup,
		} = this.getData().stagesGroups;

		const progressRect = progressStagesGroup.getBoundingClientRect();
		const successRect = successStagesGroup.getBoundingClientRect();
		const failRect = failStagesGroup.getBoundingClientRect();

		const offset = 15;

		return [
			progressRect.left + offset,
			successRect.left - offset,
			successRect.left + offset,
			successRect.right - offset,
			successRect.right + offset,
			failRect.right - (offset / 2),
		];
	}

	onMarkerDragStart()
	{
		this.activateDot();
	}

	onMarkerDragOver(event: Event.BaseEvent)
	{
		if (isLinkInSameCategory(event) || isCycleLink(event))
		{
			event.preventDefault();
			this.disallowDot();
			return;
		}

		this.allowDot();
		this.highlightDot();
	}

	onMarkerDragOut()
	{
		this.allowDot();
		this.unhighlightDot();
	}

	onMarkerDragEnd(event: Event.BaseEvent)
	{
		if (!this.marker.isLinked())
		{
			this.deactivateDot();
		}

		if (event.data.from && event.data.to)
		{
			if (isLinkInSameCategory(event) || isCycleLink(event))
			{
				event.preventDefault();
			}
		}
	}

	onMarkerUnlink()
	{
		this.deactivateDot();
		this.deactivateStubDot();
	}

	onMarkerUnlinkStub()
	{
		this.deactivateStubDot();
	}

	activateDot()
	{
		Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-active');
	}

	deactivateDot()
	{
		Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-active');
	}

	activateStubDot()
	{
		Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-active-stub');
	}

	deactivateStubDot()
	{
		Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-active-stub');
	}

	highlightDot()
	{
		Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-highlight');
	}

	unhighlightDot()
	{
		Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-highlight');
	}

	allowDot()
	{
		Dom.removeClass(this.getDot(), 'crm-st-kanban-column-dot-disallow');
	}

	disallowDot()
	{
		Dom.addClass(this.getDot(), 'crm-st-kanban-column-dot-disallow');
	}

	getBody()
	{
		return createStub();
	}

	getDot()
	{
		if (!Type.isDomNode(this.dot))
		{
			const title = Loc.getMessage('CRM_ST_DOT_TITLE');
			this.dot = Tag.render`<div class="crm-st-kanban-column-dot" title="${title}">
				<span class="crm-st-kanban-column-dot-disallow-icon"> </span>
				<span class="crm-st-kanban-column-dot-pulse"> </span>
			</div>`;
		}

		return this.dot;
	}

	getHeader()
	{
		const header = super.getHeader();

		if (!this.headerDotted)
		{
			this.headerDotted = true;

			const dot = this.getDot();

			Event.bind(dot, 'mousedown', (event) => event.stopPropagation());
			Event.bind(dot, 'mouseup', (event) => event.stopPropagation());
			Event.bind(dot, 'mousemove', (event) => event.stopPropagation());

			Dom.append(dot, header);
		}

		return header;
	}

	renderTitle()
	{
		return finalizeStageTitleRender(this, super.renderTitle(), getStageTextColor(this.getColor()));
	}

	getAddColumnButton()
	{
		const button = super.getAddColumnButton();
		button.dataset.testid = `crm-sales-tunnels-stage-add-${this.getId()}`;

		Event.unbind(button, 'mouseenter', this.handleAddColumnButtonMouseEnter);
		Event.unbind(button, 'mouseleave', this.handleAddColumnButtonMouseLeave);
		Event.bind(button, 'mouseenter', this.handleAddColumnButtonMouseEnter);
		Event.bind(button, 'mouseleave', this.handleAddColumnButtonMouseLeave);

		return button;
	}

	bindStageInteractions()
	{
		const titleNode = this.layout?.info;
		const editorInteractionNode = getStageEditorInteractionNode(this);
		const tooltipInteractionNode = getStageTooltipInteractionNode(this);
		if (
			!Type.isElementNode(titleNode)
			|| !Type.isElementNode(editorInteractionNode)
			|| !Type.isElementNode(tooltipInteractionNode)
		)
		{
			return;
		}

		Event.unbind(titleNode, 'mouseenter', this.handleStageTitleMouseEnter);
		Event.unbind(titleNode, 'mouseleave', this.handleStageTitleMouseLeave);
		Event.unbind(titleNode, 'mousedown', this.handleStageTitleMouseDown);
		Event.unbind(titleNode, 'click', this.handleStageTitleClick);
		Event.unbind(titleNode, 'keydown', this.handleStageTitleKeyDown);
		Event.unbind(tooltipInteractionNode, 'mouseenter', this.handleStageTitleMouseEnter);
		Event.unbind(tooltipInteractionNode, 'mouseleave', this.handleStageTitleMouseLeave);
		Event.unbind(tooltipInteractionNode, 'focusin', this.handleStageTitleFocusIn);
		Event.unbind(tooltipInteractionNode, 'focusout', this.handleStageTitleFocusOut);
		Event.unbind(tooltipInteractionNode, 'mousedown', this.handleStageTitleMouseDown);
		Event.unbind(editorInteractionNode, 'click', this.handleStageTitleClick);
		Event.unbind(editorInteractionNode, 'keydown', this.handleStageTitleKeyDown);
		Event.bind(tooltipInteractionNode, 'mouseenter', this.handleStageTitleMouseEnter);
		Event.bind(tooltipInteractionNode, 'mouseleave', this.handleStageTitleMouseLeave);
		Event.bind(tooltipInteractionNode, 'focusin', this.handleStageTitleFocusIn);
		Event.bind(tooltipInteractionNode, 'focusout', this.handleStageTitleFocusOut);
		Event.bind(tooltipInteractionNode, 'mousedown', this.handleStageTitleMouseDown);
		Event.bind(editorInteractionNode, 'click', this.handleStageTitleClick);
		Event.bind(editorInteractionNode, 'keydown', this.handleStageTitleKeyDown);

		titleNode.removeAttribute('title');
		editorInteractionNode.removeAttribute('role');
		editorInteractionNode.removeAttribute('tabindex');
		editorInteractionNode.removeAttribute('aria-haspopup');
		this.clearDefaultStageTitleHint();
		editorInteractionNode.dataset.testid = `crm-sales-tunnels-stage-title-${this.getId()}`;
		if (this.getData().areStagesEditable)
		{
			editorInteractionNode.setAttribute('role', 'button');
			editorInteractionNode.setAttribute('tabindex', '0');
			editorInteractionNode.setAttribute('aria-haspopup', 'dialog');
		}
		else if (Type.isStringFilled(getStageDescription(this)) || this.isStageTitleCropped())
		{
			tooltipInteractionNode.setAttribute('tabindex', '0');
		}
	}

	handleStageTitleMouseEnter()
	{
		this.clearDefaultStageTitleHint();
		if (this.stageEditorOpened)
		{
			this.closeStageDescriptionTooltip();

			return;
		}

		this.showStageDescriptionTooltip();
	}

	addTitleHint(element)
	{
		this.clearDefaultStageTitleHint(element);
	}

	clearDefaultStageTitleHint(element = this.layout?.info)
	{
		clearLegacyStageTitleHint(element, Hint);
	}

	handleStageTitleMouseLeave()
	{
		this.stageDescriptionTooltipRequestId++;
		this.stageDescriptionTooltip?.hide();
	}

	handleStageTitleFocusIn()
	{
		this.handleStageTitleMouseEnter();
	}

	handleStageTitleFocusOut()
	{
		this.handleStageTitleMouseLeave();
	}

	handleStageTitleMouseDown()
	{
		this.closeStageDescriptionTooltip();
	}

	handleAddColumnButtonMouseEnter(event)
	{
		if (shouldShowStageTooltipForControl(this, event.target))
		{
			this.handleStageTitleMouseEnter();
		}
	}

	handleAddColumnButtonMouseLeave(event)
	{
		if (shouldRestoreStageTooltipAfterControl(this, event.relatedTarget))
		{
			this.handleStageTitleMouseEnter();
		}
	}

	handleStageTitleClick(event)
	{
		if (
			!this.getData().areStagesEditable
			|| !Type.isFunction(this.onEditHandler)
			|| !canOpenStageEditorFromEvent(this, event)
		)
		{
			return;
		}

		this.closeStageDescriptionTooltip();
		event.preventDefault();
		event.stopPropagation();
		this.onEditHandler(this);
	}

	handleStageTitleKeyDown(event)
	{
		if (!['Enter', ' '].includes(event.key))
		{
			return;
		}

		this.handleStageTitleClick(event);
	}

	showStageDescriptionTooltip()
	{
		const requestId = ++this.stageDescriptionTooltipRequestId;
		loadStageDescriptionTooltipForColumn(this).then((Tooltip) => {
			if (requestId !== this.stageDescriptionTooltipRequestId || !Tooltip)
			{
				return;
			}

			this.stageDescriptionTooltip ??= new Tooltip();
			this.stageDescriptionTooltip.show({
				bindElement: this.getStageDescriptionTooltipBindElement(),
				focusElement: getStageTooltipInteractionNode(this),
				name: this.getName(),
				description: getStageDescription(this),
				showName: this.isStageTitleCropped(),
			});
		});
	}

	getStageDescriptionTooltipBindElement()
	{
		return getStageTooltipBindElement(this);
	}

	isStageTitleCropped()
	{
		const titleText = this.layout?.nameInner;

		return Type.isElementNode(titleText) && titleText.offsetWidth < titleText.scrollWidth;
	}

	closeStageDescriptionTooltip()
	{
		this.stageDescriptionTooltipRequestId++;
		this.stageDescriptionTooltip?.hideImmediately();
	}

	getSubTitle()
	{
		return createStub();
	}

	getContainer()
	{
		const container = super.getContainer();
		Dom.addClass(container, 'crm-st-kanban-column');

		Event.bind(container, 'transitionstart', this.onTransitionStart);
		Event.bind(container, 'transitionend', this.onTransitionEnd);
		return container;
	}

	getTotalItem()
	{
		this.layout.total = createStub();
		return this.layout.total;
	}

	getAddColumnButton()
	{
		const button = super.getAddColumnButton();
		button.setAttribute('data-testid', 'crm-sales-tunnels-stage-add-btn');

		return button;
	}

	getEditButton()
	{
		const button = super.getEditButton();
		button.setAttribute('data-testid', 'crm-sales-tunnels-stage-edit-btn');

		return button;
	}

	handleTextBoxBlur(event)
	{
		super.handleTextBoxBlur(event);

		setTimeout(() => {
			if (this.currentName !== this.getName())
			{
				this.onNameChangeHandler(this);
				this.currentName = this.getName();

				Tag.attrs(this.getHeader())`
					title: ${this.getName()};
				`;
			}
		}, 500);
	}

	onColorSelected(color)
	{
		super.onColorSelected(color);
		this.onColorChangeHandler(this);
	}

	handleAddColumnButtonClick(event)
	{
		event?.preventDefault();
		this.closeStageDescriptionTooltip();
		this.onAddColumnHandler(this);
	}

	switchToEditMode()
	{
		if (openStageEditorForColumn(this))
		{
			return;
		}

		super.switchToEditMode();
	}

	handleRemoveButtonClick(event: any)
	{
		this.getConfirmDialog().setContent(Loc.getMessage('CRM_ST_CONFIRM_STAGE_REMOVE_TEXT'));
		super.handleRemoveButtonClick(event);
	}

	handleConfirmButtonClick() {
		// @todo refactoring

		const event = new Event.BaseEvent({
			data: {
				column: this,
				onConfirm: () => {
					Marker.getAllLinks()
						.forEach((link) => {
							if (String(link.to.data.column.id) === String(this.id))
							{
								link.from.removeLink(link);
							}

							if (String(link.from.data.column.id) === String(this.id))
							{
								link.from.removeLink(link);
							}
						});

					super.handleConfirmButtonClick();
					setTimeout(() => {
						Marker.removeAllLinks();
						Marker.restoreAllLinks();
					});
				},
				onCancel: () => {
					this.getConfirmDialog().close();
				}
			},
		});

		this.onRemoveHandler(event);
	}

	applyEditMode()
	{
		const title = BX.util.trim(this.getTitleTextBox().value);
		const colorChanged = this.colorChanged;
		let titleChanged = false;
		if (title.length > 0 && this.getName() !== title)
		{
			titleChanged = true;
		}

		super.applyEditMode();

		if (titleChanged || colorChanged)
		{
			this.onChangeHandler(this);
		}

		Marker.adjustLinks();
	}

	onColumnDrag(x, y)
	{
		super.onColumnDrag(x, y);
		Marker.adjustLinks();
	}

	onColumnDragStart()
	{
		this.stageDragging = true;
		super.onColumnDragStart();
	}

	onColumnDragStop(x, y)
	{
		super.onColumnDragStop(x, y);
		setTimeout(() => {
			this.stageDragging = false;
		});
	}

	resetRectArea()
	{
		super.resetRectArea();

		clearTimeout(this.resetRectAreaTimeoutId);
		this.resetRectAreaTimeoutId = setTimeout(() => {
			Marker.adjustLinks();
		}, 200);
	}
}
