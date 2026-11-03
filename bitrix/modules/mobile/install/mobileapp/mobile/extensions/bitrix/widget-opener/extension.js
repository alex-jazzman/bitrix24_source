/**
 * @module widget-opener
 */
jn.define('widget-opener', (require, exports, module) => {
	const { Type } = require('type');
	const { isFunction } = require('utils/object');

	class WidgetOpener
	{
		constructor()
		{
			/** @type {PageManager} */
			this.parentWidget = PageManager;
			/** @type {string} */
			this.widgetName = 'layout';
			/** @type {BaseWidgetSettings} */
			this.widgetSettings = {};
			/** @type {LayoutComponent|function|null} */
			this.component = null;
			/** @type {?WidgetOpenerNamedComponent} */
			this.namedComponent = null;
			/** @type {boolean} */
			this.canOpenInDefault = false;
			/** @type {?function(LayoutWidget): void} */
			this.onReadyCallback = null;
		}

		/**
		 * @param {PageManager} parentWidget
		 * @return {WidgetOpener}
		 */
		setParentWidget(parentWidget)
		{
			this.parentWidget = parentWidget;

			return this;
		}

		/**
		 * @param {string} widgetName
		 * @return {WidgetOpener}
		 */
		setWidgetName(widgetName)
		{
			if (!Type.isStringFilled(widgetName))
			{
				throw new TypeError('widgetName must be a filled string');
			}

			this.widgetName = widgetName;

			return this;
		}

		/**
		 * @param {BaseWidgetSettings} settings
		 * @return {WidgetOpener}
		 */
		setWidgetSettings(settings = {})
		{
			this.widgetSettings = { ...this.widgetSettings, ...settings };

			return this;
		}

		/**
		 * @param {LayoutComponent|function(LayoutWidget): LayoutComponent} component
		 * @return {WidgetOpener}
		 */
		setComponent(component)
		{
			this.component = component;

			return this;
		}

		/**
		 * @param {string} name
		 * @param {WidgetOpenerComponentOptions} [options]
		 * @return {WidgetOpener}
		 */
		setComponentName(name, { version, componentParams } = {})
		{
			if (!Type.isStringFilled(name))
			{
				throw new TypeError('component name must be a filled string');
			}

			this.namedComponent = { name, version, componentParams };

			return this;
		}

		/**
		 * @param {boolean} [value=true]
		 * @return {WidgetOpener}
		 */
		setCanOpenInDefault(value = true)
		{
			this.canOpenInDefault = Boolean(value);

			return this;
		}

		/**
		 * @param {function(LayoutWidget): void} callback
		 * @return {WidgetOpener}
		 */
		onReady(callback)
		{
			this.onReadyCallback = callback;

			return this;
		}

		/**
		 * @return {Promise}
		 */
		open()
		{
			return this.namedComponent
				? this.#openNamedComponent()
				: this.#openWidget();
		}

		/**
		 * @return {Promise}
		 */
		#openNamedComponent()
		{
			if (this.onReadyCallback)
			{
				console.warn('WidgetOpener: onReady is not supported for named components and will be ignored');
			}

			const { name, version, componentParams } = this.namedComponent;

			PageManager.openComponent(
				'JSStackComponent',
				{
					scriptPath: this.#resolveScriptPath(name, version),
					componentCode: name,
					canOpenInDefault: this.canOpenInDefault,
					params: componentParams,
					rootWidget: {
						name: this.widgetName,
						settings: {
							...this.widgetSettings,
							objectName: this.widgetName,
						},
					},
				},
				this.parentWidget,
			);

			return Promise.resolve();
		}

		/**
		 * @param {string} name
		 * @param {string} [version]
		 * @return {string}
		 */
		#resolveScriptPath(name, version)
		{
			// eslint-disable-next-line no-undef
			const publicUrl = availableComponents[name]?.publicUrl;
			if (publicUrl)
			{
				return publicUrl;
			}

			console.warn(
				`WidgetOpener: component "${name}" is not registered (no publicUrl). `
				+ 'Add it to the "components" section of the extension deps.php so it gets bundled, '
				+ 'and mark it with //@keep so JaNativeTools does not remove it:\n'
				+ `\t'components' => [\n\t\t'${name}', //@keep\n\t],`,
			);

			return `/mobileapp/jn/${name}/?version=${this.#resolveVersion(name, version)}`;
		}

		/**
		 * @param {string} name
		 * @param {string} [version]
		 * @return {string}
		 */
		#resolveVersion(name, version)
		{
			// eslint-disable-next-line no-undef
			return version ?? availableComponents[name]?.version ?? '1.0';
		}

		/**
		 * @return {Promise}
		 */
		#openWidget()
		{
			if (
				this.widgetName === 'web'
				&& this.canOpenInDefault
				&& !this.component
				&& !this.onReadyCallback
				&& !this.widgetSettings.onReady
				&& !this.widgetSettings.onError
			)
			{
				PageManager.openComponent('JSStackComponent', {
					canOpenInDefault: true,
					rootWidget: {
						name: this.widgetName,
						settings: {
							...this.widgetSettings,
							objectName: this.widgetName,
						},
					},
				}, this.parentWidget);

				return Promise.resolve();
			}

			return this.parentWidget
				.openWidget(this.widgetName, this.widgetSettings)
				.then((widget) => {
					if (this.component)
					{
						widget.showComponent(
							isFunction(this.component) ? this.component(widget) : this.component,
						);
					}

					if (this.onReadyCallback)
					{
						this.onReadyCallback(widget);
					}

					return widget;
				});
		}
	}

	module.exports = { WidgetOpener };
});
