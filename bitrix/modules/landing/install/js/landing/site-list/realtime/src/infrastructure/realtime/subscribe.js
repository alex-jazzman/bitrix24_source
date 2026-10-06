import {Realtime} from 'landing.realtime';

export const subscribeToSiteChanged = (handler: Function): Function => {
	return Realtime.subscribe('site.changed', handler);
};
