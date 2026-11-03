import { PlaceholdersMount } from 'sign.v2.grid.b2e.placeholders';
import { Dom, Tag, Loc, Event, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import './style.css';

export class PlaceholdersWidget
{
	#mount = null;
	#widget = null;
	#isDragging = false;
	#dragOffsetX = 0;
	#dragOffsetY = 0;
	#isCollapsed = false;
	#handleMouseMove = null;
	#handleMouseUp = null;

	async show(): Promise<void>
	{
		this.#widget = this.#createWidget();
		Dom.append(this.#widget, document.body);

		this.#initDrag();
		this.#initControls();
		this.#initSliderDestroyHandler();

		this.#mount = new PlaceholdersMount({
			container: this.#widget.querySelector('.sign-placeholders-widget-body'),
			showHeader: false,
		});

		await this.#mount.load();
	}

	#createWidget(): HTMLElement
	{
		const title = Loc.getMessage('SIGN_EDITOR_PLACEHOLDERS_WIDGET_TITLE');
		const createHint = Loc.getMessage('SIGN_EDITOR_PLACEHOLDERS_WIDGET_BTN_CREATE_HINT');

		return Tag.render`
			<div class="sign-placeholders-widget" data-testid="sign-placeholders-widget">
				<div class="sign-placeholders-widget-header">
					<div class="sign-placeholders-widget-drag-handle">
						<div class="sign-placeholders-widget-drag-icon"
							 data-testid="sign-placeholders-widget-drag-icon"
						></div>
						<span class="sign-placeholders-widget-title">${Text.encode(title)}</span>
					</div>
					<div class="sign-placeholders-widget-controls">
						<div class="sign-placeholders-widget-btn-collapse"
							 data-testid="sign-placeholders-widget-btn-collapse"
						>
						</div>
					</div>
				</div>
				<div class="sign-placeholders-widget-body"></div>
				<div class="sign-placeholders-widget-btn-create"
					 data-testid="sign-placeholders-widget-btn-create"
					 title="${Text.encode(createHint)}"
				>
				</div>
			</div>
		`;
	}

	#initControls(): void
	{
		const collapseBtn = this.#widget.querySelector('.sign-placeholders-widget-btn-collapse');
		Event.bind(collapseBtn, 'click', this.#toggleCollapse.bind(this));

		const createBtn = this.#widget.querySelector('.sign-placeholders-widget-btn-create');
		Event.bind(createBtn, 'click', this.#handleCreate.bind(this));
	}

	#initSliderDestroyHandler(): void
	{
		const slider = BX.SidePanel.Instance?.getTopSlider();
		if (!slider)
		{
			return;
		}

		EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', (event) => {
			if (event.getTarget() === slider)
			{
				this.destroy();
			}
		});
	}

	#initDrag(): void
	{
		const handle = this.#widget.querySelector('.sign-placeholders-widget-header');

		Event.bind(handle, 'mousedown', (event: MouseEvent) => {
			if (event.target.closest('.sign-placeholders-widget-controls'))
			{
				return;
			}

			this.#isDragging = true;
			const rect = this.#widget.getBoundingClientRect();
			this.#dragOffsetX = event.clientX - rect.left;
			this.#dragOffsetY = event.clientY - rect.top;

			Dom.addClass(this.#widget, 'sign-placeholders-widget--dragging');
			Dom.style(document.body, 'user-select', 'none');
		});

		this.#handleMouseMove = (event: MouseEvent) => {
			if (!this.#isDragging)
			{
				return;
			}

			let x = event.clientX - this.#dragOffsetX;
			let y = event.clientY - this.#dragOffsetY;

			const maxX = window.innerWidth - this.#widget.offsetWidth;
			const maxY = window.innerHeight - this.#widget.offsetHeight;

			x = Math.max(0, Math.min(x, maxX));
			y = Math.max(0, Math.min(y, maxY));

			Dom.style(this.#widget, {
				left: `${x}px`,
				top: `${y}px`,
				right: 'auto',
				bottom: 'auto',
			});
		};

		this.#handleMouseUp = () => {
			if (this.#isDragging)
			{
				this.#isDragging = false;
				Dom.removeClass(this.#widget, 'sign-placeholders-widget--dragging');
				Dom.style(document.body, 'user-select', '');
			}
		};

		Event.bind(document, 'mousemove', this.#handleMouseMove);
		Event.bind(document, 'mouseup', this.#handleMouseUp);
	}

	#toggleCollapse(): void
	{
		this.#isCollapsed = !this.#isCollapsed;
		const body = this.#widget.querySelector('.sign-placeholders-widget-body');
		const btn = this.#widget.querySelector('.sign-placeholders-widget-btn-collapse');

		if (this.#isCollapsed)
		{
			Dom.style(body, 'display', 'none');
			Dom.addClass(btn, 'sign-placeholders-widget-btn-collapse--collapsed');
			Dom.addClass(this.#widget, 'sign-placeholders-widget--collapsed');
		}
		else
		{
			Dom.style(body, 'display', '');
			Dom.removeClass(btn, 'sign-placeholders-widget-btn-collapse--collapsed');
			Dom.removeClass(this.#widget, 'sign-placeholders-widget--collapsed');
		}
	}

	#handleCreate(): void
	{
		this.#mount?.getAppInstance()?.onCreateClick();
	}

	destroy(): void
	{
		Event.unbind(document, 'mousemove', this.#handleMouseMove);
		Event.unbind(document, 'mouseup', this.#handleMouseUp);
		this.#handleMouseMove = null;
		this.#handleMouseUp = null;

		this.#mount?.unmount();

		if (this.#widget)
		{
			Dom.remove(this.#widget);
			this.#widget = null;
		}
	}
}
