<?php

/** @var array<string, mixed> $arParams */
/** @var array<string, mixed> $arResult */

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Size;
use Bitrix\Disk\Document\Flipchart\Configuration;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die;

/** @global CMain $APPLICATION */
global $APPLICATION;

$containerId = 'flipchart-wrapper';

Loader::includeModule('socialnetwork');

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'popup',
	'main.core',
	'disk.sharing-legacy-popup',
	'disk.external-link',
	'loader',
	'socnetlogdest',
	'intranet.sidepanel.bindings',
]);

$APPLICATION->SetTitle($arResult['DOCUMENT_NAME']);

$isMobile = $arResult['DISPLAY_VARIANT'] === 'mobile';
$tasksEnabled = (bool)($arResult['TASKS_ENABLED'] ?? false);
// Stage 3 (spec 2): the option gate does not check the module, but without
// tasks the task-with-id entity config is empty and the pick dialog would
// hang forever - so the pick capability requires the module on top of the gate.
$tasksPickEnabled = $tasksEnabled && Loader::includeModule('tasks');
// Stage 4 (spec 2): the same reinforced gate - without the tasks module the
// action controllers and the tasks.v2.lib.* extension configs are absent.
$tasksActionsEnabled = $tasksPickEnabled;
$appOrigin = '';
if ($tasksEnabled)
{
	Extension::load(['disk.board-tasks']);

	// disk.board-tasks does not depend on the vendored SDK (it is overwritten wholesale on
	// vendor updates) and pins its own trusted origin from APP_URL, the same source the SDK
	// derives its origin from client-side.
	$appUri = new \Bitrix\Main\Web\Uri((string)$arResult['APP_URL']);
	$appOrigin = $appUri->getScheme() . '://' . $appUri->getHost();
	$defaultPort = $appUri->getScheme() === 'https' ? 443 : 80;
	if ($appUri->getPort() !== null && $appUri->getPort() !== $defaultPort)
	{
		$appOrigin .= ':' . $appUri->getPort();
	}
}

$helpUrl = \Bitrix\UI\InfoHelper::getUrl('/widget2/', byLang: true);
$frameOpenUrl = (new Bitrix\Main\Web\Uri($helpUrl))->addParams(['action' => 'open'])->getUri();

$sharingButtonHtml = '';
if (!$isMobile && $arResult['SHOULD_SHOW_SHARING_BUTTON'])
{
	$setupSharingButton = Button::create();

	$setupSharingButton
		->setText(Loc::getMessage('DISK_FLIPCHART_EDITOR_ACCESS_RIGHTS_MSGVER_1'))
		->addClass('disk-fe-flipchart-btn-access-setting')
		->setSize(Size::SMALL)
		->setColor(Color::PRIMARY)
		->setRound()
		->addAttribute(
			'data-should-block-external-link-feature',
			$arResult['SHOULD_BLOCK_EXTERNAL_LINK_FEATURE'] ? 'true' : 'false',
		)
		->addAttribute(
			'data-blocker-external-link-feature',
			(string)$arResult['BLOCKER_EXTERNAL_LINK_FEATURE'],
		)
	;

	$sharingButtonHtml = $setupSharingButton->render(false);
}
?>

