/**
 * @module in-app-url/routes/development-routes
 */
jn.define('in-app-url/routes/development-routes', (require, exports, module) => {
	const { URL } = require('utils/url');
	const { requireLazy } = require('require-lazy');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');

	module.exports = function(inAppUrl) {
		inAppUrl.register('/development/storybook', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('dev:storybook')
				.setTitle('StoryBook')
				.open();
		}).name('storybook');

		inAppUrl
			.addRoute('/dev/stories/')
			.handler(async (routeParams, { url }) => {
				const { pathname } = URL(url);
				const { openStory } = await requireLazy('dev:storybook/opener').catch(console.error);

				openStory({
					path: pathname,
					canOpenInDefault: true,
				});
			})
			.name('dev:stories');

		inAppUrl.register('/development/testing.tools', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('testing.tools')
				.setTitle('Manual testing tools')
				.open();
		}).name('testing.tools');

		inAppUrl.register('/development/unit.tests', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('unit.tests')
				.setTitle('Frontend Unit Tests')
				.open();
		}).name('unit-tests');

		inAppUrl.register('/development/playground', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('playground')
				.setTitle('Playground')
				.open();
		}).name('playground');

		inAppUrl.register('/development/listview.benchmark', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('listview.benchmark')
				.setTitle('ListView Benchmark')
				.open();
		}).name('listview-benchmark');

		inAppUrl.register('/development/text-editor.demo', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('text-editor.demo')
				.setTitle('Text Editor Demo')
				.open();
		}).name('text-editor-demo');

		inAppUrl.register('/development/formatter.sandbox', (params, { context }) => {
			void WidgetPresenter.fromContext(context)
				.setComponentName('formatter.sandbox')
				.setTitle('Formatter Sandbox')
				.open();
		}).name('formatter-sandbox');
	};
});
