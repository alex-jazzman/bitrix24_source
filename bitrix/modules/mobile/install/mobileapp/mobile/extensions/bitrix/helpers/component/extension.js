/**
 * @module helpers/component
 */
jn.define('helpers/component', (require, exports, module) => {

	/**
	 * @class ComponentHelper
	 */
	class ComponentHelper
	{
		/**
		 *
		 * @param options - parameters
		 * @param options.name - name of component (display in debugger)
		 * @param options.version - name of component (display in debugger)
		 * @param options.object - name of list object
		 * @param options.canOpenInDefault - if true component is can be opened in default navigation stack
		 * @param options.widgetParams - parameters of list widget
		 * @param options.componentParams - parameters of component which will be available thought BX.componentsParameters
		 *
		 */
		static openList(options = {})
		{
			const canOpenInDefault = options.canOpenInDefault || false;
			const widgetParams = {
				name: 'list',
				settings: {
					...options.widgetParams,
					objectName: options.object,
				},
			};
			PageManager.openComponent(
				'JSStackComponent',
				{
					scriptPath: `/mobileapp/jn/${options.name}/?version=${options.version}`,
					componentCode: options.name,
					canOpenInDefault,
					params: options.componentParams,
					rootWidget: widgetParams,
				},
			);
		}

		/**
		 *
		 * @param options - parameters
		 * @param options.name - name of component (display in debugger)
		 * @param options.version - name of component (display in debugger)
		 * @param options.object - name of list object
		 * @param options.widgetParams - parameters of list widget
		 * @param options.componentParams - parameters of component which will be available thought BX.componentsParameters
		 *
		 */
		static openForm(options = {})
		{
			const widgetParams = {
				name: 'form',
				settings: {
					...options.widgetParams,
					objectName: options.object,
				},
			};
			PageManager.openComponent(
				'JSStackComponent',
				{
					scriptPath: `/mobileapp/jn/${options.name}/?version=${options.version}`,
					componentCode: options.name,
					params: options.componentParams,
					rootWidget: widgetParams,
				},
			);
		}

		/**
		 * @param options - parameters
		 * @param options.name - name of component (display in debugger)
		 * @param options.version - name of component (display in debugger)
		 * @param options.object - name of list object
		 * @param options.widgetParams - parameters of list widget
		 * @param options.canOpenInDefault - parameter to allow opening in default navigation stack
		 * @param options.componentParams - parameters of component which will be available thought BX.componentsParameters
		 * @param parentWidget
		 */
		static openLayout(options = {}, parentWidget = null)
		{
			if (!options.name)
			{
				throw new Error('Component name is empty.');
			}

			let version = options.version;
			if (!version)
			{
				version = (availableComponents[options.name] && availableComponents[options.name].version) || '1.0';
			}

			const widgetParams = {
				name: 'layout',
				settings: {
					...options.widgetParams,
					objectName: 'layout',
				},
			};

			PageManager.openComponent(
				'JSStackComponent',
				{
					scriptPath: `/mobileapp/jn/${options.name}/?version=${version}`,
					componentCode: options.name,
					canOpenInDefault: Boolean(options.canOpenInDefault),
					params: options.componentParams,
					rootWidget: widgetParams,
				},
				parentWidget,
			);
		}
	}

	module.exports = {
		ComponentHelper,
	};
});

(() => {
	const { ComponentHelper } = jn.require('helpers/component');

	this.ComponentHelper = ComponentHelper;
})();
