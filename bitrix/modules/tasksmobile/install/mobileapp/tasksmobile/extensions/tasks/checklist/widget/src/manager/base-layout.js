/** @module tasks/checklist/widget/src/manager/base-layout */
jn.define('tasks/checklist/widget/src/manager/base-layout', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { outline } = require('assets/icons');
	const { PropTypes } = require('utils/validation');

	/** @abstract */
	class ChecklistBaseLayout
	{
		/** @param {ChecklistBottomSheetProps} props */
		constructor(props)
		{
			this.props = props;
			this.alert = null;
			this.layoutWidget = null;
			this.onPreventDismiss = false;
			this.handleOnSave = this.handleOnSave.bind(this);
			this.handleOnClose = this.handleOnClose.bind(this);
		}

		/** @param {ChecklistLayoutUpdateParams} params */
		update(params)
		{
			const { highlightMoreButton } = params;

			this.showMoreButton({ highlightMoreButton });
		}

		/** @abstract */
		close()
		{}

		/**
		 * @abstract
		 * @return {Promise}
		 */
		open()
		{}

		/**
		 * @private
		 * @return {string}
		 */
		getTitle()
		{
			return Loc.getMessage('TASKSMOBILE_LAYOUT_CHECKLIST_WIDGET_TITLE');
		}

		/** @return {PageManager} */
		getParentWidget()
		{
			const { parentWidget } = this.props;

			if (!parentWidget)
			{
				return null;
			}

			return parentWidget;
		}

		/** @return {Checklist} */
		getComponent()
		{
			const { component } = this.props;

			return component;
		}

		/**
		 * @protected
		 * @param {Object} layoutWidget
		 */
		setLayoutWidget(layoutWidget)
		{
			this.layoutWidget = layoutWidget;
		}

		/** @return {Object} */
		getLayoutWidget()
		{
			return this.layoutWidget;
		}

		/**
		 * @protected
		 * @param {JSStackNavigation} layoutWidget
		 */
		actionsAfterOpenWidget(layoutWidget)
		{
			const { focusedItemId, highlightMoreButton } = this.props;

			this.setLayoutWidget(layoutWidget);
			this.showMoreButton({ highlightMoreButton });

			if (focusedItemId)
			{
				this.onChange();
			}
		}

		/** @protected */
		showMoreButton({ highlightMoreButton } = {})
		{
			const { onShowMoreMenu } = this.props;

			if (!onShowMoreMenu)
			{
				return;
			}

			this.layoutWidget.setRightButtons([
				{
					type: 'more',
					callback: onShowMoreMenu,
					svg: {
						content: outline.moreWithBackgroundAndDot({
							moreColor: highlightMoreButton ? Color.baseWhiteFixed : Color.base4.toHex(),
							backgroundColor: highlightMoreButton ? Color.accentMainPrimary.toHex() : null,
						}),
					},
				},
			]);
		}

		/**
		 * @protected
		 * @param {ChecklistLayoutChangeParams} [options]
		 */
		onChange({ alert } = {})
		{
			this.alert = alert;
			this.showPreventDismiss(true);
		}

		/** @protected */
		async handleOnClose()
		{
			const { onClose } = this.props;

			try
			{
				if (onClose)
				{
					const shouldClose = await onClose();
					if (shouldClose === false)
					{
						return;
					}
				}

				this.close();
			}
			catch (error)
			{
				console.error(error);
			}
		}

		/** @protected */
		async handleOnSave()
		{
			const { onSave } = this.props;

			try
			{
				if (onSave)
				{
					const shouldClose = await onSave();
					if (shouldClose === false)
					{
						return;
					}
				}

				this.close();
			}
			catch (error)
			{
				console.error(error);
			}
		}

		/** @param {boolean} show */
		showPreventDismiss(show)
		{
			this.onPreventDismiss = show;
		}
	}

	ChecklistBaseLayout.propTypes = {
		parentWidget: PropTypes.object,
		component: PropTypes.object,
		onSave: PropTypes.func,
		onClose: PropTypes.func,
		onShowMoreMenu: PropTypes.func,
	};

	module.exports = { ChecklistBaseLayout };
});
