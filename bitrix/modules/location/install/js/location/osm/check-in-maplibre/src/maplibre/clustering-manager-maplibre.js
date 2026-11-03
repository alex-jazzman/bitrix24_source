import { CheckInMapEventType } from 'location.core';
import { maplibregl } from 'location.osm.maplibre';
import { toLngLat } from './coords';
import { clusterWouldSplitAtZoom } from './cluster-split';

// Route marker ids are `{auto-}check-in-{employeeId}-{checkInId}`; the checkInId itself may carry dashes
// (`track-start` / `track-end`), so the employee id is read off this prefix, not by segment position.
const CHECK_IN_MARKER_PREFIX = /^(?:auto-)?check-in-/;

/**
 * Manages marker clustering for CheckInMapServiceMapLibre.
 *
 * Direct port of ClusteringManager (Leaflet) - same public API and algorithm,
 * adapted for MapLibre HTML markers. Only the Leaflet-specific primitives are
 * replaced:
 * - L.marker / marker.getLatLng / setLatLng -> maplibregl.Marker / getLngLat / setLngLat
 *     (centers are still stored host-side as [lat, lng]; converted with toLngLat
 *      only when handed to MapLibre)
 * - mapInstance.hasLayer(marker)            -> an explicit #onMap tracking Set
 * - mapInstance.latLngToLayerPoint(ll)      -> mapInstance.project(toLngLat(ll))
 * - mapInstance.project(ll, zoom)           -> #projectAtZoom(ll, zoom) (pure Web-Mercator)
 * - L.latLngBounds / getNorthEast/SouthWest -> maplibregl.LngLatBounds
 *
 * Host properties accessed (CheckInMapServiceMapLibre):
 *   mapInstance, markers, layers, markerOriginalLatLngs, markerConfigs,
 *   fitBoundsMaxZoom, fitBoundsPadding,
 *   createDivIcon(), sendEvent(), normalizePadding(), setLayerPath(), isLayerAnimating(),
 *   isMarkerAnimating(), cancelMarkerAnimation()
 */
export class ClusteringManagerMapLibre
{
	/** @type {import('../check-in-map-service-maplibre').default} */
	#host;

	#options = {};
	#enabled = false;

	// Maps markerId -> clusterKey (sorted IDs string) | null (individual).
	// Only updated when a cluster is actually committed (marker appears on map).
	#prevMarkerClusterKey = new Map();

	// Maps clusterKey -> { marker, center: [lat, lng] }.
	// Only contains clusters whose markers ARE currently on the map.
	#clusterMarkersByKey = new Map();

	// MapLibre markers have no hasLayer() equivalent, so on-map state is tracked
	// explicitly. Holds marker IDs (individual markers) currently added to the map.
	#markersOnMap = new Set();

	#pendingAnimationTimeouts = [];

	#suppressNextClusterAnimation = false;

	#transitionInProgress = false;
	#transitionSafetyTimeout = null;

	#animationDuration = 300;

	constructor(host)
	{
		this.#host = host;
	}

