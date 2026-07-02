import { type Slider } from 'crm.ai.slider';

import { type EntityEditorProxy } from './services/entity-editor-proxy';
import type SliderButtonsAdapter from './services/slider-buttons-adapter';

export let sliderButtonsAdapter: ?SliderButtonsAdapter = null;
export let copilotSliderInstance: ?Slider = null;
export let entityEditorProxy: ?EntityEditorProxy = null;

export function setSliderButtonsAdapter(value: ?SliderButtonsAdapter): void
{
	sliderButtonsAdapter = value;
}

export function setCopilotSliderInstance(value: ?Slider): void
{
	copilotSliderInstance = value;
}

export function setEntityEditorProxy(value: ?EntityEditorProxy): void
{
	entityEditorProxy = value;
}
