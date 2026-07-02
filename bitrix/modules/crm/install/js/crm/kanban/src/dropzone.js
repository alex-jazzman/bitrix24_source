import { Dom, Loc } from 'main.core';
import 'main.kanban';

/**
 * @param options
 * @extends {BX.Kanban.DropZone}
 */
export class DropZone extends BX.Kanban.DropZone
{
	droppedItems = [];

	constructor(options)
	{
		super(options);

		this.droppedItems = [];
	}

	/**
	 *
	 * @param {Element} itemNode
	 * @param {number} x
	 * @param {number} y
	 */
	onDragDrop(itemNode, x, y)
	{
		var draggableItem;
		var gridData = this.getGrid().getData();
		var data = this.getData();

		this.getGrid().dropZonesShow = true;

		if (
			(this.getGrid().getChecked().length > 1) &&
			(
				gridData.entityType === "LEAD" && data.type === "WIN" ||
				gridData.entityType === "INVOICE"
			)
		)
		{
			this.getGrid().getPopupCancel(Loc.getMessage("CRM_KANBAN_MASS_CONVERT_DISABLE_MSGVER_1")).show();

			if (this.getGrid().getChecked().length > 0)
			{
				for (var i = 0; i < this.getGrid().getChecked().length; i++)
				{
					Dom.removeClass(
						this.getGrid().getChecked()[i].layout.container,
						"main-kanban-item-disabled"
					);
				}

				this.getGrid().resetMultiSelectMode();
			}

			return;
		}

		var checkedElements = this.getGrid().getChecked();

		draggableItem = this.getGrid().getItemByElement(itemNode);
		this.captureItem(draggableItem);
		this.getDropZoneArea().unsetActive();

		if(checkedElements.length > 1 && this.droppedItem)
		{
			this.droppedItems = checkedElements;

			for (var i = 0; i < this.droppedItems.length; i++)
			{
				this.getGrid().hideItem(this.droppedItems[i]);
				if (draggableItem !== this.droppedItems[i])
				{
					this.droppedItems[i].getColumn().decPrice(
						this.droppedItems[i].data.price
					);
					this.droppedItems[i].getColumn().renderSubTitle();
				}
			}

			this.getGrid().resetMultiSelectMode();
		}
	}

	/**
	 *
	 * @param {BX.Kanban.Item} item
	 */
	captureItem(item)
	{
		const event = new DropZoneEvent();
		event.setItem(item);
		event.setDropZone(this);
		BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemCaptured", [event]);

		if (!event.isActionAllowed())
		{
			return;
		}

		this.empty();

		this.droppedItem = item;
		this.getDropZoneArea().show();
		this.setCaptured();
		this.unsetActive();
		this.animateRemove(item.layout.container);

		this.getGrid().hideItem(item);

		BX.onCustomEvent(this.getGrid(), 'Kanban.DropZone:onItemCaptured', [item, this, event.groupIds]);

		this.captureTimeout = setTimeout(
			() => {
				this.empty();
				this.getDropZoneArea().hide();
				this.droppedItems = [];
				this.getGrid().dropZonesShow = false;
			},
			this.getDropZoneArea().getDropZoneTimeout(),
		);
	}

	restore()
	{
		this.getGrid().dropZonesShow = false;

		if (this.captureTimeout)
		{
			clearTimeout(this.captureTimeout);
		}

		if (this.droppedItem === null)
		{
			return;
		}

		var event = new BX.Kanban.DropZoneEvent();

		if (!event.isActionAllowed())
		{
			return;
		}

		this.unsetActive();
		this.unsetCaptured();

		if(this.droppedItems.length > 0)
		{
			this.droppedItems = this.getGrid().getChecked();

			for (var i = 0; i < this.droppedItems.length; i++)
			{
				event.setItem(this.droppedItems[i]);
				event.setDropZone(this);
				BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemRestored", [event]);

				this.getGrid().unhideItem(this.droppedItems[i]);
				if (this.droppedItem !== this.droppedItems[i])
				{
					this.droppedItems[i].getColumn().incPrice(
						this.droppedItems[i].data.price
					);
					this.droppedItems[i].getColumn().renderSubTitle();
				}

				BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onItemRestored", [this.droppedItems[i], this]);
			}

			this.droppedItem = null;

			return;
		}

		event.setItem(this.droppedItem);
		event.setDropZone(this);
		BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onBeforeItemRestored", [event]);

		this.getGrid().unhideItem(this.droppedItem);

		BX.onCustomEvent(this.getGrid(), "Kanban.DropZone:onItemRestored", [this.droppedItem, this]);

		this.droppedItem = null;
	}

	/**
	 *
	 * @returns {Element}
	 */
	getContainer()
	{
		if (this.layout.container !== null)
		{
			return this.layout.container
		}

		var childrens = [];

		childrens.push(this.getNameContainer());
		if (this.getId() !== 'DELETED')
		{
			childrens.push(this.getCancelLink());
		}
		childrens.push(this.getBgContainer());

		this.layout.container = Dom.create("div", {
			attrs: {
				className: "main-kanban-dropzone",
				"data-id": this.getId()
			},
			children: childrens
		});

		this.makeDroppable();

		var dropZonesArray = [];

		for(var prop in this.dropZoneArea.dropZones)
		{
			dropZonesArray.push(this.dropZoneArea.dropZones[prop]);
		}

		if(dropZonesArray.length === 1)
		{
			this.layout.container.style.minWidth = "auto";
			this.layout.container.style.maxWidth = "none";
		}

		return this.layout.container;
	}

	makeDroppable()
	{
		var container = this.getContainer();

		container.onbxdestdraghover = this.onDragEnter.bind(this);
		container.onbxdestdraghout = this.onDragLeave.bind(this);
		container.onbxdestdragfinish = this.onDragDrop.bind(this);

		jsDD.registerDest(container, 4);
	}

	/**
	 * @param {Element} itemNode
	 * @param {number} x
	 * @param {number} y
	 */
	onDragEnter(itemNode, x, y)
	{
		var item = this.getGrid().getItemByElement(itemNode);

		if (item.isItemMoveDisabled())
		{
			return;
		}

		this.setActive();
		this.getDropZoneArea().setActive();
	}

	empty()
	{
		if (this.captureTimeout)
		{
			clearTimeout(this.captureTimeout);
		}

		if (this.droppedItem === null)
		{
			return;
		}

		this.unsetActive();
		this.unsetCaptured();

		BX.onCustomEvent(this.getGrid(), 'Kanban.DropZone:onItemEmptied', [this.droppedItem, this]);

		this.droppedItem = null;
	}
}

export class DropZoneEvent extends BX.Kanban.DropZoneEvent
{
	groupIds = [];

	constructor(options)
	{
		super(options);
		this.groupIds = [];
	}
}
