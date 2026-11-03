/**
 * @module in-app-url/widget-presenter
 */
jn.define('in-app-url/widget-presenter', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { prepareHexColor } = require('utils/color');
	const { WidgetOpener } = require('widget-opener');
	const { Presentation } = require('in-app-url/presentation');

	/**
	 * Presents a widget applying the given Presentation (modal stack or current stack).
	 */
	class WidgetPresenter
	{
		constructor()
		{
			/** @type {Presentation} */
			this.presentation = Presentation.LAYOUT;
			/** @type {PageManager} */
			this.parentWidget = PageManager;
			/** @type {LayoutComponent|function|null} */
			this.component = null;
			/** @type {?WidgetPresenterNamedComponent} */
			this.namedComponent = null;
			/** @type {string} */
			this.widgetName = 'layout';
			/** @type {?Array<Record<string, unknown>>} */
			this.tabsItems = null;
			/** @type {?Record<string, unknown>} */
			this.tabsBackgroundLayout = null;
			/** @type {?boolean} */
			this.tabsGrabTitle = null;
			/** @type {?function(LayoutWidget): void} */
			this.onReadyCallback = null;
			/** @type {?TitleParams} */
			this.titleParams = null;
			/** @type {?string} */
			this.backgroundColor = null;
			/** @type {boolean} */
			this.canOpenInDefault = false;
			/** @type {BaseWidgetSettings} */
			this.widgetSettings = {};
		}

		/**
		 * @param {Record<string, unknown>} [context]
		 * @return {WidgetPresenter}
		 */
		static fromContext(context = {})
		{
			const opener = new WidgetPresenter();

			opener.presentation = Presentation.resolve(context?.presentation, Presentation.LAYOUT);

			if (context && context.parentWidget)
			{
				opener.parentWidget = context.parentWidget;
			}

			return opener;
		}

		/**
		 * @param {Presentation} presentation
		 * @return {WidgetPresenter}
		 */
		setPresentation(presentation)
		{
			if (!(presentation instanceof Presentation))
			{
				throw new TypeError('presentation must be an instance of Presentation');
			}

			this.presentation = presentation;

			return this;
		}

		/**
		 * @param {LayoutComponent|function(LayoutWidget): LayoutComponent} component
		 * @return {WidgetPresenter}
		 */
		setComponent(component)
		{
			this.component = component;

			return this;
		}

		/**
		 * @param {string} name
		 * @param {WidgetPresenterComponentOptions} [options]
		 * @return {WidgetPresenter}
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
		 * @param {Array<Record<string, unknown>>} items
		 * @param {WidgetPresenterTabsOptions} [options]
		 * @return {WidgetPresenter}
		 */
		setTabs(items, { backgroundLayout, grabTitle } = {})
		{
			this.widgetName = 'tabs';
			this.tabsItems = items;

			if (backgroundLayout !== undefined)
			{
				this.tabsBackgroundLayout = backgroundLayout;
			}

			if (grabTitle !== undefined)
			{
				this.tabsGrabTitle = grabTitle;
			}

			return this;
		}

		/**
		 * @param {function(LayoutWidget): void} callback
		 * @return {WidgetPresenter}
		 */
		onReady(callback)
		{
			this.onReadyCallback = callback;

			return this;
		}

		/**
		 * @param {string} title
		 * @return {WidgetPresenter}
		 */
		setTitle(title)
		{
			if (!Type.isString(title))
			{
				throw new TypeError('title must be a string');
			}

			this.titleParams = {
				...this.titleParams,
				text: title,
			};

			return this;
		}

		/**
		 * @param {TitleParams} titleParams
		 * @return {WidgetPresenter}
		 */
		setTitleParams(titleParams)
		{
			this.titleParams = titleParams;

			return this;
		}

		/**
		 * @param {BaseWidgetSettings} settings
		 * @return {WidgetPresenter}
		 */
		setWidgetSettings(settings = {})
		{
			this.widgetSettings = { ...this.widgetSettings, ...settings };

			return this;
		}

		/**
		 * @param {string|Color} color
		 * @return {WidgetPresenter}
		 */
		setBackgroundColor(color)
		{
			this.backgroundColor = this.#prepareColor(color);

			return this;
		}

		/**
		 * @param {PageManager} parentWidget
		 * @return {WidgetPresenter}
		 */
		setParentWidget(parentWidget)
		{
			this.parentWidget = parentWidget;

			return this;
		}

		/**
		 * @param {boolean} [value=true]
		 * @return {WidgetPresenter}
		 */
		setCanOpenInDefault(value = true)
		{
			this.canOpenInDefault = Boolean(value);

			return this;
		}

		/**
		 * @return {Promise}
		 */
		open()
		{
			const hasNamedComponent = this.namedComponent !== null;
			const hasComponent = this.component !== null;
			const hasTabs = this.tabsItems !== null;

			if (!hasNamedComponent && !hasComponent && !hasTabs)
			{
				return Promise.reject(new Error(
					'WidgetPresenter: nothing to open - call setComponent(), setComponentName() or setTabs()',
				));
			}

			const opener = new WidgetOpener()
				.setParentWidget(this.parentWidget)
				.setWidgetName(this.widgetName)
				.setWidgetSettings(this.#buildSettings())
				.setCanOpenInDefault(this.canOpenInDefault);

			if (this.onReadyCallback)
			{
				opener.onReady(this.onReadyCallback);
			}

			if (hasNamedComponent)
			{
				const { name, version, componentParams } = this.namedComponent;
				opener.setComponentName(name, { version, componentParams });
			}
			else if (hasComponent)
			{
				opener.setComponent(this.component);
			}

			return opener.open();
		}

		/**
		 * @return {BaseWidgetSettings}
		 */
		#buildSettings()
		{
			const settings = { ...this.widgetSettings };

			if (this.titleParams)
			{
				settings.titleParams = this.titleParams;
				if (Type.isStringFilled(this.titleParams.text))
				{
					settings.title = this.titleParams.text;
				}
			}

			if (this.backgroundColor)
			{
				settings.backgroundColor = this.backgroundColor;
			}

			if (this.tabsItems !== null)
			{
				settings.tabs = { items: this.tabsItems };

				if (this.tabsBackgroundLayout !== null)
				{
					settings.backgroundLayout = this.tabsBackgroundLayout;
				}

				if (this.tabsGrabTitle !== null)
				{
					settings.grabTitle = this.tabsGrabTitle;
				}
			}

			if (this.presentation.isModal())
			{
				Object.assign(settings, this.presentation.getModalSettings());
			}

			return settings;
		}

		/**
		 * @param {string|Color} color
		 * @return {string}
		 */
		#prepareColor(color)
		{
			if (!Type.isStringFilled(color) && !Color.has(color))
			{
				throw new TypeError('backgroundColor must be a filled string or a Color token');
			}

			return Type.isString(color) ? prepareHexColor(color) : color.toHex();
		}
	}

	module.exports = { WidgetPresenter };
});
