import { CheckInMapEventType } from 'location.core';
import { Leaflet as L } from '../leaflet/src/leaflet';

/**
 * Manages marker clustering for CheckInMapService.
 *
 * Owns all clustering state and algorithm logic. Receives a reference to the host
 * CheckInMapService (the `host` parameter) to access shared state such as the map
 * instance, marker collections, and utility methods.
 *
 * Host properties accessed:
 *   mapInstance, markers, layers, markerOriginalLatLngs, markerConfigs,
 *   fitBoundsMaxZoom, fitBoundsPadding,
 *   createDivIcon(), sendEvent(), normalizePadding()
 */
export class ClusteringManager
{
	/** @type {import('./check-in-map-service').default} */
	#host;

	#options = {};
	#enabled = false;

	// Maps markerId → clusterKey (sorted IDs string) | null (individual).
	// Only updated when a cluster is actually committed (marker appears on map).
	#prevMarkerClusterKey = new Map();

	// Maps clusterKey → { leafletMarker, center }.
	// Only contains clusters whose markers ARE currently on the map.
	#clusterMarkersByKey = new Map();

	#pendingAnimationTimeouts = [];

	#suppressNextClusterAnimation = false;

	#transitionInProgress = false;
	#transitionSafetyTimeout = null;

	#animationDuration = 300;

	constructor(host)
	{
		this.#host = host;
	}

	// ─── Public API ──────────────────────────────────────────────────────────

	get isEnabled()
	{
		return this.#enabled;
	}

	get options()
	{
		return this.#options;
	}

	get isTransitionInProgress()
	{
		return this.#transitionInProgress;
	}

