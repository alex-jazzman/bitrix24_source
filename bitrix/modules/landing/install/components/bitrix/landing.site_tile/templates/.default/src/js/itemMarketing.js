import { Tag, Event } from 'main.core';
import { Button } from 'ui.buttons';

export default class ItemMarketing {
	constructor(options)
	{
		this.id = options.id;
		this.grid = options.grid;
		this.title = options.title;
		this.text = options.text;
		this.buttonText = options.buttonText;
		this.url = options.url;
		this.onClick = options.onClick;
		this.$container = null;
	}

	getButton()
	{
		const button = new Button({
			text: this.buttonText,
			useAirDesign: true,
			style: Button.AirStyle.FILLED,
		});
		const buttonNode = button.render();
		buttonNode.setAttribute('aria-label', this.buttonText);
		if (this.onClick)
		{
			Event.bind(buttonNode, 'click', this.onClick);
		}

		return buttonNode;
	}

	getContainer()
	{
		if (!this.$container)
		{
			this.$container = Tag.render`
				<div class="landing-sites__grid-item" role="listitem">
					<div class="landing-sites__item --marketing">
						<div class="landing-sites__item-container --flex">
							<div class="landing-sites__item-marketing--title">${this.title}</div>						
							<div class="landing-sites__item-marketing--icon"></div>
							<div class="landing-sites__item-marketing--text">${this.text}</div>
							<div class="landing-sites__item-marketing--buttons">
								${this.getButton()}
							</div>
						</div>
					</div>
				</div>
			`;
		}

		return this.$container;
	}
}
