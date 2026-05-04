import { Tag, Dom, Browser } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { SidePanel } from 'main.sidepanel';

import { type RightBar } from './right-bar';
import { type RightPanel } from './right-panel';

export class RightSidebar
{
	#rightPanel: RightPanel;
	#rightBar: RightBar;
	#overlay: HTMLElement | null = null;

	constructor(panel: RightPanel, bar: RightPanel)
	{
		this.#rightPanel = panel;
		this.#rightBar = bar;

		panel.subscribe('onResize', () => {
			SidePanel.Instance.adjustLayout();
			this.adjustOverlay();
		});

		panel.subscribe('onExpand', () => {
			this.toggleContext();
		});

		panel.subscribe('onCollapse', () => {
			this.toggleContext();
		});

		panel.subscribe('onExpandComplete', () => {
			this.adjustOverlay();
		});

		panel.subscribe('onCollapseComplete', () => {
			this.adjustOverlay();
		});

		EventEmitter.subscribe('SidePanel.Slider:onOpening', () => {
			this.adjustOverlay();
			this.toggleContext();
		});

		const onClose = () => {
			if (SidePanel.Instance.getOpenSlidersCount() === 0)
			{
				this.adjustOverlay();
			}

			this.toggleContext();
		};

		EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', onClose);
		EventEmitter.subscribe('SidePanel.Slider:onDestroy', onClose);
	}

	getOverlay(): HTMLElement
	{
		if (this.#overlay === null)
		{
			this.#overlay = Tag.render`<div class="right-bar-overlay"></div>`;
			Dom.append(this.#overlay, document.body);
		}

		return this.#overlay;
	}

	setOverlayBackground(background: string): void
	{
		Dom.style(this.getOverlay(), 'background', background);
	}

	adjustOverlay(): void
	{
		const rightPanel = this.#rightPanel.getContainer() || this.#rightBar.getContainer();
		if (rightPanel === null)
		{
			return;
		}

		const windowWidth = Browser.isMobile() ? window.innerWidth : document.documentElement.clientWidth;

		const width = windowWidth - rightPanel.getBoundingClientRect().left;

		Dom.style(this.getOverlay(), 'width', `${width}px`);
	}

	toggleContext(): void
	{
		if (this.#rightBar.getContainer() === null)
		{
			return;
		}

		if (this.#rightPanel.isExpanded())
		{
			Dom.removeClass(this.#rightBar.getContainer(), '--ui-context-edge-dark');
			Dom.addClass(this.#rightBar.getContainer(), '--ui-context-edge-light');
		}
		else if (SidePanel.Instance.getOpenSlidersCount() > 0)
		{
			Dom.addClass(this.#rightBar.getContainer(), '--ui-context-edge-dark');
			Dom.removeClass(this.#rightBar.getContainer(), '--ui-context-edge-light');
		}
		else
		{
			Dom.removeClass(this.#rightBar.getContainer(), ['--ui-context-edge-light', '--ui-context-edge-dark']);
		}
	}
}
