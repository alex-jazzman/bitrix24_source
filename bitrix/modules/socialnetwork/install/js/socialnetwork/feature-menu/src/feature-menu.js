import { ajax, Cache, Event, Loc, Type } from 'main.core';
import { type BaseEvent } from 'main.core.events';
import { Menu as PopupMenu, type MenuItem as PopupMenuItem, type MenuItemOptions } from 'main.popup';
import { PopupComponentsMaker } from 'ui.popupcomponentsmaker';
import { Menu as SystemMenu, type MenuItemOptions as SystemMenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Base } from './content/base';
import { List } from './content/list';
import { FeatureFactory } from './feature-factory';
import { Apps } from './feature/apps';
import { More } from './feature/more';
import { FeatureMenuLoader } from './loader/feature-menu-loader';

import { type ContentConfig, type ContentParams } from './content/content';
import { type Feature as FeatureItem, type FeatureParams } from './feature/feature';

import './feature-menu.css';

type Params = {
	projectId: number,
	bindElement: HTMLElement,
	onOpenStartupToolSettings?: () => void,
};

const featuresMenuOrder = [
	'blog',
	'landing_knowledge',
	'note',
	'flows',
	'photo',
	'group_lists',
	'forum',
	'wiki',
	'marketplace',
];

const secondaryFeaturesMenuOrder = ['marketplace'];
const secondarySectionCode = 'secondary';

const startupToolFeaturesOrder = ['settings_startup_tool'];
const startupToolSectionCode = 'startup_tool';

// All feature ids that are excluded from primary tiles and extra/"more" menu
const allSecondaryIds = new Set([...secondaryFeaturesMenuOrder, ...startupToolFeaturesOrder]);

export class FeatureMenu
{
	#cache = new Cache.MemoryCache();

	constructor(params: Params = {})
	{
		this.#cache.set('params', params);
		this.#validateRequiredParams();
	}

