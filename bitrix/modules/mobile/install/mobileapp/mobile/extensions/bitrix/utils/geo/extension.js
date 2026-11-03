/**
 * @module utils/geo
 */
jn.define('utils/geo', (require, exports, module) => {
	const { Alert, ButtonType } = require('alert');
	const { Feature } = require('feature');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const {
		DEGREES_TO_RADIANS,
		EARTH_RADIUS_METERS,
		FRESH_DENIAL_THRESHOLD_MS,
		GeoAccuracy,
		GeoStatus,
		NativeErrorCode,
		UserAction,
	} = require('utils/geo/src/const');

	const toRadians = (degrees) => degrees * DEGREES_TO_RADIANS;

	const OPTIONAL_POSITION_FIELDS = ['accuracyMeters', 'timestamp', 'speed', 'bearing'];

	/**
	 * Passes native position fields through without interpretation: an optional field is copied
	 * only when the native app provided it (0 is a valid value, no defaults are substituted).
	 * @param {GeoPosition} position
	 * @return {GeoPosition}
	 */
	const normalizePosition = (position) => {
		const result = {
			latitude: position.latitude,
			longitude: position.longitude,
			accuracy: position.accuracy,
		};

		OPTIONAL_POSITION_FIELDS.forEach((field) => {
			if (position[field] != null)
			{
				result[field] = position[field];
			}
		});

		return result;
	};

	/** @type {WeakMap<function(GeoPosition): void, function(GeoPosition): void>} */
	const locationChangedHandlers = new WeakMap();

	/**
	 * Phrases of the alert shown when the app itself has no location permission.
	 * They also cover an unknown location status.
	 */
	const PERMISSION_PHRASES = Object.freeze({
		title: 'MOBILE_GEO_PERMISSION_ALERT_TITLE',
		description: 'MOBILE_GEO_PERMISSION_ALERT_DESCRIPTION',
	});

	/** Phrases of the alert shown when the location service of the device is off. */
	const SERVICE_DISABLED_PHRASES = Object.freeze({
		title: 'MOBILE_GEO_SERVICE_DISABLED_ALERT_TITLE',
		description: 'MOBILE_GEO_SERVICE_DISABLED_ALERT_DESCRIPTION',
	});

	/**
	 * Memoizes the native status read: the snapshot is asked for at most once per reader,
	 * no matter how many times the returned function is called.
	 * @return {function(): Promise<boolean>}
	 */
	const createServiceDisabledReader = () => {
		let isDisabled = null;

		return async () => {
			isDisabled ??= await Geo.readLocationServiceDisabled();

			return isDisabled;
		};
	};

	/**
	 * Normalized native position. An optional field is present only when the native app
	 * provided a valid value (0 is valid); an absent field means the value is invalid.
	 * @typedef {Object} GeoPosition
	 * @property {number} [latitude]
	 * @property {number} [longitude]
	 * @property {GeoAccuracy} [accuracy] legacy accuracy mode
	 * @property {number} [accuracyMeters] accuracy radius in meters
	 * @property {number} [timestamp] unix ms provided by the native app
	 * @property {number} [speed] meters per second
	 * @property {number} [bearing] movement direction in degrees
	 */

	/**
	 * @typedef {Object} GeoResult
	 * @property {GeoStatus} status
	 * @property {number} [latitude]
	 * @property {number} [longitude]
	 * @property {GeoAccuracy} [accuracy] legacy accuracy mode
	 * @property {number} [accuracyMeters] accuracy radius in meters
	 * @property {number} [timestamp] unix ms provided by the native app
	 * @property {number} [speed] meters per second; absent = invalid
	 * @property {number} [bearing] movement direction in degrees; absent = invalid
	 */
	class Geo
	{
		#accuracy;
		#shouldShowAlert;
		#shouldShowUnavailableAlert;

		/**
		 * @param {number} lat1
		 * @param {number} lon1
		 * @param {number} lat2
		 * @param {number} lon2
		 * @param {number} radius
		 * @return {boolean}
		 */
		static isWithinRadius(lat1, lon1, lat2, lon2, radius)
		{
			return Geo.getFlatDistanceInMeters(lat1, lon1, lat2, lon2) <= radius;
		}

		/**
		 * @param {number} lat1
		 * @param {number} lon1
		 * @param {number} lat2
		 * @param {number} lon2
		 * @return {number}
		 */
		static getFlatDistanceInMeters(lat1, lon1, lat2, lon2)
		{
			const avgLat = toRadians((lat1 + lat2) / 2);
			const dx = toRadians(lon2 - lon1) * Math.cos(avgLat);
			const dy = toRadians(lat2 - lat1);

			return EARTH_RADIUS_METERS * Math.sqrt(dx * dx + dy * dy);
		}

		/**
		 * @param {number} lat1
		 * @param {number} lon1
		 * @param {number} lat2
		 * @param {number} lon2
		 * @return {number}
		 */
		static getHaversineDistanceInMeters(lat1, lon1, lat2, lon2)
		{
			const deltaLat = toRadians(lat2 - lat1);
			const deltaLon = toRadians(lon2 - lon1);

			const halfChordSquared = (
				Math.sin(deltaLat / 2) ** 2
				+ Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) ** 2
			);
			const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordSquared), Math.sqrt(1 - halfChordSquared));

			return EARTH_RADIUS_METERS * angularDistance;
		}

		/**
		 * @return {Promise<{
		 *     isLocationServiceEnabled: boolean,
		 *     isUserApproximatePermissionGranted: boolean,
		 *     isUserPrecisePermissionGranted: boolean,
		 * } | null>}
		 */
		static async getLocationStatus()
		{
			if (!Feature.isLocationStatusSupported())
			{
				return null;
			}

			return device.getLocationStatus();
		}

		/**
		 * @param {?{
		 *     isLocationServiceEnabled?: boolean,
		 *     isUserApproximatePermissionGranted?: boolean,
		 *     isUserPrecisePermissionGranted?: boolean,
		 * }} status
		 * @return {boolean}
		 */
		static isLocationPermissionGranted(status)
		{
			return Boolean(
				status?.isLocationServiceEnabled
				&& (status?.isUserPrecisePermissionGranted || status?.isUserApproximatePermissionGranted),
			);
		}

		/**
		 * Strict comparison on purpose: an absent snapshot and a snapshot without the flag
		 * mean "unknown", not "disabled".
		 * @param {?{
		 *     isLocationServiceEnabled?: boolean,
		 *     isUserApproximatePermissionGranted?: boolean,
		 *     isUserPrecisePermissionGranted?: boolean,
		 * }} status
		 * @return {boolean}
		 */
		static isLocationServiceDisabled(status)
		{
			return status?.isLocationServiceEnabled === false;
		}

		/**
		 * Reads the snapshot and brings it to the unambiguous "off or not". A read the native app
		 * refuses means "unknown", which is what the phrases about the app permission cover: the
		 * flag decides the text of an alert, and nothing that asks for it may fail over that text.
		 * @return {Promise<boolean>}
		 */
		static async readLocationServiceDisabled()
		{
			try
			{
				return Geo.isLocationServiceDisabled(await Geo.getLocationStatus());
			}
			catch (error)
			{
				console.error('Geo: getLocationStatus failed', error);

				return false;
			}
		}

		/**
		 * @return {boolean}
		 */
		static isWatchSupported()
		{
			return Feature.isLocationWatchSupported();
		}

		/**
		 * Starts continuous location tracking. Points are delivered to `locationChanged` listeners.
		 * @param {Object} [options={}]
		 * @param {GeoAccuracy} [options.accuracy]
		 * @param {number} [options.distanceFilter] minimal distance in meters between points
		 * @return {boolean} false if watch is not supported by the native app
		 */
		static startWatch(options = {})
		{
			if (!Geo.isWatchSupported())
			{
				return false;
			}

			device.watchLocation(options);

			return true;
		}

		/**
		 * Subscribes to points of continuous tracking. Does not start GPS by itself - use `startWatch`.
		 * @param {function(GeoPosition): void} callback
		 */
		static onLocationChanged(callback)
		{
			if (!Geo.isWatchSupported())
			{
				return;
			}

			let handler = locationChangedHandlers.get(callback);
			if (!handler)
			{
				handler = (position) => callback(normalizePosition(position));
				locationChangedHandlers.set(callback, handler);
			}

			device.on('locationChanged', handler);
		}

		/**
		 * Unsubscribes from points of continuous tracking. The native app stops GPS
		 * when the last `locationChanged` listener is removed.
		 * @param {function(GeoPosition): void} callback
		 */
		static offLocationChanged(callback)
		{
			const handler = locationChangedHandlers.get(callback);
			if (handler)
			{
				device.off('locationChanged', handler);
			}
		}

		/**
		 * @param {function({code: number, message: string}): void} callback
		 */
		static onLocationError(callback)
		{
			if (!Geo.isWatchSupported())
			{
				return;
			}

			device.on('locationError', callback);
		}

		/**
		 * @param {function({code: number, message: string}): void} callback
		 */
		static offLocationError(callback)
		{
			if (!Geo.isWatchSupported())
			{
				return;
			}

			device.off('locationError', callback);
		}

		/**
		 * @param {Object} [props={}]
		 * @param {GeoAccuracy} [props.accuracy=GeoAccuracy.PRECISE]
		 * @param {boolean} [props.shouldShowAlert=true]
		 * @param {boolean} [props.shouldShowUnavailableAlert=false]
		 */
		constructor(props = {})
		{
			PropTypes.validate(Geo.propTypes, props, 'Geo');

			this.#accuracy = props.accuracy ?? GeoAccuracy.PRECISE;
			this.#shouldShowAlert = props.shouldShowAlert ?? true;
			this.#shouldShowUnavailableAlert = props.shouldShowUnavailableAlert ?? false;
		}

		/**
		 * @return {Promise<GeoResult>}
		 */
		async requestPosition()
		{
			const result = await this.#getLocation();
			const isServiceDisabled = createServiceDisabledReader();

			const isAlertCandidate = (
				result.status === GeoStatus.DENIED
				&& this.#shouldShowAlert
				&& !result.isFreshDenial
			) || (
				result.status === GeoStatus.UNAVAILABLE
				&& this.#shouldShowUnavailableAlert
			) || (
				result.status === GeoStatus.UNAVAILABLE
				&& this.#shouldShowAlert
				&& await isServiceDisabled()
			);

			if (
				isAlertCandidate
				&& await this.#showPermissionAlert(await isServiceDisabled()) === UserAction.SETTINGS
			)
			{
				await this.#waitForAppActive();

				return this.#getLocation();
			}

			return result;
		}

		/**
		 * @return {Promise<GeoResult>}
		 */
		#getLocation()
		{
			const startTime = Date.now();

			return new Promise((resolve) => {
				device.getLocation({ accuracy: this.#accuracy })
					.then((position) => {
						resolve({
							status: GeoStatus.SUCCESS,
							...normalizePosition(position),
						});
					})
					.catch((error) => {
						if (error?.code === NativeErrorCode.PERMISSION_DENIED)
						{
							const elapsedTime = Date.now() - startTime;

							resolve({
								status: GeoStatus.DENIED,
								isFreshDenial: elapsedTime >= FRESH_DENIAL_THRESHOLD_MS,
							});
						}
						else if (error?.code === NativeErrorCode.LOCATION_UNAVAILABLE)
						{
							resolve({ status: GeoStatus.UNAVAILABLE });
						}
					})
				;
			});
		}

		/**
		 * @param {boolean} isServiceDisabled
		 * @return {Promise<UserAction>}
		 */
		#showPermissionAlert(isServiceDisabled)
		{
			const pair = isServiceDisabled ? SERVICE_DISABLED_PHRASES : PERMISSION_PHRASES;

			return new Promise((resolve) => {
				Alert.confirm(
					Loc.getMessage(pair.title),
					Loc.getMessage(pair.description),
					[
						{
							text: Loc.getMessage('MOBILE_GEO_PERMISSION_ALERT_SETTINGS'),
							onPress: () => {
								Application.openSettings();
								resolve(UserAction.SETTINGS);
							},
						},
						{
							text: Loc.getMessage('MOBILE_GEO_PERMISSION_ALERT_CANCEL'),
							type: ButtonType.CANCEL,
							onPress: () => resolve(UserAction.CANCEL),
						},
					],
				);
			});
		}

		#waitForAppActive()
		{
			return new Promise((resolve) => {
				const handler = () => {
					BX.removeCustomEvent('onAppActive', handler);
					resolve();
				};

				BX.addCustomEvent('onAppActive', handler);
			});
		}
	}

	Geo.propTypes = {
		accuracy: PropTypes.oneOf(Object.values(GeoAccuracy)),
		shouldShowAlert: PropTypes.bool,
		shouldShowUnavailableAlert: PropTypes.bool,
	};

	module.exports = {
		Geo,
		GeoAccuracy,
		GeoStatus,
	};
});
