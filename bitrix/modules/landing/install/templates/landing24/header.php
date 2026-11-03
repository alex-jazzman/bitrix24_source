<?php
if (!defined ('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/** @var \CMain $APPLICATION */

if (!\Bitrix\Main\Loader::includeModule('landing'))
{
	return;
}

// the kernel includes this template with a plain include and loads no messages for it
Loc::loadMessages(__FILE__);

\Bitrix\Landing\Connector\Mobile::prologMobileHit();
$language = \Bitrix\Landing\Manager::getLangISO();
// the phrase ships in ru only, and an empty one would leave a focusable link with no name
$skipLinkText = (string)Loc::getMessage('LANDING_TPL_SKIP_TO_CONTENT');
?><!DOCTYPE html>
<html xml:lang="<?= $language;?>" lang="<?= $language;?>" class="<?php $APPLICATION->ShowProperty('HtmlClass');?>">
<head>
	<?php $APPLICATION->ShowProperty('AfterHeadOpen');?>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="HandheldFriendly" content="true" >
	<meta name="MobileOptimized" content="width">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<title><?php $APPLICATION->ShowTitle();?></title>
	<?php
	$APPLICATION->ShowHead();
	$APPLICATION->ShowProperty('MetaOG');
	$APPLICATION->ShowProperty('BeforeHeadClose');
	?>
</head>
<body class="<?php $APPLICATION->ShowProperty('BodyClass');?>" <?php $APPLICATION->ShowProperty('BodyTag');?>>
<?php if ($skipLinkText !== ''):?>
<a
	class="landing-skip-link"
	href="#landing-main-content"
	data-testid="pub-skip-link"
><?= \htmlspecialcharsbx($skipLinkText);?></a>
<?php endif;?>
<?php
/*
This is commented to avoid Project Quality Control warning
$APPLICATION->ShowPanel();
*/
?>
<?php $APPLICATION->ShowProperty('Noscript');?>
<?php $APPLICATION->ShowProperty('AfterBodyOpen');?>
<main
	class="w-100 <?php $APPLICATION->ShowProperty('MainClass');?>"
	id="landing-main-content"
	tabindex="-1"
	data-testid="pub-main"
	<?php $APPLICATION->ShowProperty('MainTag');?>
>