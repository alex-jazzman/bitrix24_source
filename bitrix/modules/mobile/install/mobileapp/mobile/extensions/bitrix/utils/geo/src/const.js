/**
 * @module utils/geo/src/const
 */
jn.define('utils/geo/src/const', (require, exports, module) => {
	const DEGREES_TO_RADIANS = Math.PI / 180;
	const EARTH_RADIUS_METERS = 6_371_000;
	const FRESH_DENIAL_THRESHOLD_MS = 1000;

	const GeoAccuracy = Object.freeze({
		PRECISE: 'precise',
		APPROXIMATE: 'approximate',
	});

	const GeoStatus = Object.freeze({
		SUCCESS: 'success',
		DENIED: 'denied',
		UNAVAILABLE: 'unavailable',
	});

	const NativeErrorCode = Object.freeze({
		PERMISSION_DENIED: 1,
		CANCELLED: 2,
		LOCATION_UNAVAILABLE: 3,
	});

	const UserAction = Object.freeze({
		SETTINGS: 'settings',
		CANCEL: 'cancel',
	});

	module.exports = {
		DEGREES_TO_RADIANS,
		EARTH_RADIUS_METERS,
		FRESH_DENIAL_THRESHOLD_MS,
		GeoAccuracy,
		GeoStatus,
		NativeErrorCode,
		UserAction,
	};
});
