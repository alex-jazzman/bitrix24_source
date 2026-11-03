/* eslint-disable */
this.BX = this.BX || {};
this.BX.Location = this.BX.Location || {};
(function (exports, location_osm, location_core, location_osm_maplibre) {
	'use strict';

	/**
	 * MapLibre auth protocol for OSM raster tiles.
	 *
	 * Ports location/osm/leaflet/src/tilelayerauth.js (Bearer + Bx-Location-Osm-Host
	 * header + 401 refresh with a queue of waiting requests) to MapLibre's
	 * `addProtocol` API. MapLibre's `transformRequest` is synchronous and cannot
	 * refresh tokens asynchronously, so a custom `osmauth://` protocol is used
	 * instead: the callback may return a Promise and run `fetch` with custom headers,
	 * which is the exact analogue of TileLayerAuth.requestTile.
	 *
	 * 401-refresh semantics (must match tilelayerauth.js:80-98 line by line):
	 *   - On the first 401, exactly one refreshToken() runs.
	 *   - All tiles that hit a 401 while a refresh is in flight wait in a queue.
	 *   - After the refresh resolves, every queued tile is retried with isRetry=true
	 *     and a 401 on the retry no longer triggers another refresh.
	 *   - `cache: 'force-cache'` is preserved.
	 */
	class OsmAuthProtocol {
		static SCHEME = 'osmauth';
		#tokenContainer;
		#hostName;
		#mapServiceUrl;
		#processingUnauthorized = false;
		#waitingRequests = [];
		constructor({
			tokenContainer,
			hostName,
			mapServiceUrl
		}) {
			this.#tokenContainer = tokenContainer;
			this.#hostName = hostName;
			this.#mapServiceUrl = mapServiceUrl;
		}

		// osmauth://hot/en/{z}/{x}/{y}.png  ->  ${mapServiceUrl}/hot/en/{z}/{x}/{y}.png
		buildTileUrlTemplate() {
			return `${OsmAuthProtocol.SCHEME}://hot/en/{z}/{x}/{y}.png`;
		}
		#resolveRealUrl(requestUrl) {
			// Strip the custom scheme and prepend the authorized proxy origin.
			const path = requestUrl.replace(`${OsmAuthProtocol.SCHEME}://`, '');
			return `${this.#mapServiceUrl}/${path}`;
		}
		#fetchTile(requestUrl, isRetry) {
			const url = this.#resolveRealUrl(requestUrl);
			return fetch(url, {
				method: 'GET',
				cache: 'force-cache',
				headers: new Headers({
					Authorization: `Bearer ${this.#tokenContainer.token}`,
					'Bx-Location-Osm-Host': this.#hostName
				})
			}).then(response => {
				if (response.status === 200) {
					return response.arrayBuffer().then(data => ({
						data
					}));
				}
				if (response.status === 401 && !isRetry) {
					return this.#processUnauthorized(requestUrl);
				}
				console.error(`Tile response status: ${response.status}`);

				// MapLibre treats an empty buffer as a transparent/empty tile rather
				// than throwing, mirroring Leaflet's silent failure on non-200.
				return {
					data: new ArrayBuffer(0)
				};
			}).catch(error => {
				console.error(error);
				return {
					data: new ArrayBuffer(0)
				};
			});
		}
		#processUnauthorized(requestUrl) {
			// Queue this request and resolve it once the refresh + retry completes.
			// Equivalent to tilelayerauth.js pushing [url, img, done] onto
			// #waitingRequests and replaying them after refreshToken().
			const deferred = {};
			const promise = new Promise(resolve => {
				deferred.resolve = resolve;
			});
			this.#waitingRequests.push({
				requestUrl,
				resolve: deferred.resolve
			});
			if (!this.#processingUnauthorized) {
				this.#processingUnauthorized = true;
				this.#tokenContainer.refreshToken().then(() => {
					const pending = this.#waitingRequests.splice(0);
					this.#processingUnauthorized = false;
					pending.forEach(item => {
						// Retry with isRetry=true so a repeated 401 won't loop into another refresh.
						this.#fetchTile(item.requestUrl, true).then(item.resolve);
					});
				});
			}
			return promise;
		}
		register(maplibregl) {
			// MapLibre GL JS v4/v5 callback signature: (requestParameters) => Promise<{data}>.
			maplibregl.addProtocol(OsmAuthProtocol.SCHEME, params => this.#fetchTile(params.url, false));
		}
		unregister(maplibregl) {
			maplibregl.removeProtocol(OsmAuthProtocol.SCHEME);
		}
	}

	/**
	 * Pure coordinate/padding helpers for the MapLibre engine.
	 *
	 * Extracted from the engine so they can be unit-tested in isolation (task 1.10).
	 * The engine imports `toLngLat` / `normalizePaddingPx` from here and must never
	 * invert coordinates anywhere else - conversion happens ONLY at the engine
	 * boundary (see CheckInMapServiceMapLibre).
	 */

	/**
	 * Converts a host/Leaflet `[lat, lng]` pair into MapLibre's `[lng, lat]` order.
	 *
	 * The whole codebase (contract, Leaflet engine, dispatcher) speaks `[lat, lng]`.
	 * MapLibre's API expects `[lng, lat]`. This is the single inversion point.
	 *
	 * @param {number[]} coords - `[lat, lng]`
	 * @returns {number[]} `[lng, lat]`
	 */
	function toLngLat(coords) {
		return [coords[1], coords[0]];
	}

	/**
	 * Normalizes `fitBoundsPadding` into a MapLibre padding object `{top, left, bottom, right}`.
	 *
	 * Mirrors the semantics of the Leaflet engine's `normalizePadding`
	 * (check-in-map-service.js), but produces a MapLibre-shaped object instead of
	 * Leaflet Points.
	 *
	 * Supported input formats:
	 *   [vertical, horizontal] - symmetric, same value on top/bottom and left/right
	 *   [top, right, bottom, left] - CSS-like, each side explicit
	 *
	 * A plain object that already looks like `{top,left,bottom,right}` is passed
	 * through (with missing sides defaulted to 0) so ANIMATION_CONFIG padding can be
	 * used directly.
	 *
	 * @param {number[]|object} padding
	 * @returns {{top: number, left: number, bottom: number, right: number}}
	 */
	function normalizePaddingPx(padding) {
		if (padding && !Array.isArray(padding) && typeof padding === 'object') {
			return {
				top: padding.top || 0,
				left: padding.left || 0,
				bottom: padding.bottom || 0,
				right: padding.right || 0
			};
		}
		if (!Array.isArray(padding)) {
			return {
				top: 0,
				left: 0,
				bottom: 0,
				right: 0
			};
		}
		if (padding.length >= 4) {
			// [top, right, bottom, left]
			return {
				top: padding[0],
				right: padding[1],
				bottom: padding[2],
				left: padding[3]
			};
		}

		// [vertical, horizontal] - symmetric
		const [v, h = v] = padding;
		return {
			top: v,
			bottom: v,
			left: h,
			right: h
		};
	}

	function projectAtZoom(latLng, zoom) {
		const [lat, lng] = latLng;
		const scale = 512 * 2 ** zoom;
		const x = (lng + 180) / 360 * scale;
		const sinLat = Math.sin(lat * Math.PI / 180);
		const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
		return {
			x,
			y
		};
	}
	function clusterWouldSplitAtZoom(latLngs, zoom, maxRadius) {
		if (!Array.isArray(latLngs) || latLngs.length <= 1) {
			return false;
		}
		const seed = projectAtZoom(latLngs[0], zoom);
		return latLngs.slice(1).some(latLng => {
			const point = projectAtZoom(latLng, zoom);
			return Math.hypot(point.x - seed.x, point.y - seed.y) > maxRadius;
		});
	}

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
	class ClusteringManagerMapLibre {
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
		constructor(host) {
			this.#host = host;
		}

		// Public API

		get isEnabled() {
			return this.#enabled;
		}
		get options() {
			return this.#options;
		}
		get isTransitionInProgress() {
			return this.#transitionInProgress;
		}

		/**
		 * Enables clustering with the given options. Can be called repeatedly to
		 * update options while clustering is already active.
		 */
		enable(options = {}) {
			const wasEnabled = this.#enabled;
			this.#options = options;
			this.#enabled = true;
			const {
				mapInstance,
				markers
			} = this.#host;
			if (mapInstance && !wasEnabled) {
				// Hide individual markers that may have been added before clustering was enabled.
				// They will be re-added as clusters by updateClusters() below.
				markers.forEach((marker, id) => {
					if (this.#isOnMap(id)) {
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
		disable() {
			this.#enabled = false;
			this.#options = {};
			this.cancelPendingAnimations();
			clearTimeout(this.#transitionSafetyTimeout);
			this.#transitionInProgress = false;
			this.#prevMarkerClusterKey.clear();
			const {
				mapInstance,
				markers,
				markerOriginalLatLngs
			} = this.#host;
			if (mapInstance) {
				mapInstance.off('zoomend', this.#onZoomEnd);
				mapInstance.off('moveend', this.#onTransitionEnd);
			}
			this.clearClusterMarkers();

			// Restore all individual markers on the map at their original positions
			markers.forEach((marker, id) => {
				this.#takeOverPosition(id);
				const el = marker.getElement();
				if (el) {
					el.style.transition = '';
				}
				const orig = markerOriginalLatLngs.get(id);
				if (orig) {
					marker.setLngLat(toLngLat(orig));
				}
				if (mapInstance && !this.#isOnMap(id)) {
					marker.addTo(mapInstance);
					this.#markersOnMap.add(id);
				}
			});
		}

		/**
		 * Releases resources and removes event listeners without restoring markers
		 * to the map. Called by CheckInMapServiceMapLibre.destroy() before clearMarkers().
		 */
		dispose() {
			this.cancelPendingAnimations();
			clearTimeout(this.#transitionSafetyTimeout);
			this.#transitionInProgress = false;
			this.#enabled = false;
			const {
				mapInstance
			} = this.#host;
			if (mapInstance) {
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
		suppressNextAnimation() {
			this.#suppressNextClusterAnimation = true;
		}

		/**
		 * Starts a fitBounds-driven transition: hides all markers until the zoom
		 * animation completes, then re-renders clusters without animation.
		 */
		beginTransition() {
			if (this.#transitionInProgress) {
				clearTimeout(this.#transitionSafetyTimeout);
				const {
					mapInstance
				} = this.#host;
				if (mapInstance) {
					mapInstance.off('moveend', this.#onTransitionEnd);
				}
			}
			this.cancelPendingAnimations();
			const {
				mapInstance,
				markers
			} = this.#host;
			this.#clusterMarkersByKey.forEach(({
				marker
			}) => {
				marker.remove();
			});
			this.#clusterMarkersByKey.clear();
			markers.forEach((marker, id) => {
				if (this.#isOnMap(id)) {
					this.#takeOverPosition(id);
					const el = marker.getElement();
					if (el) {
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
		cancelTransition() {
			this.#suppressNextClusterAnimation = false;
			if (this.#transitionInProgress) {
				this.#endTransition();
			}
		}

		/**
		 * Recalculates clusters and updates the map accordingly.
		 *
		 * @param {boolean} [forceNoAnimation=false]
		 */
		updateClusters(forceNoAnimation = false) {
			const {
				mapInstance
			} = this.#host;
			if (!this.#enabled || !mapInstance || this.#transitionInProgress) {
				return;
			}
			this.cancelPendingAnimations();
			this.#snapAllMarkersToPosition();
			const clusters = this.#calculateClusters();
			const animated = this.#options.animated !== false && !forceNoAnimation;
			const dissolvedCenters = this.#removeDissolvedClusters(clusters);
			clusters.forEach(cluster => {
				if (cluster.members.length === 1) {
					this.#applyIndividualMarker(cluster, dissolvedCenters, animated);
				} else {
					this.#applyCluster(cluster, dissolvedCenters, animated);
				}
			});
			if (this.#options.routeMarkerIds?.length) {
				this.#updateRoutePolyline(clusters);
			}
		}
		setClusterIcon(markerIds, iconConfig) {
			const key = [...markerIds].sort().join(',');
			const entry = this.#clusterMarkersByKey.get(key);
			if (!entry) {
				return;
			}

			// MapLibre markers have no setIcon(); mutate the existing element in place
			// (public getElement()) so the marker's positioning/anchor handling stays
			// intact. Mirrors Leaflet's marker.setIcon() + testId reset.
			const el = entry.marker.getElement();
			if (!el) {
				return;
			}
			this.#host.applyIconToElement(el, iconConfig);
			const testId = this.#getClusterTestId(markerIds);
			el.setAttribute('testId', testId);
			el.setAttribute('data-testid', testId);
		}
		cancelPendingAnimations() {
			this.#pendingAnimationTimeouts.forEach(id => clearTimeout(id));
			this.#pendingAnimationTimeouts = [];
		}
		clearClusterMarkers() {
			this.#clusterMarkersByKey.forEach(({
				marker
			}) => {
				marker.remove();
			});
			this.#clusterMarkersByKey.clear();
			this.#prevMarkerClusterKey.clear();
		}
		clearPrevMarkerKeys() {
			this.#prevMarkerClusterKey.clear();
			this.#markersOnMap.clear();
		}
		deletePrevMarkerKey(id) {
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
		markAdded(id) {
			this.#markersOnMap.add(id);
		}

		/**
		 * Notifies the manager that the host removed/replaced an individual marker.
		 * @param {String|Number} id
		 */
		markRemoved(id) {
			this.#markersOnMap.delete(id);
		}

		/**
		 * Whether this marker stands on the map on its own right now (as opposed to being folded into a
		 * cluster, or not drawn at all). The host asks before walking a marker to a new coordinate: only
		 * a marker of its own is there to walk, and while it walks the snap below leaves it alone.
		 * @param {String|Number} id
		 * @returns {Boolean}
		 */
		isMarkerOnMap(id) {
			return this.#isOnMap(id);
		}

		// Takes the position of a marker back from a running move, right before placing it. Every path
		// that writes a marker position from here goes through this: the position has one owner at a
		// time, and two of them would tug the marker between the cluster layout and the move.
		#takeOverPosition(id) {
			this.#host.cancelMarkerAnimation(id);
		}

		// Private: on-map tracking

		#isOnMap(id) {
			return this.#markersOnMap.has(id);
		}

		// Private: transition & zoom

		#onZoomEnd = () => {
			const suppress = this.#suppressNextClusterAnimation;
			this.#suppressNextClusterAnimation = false;
			if (this.#transitionInProgress) {
				clearTimeout(this.#transitionSafetyTimeout);
				this.#transitionInProgress = false;
				const {
					mapInstance
				} = this.#host;
				if (mapInstance) {
					mapInstance.off('moveend', this.#onTransitionEnd);
				}
			}
			this.updateClusters(suppress);
		};
		#onTransitionEnd = () => {
			this.#endTransition();
		};
		#endTransition() {
			if (!this.#transitionInProgress) {
				return;
			}
			clearTimeout(this.#transitionSafetyTimeout);
			this.#transitionInProgress = false;
			const {
				mapInstance
			} = this.#host;
			if (mapInstance) {
				mapInstance.off('moveend', this.#onTransitionEnd);
			}
			this.updateClusters(true);
		}

		// Private: cluster rendering

		// Computes a simplified polyline through cluster centers in route order and
		// updates the stored route polyline layers via the host.
		#updateRoutePolyline(clusters) {
			const {
				routeMarkerIds,
				routeLayerIds
			} = this.#options;
			if (!routeLayerIds?.length) {
				return;
			}
			const clusterByMarkerId = new Map();
			clusters.forEach(cluster => {
				cluster.ids.forEach(id => clusterByMarkerId.set(id, cluster));
			});
			const path = [];
			let lastClusterKey;
			routeMarkerIds.forEach(markerId => {
				const cluster = clusterByMarkerId.get(markerId);
				if (!cluster) {
					return;
				}
				if (cluster.key === lastClusterKey) {
					return; // consecutive markers in same cluster -> skip
				}
				lastClusterKey = cluster.key;
				path.push(cluster.center); // [lat, lng]
			});
			routeLayerIds.forEach(layerId => {
				// Skip a layer mid-grow: the host is animating its geometry, and an instant polyline rewrite
				// here would fight the grow frames. The next updateClusters restores the clustered path.
				if (this.#host.isLayerAnimating && this.#host.isLayerAnimating(layerId)) {
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
		#snapAllMarkersToPosition() {
			const {
				markers,
				markerOriginalLatLngs
			} = this.#host;
			markers.forEach((marker, id) => {
				if (!this.#isOnMap(id) || this.#host.isMarkerAnimating(id)) {
					return;
				}
				const el = marker.getElement();
				const hasTransition = el && el.style.transition !== '';
				const orig = markerOriginalLatLngs.get(id);
				const needsSnap = orig && !this.#lngLatEquals(marker.getLngLat(), orig);
				if (!hasTransition && !needsSnap) {
					return;
				}
				if (hasTransition) {
					this.#clearElementTransition(el);
				}
				if (needsSnap) {
					marker.setLngLat(toLngLat(orig));
				}
			});
			this.#clusterMarkersByKey.forEach(({
				marker,
				center
			}) => {
				const el = marker.getElement();
				const hasTransition = el && el.style.transition !== '';
				const needsSnap = !this.#lngLatEquals(marker.getLngLat(), center);
				if (!hasTransition && !needsSnap) {
					return;
				}
				if (hasTransition) {
					this.#clearElementTransition(el);
				}
				if (needsSnap) {
					marker.setLngLat(toLngLat(center));
				}
			});
		}

		// Removes cluster markers that no longer exist in the new layout from the map.
		// Returns a map of dissolved cluster keys -> their last known centers ([lat,lng]),
		// used to animate members flying out from where their cluster was.
		#removeDissolvedClusters(clusters) {
			const newClustersByKey = new Map();
			clusters.forEach(cluster => {
				if (cluster.members.length > 1) {
					newClustersByKey.set(cluster.key, cluster);
				}
			});
			const dissolvedCenters = new Map();
			this.#clusterMarkersByKey.forEach(({
				marker,
				center
			}, key) => {
				if (!newClustersByKey.has(key)) {
					marker.remove();
					dissolvedCenters.set(key, center);
					this.#clusterMarkersByKey.delete(key);
				}
			});
			return dissolvedCenters;
		}

		// Places a single marker on the map, animating it from its former cluster center if applicable.
		#applyIndividualMarker(cluster, dissolvedCenters, animated) {
			const [{
				id,
				marker
			}] = cluster.members;
			const prevKey = this.#prevMarkerClusterKey.get(id);
			const {
				markerOriginalLatLngs
			} = this.#host;
			if (animated && prevKey && dissolvedCenters.has(prevKey)) {
				// Was in a dissolved cluster -> fly from cluster center to actual position
				this.#animateMarkerFromCluster(marker, id, dissolvedCenters.get(prevKey));
			} else if (!this.#isOnMap(id)) {
				// Snap to original position before adding - the marker's LngLat may have been
				// moved to a cluster center during a previous animation and never reset.
				this.#takeOverPosition(id);
				const orig = markerOriginalLatLngs.get(id);
				if (orig) {
					marker.setLngLat(toLngLat(orig));
				}
				this.#addMarkerToMap(marker, id);
			}
			this.#prevMarkerClusterKey.set(id, null);
		}

		// Animates a marker flying from a dissolved cluster center to its original position.
		#animateMarkerFromCluster(marker, id, fromLatLng) {
			const {
				markerOriginalLatLngs
			} = this.#host;
			this.#takeOverPosition(id);
			marker.setLngLat(toLngLat(fromLatLng));
			this.#addMarkerToMap(marker, id);
			this.#scheduleAnimation(() => {
				const el = marker.getElement();
				if (el) {
					el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
				}
				const orig = markerOriginalLatLngs.get(id);
				if (orig) {
					marker.setLngLat(toLngLat(orig));
				}
				this.#scheduleTransitionCleanup(marker);
			});
		}

		// Applies a cluster to the map: skips if stable, animates members in if they were individual,
		// or slides the cluster marker in from a dissolved parent.
		#applyCluster(cluster, dissolvedCenters, animated) {
			const {
				key
			} = cluster;
			if (this.#clusterMarkersByKey.has(key)) {
				// Stable cluster: marker is already on the map - just keep tracking up to date
				cluster.ids.forEach(id => this.#prevMarkerClusterKey.set(id, key));
				return;
			}
			const anyWasIndividual = this.#animateMarkersIntoCluster(cluster, animated);
			if (anyWasIndividual) {
				// Wait for members to finish flying in before replacing them with the cluster marker.
				// Extra buffer accounts for the rAF delay before the CSS transition starts.
				const t = setTimeout(() => this.#showCluster(cluster, key, animated), this.#animationDuration + 50);
				this.#pendingAnimationTimeouts.push(t);
			} else {
				this.#showOrSlideInCluster(cluster, key, dissolvedCenters, animated);
			}
		}

		// Starts CSS animations for individual markers flying towards the cluster center.
		// Returns true if at least one visible individual marker was animated.
		#animateMarkersIntoCluster(cluster, animated) {
			let anyWasIndividual = false;
			cluster.members.forEach(({
				id,
				marker
			}) => {
				const prevKey = this.#prevMarkerClusterKey.get(id);
				if (animated && !prevKey && this.#isOnMap(id)) {
					// Was individual and visible -> animate towards cluster center
					anyWasIndividual = true;
					this.#takeOverPosition(id);
					this.#scheduleAnimation(() => {
						const el = marker.getElement();
						if (el) {
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
		#showCluster(cluster, key, animated) {
			const {
				mapInstance
			} = this.#host;
			cluster.members.forEach(({
				id,
				marker
			}) => {
				if (this.#isOnMap(id)) {
					this.#takeOverPosition(id);
					this.#clearElementTransition(marker.getElement());
					marker.remove();
					this.#markersOnMap.delete(id);
				}
			});
			if (!mapInstance) {
				return;
			}
			const clusterMarker = this.#createClusterMarker(cluster, !animated);
			clusterMarker.setLngLat(toLngLat(cluster.center));
			clusterMarker.addTo(mapInstance);
			this.#commitCluster(cluster, key, clusterMarker, cluster.center);
		}

		// Shows or slides in a new cluster that has no individual members to animate in.
		// Slides from the dissolved parent center when one exists; otherwise appears instantly.
		#showOrSlideInCluster(cluster, key, dissolvedCenters, animated) {
			const parentCenter = animated ? this.#findPrimaryDissolvedCenter(cluster.ids, dissolvedCenters) : null;
			if (parentCenter) {
				this.#slideInCluster(cluster, key, parentCenter);
			} else {
				this.#showCluster(cluster, key, animated);
			}
		}

		// Creates the cluster marker at a dissolved parent center, then slides it to the actual center.
		#slideInCluster(cluster, key, fromLatLng) {
			const {
				mapInstance
			} = this.#host;
			cluster.members.forEach(({
				id,
				marker
			}) => {
				if (this.#isOnMap(id)) {
					this.#takeOverPosition(id);
					marker.remove();
					this.#markersOnMap.delete(id);
				}
			});
			if (!mapInstance) {
				return;
			}
			const clusterMarker = this.#createClusterMarker(cluster, true);
			clusterMarker.setLngLat(toLngLat(fromLatLng));
			clusterMarker.addTo(mapInstance);
			this.#commitCluster(cluster, key, clusterMarker, cluster.center);
			this.#scheduleAnimation(() => {
				const el = clusterMarker.getElement();
				if (el) {
					el.style.transition = `transform ${this.#animationDuration}ms ease-out`;
				}
				clusterMarker.setLngLat(toLngLat(cluster.center));
				this.#scheduleTransitionCleanup(clusterMarker);
			});
		}

		// Registers a cluster marker in the tracking maps once it is on the map.
		#commitCluster(cluster, key, clusterMarker, center) {
			this.#clusterMarkersByKey.set(key, {
				marker: clusterMarker,
				center
			});
			cluster.ids.forEach(id => this.#prevMarkerClusterKey.set(id, key));
		}
		#addMarkerToMap(marker, id) {
			const {
				mapInstance
			} = this.#host;
			if (!mapInstance) {
				return;
			}
			marker.addTo(mapInstance);
			this.#markersOnMap.add(id);
		}

		// Runs a callback after two animation frames, guarding against a destroyed map instance.
		// The double-rAF ensures the browser has committed the DOM state before the callback runs.
		#scheduleAnimation(callback) {
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (!this.#host.mapInstance) {
						return;
					}
					callback();
				});
			});
		}

		// Schedules removal of a CSS transition from a marker element after the animation completes.
		#scheduleTransitionCleanup(marker) {
			const t = setTimeout(() => {
				const el = marker.getElement();
				if (el) {
					el.style.transition = '';
				}
			}, this.#animationDuration);
			this.#pendingAnimationTimeouts.push(t);
		}
		#clearElementTransition(el) {
			if (el) {
				el.style.transition = '';
			}
		}
		#findPrimaryDissolvedCenter(memberIds, dissolvedCenters) {
			const counts = new Map();
			memberIds.forEach(id => {
				const prevKey = this.#prevMarkerClusterKey.get(id);
				if (prevKey && dissolvedCenters.has(prevKey)) {
					counts.set(prevKey, (counts.get(prevKey) || 0) + 1);
				}
			});
			let bestKey = null;
			let bestCount = 0;
			counts.forEach((count, key) => {
				if (count > bestCount) {
					bestCount = count;
					bestKey = key;
				}
			});
			return bestKey ? dissolvedCenters.get(bestKey) : null;
		}
		#getClusterKey(ids) {
			return [...ids].sort().join(',');
		}
		#getClusterTestId(ids) {
			const MAX_IDS = 20;
			const isRouteMode = Boolean(this.#options.routeMarkerIds?.length);
			if (isRouteMode) {
				const employeeId = parseInt(ids[0].replace(CHECK_IN_MARKER_PREFIX, ''), 10);
				// A check-in id suffix is numeric except for the track ends (`-track-start` / `-track-end`),
				// so the suffix is kept as a string: parsing it would turn those ends into NaN.
				const checkInIds = ids.map(id => {
					const p = id.split('-');
					return p[p.length - 1];
				}).sort((a, b) => this.#compareIdSuffixes(a, b)).slice(0, MAX_IDS);
				return `cluster-${employeeId}-${checkInIds.join('-')}`;
			}
			const employeeIds = ids.map(id => {
				const p = id.split('-');
				return parseInt(p[p.length - 1], 10);
			}).sort((a, b) => a - b).slice(0, MAX_IDS);
			return `cluster-${employeeIds.join('-')}`;
		}

		// Numeric suffixes go first, ordered by value; named ones (track ends) follow in a stable
		// alphabetical order, so the same cluster always yields the same testId.
		#compareIdSuffixes(a, b) {
			const numA = parseInt(a, 10);
			const numB = parseInt(b, 10);
			const isNumberA = !Number.isNaN(numA);
			const isNumberB = !Number.isNaN(numB);
			if (isNumberA && isNumberB) {
				return numA - numB;
			}
			if (isNumberA !== isNumberB) {
				return isNumberA ? -1 : 1;
			}
			return a.localeCompare(b);
		}

		// Private: projection helpers

		// Pixel point ({x, y}) of a [lat, lng] at the current zoom. Replaces
		// Leaflet's latLngToLayerPoint - only relative distances are used so the
		// container/layer offset is irrelevant.
		#projectCurrent(latLng) {
			const p = this.#host.mapInstance.project(toLngLat(latLng));
			return {
				x: p.x,
				y: p.y
			};
		}

		// Absolute world-pixel point of a [lat, lng] at an arbitrary zoom level.
		// Replaces Leaflet's mapInstance.project(latLng, zoom). Uses the standard
		// Web-Mercator tile pixel formula (tileSize 512 - MapLibre's world size).
		#projectAtZoom(latLng, zoom) {
			const [lat, lng] = latLng;
			const scale = 512 * 2 ** zoom;
			const x = (lng + 180) / 360 * scale;
			const sinLat = Math.sin(lat * Math.PI / 180);
			const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
			return {
				x,
				y
			};
		}
		#pixelDistance(a, b) {
			return Math.hypot(a.x - b.x, a.y - b.y);
		}
		#lngLatEquals(lngLat, latLng) {
			// lngLat is a MapLibre LngLat {lng, lat}; latLng is host [lat, lng].
			const EPS = 1e-9;
			return Math.abs(lngLat.lat - latLng[0]) < EPS && Math.abs(lngLat.lng - latLng[1]) < EPS;
		}

		// Private: cluster calculation

		#calculateClusters() {
			const routeMarkerIds = this.#options.routeMarkerIds;
			if (routeMarkerIds?.length) {
				return this.#calculateRouteClusters(routeMarkerIds);
			}
			const {
				markers,
				markerOriginalLatLngs
			} = this.#host;
			const maxRadius = this.#options.maxClusterRadius ?? 80;
			const entries = [...markers.entries()];
			const assigned = new Set();
			const clusters = [];
			entries.forEach(([id, marker]) => {
				if (assigned.has(id)) {
					return;
				}
				assigned.add(id);

				// Always use original LatLng for distance calculations so that
				// in-progress animations don't skew the cluster grouping.
				const origLatLng = markerOriginalLatLngs.get(id) || this.#lngLatToArray(marker.getLngLat());
				const seedPoint = this.#projectCurrent(origLatLng);
				const members = [{
					id,
					marker
				}];
				const clusterLatLngs = [origLatLng];
				entries.forEach(([otherId, otherMarker]) => {
					if (assigned.has(otherId)) {
						return;
					}
					const otherOrigLatLng = markerOriginalLatLngs.get(otherId) || this.#lngLatToArray(otherMarker.getLngLat());
					const otherPoint = this.#projectCurrent(otherOrigLatLng);
					const dist = this.#pixelDistance(seedPoint, otherPoint);
					if (dist <= maxRadius) {
						assigned.add(otherId);
						members.push({
							id: otherId,
							marker: otherMarker
						});
						clusterLatLngs.push(otherOrigLatLng);
					}
				});
				const lat = clusterLatLngs.reduce((sum, ll) => sum + ll[0], 0) / clusterLatLngs.length;
				const lng = clusterLatLngs.reduce((sum, ll) => sum + ll[1], 0) / clusterLatLngs.length;
				const ids = members.map(member => member.id);
				clusters.push({
					id: `cluster-${id}`,
					ids,
					key: this.#getClusterKey(ids),
					members,
					center: [lat, lng]
				});
			});
			return clusters;
		}
		#lngLatToArray(lngLat) {
			return [lngLat.lat, lngLat.lng];
		}

		// Route-aware clustering: only consecutive markers can be merged, preserving
		// trajectory shape. Two passes: pass 1 skips the first/last markers so interior
		// points cluster first; pass 2 allows the endpoints to merge if still close enough.
		#calculateRouteClusters(routeMarkerIds) {
			const {
				markers
			} = this.#host;
			const filteredIds = routeMarkerIds.filter(id => markers.has(id));
			if (filteredIds.length === 0) {
				return [];
			}
			const firstId = filteredIds[0];
			const lastId = filteredIds[filteredIds.length - 1];
			const maxRadius = this.#options.maxClusterRadius ?? 30;
			const maxSize = this.#getRouteMaxClusterSize();
			const pixelCoords = this.#buildPixelCoordsMap(filteredIds);
			const groups = this.#groupCoLocatedRouteMarkers(filteredIds, maxRadius);
			this.#mergeRouteGroups(groups, {
				firstId,
				lastId,
				maxRadius,
				maxSize,
				pixelCoords
			}, true);
			this.#mergeRouteGroups(groups, {
				firstId,
				lastId,
				maxRadius,
				maxSize,
				pixelCoords
			}, false);
			return groups.map(groupIds => this.#buildRouteCluster(groupIds, firstId, lastId)).filter(Boolean);
		}

		// At each zoom level below the initial trajectory zoom, double the allowed cluster size
		// so that groups formed at a higher zoom can merge when zooming out.
		#getRouteMaxClusterSize() {
			const {
				mapInstance,
				fitBoundsMaxZoom
			} = this.#host;
			const baseSize = this.#options.maxRouteClusterSize ?? 6;
			const zoom = mapInstance.getZoom();
			return Math.round(baseSize * 2 ** Math.max(0, fitBoundsMaxZoom - 4 - zoom));
		}

		// Precomputes pixel coordinates for all marker IDs at the current zoom level.
		#buildPixelCoordsMap(ids) {
			const {
				markerOriginalLatLngs
			} = this.#host;
			const pixelCoords = new Map();
			ids.forEach(id => {
				const ll = markerOriginalLatLngs.get(id);
				if (ll) {
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
		#groupCoLocatedRouteMarkers(ids, maxRadius) {
			const {
				markerOriginalLatLngs,
				fitBoundsMaxZoom
			} = this.#host;
			const groups = [];
			let currentGroup = null;
			let anchorPoint = null;
			ids.forEach(id => {
				const ll = markerOriginalLatLngs.get(id);
				const point = ll ? this.#projectAtZoom(ll, fitBoundsMaxZoom) : null;
				const isColocated = currentGroup && point && anchorPoint && this.#pixelDistance(anchorPoint, point) <= maxRadius;
				if (isColocated) {
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
		#getGroupCentroidDist(groupA, groupB, pixelCoords) {
			const getCentroid = group => {
				let xSum = 0;
				let ySum = 0;
				let count = 0;
				group.forEach(id => {
					const p = pixelCoords.get(id);
					if (p) {
						xSum += p.x;
						ySum += p.y;
						count++;
					}
				});
				return count > 0 ? {
					x: xSum / count,
					y: ySum / count
				} : null;
			};
			const cA = getCentroid(groupA);
			const cB = getCentroid(groupB);
			if (!cA || !cB) {
				return Infinity;
			}
			return Math.hypot(cA.x - cB.x, cA.y - cB.y);
		}

		// Merges adjacent route groups that are within maxRadius of each other.
		// When skipEndpoints is true, groups containing the first or last marker are skipped.
		#mergeRouteGroups(groups, {
			firstId,
			lastId,
			maxRadius,
			maxSize,
			pixelCoords
		}, skipEndpoints) {
			const isEndpointGroup = group => group[0] === firstId || group[group.length - 1] === lastId;
			let changed = true;
			while (changed && groups.length > 1) {
				changed = false;
				for (let i = 0; i < groups.length - 1; i++) {
					const gA = groups[i];
					const gB = groups[i + 1];
					if (skipEndpoints && (isEndpointGroup(gA) || isEndpointGroup(gB))) {
						continue;
					}
					if (gA.length + gB.length > maxSize) {
						continue;
					}
					if (this.#getGroupCentroidDist(gA, gB, pixelCoords) <= maxRadius) {
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
		#buildRouteCluster(groupIds, firstId, lastId) {
			const {
				markers,
				markerOriginalLatLngs
			} = this.#host;
			const members = groupIds.map(id => ({
				id,
				marker: markers.get(id)
			})).filter(({
				marker
			}) => Boolean(marker));
			const ids = members.map(member => member.id);
			const latLngs = ids.map(id => markerOriginalLatLngs.get(id)).filter(Boolean);
			const center = this.#getRouteClusterCenter(ids, firstId, lastId, latLngs);
			if (center === null) {
				return null;
			}
			return {
				id: `cluster-${ids[0]}`,
				ids,
				key: this.#getClusterKey(ids),
				members,
				center
			};
		}

		// Computes the display center for a route cluster.
		// Endpoint-only clusters are anchored to the endpoint's exact position;
		// interior clusters and full-route clusters use the centroid.
		#getRouteClusterCenter(groupIds, firstId, lastId, latLngs) {
			const hasFirst = groupIds[0] === firstId;
			const hasLast = groupIds[groupIds.length - 1] === lastId;
			const isSingleEndpoint = (hasFirst || hasLast) && !(hasFirst && hasLast);
			if (isSingleEndpoint) {
				const anchorId = hasFirst ? firstId : lastId;
				const ll = this.#host.markerOriginalLatLngs.get(anchorId);
				return [ll[0], ll[1]];
			}
			if (latLngs.length === 0) {
				return null;
			}
			const lat = latLngs.reduce((s, ll) => s + ll[0], 0) / latLngs.length;
			const lng = latLngs.reduce((s, ll) => s + ll[1], 0) / latLngs.length;
			return [lat, lng];
		}

		// Private: cluster marker creation

		#createClusterMarker(cluster, skipAnimation = false) {
			const {
				markerConfigs
			} = this.#host;
			const clusterMarkerConfigs = cluster.ids.map(id => markerConfigs.get(id) ?? null);
			const animated = !skipAnimation && this.#options.animated !== false;
			const iconConfig = this.#getClusterIconConfig(clusterMarkerConfigs, animated);
			const el = this.#host.createDivIcon(iconConfig.html, iconConfig.className, iconConfig.iconSize, iconConfig.iconAnchor);
			const zIndexes = clusterMarkerConfigs.filter(Boolean).map(cfg => cfg.zIndex).filter(index => index !== null && index !== undefined);
			const avgZIndex = zIndexes.length > 0 ? zIndexes.reduce((a, b) => a + b, 0) / zIndexes.length : null;
			if (avgZIndex !== null) {
				el.style.zIndex = String(Math.round(avgZIndex * 10000));
			}
			const testId = this.#getClusterTestId(cluster.ids);
			el.setAttribute('testId', testId);
			el.setAttribute('data-testid', testId);
			const marker = new location_osm_maplibre.maplibregl.Marker({
				element: el,
				anchor: this.#host.anchorFromIcon(iconConfig)
			});
			el.addEventListener('click', () => this.#onClusterClick(cluster));
			return marker;
		}
		#onClusterClick(cluster) {
			const {
				mapInstance,
				fitBoundsMaxZoom,
				fitBoundsPadding
			} = this.#host;
			const origLatLngs = cluster.ids.map(id => this.#host.markerOriginalLatLngs.get(id)).filter(Boolean);
			if (origLatLngs.length === 0) {
				return;
			}
			const maxRadius = this.#options.maxClusterRadius ?? 80;
			if (!clusterWouldSplitAtZoom(origLatLngs, fitBoundsMaxZoom, maxRadius)) {
				this.#host.sendEvent(location_core.CheckInMapEventType.CLUSTER_CLICKED, {
					markerIds: cluster.ids,
					coords: cluster.center
				});
				return;
			}
			const clusterBounds = new location_osm_maplibre.maplibregl.LngLatBounds();
			origLatLngs.forEach(ll => clusterBounds.extend(toLngLat(ll)));
			const padding = this.#host.normalizePadding(fitBoundsPadding);
			mapInstance.fitBounds(clusterBounds, {
				padding,
				maxZoom: fitBoundsMaxZoom,
				animate: true
			});
		}
		#getClusterIconConfig(markerConfigs, animated = true) {
			if (typeof this.#options.clusterIconFactory === 'function') {
				return this.#options.clusterIconFactory(markerConfigs, animated);
			}
			console.warn('ClusteringManagerMapLibre: clusterIconFactory is not set in options');
			return {
				html: `<div class="map-cluster-icon"><span>${markerConfigs.length}</span></div>`,
				className: 'map-cluster-marker',
				iconSize: [81, 81],
				iconAnchor: [40, 40]
			};
		}
	}

	// Single "motion language" for all camera moves. Tune here, not in logic.
	//
	// All camera commands in the MapLibre engine are animated for parity with the
	// product NFR ("all camera moves are animated"). Durations/easing live here so
	// the whole engine speaks one consistent motion language.
	const ANIMATION_CONFIG = {
		easeTo: {
			duration: 600,
			easing: t => t * (2 - t)
		},
		fitBounds: {
			duration: 700},
		// Grow-segment: a line layer "drawing on" a freshly appended leg (setLayerPath animated). Shares
		// the ease-out feel and timing of easeTo, but is its own entry so the two can be tuned apart.
		growSegment: {
			duration: 600
		}};

	// Staleness grey. After the legacy single-transition gradient was removed, this is used only for the
	// `icon-color` of a non-fresh direction arrow (check-in-map-service-maplibre.js). It is latent under the
	// team-view default (arrows are not drawn there) and live in the single/open route view. The same grey is
	// mirrored, across bundle boundaries, by location.check-in `--ci-grey` / checkin-tokens.CI_GREY (the stale
	// marker colour). Route lines do NOT use grey: they fade to a translucent copy of the employee colour via
	// alpha (stafftrackmobile route-line-freshness). Keep the copies in sync when the value changes.
	const LINE_GRADIENT_START_COLOR = '#97a2b2';

	/**
	 * Builds a MapLibre `line-gradient` interpolate expression from a ready-made list of `[progress, color]`
	 * stops (ascending 0..1). The caller (route freshness) computes the fade by time and hands the finished
	 * stops over verbatim. Stop colours may be `rgba(...)` (the stale end carries a reduced alpha); MapLibre's
	 * `interpolate` blends the alpha channel too, so the colours are passed through as-is with no special
	 * handling.
	 * @param {Array<[number, string]>} stops
	 * @returns {Array}
	 */
	function buildLineGradientExpression(stops) {
		const expression = ['interpolate', ['linear'], ['line-progress']];
		stops.forEach(([progress, color]) => {
			expression.push(progress, color);
		});
		return expression;
	}

	const OSM_SOURCE_ID = 'osm-tiles';
	const OSM_LAYER_ID = 'osm-tiles';

	// Raster paint of the light basemap: the MapLibre defaults, i.e. the tiles as served.
	const LIGHT_TILE_PAINT = {
		'raster-brightness-min': 0,
		'raster-brightness-max': 1,
		'raster-contrast': 0
	};

	// Raster paint of the dark basemap. There is no dark tileset: the Leaflet engine darkened the very
	// same light tiles with a CSS filter on its tile pane - invert(1) hue-rotate(127deg) brightness(1.59)
	// contrast(0.93) saturate(0) - and these are its raster equivalents. raster-hue-rotate is left out on
	// purpose, not by omission: desaturating by luminance is invariant under a hue rotation, so the
	// trailing saturate(0) erases that step. MapLibre has no invert step either; it applies saturation,
	// then contrast, then remaps [0, 1] onto [brightness-min, brightness-max], so the inversion is the
	// reversed pair (min above max) with the brightness boost folded into the same remap. The values give
	// the transfer curve out = 1.525 - 1.5 * in: white roads go near black, and everything below 0.35 -
	// labels - clips to white. That curve stays within 0.01 of the CSS filter on the grey axis only; on
	// saturated colours the two still differ by up to ~0.1 (greens read lighter here), because
	// raster-saturation averages the channels while saturate(0) weights them by luminance. No raster
	// property closes that gap, so it is not something the numbers below can be tuned out of.
	// Paint of the tile layer only, which is the boundary the Leaflet tile-pane filter drew: route,
	// point and arrow layers share the WebGL canvas but keep their own colours. Meant for tuning on a
	// device against the Leaflet engine.
	const DARK_TILE_PAINT = {
		'raster-brightness-min': 1,
		'raster-brightness-max': 0.55,
		'raster-contrast': 0.7
	};
	const TILE_SATURATION_GRAY = -1;
	const TILE_SATURATION_COLOR = 0;
	const ARROW_ICON_ID = 'route-direction-arrow';
	const ARROW_ICON_SIZE_PX = 24;
	// The glyph is rasterised at ARROW_ICON_SIZE_PX times this ratio and registered with a matching
	// `pixelRatio`, so MapLibre draws it at its nominal size instead of stretching the raster one to one.
	const ARROW_ICON_PIXEL_RATIO = 2;
	// Glyph geometry in units of the nominal icon size: the apex path vertex sits this far below the
	// icon's top edge, the chevron's open ends this far below it, stroked this wide.
	const ARROW_ICON_APEX_RATIO = 0.18;
	const ARROW_ICON_OPEN_END_RATIO = 0.55;
	const ARROW_ICON_STROKE_RATIO = 0.25;
	// A share of the side rather than a fixed width: a fixed one thins the chevron out as the side grows,
	// and the arrow then reads as a different glyph at the same nominal size.
	const ARROW_ICON_STROKE_WIDTH_PX = ARROW_ICON_SIZE_PX * ARROW_ICON_STROKE_RATIO;
	// Top edge of the icon down to the painted apex: the round line join carries the stroke half a width
	// above the path vertex, and it is that paint, not the vertex, that reaches the pin. icon-anchor
	// 'top' pins the edge, so this inset comes off the gap below.
	const ARROW_ICON_APEX_INSET_PX = ARROW_ICON_SIZE_PX * ARROW_ICON_APEX_RATIO - ARROW_ICON_STROKE_WIDTH_PX / 2;
	// Fixed backward pixel gap from the arrow apex to the arrival marker, applied along
	// the bearing (icon-offset y in the rotated icon frame). It keeps the apex just
	// before the marker without overlapping the pin. Zoom-independent by construction:
	// icon-size is a constant, so the gap stays the same pixel distance at every zoom.
	const ARROW_ICON_MARKER_GAP_PX = 12;

	// Direction arrows appear only from this zoom in - the same close-zoom threshold at which stack markers
	// switch on their "xN" counter, so arrows and that counter cross the threshold together. Wired as the arrow
	// symbol layer's native maplibre `minzoom` (the layer draws only at zoom >= minzoom), so the renderer
	// hides/shows it on zoom with no JS listener. Cross-bundle mirror of location.check-in
	// checkin-tokens.CI_XN_ZOOM_THRESHOLD; osm has no dependency on the check-in bundle, so the value is
	// duplicated here by hand - keep the two in sync.
	const ARROW_MIN_ZOOM = 15;

	// How far the arrow reaches BACK from the coordinate it is pinned to, in CSS px: the offset that pushes
	// it behind the pin, plus the painted body below the icon's top edge (the round caps at the chevron's
	// open ends carry the stroke half a width past them). This is the length that has to lie on the drawn
	// edge the arrow points along, and it is a length in PIXELS - icon-size is constant, so the arrow covers
	// twice as much ground on every zoom step out.
	const ARROW_TAIL_PX = ARROW_ICON_MARKER_GAP_PX - ARROW_ICON_APEX_INSET_PX + (ARROW_ICON_SIZE_PX * ARROW_ICON_OPEN_END_RATIO + ARROW_ICON_STROKE_WIDTH_PX / 2);

	// Ground metres one CSS pixel spans at zoom 0 on the equator - on the 512 px world of MapLibre GL
	// (Transform.tileSize = 512, worldSize = 512 * 2^zoom), not the classic 256 px tile pyramid: the wrong
	// half doubles every threshold and hides arrows that fit whole. At zoom z and latitude f a pixel spans
	// this * cos(f) / 2^z of them - the cosine is why the arrows carry their edge already divided by it
	// (route-arrows edgeMercatorMeters), which leaves one threshold per zoom instead of one per zoom and
	// parallel.
	const MERCATOR_METERS_PER_PIXEL_Z0 = 78_271.51696;

	// The camera stops here (the map is created with this maxZoom), so its step answers for everything past it.
	const ARROW_FIT_TOP_ZOOM = 18;

	// What an arrow that carries no edge measure is taken to have: a route drawn by an older host bundle
	// carries none, and such an arrow keeps being drawn. The filter only ever hides one that provably does
	// not fit.
	const ARROW_FIT_UNKNOWN_EDGE_METERS = Number.MAX_SAFE_INTEGER;

	// The shortest edge an arrow lies on whole at this zoom, in the units the arrows carry.
	function arrowFitEdgeMeters(zoom) {
		return ARROW_TAIL_PX * MERCATOR_METERS_PER_PIXEL_Z0 / 2 ** zoom;
	}

	/**
	 * Opacity of the direction arrows, hiding those that would not fit on the edge they point along.
	 *
	 * An arrow is a fixed pixel length while its edge is a fixed ground length, so which of the two is
	 * longer is a question about the current zoom and nothing else - at the zoom a whole tracked day opens
	 * on, an arrow covers some 67 m of ground in the mid latitudes and most of them overshoot their edge
	 * severalfold. The renderer is
	 * the one that knows the zoom and changes it on every pinch, which is why the answer is an expression
	 * and not a threshold applied upstream: no zoom listener, no layer rebuilt, arrows simply appearing as
	 * the map is zoomed in.
	 *
	 * `["zoom"]` is only allowed as the input of a TOP-LEVEL step or interpolate (the style spec rejects it
	 * anywhere else), so the zoom cannot be compared against a property directly. Hence a step over whole
	 * zooms whose every branch compares the edge against that zoom's threshold. Inside a step the scale is
	 * finer than its lower bound, so each threshold is slightly stricter than the zoom it covers actually
	 * needs: an arrow can be held back until the next whole zoom, but one that does not fit is never drawn.
	 * @param {number} opacity
	 * @returns {Array} a maplibre step expression over zoom
	 */
	function buildArrowFitOpacityExpression(opacity) {
		const edgeMeters = ['number', ['get', 'edgeMercatorMeters'], ARROW_FIT_UNKNOWN_EDGE_METERS];
		const atZoom = zoom => ['case', ['>=', edgeMeters, arrowFitEdgeMeters(zoom)], opacity, 0];
		const expression = ['step', ['zoom'], atZoom(ARROW_MIN_ZOOM)];
		for (let zoom = ARROW_MIN_ZOOM + 1; zoom <= ARROW_FIT_TOP_ZOOM; zoom++) {
			expression.push(zoom, atZoom(zoom));
		}
		return expression;
	}

	// Minimum gap (ms) between two source writes of a growing route line, i.e. a ~30 fps cap on setData.
	// A grow frame replaces the whole drawn geometry: MapLibre serializes that payload and ships it to the
	// worker for a re-parse and tile regeneration, so on a long day track the write, not the interpolation,
	// is the expensive part. The RAF loop still ticks every frame - only the source write is skipped - so the
	// grow keeps its duration, its easing and its exact final geometry. The value sits just under the 33.3 ms
	// period of 30 Hz so that a 60 Hz display lands on every second frame rather than every third.
	// The Leaflet engine keeps a copy of this number under FOLLOWER_UPDATE_INTERVAL_MS (it cannot import
	// from here) - exported so the guard in test/engine-mirrored-constants.test.js holds the two together.
	const GROW_SOURCE_UPDATE_INTERVAL_MS = 30;

	// A followed line is written whole on every frame, so a frame costs what the line is long: a tracked shift
	// ends on ~1350 vertices against the 300 the rate above was chosen for. Past this many the gap between
	// writes grows with the line, the tip lagging the marker by under a pixel. Mirrored in the Leaflet engine.
	const FOLLOWER_CHEAP_LINE_VERTICES = 300;
	const FOLLOWER_MAX_UPDATE_INTERVAL_MS = 120;

	/**
	 * Minimum gap (ms) between two source writes of a followed line of this many vertices. Mirror of
	 * followerUpdateIntervalMs in the Leaflet engine, held to it by test/engine-mirrored-constants.test.js.
	 *
	 * @param {number} vertexCount
	 * @returns {number}
	 */
	const followerUpdateIntervalMs = vertexCount => Math.min(FOLLOWER_MAX_UPDATE_INTERVAL_MS, GROW_SOURCE_UPDATE_INTERVAL_MS * Math.max(1, Math.ceil(vertexCount / FOLLOWER_CHEAP_LINE_VERTICES)));

	// Finger buffer (px) around a canvas tap when hit-testing route lines. A route stroke is only a few
	// pixels wide, so a bare point query would almost never land on it under a finger; the tap is widened
	// into a square of this half-size and the nearest line inside it wins. Chosen for a comfortable touch
	// target without swallowing taps meant for empty map; tune on a live device if needed.
	const LAYER_CLICK_TOLERANCE_PX = 10;

	/**
	 * MapLibre GL implementation of the check-in map engine.
	 *
	 * Behavioural parity port of CheckInMapService (Leaflet, check-in-map-service.js).
	 * Same public method signatures (those of CheckInMapServiceBase), same data
	 * contract - `[lat, lng]` everywhere on the boundary - converted to MapLibre's
	 * `[lng, lat]` order only through {@link toLngLat}.
	 *
	 * Unlike the Leaflet engine, the constructor receives `tokenContainer` and
	 * `hostName` directly (the OSMFactory will pass them for the MapLibre branch),
	 * because tile authorization is handled by an OsmAuthProtocol bound to the
	 * MapLibre `addProtocol` API instead of a tileLayerFactoryMethod.
	 */
	class CheckInMapServiceMapLibre extends location_core.CheckInMapServiceBase {
		#authProtocol = null;
		#fitToLayersInFlight = false;

		// MapLibre requires the style to be loaded before addSource/addLayer/setPaintProperty,
		// whereas Leaflet adds layers any time. To keep behavioural parity, layer/paint ops are
		// queued until the 'load' event (markers are DOM overlays and don't need this).
		#styleReady = false;
		#pendingStyleOps = [];

		// Workday grayscale mode. Kept as state and never written to the layer on its own: the look of
		// the basemap is derived from it together with the colour scheme in #tilePaint().
		#grayscaleEnabled = false;

		// Running smooth marker moves, keyed by marker id. At most one per marker: a newer update supersedes
		// the unfinished move and starts from wherever the marker currently is, so an early fix never makes it
		// jump. Each record: { rafId, position } - position is the frame a line with `followMarker` ends on.
		#markerAnimations = new Map();

		// Active grow-segment animations, keyed by host layerId. At most one per layer (a new setLayerPath
		// for a layer supersedes its unfinished grow). Each record: { rafId, coveredLength } - coveredLength
		// is the arc length (in degrees, the #pathLength metric) of the geometry currently drawn, so a
		// superseding grow can resume from the drawn head without re-measuring the frame's points.
		#layerAnimations = new Map();
		constructor(props) {
			super(props);
			const {
				languageId,
				sourceLanguageId,
				serviceUrl,
				mapServiceUrl,
				tokenContainer,
				hostName
			} = props;
			this.languageId = languageId;
			this.sourceLanguageId = sourceLanguageId;
			this.serviceUrl = serviceUrl;
			this.mapServiceUrl = mapServiceUrl;
			this.tokenContainer = tokenContainer;
			this.hostName = hostName;
			this.mapInstance = null;
			this.markers = new Map();
			this.layers = new Map();
			this.onZoomChanged = null;

			// Accessed by ClusteringManagerMapLibre (convention-private: not part of the public API)
			this.markerOriginalLatLngs = new Map();
			this.markerConfigs = new Map();
			this.clustering = new ClusteringManagerMapLibre(this);
		}
		processInitProps(props) {
			this.containerId = props?.containerId;
			this.mapCenter = props?.mapCenter;
			this.mapZoom = props?.mapZoom || 13;
			this.zoomControlPosition = props?.zoomControlPosition || 'topright';
			this.fitBoundsPadding = props?.fitBoundsPadding || [20, 20];
			this.fitBoundsMaxZoom = props?.fitBoundsMaxZoom || 18;
			this.colorScheme = (props?.colorScheme ?? '').includes('dark') ? 'dark' : 'light';
			this.#grayscaleEnabled = props?.grayscale === true;
			if (props?.colors) {
				this.#applyThemeColors(props.colors);
			}
		}
		#applyThemeColors(colors) {
			const root = document.documentElement;
			const {
				primaryBg,
				accent,
				accentBg,
				base3,
				base7,
				success
			} = colors;
			if (primaryBg) {
				root.style.setProperty('--primary-bg-color', primaryBg);
			}
			if (accent) {
				root.style.setProperty('--accent-color', accent);
			}
			if (accentBg) {
				root.style.setProperty('--accent-bg-color', accentBg);
			}
			if (base3) {
				root.style.setProperty('--base3-color', base3);
			}
			if (base7) {
				root.style.setProperty('--base7-color', base7);
			}
			if (success) {
				root.style.setProperty('--success-color', success);
			}
		}

		/**
		 * Leaflet/host convention is [lat, lng]; MapLibre expects [lng, lat].
		 * Single inversion point - see ./maplibre/coords.
		 */
		toLngLat(coords) {
			return toLngLat(coords);
		}
		init(props = {}) {
			this.processInitProps(props);
			const container = document.querySelector(this.containerId);
			if (!container) {
				console.error('Map container not found:', this.containerId);
				return;
			}
			if (this.colorScheme === 'dark') {
				container.classList.add('theme-dark');
			}
			this.#authProtocol = new OsmAuthProtocol({
				tokenContainer: this.tokenContainer,
				hostName: this.hostName,
				mapServiceUrl: this.mapServiceUrl
			});
			this.#authProtocol.register(location_osm_maplibre.maplibregl);
			this.mapInstance = new location_osm_maplibre.maplibregl.Map({
				container,
				center: this.toLngLat(this.mapCenter),
				zoom: this.mapZoom,
				attributionControl: false,
				maxZoom: 18,
				style: {
					version: 8,
					sources: {
						[OSM_SOURCE_ID]: {
							type: 'raster',
							tiles: [this.#authProtocol.buildTileUrlTemplate()],
							tileSize: 256,
							maxzoom: 18,
							attribution: 'Map data © OpenStreetMap contributors'
						}
					},
					layers: [{
						id: OSM_LAYER_ID,
						type: 'raster',
						source: OSM_SOURCE_ID,
						// Show tiles instantly without the default ~300ms fade-in. The fade
						// (not a network re-download - tiles are served from MapLibre's cache
						// on re-zoom, verified) is what reads as "tiles reloading on zoom";
						// Leaflet displayed tiles instantly, so match that.
						// The theme paint is part of the initial style rather than a write
						// after 'load', so a dark map never shows a light first frame.
						paint: {
							'raster-fade-duration': 0,
							...this.#tilePaint()
						}
					}]
				}
			});

			// The OSM data credit the raster source above carries: without a control on the map it is drawn
			// nowhere. `compact: false` keeps it standing as plain text in the corner, the way the Leaflet
			// check-in engine shows it; left unset it would follow the width of the map, and on a phone that
			// folds the credit into an "i" icon which then disappears on the first pan. The options given
			// replace MapLibre's defaults whole rather than merging into them, which is what keeps its own
			// customAttribution linking to maplibre.org out of the credit - in a WebView with no navigation
			// interception that tap leads out of the map with no way back.
			this.mapInstance.addControl(new location_osm_maplibre.maplibregl.AttributionControl({
				compact: false
			}), 'bottom-right');
			this.mapInstance.on('load', () => {
				this.#styleReady = true;
				const pending = this.#pendingStyleOps.splice(0);
				pending.forEach(op => {
					if (this.mapInstance) {
						op();
					}
				});
				if (this.onZoomChanged) {
					this.onZoomChanged(this.mapInstance.getZoom());
				}
				this.sendEvent(location_core.CheckInMapEventType.MAP_LOADED, {});
			});
			this.mapInstance.on('zoomend', () => {
				this.#handleZoomChanged();
			});
			this.mapInstance.on('click', event => {
				this.#handleMapClick(event);
			});
		}

		// Canvas tap hit-test for route lines (microcommands). Markers are DOM overlays whose click
		// listener calls domEvent.stopPropagation(), so a tap on a marker never reaches the canvas and this
		// handler does not fire for it - marker taps keep their MARKER_CLICKED path and take priority over
		// the line underneath. Only route polylines are probed (the layer registry filters to type
		// 'polyline'); arrows and other layers are excluded. The engine is transport only: it emits the host
		// layer id and the tap coordinate and leaves the employee/team resolution to the orchestrator.
		#handleMapClick(event) {
			if (!this.mapInstance || !event?.point) {
				return;
			}
			const hostIdByLayerId = new Map();
			const routeLayerIds = [];
			this.layers.forEach((descriptor, hostId) => {
				if (descriptor.type === 'polyline' && this.mapInstance.getLayer(descriptor.layerId)) {
					routeLayerIds.push(descriptor.layerId);
					hostIdByLayerId.set(descriptor.layerId, hostId);
				}
			});
			if (routeLayerIds.length === 0) {
				return;
			}
			const {
				x,
				y
			} = event.point;
			const box = [[x - LAYER_CLICK_TOLERANCE_PX, y - LAYER_CLICK_TOLERANCE_PX], [x + LAYER_CLICK_TOLERANCE_PX, y + LAYER_CLICK_TOLERANCE_PX]];
			const features = this.mapInstance.queryRenderedFeatures(box, {
				layers: routeLayerIds
			});
			if (!Array.isArray(features) || features.length === 0) {
				return;
			}
			const nearest = this.#nearestFeatureByPixels(features, event.point);
			const hostId = nearest ? hostIdByLayerId.get(nearest.layer?.id) : undefined;
			if (hostId === undefined) {
				return;
			}
			const {
				lat,
				lng
			} = event.lngLat;
			this.sendEvent(location_core.CheckInMapEventType.LAYER_CLICKED, {
				layerId: hostId,
				coords: [lat, lng]
			});
		}

		// Picks the feature whose rendered line runs closest to the tap point, so overlapping route lines
		// inside the finger buffer resolve to the nearest one rather than the arbitrary top-most hit.
		#nearestFeatureByPixels(features, point) {
			let best = null;
			let bestDistance = Infinity;
			features.forEach(feature => {
				const distance = this.#featurePixelDistance(feature, point);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = feature;
				}
			});
			return best;
		}

		// Minimum pixel distance from the tap point to a feature's (multi)line geometry, projecting each
		// vertex to screen space so the comparison is in the same units as the finger buffer.
		#featurePixelDistance(feature, point) {
			const geometry = feature?.geometry;
			if (!geometry) {
				return Infinity;
			}
			const lines = geometry.type === 'MultiLineString' ? geometry.coordinates : [geometry.coordinates];
			let minDistance = Infinity;
			lines.forEach(line => {
				if (!Array.isArray(line) || line.length === 0) {
					return;
				}
				const projected = line.map(coord => this.mapInstance.project(coord));
				if (projected.length === 1) {
					minDistance = Math.min(minDistance, Math.hypot(projected[0].x - point.x, projected[0].y - point.y));
					return;
				}
				for (let i = 1; i < projected.length; i++) {
					const distance = this.#pointToSegmentPixelDistance(point, projected[i - 1], projected[i]);
					if (distance < minDistance) {
						minDistance = distance;
					}
				}
			});
			return minDistance;
		}
		#pointToSegmentPixelDistance(p, a, b) {
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const lengthSq = dx * dx + dy * dy;
			if (lengthSq === 0) {
				return Math.hypot(p.x - a.x, p.y - a.y);
			}
			let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
			t = Math.max(0, Math.min(1, t));
			return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
		}
		#handleZoomChanged() {
			if (!this.mapInstance) {
				return;
			}
			const zoom = this.mapInstance.getZoom();
			this.sendEvent(location_core.CheckInMapEventType.ZOOM_CHANGED, {
				zoom
			});
			if (this.onZoomChanged) {
				this.onZoomChanged(zoom);
			}
		}
		destroy() {
			// Dispose removes event listeners and cancels timeouts without touching the map.
			// clearMarkers() then removes all markers (individual and cluster) from the map.
			this.clustering.dispose();
			this.#cancelAllLayerAnimations();
			this.#cancelAllMarkerAnimations();
			this.clearMarkers();
			this.clearLayers();
			if (this.mapInstance) {
				this.mapInstance.remove();
				this.mapInstance = null;
			}
			if (this.#authProtocol) {
				this.#authProtocol.unregister(location_osm_maplibre.maplibregl);
				this.#authProtocol = null;
			}
			this.#pendingStyleOps = [];
			this.#styleReady = false;

			// The basemap look is derived from this together with the colour scheme, and nothing writes it
			// back on its own: an instance initialized again would derive the tiles of the workday state of
			// a session already over and open the map colourless with nobody having asked for it.
			this.#grayscaleEnabled = false;
		}
		addMarkers(markers) {
			if (!Array.isArray(markers)) {
				console.error('addMarkers expects an array of marker objects');
				return;
			}
			if (markers.length === 0) {
				return;
			}
			markers.forEach(markerData => {
				if (!markerData.id || !markerData.config) {
					console.error('Each marker must have id and config properties', markerData);
					return;
				}
				const {
					id,
					config
				} = markerData;
				const {
					coords,
					markerIcon
				} = config;
				if (!markerIcon || !markerIcon.html) {
					console.error('Invalid icon config for marker:', id, 'Icon must have html property');
					return;
				}
				if (this.#moveMarkerSmoothly(id, config)) {
					return;
				}
				const marker = this.#canUpdateMarkerInPlace(id, markerIcon) ? this.#updateMarker(id, config) : this.#createMarker(id, config);

				// z-index dominates over MapLibre's default per-marker stacking so that
				// time order takes priority (parity with Leaflet zIndexOffset).
				marker.getElement().style.zIndex = config.zIndex == null ? '' : String(config.zIndex * 10000);
				this.markerConfigs.set(id, config);
				this.markerOriginalLatLngs.set(id, coords); // store [lat, lng] for fitToLayers parity
			});
			if (this.clustering.isEnabled) {
				this.clustering.updateClusters();
			}
		}
		addLayers(layers) {
			if (!Array.isArray(layers)) {
				console.error('addLayers expects an array of layer objects');
				return;
			}
			if (layers.length === 0) {
				return;
			}
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			if (!this.#styleReady) {
				this.#pendingStyleOps.push(() => this.addLayers(layers));
				return;
			}
			layers.forEach(layerData => {
				if (!layerData.id || !layerData.config) {
					console.error('Each layer must have id and config properties', layerData);
					return;
				}
				const {
					id,
					config
				} = layerData;
				const {
					type,
					options = {}
				} = config;

				// `appendPoints` carries the vertices a line has GROWN by instead of the whole line: pushing the whole
				// day of a tracked shift across the native bridge on every fix is what rationed the tail to one send
				// per ten seconds. A growth is never a layer of its own: what is not on the map has nothing to grow.
				const growth = type === 'polyline' && Array.isArray(config.appendPoints) ? config.appendPoints : null;
				const grown = growth ? this.layers.get(id)?.points : null;
				if (growth && !Array.isArray(grown)) {
					console.error('appendPoints has no layer of that id to grow', id);
					return;
				}
				const points = growth ? [...grown, ...growth] : config.points;

				// `followMarker` binds the final vertex of the line to the live position of that marker, so a
				// tail can never be drawn ahead of the marker it belongs to. The geometry stored here stays the
				// one the caller sent - the tip is substituted only while a walk is running.
				const followMarker = type === 'polyline' ? config.followMarker ?? null : null;
				const drawnPoints = followMarker ? this.#pathWithFollowedTip(points, this.#markerPosition(followMarker)) : points;
				const geojson = this.#buildLayerGeoJson(type, drawnPoints);
				if (!geojson) {
					console.error('Unknown layer type:', type);
					return;
				}
				const sourceId = this.#sourceId(id);
				const layerId = this.#layerId(id);

				// Update existing source data without recreating layer/source. options.animated grows
				// the geometry in place (grow-segment) instead of snapping; without it the update is instant
				// (byte-for-byte the previous behaviour). This is how a consumer threads the grow options to
				// setLayerPath through the existing ADD_LAYERS transport, without touching the command contract.
				if (this.layers.has(id) && this.mapInstance.getSource(sourceId)) {
					const existing = this.layers.get(id);
					existing.followMarker = followMarker;
					if (options.animated) {
						this.setLayerPath(id, points, {
							animated: true,
							duration: options.duration
						});
					} else {
						// An instant update supersedes an unfinished grow of the same layer (as setLayerPath
						// does); otherwise the next grow frame would overwrite the geometry just written.
						this.#cancelLayerAnimation(id);
						this.mapInstance.getSource(sourceId).setData(geojson);
						existing.points = this.#normalizeLayerPoints(type, points);
					}
					return;
				}
				const sourceSpec = {
					type: 'geojson',
					data: geojson
				};
				if (type === 'polyline' && this.#hasGradientStops(options)) {
					sourceSpec.lineMetrics = true;
				}
				if (type === 'arrows') {
					this.#ensureArrowImage();
				}
				this.mapInstance.addSource(sourceId, sourceSpec);
				const layerSpec = this.#buildLayerSpec(type, layerId, sourceId, options, points);
				this.mapInstance.addLayer(layerSpec);
				// `points` (original [lat,lng]) is kept for fitToLayers parity and for
				// route-polyline path updates from the clustering manager.
				const descriptor = {
					sourceId,
					layerId,
					type,
					points: this.#normalizeLayerPoints(type, points),
					followMarker
				};
				this.layers.set(id, descriptor);
			});
		}
		clearMarkers() {
			this.#cancelAllMarkerAnimations();
			this.clustering.cancelPendingAnimations();
			this.clustering.clearClusterMarkers();
			this.markers.forEach(marker => {
				marker.remove();
			});
			this.markers.clear();
			this.markerOriginalLatLngs.clear();
			this.markerConfigs.clear();
			this.clustering.clearPrevMarkerKeys();
			this.#fitToLayersInFlight = false;
		}
		removeMarkers(ids) {
			if (!Array.isArray(ids)) {
				console.error('removeMarkers expects an array of marker identifiers');
				return;
			}
			ids.forEach(id => {
				this.cancelMarkerAnimation(id);
				const marker = this.markers.get(id);
				if (marker) {
					marker.remove();
				}
				this.markers.delete(id);
				this.markerOriginalLatLngs.delete(id);
				this.markerConfigs.delete(id);
				this.clustering.deletePrevMarkerKey(id);
			});
			this.#fitToLayersInFlight = false;
			if (this.clustering.isEnabled) {
				this.clustering.updateClusters();
			}
		}
		removeLayers(ids) {
			if (!Array.isArray(ids)) {
				console.error('removeLayers expects an array of layer identifiers');
				return;
			}
			if (this.mapInstance && !this.#styleReady) {
				this.#pendingStyleOps.push(() => this.removeLayers(ids));
				return;
			}
			ids.forEach(id => {
				this.#removeLayerById(id);
				this.layers.delete(id);
			});
		}
		clearLayers() {
			if (this.mapInstance && !this.#styleReady) {
				this.#pendingStyleOps.push(() => this.clearLayers());
				return;
			}
			this.layers.forEach((descriptor, id) => {
				this.#removeLayerById(id);
			});
			this.layers.clear();
		}
		fitBounds(bounds, options = {}) {
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			if (!Array.isArray(bounds) || bounds.length === 0) {
				console.error('Invalid bounds: empty or not an array');
				return;
			}
			this.#settleMarkerAnimations();
			const padding = this.normalizePadding(options.padding || this.fitBoundsPadding);
			const maxZoom = options.maxZoom === undefined ? this.fitBoundsMaxZoom : options.maxZoom;
			const duration = options.duration ?? ANIMATION_CONFIG.fitBounds.duration;
			// One-off pixel center shift (not persisted in the map state, unlike padding).
			const offset = Array.isArray(options.offset) ? options.offset : null;
			// Some fits (e.g. centering on a single point) should not run the cluster merge/split
			// transition, which hides markers for the duration of the flight and reads as a flicker.
			// Parity with fitToLayers: suppress the animation and let clustering re-render on zoomend.
			const skipClusterTransition = options.skipClusterTransition === true;
			if (bounds.length === 1 && this.#isCameraSettled(this.toLngLat(bounds[0]), Math.min(maxZoom, this.mapInstance.getMaxZoom()))) {
				return;
			}
			this.clustering.suppressNextAnimation();
			if (this.clustering.isEnabled && !skipClusterTransition) {
				this.clustering.beginTransition();
			}
			if (bounds.length === 1) {
				// Single-point centering uses `offset` for any shift, NOT `padding`: easeTo writes its
				// `padding` into the map's persistent camera padding, which then STACKS onto the next
				// fitBounds' padding option (measured: 80+80->160, 125+125->250 = cramped). Forcing zero
				// here keeps the persistent padding clean so every fit frames identically.
				this.mapInstance.easeTo({
					center: this.toLngLat(bounds[0]),
					zoom: Math.min(maxZoom, this.mapInstance.getMaxZoom()),
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0
					},
					duration,
					...(offset ? {
						offset
					} : {})
				});
				return;
			}
			const llb = new location_osm_maplibre.maplibregl.LngLatBounds();
			bounds.forEach(c => llb.extend(this.toLngLat(c)));
			if (llb.isEmpty()) {
				this.clustering.cancelTransition();
				console.error('Invalid bounds');
				return;
			}
			this.mapInstance.fitBounds(llb, {
				padding,
				maxZoom,
				animate: true,
				duration,
				...(offset ? {
					offset
				} : {})
			});
		}
		setZoom(zoom) {
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			this.mapInstance.easeTo({
				zoom,
				duration: ANIMATION_CONFIG.easeTo.duration,
				easing: ANIMATION_CONFIG.easeTo.easing
			});
		}
		zoomIn() {
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			this.mapInstance.zoomIn();
		}
		zoomOut() {
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			this.mapInstance.zoomOut();
		}
		fitToLayers(maxZoom = null) {
			if (!this.mapInstance) {
				console.error('Map instance is not initialized');
				return;
			}
			this.#settleMarkerAnimations();

			// Compute bounds from stable data sources - not from what is currently
			// rendered on the map, since clustering and animations alter that.
			const bounds = [];
			this.markerOriginalLatLngs.forEach(latLng => {
				bounds.push(latLng);
			});
			this.layers.forEach(descriptor => {
				this.#collectLayerBoundPoints(descriptor).forEach(ll => bounds.push(ll));
			});
			if (bounds.length === 0) {
				return;
			}

			// Skip if a fitToLayers-triggered animation is already in progress.
			// This prevents redundant calls (e.g. periodic polling) from restarting
			// the pan/zoom while it is still running.
			if (this.#fitToLayersInFlight) {
				return;
			}
			const targetMaxZoom = maxZoom === null ? this.fitBoundsMaxZoom : maxZoom;
			const padding = this.normalizePadding(this.fitBoundsPadding);
			const duration = ANIMATION_CONFIG.fitBounds.duration;
			if (bounds.length === 1 && this.#isCameraSettled(this.toLngLat(bounds[0]), Math.min(targetMaxZoom, this.mapInstance.getMaxZoom()))) {
				return;
			}
			this.#fitToLayersInFlight = true;
			const clearInFlight = () => {
				this.#fitToLayersInFlight = false;
			};

			// Clear the flag once the animation completes so the next call can perform
			// a fresh check (e.g. after the user pans the map).
			this.mapInstance.once('moveend', clearInFlight);

			// Fallback: guarantee the flag clears even when the camera does not move (bounds
			// already fitted -> no 'moveend'), otherwise the flag would stay stuck and the manual
			// "fit to layers" button would stop working until markers change.
			setTimeout(clearInFlight, duration + 300);

			// Drive the camera directly (parity with Leaflet, which calls
			// mapInstance.fitBounds here rather than its own fitBounds, so the
			// clustering transition machinery is not engaged - the cluster manager
			// re-renders off its own zoomend listener).
			this.clustering.suppressNextAnimation();
			if (bounds.length === 1) {
				this.mapInstance.easeTo({
					center: this.toLngLat(bounds[0]),
					zoom: Math.min(targetMaxZoom, this.mapInstance.getMaxZoom()),
					// Zero padding: keep the persistent camera padding clean (see fitBounds single-point).
					padding: {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0
					},
					duration
				});
				return;
			}
			const llb = new location_osm_maplibre.maplibregl.LngLatBounds();
			bounds.forEach(c => llb.extend(this.toLngLat(c)));
			if (llb.isEmpty()) {
				this.#fitToLayersInFlight = false;
				return;
			}
			this.mapInstance.fitBounds(llb, {
				padding,
				maxZoom: targetMaxZoom,
				animate: true,
				duration
			});
		}
		enableClustering(options = {}) {
			// From here on the clustering manager owns marker positions, and it cannot stop the walks itself:
			// enable() takes every marker off the map first. A marker folded into a cluster would otherwise
			// keep walking off-map, writing the lines bound to it.
			this.#cancelAllMarkerAnimations();
			this.clustering.enable(options);
		}
		disableClustering() {
			this.clustering.disable();
		}
		updateSettings(props = {}) {
			if (props.fitBoundsPadding !== undefined) {
				this.fitBoundsPadding = props.fitBoundsPadding;
			}
			if (props.fitBoundsMaxZoom !== undefined) {
				this.fitBoundsMaxZoom = props.fitBoundsMaxZoom;
			}
		}
		getMarkerConfig(id) {
			return this.markerConfigs.get(id) ?? null;
		}
		setClusterIcon(markerIds, iconConfig) {
			this.clustering.setClusterIcon(markerIds, iconConfig);
		}
		setGrayscale(enabled) {
			this.#grayscaleEnabled = enabled === true;
			this.#applyTilePaint();
		}

		// Shared helpers exposed to ClusteringManagerMapLibre

		/**
		 * MapLibre analogue of Leaflet's L.divIcon: returns a DOM node built from
		 * { html, className, iconSize, iconAnchor }. Used by both addMarkers and the
		 * clustering manager.
		 */
		createDivIcon(html, className, iconSize, iconAnchor) {
			return this.#buildMarkerElement({
				html,
				className,
				iconSize,
				iconAnchor
			});
		}

		/**
		 * Applies an icon config to an existing marker element in place (no node swap),
		 * so MapLibre's positioning transform is preserved. Used by the clustering
		 * manager's setClusterIcon (MapLibre has no Marker.setIcon()).
		 */
		applyIconToElement(el, markerIcon) {
			el.innerHTML = markerIcon.html ?? '';
			// MapLibre marks the element it positions with classes of its own (maplibregl-marker carries
			// the absolute positioning, maplibregl-marker-anchor-* the anchor), and on an element already
			// held by a Marker they have to survive the icon swap - the icon owns the rest of className.
			const markerClasses = [...el.classList].filter(name => name.startsWith('maplibregl-'));
			el.className = [markerIcon.className ?? '', ...markerClasses].join(' ').trim();

			// Written unconditionally: applied in place, the element would otherwise keep the size of the
			// icon it had before.
			const [width, height] = Array.isArray(markerIcon.iconSize) ? markerIcon.iconSize : [];
			el.style.width = width === undefined ? '' : `${width}px`;
			el.style.height = height === undefined ? '' : `${height}px`;
			this.#applyAnchorOffset(el, markerIcon);
		}

		/**
		 * Normalizes fitBoundsPadding into a MapLibre padding object.
		 * @param {number[]|object} padding
		 * @returns {{top: number, left: number, bottom: number, right: number}}
		 */
		normalizePadding(padding) {
			return normalizePaddingPx(padding);
		}

		/**
		 * Maps an icon's iconAnchor/iconSize to a MapLibre Marker anchor keyword.
		 *
		 * MapLibre positions the marker so the chosen anchor keyword of the element
		 * sits on the coordinate. The host icons place the coordinate at iconAnchor
		 * (pixels from the element's top-left). When iconAnchor is exactly the
		 * horizontal center and vertical bottom, the 'bottom' keyword matches Leaflet
		 * exactly; the common "centered" case maps to 'center'. Any other anchor falls
		 * back to 'top-left' so #applyAnchorOffset can pin the exact pixel via offset.
		 */
		anchorFromIcon(markerIcon) {
			const size = markerIcon?.iconSize;
			const anchor = markerIcon?.iconAnchor;
			if (!Array.isArray(size) || !Array.isArray(anchor)) {
				return 'center';
			}
			const [w, h] = size;
			const [ax, ay] = anchor;
			if (ax === w / 2 && ay === h) {
				return 'bottom';
			}
			if (ax === w / 2 && ay === h / 2) {
				return 'center';
			}
			if (ax === w / 2 && ay === 0) {
				return 'top';
			}

			// Non-standard anchor: pin top-left and offset so the iconAnchor pixel
			// lands on the coordinate (mirrors Leaflet's exact anchoring).
			return 'top-left';
		}

		/**
		 * Updates the GeoJSON path of a previously added line/polygon layer.
		 *
		 * Without options (or animated:false) the path is applied instantly - in-place setData + gradient
		 * refresh, byte-for-byte the previous behaviour (used by the clustering manager to redraw a
		 * simplified route polyline). With animated:true the geometry grows smoothly from the currently
		 * drawn geometry (descriptor.points) up to `path` over `duration` ms via a RAF loop of intermediate
		 * setData calls; the final frame is identical to the instant apply of the same path.
		 *
		 * Invariants: at most one active grow per layerId - a new call supersedes an unfinished one and
		 * starts from the currently drawn geometry; the final state (descriptor.points, gradient) matches
		 * the instant path exactly. Freshness gradientStops are progress-based (0..1 along the line), so they
		 * follow the changing geometry without recomputation. Source writes are capped at ~30 fps
		 * (GROW_SOURCE_UPDATE_INTERVAL_MS) while the RAF loop keeps its own cadence.
		 * @param {String|Number} layerId - host layer id
		 * @param {Array<Array>} path - array of [lat, lng]
		 * @param {{ animated?: Boolean, duration?: Number }} [options]
		 */
		setLayerPath(layerId, path, options = {}) {
			const descriptor = this.layers.get(layerId);
			if (!descriptor || !this.mapInstance) {
				return;
			}
			const source = this.mapInstance.getSource(descriptor.sourceId);
			if (!source) {
				return;
			}

			// A new path for this layer always supersedes an unfinished grow of the same layer.
			const cancelled = this.#cancelLayerAnimation(layerId);
			if (!options.animated) {
				this.#applyLayerPath(descriptor, source, path);
				return;
			}

			// Supersede grows from where the previous frame stopped, not from the stored target.
			const fromLength = cancelled ? cancelled.coveredLength : this.#pathLength(descriptor.points);
			const duration = Number.isFinite(options.duration) ? options.duration : ANIMATION_CONFIG.growSegment.duration;
			this.#animateLayerPath(layerId, descriptor, source, fromLength, path, duration);
		}

		/**
		 * @param {String|Number} layerId - host layer id
		 * @returns {Boolean} whether an animated grow is currently running for the layer
		 */
		isLayerAnimating(layerId) {
			return this.#layerAnimations.has(layerId);
		}

		/**
		 * @param {String|Number} id - marker id
		 * @returns {Boolean} whether the marker is currently gliding towards a new position
		 */
		isMarkerAnimating(id) {
			return this.#markerAnimations.has(id);
		}
		sendEvent(type, data = {}) {
			// eslint-disable-next-line no-undef
			BXNativeBridge?.sendEvent(type, data);
		}

		// Private helpers

		/**
		 * The single point where the look of the basemap is derived, and it reads both of its inputs
		 * at once - the colour scheme and the workday grayscale mode. Neither input writes paint on
		 * its own, so turning grayscale off in the dark theme cannot hand the basemap its colour back.
		 * The result is the complete raster paint of the tile layer, never a subset of it.
		 * @returns {Object}
		 */
		#tilePaint() {
			const isDark = this.colorScheme === 'dark';
			return {
				...(isDark ? DARK_TILE_PAINT : LIGHT_TILE_PAINT),
				'raster-saturation': isDark || this.#grayscaleEnabled ? TILE_SATURATION_GRAY : TILE_SATURATION_COLOR
			};
		}
		#applyTilePaint() {
			if (!this.mapInstance) {
				return;
			}
			if (!this.#styleReady) {
				this.#pendingStyleOps.push(() => this.#applyTilePaint());
				return;
			}
			if (!this.mapInstance.getLayer(OSM_LAYER_ID)) {
				return;
			}
			const paint = this.#tilePaint();
			Object.keys(paint).forEach(property => {
				this.mapInstance.setPaintProperty(OSM_LAYER_ID, property, paint[property]);
			});
		}

		/**
		 * @param {Array<Number>} targetLngLat
		 * @param {Number} targetZoom
		 * @returns {Boolean}
		 */
		#isCameraSettled(targetLngLat, targetZoom) {
			const map = this.mapInstance;
			if (Math.abs(map.getZoom() - targetZoom) > 1e-3) {
				return false;
			}
			const target = map.project(targetLngLat);
			const center = map.project(map.getCenter());
			return Math.hypot(target.x - center.x, target.y - center.y) < 1;
		}

		/**
		 * Whether the marker already registered under `id` can take a new config without being rebuilt.
		 *
		 * MapLibre fixes the anchor keyword at construction (Marker has no anchor setter), so a config
		 * that moves the anchor is the one case the existing marker cannot absorb.
		 */
		#canUpdateMarkerInPlace(id, markerIcon) {
			const previousIcon = this.markerConfigs.get(id)?.markerIcon;
			if (!this.markers.has(id) || previousIcon === undefined) {
				return false;
			}
			return this.anchorFromIcon(previousIcon) === this.anchorFromIcon(markerIcon);
		}
		#createMarker(id, config) {
			const {
				coords,
				markerIcon
			} = config;
			const el = this.#buildMarkerElement(markerIcon, id);
			el.addEventListener('click', domEvent => {
				domEvent.stopPropagation();
				this.sendEvent(location_core.CheckInMapEventType.MARKER_CLICKED, {
					markerId: id,
					// Read on click rather than captured: this element outlives the config it was built
					// from, because a later addMarkers moves the marker instead of rebuilding it.
					coords: this.getMarkerConfig(id)?.coords
				});
			});

			// Remove old marker if exists (parity with Leaflet replace-by-id).
			const previousMarker = this.markers.get(id);
			if (previousMarker) {
				// A walk outlives the marker it moves: its frames hold the instance and keep writing the
				// lines bound to it, so it has to end before the instance leaves the map.
				this.cancelMarkerAnimation(id);
				previousMarker.remove();
				this.clustering.markRemoved(id);
			}
			const marker = new location_osm_maplibre.maplibregl.Marker({
				element: el,
				anchor: this.anchorFromIcon(markerIcon),
				...(Array.isArray(config.offset) ? {
					offset: config.offset
				} : {})
			}).setLngLat(this.toLngLat(coords));
			this.markers.set(id, marker);
			if (!this.clustering.isEnabled) {
				marker.addTo(this.mapInstance);
				// Tell the manager this marker is on the map so a later enableClustering()
				// can hide it (Leaflet derived this from mapInstance.hasLayer()).
				this.clustering.markAdded(id);
			}
			return marker;
		}

		/**
		 * Applies a config to the marker already registered under `id`, keeping its DOM node.
		 *
		 * An unchanged icon leaves the node untouched: a re-inserted avatar <img> is not guaranteed to be
		 * painted in the frame it was inserted in, which on Android shows as a blink of the marker once
		 * per geolocation fix. The marker is not re-added to the map for the same reason - MapLibre's
		 * Marker.addTo starts with a remove() that detaches the element.
		 */
		#updateMarker(id, config) {
			const marker = this.markers.get(id);
			const previousConfig = this.markerConfigs.get(id);

			// An update places the marker at once, so a walk still running would take it away again on
			// the next frame.
			this.cancelMarkerAnimation(id);
			if (!this.#sameIconConfig(previousConfig.markerIcon, config.markerIcon)) {
				this.applyIconToElement(marker.getElement(), config.markerIcon);
			}
			if (!this.#samePixelPair(previousConfig.offset, config.offset)) {
				marker.setOffset(Array.isArray(config.offset) ? config.offset : [0, 0]);
			}
			marker.setLngLat(this.toLngLat(config.coords));
			return marker;
		}

		/**
		 * Whether two icon configs would paint an element the same way.
		 *
		 * `iconKey` (location.check-in, icon-key.js) identifies the source an icon was built from and
		 * wins over the markup: generated html is not comparable. A key on one side only means the icon
		 * changed its nature; ready-made html carries no key and is its own identity.
		 */
		#sameIconConfig(a, b) {
			if (a.iconKey !== undefined || b.iconKey !== undefined) {
				return a.iconKey === b.iconKey;
			}
			return a.html === b.html && (a.className ?? '') === (b.className ?? '') && this.#samePixelPair(a.iconSize, b.iconSize) && this.#samePixelPair(a.iconAnchor, b.iconAnchor);
		}

		// Compares the [x, y] pixel pairs of a marker config (iconSize, iconAnchor, offset). Two
		// non-arrays count as equal: every reader of these fields guards them with Array.isArray,
		// so an absent pair and a malformed one have the same effect.
		#samePixelPair(a, b) {
			if (Array.isArray(a) && Array.isArray(b)) {
				return a[0] === b[0] && a[1] === b[1];
			}
			return !Array.isArray(a) && !Array.isArray(b);
		}
		#buildMarkerElement(markerIcon, id) {
			const el = document.createElement('div');
			this.applyIconToElement(el, markerIcon);
			if (id !== undefined && id !== null) {
				el.setAttribute('testId', id);
				el.setAttribute('data-testid', id);
			}
			return el;
		}

		// When anchorFromIcon falls back to 'top-left', apply a CSS offset so the
		// element's iconAnchor pixel still lands on the coordinate. For the recognized
		// keyword anchors MapLibre already positions correctly, so no offset is needed.
		#applyAnchorOffset(el, markerIcon) {
			if (this.anchorFromIcon(markerIcon) !== 'top-left') {
				return;
			}
			const [ax, ay] = markerIcon.iconAnchor;
			// Store the offset on the element; MapLibre's Marker applies element
			// position via transform, and a negative margin shifts the anchor pixel
			// onto the coordinate without fighting MapLibre's transform.
			el.style.marginLeft = `${-ax}px`;
			el.style.marginTop = `${-ay}px`;
		}
		#sourceId(id) {
			return `layer-src-${id}`;
		}
		#layerId(id) {
			return `layer-${id}`;
		}
		#ensureArrowImage() {
			if (!this.mapInstance || this.mapInstance.hasImage(ARROW_ICON_ID)) {
				return;
			}
			const image = this.#createArrowSdfImage();
			if (image) {
				this.mapInstance.addImage(ARROW_ICON_ID, image, {
					sdf: true,
					pixelRatio: ARROW_ICON_PIXEL_RATIO
				});
			}
		}
		#createArrowSdfImage() {
			const ratio = ARROW_ICON_PIXEL_RATIO;
			const size = ARROW_ICON_SIZE_PX * ratio;
			const canvas = document.createElement('canvas');
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				return null;
			}

			// Apex sits near the top (anchor) edge so that with icon-anchor 'top' the tip
			// is the point pinned to the arrival marker; the chevron opens downward (backward
			// along the bearing). Kept clear of the top edge by the round cap radius.
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = ARROW_ICON_STROKE_WIDTH_PX * ratio;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			ctx.moveTo(size * 0.2, size * ARROW_ICON_OPEN_END_RATIO);
			ctx.lineTo(size * 0.5, size * ARROW_ICON_APEX_RATIO);
			ctx.lineTo(size * 0.8, size * ARROW_ICON_OPEN_END_RATIO);
			ctx.stroke();
			return {
				width: size,
				height: size,
				data: ctx.getImageData(0, 0, size, size).data
			};
		}
		#removeLayerById(id) {
			// Stop any grow in flight before the source is gone, so a queued frame cannot setData on it.
			this.#cancelLayerAnimation(id);
			const descriptor = this.layers.get(id);
			if (!descriptor || !this.mapInstance) {
				return;
			}
			if (this.mapInstance.getLayer(descriptor.layerId)) {
				this.mapInstance.removeLayer(descriptor.layerId);
			}
			if (this.mapInstance.getSource(descriptor.sourceId)) {
				this.mapInstance.removeSource(descriptor.sourceId);
			}
		}
		#buildLayerGeoJson(type, points) {
			if (!Array.isArray(points)) {
				return null;
			}
			switch (type) {
				case 'polyline':
					return {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: points.map(p => this.toLngLat(p))
						}
					};
				case 'polygon':
					return {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'Polygon',
							coordinates: [points.map(p => this.toLngLat(p))]
						}
					};
				case 'circle':
					// Leaflet L.circle(points, options) takes a single [lat,lng] center;
					// represent it as a Point and render with a circle layer.
					return {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'Point',
							coordinates: this.toLngLat(Array.isArray(points[0]) ? points[0] : points)
						}
					};
				case 'arrows':
					return {
						type: 'FeatureCollection',
						features: points.map(point => ({
							type: 'Feature',
							properties: {
								bearing: point.bearing,
								stale: point.stale === true,
								// Room the arrow has on its own edge; see buildArrowFitOpacityExpression.
								edgeMercatorMeters: point.edgeMercatorMeters
							},
							geometry: {
								type: 'Point',
								coordinates: this.toLngLat([point.lat, point.lng])
							}
						}))
					};
				default:
					return null;
			}
		}
		#buildLayerSpec(type, layerId, sourceId, options, points) {
			switch (type) {
				case 'polyline':
					{
						const paint = {
							'line-color': options.color ?? '#3388ff',
							'line-width': options.weight ?? 3,
							'line-opacity': options.opacity ?? 1
						};
						if (options.dashArray) {
							// Array form (e.g. [2, 2]) is a MapLibre line-dasharray in
							// line-width units - pass it through. String form ("16, 8") is the
							// legacy Leaflet CSS-pixel notation - convert it.
							paint['line-dasharray'] = Array.isArray(options.dashArray) ? options.dashArray : this.#parseDashArray(options.dashArray, paint['line-width']);
						}
						if (this.#hasGradientStops(options)) {
							// Freshness stops are progress-based (0..1 along the line), so they follow an
							// in-place setData without recomputation.
							paint['line-gradient'] = buildLineGradientExpression(options.gradientStops);
						}
						return {
							id: layerId,
							type: 'line',
							source: sourceId,
							layout: {
								'line-cap': options.lineCap ?? 'round',
								'line-join': options.lineJoin ?? 'round'
							},
							paint
						};
					}
				case 'polygon':
					return {
						id: layerId,
						type: 'fill',
						source: sourceId,
						paint: {
							'fill-color': options.fillColor ?? options.color ?? '#3388ff',
							'fill-opacity': options.fillOpacity ?? options.opacity ?? 0.2
						}
					};
				case 'circle':
					return {
						id: layerId,
						type: 'circle',
						source: sourceId,
						paint: {
							'circle-radius': options.radius ?? 10,
							'circle-color': options.fillColor ?? options.color ?? '#3388ff',
							'circle-opacity': options.fillOpacity ?? options.opacity ?? 0.2,
							'circle-stroke-color': options.color ?? '#3388ff',
							'circle-stroke-width': options.weight ?? 3
						}
					};
				case 'arrows':
					return {
						id: layerId,
						type: 'symbol',
						source: sourceId,
						minzoom: ARROW_MIN_ZOOM,
						layout: {
							'symbol-placement': 'point',
							'icon-image': ARROW_ICON_ID,
							// Constant icon-size keeps the icon-offset gap (below) zoom-independent.
							'icon-size': options.arrowSize ?? 1,
							'icon-rotate': ['get', 'bearing'],
							'icon-rotation-alignment': 'map',
							'icon-allow-overlap': true,
							'icon-ignore-placement': true,
							// Pin the icon's top edge to the marker, then push it backward along the
							// bearing by a fixed pixel gap. The painted apex sits ARROW_ICON_APEX_INSET_PX
							// below that edge, so the inset comes off the gap and the paint - not the
							// edge - lands ARROW_ICON_MARKER_GAP_PX from the coordinate. icon-offset is
							// applied in the icon frame rotated by icon-rotate, so +y is backward (away
							// from the marker). No lateral shift: lane separation is baked into the
							// geometry upstream (route-fanout shiftPointToLane), so the x component is 0.
							'icon-anchor': 'top',
							'icon-offset': [0, ARROW_ICON_MARKER_GAP_PX - ARROW_ICON_APEX_INSET_PX]
						},
						paint: {
							// Non-fresh arrows use the staleness grey (LINE_GRADIENT_START_COLOR); see its
							// definition in route-gradient for the cross-bundle grey invariant.
							'icon-color': ['case', ['boolean', ['get', 'stale'], false], LINE_GRADIENT_START_COLOR, options.color ?? '#3388ff'],
							'icon-opacity': buildArrowFitOpacityExpression(options.opacity ?? 1)
						}
					};
				default:
					return null;
			}
		}

		// Leaflet dashArray is a CSS string ("8 8" or "8,8") in pixels; MapLibre
		// line-dasharray is an array of dash/gap lengths expressed in line widths.
		#parseDashArray(dashArray, lineWidth) {
			const width = lineWidth || 1;
			const parts = String(dashArray).split(/[\s,]+/).map(n => parseFloat(n)).filter(n => !Number.isNaN(n)).map(n => n / width);
			return parts.length > 0 ? parts : [2, 2];
		}

		// Returns the layer's geographic extent as an array of [lat, lng] points.
		// Uses the points stored in the descriptor (original host coordinates) so no
		// private MapLibre source internals are touched - parity with Leaflet's
		// fitToLayers, which extends bounds by each layer's getLatLng/getBounds.
		#collectLayerBoundPoints(descriptor) {
			return Array.isArray(descriptor.points) ? descriptor.points : [];
		}

		// Normalizes raw layer points into an array of [lat, lng] for bounds/path use.
		// `circle` accepts a single center; polyline/polygon accept a list of points.
		#normalizeLayerPoints(type, points) {
			if (!Array.isArray(points)) {
				return [];
			}
			if (type === 'circle') {
				return Array.isArray(points[0]) ? [points[0]] : [points];
			}
			if (type === 'arrows') {
				return points.map(point => [point.lat, point.lng]);
			}
			return points;
		}
		#hasGradientStops(options) {
			return Array.isArray(options?.gradientStops) && options.gradientStops.length > 0;
		}

		// Instant in-place path update: setData + stored geometry. The final state of an animated grow is
		// identical to this, so the two paths converge (setLayerPath invariant).
		#applyLayerPath(descriptor, source, path) {
			const geojson = this.#buildLayerGeoJson(descriptor.type, path);
			if (geojson) {
				source.setData(geojson);
				descriptor.points = this.#normalizeLayerPoints(descriptor.type, path);
			}
		}

		// Grows the layer geometry from arc length `fromLength` up to `targetPoints` over `duration` ms.
		// descriptor.points is set to the final target up front so bounds/fitToLayers frame the whole route
		// while the visual grows; only the drawn geometry is interpolated per frame. A non-line layer, an
		// empty/degenerate target, unchanged geometry or a missing RAF fall back to an instant apply. Progress
		// is driven by wall-clock time, so a slow device degrades to fewer, larger steps rather than
		// stretching in time.
		//
		// Per-frame cost is kept off the whole track: the target is converted to [lng, lat] once, the cut
		// vertex is found by a cursor that only moves forward (`covered` is monotonic), and the source write
		// is capped at ~30 fps. The final frame applies the exact target once.
		#animateLayerPath(layerId, descriptor, source, fromLength, targetPoints, duration) {
			const target = Array.isArray(targetPoints) ? targetPoints : [];
			descriptor.points = this.#normalizeLayerPoints(descriptor.type, target);
			const canAnimate = descriptor.type === 'polyline' && target.length >= 2 && duration > 0 && typeof requestAnimationFrame === 'function';
			if (!canAnimate) {
				this.#applyLayerPath(descriptor, source, target);
				return;
			}
			const cumulative = this.#cumulativeLengths(target);
			const total = cumulative[cumulative.length - 1];
			const startLength = Math.min(fromLength, total);

			// Nothing to grow (unchanged geometry, or the drawn line already covers the target): apply the
			// final path instantly so unchanged segments of a multi-segment route do not spin a RAF loop.
			if (total <= 0 || startLength >= total) {
				this.#applyLayerPath(descriptor, source, target);
				return;
			}
			const targetLngLat = target.map(point => this.toLngLat(point));
			const easing = ANIMATION_CONFIG.easeTo.easing;
			const startedAt = this.#now();
			const record = {
				rafId: 0,
				coveredLength: fromLength
			};
			this.#layerAnimations.set(layerId, record);
			let cutIndex = 0;
			let lastWriteAt = -Infinity;
			const step = () => {
				// Bail if the map is gone or a newer call for this layer superseded this animation.
				if (!this.mapInstance || this.#layerAnimations.get(layerId) !== record) {
					return;
				}
				const now = this.#now();
				const progress = Math.min(1, (now - startedAt) / duration);
				if (progress >= 1) {
					this.#layerAnimations.delete(layerId);
					this.#applyLayerPath(descriptor, source, target);
					return;
				}
				if (now - lastWriteAt >= GROW_SOURCE_UPDATE_INTERVAL_MS) {
					const covered = startLength + (total - startLength) * easing(progress);
					while (cutIndex + 1 < target.length && cumulative[cutIndex + 1] <= covered) {
						cutIndex++;
					}
					source.setData(this.#growFrameGeoJson(targetLngLat, cumulative, cutIndex, covered));
					record.coveredLength = covered;
					lastWriteAt = now;
				}
				record.rafId = requestAnimationFrame(step);
			};
			record.rafId = requestAnimationFrame(step);
		}

		// One grow frame: the already converted target prefix up to `cutIndex`, plus the interpolated head at
		// arc length `covered`. The prefix is a slice of shared (never mutated) [lng, lat] pairs, and both the
		// array and the feature are fresh objects - MapLibre serializes a setData payload asynchronously, so
		// nothing handed to the source may be reused or mutated afterwards.
		#growFrameGeoJson(targetLngLat, cumulative, cutIndex, covered) {
			const coordinates = targetLngLat.slice(0, cutIndex + 1);
			if (cutIndex + 1 < targetLngLat.length) {
				const segmentLength = cumulative[cutIndex + 1] - cumulative[cutIndex];
				const t = segmentLength > 0 ? (covered - cumulative[cutIndex]) / segmentLength : 0;
				const from = targetLngLat[cutIndex];
				const to = targetLngLat[cutIndex + 1];
				coordinates.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
			}
			return {
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates
				}
			};
		}

		/**
		 * Moves a placed marker to new coordinates instead of replacing it by id (`animate: true`). The instance is
		 * reused, so an infinite CSS animation in the icon (the pulse of an active employee) keeps running. Only while
		 * the marker stands on the map on its own (isMarkerOnMap); in a cluster the caller falls back to replace-by-id.
		 *
		 * @returns {Boolean} true when the update has been handled here.
		 */
		#moveMarkerSmoothly(id, config) {
			const marker = this.markers.get(id);
			const previousConfig = this.markerConfigs.get(id);
			if (config.animate !== true || !marker || !this.mapInstance || !this.clustering.isMarkerOnMap(id)) {
				return false;
			}

			// A reused marker keeps the anchor it was constructed with, so a change there has to go through
			// the replace-by-id path. The offset is rewritable on the marker itself and does not stop a walk.
			if (this.anchorFromIcon(previousConfig?.markerIcon) !== this.anchorFromIcon(config.markerIcon)) {
				return false;
			}
			const {
				lng,
				lat
			} = marker.getLngLat();
			const from = [lat, lng];
			const to = config.coords;
			this.#refreshMarkerIcon(marker, config.markerIcon, previousConfig?.markerIcon);
			if (!this.#samePixelPair(previousConfig?.offset, config.offset)) {
				marker.setOffset(Array.isArray(config.offset) ? config.offset : [0, 0]);
			}
			const zIndex = config.zIndex ?? null;
			marker.getElement().style.zIndex = zIndex === null ? '' : String(zIndex * 10000);
			this.markerConfigs.set(id, config);
			this.markerOriginalLatLngs.set(id, to);
			this.#animateMarkerMove(id, marker, from, to, config.animateDuration ?? ANIMATION_CONFIG.easeTo.duration);
			return true;
		}

		// Rewrites the icon of a reused marker only when the new config actually draws something else -
		// an innerHTML swap would restart any CSS animation the icon runs.
		#refreshMarkerIcon(marker, markerIcon, previous) {
			if (previous && this.#sameIconConfig(previous, markerIcon)) {
				return;
			}
			this.applyIconToElement(marker.getElement(), markerIcon);
		}

		// Glides the marker from `from` to `to` ([lat, lng] both) by interpolating its coordinate, not by a CSS
		// transform: MapLibre rewrites that transform on every map `move` frame, so a transition on it would drag
		// the marker behind the map during any camera move (the map follows the live position).
		#animateMarkerMove(id, marker, from, to, duration) {
			this.cancelMarkerAnimation(id);
			const canAnimate = duration > 0
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
			&& typeof requestAnimationFrame === 'function' && (from[0] !== to[0] || from[1] !== to[1]);
			if (!canAnimate) {
				marker.setLngLat(this.toLngLat(to));
				this.#drawFollowerLayers(id, to);
				return;
			}
			const startedAt = this.#now();
			const easing = ANIMATION_CONFIG.easeTo.easing;
			const record = {
				rafId: 0,
				position: from
			};
			this.#markerAnimations.set(id, record);
			const followerInterval = this.#followerUpdateInterval(id);
			let lastFollowerWriteAt = -Infinity;
			const step = () => {
				// Bail if the map is gone or a newer update for this marker superseded this move.
				if (!this.mapInstance || this.#markerAnimations.get(id) !== record) {
					return;
				}
				const now = this.#now();
				const progress = Math.min(1, (now - startedAt) / duration);
				if (progress >= 1) {
					this.#markerAnimations.delete(id);
					marker.setLngLat(this.toLngLat(to));
					// The last write is never skipped: the followed line has to end on the exact geometry
					// the caller sent, whatever the throttle did to the frames before it.
					this.#drawFollowerLayers(id, to);
					return;
				}
				const t = easing(progress);
				const position = [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
				record.position = position;
				marker.setLngLat(this.toLngLat(position));
				if (now - lastFollowerWriteAt >= followerInterval) {
					this.#drawFollowerLayers(id, position);
					lastFollowerWriteAt = now;
				}
				record.rafId = requestAnimationFrame(step);
			};
			record.rafId = requestAnimationFrame(step);
		}

		// How often the lines bound to this marker are written while it walks. The longest one decides: they
		// are all written from the same frame, so the frame costs what the longest costs. Read once per walk -
		// the answer must not cost a pass over the layers on every frame.
		#followerUpdateInterval(markerId) {
			let longest = 0;
			this.layers.forEach(descriptor => {
				if (descriptor.followMarker === markerId && descriptor.type === 'polyline' && Array.isArray(descriptor.points)) {
					longest = Math.max(longest, descriptor.points.length);
				}
			});
			return followerUpdateIntervalMs(longest);
		}

		/**
		 * Where the marker is drawn right now: the frame of a running move, its settled coordinate
		 * otherwise. This is what a line bound with `followMarker` ends at.
		 * @returns {Array<Number>|null} [lat, lng]
		 */
		#markerPosition(markerId) {
			const running = this.#markerAnimations.get(markerId);
			if (running) {
				return running.position;
			}
			const marker = this.markers.get(markerId);
			if (!marker) {
				return null;
			}
			const {
				lat,
				lng
			} = marker.getLngLat();
			return [lat, lng];
		}

		// The path a followed line is drawn with: the geometry as sent, its final vertex moved onto the
		// marker. Never mutates the stored points - they stay the target the move ends on.
		#pathWithFollowedTip(points, position) {
			if (!Array.isArray(points) || points.length === 0 || !position) {
				return points;
			}
			const drawn = points.slice(0, -1);
			drawn.push(position);
			return drawn;
		}

		// Writes every line bound to this marker with its tip on the given position, from the frames of the move
		// itself - tip and marker are the same coordinate of the same frame. A grow running on the same layer is
		// left alone: it ends on the exact path the caller sent, and the next frame of the move puts the tip back.
		#drawFollowerLayers(markerId, position) {
			if (!this.mapInstance || !this.#styleReady) {
				return;
			}
			this.layers.forEach((descriptor, layerId) => {
				if (descriptor.followMarker !== markerId || descriptor.type !== 'polyline' || this.#layerAnimations.has(layerId)) {
					return;
				}
				const source = this.mapInstance.getSource(descriptor.sourceId);
				if (!source) {
					return;
				}
				source.setData(this.#buildLayerGeoJson(descriptor.type, this.#pathWithFollowedTip(descriptor.points, position)));
			});
		}

		/**
		 * Stops a running move, leaving the marker on the frame it had reached. Public because the
		 * clustering manager calls it whenever it places that marker itself: the position has one owner
		 * at a time, and this is where the move hands it back.
		 * @param {String|Number} id - marker id
		 */
		cancelMarkerAnimation(id) {
			const record = this.#markerAnimations.get(id);
			if (!record) {
				return;
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
			if (typeof cancelAnimationFrame === 'function') {
				cancelAnimationFrame(record.rafId);
			}
			this.#markerAnimations.delete(id);
		}

		/**
		 * Ends every running walk on its destination. A camera fit frames the scene by the coordinates the
		 * markers are walking TO (it is built from markerOriginalLatLngs), so a marker still on its way would
		 * stand off the frame built for it - at the closest zoom, near the screen edge instead of the centre.
		 */
		#settleMarkerAnimations() {
			[...this.#markerAnimations.keys()].forEach(id => {
				this.cancelMarkerAnimation(id);
				const marker = this.markers.get(id);
				const target = this.markerOriginalLatLngs.get(id);
				if (marker && target) {
					marker.setLngLat(this.toLngLat(target));
					this.#drawFollowerLayers(id, target);
				}
			});
		}
		#cancelAllMarkerAnimations() {
			this.#markerAnimations.forEach(record => {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
				if (typeof cancelAnimationFrame === 'function') {
					cancelAnimationFrame(record.rafId);
				}
			});
			this.#markerAnimations.clear();
		}
		#cancelLayerAnimation(layerId) {
			const record = this.#layerAnimations.get(layerId);
			if (!record) {
				return null;
			}
			if (typeof cancelAnimationFrame === 'function') {
				cancelAnimationFrame(record.rafId);
			}
			this.#layerAnimations.delete(layerId);
			return record;
		}
		#cancelAllLayerAnimations() {
			this.#layerAnimations.forEach(record => {
				if (typeof cancelAnimationFrame === 'function') {
					cancelAnimationFrame(record.rafId);
				}
			});
			this.#layerAnimations.clear();
		}
		#now() {
			return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
		}

		// Euclidean length of a segment in lat/lng degrees. Only relative distances (progress ratios) matter
		// for the grow, so a planar metric over the short route is sufficient and metric-consistent.
		#pointDistance(a, b) {
			return Math.hypot(a[0] - b[0], a[1] - b[1]);
		}
		#pathLength(points) {
			if (!Array.isArray(points) || points.length < 2) {
				return 0;
			}
			let length = 0;
			for (let i = 1; i < points.length; i++) {
				length += this.#pointDistance(points[i - 1], points[i]);
			}
			return length;
		}
		#cumulativeLengths(points) {
			const cumulative = [0];
			for (let i = 1; i < points.length; i++) {
				cumulative.push(cumulative[i - 1] + this.#pointDistance(points[i - 1], points[i]));
			}
			return cumulative;
		}
	}

	// Self-registration keeps location.osm free of a static dependency on the heavy
	// MapLibre vendor bundle: this extension is loaded only when the engine is chosen.
	location_osm.CheckInEngineRegistry.register('maplibre', CheckInMapServiceMapLibre);

	exports.CheckInMapServiceMapLibre = CheckInMapServiceMapLibre;

})(this.BX.Location.OSM = this.BX.Location.OSM || {}, BX.Location.OSM, BX.Location.Core, BX.Location.OSM);
//# sourceMappingURL=check-in-maplibre.bundle.js.map
