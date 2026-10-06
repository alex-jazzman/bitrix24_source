import { Event } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { FocusNavigator, FocusZone } from 'ui.a11y';

import { type ItemNode } from '../item/item-node';
import { type Tab } from './tabs/tab';
import { type Dialog } from './dialog';

export class Navigation
{
	dialog: Dialog;
	lockedTab: Tab | null = null;
	enabled: boolean = false;
	#focusZone: FocusZone | null = null;

	// IE/Edge compatible event names
	static keyMap: Record<string, string> = {
		Down: 'ArrowDown',
		Up: 'ArrowUp',
		Left: 'ArrowLeft',
		Right: 'ArrowRight',
		Spacebar: 'Space',
		' ': 'Space', // For all browsers
	};

	constructor(dialog: Dialog)
	{
		this.dialog = dialog;

		this.dialog.subscribe('onShow', this.handleDialogShow.bind(this));
		this.dialog.subscribe('onHide', this.handleDialogHide.bind(this));
		this.dialog.subscribe('onDestroy', this.handleDialogDestroy.bind(this));
	}

	getDialog(): Dialog
	{
		return this.dialog;
	}

	enable(): void
	{
		if (!this.isEnabled())
		{
			this.bindEvents();

			this.#focusZone = new FocusZone(this.getDialog().getLabelsContainer());
			this.#focusZone.activate();
		}

		this.enabled = true;
	}

	disable(): void
	{
		if (this.isEnabled())
		{
			this.unbindEvents();
			this.unlockTab();

			this.#focusZone?.deactivate();
			this.#focusZone = null;
		}

		this.enabled = false;
	}

	isEnabled(): boolean
	{
		return this.enabled;
	}

