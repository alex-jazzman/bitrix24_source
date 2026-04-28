import { OpenLinesModel } from 'imopenlines.v2.model';
import { OpenLinesHandlers } from 'imopenlines.v2.provider.pull';

export const OpenLinesLaunchResources = Object.freeze({
	models: [OpenLinesModel],
	pullHandlers: OpenLinesHandlers,
});
