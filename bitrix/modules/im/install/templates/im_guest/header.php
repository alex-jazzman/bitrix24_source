<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Intranet\Integration\Templates\Air\AirTemplate;
use Bitrix\Intranet\Integration\Templates\Bitrix24\ThemePicker;
use Bitrix\Main\Loader;
use Bitrix\Main\Page\Asset;

Loader::requireModule('intranet');

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.counter',
	'ui.buttons',
	'ui.icon-set.solid',
	'ui.icon-set.outline',
	'intranet.sidepanel.air',
	'socialnetwork.slider',
]);

$asset = Asset::getInstance();
$bitrix24TemplatePath = '/bitrix/templates/bitrix24';
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="<?= SITE_CHARSET ?>"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no"/>
<?php
$APPLICATION->showHead(false);

// Force critical CSS/JS directly into <head> to avoid deferred BX.setCSSList loading
$asset->addString(
	'<link href="' . \CUtil::getAdditionalFileURL($bitrix24TemplatePath . '/dist/bitrix24.bundle.css') . '" type="text/css" rel="stylesheet">',
	true,
	\Bitrix\Main\Page\AssetLocation::AFTER_CSS
);
$asset->addString(
	'<link href="' . \CUtil::getAdditionalFileURL($bitrix24TemplatePath . '/components/bitrix/menu/left_vertical/style.css') . '" type="text/css" rel="stylesheet">',
	true,
	\Bitrix\Main\Page\AssetLocation::AFTER_CSS
);
$asset->addString(
	'<link href="' . \CUtil::getAdditionalFileURL('/bitrix/components/bitrix/main.interface.buttons/templates/.default/style.css') . '" type="text/css" rel="stylesheet">',
	true,
	\Bitrix\Main\Page\AssetLocation::AFTER_CSS
);
$asset->addString(
	'<script src="' . \CUtil::getAdditionalFileURL($bitrix24TemplatePath . '/dist/bitrix24.bundle.js') . '"></script>',
	true,
	\Bitrix\Main\Page\AssetLocation::AFTER_JS
);

// ThemePicker singleton uses SITE_TEMPLATE_ID (im_guest) which has no themes dir.
// Create a separate instance with bitrix24 template to load the default theme CSS.
$themePicker = new ThemePicker('bitrix24');
$themePicker->showHeadAssets();

?>
<title><?php $APPLICATION->showTitle(); ?></title>
</head>
<?php
// im-chat-embedded enables fullscreen messenger layout (proper paddings, bg color, no footer).
$bodyClasses = AirTemplate::getBodyClasses() . ' im-chat-embedded';
?>
<body class="<?= $bodyClasses ?>"><?php

$portalTitle = \Bitrix\Intranet\Portal::getInstance()
	->getSettings()
	->getTitle()
;
?>
<div class="root js-app">
	<div class="app__left-menu js-app__left-menu --air-context-blurred-bg">
		<?php $APPLICATION->includeComponent(
			'bitrix:menu',
			'left_vertical',
			[
				'ROOT_MENU_TYPE' => 'left',
				'MENU_CACHE_TYPE' => 'N',
				'MAX_LEVEL' => '1',
				'USE_EXT' => 'N',
				'DELAY' => 'N',
				'ALLOW_MULTI_SELECT' => 'N',
			],
			false
		); ?>
	</div>
	<header class="app__header" id="app-header">
		<div class="air-header --air-context-blurred-bg" id="header">
			<button class="air-header__burger --ui-hoverable" id="air-header-burger" type="button">
				<span class="air-header__burger-icon"></span>
			</button>
			<div class="air-header__menu" id="air-header-menu">
				<?php $APPLICATION->showViewContent('above_pagetitle'); ?>
			</div>
			<div class="air-header__personal-info">
				<div class="air-header__logo">
					<a href="/" class="logo-link">
						<span class="logo-text-container">
							<span class="logo-text"><?= htmlspecialcharsbx($portalTitle) ?></span>
						</span>
					</a>
				</div>
			</div>
		</div>
	</header>
	<div class="app__page" id="page-area">
		<div class="page no-all-paddings no-background no-page-header no-footer-endless">
			<div class="page__workarea">
				<main class="page__workarea-content">
