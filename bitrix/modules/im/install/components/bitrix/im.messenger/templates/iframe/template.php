<?php
/** @var array $arResult */

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

global $USER;
global $APPLICATION;

$preloadExtensions = [
	'ui.design-tokens',
	'sidepanel',
	'intranet.sidepanel.bindings',
	'intranet.sidepanel.external',
];

if (\Bitrix\Im\Settings::isLegacyChatActivated())
{
	$preloadExtensions[] = 'socialnetwork.slider';
}

\Bitrix\Main\Loader::includeModule("ui");
\Bitrix\Main\UI\Extension::load('helper');

$helpUrl = \Bitrix\UI\Util::getHelpdeskUrl(true) . "/widget2/";
$helpUrl = CHTTP::urlAddParams($helpUrl, [
	"url" => urlencode("https://" . $_SERVER["HTTP_HOST"] . $APPLICATION->GetCurPageParam()),
	"user_id" => $USER->GetID(),
	"is_cloud" => IsModuleInstalled('bitrix24') ? "1" : "0",
	"action" => "open",
]);
?>

<html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=<?=SITE_CHARSET?>"/>
	<?php \Bitrix\Main\UI\Extension::load($preloadExtensions); ?>
	<?php $APPLICATION->ShowCSS(); ?>
	<?php $APPLICATION->ShowHeadStrings(); ?>
	<?php $APPLICATION->ShowHeadScripts(); ?>
	<title><?php $APPLICATION->ShowTitle(); ?></title>
</head>
<body class="<?php $APPLICATION->ShowProperty("BodyClass"); ?>">
<div class="bx-desktop-placeholder" id="workarea-content"></div>
<script>
	document.title = '<?= GetMessage('IM_FULLSCREEN_TITLE_2') ?>';
	<?= CIMMessenger::GetTemplateJS(Array(), $arResult) ?>
</script>
<script>
	BX.Helper.init({
		frameOpenUrl : '<?= CUtil::JSEscape($helpUrl) ?>',
		langId: '<?= LANGUAGE_ID ?>'
	});
</script>
</body>
</html>