	/**
	 * Enables clustering with the given options. Can be called repeatedly to
	 * update options while clustering is already active.
	 */
	enable(options = {})
	{
		const wasEnabled = this.#enabled;
		this.#options = options;
		this.#enabled = true;

		const { mapInstance, markers } = this.#host;

		if (mapInstance && !wasEnabled)
		{
			// Hide individual markers that may have been added before clustering was enabled.
			// They will be re-added as clusters by updateClusters() below.
			markers.forEach((marker) => {
				if (mapInstance.hasLayer(marker))
				{
					mapInstance.removeLayer(marker);
				}
			});

			mapInstance.on('zoomend', this.#onZoomEnd);
			this.updateClusters();
		}
	}

	/**
	 * Disables clustering and restores individual markers to the map.
	 */
	disable()
	{
		this.#enabled = false;
		this.#options = {};

		this.cancelPendingAnimations();
		this.#prevMarkerClusterKey.clear();

		const { mapInstance, markers, markerOriginalLatLngs } = this.#host;

		if (mapInstance)
		{
			mapInstance.off('zoomend', this.#onZoomEnd);
		}

		this.clearClusterMarkers();

		// Restore all individual markers on the map at their original positions
		markers.forEach((marker, id) => {
			const el = marker.getElement();
			if (el)
			{
				el.style.transition = '';
			}

			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLatLng(orig);
			}

			if (mapInstance && !mapInstance.hasLayer(marker))
			{
				marker.addTo(mapInstance);
			}
		});
	}

	/**
	 * Releases resources and removes event listeners without restoring markers
	 * to the map. Called by CheckInMapService.destroy() before clearMarkers().
	 */
	dispose()
	{
		this.cancelPendingAnimations();
		clearTimeout(this.#transitionSafetyTimeout);
		this.#transitionInProgress = false;
		this.#enabled = false;

		const { mapInstance } = this.#host;
		if (mapInstance)
		{
			mapInstance.off('zoomend', this.#onZoomEnd);
			mapInstance.off('moveend', this.#onTransitionEnd);
		}
		// Note: #clusterMarkersByKey is intentionally not cleared here.
		// clearClusterMarkers() (called via clearMarkers()) will remove them
		// from the map and then clear the tracking map.
	}

	/**
	 * Notifies the manager that the next zoomend animation should be skipped.
	 * Called by fitBounds() before triggering a programmatic zoom.
	 */
	suppressNextAnimation()
	{
		this.#suppressNextClusterAnimation = true;
	}

	/**
	 * Starts a fitBounds-driven transition: hides all markers until the zoom
	 * animation completes, then re-renders clusters without animation.
	 */
	beginTransition()
	{
		if (this.#transitionInProgress)
		{
			clearTimeout(this.#transitionSafetyTimeout);
			const { mapInstance } = this.#host;
			if (mapInstance)
			{
				mapInstance.off('moveend', this.#onTransitionEnd);
			}
		}

		this.cancelPendingAnimations();

		const { mapInstance, markers } = this.#host;

		this.#clusterMarkersByKey.forEach(({ leafletMarker }) => {
			if (mapInstance.hasLayer(leafletMarker))
			{
				mapInstance.removeLayer(leafletMarker);
			}
		});
		this.#clusterMarkersByKey.clear();

		markers.forEach((marker) => {
			if (mapInstance.hasLayer(marker))
			{
				const el = marker.getElement();
				if (el)
				{
					el.style.transition = '';
				}

				mapInstance.removeLayer(marker);
			}
		});

		this.#transitionInProgress = true;
		mapInstance.on('moveend', this.#onTransitionEnd);

		this.#transitionSafetyTimeout = setTimeout(() => {
			this.#endTransition();
		}, 600);
	}

	/**
	 * Resets the suppress-animation flag and ends any in-progress transition.
	 * Called by fitBounds() when the new bounds are invalid.
	 */
	cancelTransition()
	{
		this.#suppressNextClusterAnimation = false;
		if (this.#transitionInProgress)
		{
			this.#endTransition();
		}
	}

	/**
	 * Recalculates clusters and updates the map accordingly.
	 *
	 * @param {boolean} [forceNoAnimation=false]
	 */
	updateClusters(forceNoAnimation = false)
	{
		const { mapInstance } = this.#host;

		if (!mapInstance || this.#transitionInProgress)
		{
			return;
		}

		this.cancelPendingAnimations();
		this.#snapAllMarkersToPosition();

		const clusters = this.#calculateClusters();
		const animated = this.#options.animated !== false && !forceNoAnimation;
		const dissolvedCenters = this.#removeDissolvedClusters(clusters);

		clusters.forEach((cluster) => {
			if (cluster.markers.length === 1)
			{
				this.#applyIndividualMarker(cluster, dissolvedCenters, animated);
			}
			else
			{
				this.#applyCluster(cluster, dissolvedCenters, animated);
			}
		});

		if (this.#options.routeMarkerIds?.length)
		{
			this.#updateRoutePolyline(clusters);
		}
	}

	setClusterIcon(markerIds, iconConfig)
	{
		const key = [...markerIds].sort().join(',');
		const entry = this.#clusterMarkersByKey.get(key);

		if (!entry)
		{
			return;
		}

		const { html, className, iconSize, iconAnchor } = iconConfig;
		const icon = this.#host.createDivIcon(html, className, iconSize, iconAnchor);

		entry.leafletMarker.setIcon(icon);
		const testId = this.#getClusterTestId(markerIds);
		entry.leafletMarker.getElement()?.setAttribute('testId', testId);
	}

	cancelPendingAnimations()
	{
		this.#pendingAnimationTimeouts.forEach((id) => clearTimeout(id));
		this.#pendingAnimationTimeouts = [];
	}

	clearClusterMarkers()
	{
		const { mapInstance } = this.#host;
		this.#clusterMarkersByKey.forEach(({ leafletMarker }) => {
			if (mapInstance)
			{
				mapInstance.removeLayer(leafletMarker);
			}
		});
		this.#clusterMarkersByKey.clear();
		this.#prevMarkerClusterKey.clear();
	}

	clearPrevMarkerKeys()
	{
		this.#prevMarkerClusterKey.clear();
	}

	deletePrevMarkerKey(id)
	{
		this.#prevMarkerClusterKey.delete(id);
	}

	// ─── Private: transition & zoom ──────────────────────────────────────────

	#onZoomEnd = () => {
		const suppress = this.#suppressNextClusterAnimation;
		this.#suppressNextClusterAnimation = false;

		if (this.#transitionInProgress)
		{
			clearTimeout(this.#transitionSafetyTimeout);
			this.#transitionInProgress = false;
			const { mapInstance } = this.#host;
			if (mapInstance)
			{
				mapInstance.off('moveend', this.#onTransitionEnd);
			}
		}

		this.updateClusters(suppress);
	};

	#onTransitionEnd = () => {
		this.#endTransition();
	};

	#endTransition()
	{
		if (!this.#transitionInProgress)
		{
			return;
		}

		clearTimeout(this.#transitionSafetyTimeout);
		this.#transitionInProgress = false;

		const { mapInstance } = this.#host;
		if (mapInstance)
		{
			mapInstance.off('moveend', this.#onTransitionEnd);
		}

		this.updateClusters(true);
	}

	// ─── Private: cluster rendering ──────────────────────────────────────────

	// Computes a simplified polyline through cluster centers in route order and
	// updates the stored Leaflet polyline layers.
	#updateRoutePolyline(clusters)
	{
		const { routeMarkerIds, routeLayerIds } = this.#options;
		const { layers } = this.#host;

		const clusterByMarkerId = new Map();
		clusters.forEach((cluster) => {
			cluster.ids.forEach((id) => clusterByMarkerId.set(id, cluster));
		});

		const path = [];
		let lastClusterKey;

		routeMarkerIds.forEach((markerId) => {
			const cluster = clusterByMarkerId.get(markerId);
			if (!cluster)
			{
				return;
			}

			if (cluster.key === lastClusterKey)
			{
				return; // consecutive markers in same cluster → skip
			}

			lastClusterKey = cluster.key;
			path.push(cluster.center);
		});

		routeLayerIds.forEach((layerId) => {
			const layer = layers.get(layerId);
			if (layer instanceof L.Polyline)
			{
				layer.setLatLngs(path);
			}
		});
	}

	// Snap any markers or cluster markers that are mid-animation back to their
	// stable positions before recalculating the cluster layout.
	#snapAllMarkersToPosition()
	{
		const { mapInstance, markers, markerOriginalLatLngs } = this.#host;

		markers.forEach((marker, id) => {
			if (!mapInstance.hasLayer(marker))
			{
				return;
			}

			const el = marker.getElement();
			const hasTransition = el && el.style.transition !== '';
			const orig = markerOriginalLatLngs.get(id);
			const needsSnap = orig && !marker.getLatLng().equals(orig);

			if (!hasTransition && !needsSnap)
			{
				return;
			}

			if (hasTransition)
			{
				this.#clearElementTransition(el);
			}

			if (needsSnap)
			{
				marker.setLatLng(orig);
			}
		});

		this.#clusterMarkersByKey.forEach(({ leafletMarker, center }) => {
			const el = leafletMarker.getElement();
			const hasTransition = el && el.style.transition !== '';
			const needsSnap = !leafletMarker.getLatLng().equals(center);

			if (!hasTransition && !needsSnap)
			{
				return;
			}

			if (hasTransition)
			{
				this.#clearElementTransition(el);
			}

			if (needsSnap)
			{
				leafletMarker.setLatLng(center);
			}
		});
	}

	// Removes cluster markers that no longer exist in the new layout from the map.
	// Returns a map of dissolved cluster keys → their last known centers,
	// used to animate members flying out from where their cluster was.
	#removeDissolvedClusters(clusters)
	{
		const { mapInstance } = this.#host;
		const newClustersByKey = new Map();
		clusters.forEach((cluster) => {
			if (cluster.markers.length > 1)
			{
				newClustersByKey.set(cluster.key, cluster);
			}
		});

		const dissolvedCenters = new Map();
		this.#clusterMarkersByKey.forEach(({ leafletMarker, center }, key) => {
			if (!newClustersByKey.has(key))
			{
				mapInstance.removeLayer(leafletMarker);
				dissolvedCenters.set(key, center);
				this.#clusterMarkersByKey.delete(key);
			}
		});

		return dissolvedCenters;
	}

	// Places a single marker on the map, animating it from its former cluster center if applicable.
	#applyIndividualMarker(cluster, dissolvedCenters, animated)
	{
		const [id] = cluster.ids;
		const [marker] = cluster.markers;
		const prevKey = this.#prevMarkerClusterKey.get(id);
		const { mapInstance, markerOriginalLatLngs } = this.#host;

		if (animated && prevKey && dissolvedCenters.has(prevKey))
		{
			// Was in a dissolved cluster → fly from cluster center to actual position
			this.#animateMarkerFromCluster(marker, id, dissolvedCenters.get(prevKey));
		}
		else if (!mapInstance.hasLayer(marker))
		{
			// Snap to original position before adding — the marker's LatLng may have been
			// moved to a cluster center during a previous animation and never reset.
			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLatLng(orig);
			}

			marker.addTo(mapInstance);
		}

		this.#prevMarkerClusterKey.set(id, null);
	}

	// Animates a marker flying from a dissolved cluster center to its original position.
	#animateMarkerFromCluster(marker, id, fromLatLng)
	{
		const { mapInstance, markerOriginalLatLngs } = this.#host;

		marker.setLatLng(fromLatLng);
		marker.addTo(mapInstance);

		this.#scheduleAnimation(() => {
			const el = marker.getElement();
			if (el)
			{
				el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
			}

			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLatLng(orig);
			}

			this.#scheduleTransitionCleanup(marker);
		});
	}

	// Applies a cluster to the map: skips if stable, animates members in if they were individual,
	// or slides the cluster marker in from a dissolved parent.
	#applyCluster(cluster, dissolvedCenters, animated)
	{
		const { key } = cluster;

		if (this.#clusterMarkersByKey.has(key))
		{
			// Stable cluster: marker is already on the map — just keep tracking up to date
			cluster.ids.forEach((id) => this.#prevMarkerClusterKey.set(id, key));

			return;
		}

		const anyWasIndividual = this.#animateMarkersIntoCluster(cluster, animated);

		if (anyWasIndividual)
		{
			// Wait for members to finish flying in before replacing them with the cluster marker.
			// Extra buffer accounts for the rAF delay before the CSS transition starts.
			const t = setTimeout(
				() => this.#showCluster(cluster, key, animated),
				this.#animationDuration + 50,
			);
			this.#pendingAnimationTimeouts.push(t);
		}
		else
		{
			this.#showOrSlideInCluster(cluster, key, dissolvedCenters, animated);
		}
	}

	// Starts CSS animations for individual markers flying towards the cluster center.
	// Returns true if at least one visible individual marker was animated.
	#animateMarkersIntoCluster(cluster, animated)
	{
		let anyWasIndividual = false;
		const { mapInstance } = this.#host;

		cluster.markers.forEach((marker, i) => {
			const id = cluster.ids[i];
			const prevKey = this.#prevMarkerClusterKey.get(id);

			if (animated && !prevKey && mapInstance.hasLayer(marker))
			{
				// Was individual and visible → animate towards cluster center
				anyWasIndividual = true;

				this.#scheduleAnimation(() => {
					const el = marker.getElement();
					if (el)
					{
						el.style.transition = `transform ${this.#animationDuration}ms ease-in`;
					}

					marker.setLatLng(cluster.center);
				});
			}
			// else: was already in another cluster (off-map) → skip animation
		});

		return anyWasIndividual;
	}

	// Removes individual member markers from the map and places the cluster marker.
	#showCluster(cluster, key, animated)
	{
		const { mapInstance } = this.#host;

		cluster.markers.forEach((marker) => {
			if (mapInstance && mapInstance.hasLayer(marker))
			{
				this.#clearElementTransition(marker.getElement());
				mapInstance.removeLayer(marker);
			}
		});

		if (!mapInstance)
		{
			return;
		}

		const clusterMarker = this.#createClusterMarker(cluster, !animated);
		clusterMarker.addTo(mapInstance);
		this.#commitCluster(cluster, key, clusterMarker, cluster.center);
	}

	// Shows or slides in a new cluster that has no individual members to animate in.
	// Slides from the dissolved parent center when one exists; otherwise appears instantly.
	#showOrSlideInCluster(cluster, key, dissolvedCenters, animated)
	{
		const parentCenter = animated
			? this.#findPrimaryDissolvedCenter(cluster.ids, dissolvedCenters)
			: null;

		if (parentCenter)
		{
			this.#slideInCluster(cluster, key, parentCenter);
		}
		else
		{
			this.#showCluster(cluster, key, animated);
		}
	}

	// Creates the cluster marker at a dissolved parent center, then slides it to the actual center.
	#slideInCluster(cluster, key, fromLatLng)
	{
		const { mapInstance } = this.#host;

		cluster.markers.forEach((marker) => {
			if (mapInstance && mapInstance.hasLayer(marker))
			{
				mapInstance.removeLayer(marker);
			}
		});

		if (!mapInstance)
		{
			return;
		}

		const clusterMarker = this.#createClusterMarker(cluster, true);
		clusterMarker.setLatLng(fromLatLng);
		clusterMarker.addTo(mapInstance);
		this.#commitCluster(cluster, key, clusterMarker, cluster.center);

		this.#scheduleAnimation(() => {
			const el = clusterMarker.getElement();
			if (el)
			{
				el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
			}

			clusterMarker.setLatLng(cluster.center);
			this.#scheduleTransitionCleanup(clusterMarker);
		});
	}

	// Registers a cluster marker in the tracking maps once it is on the map.
	#commitCluster(cluster, key, clusterMarker, center)
	{
		this.#clusterMarkersByKey.set(key, { leafletMarker: clusterMarker, center });
		cluster.ids.forEach((id) => this.#prevMarkerClusterKey.set(id, key));
	}

	// Runs a callback after two animation frames, guarding against a destroyed map instance.
	// The double-rAF ensures the browser has committed the DOM state before the callback runs.
	#scheduleAnimation(callback)
	{
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (!this.#host.mapInstance)
				{
					return;
				}

				callback();
			});
		});
	}

	// Schedules removal of a CSS transition from a marker element after the animation completes.
	#scheduleTransitionCleanup(marker)
	{
		const t = setTimeout(() => {
			const el = marker.getElement();
			if (el)
			{
				el.style.transition = '';
			}
		}, this.#animationDuration);

		this.#pendingAnimationTimeouts.push(t);
	}

	#clearElementTransition(el)
	{
		if (el)
		{
			el.style.transition = '';
		}
	}

	#findPrimaryDissolvedCenter(memberIds, dissolvedCenters)
	{
		const counts = new Map();
		memberIds.forEach((id) => {
			const prevKey = this.#prevMarkerClusterKey.get(id);
			if (prevKey && dissolvedCenters.has(prevKey))
			{
				counts.set(prevKey, (counts.get(prevKey) || 0) + 1);
			}
		});

		let bestKey = null;
		let bestCount = 0;
		counts.forEach((count, key) => {
			if (count > bestCount)
			{
				bestCount = count;
				bestKey = key;
			}
		});

		return bestKey ? dissolvedCenters.get(bestKey) : null;
	}

	#getClusterKey(ids)
	{
		return [...ids].sort().join(',');
	}

	#getClusterTestId(ids)
	{
		const MAX_IDS = 20;
		const isRouteMode = Boolean(this.#options.routeMarkerIds?.length);

		if (isRouteMode)
		{
			const parts = ids[0].split('-');
			const employeeId = parts[parts.length - 2];
			const checkInIds = ids
				.map((id) => {
					const p = id.split('-');

					return parseInt(p[p.length - 1], 10);
				})
				.sort((a, b) => a - b)
				.slice(0, MAX_IDS);

			return `cluster-${employeeId}-${checkInIds.join('-')}`;
		}

		const employeeIds = ids
			.map((id) => {
				const p = id.split('-');

				return parseInt(p[p.length - 1], 10);
			})
			.sort((a, b) => a - b)
			.slice(0, MAX_IDS);

		return `cluster-${employeeIds.join('-')}`;
	}

	// ─── Private: cluster calculation ────────────────────────────────────────

	#calculateClusters()
	{
		const routeMarkerIds = this.#options.routeMarkerIds;
		if (routeMarkerIds?.length)
		{
			return this.#calculateRouteClusters(routeMarkerIds);
		}

		const { mapInstance, markers, markerOriginalLatLngs } = this.#host;
		const maxRadius = this.#options.maxClusterRadius ?? 80;
		const entries = [...markers.entries()];
		const assigned = new Set();
		const clusters = [];

		entries.forEach(([id, marker]) => {
			if (assigned.has(id))
			{
				return;
			}

			assigned.add(id);

			// Always use original LatLng for distance calculations so that
			// in-progress animations don't skew the cluster grouping.
			const origLatLng = markerOriginalLatLngs.get(id) || marker.getLatLng();
			const seedPoint = mapInstance.latLngToLayerPoint(origLatLng);
			const clusterIds = [id];
			const clusterMarkers = [marker];
			const clusterLatLngs = [origLatLng];

			entries.forEach(([otherId, otherMarker]) => {
				if (assigned.has(otherId))
				{
					return;
				}

				const otherOrigLatLng = markerOriginalLatLngs.get(otherId) || otherMarker.getLatLng();
				const otherPoint = mapInstance.latLngToLayerPoint(otherOrigLatLng);
				const dist = Math.hypot(seedPoint.x - otherPoint.x, seedPoint.y - otherPoint.y);

				if (dist <= maxRadius)
				{
					assigned.add(otherId);
					clusterIds.push(otherId);
					clusterMarkers.push(otherMarker);
					clusterLatLngs.push(otherOrigLatLng);
				}
			});

			const lat = clusterLatLngs.reduce((sum, ll) => sum + ll.lat, 0) / clusterLatLngs.length;
			const lng = clusterLatLngs.reduce((sum, ll) => sum + ll.lng, 0) / clusterLatLngs.length;

			clusters.push({
				id: `cluster-${id}`,
				ids: clusterIds,
				key: this.#getClusterKey(clusterIds),
				markers: clusterMarkers,
				center: [lat, lng],
			});
		});

		return clusters;
	}

	// Route-aware clustering: only consecutive markers can be merged, preserving
	// trajectory shape. Two passes: pass 1 skips the first/last markers so interior
	// points cluster first; pass 2 allows the endpoints to merge if still close enough.
	#calculateRouteClusters(routeMarkerIds)
	{
		const { markers } = this.#host;
		const filteredIds = routeMarkerIds.filter((id) => markers.has(id));
		if (filteredIds.length === 0)
		{
			return [];
		}

		const firstId = filteredIds[0];
		const lastId = filteredIds[filteredIds.length - 1];
		const maxRadius = this.#options.maxClusterRadius ?? 30;
		const maxSize = this.#getRouteMaxClusterSize();
		const pixelCoords = this.#buildPixelCoordsMap(filteredIds);

		const groups = filteredIds.map((id) => [id]);
		this.#mergeRouteGroups(groups, { firstId, lastId, maxRadius, maxSize, pixelCoords }, true);
		this.#mergeRouteGroups(groups, { firstId, lastId, maxRadius, maxSize, pixelCoords }, false);

		return groups.map((groupIds) => this.#buildRouteCluster(groupIds, firstId, lastId)).filter(Boolean);
	}

	// At each zoom level below the initial trajectory zoom, double the allowed cluster size
	// so that groups formed at a higher zoom can merge when zooming out.
	#getRouteMaxClusterSize()
	{
		const { mapInstance, fitBoundsMaxZoom } = this.#host;
		const baseSize = this.#options.maxRouteClusterSize ?? 6;
		const zoom = mapInstance.getZoom();

		return Math.round(baseSize * 2 ** Math.max(0, fitBoundsMaxZoom - 4 - zoom));
	}

	// Precomputes pixel coordinates for all marker IDs at the current zoom level.
	#buildPixelCoordsMap(ids)
	{
		const { mapInstance, markerOriginalLatLngs } = this.#host;
		const pixelCoords = new Map();
		ids.forEach((id) => {
			const ll = markerOriginalLatLngs.get(id);
			if (ll)
			{
				pixelCoords.set(id, mapInstance.latLngToLayerPoint(ll));
			}
		});

		return pixelCoords;
	}

	// Centroid-to-centroid pixel distance between two groups.
	// Using centroids instead of boundary points prevents cascade merging: as a group
	// grows its centroid shifts away from the adjacent group, naturally limiting merge depth.
	#getGroupCentroidDist(groupA, groupB, pixelCoords)
	{
		const getCentroid = (group) => {
			let xSum = 0;
			let ySum = 0;
			let count = 0;
			group.forEach((id) => {
				const p = pixelCoords.get(id);
				if (p)
				{
					xSum += p.x;
					ySum += p.y;
					count++;
				}
			});

			return count > 0 ? { x: xSum / count, y: ySum / count } : null;
		};

		const cA = getCentroid(groupA);
		const cB = getCentroid(groupB);
		if (!cA || !cB)
		{
			return Infinity;
		}

		return Math.hypot(cA.x - cB.x, cA.y - cB.y);
	}

	// Merges adjacent route groups that are within maxRadius of each other.
	// When skipEndpoints is true, groups containing the first or last marker are skipped.
	#mergeRouteGroups(groups, { firstId, lastId, maxRadius, maxSize, pixelCoords }, skipEndpoints)
	{
		const isEndpointGroup = (group) => group[0] === firstId || group[group.length - 1] === lastId;

		let changed = true;
		while (changed && groups.length > 1)
		{
			changed = false;
			for (let i = 0; i < groups.length - 1; i++)
			{
				const gA = groups[i];
				const gB = groups[i + 1];

				if (skipEndpoints && (isEndpointGroup(gA) || isEndpointGroup(gB)))
				{
					continue;
				}

				if (gA.length + gB.length > maxSize)
				{
					continue;
				}

				if (this.#getGroupCentroidDist(gA, gB, pixelCoords) <= maxRadius)
				{
					groups[i] = [...gA, ...gB];
					groups.splice(i + 1, 1);
					changed = true;
					break;
				}
			}
		}
	}

	// Builds a cluster object for a group of route marker IDs.
	// Returns null if center coordinates cannot be determined.
	#buildRouteCluster(groupIds, firstId, lastId)
	{
		const { markers, markerOriginalLatLngs } = this.#host;
		const clusterMarkers = groupIds.map((id) => markers.get(id)).filter(Boolean);
		const latLngs = groupIds.map((id) => markerOriginalLatLngs.get(id)).filter(Boolean);
		const center = this.#getRouteClusterCenter(groupIds, firstId, lastId, latLngs);

		if (center === null)
		{
			return null;
		}

		return {
			id: `cluster-${groupIds[0]}`,
			ids: groupIds,
			key: this.#getClusterKey(groupIds),
			markers: clusterMarkers,
			center,
		};
	}

	// Computes the display center for a route cluster.
	// Endpoint-only clusters are anchored to the endpoint's exact position;
	// interior clusters and full-route clusters use the centroid.
	#getRouteClusterCenter(groupIds, firstId, lastId, latLngs)
	{
		const hasFirst = groupIds[0] === firstId;
		const hasLast = groupIds[groupIds.length - 1] === lastId;
		const isSingleEndpoint = (hasFirst || hasLast) && !(hasFirst && hasLast);

		if (isSingleEndpoint)
		{
			const anchorId = hasFirst ? firstId : lastId;
			const ll = this.#host.markerOriginalLatLngs.get(anchorId);

			return [ll.lat, ll.lng];
		}

		if (latLngs.length === 0)
		{
			return null;
		}

		const lat = latLngs.reduce((s, ll) => s + ll.lat, 0) / latLngs.length;
		const lng = latLngs.reduce((s, ll) => s + ll.lng, 0) / latLngs.length;

		return [lat, lng];
	}

	// ─── Private: cluster marker creation ────────────────────────────────────

	#createClusterMarker(cluster, skipAnimation = false)
	{
		const { markerConfigs, mapInstance, fitBoundsMaxZoom, fitBoundsPadding } = this.#host;
		const clusterMarkerConfigs = cluster.ids.map((id) => markerConfigs.get(id) ?? null);
		const animated = !skipAnimation && this.#options.animated !== false;
		const iconConfig = this.#getClusterIconConfig(clusterMarkerConfigs, animated);
		const icon = this.#host.createDivIcon(
			iconConfig.html,
			iconConfig.className,
			iconConfig.iconSize,
			iconConfig.iconAnchor,
		);

		const zIndexes = clusterMarkerConfigs
			.filter(Boolean)
			.map((cfg) => cfg.zIndex)
			.filter((index) => index !== null);
		const avgZIndex = zIndexes.length > 0
			? zIndexes.reduce((a, b) => a + b, 0) / zIndexes.length
			: null;
		const zIndexOffset = avgZIndex === null ? 0 : Math.round(avgZIndex * 10000);

		const marker = L.marker(cluster.center, { icon, zIndexOffset });

		const testId = this.#getClusterTestId(cluster.ids);
		marker.on('add', () => {
			marker.getElement()?.setAttribute('testId', testId);
		});

		marker.on('click', () => {
			// Use original LatLngs — marker.getLatLng() may have been changed by clustering animation
			const origLatLngs = cluster.ids
				.map((id) => this.#host.markerOriginalLatLngs.get(id))
				.filter(Boolean);

			if (origLatLngs.length === 0)
			{
				return;
			}

			const clusterBounds = L.latLngBounds(origLatLngs);

			// Check whether zooming to fitBoundsMaxZoom would actually separate the markers.
			// Project the bounding box corners to pixels at max zoom and measure the diagonal.
			// If it is still within the clustering radius the markers are co-located (same
			// building / identical GPS coordinates) and zooming in will not help.
			const ne = mapInstance.project(clusterBounds.getNorthEast(), fitBoundsMaxZoom);
			const sw = mapInstance.project(clusterBounds.getSouthWest(), fitBoundsMaxZoom);
			const pixelDiameter = ne.distanceTo(sw);
			const maxRadius = this.#options.maxClusterRadius ?? 80;

			if (pixelDiameter <= maxRadius)
			{
				this.#host.sendEvent(CheckInMapEventType.CLUSTER_CLICKED, {
					markerIds: cluster.ids,
					coords: cluster.center,
				});

				return;
			}

			const { paddingTopLeft, paddingBottomRight } = this.#host.normalizePadding(fitBoundsPadding);
			mapInstance.fitBounds(clusterBounds, {
				paddingTopLeft,
				paddingBottomRight,
				maxZoom: fitBoundsMaxZoom,
			});
		});

		return marker;
	}

	#getClusterIconConfig(markerConfigs, animated = true)
	{
		if (typeof this.#options.clusterIconFactory === 'function')
		{
			return this.#options.clusterIconFactory(markerConfigs, animated);
		}

		console.warn('ClusteringManager: clusterIconFactory is not set in options');

		return {
			html: `<div class="map-cluster-icon"><span>${markerConfigs.length}</span></div>`,
			className: 'map-cluster-marker',
			iconSize: [81, 81],
			iconAnchor: [40, 40],
		};
	}
}
