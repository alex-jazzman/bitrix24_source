(() => {
	const require = (ext) => jn.require(ext);
	const { PerfPoint } = require('debug/prism');

	// The context of the section as it is born: `Extensions Init` is the whole static graph of the
	// screen coming up - every card of the composition is a static dependency of it - and the gap
	// before `Show Component` is the wait for the view.
	const point = new PerfPoint('My Company Section Context', 'bootstrap').start();

	point.startPoint('Extensions Init');
	const { MyCompanyScreen } = require('my-company/screen');
	point.endPoint('Extensions Init');

	BX.onViewLoaded(() => {
		const highlight = BX.componentParameters.get('highlight', '');

		point.startPoint('Show Component');
		// the native side names the root widget of the section `layout` in this very context, so the
		// component is the one boundary where that global turns into a prop
		layout.showComponent(new MyCompanyScreen({ highlight, layout }));
		point.endPoint('Show Component');
		point.end();

		// No handler of `swipeDown` here on purpose. The section is opened modally, and for a modal widget
		// the native side only reports the swipe: a handler that closes the widget on it takes the pull of
		// the content away from the refresh of the section, which is the only way to ask the server past
		// every cache. The way out of the section is the close button of the modal presentation; the
		// profile does close on that event - it has no gesture of refresh to lose.
	});
})();
