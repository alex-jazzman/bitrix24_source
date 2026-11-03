<?php

use Bitrix\Mail\Integration\Crm\MailTemplateEditor;
use Bitrix\Main\Context;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Page\AssetLocation;
use Bitrix\Main\SiteTable;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Uri;

define('BX_COMPOSITE_SKIP', true);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

$context = Context::getCurrent();
$request = $context->getRequest();
$response = $context->getResponse();
$response->addHeader('Cache-Control', 'no-store, private');

$method = $request->getRequestMethod();
$action = $request->getQuery('action') ?? 'list';
if (!in_array($method, ['GET', 'POST'], true) || ($method === 'POST' && $action !== 'list'))
{
	$response->setStatus('405 Method Not Allowed');
	$response->addHeader('Allow', $action === 'list' ? 'GET, POST' : 'GET');
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_after.php';

	return;
}

$siteId = $request->getQuery('site');
$site = is_string($siteId) && $siteId !== ''
	? SiteTable::getByPrimary($siteId, ['select' => ['LID', 'ACTIVE', 'DIR']])->fetch()
	: false;
if (!$site || $site['LID'] !== $siteId || $site['ACTIVE'] !== 'Y' || !in_array($action, ['list', 'add'], true))
{
	$response->setStatus('400 Bad Request');
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_after.php';

	return;
}

$context->initializeCulture($siteId);
Loc::setCurrentLang($context->getLanguage());

if (
	!$USER->IsAuthorized()
	|| !Loader::includeModule('mail')
	|| !Loader::includeModule('crm')
	|| !CCrmPerms::IsAccessEnabled()
)
{
	$response->setStatus('403 Forbidden');
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';
	ShowError(Loc::getMessage('ACCESS_DENIED'));
	require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';

	return;
}

$iframeParameters = ['site' => $siteId];
if (in_array($request->getQuery('IFRAME'), ['Y', 'N'], true))
{
	$iframeParameters['IFRAME'] = $request->getQuery('IFRAME');
}
if ($request->getQuery('IFRAME_TYPE') === 'SIDE_SLIDER')
{
	$iframeParameters['IFRAME_TYPE'] = 'SIDE_SLIDER';
}

$editor = new MailTemplateEditor();
if (!$editor->isAvailable((int)$USER->GetID()))
{
	$path = rtrim($site['DIR'], '/') . '/crm/configs/mailtemplate/' . ($action === 'add' ? 'add/' : '');
	LocalRedirect((new Uri($path))->addParams($iframeParameters)->getUri(), false, '302 Found');

	return;
}

if ($action === 'add')
{
	$uri = new Uri($editor->getCreateUrl($siteId));
	LocalRedirect($uri->addParams($iframeParameters)->getUri(), false, '302 Found');

	return;
}

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$paths = [
	'PATH_TO_MAIL_TEMPLATE_LIST' => MailTemplateEditor::getListUrl($siteId),
	'PATH_TO_MAIL_TEMPLATE_ADD' => MailTemplateEditor::getAddUrl($siteId),
	'PATH_TO_MAIL_TEMPLATE_EDIT' => $editor->getEditUrlTemplate($siteId),
];

Extension::load('main.sidepanel');
Asset::getInstance()->addString(
	<<<'HTML'
<script>
	BX.ready(() => {
		const rootWindow = BX.Page.getRootWindow();
		const editorNamespace = rootWindow.BX.Reflection.namespace('BX.Mail.TemplateEditor');
		if (editorNamespace.anchorsBound === true)
		{
			return;
		}

		// Shared rules must not retain the list iframe.
		const parameters = rootWindow.JSON.parse(JSON.stringify({
			rules: [
				{
					condition: [
						'^/bitrix/components/bitrix/crm\\.mail_template\\.editor/slider\\.php\\?',
						'^/bitrix/components/bitrix/mail\\.client/templates\\.php\\?(?:[^#]*&(?:amp;)?)?action=add(?:[&#]|$)',
					],
					options: { cacheable: false },
				},
			],
		}));
		rootWindow.BX.SidePanel.Instance.bindAnchors(parameters);
		editorNamespace.anchorsBound = true;
	});
</script>
HTML,
	true,
	AssetLocation::AFTER_JS,
);

$APPLICATION->ShowViewContent('crm-mail-template-message');
$APPLICATION->IncludeComponent(
	'bitrix:crm.mail_template.menu',
	'',
	array_merge($paths, ['ELEMENT_ID' => 0, 'TYPE' => 'list']),
);

$listParameters = array_merge($paths, ['MESSAGE_VIEW_ID' => 'crm-mail-template-message']);
if ($request->getQuery('IFRAME') === 'Y')
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:crm.mail_template.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'USE_UI_TOOLBAR' => 'Y',
			'POPUP_COMPONENT_PARAMS' => $listParameters,
		],
	);
}
else
{
	$APPLICATION->IncludeComponent('bitrix:crm.mail_template.list', '', $listParameters);
}

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php';
