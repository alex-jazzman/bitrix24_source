<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 */
?>
<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=<?= SITE_CHARSET ?>"/>
	<?php
	\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/templates/bitrix24/template_styles.css');
	$APPLICATION->ShowHead();
	?>
	<title><?php $APPLICATION->ShowTitle() ?></title>
</head>
<body class="<?php $APPLICATION->ShowProperty("BodyClass"); ?>">
