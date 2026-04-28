/**
 * @module im/messenger/provider/services/connection/service
 */
jn.define('im/messenger/provider/services/connection/service', (require, exports, module) => {
	const { Type } = require('type');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Logger } = require('im/messenger/lib/logger');
	const {
		AppStatus,
		ConnectionStatus,
	} = require('im/messenger/const');

	const DEVICE_CONNECTION_STATUS_CHANGED_EVENT = 'connectionStatusChanged';
	const STATUS_CHANGED_EVENT = 'statusChanged';

	/**
	 * @class ConnectionService
	 */
	class ConnectionService
	{
		/**
		 * @param {object} [options]
		 * @param {object} [options.device]
		 */
		constructor(options = {})
		{
			this.device = options.device || device;
			this.eventEmitter = new JNEventEmitter();
			this.handleStatusChanged = this.statusChangedHandler.bind(this);

			if (Type.isFunction(this.device.getConnectionStatus))
			{
				this.device.on(DEVICE_CONNECTION_STATUS_CHANGED_EVENT, this.handleStatusChanged);
			}
		}

		destructor()
		{
			if (Type.isFunction(this.device.getConnectionStatus))
			{
				this.device.off(DEVICE_CONNECTION_STATUS_CHANGED_EVENT, this.handleStatusChanged);
			}
		}

		/**
		 * @return {boolean}
		 */
		isOnline()
		{
			return this.getStatus() === ConnectionStatus.online;
		}

		/**
		 * @param {function(ConnectionStatus.online|ConnectionStatus.offline): void} handler
		 * @return {this}
		 */
		onStatusChanged(handler)
		{
			this.eventEmitter.on(STATUS_CHANGED_EVENT, handler);

			return this;
		}

		/**
		 * @param {function(ConnectionStatus.online|ConnectionStatus.offline): void} handler
		 * @return {this}
		 */
		offStatusChanged(handler)
		{
			this.eventEmitter.off(STATUS_CHANGED_EVENT, handler);

			return this;
		}

		/**
		 * @return {ConnectionStatus.online|ConnectionStatus.offline}
		 */
		getStatus()
		{
			if (Type.isFunction(this.device.getConnectionStatus))
			{
				return this.device.getConnectionStatus();
			}

			Logger.warn('ConnectionService: device.getConnectionStatus() is not supported.');

			return ConnectionStatus.online;
		}

		updateStatus()
		{
			const status = this.getStatus();

			this.statusChangedHandler(status);
		}

		/**
		 * @private
		 * @param {ConnectionStatus.online|ConnectionStatus.offline} status
		 */
		statusChangedHandler(status)
		{
			switch (status)
			{
				case ConnectionStatus.online:
					serviceLocator.get('core').setAppStatus(AppStatus.networkWaiting, false);
					break;

				case ConnectionStatus.offline:
					serviceLocator.get('core').setAppStatus(AppStatus.networkWaiting, true);
					break;

				default:
					Logger.error('ConnectionService: unknown connection status: ', status);
					break;
			}

			this.eventEmitter.emit(STATUS_CHANGED_EVENT, [status]);
		}
	}

	module.exports = {
		ConnectionService,
	};
});
