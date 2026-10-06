import {Dom, Type, Tag, Event} from 'main.core';
import {Loc} from 'landing.loc';
import {Env} from 'landing.env';
import {Main} from 'landing.main';
import {A11y} from 'landing.ui.a11y';
import {BaseForm} from 'landing.ui.form.baseform';
import {MenuItemForm} from 'landing.ui.form.menuitemform';
import {Draggable} from 'ui.draganddrop.draggable';

import './css/style.css';

/**
 * @memberOf BX.Landing.UI.Form
 */
export class MenuForm extends BaseForm
{
	constructor(options = {})
	{
		super(options);
		Dom.addClass(this.layout, 'landing-ui-form-menu');

		this.forms = new BX.Landing.UI.Collection.FormCollection();

		if (Type.isArray(options.forms))
		{
			options.forms.forEach((form) => {
				this.addForm(form);
			});
		}

		this.draggable = new Draggable({
			container: this.getBody(),
			context: parent.window,
			draggable: '.landing-ui-form-menuitem',
			dragElement: '.landing-ui-form-header-drag-button',
			type: Draggable.DROP_PREVIEW,
			depth: {
				margin: 20,
			},
			offset: {
				y: -65,
			},
		});

		this.onDragHandleKeyDown = this.onDragHandleKeyDown.bind(this);
		Event.bind(this.getBody(), 'keydown', this.onDragHandleKeyDown);

		this.onMenuItemRemove = this.onMenuItemRemove.bind(this);

		Dom.append(this.getAddItemLayout(), this.layout);
	}

	addForm(form: BaseForm)
	{
		if (!this.forms.contains(form))
		{
			this.forms.add(form);
			Dom.append(form.layout, this.body);
			form.subscribe('remove', this.onMenuItemRemove.bind(this));

			if (this.draggable)
			{
				this.draggable.invalidateCache();
			}
		}
	}

	onMenuItemRemove(event)
	{
		const children = this.draggable.getChildren(event.data.form.layout);

		children.forEach((element) => {
			Dom.remove(element);
		});

		this.forms.remove(event.data.form);
		this.draggable.invalidateCache();
	}

	onDragHandleKeyDown(event: KeyboardEvent)
	{
		if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown'))
		{
			return;
		}

		const handle = event.target.closest('.landing-ui-form-header-drag-button');
		if (!handle)
		{
			return;
		}

		const itemLayout = handle.closest('.landing-ui-form-menuitem');
		const form = itemLayout ? this.forms.getByLayout(itemLayout) : null;
		if (!form)
		{
			return;
		}

		event.preventDefault();
		this.moveMenuItem(form, event.key === 'ArrowUp' ? 'up' : 'down');
	}

	moveMenuItem(form: MenuItemForm, direction: 'up' | 'down')
	{
		const elements = this.draggable.getDraggableElements();
		const sourceElement = form.layout;
		const sourceIndex = elements.indexOf(sourceElement);

		if (sourceIndex === -1)
		{
			return;
		}

		const depth = this.draggable.getElementDepth(sourceElement);
		const sourceBlock = this.getSiblingBlockRange(elements, sourceIndex, depth);

		const targetStart = (direction === 'up')
			? this.findPreviousSiblingStart(elements, sourceBlock.start, depth)
			: this.findNextSiblingStart(elements, sourceBlock.end, depth);

		if (targetStart === -1)
		{
			A11y.announce(Loc.getMessage(
				direction === 'up' ? 'LANDING_MENUITEM_MOVE_BLOCKED_TOP' : 'LANDING_MENUITEM_MOVE_BLOCKED_BOTTOM',
			).replace('#TITLE#', () => form.title));

			return;
		}

		const sourceElements = elements.slice(sourceBlock.start, sourceBlock.end + 1);

		if (direction === 'up')
		{
			const anchor = elements[targetStart];
			sourceElements.forEach((element) => {
				Dom.insertBefore(element, anchor);
			});
		}
		else
		{
			const targetBlock = this.getSiblingBlockRange(elements, targetStart, depth);
			let cursor = elements[targetBlock.end];
			sourceElements.forEach((element) => {
				Dom.insertAfter(element, cursor);
				cursor = element;
			});
		}

		this.draggable.invalidateCache();

		const handle = sourceElement.querySelector('.landing-ui-form-header-drag-button');
		if (handle)
		{
			handle.focus();
		}

		A11y.announce(Loc.getMessage(
			direction === 'up' ? 'LANDING_MENUITEM_MOVED_UP' : 'LANDING_MENUITEM_MOVED_DOWN',
		).replace('#TITLE#', () => form.title));
	}

