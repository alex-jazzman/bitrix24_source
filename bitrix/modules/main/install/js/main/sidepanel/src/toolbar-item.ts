import { Type, Text, Tag, Dom, Loc, type JsonObject } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { EventEmitter } from 'main.core.events';
import { PopupManager, Popup, type PopupOptions } from 'main.popup';

import { type ToolbarItemOptions } from './types/toolbar-item-options';

export class ToolbarItem extends EventEmitter
{
	private id: string;
	private title: string;
	private url: string;
	private entityType: string;
	private entityId: string;
	private entityName: string;
	private refs: MemoryCache<HTMLElement> = new MemoryCache<HTMLElement>();
	private rendered: boolean;

	constructor(itemOptions: ToolbarItemOptions)
	{
		super();
		this.setEventNamespace('BX.Main.SidePanel.ToolbarItem');

		const options = Type.isPlainObject(itemOptions) ? itemOptions : {};

		this.id = Type.isStringFilled(options.id) ? options.id : `toolbar-item-${Text.getRandom().toLowerCase()}`;
		this.title = '';
		this.url = '';
		this.entityType = '';
		this.entityId = '0';
		this.entityName = '';

		this.rendered = false;

		this.setTitle(options.title);
		this.setUrl(options.url);
		this.setEntityType(options.entityType);
		this.setEntityId(options.entityId);
	}

	getId(): string
	{
		return this.id;
	}

	getUrl(): string
	{
		return this.url;
	}

	setUrl(url?: string): void
	{
		if (Type.isStringFilled(url))
		{
			this.url = url;
			if (this.rendered)
			{
				(this.getContainer() as HTMLAnchorElement).href = url;
			}
		}
	}

	getTitle(): string
	{
		return this.title;
	}

	setTitle(title?: string): void
	{
		if (Type.isStringFilled(title))
		{
			this.title = title;
			if (this.rendered)
			{
				this.getTitleContainer().textContent = title;
			}
		}
	}

	getEntityType(): string
	{
		return this.entityType;
	}

	setEntityType(entityType?: string): void
	{
		if (Type.isStringFilled(entityType))
		{
			this.entityType = entityType;
		}
	}

	getEntityId(): string | number
	{
		return this.entityId;
	}

	setEntityId(entityId?: string | number): void
	{
		if (Type.isNumber(entityId) || Type.isStringFilled(entityId))
		{
			this.entityId = String(entityId);
		}
	}

	getEntityName(): string
	{
		return this.entityName;
	}

	setEntityName(entityName?: string): void
	{
		if (Type.isStringFilled(entityName))
		{
			this.entityName = entityName;
		}
	}

	getContainer(): HTMLElement
	{
		return this.refs.remember('container', () => {
			return Tag.render`
				<div
					class="side-panel-toolbar-item"
					data-testid="main-sidepanel-toolbar-item-${this.getId()}"
					onmouseenter="${this.handleMouseEnter.bind(this)}"
					onmouseleave="${this.handleMouseLeave.bind(this)}"
				>
					${this.getTitleContainer()}
					<button
						type="button"
						tabindex="0"
						class="side-panel-toolbar-item-remove-btn"
						data-testid="main-sidepanel-toolbar-item-remove"
						onclick="${this.handleRemoveBtnClick.bind(this)}"
						title="${Loc.getMessage('MAIN_SIDEPANEL_TOOLBAR_REMOVE_ITEM')}"
						aria-label="${Loc.getMessage('MAIN_SIDEPANEL_TOOLBAR_REMOVE_ITEM')}"
						aria-describedby="${this.getTitleContainer().id}"
					>
						<span class="ui-icon-set --cross-20" style="--ui-icon-set__icon-size: 100%;"></span>
					</button>
				</div>
			`;
		});
	}

	isRendered(): boolean
	{
		return this.rendered;
	}

	getTitleContainer(): HTMLElement
	{
		return this.refs.remember('title', () => {
			return Tag.render`
				<a
					id="${Text.getRandom().toLowerCase()}"
					class="side-panel-toolbar-item-title"
					data-testid="main-sidepanel-toolbar-item-title"
					href="${encodeURI(this.getUrl())}"
					tabindex="0"
					data-slider-maximize="true"
				>${Text.encode(this.getTitle())}</a>
			`;
		});
	}

	prependTo(node: HTMLElement): void
	{
		if (Type.isDomNode(node))
		{
			Dom.prepend(this.getContainer(), node);
			this.rendered = true;
		}
	}

	appendTo(node: HTMLElement): void
	{
		if (Type.isDomNode(node))
		{
			Dom.append(this.getContainer(), node);
			this.rendered = true;
		}
	}

	insertBefore(node: HTMLElement): void
	{
		if (Type.isDomNode(node))
		{
			Dom.insertBefore(this.getContainer(), node);
			this.rendered = true;
		}
	}

	insertAfter(node: HTMLElement): void
	{
		if (Type.isDomNode(node))
		{
			Dom.insertAfter(this.getContainer(), node);
			this.rendered = true;
		}
	}

	remove(): void
	{
		Dom.remove(this.getContainer());
		this.rendered = false;
	}

	showTooltip(): void
	{
		const targetNode = this.getContainer();
		const rect = targetNode.getBoundingClientRect();
		const targetNodeWidth = rect.width;
		const popupWidth = Math.min(Math.max(100, this.getTitleContainer().scrollWidth + 20), 300);

		const hint = PopupManager.create({
			id: 'sidepanel-toolbar-item-hint',
			cacheable: false,
			bindElement: rect,
			bindOptions: {
				forceBindPosition: true,
				forceTop: true,
				position: 'top',
			},
			focusTrap: false,
			width: popupWidth,
			content: Tag.render`
				<div class="sidepanel-toolbar-item-hint">
					<div class="sidepanel-toolbar-item-hint-title">${Text.encode(this.getEntityName())}</div>
					<div class="sidepanel-toolbar-item-hint-content">${Text.encode(this.getTitle())}</div>
				</div>
			`,
			darkMode: true,
			fixed: true,
			offsetTop: 0,
			events: {
				onShow: (event) => {
					const popup = event.getTarget();
					const offsetLeft = targetNodeWidth / 2 - popupWidth / 2;
					const angleShift = (Popup.getOption('angleLeftOffset') as number) - (Popup.getOption('angleMinTop') as number);

					popup.setAngle({ offset: popupWidth / 2 - angleShift });
					popup.setOffset({ offsetLeft: offsetLeft + (Popup.getOption('angleLeftOffset') as number) });
				},
			},
		} as PopupOptions);

		hint.show();
		hint.adjustPosition();
	}

	hideTooltip()
	{
		const hint: Popup | null = PopupManager.getPopupById('sidepanel-toolbar-item-hint');
		if (hint)
		{
			hint.close();
		}
	}

	handleMouseEnter(): void
	{
		this.showTooltip();
	}

	handleMouseLeave(): void
	{
		this.hideTooltip();
	}

	handleRemoveBtnClick(event: globalThis.Event): void
	{
		event.stopPropagation();
		this.emit('onRemove');
	}

	toJSON(): JsonObject
	{
		return {
			title: this.getTitle(),
			url: this.getUrl(),
			entityType: this.getEntityType(),
			entityId: this.getEntityId(),
		};
	}
}
