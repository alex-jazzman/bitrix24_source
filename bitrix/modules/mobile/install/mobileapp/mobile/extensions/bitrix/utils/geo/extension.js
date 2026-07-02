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

	/**
	 * @typedef {Object} GeoResult
	 * @property {GeoStatus} status
	 * @property {number} [latitude]
	 * @property {number} [longitude]
	 * @property {GeoAccuracy} [accuracy]
	 */
	class Geo
	{
		#accuracy;
		#shouldShowAlert;

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
		 * @param {Object} [props={}]
		 * @param {GeoAccuracy} [props.accuracy=GeoAccuracy.PRECISE]
		 * @param {boolean} [props.shouldShowAlert=true]
		 */
		constructor(props = {})
		{
			PropTypes.validate(Geo.propTypes, props, 'Geo');

			this.#accuracy = props.accuracy ?? GeoAccuracy.PRECISE;
			this.#shouldShowAlert = props.shouldShowAlert ?? true;
		}

		/**
		 * @return {Promise<GeoResult>}
		 */
		async requestPosition()
		{
			const result = await this.#getLocation();

			if (
				result.status === GeoStatus.DENIED
				&& this.#shouldShowAlert
				&& !result.isFreshDenial
				&& await this.#showPermissionAlert() === UserAction.SETTINGS
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
							latitude: position.latitude,
							longitude: position.longitude,
							accuracy: position.accuracy,
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

		#showPermissionAlert()
		{
			return new Promise((resolve) => {
				Alert.confirm(
					Loc.getMessage('MOBILE_GEO_PERMISSION_ALERT_TITLE'),
					Loc.getMessage('MOBILE_GEO_PERMISSION_ALERT_DESCRIPTION'),
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
	};

	module.exports = {
		Geo,
		GeoAccuracy,
		GeoStatus,
	};
});
