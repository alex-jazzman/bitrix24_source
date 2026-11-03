/**
 * @module background/ui-manager
 */
jn.define('background/ui-manager', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const BackgroundUIManagerEvents = {
		tryToOpenComponentFromAnotherContext: 'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
		openComponentInAnotherContext: 'BackgroundUIManager::openComponentInAnotherContext',
		onCloseActiveComponent: 'BackgroundUIManager::onCloseActiveComponent',
	};

	/**
	 * @class BackgroundUIManager
	 * Manager for background context that allows to open only
	 * one component at a time on application initialization.
	 */
	class BackgroundUIManager
	{
		constructor()
		{
			this.currentComponent = null;
			this.pendingComponent = null;

			this.defaultDebounce = 3000;
			this.isComponentOpened = false;
			this.openComponentInAnotherContext = this.openComponentInAnotherContext.bind(this);
			this.onCloseActiveComponent = this.onCloseActiveComponent.bind(this);
			this.openComponentCallback = this.openComponentCallback.bind(this);

			this.bindEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent(
				BackgroundUIManagerEvents.tryToOpenComponentFromAnotherContext,
				(data) => {
					const {
						componentName = null,
						priority = 0,
						debounceMs = null,
					} = data;

					if (componentName)
					{
						this.openComponent(
							componentName,
							this.openComponentInAnotherContext,
							priority,
							debounceMs,
						);
					}
				},
			);

			BX.addCustomEvent(
				BackgroundUIManagerEvents.onCloseActiveComponent,
				this.onCloseActiveComponent,
			);
		}

		openComponentInAnotherContext()
		{
			if (this.currentComponent)
			{
				BX.postComponentEvent(
					BackgroundUIManagerEvents.openComponentInAnotherContext,
					[
						this.currentComponent.componentName,
					],
				);
			}
		}

		openComponentCallback()
		{
			if (!this.currentComponent || this.isComponentOpened)
			{
				return;
			}

			const componentName = this.currentComponent.componentName;
			if (!componentName)
			{
				return;
			}

			const componentWasOpened = window?.backgroundUiManager?.[componentName];

			if (this.currentComponent.openCallback && !componentWasOpened)
			{
				this.isComponentOpened = true;
				this.currentComponent.openCallback();
				window.backgroundUiManager = window.backgroundUiManager || {};
				window.backgroundUiManager[componentName] = true;
			}
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		canOpenComponentInBackground()
		{
			return this.currentComponent === null;
		}

		/**
		 * @public
		 */
		onCloseActiveComponent()
		{
			const closedComponentName = this.currentComponent?.componentName;

			this.isComponentOpened = false;
			window.backgroundUiManager = window.backgroundUiManager || {};
			window.backgroundUiManager[closedComponentName] = null;
			this.currentComponent = null;

			this.openPendingComponent();
		}

		openPendingComponent()
		{
			if (!this.pendingComponent)
			{
				return;
			}

			this.currentComponent = this.pendingComponent;
			this.pendingComponent = null;

			this.scheduleOpenComponent(
				this.currentComponent.componentName,
				this.currentComponent.debounceMs,
			);
		}

		scheduleOpenComponent(componentName, debounceMs)
		{
			const delay = typeof debounceMs === 'number' ? debounceMs : this.defaultDebounce;

			this.lastScheduledName = componentName;

			const debounced = debounce(() => {
				if (this.lastScheduledName !== componentName)
				{
					return;
				}

				this.openComponentCallback();
			}, delay, this);

			debounced();
		}

		enqueueComponent(component)
		{
			if (
				this.currentComponent?.componentName === component.componentName
				|| this.pendingComponent?.componentName === component.componentName
			)
			{
				return;
			}

			if (!this.pendingComponent || this.pendingComponent.priority < component.priority)
			{
				this.pendingComponent = component;
			}
		}

		/**
		 * @public
		 * @param {string} componentName
		 * @param {function} openCallback
		 * @param {number} priority
		 * @param {number} [debounceMs=3000]
		 * @param {object} [options]
		 * @param {boolean} [options.enqueueIfBusy=false]
		 */
		openComponent(componentName, openCallback, priority, debounceMs, options = {})
		{
			const component = {
				componentName,
				openCallback,
				priority,
				debounceMs,
			};

			if (
				this.canOpenComponentInBackground()
				|| (
					this.currentComponent !== null
					&& this.isComponentOpened === false
					&& this.currentComponent.priority < priority
				)
			)
			{
				this.currentComponent = component;
				this.scheduleOpenComponent(componentName, debounceMs);

				return;
			}

			if (options.enqueueIfBusy === true)
			{
				this.enqueueComponent(component);
			}
		}
	}

	module.exports = {
		BackgroundUIManager: new BackgroundUIManager(),
	};
});
