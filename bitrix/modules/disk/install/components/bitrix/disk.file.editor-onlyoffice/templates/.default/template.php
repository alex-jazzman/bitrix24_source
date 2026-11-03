<?php

/** @var $this CBitrixComponentTemplate */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var BaseComponent $component */

use Bitrix\Disk\Internals\BaseComponent;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'disk',
	'disk.document',
	'disk.document-header',
	'im',
	'disk.viewer.actions',
	'disk.onlyoffice-promo-popup',
	'disk.external-link',
	'disk.promo-boost',
	'ui.forms',
	'ui.alerts',
	'main.loader',
	'pull.client',
	'ui.info-helper',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.icons.b24',
	'ui.notification',
	'popup',
    'ui.dialogs.messagebox',
	'ui.icon-set.main',
	'disk.onlyoffice-promo-actions',
	'disk.url-cleaner',
]);

$helpUrl = \Bitrix\UI\InfoHelper::getUrl('/widget2/', byLang: true);
$frameOpenUrl = (new Bitrix\Main\Web\Uri($helpUrl))->addParams(['action' => 'open'])->getUri();

$isSignPlaceholdersEnabled = ($arResult['SIGN_PLACEHOLDERS_ENABLED'] ?? false) === true;
if ($isSignPlaceholdersEnabled)
{
	Extension::load('sign.v2.b2e.placeholders-widget');
}

Asset::getInstance()->addString('<script src="' . $arResult['SERVER'] . '/web-apps/apps/api/documents/api.js"></script>');
$containerId = 'editorForm'.$this->randString();

