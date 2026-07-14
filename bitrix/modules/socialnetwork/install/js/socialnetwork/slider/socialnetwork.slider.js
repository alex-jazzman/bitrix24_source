(function() {

if (window.top !== window)
{
	return;
}

if (
	!BX.type.isNotEmptyString(BX.message('SONET_SLIDER_USER_SEF'))
	|| BX.message('SONET_SLIDER_INTRANET_INSTALLED') !== 'Y'
)
{
	return;
}

const siteDir = ('/' + (BX.message.SITE_DIR || '/')
	.replace(/[\\*+?.()|[\]{}]/g, '\\$&') + '/')
	.replace(/\/+/g, '/')
;

const settings = BX.Extension.getSettings('socialnetwork.slider');
const isNewProjectsOn = Boolean(settings.get('isNewProjectsOn'));
const isOldPortal = Boolean(settings.get('isOldPortal'));
const isRestricted = Boolean(settings.get('isRestricted'));

if (isNewProjectsOn && isOldPortal)
{
	BX.Event.EventEmitter.subscribe('IM:Collab:onFirstOpen', (baseEvent) => {
		const parentChatId = parseInt(baseEvent.getData()?.parentChatId, 10);

		void BX.Runtime.loadExtension('socialnetwork.feature-menu').then((exports) => {
			const { FeatureMenu } = exports;

			void FeatureMenu.navigateToBaseFeature(parentChatId);
		});
	});
}

const rules = [
	{
		condition: [
			BX.message('SONET_SLIDER_USER_SEF') + 'user/(\\d+)/groups/create/'
		],
		loader: 'group-loader',
		options: {
			width: 1200,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_USER_SEF') + 'user/(\\d+)/blog/(\\d+)/'
		],
		options: {
			cacheable: false,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/edit/'
		],
		loader: '/bitrix/js/socialnetwork/slider/images/group.svg',
		options: {
			width: 1200,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/invite/',
			BX.message('SONET_SLIDER_SPACES_SEF') + 'group/(\\d+)/invite/',
		],
		loader: 'group-invite-loader',
		options: {
			width: 950,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/features/'
		],
		loader: 'group-features-loader',
		options: {
			width: 800,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/card/'
		],
		loader: 'socialnetwork:group-card',
		options: {
			width: 900,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/users/',
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/moderators/'
		],
		loader: 'group-users-loader',
		options: {
			width: 1200,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/user_request/'
		],
		loader: 'group-user-request-loader',
		options: {
			width: 800,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/user_leave/'
		],
		loader: 'group-user-leave-loader',
		options: {
			width: 800,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/requests/'
		],
		loader: 'group-requests-loader',
		options: {
			width: 1200,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/requests_out/'
		],
		loader: 'group-requests-out-loader',
		options: {
			width: 1200,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/delete/'
		],
		loader: 'group-delete-loader',
		options: {
			width: 800,
		},
	},
	{
		condition: [
			BX.message('SONET_SLIDER_GROUP_SEF') + 'group/(\\d+)/copy/'
		],
		loader: 'group-copy-loader',
		options: {
			width: 1000,
		},
	},
];

let groupRule;
if (isNewProjectsOn)
{
	groupRule = {
		condition: [
			'(?<url>/workgroups/group/(?<groupId>\\d+)/?)$',
		],
		handler: (event, link) => {
			event.preventDefault();

			if (isRestricted)
			{
				BX.UI.FeaturePromotersRegistry.getPromoter({ featureId: 'socialnetwork_projects_groups' }).show();

				return;
			}

			const groupId = parseInt(link.matches.groups.groupId, 10);

			BX.Messenger.v2.Lib.Messenger.openCollab(`sg${groupId}`);
		},
	};
}
else
{
	groupRule = {
		condition: [
			new RegExp(`${siteDir}workgroups/group/[0-9]+/$`, 'i'),
		],
		options: {
			contentClassName: 'bitrix24-group-slider-content',
			loader: 'intranet:slider-livefeed',
			cacheable: false,
			customLeftBoundary: 0,
			newWindowLabel: true,
			copyLinkLabel: true,
		},
	};
}

rules.push(
	groupRule,
	{
		condition: [
			new RegExp(`${siteDir}workgroups/group/[0-9]+/tasks/$`, 'i'),
		],
		options: {
			contentClassName: 'bitrix24-group-slider-content',
			loader: 'intranet:slider-projects-tasklist',
			cacheable: false,
			customLeftBoundary: 0,
			newWindowLabel: true,
			copyLinkLabel: true,
		},
	},
	{
		condition: [
			new RegExp(`${siteDir}workgroups/group/[0-9]+/\\?scrum=Y$`, 'i'),
			new RegExp(`${siteDir}workgroups/group/[0-9]+/tasks/\\?scrum=Y$`, 'i'),
		],
		options: {
			contentClassName: 'bitrix24-group-slider-content',
			loader: 'intranet:slider-scrum',
			cacheable: false,
			customLeftBoundary: 0,
			newWindowLabel: true,
			copyLinkLabel: true,
		},
	},
);

BX.SidePanel.Instance.bindAnchors({
	rules: rules,
});
})();
