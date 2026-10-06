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

use Bitrix\Disk\Document\OnlyOffice\Editor\ConfigBuilder;
use Bitrix\Disk\Document\OnlyOffice\OnlyOfficeHandler;
use Bitrix\Disk\Internals\BaseComponent;
use Bitrix\Main\Context;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Icon;
use Bitrix\UI\Buttons\Size;
use Bitrix\UI\Buttons\Split;
use Bitrix\UI\Buttons\Tag;

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
	'disk.users',
	// Realtime available-session counter. The limit is global per portal (shared
	// RestrictionManager / restriction log), so this engine-agnostic extension is reused
	// as-is: loading it subscribes to the pull tag and seeds DocumentEditSessionLimit. The
	// commercial OnlyOffice promo/boost bundles are intentionally NOT pulled in (ADR §8).
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
$headerText = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_MODE_VIEW');
if ($arResult['EDITOR']['MODE'] === ConfigBuilder::MODE_EDIT)
{
	$headerText = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_MODE_EDIT');
}

$editMode = $arResult['EDITOR']['MODE'] === ConfigBuilder::MODE_EDIT;

// The header "Edit" affordance is rendered only in view mode (see the header markup below).
// Building it in edit mode would create a button that is never rendered and would still hand
// its uniqId to the JS wrapper for nothing, so it is built only when it will be shown.
$editButton = null;
if (!$editMode)
{
	if ($arResult['EDITOR']['ALLOW_EDIT'])
	{
		if ($arResult['EXTERNAL_LINK_MODE'])
		{
			// External-link viewer: a plain green "Edit" button, no "Open in..." menu (parity with
			// the OnlyOffice shell). Split\SaveButton defaults to Color::SUCCESS, so the round green
			// look is preserved without an explicit color call.
			$editButton = Bitrix\UI\Buttons\SaveButton::create();
			$editButton->setRound();
		}
		else
		{
			// In-portal editor: split "Edit" button carrying the "Open in..." menu, 1:1 with the
			// OnlyOffice shell. Items are built from $arResult['DOCUMENT_HANDLERS'] (cloud handlers +
			// "Local applications"); the "own" engine item ("Битрикс24.Docs" / OnlyOfficeHandler code)
			// gets the "new" badge and opens the current editor in place — see the JS wrapper.
			$editButton = Split\SaveButton::create([
				'classList' => ['ui-btn-round', 'disk-fe-office-btn-edit'],
			]);
			$badgeNew = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_BADGE_NEW_EDITOR_BITRIX24');
			$editButtonItems = [];

			foreach (($arResult['DOCUMENT_HANDLERS'] ?? []) as $i => $documentHandler)
			{
				$editButtonItems[$i] = [
					'id' => $documentHandler['code'],
					'text' => $documentHandler['name'],
					'className' => 'disk-fe-office-edit-popup-item disk-fe-office-icon-' . htmlspecialcharsbx($documentHandler['code']),
				];

				if ($documentHandler['code'] === OnlyOfficeHandler::getCode())
				{
					$editButtonItems[$i]['html']
						= '<span class="disk-fe-office-edit-badge">' . htmlspecialcharsbx($badgeNew) . '</span>'
						. '<span>' . htmlspecialcharsbx($documentHandler['name']) . '</span>';
					unset($editButtonItems[$i]['text']);
				}
			}

			$editButton->setMenu([
				'items' => $editButtonItems,
			]);
		}

		$editButton
			->setText(Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_BTN_EDIT'))
			->setIcon(Icon::EDIT)
			->setSize(Size::SMALL)
			->addAttribute('data-testid', 'disk-vibeoffice-edit')
		;
	}
	else
	{
		$editButton = Button::create()
			->setRound()
			->setDisabled()
			->setIcon(Icon::EDIT)
			->setText(Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_BTN_EDIT'))
			->setTag(Tag::LINK)
			->setSize(Size::SMALL)
			->setColor(Color::LIGHT_BORDER)
			->addAttribute('title', Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_BTN_EDIT_LACK_PERM'))
		;
	}
}

$setupSharingButton = null;
if (!empty($arResult['SHARING_CONTROL_TYPE']))
{
	$setupSharingButton = Button::create();
	$setupSharingButton
		->setText(Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_BTN_SHARING'))
		->addAttribute('data-testid', 'disk-vibeoffice-sharing')
		->addClass('disk-fe-office-header-btn-access-setting')
		->setSize(Size::SMALL)
		->setColor(Color::LIGHT_BORDER)
		->setRound()
	;
}

if ($editMode && $setupSharingButton)
{
	$setupSharingButton->setColor(Color::PRIMARY);
}

$downloadButton = null;
$shouldDisableSharingButton = $arResult['SHOULD_DISABLE_SHARING_BUTTON'] || $arResult['EXTERNAL_LINK_MODE'];

if ($shouldDisableSharingButton && $setupSharingButton)
{
	$setupSharingButton = null;
}

if ($shouldDisableSharingButton && !empty($arParams['LINK_TO_DOWNLOAD']))
{
	$downloadButton = Button::create();
	$downloadButton
		->setTag(Tag::LINK)
		->setSize(Size::SMALL)
		->setColor(Color::LIGHT_BORDER)
		->setRound()
		->setText(Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_BTN_DOWNLOAD'))
		->setLink($arParams['LINK_TO_DOWNLOAD'])
		->addAttribute('target', '_blank')
	;
}

$headerLogoClass = '';
if (Context::getCurrent()->getLanguage() !== 'ru')
{
	$headerLogoClass = 'disk-fe-office-header-logo--eng';
}

$GLOBALS['APPLICATION']->SetTitle($arResult['OBJECT']['NAME']);
?>
<div
	data-id="<?= $containerId ?>-wrapper"
	data-testid="disk-vibeoffice"
	data-document-session-id="<?= (int)$arResult['DOCUMENT_SESSION']['ID'] ?>"
>
	<div class="disk-fe-office-header">
		<div class="disk-fe-office-header-left">
			<a href="<?= htmlspecialcharsbx((string)$arResult['HEADER_LOGO_LINK']) ?>" class="disk-fe-office-header-logo <?= $headerLogoClass ?>" target="_blank"></a>
			<div class="disk-fe-office-header-mode">
				<span class="disk-fe-office-header-mode-text"><?= $headerText ?></span>
			</div>
		</div>
		<div class="disk-fe-office-header-right">
			<?php if (!$editMode): ?>
				<?= $editButton ? $editButton->render(false) : '' ?>
			<?php endif ?>
			<?= $downloadButton ? $downloadButton->render(false) : '' ?>
			<div class="disk-fe-office-header-control-box">
				<div class="disk-fe-office-header-online"><?= Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_ONLINE_LABEL') ?></div>
				<div data-id="<?= $containerId ?>-user-box" data-testid="disk-vibeoffice-users">
				</div>
				<?= $setupSharingButton ? $setupSharingButton->render(false) : '' ?>
				<?php if ($arParams['SHOW_BUTTON_OPEN_NEW_WINDOW']): ?>
					<a href="<?= $arResult['LINK_OPEN_NEW_WINDOW'] ?>" target="_blank" class="disk-fe-office-header-resize-btn" title="<?= Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_NEW_TAB') ?>"></a>
				<?php endif ?>
			</div>
		</div>
	</div>
	<div data-id="<?= $containerId ?>" data-testid="disk-vibeoffice-editor" style="height: calc(100vh - 70px);">
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
		targetNode: document.querySelector('[data-id="<?= $containerId ?>"]'),
		editorNode: document.querySelector('[data-id="<?= $containerId ?>-editor"]'),
		userBoxNode: document.querySelector('[data-id="<?= $containerId ?>-user-box"]'),
		element: document.querySelector('[data-id="<?= $containerId ?>-editor"]'),
		panelButtonUniqIds: {
			edit: '<?= ($arResult['EDITOR']['ALLOW_EDIT'] && $editButton) ? $editButton->getUniqId() : '' ?>',
			setupSharing: '<?= $setupSharingButton ? $setupSharingButton->getUniqId() : '' ?>'
		},
		linkToEdit: '<?= \CUtil::JSEscape((string)($arResult['EDITOR']['ALLOW_EDIT'] ? $arResult['LINK_TO_EDIT'] : '')) ?>',
		linkToView: '<?= \CUtil::JSEscape((string)$arResult['LINK_OPEN_NEW_WINDOW']) ?>',
		linkToDownload: '<?= \CUtil::JSEscape((string)$arResult['LINK_TO_DOWNLOAD']) ?>',
		// Existing Disk object pull channel (object_{id}); used only to receive the live
		// `contentUpdated` host notification for an already-open VIEW. Mirrors OnlyOffice.
		pullConfig: <?= Json::encode($arResult['PULL_CONFIG'] ?? null) ?>,
		presenceConfig: <?= Json::encode($arResult['PRESENCE_CONFIG'] ?? ['enabled' => false]) ?>,
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
		// The wrapper's user-facing strings (failover/session notifications) come from the
		// extension's own localization (install/js/disk/editor-vibeoffice/lang/*/config.php)
		// via the `#text()` fallback; no per-string override is passed from the shell here.
	});
</script>
<script>
	BX.Helper.init({
		frameOpenUrl: '<?= \CUtil::JSEscape((string)$frameOpenUrl) ?>',
		langId: '<?= \CUtil::JSEscape((string)LANGUAGE_ID) ?>',
		isNewHelpdesk: '<?= \Bitrix\Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N' ?>',
	});
</script>
