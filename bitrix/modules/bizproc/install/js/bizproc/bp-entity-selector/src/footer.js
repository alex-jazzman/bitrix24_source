import { DefaultFooter, Dialog } from 'ui.entity-selector';
import { Tag, Event, Text } from 'main.core';

export default class Footer extends DefaultFooter
{
	constructor(dialog: Dialog, options: { [option: string]: any })
	{
		super(dialog, options);

		this.label = options.label ? options.label.toString() : '';
		this.url = options.url ? options.url.toString() : '';
		this.itemLink = options.itemLink ? options.itemLink.toString() : '';
	}

	getContent(): HTMLElement
	{
		const link = Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">
				${Text.encode(this.label)}
			</span>
		`;
		this.#bindEvent(link);

		return link;
	}

	#bindEvent(link)
	{
		Event.bind(link, 'click', (event: MouseEvent) => {
			event.preventDefault();

			BX.SidePanel.Instance.open(this.url, {
				width: 1000,
				requestMethod: 'post',
				events: {
					onCloseComplete: (event) => {
						const slider = event.getSlider();
						const dictionary = slider ? slider.getData() : null;
						let data = null;

						if (dictionary && dictionary.has('data'))
						{
							const rawData = dictionary.get('data');
							data = {
								id: rawData.storageId || rawData.id || null,
								title: rawData.storageTitle || rawData.title || '',
							};

							if (data)
							{
								this.#onItemCreated(data);
							}
						}
					},
				},
			});
		});
	}

	#onItemCreated(data: Object): void
	{
		const item = this.getDialog().addItem({
			id: data.id,
			entityId: this.getDialog().getEntities()[0].id,
			title: data.title,
			link: `${this.itemLink}${data.id}`,
		});
		item.select();
	}
}
