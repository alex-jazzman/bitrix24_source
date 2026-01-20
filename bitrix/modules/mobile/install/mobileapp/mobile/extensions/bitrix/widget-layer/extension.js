/**
 * @module widget-layer
 */
jn.define('widget-layer', (require, exports, module) => {
	class WidgetLayer extends LayoutComponent
	{
		#component = null;
		#widgetLayer = null;

		/**
		 * @param {Object} props
		 * @param {LayoutComponent} props.component
		 * @returns {Promise<WidgetLayer>}
		 */
		static async open(props)
		{
			const widget = new WidgetLayer(props);

			if (props.component)
			{
				widget.setComponent(props.component);
			}

			await widget.show();

			return widget;
		}

		/**
		 * @returns {Promise<Function>}
		 */
		async createLayer()
		{
			if (this.#widgetLayer)
			{
				return this.#widgetLayer;
			}

			try
			{
				this.#widgetLayer = await uicomponent.createWidgetLayer('layout', { backdrop: {} });

				return this.#widgetLayer;
			}
			catch (error)
			{
				console.error(error);
				throw error;
			}
		}

		setComponent(component)
		{
			this.#component = component;
		}

		async show()
		{
			await this.close();

			await this.createLayer();
			await uicomponent.widgetLayer().show();
			this.#widgetLayer.showComponent(this.#component);
		}

		/**
		 * @returns {Promise<void>}
		 */
		close = async () => {
			await uicomponent.widgetLayer()?.close().catch(console.error);

			this.#widgetLayer = null;
		};

		hide = () => {
			return uicomponent.widgetLayer()?.hide();
		};

		getLayoutManager = () => {
			return this.#widgetLayer;
		};
	}

	module.exports = {
		WidgetLayer,
	};
});
