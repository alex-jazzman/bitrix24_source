import { ResponsePackageDataType } from './response-package-data-type';
import { Icon } from 'ui.icon-set.api.core';

export type WidgetDataType = {
	header: {
		icon: HTMLElement | Icon,
		top: {
			title: string,
			subtitle: string,
		},
		info: {
			title: string,
				subtitle: string,
				subtitleDescription: string,
				roundContent: {
					posterUrl: string,
						videos: Array<{
							url: string,
							type: string,
						}> | Icon,
				moreLabel: ?string,
				code: ?string,
			}
		}
	},
	items?: ResponsePackageDataType[],
}
