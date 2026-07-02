<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 */

use Bitrix\Main;

Main\Loader::includeModule('intranet');

Main\UI\Extension::load([
	'intranet.sidepanel.air',
]);

?>
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=<?= SITE_CHARSET ?>"/>
	<?php
	$APPLICATION->ShowHead();
	?>
	<title><?php $APPLICATION->ShowTitle() ?></title>
</head>
<body class="<?php $APPLICATION->ShowProperty("BodyClass"); ?>">
