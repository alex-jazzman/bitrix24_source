<?php
define("BX_SKIP_USER_LIMIT_CHECK", true);
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
/** @var CMain $APPLICATION */
global $APPLICATION;

use Bitrix\Intranet;

$siteTitle = Intranet\Portal::getInstance()->getSettings()->getTitle();
?>
	<!DOCTYPE html>
	<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
		<title><?= htmlspecialcharsbx($siteTitle) ?></title>
		<?php

		$APPLICATION->ShowHead();
		?>
	</head>
	<body style="height: 100%;margin: 0;padding: 0; background: #fff" id="workarea-content">
	<?php
	$APPLICATION->IncludeComponent(
		'bitrix:intranet.menu',
		'',
		[
			"ROOT_MENU_TYPE" => file_exists($_SERVER['DOCUMENT_ROOT'] . SITE_DIR . '.superleft.menu_ext.php') ? 'superleft' : 'top',
			"MENU_CACHE_TYPE" => "Y",
			"MENU_CACHE_TIME" => "604800",
			"MENU_CACHE_USE_GROUPS" => "N",
			"MENU_CACHE_USE_USERS" => "Y",
			"CACHE_SELECTED_ITEMS" => "N",
			"MENU_CACHE_GET_VARS" => [],
			"MAX_LEVEL" => "1",
			"USE_EXT" => "Y",
			"DELAY" => "N",
			"ALLOW_MULTI_SELECT" => "N",
			"ADD_ADMIN_PANEL_BUTTONS" => "N",
		],
		false
	);
	?>
	</body>
	</html>
<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
?>