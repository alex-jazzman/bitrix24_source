import { Layout } from 'ui.sidepanel.layout';
import { SidePanel, Slider } from 'main.sidepanel';

export class ComponentSlider
{
	#id: string;
	#title: ?string;
	#width: ?number;
	#cacheable: ?boolean;
	#events: Object = {};
	#componentContent: () => Promise;
	#buttons: Array<Button> = [];
	#extensions: Array<string> = [];

	constructor(options)
	{
		this.#id = options.id;
		this.#title = options.title ?? '';
		this.#width = options.width ?? 1100;
		this.#cacheable = options.cacheable !== false;
		this.#events = options.events ?? {};
		this.#componentContent = options.componentContent;
		this.#buttons = options.buttons ?? [];
		this.#extensions = options.extensions ?? [];
	}

	open()
	{
		SidePanel.Instance.open(
			this.#id,
			{
				width: this.#width,
				cacheable: this.#cacheable,
				contentCallback: () => {
					return Layout.createContent({
						title: this.#title ?? '',
						extensions: this.#extensions,
						design: { section: false, margin: true },
						content: () => {
							return this.#componentContent().then(this.#prepareComponentResponse);
						},
						buttons: () => {
							return this.#buttons;
						},
					}).then((container) => {
						return {
							html: container?.innerHTML ?? '',
						};
					});
				},
				events: this.#events,
			},
		);
	}

	#prepareComponentResponse(response): string
	{
		let content = response?.data?.html;

		(response?.data?.assets.css || []).forEach((link) => {
			content += `<link rel="stylesheet" href="${link}">`;
		});
		(response?.data?.assets.js || []).forEach((link) => {
			content += `<script src="${link}"><\/script>`;
		});
		(response?.data?.assets.string || []).forEach((script) => {
			content += script;
		});

		return content;
	}
}
