import type { Feature, FeatureParams } from './feature/feature';

import { Blog } from './feature/blog';
import { Calendar } from './feature/calendar';
import { Files } from './feature/files';
import { Flows } from './feature/flows';
import { Forum } from './feature/forum';
import { Lists } from './feature/lists';
import { Knowledge } from './feature/knowledge';
import { Marketplace } from './feature/marketplace';
import { Placement } from './feature/placement';
import { Photo } from './feature/photo';
import { Tasks } from './feature/tasks';
import { Wiki } from './feature/wiki';

const featureClassMap = {
	tasks: Tasks,
	calendar: Calendar,
	files: Files,
	landing_knowledge: Knowledge,
	flows: Flows,
	marketplace: Marketplace,
	blog: Blog,
	forum: Forum,
	group_lists: Lists,
	wiki: Wiki,
	photo: Photo,
};

export class FeatureFactory
{
	static createCollection(features: FeatureParams[] = []): Feature[]
	{
		const collection: Feature[] = [];

		features.forEach((feature) => {
			const featureItem = this.create(feature);
			if (featureItem)
			{
				collection.push(featureItem);
			}
		});

		return collection;
	}

	static create(feature: FeatureParams = {}): ?Feature
	{
		if (feature.id?.startsWith('placement_'))
		{
			return new Placement(feature);
		}

		const FeatureClass = featureClassMap[feature.id];
		if (!FeatureClass)
		{
			return null;
		}

		return new FeatureClass(feature);
	}
}
