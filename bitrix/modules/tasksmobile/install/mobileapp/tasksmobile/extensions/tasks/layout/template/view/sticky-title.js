/**
 * @module tasks/layout/template/view/sticky-title
 */
jn.define('tasks/layout/template/view/sticky-title', (require, exports, module) => {
	const store = require('statemanager/redux/store');
	const { selectById } = require('tasks/statemanager/redux/slices/templates');

	class StickyTitle
	{
		constructor({ templateId, layout, defaultTitle })
		{
			this.templateId = templateId;
			this.layout = layout;
			this.defaultTitle = defaultTitle;
			this.currentTitle = defaultTitle;

			const template = selectById(store.getState(), this.templateId);
			this.templateName = template?.name || this.defaultTitle;
			this.scrollOffset = this.calcScrollOffset();

			if (!this.isSubscribed())
			{
				this.subscribe();
			}
		}

		calcScrollOffset()
		{
			const minOffset = 96;
			const maxOffset = 170;
			const symbolsInLine = 36;
			const linesCount = Math.round(this.templateName.length / symbolsInLine);
			const lineHeight = 24;
			const approxOffset = Math.max((linesCount * lineHeight), minOffset);

			return Math.min(approxOffset, maxOffset);
		}

		subscribe()
		{
			this.cancelSubscription = store.subscribe(() => {
				const template = selectById(store.getState(), this.templateId);
				this.templateName = template?.name || this.defaultTitle;
				this.scrollOffset = this.calcScrollOffset();
			});
		}

		isSubscribed()
		{
			return Boolean(this.cancelSubscription);
		}

		unsubscribe()
		{
			this.cancelSubscription?.();
			this.cancelSubscription = null;
		}

		onScroll({ contentOffset })
		{
			const text = contentOffset.y > this.scrollOffset ? this.templateName : this.defaultTitle;
			const type = text === this.defaultTitle ? 'entity' : 'common';

			if (text !== this.currentTitle)
			{
				this.currentTitle = text;
				this.layout.setTitle({ text, type });
			}
		}
	}

	module.exports = { StickyTitle };
});
