import { Type, Extension } from 'main.core';
import { MONITORING_METRICS } from '../const';

type BitrateEntry = {
	bitrate: number,
	kind?: string,
	contentType?: string,
};

export const calcBitrateSumFromArray = ({ bitrateArray }: { bitrateArray?: BitrateEntry[] }): number => {
	if (bitrateArray && Array.isArray(bitrateArray))
	{
		return bitrateArray.reduce((acc, currentValue) => acc + currentValue.bitrate || 0, 0);
	}

	return 0;
};

type TrackCount = {
	video: number,
	audio: number,
};

export const getDefaultValueMonitoringMetric = (key: string): TrackCount | Array<number> => {
	if (key === 'COUNT_TRACKS')
	{
		return { video: 0, audio: 0 };
	}

	return [];
};

type MonitoringMetricsDefaults = {
	[string]: TrackCount | Array<number>,
};

export const fillDefaultValueMonitoringMetrics = (): MonitoringMetricsDefaults => {
	return Object.entries(MONITORING_METRICS).reduce((acc, [key, value]) => {
		acc[value] = getDefaultValueMonitoringMetric(key);

		return acc;
	}, {});
};

// TODO: delete in the future
export const checkMetricsFeatureAndExecutionCallback = (callback: () => void): void => {
	if (Type.isFunction(callback) && Extension.getSettings('call.core')?.isMetricsEnabled)
	{
		callback();
	}
};

export const sendMonitoringData = (data: string, url: string, token?: string): void => {
	if (!url)
	{
		return;
	}

	const xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-Type', 'application/json');

	if (token)
	{
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
	}

	xhr.send(data);
};
