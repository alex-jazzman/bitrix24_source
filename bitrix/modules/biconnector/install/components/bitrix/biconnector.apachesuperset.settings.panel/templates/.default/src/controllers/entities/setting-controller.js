/* eslint-disable no-underscore-dangle */
import { Type, Dom } from 'main.core';
import { ApacheSupersetAnalytics } from 'biconnector.apache-superset-analytics';
import { EventEmitter, BaseEvent } from 'main.core.events';
import type { AnalyticInfo } from './analytic-info';

const SidePanel = BX.SidePanel;
export class SettingController extends BX.UI.EntityEditorController
{
	analytic: AnalyticInfo;
	constructor(id, settings)
	{
		super();

		this.initialize(id, settings);
		this.analytic = settings.config?.dashboardAnalyticInfo ?? {};

		EventEmitter.subscribeOnce('BX.UI.EntityEditor:onInit', (event: BaseEvent) => {
			const [editor] = event.getData();
			editor?._toolPanel.disableSaveButton();
			this.tryFocusSection(editor);
		});

		EventEmitter.subscribeOnce('BX.UI.EntityEditor:onControlChange', (event: BaseEvent) => {
			const [editor] = event.getData();
			editor?._toolPanel.enableSaveButton();
		});

		EventEmitter.subscribeOnce('BX.UI.EntityEditor:onCancel', (event: BaseEvent) => {
			const [, eventArguments] = event.getData();
			eventArguments.enableCloseConfirmation = false;
		});

		EventEmitter.subscribeOnce('BX.UI.EntityEditor:onSave', (event: BaseEvent) => {
			const [, eventArguments] = event.getData();
			eventArguments.enableCloseConfirmation = false;
		});
	}

	onAfterSave()
	{
		let analyticOptions;
		if (Type.isStringFilled(this.analytic.type))
		{
			analyticOptions = {
				type: this.analytic.type.toLowerCase(),
				p1: ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.analytic.appId),
				p2: this.analytic.id,
				c_element: 'grid_menu',
				status: 'success',
			};
		}
		else
		{
			analyticOptions = {
				c_element: 'grid_settings',
				status: 'success',
			};
		}

		ApacheSupersetAnalytics.sendAnalytics('edit', 'report_settings', analyticOptions);
		this?._editor?._modeSwitch.reset();

		this.#sendOnSaveEvent();
		this.innerCancel();
	}

	#sendOnSaveEvent(): void
	{
		const datasetTypingValue = this?._editor?._model?.getField?.('DATASET_TYPING_ENABLED');
		const previousSlider = BX.SidePanel.Instance.getPreviousSlider(BX.SidePanel.Instance.getSliderByWindow(window));
		const parent = previousSlider ? previousSlider.getWindow() : top;
		if (!parent.BX.Event)
		{
			return;
		}

		parent.BX.Event.EventEmitter.emit(
			'BX.BIConnector.Settings:onAfterSave',
			{
				datasetTypingEnabled: datasetTypingValue === 'Y',
			},
		);
	}

	innerCancel()
	{
		SidePanel.Instance.close();
	}

	tryFocusSection(editor): void
	{
		const slider = BX.SidePanel.Instance.getSliderByWindow(window);
		const sliderData = slider?.getData?.();
		const focusSection = (sliderData && Type.isFunction(sliderData.get))
			? sliderData.get('focusSection')
			: null
		;

		if (!Type.isStringFilled(focusSection))
		{
			return;
		}

		const editorContainer = editor?.getContainer();
		const sectionWrapper = editorContainer?.querySelector(`[data-cid="${focusSection}"]`);
		const highlightContainer = sectionWrapper?.querySelector('.ui-entity-editor-section-edit') ?? sectionWrapper;

		if (!Type.isDomNode(highlightContainer))
		{
			return;
		}

		highlightContainer.scrollIntoView({ block: 'start', behavior: 'smooth' });

		Dom.addClass(highlightContainer, '--founded-item');
		setTimeout(() => {
			Dom.removeClass(highlightContainer, '--founded-item');
			Dom.addClass(highlightContainer, '--after-founded-item');
			setTimeout(() => {
				Dom.removeClass(highlightContainer, '--after-founded-item');
			}, 5000);
		}, 1000);
	}
}
