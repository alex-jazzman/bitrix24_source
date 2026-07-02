import { Tag, Type } from 'main.core';
import { BasicEditor } from 'ui.text-editor';

export class DescriptionField
{
	#defaultValue: string;
	#fieldNode: ?HTMLElement;
	#editor: ?BasicEditor;

	constructor(defaultValue: string = '')
	{
		this.#defaultValue = Type.isString(defaultValue) ? defaultValue : '';
		this.#fieldNode = null;
		this.#editor = null;
	}

	render(): HTMLElement
	{
		return Tag.render`
			<div
				class="dashboard-description-wrapper dashboard-description-editor"
				id="dashboard-description-field"
			>
			</div>
		`;
	}

	bind(rootNode: HTMLElement): void
	{
		if (!Type.isDomNode(rootNode))
		{
			return;
		}

		this.#fieldNode = rootNode.querySelector('#dashboard-description-field');
		if (!Type.isDomNode(this.#fieldNode))
		{
			return;
		}

		this.#editor = new BasicEditor({
			content: this.#defaultValue,
			minHeight: 120,
			maxHeight: 360,
			removePlugins: ['BlockToolbar'],
			toolbar: [
				'bold', 'italic', 'underline', 'strikethrough',
				'|',
				'numbered-list', 'bulleted-list',
				'|',
				'link', 'copilot',
			],
		});
		this.#editor.renderTo(this.#fieldNode);
	}

	getValue(): string
	{
		return this.#editor?.getText() ?? '';
	}
}
