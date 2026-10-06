import { Dom, Tag, Event } from 'main.core';

import 'ui.design-tokens';

export class SlidePanel
{
	constructor()
	{
		this.layout = {
			container: null,
			pulse: null,
			close: null,
			preview: null,
		};

		this.init();
	}

	showPreview()
	{
		Dom.addClass(this.getPreviewContainer(), '--show');
	}

	hidePreview()
	{
		Dom.removeClass(this.getPreviewContainer(), '--show');
	}

	getClose(): HTMLElement
	{
		if (!this.layout.close)
		{
			this.layout.close = Tag.render`
				<div class="landing-slide-panel__navigation-item --close">
					<div class="ui-icon-set --cross-45"></div>
				</div>
			`;
			Event.bind(this.layout.close, 'click', () => this.hide());
		}

		return this.layout.close;
	}

	getPulse(): HTMLElement
	{
		if (!this.layout.pulse)
		{
			this.layout.pulse = Tag.render`
				<div class="landing-slide-panel__navigation-item --pulse">
					<div class="ui-icon-set --mobile-2"></div>
				</div>
			`;
			Event.bind(this.layout.pulse, 'click', () => this.show());
		}

		return this.layout.pulse;
	}

	getPreviewContainer(): HTMLElement
	{
		if (!this.layout.preview)
		{
			this.layout.preview = Tag.render`
				<div class="landing-slide-panel__container-item --preview"></div>
			`;
		}

		return this.layout.preview;
	}

	getContainer(): HTMLElement
	{
		if (!this.layout.container)
		{
			this.layout.container = Tag.render`
				<div class="landing-slide-panel">
					<div class="landing-slide-panel-inner">					
						<div class="landing-slide-panel__container">
							${this.getPreviewContainer()}
						</div>
						<div class="landing-slide-panel__navigation">
							${this.getClose()}
						</div>
					</div>
					${this.getPulse()}
				</div>
			`;
		}

		return this.layout.container;
	}

	show()
	{
		Dom.addClass(this.getContainer(), '--open');
		this.showPreview();
	}

	hide()
	{
		Dom.removeClass(this.getContainer(), '--open');
		this.hidePreview();
	}

	init(): void
	{
		Dom.append(this.getContainer(), document.body);
	}
}
