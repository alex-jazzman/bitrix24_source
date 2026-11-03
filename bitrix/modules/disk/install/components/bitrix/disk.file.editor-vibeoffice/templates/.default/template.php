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
	// Phase P2 helper bundle: it loads `api.js` itself by `openConfig.urls.api_js`
	// and exposes `BX.Disk.Editor.Vibeoffice`.
	'disk.editor-vibeoffice',
	// Serves the wrapper: the popup of the access and the rename of the object.
	'disk.document-header',
	// Realtime available-session counter. The limit is global per portal (shared
	// RestrictionManager / restriction log), so this engine-agnostic extension is reused
	// as-is: loading it subscribes to the pull tag and seeds DocumentEditSessionLimit.
	'disk.onlyoffice-session-restrictions',
	'main.loader',
	'pull.client',
	'ui.info-helper',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.icons.b24',
	'ui.notification',
	'popup',
	'ui.dialogs.messagebox',
	'disk.url-cleaner',
]);

$helpUrl = \Bitrix\UI\InfoHelper::getUrl('/widget2/', byLang: true);
$frameOpenUrl = (new Bitrix\Main\Web\Uri($helpUrl))->addParams(['action' => 'open'])->getUri();

$containerId = 'editorForm' . $this->randString();
$openingNotice = (string)Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_OBJECT_LOCK_OPENING_NOTICE');

$GLOBALS['APPLICATION']->SetTitle($arResult['OBJECT']['NAME']);
?>
<div
	data-id="<?= $containerId ?>-wrapper"
	data-testid="disk-vibeoffice"
	data-document-session-id="<?= (int)$arResult['DOCUMENT_SESSION']['ID'] ?>"
>
	<div data-id="<?= $containerId ?>" data-testid="disk-vibeoffice-editor" class="disk-fe-office-editor-box">
		<div id="<?= $containerId ?>-editor" data-id="<?= $containerId ?>-editor"></div>
	</div>
</div>

<script>
	<?='BX.message(' . \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) . ');'?>

	BX.Disk.UrlCleaner.cleanUrl(window.location, window.history, [
		/^analytics\[/i,
		/^immediate/i,
	]);

	// Single initialization point. The platform builds & signs the config; the helper
	// (phase P2) feeds the proxied openConfig to `@vibeoffice/helper createEditor` as-is
	// and loads `api.js` itself by `openConfig.urls.api_js`.
	new BX.Disk.Editor.Vibeoffice({
		openConfig: <?= $arResult['OPEN_CONFIG'] ?>,
		externalLinkMode: <?= Json::encode((bool)$arResult['EXTERNAL_LINK_MODE']) ?>,
		restartTarget: <?= Json::encode($arResult['RESTART_TARGET'] ?? null) ?>,
		openingBudget: <?= Json::encode($arResult['OPENING_BUDGET'] ?? null) ?>,
		targetNode: document.querySelector('[data-id="<?= $containerId ?>"]'),
		editorNode: document.querySelector('[data-id="<?= $containerId ?>-editor"]'),
		element: document.querySelector('[data-id="<?= $containerId ?>-editor"]'),
		headerComposition: <?= Json::encode($arResult['HEADER_COMPOSITION'] ?? null) ?>,
		linkToView: '<?= \CUtil::JSEscape((string)$arResult['LINK_OPEN_NEW_WINDOW']) ?>',
		linkToDownload: '<?= \CUtil::JSEscape((string)$arResult['LINK_TO_DOWNLOAD']) ?>',
		<?php if (($arResult['LINK_TO_EDIT'] ?? '') !== ''): ?>
		linkToEdit: '<?= \CUtil::JSEscape($arResult['LINK_TO_EDIT']) ?>',
		<?php endif ?>
		// Existing Disk object pull channel (object_{id}); used only to receive the live
		// `contentUpdated` host notification for an already-open VIEW. Mirrors OnlyOffice.
		pullConfig: <?= Json::encode($arResult['PULL_CONFIG'] ?? null) ?>,
		publicChannel: '<?= \CUtil::JSEscape((string)($arResult['PUBLIC_CHANNEL'] ?? '')) ?>',
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
		// P4 (version-history panel) is intentionally not implemented, so the helper's
		// history UI stays off. Flip to true only when the onRequestHistory* wiring lands.
		historyEnabled: false,
		initialNotice: <?= $arResult['INITIAL_NOTICE'] ? 'true' : 'false' ?>,
		texts: {
			openingNotice: '<?= \CUtil::JSEscape($openingNotice) ?>',
		},
	});
</script>
<script>
	BX.Helper.init({
		frameOpenUrl: '<?= \CUtil::JSEscape((string)$frameOpenUrl) ?>',
		langId: '<?= \CUtil::JSEscape((string)LANGUAGE_ID) ?>',
		isNewHelpdesk: '<?= \Bitrix\Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N' ?>',
	});
</script>
