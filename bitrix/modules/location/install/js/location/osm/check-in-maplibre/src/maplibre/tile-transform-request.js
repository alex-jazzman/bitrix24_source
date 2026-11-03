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
export default class OsmAuthProtocol
{
	static SCHEME = 'osmauth';

	#tokenContainer;
	#hostName;
	#mapServiceUrl;
	#processingUnauthorized = false;
	#waitingRequests = [];

	constructor({ tokenContainer, hostName, mapServiceUrl })
	{
		this.#tokenContainer = tokenContainer;
		this.#hostName = hostName;
		this.#mapServiceUrl = mapServiceUrl;
	}

	// osmauth://hot/en/{z}/{x}/{y}.png  ->  ${mapServiceUrl}/hot/en/{z}/{x}/{y}.png
	buildTileUrlTemplate()
	{
		return `${OsmAuthProtocol.SCHEME}://hot/en/{z}/{x}/{y}.png`;
	}

	#resolveRealUrl(requestUrl)
	{
		// Strip the custom scheme and prepend the authorized proxy origin.
		const path = requestUrl.replace(`${OsmAuthProtocol.SCHEME}://`, '');

		return `${this.#mapServiceUrl}/${path}`;
	}

	#fetchTile(requestUrl, isRetry)
	{
		const url = this.#resolveRealUrl(requestUrl);

		return fetch(url, {
			method: 'GET',
			cache: 'force-cache',
			headers: new Headers({
				Authorization: `Bearer ${this.#tokenContainer.token}`,
				'Bx-Location-Osm-Host': this.#hostName,
			}),
		}).then((response) => {
			if (response.status === 200)
			{
				return response.arrayBuffer().then((data) => ({ data }));
			}

			if (response.status === 401 && !isRetry)
			{
				return this.#processUnauthorized(requestUrl);
			}

			console.error(`Tile response status: ${response.status}`);

			// MapLibre treats an empty buffer as a transparent/empty tile rather
			// than throwing, mirroring Leaflet's silent failure on non-200.
			return { data: new ArrayBuffer(0) };
		}).catch((error) => {
			console.error(error);

			return { data: new ArrayBuffer(0) };
		});
	}

	#processUnauthorized(requestUrl)
	{
		// Queue this request and resolve it once the refresh + retry completes.
		// Equivalent to tilelayerauth.js pushing [url, img, done] onto
		// #waitingRequests and replaying them after refreshToken().
		const deferred = {};
		const promise = new Promise((resolve) => {
			deferred.resolve = resolve;
		});
		this.#waitingRequests.push({ requestUrl, resolve: deferred.resolve });

		if (!this.#processingUnauthorized)
		{
			this.#processingUnauthorized = true;
			this.#tokenContainer.refreshToken().then(() => {
				const pending = this.#waitingRequests.splice(0);
				this.#processingUnauthorized = false;
				pending.forEach((item) => {
					// Retry with isRetry=true so a repeated 401 won't loop into another refresh.
					this.#fetchTile(item.requestUrl, true).then(item.resolve);
				});
			});
		}

		return promise;
	}

	register(maplibregl)
	{
		// MapLibre GL JS v4/v5 callback signature: (requestParameters) => Promise<{data}>.
		maplibregl.addProtocol(OsmAuthProtocol.SCHEME, (params) => this.#fetchTile(params.url, false));
	}

	unregister(maplibregl)
	{
		maplibregl.removeProtocol(OsmAuthProtocol.SCHEME);
	}
}