<div data-id="<?= $containerId ?>-wrapper">
	<?php if (!$isMobile)
		{ ?>
	<div class="disk-fe-office-header">
		<div class="disk-fe-office-header-left">
			<div class="disk-fe-flipchart-header-logo-box">
				<?php
				if ($arResult['LANGUAGE'] === 'ru')
				{
				?>
					<a href="<?= $arResult['HEADER_LOGO_URL'] ?>" class="disk-fe-flipchart-header-logo" target="_blank"></a>
				<?php
				}
				else
				{
				?>
					<a href="<?= $arResult['HEADER_LOGO_URL'] ?>" class="disk-fe-flipchart-header-logo --eng" target="_blank"></a>
				<?php
				}
				?>
				<span class="disk-fe-flipchart-header-logo-name"><?= Loc::getMessage('DISK_FLIPCHART_EDITOR_HEADER_BOARDS') ?></span>
			</div>
			<div class="disk-fe-office-header-mode">
				<span class="disk-fe-office-header-mode-text"><?= htmlspecialcharsbx($arResult['DOCUMENT_NAME']) ?></span>
<?php if (isset($arResult['SERVICE_PROFILE'])): ?>
				<span class="disk-fe-flipchart-service-profile"><?= htmlspecialcharsbx($arResult['SERVICE_PROFILE']) ?></span>
<?php endif; ?>
			</div>
		</div>
		<div class="disk-fe-office-header-right">
			<div class="disk-fe-office-header-online"><?= Loc::getMessage('DISK_FLIPCHART_EDITOR_AUTOSAVE') ?></div>
			<?= $sharingButtonHtml?>
		</div>
	</div>
	<?php } ?>
	<div data-id="<?= $containerId ?>" style="height: calc(<?=$isMobile ? '100dvh' : '100vh - 70px' ?>);">
		<div class="boards-editor-wrapper" id="flipchart-editor" style="height: 100%"></div>
	</div>
</div>

<?php
if (Configuration::isReloadBoardAfterInactivityEnabled())
{
?>
<script>

	let lastActiveTime = Date.now();

	document.addEventListener("visibilitychange", function() {
		if (document.visibilityState === "visible") {
			if (Date.now() - lastActiveTime > <?=Configuration::getReloadBoardAfterInactivityDelay() ?>)
			{
				window.document.location.reload();
			}
		}
	});

	document.addEventListener("mousemove", function() {
		console.log('move');
		if (Date.now() - lastActiveTime > <?=(Configuration::getReloadBoardAfterInactivityDelay() * 2) ?>)
		{
			window.document.location.reload();
		}
		lastActiveTime = Date.now();
	});

</script>
<?php
}
?>

<?php
if ($isMobile)
{
?>
<script>
	let m = document.querySelector('meta[name="viewport"]');
	if (!m)
	{
		m = document.createElement('meta');
		m.name = 'viewport';
		document.querySelector('head').append(m);
	}
	m.content = 'width=device-width, initial-scale=1';
</script>
<?php } ?>

