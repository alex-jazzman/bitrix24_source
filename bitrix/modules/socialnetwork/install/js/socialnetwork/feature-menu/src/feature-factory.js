import type { Feature, FeatureParams } from './feature/feature';

import { Blog } from './feature/blog';
import { Calendar } from './feature/calendar';
import { Files } from './feature/files';
import { Flows } from './feature/flows';
import { Forum } from './feature/forum';
import { Lists } from './feature/lists';
import { Knowledge } from './feature/knowledge';
import { Marketplace } from './feature/marketplace';
import { Note } from './feature/note';
import { Placement } from './feature/placement';
import { Photo } from './feature/photo';
import { StartupToolSettings } from './feature/startup-tool-settings';
import { Tasks } from './feature/tasks';
import { Wiki } from './feature/wiki';

const featureClassMap = {
	tasks: Tasks,
	calendar: Calendar,
	files: Files,
	landing_knowledge: Knowledge,
	note: Note,
	flows: Flows,
	marketplace: Marketplace,
	blog: Blog,
	forum: Forum,
	group_lists: Lists,
	wiki: Wiki,
	photo: Photo,
	settings_startup_tool: StartupToolSettings,
};

export class FeatureFactory
{
	static createCollection(
		features: FeatureParams[] = [],
		projectId: ?number = null,
		onOpenStartupToolSettings?: () => void,
	): Feature[]
	{
		const collection: Feature[] = [];

		features.forEach((feature) => {
			const featureItem = this.create(feature, projectId, onOpenStartupToolSettings);
			if (featureItem)
			{
				collection.push(featureItem);
			}
		});

		return collection;
	}

	static create(
		feature: FeatureParams = {},
		projectId: ?number = null,
		onOpenStartupToolSettings?: () => void,
	): ?Feature
	{
		const params = projectId === null ? feature : { ...feature, projectId };

		if (feature.id?.startsWith('placement_'))
		{
			return new Placement(params);
		}

		const FeatureClass = featureClassMap[feature.id];
		if (!FeatureClass)
		{
			return null;
		}

		if (feature.id === 'settings_startup_tool' && typeof onOpenStartupToolSettings === 'function')
		{
			return new FeatureClass({ ...params, onOpenStartupToolSettings });
		}

		return new FeatureClass(params);
	}
}
