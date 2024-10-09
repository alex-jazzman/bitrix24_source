import { ref } from 'ui.vue3';
import { Type, Loc } from 'main.core';
import fetchData from '../internal/fetch-data';

const fetchAlarmTime = 5000;

export const Content = {
	props: {
		defaultData: {
			type: Object,
			default: null,
		},
		blockId: {
			type: Number,
			required: true,
		},
		appId: {
			type: Number,
			default: 0,
		},
		fetchable: {
			type: Boolean,
			default: false,
		},
		clickable: {
			type: Boolean,
			default: false,
		},
	},

	data()
	{
		return {
			isFetching: false,
		};
	},

	methods: {
		fetch(params: {} = {})
		{
			if (!this.clickable || this.isFetching)
			{
				console.warn('Events is disabled now');
				return;
			}

			if (this.appId <= 0 || !this.fetchable)
			{
				console.warn('If you want fetch external data in widget - you must add application and handler');
				return;
			}

			this.isFetching = true;
			this.$bitrix.eventEmitter.emit('landing:widgetvue:startContentLoad');

			const timeout = setTimeout(() => {
				this.$bitrix.eventEmitter.emit('landing:widgetvue:onMessage', {
					message: Loc.getMessage('LANDING_WIDGETVUE_LOADER_TOO_LONG'),
				});
				this.$bitrix.eventEmitter.emit('landing:widgetvue:endContentLoad');
			}, fetchAlarmTime);

			fetchData(this.blockId, params)
				.then(data => {
					clearTimeout(timeout);
					this.$bitrix.eventEmitter.emit('landing:widgetvue:endContentLoad');
					this.$bitrix.eventEmitter.emit('landing:widgetvue:onHideMessage');
					this.isFetching = false;

					if (data && Object.keys(data).length > 0)
					{
						for (let code in data)
						{
							if (this[code] !== undefined)
							{
								this[code] = data[code];
							}
						}
					}
				});
		},

		openApplication(params: {} = {})
		{
			if (!this.clickable || this.isFetching)
			{
				console.info('Events is disabled now');
				return;
			}

			if (this.appId <= 0)
			{
				console.warn('If you want fetch external data in widget - you must add application and handler');
				return;
			}

			BX.rest.AppLayout.openApplication(
				this.appId,
				params,
			);
		},

		openPath(path: string)
		{
			if (!this.clickable || this.isFetching)
			{
				console.info('Events is disabled now');
				return;
			}

			const url = new URL(path, window.location.origin);
			if (url.origin === window.location.origin)
			{
				window.open(url.href, '_blank');
			}
		},
	},

	async setup(props)
	{
		if (props.appId <= 0 || !props.fetchable)
		{
			console.info('If you want fetch external data in widget - you must add application and handler');
			return;
		}

		const dataRefs = {};
		if (
			props.defaultData !== null
			&& Object.keys(props.defaultData).length > 0
		)
		{
			for (let code in props.defaultData)
			{
				dataRefs[code] = ref(props.defaultData[code]);
			}

			fetchData(props.blockId).then(data => {
				if (data && Type.isObject(data))
				{
					for (let code in data)
					{
						if (dataRefs[code])
						{
							dataRefs[code].value = data[code];
						}
					}
				}
			});
		}

		else
		{
			const data = await fetchData(props.blockId);
			for (let code in data)
			{
				dataRefs[code] = ref(data[code]);
			}
		}

		return dataRefs;
	},
};
