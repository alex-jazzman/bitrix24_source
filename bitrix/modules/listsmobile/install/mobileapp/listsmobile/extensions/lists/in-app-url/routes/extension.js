/**
 * @module lists/in-app-url/routes
 */
jn.define('lists/in-app-url/routes', (require, exports, module) => {
	const openElementDetails = (elementId, context) => {
		const { widgetTitle, uid, parentWidget, presentation } = context ?? {};

		void requireLazy('lists:element-details')
			.then(({ ElementDetails }) => {
				if (ElementDetails)
				{
					ElementDetails.open(
						{
							elementId,
							title: widgetTitle || null,
							isEmbedded: false,
							isNeedShowSkeleton: true,
							interceptExit: true,
							uid: uid || null,
							presentation,
						},
						parentWidget || PageManager,
					);
				}
			})
		;
	};

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			.addRoute('/bizproc/processes/:iBlockId/element/:sectionId/:elementId/')
			.addRoute('/bizproc/processes/\\?livefeed=y&list_id=:iBlockId&element_id=:elementId')
			.handler(({ elementId }, { context }) => {
				openElementDetails(elementId, context);
			})
			.name('lists:processDetail')
		;
		inAppUrl
			.addRoute('/workgroups/group/:groupID/lists/:iBlockId/element/:sectionId/:elementId/')
			.addRoute('/company/lists/:iBlockId/element/:sectionId/:elementId/')
			.handler(({ elementId }, { context }) => {
				openElementDetails(elementId, context);
			})
			.name('lists:elementDetail')
		;
	};
});
