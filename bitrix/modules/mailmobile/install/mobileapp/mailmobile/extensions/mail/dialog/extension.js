/**
 * @module mail/dialog
 */
jn.define('mail/dialog', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');

	const CONNECTING_MAIL_TYPE = 'CONNECTING_MAIL';
	const CONNECTING_MAIL_TYPE_FINAL = 'CONNECTING_MAIL_FINAL';
	const CONNECTING_MAIL_CRM_TYPE = 'CONNECTING_MAIL_CRM';
	const CONNECTION_MAIL_TYPE_FORBIDDEN = 'CONNECTION_MAIL_TYPE_FORBIDDEN';
	const MAIL_TYPE_LOST_MESSAGE_TYPE = 'MAIL_TYPE_LOST_MESSAGE';
	const MAIL_TYPE_QUANTITY_LIMIT_EXCEEDED = 'QUANTITY_LIMIT_EXCEEDED';

	/**
	 * @class MailDialog
	 */
	class MailDialog
	{
		/**
		 * @function MAIL_TYPE_QUANTITY_LIMIT_EXCEEDED
		 * @returns {string}
		 * @constructor
		 */
		static get MAIL_TYPE_QUANTITY_LIMIT_EXCEEDED()
		{
			return MAIL_TYPE_QUANTITY_LIMIT_EXCEEDED;
		}

		/**
		 * @function MAIL_TYPE_LOST_MESSAGE_TYPE
		 * @returns {string}
		 * @constructor
		 */
		static get MAIL_TYPE_LOST_MESSAGE_TYPE()
		{
			return MAIL_TYPE_LOST_MESSAGE_TYPE;
		}

		/**
		 * @function CONNECTION_MAIL_TYPE_FORBIDDEN
		 * @returns {string}
		 * @constructor
		 */
		static get CONNECTION_MAIL_TYPE_FORBIDDEN()
		{
			return CONNECTION_MAIL_TYPE_FORBIDDEN;
		}

		/**
		 * @function CONNECTING_MAIL_TYPE_FINAL
		 * @returns {string}
		 * @constructor
		 */
		static get CONNECTING_MAIL_TYPE_FINAL()
		{
			return CONNECTING_MAIL_TYPE_FINAL;
		}

		/**
		 * @function CONNECTING_MAIL_TYPE
		 * @returns {string}
		 * @constructor
		 */
		static get CONNECTING_MAIL_TYPE()
		{
			return CONNECTING_MAIL_TYPE;
		}

		/**
		 * @function CONNECTING_MAIL_CRM_TYPE
		 * @returns {string}
		 * @constructor
		 */
		static get CONNECTING_MAIL_CRM_TYPE()
		{
			return CONNECTING_MAIL_CRM_TYPE;
		}

		static getWidgetParams()
		{
			return {
				backdrop: {
					mediumPositionPercent: 85,
					hideNavigationBar: true,
					forceDismissOnSwipeDown: true,
					shouldResizeContent: true,
					swipeAllowed: true,
				},
			};
		}

		static async openPlanRestriction(type, parentWidget = PageManager)
		{
			const bannerConfig = {
				[MailDialog.MAIL_TYPE_QUANTITY_LIMIT_EXCEEDED]: {
					title: BX.message('MAIL_CONNECTING_MAIL_BANNER_QUANTITY_LIMIT_EXCEEDED_TITLE'),
				},
			};

			const config = bannerConfig[type];

			if (config)
			{
				const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');

				PlanRestriction.open(
					config,
					parentWidget,
				);
			}
		}

		static executeBeforeOpening(type)
		{
			return Promise.resolve(type);
		}

		/**
		 * @function show
		 *
		 * @param props
		 */
		static async show(props)
		{
			const {
				type,
				parentWidget,
				layoutWidget,
				needsToCloseLayout = true,
				successCallback = () => {},
			} = props;

			const bannerConfig = {
				[MailDialog.CONNECTING_MAIL_TYPE_FINAL]: {
					path: 'dialog/banners/connectingmailfinal',
					component: 'ConnectingMailFinal',
				},
				[MailDialog.CONNECTING_MAIL_TYPE]: {
					path: 'dialog/banners/connectingmail',
					component: 'ConnectingMail',
				},
				[MailDialog.CONNECTING_MAIL_CRM_TYPE]: {
					path: 'dialog/banners/connectingmail',
					component: 'ConnectingMail',
				},
				[MailDialog.CONNECTION_MAIL_TYPE_FORBIDDEN]: {
					path: 'dialog/banners/connectionforbidden',
					component: 'ConnectionForbidden',
				},
				[MailDialog.MAIL_TYPE_LOST_MESSAGE_TYPE]: {
					path: 'dialog/banners/lostmessage',
					component: 'LostMessage',
				},
			};

			const redefinedType = await this.executeBeforeOpening(type);

			const config = bannerConfig[redefinedType];

			if (config)
			{
				jn.import(`mail:${config.path}`)
					.then(async () => {
						const {
							[config.component]: BannerComponent,
						} = require(`mail/${config.path}`);

						const preFetched = typeof BannerComponent.preFetch === 'function'
							? await BannerComponent.preFetch(props)
							: {}
						;

						if (parentWidget)
						{
							parentWidget.openWidget('layout', MailDialog.getWidgetParams())
								.then((widget) => {
									const component = new BannerComponent({
										...props,
										needsToCloseLayout,
										layoutWidget: widget,
										successCallback,
										...preFetched,
									});
									widget.showComponent(component);
								})
								.catch(console.error);
						}
						else if (layoutWidget)
						{
							const component = new BannerComponent({
								...props,
								needsToCloseLayout,
								successCallback,
								...preFetched,
							});

							layoutWidget.setTitle({ text: '' });
							layoutWidget.setRightButtons([]);
							layoutWidget.showComponent(component);
						}
					})
					.catch(console.error);
			}
			else
			{
				await this.openPlanRestriction(redefinedType, parentWidget);
			}
		}
	}

	module.exports = { MailDialog };
});