	// Public API

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
			markers.forEach((marker, id) => {
				if (this.#isOnMap(id))
				{
					marker.remove();
					this.#markersOnMap.delete(id);
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
		clearTimeout(this.#transitionSafetyTimeout);
		this.#transitionInProgress = false;
		this.#prevMarkerClusterKey.clear();

		const { mapInstance, markers, markerOriginalLatLngs } = this.#host;

		if (mapInstance)
		{
			mapInstance.off('zoomend', this.#onZoomEnd);
			mapInstance.off('moveend', this.#onTransitionEnd);
		}

		this.clearClusterMarkers();

		// Restore all individual markers on the map at their original positions
		markers.forEach((marker, id) => {
			this.#takeOverPosition(id);

			const el = marker.getElement();
			if (el)
			{
				el.style.transition = '';
			}

			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLngLat(toLngLat(orig));
			}

			if (mapInstance && !this.#isOnMap(id))
			{
				marker.addTo(mapInstance);
				this.#markersOnMap.add(id);
			}
		});
	}

	/**
	 * Releases resources and removes event listeners without restoring markers
	 * to the map. Called by CheckInMapServiceMapLibre.destroy() before clearMarkers().
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

		this.#clusterMarkersByKey.forEach(({ marker }) => {
			marker.remove();
		});
		this.#clusterMarkersByKey.clear();

		markers.forEach((marker, id) => {
			if (this.#isOnMap(id))
			{
				this.#takeOverPosition(id);

				const el = marker.getElement();
				if (el)
				{
					el.style.transition = '';
				}

				marker.remove();
				this.#markersOnMap.delete(id);
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

		if (!this.#enabled || !mapInstance || this.#transitionInProgress)
		{
			return;
		}

		this.cancelPendingAnimations();
		this.#snapAllMarkersToPosition();

		const clusters = this.#calculateClusters();
		const animated = this.#options.animated !== false && !forceNoAnimation;
		const dissolvedCenters = this.#removeDissolvedClusters(clusters);

		clusters.forEach((cluster) => {
			if (cluster.members.length === 1)
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

		// MapLibre markers have no setIcon(); mutate the existing element in place
		// (public getElement()) so the marker's positioning/anchor handling stays
		// intact. Mirrors Leaflet's marker.setIcon() + testId reset.
		const el = entry.marker.getElement();
		if (!el)
		{
			return;
		}

		this.#host.applyIconToElement(el, iconConfig);
		const testId = this.#getClusterTestId(markerIds);
		el.setAttribute('testId', testId);
		el.setAttribute('data-testid', testId);
	}

	cancelPendingAnimations()
	{
		this.#pendingAnimationTimeouts.forEach((id) => clearTimeout(id));
		this.#pendingAnimationTimeouts = [];
	}

	clearClusterMarkers()
	{
		this.#clusterMarkersByKey.forEach(({ marker }) => {
			marker.remove();
		});
		this.#clusterMarkersByKey.clear();
		this.#prevMarkerClusterKey.clear();
	}

	clearPrevMarkerKeys()
	{
		this.#prevMarkerClusterKey.clear();
		this.#markersOnMap.clear();
	}

	deletePrevMarkerKey(id)
	{
		this.#prevMarkerClusterKey.delete(id);
		this.#markersOnMap.delete(id);
	}

	/**
	 * Notifies the manager that the host added an individual marker directly to the
	 * map (clustering disabled). MapLibre has no hasLayer(), so on-map state is
	 * tracked explicitly; without this the manager could not hide pre-existing
	 * markers when clustering is later enabled (Leaflet read this from hasLayer()).
	 * @param {String|Number} id
	 */
	markAdded(id)
	{
		this.#markersOnMap.add(id);
	}

	/**
	 * Notifies the manager that the host removed/replaced an individual marker.
	 * @param {String|Number} id
	 */
	markRemoved(id)
	{
		this.#markersOnMap.delete(id);
	}

	/**
	 * Whether this marker stands on the map on its own right now (as opposed to being folded into a
	 * cluster, or not drawn at all). The host asks before walking a marker to a new coordinate: only
	 * a marker of its own is there to walk, and while it walks the snap below leaves it alone.
	 * @param {String|Number} id
	 * @returns {Boolean}
	 */
	isMarkerOnMap(id)
	{
		return this.#isOnMap(id);
	}

	// Takes the position of a marker back from a running move, right before placing it. Every path
	// that writes a marker position from here goes through this: the position has one owner at a
	// time, and two of them would tug the marker between the cluster layout and the move.
	#takeOverPosition(id)
	{
		this.#host.cancelMarkerAnimation(id);
	}

	// Private: on-map tracking

	#isOnMap(id)
	{
		return this.#markersOnMap.has(id);
	}

	// Private: transition & zoom

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

	// Private: cluster rendering

	// Computes a simplified polyline through cluster centers in route order and
	// updates the stored route polyline layers via the host.
	#updateRoutePolyline(clusters)
	{
		const { routeMarkerIds, routeLayerIds } = this.#options;

		if (!routeLayerIds?.length)
		{
			return;
		}

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
				return; // consecutive markers in same cluster -> skip
			}

			lastClusterKey = cluster.key;
			path.push(cluster.center); // [lat, lng]
		});

		routeLayerIds.forEach((layerId) => {
			// Skip a layer mid-grow: the host is animating its geometry, and an instant polyline rewrite
			// here would fight the grow frames. The next updateClusters restores the clustered path.
			if (this.#host.isLayerAnimating && this.#host.isLayerAnimating(layerId))
			{
				return;
			}

			this.#host.setLayerPath(layerId, path);
		});
	}

	// Snap any markers or cluster markers that are mid-animation back to their
	// stable positions before recalculating the cluster layout.
	//
	// A marker walking to a new coordinate is left where it is: the layout is computed from the stored
	// coordinates (i.e. from where the walk ends), so nothing here depends on the frame it is on, and
	// snapping it would cut the walk off on every recalculation. Every path that does place such a
	// marker takes its position back first (#takeOverPosition).
	#snapAllMarkersToPosition()
	{
		const { markers, markerOriginalLatLngs } = this.#host;

		markers.forEach((marker, id) => {
			if (!this.#isOnMap(id) || this.#host.isMarkerAnimating(id))
			{
				return;
			}

			const el = marker.getElement();
			const hasTransition = el && el.style.transition !== '';
			const orig = markerOriginalLatLngs.get(id);
			const needsSnap = orig && !this.#lngLatEquals(marker.getLngLat(), orig);

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
				marker.setLngLat(toLngLat(orig));
			}
		});

		this.#clusterMarkersByKey.forEach(({ marker, center }) => {
			const el = marker.getElement();
			const hasTransition = el && el.style.transition !== '';
			const needsSnap = !this.#lngLatEquals(marker.getLngLat(), center);

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
				marker.setLngLat(toLngLat(center));
			}
		});
	}

	// Removes cluster markers that no longer exist in the new layout from the map.
	// Returns a map of dissolved cluster keys -> their last known centers ([lat,lng]),
	// used to animate members flying out from where their cluster was.
	#removeDissolvedClusters(clusters)
	{
		const newClustersByKey = new Map();
		clusters.forEach((cluster) => {
			if (cluster.members.length > 1)
			{
				newClustersByKey.set(cluster.key, cluster);
			}
		});

		const dissolvedCenters = new Map();
		this.#clusterMarkersByKey.forEach(({ marker, center }, key) => {
			if (!newClustersByKey.has(key))
			{
				marker.remove();
				dissolvedCenters.set(key, center);
				this.#clusterMarkersByKey.delete(key);
			}
		});