	init(): void
	{
		Event.unbindAll(this.#getParams().bindElement);
		Event.bind(this.#getParams().bindElement, 'click', () => {
			this.#getLoader().getPopup().setFixed(true);
			this.#getLoader().createSkeleton().show();
			this.#getData().then(() => {
				this.#getLoader().clearBeforeInsertContent();
				this.#show();
				Event.unbindAll(this.#getParams().bindElement);
				Event.bind(this.#getParams().bindElement, 'click', () => {
					this.#show();
				});
			}).catch(() => {});
		});
	}

	async showFeatures(): Promise<void>
	{
		const menu = this.#getFeaturesMenu();
		if (menu && menu.getPopup()?.isShown())
		{
			return;
		}

		await this.#getData();

		this.#showFeaturesMenu();
	}

	static async navigateToBaseFeature(projectChatId: number): Promise<void>
	{
		const response = await ajax.runAction(
			'socialnetwork.V2.Project.getBaseFeature',
			{
				json: {
					project: { chatId: projectChatId },
				},
			},
		);

		const baseFeature: ?FeatureParams = response.data;
		if (baseFeature)
		{
			const feature = FeatureFactory.create(baseFeature);
			feature?.handleClick();
		}
	}

	#show(): void
	{
		if (this.#getPopup().isShown())
		{
			return;
		}

		this.#getPopup().show();
	}

	#showFeaturesMenu(): void
	{
		const menu = this.#getFeaturesMenu();
		if (menu === null || menu.getPopup()?.isShown())
		{
			return;
		}

		menu.show(this.#getParams().bindElement);
	}

	#getParams(): Params
	{
		return this.#cache.get('params', {});
	}

	#validateRequiredParams(): void
	{
		if (!this.#getParams().projectId)
		{
			throw new Error('projectId is required parameter');
		}

		if (!this.#getParams().bindElement)
		{
			throw new Error('bindElement is required parameter');
		}
	}

	#getFeatures(): FeatureParams[]
	{
		return this.#cache.get('features', []);
	}

	#getFeatureItems(): FeatureItem[]
	{
		return this.#cache.remember(
			'featureItems',
			() => FeatureFactory.createCollection(
				this.#getFeatures(),
				this.#getParams().projectId,
				this.#getParams().onOpenStartupToolSettings,
			),
		);
	}

	#resetDerivedCache(): void
	{
		[
			'featureItems',
			'content',
			'popup',
			'featuresMenu',
			'extraFeaturesMenu',
			'placementFeaturesMenu',
			'moreFeature',
			'appsFeature',
		].forEach((cacheKey: string) => this.#cache.delete(cacheKey));
	}

	#getData(): Promise<FeatureParams[]>
	{
		if (this.#cache.get('dataLoaded', false))
		{
			return Promise.resolve(this.#getFeatures());
		}

		return this.#cache.remember('data', async () => {
			try
			{
				const response = await ajax.runAction(
					'socialnetwork.v2.Project.getFeatures',
					{
						json: {
							project: { id: this.#getParams().projectId },
						},
					},
				);
				this.#cache.set('features', response.data);
				this.#cache.set('dataLoaded', true);
				this.#resetDerivedCache();

				return response.data;
			}
			catch (response)
			{
				this.#cache.delete('data');
				throw response;
			}
		});
	}

	#getPopup(): PopupComponentsMaker
	{
		return this.#cache.remember('popup', () => {
			const popup = new PopupComponentsMaker({
				target: this.#getParams().bindElement,
				popupLoader: this.#getLoader().getPopup(),
				width: 340,
				content: this.#getContent(),
				padding: 0,
			});

			this.#cache.set('popup', popup);
			this.#cache.set('contentWrapper', popup.getContentWrapper());

			return popup;
		});
	}

	#getLoader(): FeatureMenuLoader
	{
		return this.#cache.remember('loader', () => {
			return new FeatureMenuLoader({
				bindElement: this.#getParams().bindElement,
				className: 'socnet-feature-menu-skeleton-popup',
				width: 340,
				useAngle: false,
				fixed: true,
			});
		});
	}

	#getContent(): Array<ContentConfig>
	{
		return this.#cache.remember('content', () => {
			return this.#getContentDescriptions().map((description) => {
				if (description.type === 'base')
				{
					return this.#getBase(description.params).getConfig();
				}

				return this.#getList(description.params).getConfig();
			});
		});
	}

	#getContentDescriptions(): Array<{ type: string, params: ContentParams }>
	{
		return this.#getBaseContentDescriptions().map((description: ContentParams) => {
			const featureIds = [...(description.params.featureIds || [])];

			if (description.params.appendMoreFeature && this.#hasExtraFeatures())
			{
				featureIds.push('more');
			}

			if (description.params.appendAppsFeature && this.#hasPlacementFeatures())
			{
				featureIds.push('apps');
			}

			if (featureIds.length === (description.params.featureIds || []).length)
			{
				return description;
			}

			return {
				...description,
				params: {
					...description.params,
					featureIds,
				},
			};
		});
	}

	#getBase(params: ContentParams = {}): Base
	{
		const cacheId = this.#getContentCacheId('baseContent', params);

		return this.#cache.remember(cacheId, () => {
			return new Base({
				features: this.#getFeatureItems(),
				...params,
			});
		});
	}

	#getList(params: ContentParams = {}): List
	{
		const cacheId = this.#getContentCacheId('listContent', params);

		return this.#cache.remember(cacheId, () => {
			return new List({
				features: this.#getListFeatures(params),
				...params,
			});
		});
	}

	#hasExtraFeatures(): boolean
	{
		return this.#getExtraFeatureItems().length > 0;
	}

	#hasPlacementFeatures(): boolean
	{
		return this.#getPlacementFeatures().length > 0;
	}

	#getExtraFeatureItems(): FeatureItem[]
	{
		const renderedFeatureIds = new Set(
			this.#getBaseContentDescriptions().flatMap(
				(description: { type: string, params: ContentParams }) => description.params.featureIds || [],
			),
		);

		return this.#getFeatureItems().filter((feature: FeatureItem) => {
			return (
				!feature.getId().startsWith('placement_')
				&& !renderedFeatureIds.has(feature.getId())
				&& !allSecondaryIds.has(feature.getId())
			);
		});
	}

	#getPlacementFeatures(): FeatureItem[]
	{
		return this.#getFeatureItems().filter((feature: FeatureItem) => feature.getId().startsWith('placement_'));
	}

	#getListFeatures(params: ContentParams = {}): FeatureItem[]
	{
		const featureItems = [...this.#getFeatureItems()];

		if (this.#shouldAppendMoreFeature(params))
		{
			featureItems.push(this.#getMoreFeature());
		}

		if (this.#shouldAppendAppsFeature(params))
		{
			featureItems.push(this.#getAppsFeature());
		}

		return featureItems;
	}

	#shouldAppendMoreFeature(params: ContentParams = {}): boolean
	{
		return params.appendMoreFeature === true && this.#hasExtraFeatures();
	}

	#shouldAppendAppsFeature(params: ContentParams = {}): boolean
	{
		return params.appendAppsFeature === true && this.#hasPlacementFeatures();
	}

	#getMoreFeature(): FeatureItem
	{
		return this.#cache.remember('moreFeature', () => {
			const moreFeature = new More();

			moreFeature.subscribe('click', this.#showMoreFeatureMenu.bind(this));

			return moreFeature;
		});
	}

	#getAppsFeature(): FeatureItem
	{
		return this.#cache.remember('appsFeature', () => {
			const appsFeature = new Apps();

			appsFeature.subscribe('click', this.#showPlacementFeatures.bind(this));

			return appsFeature;
		});
	}

	#showMoreFeatureMenu(baseEvent: BaseEvent): void
	{
		const moreFeature: FeatureItem = baseEvent.getTarget();

		const menu = this.#cache.remember('extraFeaturesMenu', () => {
			return new PopupMenu({
				bindElement: moreFeature.getActionElement(),
				offsetLeft: -25,
				offsetTop: -50,
				bindOptions: { forceBindPosition: false },
				angle: false,
				closeByEsc: true,
				items: this.#getExtraFeatureItems().map((feature: FeatureItem) => this.#createPopupMenuItem(feature)),
			});
		});

		menu.show();
	}

	#showPlacementFeatures(baseEvent: BaseEvent): void
	{
		const appsFeature: FeatureItem = baseEvent.getTarget();

		const menu = this.#cache.remember('placementFeaturesMenu', () => {
			return new PopupMenu({
				bindElement: appsFeature.getActionElement(),
				offsetLeft: -25,
				offsetTop: -50,
				bindOptions: { forceBindPosition: false },
				angle: false,
				closeByEsc: true,
				items: this.#getPlacementFeatures().map((feature: FeatureItem) => this.#createPopupMenuItem(feature)),
			});
		});

		menu.show();
	}

	#getFeaturesMenu(): ?SystemMenu
	{
		const items = this.#getFeaturesMenuItems();
		if (items.length === 0)
		{
			return null;
		}

		return this.#cache.remember('featuresMenu', () => {
			return new SystemMenu({
				minWidth: 220,
				offsetLeft: 28,
				sections: this.#getFeaturesMenuSections(),
				angle: false,
				closeByEsc: true,
				items,
			});
		});
	}

	#getFeaturesMenuItems(): SystemMenuItemOptions[]
	{
		const primaryItems = this.#getOrderedPrimaryFeatures().map(
			(feature: FeatureItem): SystemMenuItemOptions => this.#createSystemMenuItem(feature),
		);
		const secondaryItems = this.#getOrderedSecondaryFeatures().map(
			(feature: FeatureItem): SystemMenuItemOptions => this.#createSystemMenuItem(feature, secondarySectionCode),
		);

		if (this.#hasPlacementFeatures())
		{
			secondaryItems.push({
				id: 'applications',
				sectionCode: secondarySectionCode,
				title: Loc.getMessage('SOCNET_FEATURE_MENU_APPLICATIONS'),
				subMenu: {
					angle: false,
					items: this.#getPlacementFeatures().map(
						(feature: FeatureItem): SystemMenuItemOptions => this.#createSystemMenuItem(feature, undefined, false),
					),
				},
			});
		}

		const startupToolItems = this.#getOrderedStartupToolFeatures().map(
			(feature: FeatureItem): SystemMenuItemOptions => this.#createSystemMenuItem(feature, startupToolSectionCode),
		);

		return [
			...primaryItems,
			...secondaryItems,
			...startupToolItems,
		];
	}

	#getFeaturesMenuSections(): MenuSectionOptions[]
	{
		const sections: MenuSectionOptions[] = [];

		if (this.#getOrderedSecondaryFeatures().length > 0 || this.#hasPlacementFeatures())
		{
			sections.push({ code: secondarySectionCode });
		}

		if (this.#getOrderedStartupToolFeatures().length > 0)
		{
			sections.push({ code: startupToolSectionCode });
		}

		return sections;
	}

	#orderFeaturesBy(order: string[]): FeatureItem[]
	{
		const featuresMap = new Map(
			this.#getFeatureItems().map((feature: FeatureItem): [string, FeatureItem] => [feature.getId(), feature]),
		);

		return order.reduce((features: FeatureItem[], featureId: string) => {
			const feature = featuresMap.get(featureId);
			if (feature)
			{
				features.push(feature);
			}

			return features;
		}, []);
	}

	#getOrderedPrimaryFeatures(): FeatureItem[]
	{
		return this.#orderFeaturesBy(featuresMenuOrder).filter(
			(feature: FeatureItem) => !allSecondaryIds.has(feature.getId()),
		);
	}

	#getOrderedSecondaryFeatures(): FeatureItem[]
	{
		return this.#orderFeaturesBy(secondaryFeaturesMenuOrder);
	}

	#getOrderedStartupToolFeatures(): FeatureItem[]
	{
		return this.#orderFeaturesBy(startupToolFeaturesOrder);
	}

	#createPopupMenuItem(feature: FeatureItem): MenuItemOptions
	{
		return {
			id: feature.getId(),
			text: feature.getTitle(),
			onclick: (e: PointerEvent, menuItem: PopupMenuItem) => {
				menuItem.getMenuWindow().close();
				feature.handleClick();
			},
		};
	}

	#createSystemMenuItem(
		feature: FeatureItem,
		sectionCode?: string,
		withIcon: boolean = true,
	): SystemMenuItemOptions
	{
		return {
			id: feature.getId(),
			sectionCode,
			title: feature.getTitle(),
			...(withIcon ? { icon: feature.getIcon() } : {}),
			onClick: () => {
				feature.handleClick();
			},
		};
	}

	#getBaseContentDescriptions(): Array<{ type: string, params: ContentParams }>
	{
		return [
			{
				type: 'base',
				params: {
					featureIds: ['tasks', 'files', 'calendar'],
				},
			},
			{
				type: 'list',
				params: {
					featureIds: ['landing_knowledge', 'note', 'flows'],
					minHeight: '50px',
					margin: '8px 20px 0 20px',
					appendMoreFeature: true,
				},
			},
			{
				type: 'list',
				params: {
					featureIds: ['marketplace'],
					minHeight: '50px',
					margin: '0 20px 20px 20px',
					appendAppsFeature: true,
				},
			},
		];
	}

	#getContentCacheId(type: string, params: ContentParams = {}): string
	{
		return JSON.stringify({
			type,
			params: this.#normalizeCacheValue(params),
		});
	}

	#normalizeCacheValue(value: any): any
	{
		if (Type.isArray(value))
		{
			return value.map((item) => this.#normalizeCacheValue(item));
		}

		if (Type.isObjectLike(value))
		{
			return Object.fromEntries(
				Object.keys(value)
					.sort()
					.map((key: string) => [key, this.#normalizeCacheValue(value[key])]),
			);
		}

		return value;
	}
}
