/** @module tasks/checklist/widget/src/manager/page-layout */
jn.define('tasks/checklist/widget/src/manager/page-layout', (require, exports, module) => {
	const { PropTypes } = require('utils/validation');
	const { ChecklistBaseLayout } = require('tasks/checklist/widget/src/manager/base-layout');

	class ChecklistPageLayout extends ChecklistBaseLayout
	{
		/** @return {Promise<Object>} */
		async open()
		{
			const parentWidget = this.getParentWidget();

			const layoutWidget = await parentWidget
				.openWidget('layout', {
					titleParams: {
						text: this.getTitle(),
						type: 'entity',
					},
				}).catch(console.error);

			layoutWidget.showComponent(this.getComponent());
			this.actionsAfterOpenWidget(layoutWidget);

			return layoutWidget;
		}

		/**
		 * @protected
		 * @param {JSStackNavigation} layoutWidget
		 */
		actionsAfterOpenWidget(layoutWidget)
		{
			super.actionsAfterOpenWidget(layoutWidget);
			this.updateLeftButtons();
		}

		/**
		 * @private
		 * @return {void}
		 */
		updateLeftButtons()
		{
			this.layoutWidget.setLeftButtons([
				{
					type: 'back',
					callback: () => {
						void this.handleOnClose();
					},
				},
			]);
		}

		/** @return {void} */
		close()
		{
			this.layoutWidget.back();
		}
	}

	ChecklistPageLayout.propTypes = {
		parentWidget: PropTypes.object,
		component: PropTypes.object,
		onSave: PropTypes.func,
		onClose: PropTypes.func,
		onShowMoreMenu: PropTypes.func,
	};

	module.exports = { ChecklistPageLayout };
});