	bindEvents(): void
	{
		const tagSelector = this.getDialog().getTagSelector();
		if (tagSelector === null)
		{
			Event.bind(document, 'keydown', this.#handleKeyDown);
		}
		else
		{
			tagSelector.subscribe('onKeyDown', this.#handleTagSelectorKeyDown);
		}

		Event.bind(this.getDialog().getLabelsContainer(), 'keydown', this.#handleLabelsKeyDown);
	}

	unbindEvents(): void
	{
		const tagSelector = this.getDialog().getTagSelector();
		if (tagSelector === null)
		{
			Event.unbind(document, 'keydown', this.#handleKeyDown);
		}
		else
		{
			tagSelector.unsubscribe('onKeyDown', this.#handleTagSelectorKeyDown);
		}

		Event.unbind(this.getDialog().getLabelsContainer(), 'keydown', this.#handleLabelsKeyDown);
	}

	#handleTagSelectorKeyDown = (event: BaseEvent): void => {
		this.#handleKeyDown(event.getData().event as KeyboardEvent);
	};

	#handleLabelsKeyDown = (event: KeyboardEvent): void => {
		const keyName = Navigation.keyMap[event.key] || event.key;
		if (keyName === 'ArrowLeft')
		{
			this.getDialog().expandLabels(false);
			event.stopPropagation();
		}
		else if (keyName === 'ArrowRight')
		{
			this.getDialog().collapseLabels(false);
			event.preventDefault();
		}
		else if (keyName === 'Tab' && !this.getDialog().hasTagSelector() && !this.getActiveNode())
		{
			const firstNode = this.getFirstNode();
			this.focusOnNode(firstNode);
			event.preventDefault();
		}

		event.stopPropagation();
	};

	getNextNode(): ItemNode | null
	{
		if (!this.getActiveNode())
		{
			return null;
		}

		let nextNode: ItemNode | null = null;
		let currentNode: ItemNode | null = this.getActiveNode()!;

		if (currentNode.hasChildren() && currentNode.isOpen())
		{
			nextNode = currentNode.getFirstChild();
		}

		while (nextNode === null && currentNode !== null)
		{
			nextNode = currentNode.getNextSibling();
			if (nextNode)
			{
				break;
			}

			currentNode = currentNode.getParentNode();
		}

		return nextNode;
	}

	getPreviousNode(): ItemNode | null
	{
		const activeNode = this.getActiveNode();
		if (activeNode === null)
		{
			return null;
		}

		let previousNode: ItemNode | null = activeNode.getPreviousSibling();
		if (previousNode !== null)
		{
			while (previousNode.hasChildren() && previousNode.isOpen())
			{
				const lastChild = previousNode.getLastChild();
				if (lastChild === null)
				{
					break;
				}

				previousNode = lastChild;
			}
		}
		else if (activeNode.getParentNode() && !activeNode.getParentNode()!.isRoot())
		{
			previousNode = activeNode.getParentNode();
		}

		return previousNode;
	}

	getFirstNode(): ItemNode | null
	{
		const tab = this.getDialog().getActiveTab();

		return tab && tab.getRootNode().getFirstChild();
	}

	getLastNode(): ItemNode | null
	{
		const tab = this.getDialog().getActiveTab();
		if (!tab)
		{
			return null;
		}

		let lastNode: ItemNode | null = tab.getRootNode().getLastChild();
		if (lastNode !== null)
		{
			while (lastNode.hasChildren() && lastNode.isOpen())
			{
				const lastChild = lastNode.getLastChild();
				if (lastChild === null)
				{
					break;
				}

				lastNode = lastChild;
			}
		}

		return lastNode;
	}

	getActiveNode(): ItemNode | null
	{
		return this.getDialog().getFocusedNode();
	}

	focusOnNode(node: ItemNode | null | undefined): void
	{
		if (node)
		{
			const focusVisible = !this.getDialog().hasTagSelector();
			node.focus(focusVisible);
			node.scrollIntoView();
		}
	}

	lockTab(): void
	{
		const activeTab = this.getDialog().getActiveTab();
		if (this.lockedTab === activeTab)
		{
			return;
		}

		if (this.lockedTab !== null)
		{
			this.unlockTab();
		}

		this.lockedTab = activeTab!;
		this.lockedTab.lock();

		Event.bind(document, 'mousemove', this.#handleMouseMove);
	}

	unlockTab(): void
	{
		if (this.lockedTab === null)
		{
			return;
		}

		this.lockedTab.unlock();
		this.lockedTab = null;

		Event.unbind(document, 'mousemove', this.#handleMouseMove);
	}

	handleDialogShow(): void
	{
		this.enable();
	}

	handleDialogHide(): void
	{
		this.disable();
	}

	handleDialogDestroy(): void
	{
		this.disable();
	}

	#handleMouseMove = (): void => {
		this.unlockTab();
	};

	#handleKeyDown = (event: KeyboardEvent): void => {
		if (!this.getDialog().isOpen())
		{
			this.unbindEvents();

			return;
		}

		if (event.metaKey || event.ctrlKey || event.altKey)
		{
			return;
		}

		const activeTab = this.getDialog().getActiveTab();
		if (!activeTab)
		{
			return;
		}

		const keyName = Navigation.keyMap[event.key] || event.key;

		if (activeTab === this.getDialog().getSearchTab() && ['ArrowLeft', 'ArrowRight'].includes(keyName))
		{
			return;
		}

		const handler: Function | null | undefined = (this as unknown as Record<string, Function | undefined>)[`handle${keyName}Press`];
		if (handler)
		{
			handler.call(this, event);

			if (keyName !== 'Tab')
			{
				this.lockTab();
			}
		}
	};

	isFocusInLabels(event: KeyboardEvent | MouseEvent): boolean
	{
		return this.getDialog().getLabelsContainer().contains(event.target as Node);
	}

	handleArrowDownPress(event: KeyboardEvent): void
	{
		if (this.getActiveNode())
		{
			const nextNode = this.getNextNode();
			if (nextNode)
			{
				this.focusOnNode(nextNode);
			}
			else
			{
				const firstNode = this.getFirstNode();
				this.focusOnNode(firstNode);
			}
		}
		else
		{
			const firstNode = this.getFirstNode();
			this.focusOnNode(firstNode);
		}

		event.preventDefault();
	}

	handleArrowUpPress(event: KeyboardEvent): void
	{
		if (this.getActiveNode())
		{
			const previousNode = this.getPreviousNode();
			if (previousNode)
			{
				this.focusOnNode(previousNode);
			}
			else
			{
				const lastNode = this.getLastNode();
				this.focusOnNode(lastNode);
			}
		}
		else
		{
			const lastNode = this.getLastNode();
			this.focusOnNode(lastNode);
		}

		event.preventDefault();
	}

	handleArrowRightPress(event: KeyboardEvent): void
	{
		const activeNode = this.getActiveNode();
		if (activeNode)
		{
			activeNode.expand();
		}

		event.preventDefault();
	}

	handleArrowLeftPress(event: KeyboardEvent): void
	{
		const activeNode = this.getActiveNode();
		if (!activeNode)
		{
			return;
		}

		if (activeNode.isOpen())
		{
			activeNode.collapse();
			event.preventDefault();
		}
		else
		{
			const parentNode = activeNode.getParentNode();
			if (parentNode && !parentNode.isRoot())
			{
				this.focusOnNode(parentNode);
				event.preventDefault();
			}
		}
	}

	handleEnterPress(event: KeyboardEvent): void
	{
		const activeNode = this.getActiveNode();
		if (activeNode)
		{
			activeNode.click();
		}

		event.preventDefault();
	}

	handleSpacePress(event: KeyboardEvent): void
	{
		const activeNode = this.getActiveNode();
		if (
			!this.getDialog().hasTagSelector()
			&& this.getDialog().getPopup().getPopupContainer().contains(FocusNavigator.getActiveElement())
		)
		{
			if (activeNode)
			{
				activeNode.click();
			}

			event.preventDefault();
		}
	}

	handleTabPress(event: KeyboardEvent): void
	{
		if (this.getDialog().isTagSelectorOutside())
		{
			if (event.shiftKey)
			{
				FocusNavigator.focusLast(this.getDialog().getContainer());
			}
			else
			{
				FocusNavigator.focusFirst(this.getDialog().getContainer());
			}

			event.preventDefault();
		}
	}
}
