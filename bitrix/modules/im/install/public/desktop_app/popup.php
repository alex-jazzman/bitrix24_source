<?php
define("BX_SKIP_USER_LIMIT_CHECK", true);
define("BX_PULL_SKIP_INIT", true);
require($_SERVER["DOCUMENT_ROOT"]."/desktop_app/headers.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

\Bitrix\Main\Page\Asset::getInstance()->setJsToBody(false);

if (!CModule::IncludeModule('im'))
{
	return;
}

global $USER;
global $APPLICATION;

?>

<?php if ((int)$USER->GetID() <= 0 || \Bitrix\Im\User::getInstance()->isConnector()): ?>
	<script>
		if (typeof(BXDesktopSystem) != 'undefined')
			BXDesktopSystem.Login({});
		else
			location.href = '/';
	</script>
	<?php return true; ?>
<?php endif ?>

<?php

IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/im/install/public/desktop_app/index.php");

$GLOBALS["APPLICATION"]->SetPageProperty("BodyClass", "im-desktop");

\Bitrix\Main\UI\Extension::load([
	'im.v2.const',
	'im_desktop',
	'ui.buttons',
	'ui.buttons.icons',
	'call.core',
]);

if (CModule::IncludeModule('timeman'))
{
	CJSCore::init('im_timecontrol');
}

$diskEnabled = false;
if (IsModuleInstalled('disk'))
{
	$diskEnabled =
		\Bitrix\Main\Config\Option::get('disk', 'successfully_converted', false)
		&& CModule::includeModule('disk')
		&& \Bitrix\Disk\Configuration::REVISION_API >= 5
	;
}

$needIncludeWebdavDisk = !$diskEnabled && IsModuleInstalled('webdav');

?>

<html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=<?=SITE_CHARSET?>"/>
	<?php $APPLICATION->ShowCSS(); ?>
	<?php $APPLICATION->ShowHeadStrings(); ?>
	<?php $APPLICATION->ShowHeadScripts(); ?>
	<title><?php $APPLICATION->ShowTitle(); ?></title>
</head>
<body class="<?php $APPLICATION->ShowProperty("BodyClass"); ?>">
	<?php
		if ($diskEnabled)
		{
			$APPLICATION->IncludeComponent(
				'bitrix:disk.bitrix24disk',
				'',
				['AJAX_PATH' => '/desktop_app/disk.ajax.new.php'],
				false,
				["HIDE_ICONS" => "Y"]
			);
		}

		if ($needIncludeWebdavDisk)
		{
			$APPLICATION->IncludeComponent(
				'bitrix:webdav.disk',
				'',
				['AJAX_PATH' => '/desktop_app/disk.ajax.php'],
				false,
				["HIDE_ICONS" => "Y"]
			);
		}
	?>
	#PLACEHOLDER#
</body>
</html>

<?php
require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
?>
