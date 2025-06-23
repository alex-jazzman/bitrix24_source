/**
 * @module im/messenger/controller/dialog/lib/configurator/configurator
 */
jn.define('im/messenger/controller/dialog/lib/configurator/configurator', (require, exports, module) => {
	const { Type } = require('type');
	const { mergeImmutable, get } = require('utils/object');

	const { getLogger } = require('im/messenger/lib/logger');

	const {
		defaultConfig,
		baseDialogConfig,
	} = require('im/messenger/controller/dialog/lib/configurator/configuration');

	const logger = getLogger('dialog--configurator');

	class DialogConfigurator
	{
		/**
		 * @param {?ChatIntegrationSettings} integrationSettings
		 */
		constructor(integrationSettings = {})
		{
			/** @type ChatIntegrationSettings */
			this.config = mergeImmutable(defaultConfig, integrationSettings);
			/** @type ChatIntegrationSettings */
			this.baseConfig = baseDialogConfig;

			this.loadedControllers = new Set([
				baseDialogConfig.header.title.controller.extensionName,
				baseDialogConfig.header.buttons.controller.extensionName,
				baseDialogConfig.message.contextMenu.controller.extensionName,
			]);
		}

		/**
		 * @return {RelatedEntityData}
		 */
		getRelatedEntity()
		{
			return this.config.relatedEntity;
		}

		/**
		 * @return {JNWidgetTitleParams}
		 */
		getHeaderTitleParams()
		{
			return this.config.header.title.params;
		}

		/**
		 * @return {Promise<DialogHeaderTitle>}
		 */
		async getHeaderTitleControllerClass()
		{
			return this.getControllerClass('header.title.controller');
		}

		/**
		 * @return {Promise<IDialogHeaderButtons>}
		 */
		async getHeaderButtonsControllerClass()
		{
			return this.getControllerClass('header.buttons.controller');
		}

		/**
		 * @return {Promise<IMessageContextMenu>}
		 */
		async getMessageContextMenuControllerClass()
		{
			return this.getControllerClass('message.contextMenu.controller');
		}

		checkIsHeaderTitleControllerClassLoaded()
		{
			const { extensionName } = this.getControllerConfigByPath('header.title.controller');

			return this.checkIsControllerLoaded(extensionName);
		}

		checkIsHeaderButtonControllerClassLoaded()
		{
			const { extensionName } = this.getControllerConfigByPath('header.buttons.controller');

			return this.checkIsControllerLoaded(extensionName);
		}

		checkIsMessageContextMenuControllerClassLoaded()
		{
			const { extensionName } = this.getControllerConfigByPath('message.contextMenu.controller');

			return this.checkIsControllerLoaded(extensionName);
		}

		get isSidebarEnabled()
		{
			return this.config.sidebar.enabled;
		}

		/**
		 * @private
		 * @param extensionName
		 * @return {boolean}
		 */
		checkIsControllerLoaded(extensionName)
		{
			return this.loadedControllers.has(extensionName);
		}

		/**
		 * @private
		 * @param controllerConfigPath
		 * @return {ChatIntegrationControllerConfig}
		 */
		getControllerConfigByPath(controllerConfigPath)
		{
			const {
				extensionName,
			} = get(this.config, controllerConfigPath, null);
			const config = Type.isStringFilled(extensionName) ? this.config : this.baseConfig;

			return get(config, controllerConfigPath, null);
		}

		/**
		 * @private
		 * @param {string} controllerConfigPath
		 * @return {Promise<*>}
		 */
		async getControllerClass(controllerConfigPath)
		{
			// eslint-disable-next-line init-declarations
			let controller;
			try
			{
				const {
					extensionName,
				} = get(this.config, controllerConfigPath, null);
				const config = Type.isStringFilled(extensionName) ? this.config : this.baseConfig;

				controller = await this.getControllerClassByConfig(config, controllerConfigPath);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.getControllerClass error: `, error);

				controller = await this.getControllerClassByConfig(this.baseConfig, controllerConfigPath);
			}

			return controller;
		}

		/**
		 * @private
		 * @param {ChatIntegrationSettings} config
		 * @param {string} controllerConfigPath
		 * @return {Promise<*>}
		 */
		async getControllerClassByConfig(config, controllerConfigPath)
		{
			const {
				className,
				extensionName,
			} = get(config, controllerConfigPath, null);

			if (this.loadedControllers.has(extensionName))
			{
				const extensionWithoutNamespace = extensionName.replace(':', '/');
				const controller = require(extensionWithoutNamespace)[className];

				logger.log('DialogConfigurator.getControllerClassByConfig() already loaded', controllerConfigPath, config, controller);

				return controller;
			}

			const controller = (await requireLazy(extensionName, false))[className];
			this.loadedControllers.add(extensionName);

			logger.log('DialogConfigurator.getControllerClassByConfig() loaded', controllerConfigPath, config, controller);

			return controller;
		}
	}

	module.exports = {
		DialogConfigurator,
	};
});
