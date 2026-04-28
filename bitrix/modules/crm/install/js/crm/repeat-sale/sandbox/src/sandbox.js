import { Loc, Type } from 'main.core';
import { BasicEditor } from 'ui.text-editor';
import { BitrixVue, VueCreateAppResult } from 'ui.vue3';
import { Sandbox as SandboxComponent } from './components/sandbox';
import 'ui.design-tokens';
import 'ui.design-tokens.air';
import './sandbox.css';

type RepeatSaleSandboxParams = {
	data: RepeatSaleSandboxData,
}

type RepeatSaleSandboxData = {
	segments: Array<RepeatSaleSegment>,
}

type RepeatSaleSegment = {
	id: number,
	title: string,
	prompt: string,
}

export class Sandbox
{
	#container: HTMLElement;
	#app: ?VueCreateAppResult = null;
	#textEditor: BasicEditor = null;

	constructor(containerId: string, params: RepeatSaleSandboxParams = {})
	{
		this.#container = document.getElementById(containerId);

		if (!Type.isDomNode(this.#container))
		{
			throw new Error('container not found');
		}

		this.#app = BitrixVue.createApp(SandboxComponent, {
			textEditor: this.#getTextEditor(params.data.prompt ?? '', {}),
			segments: params.data.segments,
			onItemSentToAi: params.events?.onItemSentToAi ?? null,
		});

		this.#app.mount(this.#container);
	}

	#getTextEditor(prompt: string): BasicEditor
	{
		if (this.#textEditor !== null)
		{
			return this.#textEditor;
		}

		const floatingToolbar = [
			'bold', 'italic', 'underline', 'strikethrough',
			'|',
			'numbered-list', 'bulleted-list',
		];

		this.#textEditor = new BasicEditor({
			editable: true,
			removePlugins: ['BlockToolbar'],
			minHeight: 250,
			maxHeight: 400,
			content: prompt,
			placeholder: Loc.getMessage('CRM_REPEAT_SALE_SANDBOX_PROMPT_PLACEHOLDER'),
			toolbar: [],
			floatingToolbar,
			collapsingMode: false,
		});

		return this.#textEditor;
	}
}
