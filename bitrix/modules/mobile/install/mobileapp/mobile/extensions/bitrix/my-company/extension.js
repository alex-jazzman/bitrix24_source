/**
 * @module my-company
 */
jn.define('my-company', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Feature } = require('feature');
	const { PerfPoint } = require('debug/prism');
	const { Presentation } = require('in-app-url/presentation');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');

	const MY_COMPANY_COMPONENT_NAME = 'my.company';

	// The spotlight of an aha-moment leaves the real target under its hole, so a single tap on the entry
	// plate reaches both the moment and the plate, and each of them asks for the section. The section is
	// modal and covers the whole screen the plate lives on, so a repeated request right after the first
	// one is that same tap arriving twice rather than a second wish of the user.
	const REPEATED_OPEN_WINDOW = 1000;

	// Same contract the More tab and the profile use: the portal image is drawn by the native widget
	// behind the JS content.
	const BACKGROUND_LAYOUT = {
		mode: 'fixedHeight',
		resizeMode: 'cover',
	};

	let lastOpenedAt = 0;

	const isRepeatedOpen = (now) => {
		const sinceLastOpen = now - lastOpenedAt;

		return sinceLastOpen >= 0 && sinceLastOpen < REPEATED_OPEN_WINDOW;
	};

	/**
	 * @class MyCompany
	 */
	class MyCompany
	{
		/**
		 * The section lives in its own JS context, so the widget is opened by component name
		 * rather than by mounting the screen into the calling context.
		 *
		 * @param {MyCompanyOpenParams} [params]
		 * @return {Promise}
		 */
		static open({ context = {}, highlight } = {})
		{
			const now = Date.now();
			if (isRepeatedOpen(now))
			{
				return Promise.resolve();
			}

			lastOpenedAt = now;

			// The whole open as the tap sees it. The section lives in a JS context of its own, so the
			// measurement ends where the native side reports the component opened; what happens inside
			// that context is measured there, by `My Company Section Context`.
			const point = new PerfPoint('My Company Open Section', 'widget').start();

			// The section leaves the downward swipe to the refresh of its content, so the close button is the
			// only way out - and the flag is what keeps that button in place: an Android modal draws it only
			// while the swipe of the whole widget is off (Page.kt), which is also the default there. iOS
			// knows no such setting: the swipe is reported to the JS side and closes nothing by itself.
			const widgetSettings = { swipeToClose: false };

			if (Feature.canUseWidgetBackground())
			{
				// The portal background goes under the same capability as the transparency of the screen:
				// without the native support the setting would travel blindly.
				widgetSettings.backgroundLayout = BACKGROUND_LAYOUT;
			}

			return WidgetPresenter.fromContext(context)
				// Modal on purpose, and for every entry point alike - the menu, a link in a chat, an
				// external deeplink. A widget that asks for the portal background is wrapped into a native
				// container, and a pushed container never gets the native back button, so a pushed section
				// would keep the background but lose the only visible way out; a modal one carries its own
				// close button. Switch back to the default presentation once the native side looks for the
				// wrapped controller in the stack - NavigationBarHelper.addBackButtonIfNeeded() and
				// JNWidgetStackControl.back().
				.setPresentation(Presentation.MODAL)
				.setWidgetSettings(widgetSettings)
				.setTitleParams({
					text: Loc.getMessage('MY_COMPANY_TITLE'),
					type: 'section',
				})
				.setComponentName(MY_COMPANY_COMPONENT_NAME, {
					componentParams: Type.isStringFilled(highlight) ? { highlight } : undefined,
				})
				.open()
				.finally(() => point.end());
		}
	}

	module.exports = { MyCompany };
});
