import './css/check-in-map.css';
import { Factory } from 'location.source';
import { CheckinMapCommandType } from 'location.core';
import { MarkerType } from './marker-type';
import { MarkerIconFactory } from './marker-icon-factory';
import { ClusterIconFactory } from './cluster-icon-factory';

class CheckInMap
{
	constructor()
	{
		this.mapService = null;
		this.subscribeToEvents();
	}

	init(props)
	{
		const preparedProps = this.getPreparedProps(props);
		this.mapService = Factory.create(
			BX.message('LOCATION_MOBILE_SOURCE_CODE'),
			BX.message('LOCATION_MOBILE_LANGUAGE_ID'),
			BX.message('LOCATION_MOBILE_SOURCE_LANGUAGE_ID'),
			BX.message('LOCATION_MOBILE_SOURCE_PARAMS'),
		).checkinMap;
		this.mapService.init(preparedProps);
	}

	getPreparedProps(props = {})
	{
		const preparedProps = {
			...props,
			containerId: '#check-in-map',
		};

		if (Array.isArray(preparedProps.markers))
		{
			preparedProps.markers = this.prepareMarkers(preparedProps.markers);
		}

		return preparedProps;
	}

	subscribeToEvents()
	{
		BXNativeBridge?.onReceiveEvent(this.onReceiveEvent);
	}

	onReceiveEvent = (event) => {
		const { eventType, data = {} } = event;
		if (!this.mapService && eventType !== CheckinMapCommandType.INIT_MAP)
		{
			console.error('Map service is not initialized. Call INIT_MAP first.');

			return;
		}

		switch (eventType)
		{
			case CheckinMapCommandType.INIT_MAP:
				this.init(data);
				break;
			case CheckinMapCommandType.ADD_MARKERS:
			{
				const preparedData = this.getPreparedProps({ markers: data.markers });
				this.mapService.addMarkers(preparedData.markers);
				break;
			}
			case CheckinMapCommandType.REMOVE_MARKERS:
				this.mapService.removeMarkers(data.ids);
				break;
			case CheckinMapCommandType.CLEAR_MARKERS:
				this.mapService.clearMarkers();
				break;
			case CheckinMapCommandType.ADD_LAYERS:
				this.mapService.addLayers(data.layers);
				break;
			case CheckinMapCommandType.REMOVE_LAYERS:
				this.mapService.removeLayers(data.ids);
				break;
			case CheckinMapCommandType.CLEAR_LAYERS:
				this.mapService.clearLayers();
				break;
			case CheckinMapCommandType.FIT_BOUNDS:
				this.mapService.fitBounds(data.bounds, data.options);
				break;
			case CheckinMapCommandType.SET_ZOOM:
				this.mapService.setZoom(data.zoom);
				break;
			case CheckinMapCommandType.ZOOM_IN:
				this.mapService.zoomIn();
				break;
			case CheckinMapCommandType.ZOOM_OUT:
				this.mapService.zoomOut();
				break;
			case CheckinMapCommandType.FIT_TO_LAYERS:
				this.mapService.fitToLayers(data.maxZoom);
				break;
			case CheckinMapCommandType.ENABLE_CLUSTERING:
			{
				const isRouteMode = data.options?.mode === 'route';
				this.mapService.enableClustering({
					...data.options,
					clusterIconFactory: isRouteMode
						? (markerConfigs, animated) => ClusterIconFactory.createRouteIcon(markerConfigs, animated)
						: (markerConfigs, animated) => ClusterIconFactory.createIcon(markerConfigs, animated),
				});
				break;
			}
			case CheckinMapCommandType.DISABLE_CLUSTERING:
				this.mapService.disableClustering();
				break;
			case CheckinMapCommandType.UPDATE_CLUSTER_ICON:
			{
				const markerConfigs = data.markerIds.map((id) => this.mapService.getMarkerConfig(id));
				let iconConfig = ClusterIconFactory.createIcon(markerConfigs, false);
				if (data.loading)
				{
					iconConfig = MarkerIconFactory.wrapWithLoader(iconConfig);
				}

				this.mapService.setClusterIcon(data.markerIds, iconConfig);
				break;
			}
			case CheckinMapCommandType.UPDATE_SETTINGS:
				this.mapService.updateSettings(data);
				break;
			default:
				console.warn('Unknown command type:', eventType);
		}
	};

	/**
	 * Process marker config: convert type-based config to full icon config
	 */
	processMarkerConfig(config)
	{
		const markerIcon = this.prepareIconConfig(config?.markerIcon);
		const preparedConfig = {
			...config,
			markerIcon,
		};

		if (!markerIcon)
		{
			return preparedConfig;
		}

		const { type, data } = markerIcon;

		if (type)
		{
			const iconConfig = MarkerIconFactory.createIconByType(type, data || {});
			if (iconConfig)
			{
				return {
					...preparedConfig,
					avatarUrl: preparedConfig.avatarUrl ?? data?.avatarUrl ?? null,
					name: preparedConfig.name ?? data?.name ?? null,
					id: preparedConfig.id ?? data?.id ?? null,
					markerIcon: iconConfig,
				};
			}

			console.error('Failed to create icon config for type:', type);
		}

		return preparedConfig;
	}

	/**
	 * Process multiple markers
	 */
	processMarkers(markers)
	{
		if (!Array.isArray(markers))
		{
			return markers;
		}

		return markers.map((marker) => ({
			id: marker.id,
			config: this.processMarkerConfig(marker.config),
		}));
	}

	prepareMarkers(markers)
	{
		if (!Array.isArray(markers))
		{
			return markers;
		}

		return markers.map((marker) => ({
			...marker,
			config: this.processMarkerConfig(marker.config),
		}));
	}

	prepareIconConfig(markerIcon)
	{
		if (!markerIcon)
		{
			return markerIcon;
		}

		// If icon has a type, we'll generate html via MarkerIconFactory
		// So we should remove the html property to avoid confusion
		if (markerIcon.type)
		{
			const { html, ...restIcon } = markerIcon;

			return restIcon;
		}

		// If no type specified, keep the icon as is (including html)
		return markerIcon;
	}
}

export {
	CheckInMap,
	MarkerType,
	MarkerIconFactory,
};