		return dissolvedCenters;
	}

	// Places a single marker on the map, animating it from its former cluster center if applicable.
	#applyIndividualMarker(cluster, dissolvedCenters, animated)
	{
		const [{ id, marker }] = cluster.members;
		const prevKey = this.#prevMarkerClusterKey.get(id);
		const { markerOriginalLatLngs } = this.#host;

		if (animated && prevKey && dissolvedCenters.has(prevKey))
		{
			// Was in a dissolved cluster -> fly from cluster center to actual position
			this.#animateMarkerFromCluster(marker, id, dissolvedCenters.get(prevKey));
		}
		else if (!this.#isOnMap(id))
		{
			// Snap to original position before adding - the marker's LngLat may have been
			// moved to a cluster center during a previous animation and never reset.
			this.#takeOverPosition(id);
			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLngLat(toLngLat(orig));
			}

			this.#addMarkerToMap(marker, id);
		}

		this.#prevMarkerClusterKey.set(id, null);
	}

	// Animates a marker flying from a dissolved cluster center to its original position.
	#animateMarkerFromCluster(marker, id, fromLatLng)
	{
		const { markerOriginalLatLngs } = this.#host;

		this.#takeOverPosition(id);
		marker.setLngLat(toLngLat(fromLatLng));
		this.#addMarkerToMap(marker, id);

		this.#scheduleAnimation(() => {
			const el = marker.getElement();
			if (el)
			{
				el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
			}

			const orig = markerOriginalLatLngs.get(id);
			if (orig)
			{
				marker.setLngLat(toLngLat(orig));
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
			// Stable cluster: marker is already on the map - just keep tracking up to date
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

		cluster.members.forEach(({ id, marker }) => {
			const prevKey = this.#prevMarkerClusterKey.get(id);

			if (animated && !prevKey && this.#isOnMap(id))
			{
				// Was individual and visible -> animate towards cluster center
				anyWasIndividual = true;
				this.#takeOverPosition(id);

				this.#scheduleAnimation(() => {
					const el = marker.getElement();
					if (el)
					{
						el.style.transition = `transform ${this.#animationDuration}ms ease-in`;
					}

					marker.setLngLat(toLngLat(cluster.center));
				});
			}
			// else: was already in another cluster (off-map) -> skip animation
		});

		return anyWasIndividual;
	}

	// Removes individual member markers from the map and places the cluster marker.
	#showCluster(cluster, key, animated)
	{
		const { mapInstance } = this.#host;

		cluster.members.forEach(({ id, marker }) => {
			if (this.#isOnMap(id))
			{
				this.#takeOverPosition(id);
				this.#clearElementTransition(marker.getElement());
				marker.remove();
				this.#markersOnMap.delete(id);
			}
		});

		if (!mapInstance)
		{
			return;
		}

		const clusterMarker = this.#createClusterMarker(cluster, !animated);
		clusterMarker.setLngLat(toLngLat(cluster.center));
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

		cluster.members.forEach(({ id, marker }) => {
			if (this.#isOnMap(id))
			{
				this.#takeOverPosition(id);
				marker.remove();
				this.#markersOnMap.delete(id);
			}
		});

		if (!mapInstance)
		{
			return;
		}

		const clusterMarker = this.#createClusterMarker(cluster, true);
		clusterMarker.setLngLat(toLngLat(fromLatLng));
		clusterMarker.addTo(mapInstance);
		this.#commitCluster(cluster, key, clusterMarker, cluster.center);

		this.#scheduleAnimation(() => {
			const el = clusterMarker.getElement();
			if (el)
			{
				el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
			}

			clusterMarker.setLngLat(toLngLat(cluster.center));
			this.#scheduleTransitionCleanup(clusterMarker);
		});
	}

	// Registers a cluster marker in the tracking maps once it is on the map.
	#commitCluster(cluster, key, clusterMarker, center)
	{
		this.#clusterMarkersByKey.set(key, { marker: clusterMarker, center });
		cluster.ids.forEach((id) => this.#prevMarkerClusterKey.set(id, key));
	}

	#addMarkerToMap(marker, id)
	{
		const { mapInstance } = this.#host;
		if (!mapInstance)
		{
			return;
		}

		marker.addTo(mapInstance);
		this.#markersOnMap.add(id);
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
			const employeeId = parseInt(ids[0].replace(CHECK_IN_MARKER_PREFIX, ''), 10);
			// A check-in id suffix is numeric except for the track ends (`-track-start` / `-track-end`),
			// so the suffix is kept as a string: parsing it would turn those ends into NaN.
			const checkInIds = ids
				.map((id) => {
					const p = id.split('-');

					return p[p.length - 1];
				})
				.sort((a, b) => this.#compareIdSuffixes(a, b))
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

	// Numeric suffixes go first, ordered by value; named ones (track ends) follow in a stable
	// alphabetical order, so the same cluster always yields the same testId.
	#compareIdSuffixes(a, b)
	{
		const numA = parseInt(a, 10);
		const numB = parseInt(b, 10);
		const isNumberA = !Number.isNaN(numA);
		const isNumberB = !Number.isNaN(numB);

		if (isNumberA && isNumberB)
		{
			return numA - numB;
		}

		if (isNumberA !== isNumberB)
		{
			return isNumberA ? -1 : 1;
		}

		return a.localeCompare(b);
	}

	// Private: projection helpers

	// Pixel point ({x, y}) of a [lat, lng] at the current zoom. Replaces
	// Leaflet's latLngToLayerPoint - only relative distances are used so the
	// container/layer offset is irrelevant.
	#projectCurrent(latLng)
	{
		const p = this.#host.mapInstance.project(toLngLat(latLng));

		return { x: p.x, y: p.y };
	}

	// Absolute world-pixel point of a [lat, lng] at an arbitrary zoom level.
	// Replaces Leaflet's mapInstance.project(latLng, zoom). Uses the standard
	// Web-Mercator tile pixel formula (tileSize 512 - MapLibre's world size).
	#projectAtZoom(latLng, zoom)
	{
		const [lat, lng] = latLng;
		const scale = 512 * (2 ** zoom);
		const x = (lng + 180) / 360 * scale;
		const sinLat = Math.sin((lat * Math.PI) / 180);
		const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;

		return { x, y };
	}

	#pixelDistance(a, b)
	{
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	#lngLatEquals(lngLat, latLng)
	{
		// lngLat is a MapLibre LngLat {lng, lat}; latLng is host [lat, lng].
		const EPS = 1e-9;

		return Math.abs(lngLat.lat - latLng[0]) < EPS && Math.abs(lngLat.lng - latLng[1]) < EPS;
	}

	// Private: cluster calculation

	#calculateClusters()
	{
		const routeMarkerIds = this.#options.routeMarkerIds;
		if (routeMarkerIds?.length)
		{
			return this.#calculateRouteClusters(routeMarkerIds);
		}

		const { markers, markerOriginalLatLngs } = this.#host;
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
			const origLatLng = markerOriginalLatLngs.get(id) || this.#lngLatToArray(marker.getLngLat());
			const seedPoint = this.#projectCurrent(origLatLng);
			const members = [{ id, marker }];
			const clusterLatLngs = [origLatLng];

			entries.forEach(([otherId, otherMarker]) => {
				if (assigned.has(otherId))
				{
					return;
				}

				const otherOrigLatLng = markerOriginalLatLngs.get(otherId)
					|| this.#lngLatToArray(otherMarker.getLngLat());
				const otherPoint = this.#projectCurrent(otherOrigLatLng);
				const dist = this.#pixelDistance(seedPoint, otherPoint);

				if (dist <= maxRadius)
				{
					assigned.add(otherId);
					members.push({ id: otherId, marker: otherMarker });
					clusterLatLngs.push(otherOrigLatLng);
				}
			});

			const lat = clusterLatLngs.reduce((sum, ll) => sum + ll[0], 0) / clusterLatLngs.length;
			const lng = clusterLatLngs.reduce((sum, ll) => sum + ll[1], 0) / clusterLatLngs.length;
			const ids = members.map((member) => member.id);

			clusters.push({
				id: `cluster-${id}`,
				ids,
				key: this.#getClusterKey(ids),
				members,
				center: [lat, lng],
			});
		});

		return clusters;
	}

	#lngLatToArray(lngLat)
	{
		return [lngLat.lat, lngLat.lng];
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

		const groups = this.#groupCoLocatedRouteMarkers(filteredIds, maxRadius);
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
		const { markerOriginalLatLngs } = this.#host;
		const pixelCoords = new Map();
		ids.forEach((id) => {
			const ll = markerOriginalLatLngs.get(id);
			if (ll)
			{
				pixelCoords.set(id, this.#projectCurrent(ll));
			}
		});

		return pixelCoords;
	}

	// Pre-pass: collapses consecutive markers that would always cluster together - i.e. their
	// pixel distance at the deepest allowed zoom (fitBoundsMaxZoom) is still within
	// maxClusterRadius - into a single group, bypassing the maxSize cap used by
	// #mergeRouteGroups. Such markers cannot be visually separated by zooming in (auto-tracking
	// often emits multiple check-ins with near-identical GPS coordinates), so respecting
	// maxSize would produce multiple stacked clusters at the same screen position.
	#groupCoLocatedRouteMarkers(ids, maxRadius)
	{
		const { markerOriginalLatLngs, fitBoundsMaxZoom } = this.#host;
		const groups = [];
		let currentGroup = null;
		let anchorPoint = null;

		ids.forEach((id) => {
			const ll = markerOriginalLatLngs.get(id);
			const point = ll ? this.#projectAtZoom(ll, fitBoundsMaxZoom) : null;
			const isColocated = currentGroup
				&& point
				&& anchorPoint
				&& this.#pixelDistance(anchorPoint, point) <= maxRadius;

			if (isColocated)
			{
				currentGroup.push(id);

				return;
			}

			currentGroup = [id];
			anchorPoint = point;
			groups.push(currentGroup);
		});

		return groups;
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
	//
	// An id and its marker are kept in one record: a group id the host has no marker for leaves the
	// cluster whole, instead of shifting the remaining ids onto their neighbours' markers.
	#buildRouteCluster(groupIds, firstId, lastId)
	{
		const { markers, markerOriginalLatLngs } = this.#host;
		const members = groupIds
			.map((id) => ({ id, marker: markers.get(id) }))
			.filter(({ marker }) => Boolean(marker));
		const ids = members.map((member) => member.id);
		const latLngs = ids.map((id) => markerOriginalLatLngs.get(id)).filter(Boolean);
		const center = this.#getRouteClusterCenter(ids, firstId, lastId, latLngs);

		if (center === null)
		{
			return null;
		}

		return {
			id: `cluster-${ids[0]}`,
			ids,
			key: this.#getClusterKey(ids),
			members,
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

			return [ll[0], ll[1]];
		}

		if (latLngs.length === 0)
		{
			return null;
		}

		const lat = latLngs.reduce((s, ll) => s + ll[0], 0) / latLngs.length;
		const lng = latLngs.reduce((s, ll) => s + ll[1], 0) / latLngs.length;

		return [lat, lng];
	}

	// Private: cluster marker creation

	#createClusterMarker(cluster, skipAnimation = false)
	{
		const { markerConfigs } = this.#host;
		const clusterMarkerConfigs = cluster.ids.map((id) => markerConfigs.get(id) ?? null);
		const animated = !skipAnimation && this.#options.animated !== false;
		const iconConfig = this.#getClusterIconConfig(clusterMarkerConfigs, animated);
		const el = this.#host.createDivIcon(
			iconConfig.html,
			iconConfig.className,
			iconConfig.iconSize,
			iconConfig.iconAnchor,
		);

		const zIndexes = clusterMarkerConfigs
			.filter(Boolean)
			.map((cfg) => cfg.zIndex)
			.filter((index) => index !== null && index !== undefined);
		const avgZIndex = zIndexes.length > 0
			? zIndexes.reduce((a, b) => a + b, 0) / zIndexes.length
			: null;

		if (avgZIndex !== null)
		{
			el.style.zIndex = String(Math.round(avgZIndex * 10000));
		}

		const testId = this.#getClusterTestId(cluster.ids);
		el.setAttribute('testId', testId);
		el.setAttribute('data-testid', testId);

		const marker = new maplibregl.Marker({
			element: el,
			anchor: this.#host.anchorFromIcon(iconConfig),
		});

		el.addEventListener('click', () => this.#onClusterClick(cluster));

		return marker;
	}

	#onClusterClick(cluster)
	{
		const { mapInstance, fitBoundsMaxZoom, fitBoundsPadding } = this.#host;

		const origLatLngs = cluster.ids
			.map((id) => this.#host.markerOriginalLatLngs.get(id))
			.filter(Boolean);

		if (origLatLngs.length === 0)
		{
			return;
		}

		const maxRadius = this.#options.maxClusterRadius ?? 80;

		if (!clusterWouldSplitAtZoom(origLatLngs, fitBoundsMaxZoom, maxRadius))
		{
			this.#host.sendEvent(CheckInMapEventType.CLUSTER_CLICKED, {
				markerIds: cluster.ids,
				coords: cluster.center,
			});

			return;
		}

		const clusterBounds = new maplibregl.LngLatBounds();
		origLatLngs.forEach((ll) => clusterBounds.extend(toLngLat(ll)));

		const padding = this.#host.normalizePadding(fitBoundsPadding);
		mapInstance.fitBounds(clusterBounds, {
			padding,
			maxZoom: fitBoundsMaxZoom,
			animate: true,
		});
	}

	#getClusterIconConfig(markerConfigs, animated = true)
	{
		if (typeof this.#options.clusterIconFactory === 'function')
		{
			return this.#options.clusterIconFactory(markerConfigs, animated);
		}

		console.warn('ClusteringManagerMapLibre: clusterIconFactory is not set in options');

		return {
			html: `<div class="map-cluster-icon"><span>${markerConfigs.length}</span></div>`,
			className: 'map-cluster-marker',
			iconSize: [81, 81],
			iconAnchor: [40, 40],
		};
	}
}

export default ClusteringManagerMapLibre;
