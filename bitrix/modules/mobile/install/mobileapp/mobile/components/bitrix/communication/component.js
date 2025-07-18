'use strict';

(() => {
	const require = (ext) => jn.require(ext);
	const { EntityReady } = require('entity-ready');
	const { AvaMenu } = require('ava-menu');
	const { Type } = require('type');

	if (typeof window.SocketConnection === 'undefined')
	{
		window.SocketConnection = new Connection();
		// EntityReady.wait('chat').then(() => this.SocketConnection.start());
		setTimeout(() => window.SocketConnection.start(), 0);
	}
	else
	{
		window.SocketConnection.disconnect(1000, 'restart');
		window.SocketConnection = new Connection();
		setTimeout(() => {
			window.SocketConnection.start();
			// EntityReady.wait('chat').then(() => window.SocketConnection.start());
		}, 2000);
	}

	class AppCounters
	{
		constructor()
		{
			this.total = 0;
			this.firstSetBadge = true;

			this.applicationCounterConfig = {};

			this.tabNameMapConfigName = {
				stream: 'socialnetwork_livefeed',
				chats: 'im_messenger',
				copilot: 'im_messenger',
				openlines: 'im_messenger',
				notifications: 'im_notify',
				tasks_total: 'tasks_total',
				crm_all_no_orders: 'crm_all_no_orders',
				crm_activity_current_calltracker: 'crm_activity_current_calltracker',
				calendar: 'calendar',
				menu_invite: 'menu_invite',
				menu_tab_presets: 'menu_tab_presets',
				menu_disk_tabs: 'menu_disk_tabs',
			};

			this.userCounterMapTabName = {
				'**': 'livefeed',
				bp_workflow: 'bp_tasks',
				im: 'messages',
				tasks_total: 'tasks_total',
				crm_all_no_orders: 'crm_all_no_orders',
				crm_activity_current_calltracker: 'crm_activity_current_calltracker',
				calendar: 'calendar',
				menu_invite: 'menu_invite',
				menu_tab_presets: 'menu_tab_presets',
				menu_disk_tabs: 'menu_disk_tabs',
			};

			this.tabNameMapOldUserCounter = {
				bp_tasks: 'bp_tasks',
			};

			this.avaMenuCounterMapName = {
				calendar: 'calendar',
			};

			this.sharedStorage = Application.sharedStorage();

			const counters = this.sharedStorage.get('counters');
			this.counters = counters ? JSON.parse(counters) : {};

			const userCounters = this.sharedStorage.get('userCounters');
			this.userCounters = userCounters ? JSON.parse(userCounters) : {};

			const userCountersDates = this.sharedStorage.get('userCountersDates');
			this.userCountersDates = userCountersDates ? JSON.parse(userCountersDates) : {};

			BX.addCustomEvent('onUpdateConfig', this.onUpdateApplicationCounterConfig.bind(this));
			BX.addCustomEvent('onSetUserCounters', this.onSetUserCounters.bind(this));
			BX.addCustomEvent('onClearLiveFeedCounter', this.onClearLiveFeedCounter.bind(this));
			BX.addCustomEvent('onPullEvent-main', this.onPullEvent.bind(this));
			BX.addCustomEvent('requestUserCounters', this.requestUserCounters.bind(this));

			BX.addCustomEvent('requestCounters', this.requestCounters.bind(this));
			BX.addCustomEvent('ImRecent::counter::list', this.onUpdateBadges.bind(this));

			this.updateCacheTimeout = 500;

			this.databaseMessenger = new ReactDatabase(ChatDatabaseName, CONFIG.USER_ID, CONFIG.LANGUAGE_ID, CONFIG.SITE_ID);

			this.loadFromCache();

			BX.addCustomEvent('onAppActive', () => this.update());
		}

		onSetUserCounters(counters, time)
		{
			let startTime = null;
			const siteId = CONFIG.SITE_ID;

			if (
				time
				&& typeof this.userCounters[siteId] === 'object'
				&& typeof this.userCountersDates[siteId] === 'object'
			)
			{
				startTime = time.start * 1000;

				for (const counterName in this.userCountersDates[siteId])
				{
					if (!this.userCountersDates[siteId].hasOwnProperty(counterName))
					{
						continue;
					}

					if (
						typeof counters[siteId] === 'undefined'
						|| typeof counters[siteId][counterName] === 'undefined'
					)
					{
						continue;
					}

					if (this.userCountersDates[siteId][counterName] <= startTime)
					{
						delete this.userCounters[siteId][counterName];
						delete this.userCountersDates[siteId][counterName];
					}
				}
			}

			this.onUpdateUserCounters(counters, startTime);
		}

		onClearLiveFeedCounter(params)
		{
			const siteId = CONFIG.SITE_ID;
			if (!(
				BX.type.isNotEmptyString(params.counterCode)
				&& typeof params.serverTimeUnix !== 'undefined'
				&& typeof this.userCounters[siteId] === 'object'
				&& typeof this.userCountersDates[siteId] === 'object'
			))
			{
				return false;
			}

			const startTime = params.serverTimeUnix * 1000;

			if (this.userCountersDates[siteId][params.counterCode] <= startTime)
			{
				delete this.userCounters[siteId][params.counterCode];
				delete this.userCountersDates[siteId][params.counterCode];
			}

			const counters = {};
			counters[siteId] = {};
			counters[siteId][params.counterCode] = 0;

			this.onUpdateUserCounters(counters, startTime);

			return true;
		}

		onPullEvent(command, params, extra)
		{
			if (command == 'user_counter')
			{
				this.onUpdateUserCounters(params, extra.server_time_unix * 1000);
			}
		}

		onUpdateBadges(params, delay)
		{
			let needUpdate = false;

			for (const element in params)
			{
				if (!params.hasOwnProperty(element))
				{
					continue;
				}

				params[element] = Number(params[element]);

				if (Number.isNaN(params[element]))
				{
					continue;
				}

				if (this.counters[element] == params[element])
				{
					continue;
				}

				this.counters[element] = params[element];
				needUpdate = true;
			}

			if (needUpdate)
			{
				this.update(delay === false);
			}
		}

		onUpdateApplicationCounterConfig(config)
		{
			this.applicationCounterConfig = {};

			for (const counterName in config)
			{
				if (!config.hasOwnProperty(counterName))
				{
					continue;
				}

				this.applicationCounterConfig[counterName] = Boolean(config[counterName]);
			}

			this.update();
		}

		onUpdateUserCounters(counters, startTime)
		{
			const currentTime = Date.now();
			startTime = startTime || currentTime;

			const siteId = CONFIG.SITE_ID;

			if (typeof counters !== 'object' || typeof counters[siteId] !== 'object')
			{
				return false;
			}

			for (const counter in counters[siteId])
			{
				if (!counters[siteId].hasOwnProperty(counter))
				{
					continue;
				}

				counters[siteId][counter] = Number(counters[siteId][counter]);

				if (Number.isNaN(counters[siteId][counter]))
				{
					delete counters[siteId][counter];
					continue;
				}

				if (typeof this.userCountersDates[siteId] === 'undefined')
				{
					this.userCountersDates[siteId] = {};
				}

				if (typeof this.userCountersDates[siteId][counter] === 'undefined')
				{
					this.userCountersDates[siteId][counter] = startTime;
				}
				else
					if (this.userCountersDates[siteId][counter] >= startTime)
					{
						delete counters[siteId][counter];
					}
					else
					{
						this.userCountersDates[siteId][counter] = startTime;
					}
			}

			this.userCounters = Utils.objectMerge(this.userCounters, counters);

			let needUpdate = false;
			for (let userCounter in this.userCounterMapTabName)
			{
				if (!this.userCounterMapTabName.hasOwnProperty(userCounter))
				{
					continue;
				}

				const tabName = this.userCounterMapTabName[userCounter];

				if (typeof this.userCounters[siteId][userCounter] === 'undefined')
				{
					const oldUserCounter = this.tabNameMapOldUserCounter[tabName];
					if (typeof oldUserCounter === 'undefined')
					{
						continue;
					}

					if (typeof this.userCounters[siteId][oldUserCounter] === 'undefined')
					{
						continue;
					}

					userCounter = oldUserCounter;
				}

				const value = Number(this.userCounters[siteId][userCounter]);
				if (Number.isNaN(value))
				{
					delete this.userCounters[siteId][userCounter];
					continue;
				}

				if (this.counters[tabName] == value)
				{
					continue;
				}

				this.counters[tabName] = value;
				needUpdate = true;
			}

			if (needUpdate)
			{
				this.update(true);
			}
			else
			{
				this.updateCache();
			}

			BX.postComponentEvent('onUpdateUserCounters', [this.userCounters]);
			BX.postWebEvent('onUpdateUserCounters', this.userCounters);

			return true;
		}

		update(delay)
		{
			if (delay)
			{
				if (!this.updateCountersTimeout)
				{
					this.updateCountersTimeout = setTimeout(this.update.bind(this), 300);
				}

				return true;
			}

			clearTimeout(this.updateCountersTimeout);
			this.updateCountersTimeout = null;

			this.counters.messages = this.getMessagesCounter();
			const bpCounter = 0;
			this.counters.stream = this.counters.livefeed + bpCounter;

			this.total = Object.keys(this.counters)
				.filter((counterType) => this.isEnableApplicationCounterType(counterType))
				.reduce((currentTotal, key) => {
					const counter = Number(this.counters[key]);
					const value = Number.isNaN(counter) ? 0 : counter;

					return currentTotal + value;
				}, 0)
			;

			console.info(`AppCounters.update: update counters: ${this.total}\n`, this.counters);

			Application.setBadges(this.counters);

			if (!Application.isBackground())
			{
				Application.setIconBadge(this.total);
			}

			this.updateAvaMenu();

			this.updateCache();

			return true;
		}

		updateAvaMenu()
		{
			if (typeof AvaMenu === 'undefined')
			{
				return;
			}

			for (const [tabId, elemId] of Object.entries(this.avaMenuCounterMapName))
			{
				const counter = Number(this.counters[tabId]);
				const value = counter || 0;
				AvaMenu.setCounter({ elemId, value });
			}
		}


		getMessagesCounter()
		{
			let counter = this.counters.chats + this.counters.openlines;

			if (this.isEnableApplicationCounterType('notifications'))
			{
				counter += this.counters.notifications;
			}

			if (!Type.isUndefined(this.counters.copilot))
			{
				counter += this.counters.copilot;
			}

			return counter;
		}

		isEnableApplicationCounterType(tabName)
		{
			const counterName = this.tabNameMapConfigName[tabName];
			if (!counterName)
			{
				return false;
			}

			return this.applicationCounterConfig[counterName] === true;
		}

		loadFromCache()
		{
			this.databaseMessenger.table(ChatTables.notifyConfig).then((table) => {
				table.get().then((items) => {
					if (items.length <= 0)
					{
						this.update();

						return false;
					}

					const cacheData = JSON.parse(items[0].VALUE);
					for (const counterType of cacheData.counterTypes)
					{
						this.applicationCounterConfig[counterType.type] = counterType.value;
					}

					console.info('SettingsNotify.loadCache: config load from cache', cacheData.counterTypes);

					this.update();
				}).catch(() => {
					this.update();
				});
			});

			return true;
		}

		updateCache()
		{
			clearTimeout(this.refreshUserCounterTimeout);
			this.refreshUserCounterTimeout = setTimeout(() => {
				this.sharedStorage.set('counters', JSON.stringify(this.counters));
				this.sharedStorage.set('userCounters', JSON.stringify(this.userCounters));
				this.sharedStorage.set('userCountersDates', JSON.stringify(this.userCountersDates));
				console.info('AppCounters.updateCache: userCounters updated');
			}, this.updateCacheTimeout);

			return true;
		}

		requestCounters(params)
		{
			console.info('Counters.requestCounters:', params);

			if (params.component && params.component.toString().length > 0)
			{
				BX.postComponentEvent('onUpdateCounters', [this.counters], params.component);
			}

			if (params.web)
			{
				BX.postWebEvent('onUpdateCounters', this.counters);
			}
		}

		requestUserCounters(params)
		{
			console.info('Counters.requestUserCounters:', params);

			if (params.component && params.component.toString().length > 0)
			{
				BX.postComponentEvent('onUpdateUserCounters', [this.userCounters], params.component);
			}

			if (params.web)
			{
				BX.postWebEvent('onUpdateUserCounters', this.userCounters);
			}
		}
	}

	/**
	 * Auth restore
	 */

	class Authorization
	{
		constructor()
		{
			this.interval = 24 * 60 * 1000;
			this.intervalId = 0;
		}

		restore()
		{
			Application.auth(
				(result) => {
					console.info(
						(!result || result.status != 'success')
							? 'Authorization.restore: fail!'
							: 'Authorization.restore: success!',
					);
				},
			);
		}

		start()
		{
			if (typeof Application.auth === 'function')
			{
				console.info('Authorization.start: auth restore is active\n', this);
				this.intervalId = setInterval(this.restore, this.interval);
			}
		}

		stop()
		{
			clearTimeout(this.intervalId);
		}
	}

	if (window.Authorization && window.Authorization.stop)
	{
		window.Authorization.stop();
	}
	window.Authorization = new Authorization();
	window.Authorization.start();

	/**
	 *  Push notification registration
	 */
	const pushNotificationRegister = () => {
		if (window.registerSuccess)
		{
			return true;
		}
		const appId = (typeof Application.getPackageName === 'function' ? Application.getPackageName() : 'Bitrix24');
		const uuid = device.uuid;
		const model = device.model;
		if (typeof (Application.registerVoipNotifications) === 'function')
		{
			Application.registerVoipNotifications().then(({ token }) => {
				BX.ajax({
					url: `${env.siteDir}mobile/`,
					method: 'POST',
					dataType: 'json',
					tokenSaveRequest: true,
					data: {
						mobile_action: 'save_device_token',
						device_name: model,
						app_id: appId,
						uuid,
						device_token_voip: token,
						device_type: 'APPLE',
					},
				})
					.then((data) => console.log('save_device_token response', data))
					.catch((e) => console.error(e))
				;
			});
		}

		window.registerSuccess = true;

		Application.registerPushNotifications(
			(data) => {
				let dt = (Application.getPlatform() === 'ios'
					? 'APPLE'
					: 'GOOGLE/REV2'
				);

				let token = null;

				if (typeof data === 'object')
				{
					if (data.voipToken)
					{
						token = data.voipToken;
						dt = 'APPLE/VOIP';
					}
					else if (data.type && data.type === 'huawei')
					{
						token = data.token;
						dt = 'HUAWEI';
					}
					else if (data.token)
					{
						token = data.token;
					}
				}
				else
				{
					token = data;
				}

				BX.ajax({
					url: `${env.siteDir}mobile/`,
					method: 'POST',
					dataType: 'json',
					tokenSaveRequest: true,
					data: {
						mobile_action: 'save_device_token',
						device_name: model,
						uuid: uuid,
						device_token: token,
						app_id: appId,
						device_type: dt,
					},
				})
					.then((data) => console.log('save_device_token response', data))
					.catch((e) => console.error(e))
				;
			},
		);
	};

	EntityReady.wait('chat').then(() => pushNotificationRegister);
	setTimeout(pushNotificationRegister, 5000);

	/**
	 * Push handling
	 */

	const PushNotifications = {
		urlByTag(tag)
		{
			const link = (env.siteDir ? env.siteDir : '/');
			let result = false;
			const unique = false;
			const uniqueParams = {};

			let params = [];

			if (
				tag.slice(0, 10) == 'BLOG|POST|'
				|| tag.slice(0, 18) == 'BLOG|POST_MENTION|'
				|| tag.slice(0, 11) == 'BLOG|SHARE|'
				|| tag.slice(0, 17) == 'BLOG|SHARE2USERS|'
			)
			{
				params = tag.split('|');
				result = `${link}mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=BLOG_POST&ENTITY_ID=${params[2]}`;
			}
			else if (
				tag.slice(0, 13) == 'BLOG|COMMENT|'
				|| tag.slice(0, 21) == 'BLOG|COMMENT_MENTION|'
			)
			{
				params = tag.split('|');
				result = `${link}mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=BLOG_POST&ENTITY_ID=${params[2]}&commentId=${params[3]}#com${params[3]}`;
			}
			else if (
				tag.slice(0, 25) == 'XDIMPORT|COMMENT_MENTION|'
			)
			{
				params = tag.split('|');
				result = `${link}mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=LOG_ENTRY&ENTITY_ID=${params[2]}`;
			}
			else if (
				tag.slice(0, 11) === 'TASKS|TASK|'
				|| tag.slice(0, 14) === 'TASKS|COMMENT|'
			)
			{
				params = tag.split('|');

				const { Entry } = jn.require('tasks/entry');
				Entry.openTask({ id: params[2] }, { shouldOpenComments: params[1] === 'COMMENT' });
			}
			else if (tag.slice(0, 12) == 'SONET|EVENT|')
			{
				params = tag.split('|');
				result = `${link}mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=LOG_ENTRY&ENTITY_ID=${params[2]}`;
			}
			else if (tag.slice(0, 11) == 'DISK_GROUP|')
			{
				params = tag.split('|');
				result = `${link}mobile/?mobile_action=disk_folder_list&type=group&path=/&entityId=${params[1]}`;
			}
			else if (tag.startsWith('CALENDAR|INVITE'))
			{
				params = tag.split('|');
				result = `${link}mobile/calendar/view_event.php?event_id=${params[2]}`;
			}

			if (result)
			{
				result = {
					LINK: result,
					UNIQUE: unique,
					DATA: uniqueParams,
				};
			}

			return result;
		},
		handler()
		{
			const push = Application.getLastNotification();
			let pushParams = {};
			let data = null;
			if (typeof (push) !== 'object' || typeof (push.params) === 'undefined')
			{
				pushParams = { ACTION: 'NONE' };
			}

			if (typeof push.params !== 'undefined')
			{
				try
				{
					pushParams = JSON.parse(push.params);
				}
				catch
				{
					pushParams = { ACTION: push.params };
				}

				if (this.actions.includes(pushParams.ACTION))
				{
					data = this.urlByTag(pushParams.TAG);
				}
			}
			else if (push.id != null)
			{
				data = this.urlByTag(push.id);
			}

			if (data != null && typeof data.LINK !== 'undefined' && data.LINK.length > 0)
			{
				PageManager.openPage({
					url: data.LINK,
					unique: data.UNIQUE,
					data: data.DATA,
				});
			}
		},
		actions: ['post', 'tasks', 'comment', 'mention', 'share', 'share2users', 'sonet_group_event'],
		init()
		{
			this.handler(); // handle first start of the app
			BX.addCustomEvent('onAppActive', () => this.handler()); // listen for the app wake up
		},
	};

	PushNotifications.init();
	window.PushNotifications = PushNotifications;

	/**
	 * User Profile
	 */

	BX.addCustomEvent('onUserProfileOpen', (userId, options = {}) => {
		console.log('onUserProfileOpen', userId, options);

		let url = '/mobile/mobile_component/user.profile/?version=1';

		if (availableComponents && availableComponents['user.profile'])
		{
			url = availableComponents['user.profile'].publicUrl;
		}

		let backdropOptions = {};
		let isBackdrop = false;
		if (options.backdrop)
		{
			if (typeof options.backdrop === 'object' && options.backdrop)
			{
				backdropOptions = { backdrop: options.backdrop };
				isBackdrop = true;
			}
			else if (typeof options.backdrop === 'boolean' && options.backdrop)
			{
				backdropOptions = { backdrop: {} };
				isBackdrop = true;
			}
		}

		PageManager.openComponent(
			'JSStackComponent',
			{
				scriptPath: url,
				params: { userId, isBackdrop },
				canOpenInDefault: true,
				rootWidget: {
					name: 'list',
					groupStyle: true,
					settings: {
						objectName: 'form',
						groupStyle: true,
						...backdropOptions,
					},
				},
			},
		);
	});

	window.Counters = new AppCounters();
})();