	getSiblingBlockRange(elements: Array<HTMLElement>, index: number, depth: number): {start: number, end: number}
	{
		let end = index;
		while (end + 1 < elements.length && this.draggable.getElementDepth(elements[end + 1]) > depth)
		{
			end += 1;
		}

		return {start: index, end};
	}

	findPreviousSiblingStart(elements: Array<HTMLElement>, blockStart: number, depth: number): number
	{
		let i = blockStart - 1;
		while (i >= 0 && this.draggable.getElementDepth(elements[i]) > depth)
		{
			i -= 1;
		}

		return (i >= 0 && this.draggable.getElementDepth(elements[i]) === depth) ? i : -1;
	}

	findNextSiblingStart(elements: Array<HTMLElement>, blockEnd: number, depth: number): number
	{
		const next = blockEnd + 1;

		return (next < elements.length && this.draggable.getElementDepth(elements[next]) === depth) ? next : -1;
	}

	serialize()
	{
		const draggableElements = this.draggable.getDraggableElements();
		const getChildren = (parent) => {
			const parentDepth = this.draggable.getElementDepth(parent);
			const allChildren = this.draggable.getChildren(parent);

			return allChildren.reduce((acc, current) => {
				const currentDepth = this.draggable.getElementDepth(current);

				if (currentDepth === (parentDepth + 1))
				{
					const form = this.forms.getByLayout(current);
					acc.push({
						...form.serialize(),
						children: getChildren(current),
					});
				}

				return acc;
			}, []);
		};

		return draggableElements.reduce((acc, element) => {
			if (this.draggable.getElementDepth(element) === 0)
			{
				const form = this.forms.getByLayout(element);
				acc.push({
					...form.serialize(),
					children: getChildren(element),
				});
			}

			return acc;
		}, []);
	}

	onAddButtonClick(event: MouseEvent)
	{
		event.preventDefault();

		const pageType = Env.getInstance().getType();
		const content = {
			text: Loc.getMessage('LANDING_NEW_PAGE_LABEL'),
			target: '_blank',
			href: ['KNOWLEDGE', 'GROUP'].includes(pageType) ? '#landing0' : '',
		};

		const allowedTypes = [
			BX.Landing.UI.Field.LinkUrl.TYPE_BLOCK,
			BX.Landing.UI.Field.LinkUrl.TYPE_PAGE,
			BX.Landing.UI.Field.LinkUrl.TYPE_CRM_FORM,
			BX.Landing.UI.Field.LinkUrl.TYPE_CRM_PHONE,
		];

		if (pageType === 'STORE')
		{
			allowedTypes.push(
				BX.Landing.UI.Field.LinkUrl.TYPE_CATALOG,
			);
		}

		const field = new BX.Landing.UI.Field.Link({
			content,
			options: {
				siteId: Env.getInstance().getSiteId(),
				landingId: Main.getInstance().id,
				filter: {
					'=TYPE': pageType,
				},
			},
			allowedTypes,
		});

		const form = new MenuItemForm({
			fields: [field],
		});

		form.showForm();

		this.addForm(form);

		setTimeout(() => {
			field.input.enableEdit();

			const {input} = field.input;
			const [textNode] = input.childNodes;

			if (textNode)
			{
				const range = document.createRange();
				const sel = window.getSelection();

				range.setStart(textNode, input.innerText.length);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		});
	}

	getAddButton(): HTMLButtonElement
	{
		return this.cache.remember('addButton', () => {
			return Tag.render`
				<button 
					class="ui-btn ui-btn-sm ui-btn-light-border ui-btn-icon-add ui-btn-round landing-ui-form-menu-add-button"
					onclick="${this.onAddButtonClick.bind(this)}"
					>
					${Loc.getMessage('LANDING_ADD_MENU_ITEM')}
				</button>
			`;
		});
	}

	getAddItemLayout(): HTMLElement
	{
		return this.cache.remember('addItemLayout', () => {
			return Tag.render`
				<div class="landing-ui-form-menu-add">
					${this.getAddButton()}
				</div>
			`;
		});
	}
}