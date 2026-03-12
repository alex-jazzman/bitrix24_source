import { Extension } from 'main.core';

export type CallCloudRecordOptions = {
	serviceEnabled?: boolean;
	tariffAvailable?: boolean;
	isCisRegion?: boolean;
	tariffSlider?: boolean;
};

export const CallCommonRecordState = {
	Started: 'started',
	Resumed: 'resumed',
	Paused: 'paused',
	Stopped: 'stopped',
	Destroyed: 'destroyed',
};

export const CallCommonRecordType = {
	None: 'none',
	Video: 'video',
	Audio: 'audio',
};

class CallCloudRecordClass
{
	constructor()
	{
		this.serviceEnabled = false;
		this.tariffAvailable = false;
		this.isCisRegion = false;
		this.tariffSlider = false;

		if (Extension.getSettings('call.core').cloudRecord)
		{
			this.setup(Extension.getSettings('call.core').cloudRecord);
		}
	}

	setup(options: CallCloudRecordOptions)
	{
		const { serviceEnabled, tariffAvailable, isCisRegion, tariffSlider } = options;

		if (serviceEnabled !== undefined)
		{
			this.serviceEnabled = serviceEnabled;
		}

		if (tariffAvailable !== undefined)
		{
			this.tariffAvailable = tariffAvailable;
		}

		if (isCisRegion !== undefined)
		{
			this.isCisRegion = isCisRegion;
		}

		if (tariffSlider !== undefined)
		{
			this.tariffSlider = tariffSlider;
		}
	}
}

export const CallCloudRecord = new CallCloudRecordClass();