<script>

	let url = new URL(location.href);
	url.searchParams.delete('c_element');
	const boardElementId = url.searchParams.get('elementId');
	url.searchParams.delete('elementId');
	history.replaceState(null, '', url.toString());

	new BX.Disk.Flipchart.Board({
		panelButtonUniqIds: {
			setupSharing: '<?= isset($setupSharingButton) ? $setupSharingButton->getUniqId() : '' ?>',
		},
		boardData: {
			id: <?= $arResult['ORIGINAL_DOCUMENT_ID'] ?>,
			name: '<?= \CUtil::JSEscape($arResult['DOCUMENT_NAME']) ?>',
			uniqueCode: '<?= \CUtil::JSEscape($arResult['FILE_UNIQUE_CODE']) ?>',
		},
		sharingControlType: '<?= $arResult['SHARING_CONTROL_TYPE'] ?>',
		unifiedLinkAccessOnly: <?= Json::encode($arResult['UNIFIED_LINK_ACCESS_ONLY']) ?>,
	})

	BX.ready(() => {
		const sdk = new BX.Disk.Flipchart.SDK({
			containerId: 'flipchart-editor',
			appUrl: '<?= \CUtil::JSEscape((string)$arResult['APP_URL']) ?>',
			token: '<?= \CUtil::JSEscape((string)$arResult['TOKEN']) ?>',
			lang: '<?= $arResult['LANGUAGE'] ?>',
			boardUrl: window.location.origin + window.location.pathname,
			ui: {
				colorTheme: 'flipBitrixLight',
				openTemplatesModal: <?= Json::encode($arResult['SHOW_TEMPLATES_MODAL']) ?>,
				exportAsFile: true,
				spinner: 'circular',
				userKickable: true,
				confirmUserKick: false,
				scrollToElement: boardElementId,
				features: {
					elementLink: true,
					shareInBitrix: true,
					shareElementInSocials: true,
					bitrixTasks: <?= Json::encode($tasksEnabled) ?>,
					bitrixTasksPick: <?= Json::encode($tasksPickEnabled) ?>,
					bitrixTasksActions: <?= Json::encode($tasksActionsEnabled) ?>,
				},
				shareElementInBitrix: <?= Json::encode($tasksEnabled ? [] : ['createTask']) ?>,
			},
			permissions: {
				accessLevel: '<?= $arResult['ACCESS_LEVEL'] ?>',
				editBoard: <?= Json::encode($arResult['EDIT_BOARD']) ?>,
			},
			boardData: {
				fileUrl: '<?= $arResult['DOCUMENT_URL'] ?>',
				documentId: '<?= $arResult['DOCUMENT_ID'] ?>',
				sessionId: '<?= $arResult['SESSION_ID'] ?>',
				fileName: '<?= CUtil::JSEscape($arResult['DOCUMENT_NAME_WITHOUT_EXTENSION']) ?>',
			},
			events: {
				onBoardRenamed(newName) {

					notifyMobileApp({ boardName: newName });

					return BX.ajax.runAction('disk.api.file.rename', {
						data: {
							fileId: <?= $arResult['ORIGINAL_DOCUMENT_ID'] ?>,
							newName: newName + '.board'
						}
					});

				},
				onShareElementWithBitrix(event) {

					if (event.actionType === "createTask")
					{
						top.BX.Runtime.loadExtension('tasks.v2.application.task-card')
							.then(({ TaskCard }) => TaskCard.showCompactCard({
								title: '',
								description: decodeURIComponent(event.elementLink),
							}))
							.catch(e => {
								console.log('error creating task', e)
							})
					}

				},
			}
		});

<?php if ($tasksEnabled): ?>
		// Task logic lives entirely in the extension (spec 2.2); this is wiring only.
		// Attached before sdk.init() (spec 4.3): the extension must be listening
		// before the SDK starts emitting/consuming task-related messages.
		const detachTasks = BX.Disk.BoardTasks.attach({
			containerId: 'flipchart-editor',
			appOrigin: '<?= \CUtil::JSEscape($appOrigin) ?>',
		});
		const onTasksPageHide = (event) => {
			if (event.persisted) return; // bfcache: the page will come back alive (spec 4.3)
			detachTasks();
			window.removeEventListener('pagehide', onTasksPageHide);
		};
		window.addEventListener('pagehide', onTasksPageHide);
<?php endif; ?>

		sdk.init();

		// Both handlers reuse the SDK trust predicate: the expected origin is derived once, in the SDK.
		window.addEventListener("message", e => {
			if (!sdk.isTrustedMessage(e))
			{
				return;
			}

			if (e.data?.event === "waitSDKParams")
			{
				loader.hide();
			}
		});
<?php if (Configuration::isReloadBoardAfterInactivityEnabled()) { ?>

		window.addEventListener("message", e => {
			if (!sdk.isTrustedMessage(e))
			{
				return;
			}

			if (e.data?.event === "boardChanged" && document.visibilityState === "visible")
			{
				lastActiveTime = Date.now();
			}
		});
<?php } ?>

		notifyMobileApp({boardName: '<?= CUtil::JSEscape($arResult['DOCUMENT_NAME_WITHOUT_EXTENSION']) ?>'});
	})

	function notifyMobileApp({boardName}) {
		if (window.BXMobileApp?.Events) {
			BXMobileApp.Events.postToComponent('onBoardUpdate', { boardName });
		}
	}

	const loader = new BX.Loader({
		target: document.querySelector(".boards-editor-wrapper")
	});

	loader.show();

</script>
<script>
	BX.Helper.init({
		frameOpenUrl: '<?=$frameOpenUrl?>',
		langId: '<?=LANGUAGE_ID?>',
		isNewHelpdesk: '<?= \Bitrix\Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N' ?>',
	});
</script>
