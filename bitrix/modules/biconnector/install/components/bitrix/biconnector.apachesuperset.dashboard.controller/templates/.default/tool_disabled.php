<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Intranet\Portal\FirstPage;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

/**
 * @var array $arResult
 */

\Bitrix\Main\UI\Extension::load([
	'biconnector.lock-popup',
]);

$portalMainPageUrl = SITE_DIR;
if (Loader::includeModule('intranet'))
{
	$portalMainPageUrl = FirstPage::getInstance()->getLink();
}

$popupParams = [
	'title' => Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_TOOL_DISABLED_TITLE'),
	'content' => Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_TOOL_DISABLED_DESCRIPTION'),
	'buttons' => [
		[
			'text' => Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_TOOL_DISABLED_BACK'),
			'url' => $portalMainPageUrl,
			'style' => 'outline',
		],
	],
	'hasCloseButton' => false,
	'closeByEsc' => false,
	'closeByClickOutside' => false,
	'useQueue' => false,
];

?>
<script>
	BX.ready(() => {
		BX.BIConnector.LockPopup.show(<?= \CUtil::PhpToJSObject($popupParams) ?>);
	});
</script>
