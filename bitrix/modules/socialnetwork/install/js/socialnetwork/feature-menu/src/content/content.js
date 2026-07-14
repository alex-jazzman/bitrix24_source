import { EventEmitter } from 'main.core.events';
import { Cache } from 'main.core';

import type { Feature } from '../feature/feature';

import './content.css';

export type ContentParams = {
	features?: Feature[],
	featureIds?: string[],
	minHeight?: string,
	margin?: string,
	appendMoreFeature?: boolean,
	appendAppsFeature?: boolean,
	[key: string]: any,
};

export type ContentConfig = {
	[key: string]: any,
};

export class Content extends EventEmitter
{
	cache = new Cache.MemoryCache();

	constructor(params: ContentParams = {})
	{
		super();

		this.setEventNamespace('BX.Socialnetwork.FeatureMenu.Content');

		this.cache.set('params', params);
	}

	getParams(): ContentParams
	{
		return this.cache.get('params', {});
	}

	getFeatures(): Feature[]
	{
		return this.getParams().features || [];
	}

	getFeatureIds(): string[]
	{
		return this.getParams().featureIds || [];
	}

	getMinHeight(): string
	{
		return this.getParams().minHeight || '0';
	}

	getMargin(): string
	{
		return this.getParams().margin || '0';
	}

	getFeatureById(id: string): ?Feature
	{
		return this.getFeatures().find((feature: Feature) => feature.getId() === id) || null;
	}

	getFeaturesByIds(ids: string[] = []): Feature[]
	{
		const featuresMap = new Map(
			this.getFeatures().map((feature: Feature) => [feature.getId(), feature]),
		);

		return ids.reduce((features: Feature[], id: string) => {
			const feature = featuresMap.get(id);
			if (feature)
			{
				features.push(feature);
			}

			return features;
		}, []);
	}

	getLayout(): HTMLElement
	{
		throw new Error('Must be implemented in a child class');
	}

	getFeaturesLayout(): HTMLElement[]
	{
		return this.getFeaturesByIds(this.getFeatureIds()).map((feature: Feature) => feature.getLayout());
	}

	getConfig(): ContentConfig
	{
		return {
			html: this.getLayout(),
			minHeight: this.getMinHeight(),
			margin: this.getMargin(),
		};
	}
}
