import { Tag } from 'main.core';
import { PULL } from 'pull.client';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';
import { ActivatorAppComponent } from './component/app';
import type { Block, FieldsSubmitReview, SetupTemplateData } from './types';

/**
 * The callback receives the collected `{ <constantCode>: <value> }` map and
 * re-validates server-side. It resolves:
 *  - a review payload (repeated needs_review) so the form re-renders the blocks
 *    and reports which constants are still missing/invalid;
 *  - `false` to keep the panel open unchanged (e.g. a handled error);
 *  - null/undefined when the flow is complete and the panel should close.
 */
type FieldsSubmitCallback = (constantValues: { [key: string]: any }) => Promise<?FieldsSubmitReview | boolean>;

type MountData = SetupTemplateData & {
	onSubmit?: ?FieldsSubmitCallback,
	singleStep?: boolean,
	submitCaption?: string,
	title?: string,
};

type SetupTemplateOptions = {
	container: HTMLElement,
	pushData: MountData,
};

/**
 * Render-only fields flow (Design A): show the passed blocks and hand the
 * collected values to `onSubmit` instead of running a workflow fill session.
 */
type SetupTemplateFieldsData = {
	templateId: number,
	blocks: Array<Block>,
	onSubmit: FieldsSubmitCallback,
	onClose?: () => void,
	submitCaption?: string,
	title?: string,
};

export { ActivatorAppComponent } from './component/app';
export { FormElement } from './component/item';
export type { FieldsSubmitReview, SetupTemplateData } from './types';
// ALG-01 and the picker plumbing of a date constant: the setup wizard renders the same value with
// the same serialization, so it reuses these instead of keeping its own copy.
export {
	createBoundPicker,
	createDateFromText,
	formatDate,
	isPickerOpenKey,
	parseValue,
	PICKER_ROW_SELECTOR,
	serializeValue,
	VALUE_FORMATS,
} from './lib/constant-date/constant-date';
export type { ConstantTimezone, ParsedConstantDateValue } from './lib/constant-date/constant-date';
// The wire format of a bool constant: the wizard shows the same stored value, so the synonyms the
// server normalizes to Y/N are recognized in one place for both surfaces.
export { BOOL_VALUES, isBoolValueChecked, normalizeBoolValue } from './lib/constant-bool/constant-bool';

export class SetupTemplate
{
	#pushData: MountData;
	#container: HTMLElement;
	#application: ?VueCreateAppResult;
	constructor(options: SetupTemplateOptions)
	{
		this.#container = options.container;
		this.#pushData = options.pushData;
	}

	mount(): void
	{
		this.#application = BitrixVue.createApp(ActivatorAppComponent, {
			templateId: this.#pushData.templateId,
			templateName: this.#pushData.templateName,
			templateDescription: this.#pushData.templateDescription,
			instanceId: this.#pushData.instanceId,
			blocks: this.#pushData.blocks,
			onSubmit: this.#pushData.onSubmit ?? null,
			singleStep: this.#pushData.singleStep === true,
			submitCaption: this.#pushData.submitCaption ?? '',
			title: this.#pushData.title ?? '',
		});
		this.#application.mount(this.#container);
	}

	unmount(): void
	{
		if (this.#application)
		{
			this.#application.unmount();
			this.#application = null;
		}
	}

	getContainer(): HTMLElement
	{
		return this.#container;
	}

	static createLayout(params: MountData): SetupTemplate
	{
		const container = Tag.render`<div class="ui-sidepanel-layout"></div>`;
		const app = new SetupTemplate({
			container,
			pushData: params,
		});
		app.mount();

		return app;
	}

	static showSidePanel(params: SetupTemplateData): void
	{
		let layout: ?SetupTemplate = null;

		BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
			width: 700,
			cacheable: false,
			// Give the dialog (role=dialog) a programmatic accessible name
			// (the agent name); the title option only affects ariaLabel, not a
			// visual header, so there is no duplicate with the Vue title.
			title: params.templateName ?? '',
			contentCallback: () => {
				layout = SetupTemplate.createLayout(params);

				return layout.getContainer();
			},
			events: {
				// Tear down the Vue app when the panel finishes closing so the
				// fields' beforeUnmount hooks (dialogs/pickers) run and detached
				// DOM/listeners are not leaked.
				onCloseComplete: () => {
					layout?.unmount();
					layout = null;
				},
			},
		});
	}

	/**
	 * Design A: render the passed setup blocks as a single-step form and hand
	 * the collected constant values to `onSubmit`. An optional `title` overrides
	 * the panel header (defaults to the common setup title) and names the dialog
	 * (accessible name) via the SidePanel `title` option.
	 */
	static showFieldsSidePanel(params: SetupTemplateFieldsData): void
	{
		let layout: ?SetupTemplate = null;

		BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
			width: 700,
			cacheable: false,
			// Give the dialog (role=dialog) a programmatic accessible name.
			title: params.title ?? '',
			contentCallback: () => {
				layout = SetupTemplate.createLayout({
					templateId: params.templateId,
					blocks: params.blocks,
					onSubmit: params.onSubmit,
					submitCaption: params.submitCaption ?? '',
					title: params.title ?? '',
					singleStep: true,
				});

				return layout.getContainer();
			},
			events: {
				// Tear down the Vue app when the panel finishes closing so the
				// fields' beforeUnmount hooks (dialogs/pickers) run and detached
				// DOM/listeners are not leaked. `onClose` lets the owner release
				// any per-panel guard regardless of how the panel was closed
				// (completion or cancellation).
				onCloseComplete: () => {
					layout?.unmount();
					layout = null;
					params.onClose?.();
				},
			},
		});
	}

	static subscribeOnPull(): void
	{
		PULL.subscribe({
			moduleId: 'bizproc',
			command: 'setupTemplateActivityBlocks',
			callback: (pushData: SetupTemplateData): void => {
				SetupTemplate.showSidePanel(pushData);
			},
		});
	}
}