$GLOBALS['APPLICATION']->SetTitle($arResult['OBJECT']['NAME']);
?>
<style>
	.ui-popupcomponentsmaker__header {
		background: radial-gradient(117.4% 131.09% at -2.79% -4.03%, #1D49B9 0%, #53C7F9 100%), linear-gradient(180deg, #4756F4 0%, #669AFB 35.72%, #C4D6FD 73.82%, rgba(248, 248, 248, 0.00) 100%);
	}

	.ui-popupcomponentmaker .popup-window-angly--arrow {
		background: rgb(73, 127, 228);
		background: #467cdf;
	}

	.ui-popupcomponentsmaker-header-tariff__icon,
	.ui-popupcomponentsmaker-header-tariff__more,
	.ui-popupcomponentsmaker-header-tariff__title,
	.ui-popupcomponentsmaker-header-tariff__subtitle,
	.ui-popupcomponentsmaker-header-tariff__message-wrapper .ui-popupcomponentsmaker-header-tariff__title,
	.ui-popupcomponentsmaker-header-tariff__message-wrapper .ui-popupcomponentsmaker-header-tariff__subtitle {
		color: #fff;
	}

	.ui-popupcomponentsmaker-header-tariff__icon .ui-icon-set {
		background-color: #fff;
	}

	.ui-popupcomponentsmaker-header-tariff__icon {
		--ui-icon-set__icon-size: 35px;
		margin-right: 5px;
	}

	.ui-popupcomponentsmaker-header-tariff__message-wrapper .ui-popupcomponentsmaker-header-tariff__text,
	.ui-popupcomponentsmaker-header-tariff__message-wrapper .ui-popupcomponentsmaker-header-tariff__subtitle {
		color: #f2f2f2;
	}

</style>
<div data-id="<?= $containerId ?>-wrapper">
	<div data-id="<?= $containerId ?>-header" class="disk-document-header-container"></div>
	<div data-id="<?= $containerId ?>" class="disk-fe-office-editor-box">
		<div id="<?= $containerId ?>-editor" data-id="<?= $containerId ?>-editor"></div>
	</div>
</div>

<script>
	<?='BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');'?>

	BX.Disk.UrlCleaner.cleanUrl(window.location, window.history, [
		/^analytics\[/i,
		/^immediate/i,
	]);

	new BX.Disk.Editor.OnlyOffice({
		targetNode: document.querySelector('[data-id="<?= $containerId ?>"]'),
		headerContainerNode: document.querySelector('[data-id="<?= $containerId ?>-header"]'),
		logoUrl: '<?= \CUtil::JSEscape((string)($arResult['HEADER_LOGO_LINK'] ?? '')) ?>',
		headerComposition: <?= Json::encode($arResult['HEADER_COMPOSITION'] ?? null) ?>,
		editorJson: <?= $arResult['EDITOR_JSON'] ?>,
		editorNode: document.querySelector('[data-id="<?= $containerId ?>-editor"]'),
		editorWrapperNode: document.querySelector('[data-id="<?= $containerId ?>-wrapper"]'),
        pullConfig: <?= Json::encode($arResult['PULL_CONFIG']) ?>,
		pullUserConfig: <?= Json::encode($arResult['PULL_USER_CONFIG']) ?>,
		presenceConfig: <?= Json::encode($arResult['PRESENCE_CONFIG'] ?? ['enabled' => false]) ?>,
        linkToEdit: '<?= $arResult['EDITOR']['ALLOW_EDIT'] ? $arResult['LINK_TO_EDIT'] : '' ?>',
        linkToView: '<?= $arResult['LINK_OPEN_NEW_WINDOW'] ?>',
        linkToDownload: '<?= $arResult['LINK_TO_DOWNLOAD'] ?>',
		documentSession: {
			id: <?= $arResult['DOCUMENT_SESSION']['ID'] ?>,
			hash: '<?= $arResult['DOCUMENT_SESSION']['HASH'] ?>',
		},
		object: {
			id: <?= $arResult['OBJECT']['ID'] ?>,
			name: '<?= \CUtil::JSEscape($arResult['OBJECT']['NAME']) ?>',
			size: <?= (int)$arResult['OBJECT']['SIZE'] ?>,
			uniqueCode: '<?= \CUtil::JSEscape($arResult['FILE_UNIQUE_CODE']) ?>',
			docType: '<?= \CUtil::JSEscape($arResult['OBJECT']['DOC_TYPE']) ?>',
		},
		attachedObject: {
			id: <?= $arResult['ATTACHED_OBJECT']['ID'] ?: 'null' ?>,
		},
		currentUser: <?= $arResult['CURRENT_USER'] ?>,
		downloadSizeValue: '<?= \CUtil::JSEscape($arResult['OBJECT']['SIZE_READABLE']) ?>',
		sessionBoostOptions: <?= Json::encode($arResult['SESSION_BOOST_OPTIONS']) ?>,
		promoShowImmediately: <?= Json::encode($arResult['PROMO_SHOW_IMMEDIATELY'])  ?>,
		realtimeForceReloadTag: '<?= \CUtil::JSEscape($arResult['REALTIME_FORCE_RELOAD_TAG'] ?? null) ?>',
		realtimeForceReloadCommand: '<?= \CUtil::JSEscape($arResult['REALTIME_FORCE_RELOAD_COMMAND'] ?? null) ?>',
		autoForceReloadAfter: <?= Json::encode($arResult['AUTO_FORCE_RELOAD_AFTER'] ?? null) ?>,
		texts: {
			forceReloadRegularServer: '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_EDITOR_ONLYOFFICE_FORCE_RELOAD_REGULAR_SERVER')) ?>',
			forceReloadBoosterServer: '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_EDITOR_ONLYOFFICE_FORCE_RELOAD_BOOSTER_SERVER')) ?>',
			forceReloadUndefinedServer: '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_EDITOR_ONLYOFFICE_FORCE_RELOAD_UNDEFINED_SERVER')) ?>',
			forceReloadPopupOkButton: '<?= CUtil::JSEscape(Loc::getMessage('DISK_FILE_EDITOR_ONLYOFFICE_FORCE_RELOAD_POPUP_OK_BUTTON')) ?>',
		},
	});

	<?php if ($isSignPlaceholdersEnabled): ?>
	new BX.Sign.V2.B2e.PlaceholdersWidget().show();
	<?php endif; ?>
</script>
<script>
	BX.Helper.init({
		frameOpenUrl: '<?=$frameOpenUrl?>',
		langId: '<?=LANGUAGE_ID?>',
		isNewHelpdesk: '<?= \Bitrix\Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N' ?>',
	});
</script>
