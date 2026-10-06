import { Slider } from './slider';

export function isSlider(slider: unknown): slider is Slider
{
	return slider instanceof Slider;
}
