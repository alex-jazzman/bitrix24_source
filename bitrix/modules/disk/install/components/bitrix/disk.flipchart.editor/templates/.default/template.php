<?php

/** @var array<string, mixed> $arParams */
/** @var array<string, mixed> $arResult */

use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Disk\Document\Flipchart\Configuration;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die;

/** @global CMain $APPLICATION */
global $APPLICATION;

$containerId = 'flipchart-wrapper';
$boardContainerId = 'flipchart-editor';

Loader::includeModule('socialnetwork');

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'popup',
	'main.core',
	// The shared header of the viewer: the page renders only its container and hands over the
	// context of the opening.
	'disk.document-header',
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
$annotationsEnabled = (bool)($arResult['ANNOTATIONS_ENABLED'] ?? false);
$tagsEnabled = (bool)($arResult['TAGS_ENABLED'] ?? false);
$commentsEnabled = (bool)($arResult['COMMENTS_ENABLED'] ?? false);
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
?>

<div data-id="<?= $containerId ?>-wrapper">
	<?php if (!$isMobile): ?>
		<div data-id="<?= $containerId ?>-header" class="disk-document-header-container"></div>
	<?php endif ?>
	<div data-id="<?= $containerId ?>" class="disk-fe-flipchart-editor-box<?= $isMobile ? ' --without-header' : '' ?>">
		<div class="boards-editor-wrapper" id="<?= $boardContainerId ?>" style="height: 100%"></div>
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
		// The header draws itself from the composition the server describes; the shell gives it the
		// container and the part of the context of the opening the composition does not carry.
		headerContainerNode: document.querySelector('[data-id="<?= $containerId ?>-header"]'),
		documentSessionHash: '<?= \CUtil::JSEscape($arResult['SESSION_ID']) ?>',
		logoUrl: '<?= \CUtil::JSEscape($arResult['HEADER_LOGO_URL']) ?>',
		headerComposition: <?= Json::encode($arResult['HEADER_COMPOSITION'] ?? null) ?>,
		// what the board says is accepted only from the frame it was opened in
		boardContainerId: '<?= $boardContainerId ?>',
	})

	BX.ready(() => {
		const mentionMembers = new BX.Disk.Flipchart.MentionMembers();

		const sdk = new BX.Disk.Flipchart.SDK({
			containerId: '<?= $boardContainerId ?>',
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
					mentions: true,
					annotations: <?= Json::encode($annotationsEnabled) ?>,
					tags: <?= Json::encode($tagsEnabled) ?>,
					comments: <?= Json::encode($commentsEnabled) ?>,
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
<?php if ($isMobile): ?>
				// This variant renders no header, so the page keeps renaming the object itself; where
				// the header is mounted, the same event goes to the server through it.
				onBoardRenamed(newName) {

					notifyMobileApp({ boardName: newName });

					return BX.ajax.runAction('disk.api.file.rename', {
						data: {
							fileId: <?= $arResult['ORIGINAL_DOCUMENT_ID'] ?>,
							newName: newName + '.board'
						}
					});

				},
<?php endif ?>
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

				// Wiring only: the lookup and the shape of a member live in the extension, and every
				// request is ended there - by its result, by its error or by the cancel of the board.
				onMentionMembersRequest(data) {

					return mentionMembers.request(data);

				},
				onMentionMembersCancel(data) {

					mentionMembers.cancel(data);

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
