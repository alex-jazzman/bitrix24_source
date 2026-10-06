<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

$error = (array)($arResult['ERROR'] ?? []);
if (!empty($error['TITLE']))
{
	$APPLICATION->IncludeComponent(
		'bitrix:ui.info.error',
		'',
		[
			'TITLE' => (string)$error['TITLE'],
			'DESCRIPTION' => (string)($error['DESCRIPTION'] ?? ''),
		]
	);

	return;
}

Extension::load('note.app');

// Avatar rules for the chat button, loaded only when the chat is reachable. Position matters: the
// tariff slider below loads its extensions after the mount script, and copying that spot here would
// leave the button unstyled for the first frames.
if (!empty($arResult['AI_CHAT_ENABLED']))
{
	Extension::load('note.ui.ai-chat-avatar');
}

$mountId = 'note-editor-app';
$documentId = (int)($arResult['DOCUMENT_ID'] ?? 0);
$directLink = (string)($arResult['DIRECT_LINK'] ?? 'N');
$initialCollectionsJson = Json::encode($arResult['INITIAL_COLLECTIONS'] ?? null);
$initialFavoritesJson = Json::encode($arResult['INITIAL_FAVORITES'] ?? null);
$initialSidebarContextJson = Json::encode($arResult['INITIAL_SIDEBAR_CONTEXT'] ?? null);
$initialWelcomeDocId = (int)($arResult['INITIAL_WELCOME_DOC_ID'] ?? 0);
$sidebarOptionsJson = Json::encode($arResult['SIDEBAR_OPTIONS'] ?? null);
$isMobile = !empty($arResult['IS_MOBILE']);
$tariffSliderCode = (string)($arResult['TARIFF_SLIDER_CODE'] ?? '');
$historyEnabled = !empty($arResult['HISTORY_ENABLED']);
$notificationsEnabled = !empty($arResult['NOTIFICATIONS_ENABLED']);
$hotkeysEnabled = !empty($arResult['HOTKEYS_ENABLED']);
$sharedTreeEnabled = !empty($arResult['SHARED_TREE_ENABLED']);
$markdownIoEnabled = !empty($arResult['MARKDOWN_IO_ENABLED']);
$aiChatEnabled = !empty($arResult['AI_CHAT_ENABLED']);
$aiChatName = (string)($arResult['AI_CHAT_NAME'] ?? '');
$theme = ($arResult['THEME'] ?? 'light') === 'dark' ? 'dark' : 'light';
$themeContextClass = $theme === 'dark' ? '--ui-context-content-dark' : '--ui-context-content-light';

if ($isMobile)
{
	Asset::getInstance()->addString(
		'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
		true,
	);

	// Mobile app bridge: CMobile::Init() attaches bitrix_mobile.js / mobile_lib.js
	// (which define window.BXMobileApp / app) and mobile_tools exposes BX.MobileTools,
	// so portal links and task/user mentions open natively instead of the OS browser.
	// The bare note site template omits the mobile bootstrap, so we do it here.
	if (\Bitrix\Main\Loader::includeModule('mobileapp') && !defined('SKIP_MOBILEAPP_INIT'))
	{
		\CMobile::Init();
	}
	\CJSCore::Init(['mobile_tools']);
}

$APPLICATION->SetTitle(Loc::getMessage('NOTE_EDITOR_TEMPLATE_PAGE_TITLE'));
?>
<div class="note-editor-page">
	<div id="<?= htmlspecialcharsbx($mountId) ?>" class="note-editor-app <?= htmlspecialcharsbx($themeContextClass) ?>"></div>
</div>
<script>
	BX.ready(() => {
		const app = new BX.Note.App.NoteApp();
		app.mount('#<?= CUtil::JSEscape($mountId) ?>', {
			directLink: '<?= CUtil::JSEscape($directLink) ?>',
			documentId: <?= $documentId ?>,
			initialCollections: <?= $initialCollectionsJson ?>,
			initialFavorites: <?= $initialFavoritesJson ?>,
			initialSidebarContext: <?= $initialSidebarContextJson ?>,
			initialWelcomeDocId: <?= $initialWelcomeDocId ?>,
			sidebarOptions: <?= $sidebarOptionsJson ?>,
			isMobile: <?= $isMobile ? 'true' : 'false' ?>,
			historyEnabled: <?= $historyEnabled ? 'true' : 'false' ?>,
			notificationsEnabled: <?= $notificationsEnabled ? 'true' : 'false' ?>,
			hotkeysEnabled: <?= $hotkeysEnabled ? 'true' : 'false' ?>,
			sharedTreeEnabled: <?= $sharedTreeEnabled ? 'true' : 'false' ?>,
			markdownIoEnabled: <?= $markdownIoEnabled ? 'true' : 'false' ?>,
			aiChatEnabled: <?= $aiChatEnabled ? 'true' : 'false' ?>,
			aiChatName: '<?= CUtil::JSEscape($aiChatName) ?>',
			theme: '<?= CUtil::JSEscape($theme) ?>',
			tariffBlocked: <?= $tariffSliderCode !== '' ? 'true' : 'false' ?>,
		});
	});
</script>
<?php
if ($tariffSliderCode !== '')
{
	// Tariff/tool blocks access: the interface stays mounted underneath while the
	// tariff slider opens on top. On desktop, closing the slider redirects the user
	// away. On mobile we intentionally skip the redirect: navigating the webview to
	// the portal root escapes into the external OS browser, so we leave the user on
	// the (blocked) page instead.
	Extension::load(['main.sidepanel', 'ui.info-helper']);
	?>
	<script>
		BX.ready(() => {
			<?php if (!$isMobile): ?>
			BX.addCustomEvent('SidePanel.Slider:onCloseComplete', () => {
				window.location.replace('/');
			});
			<?php endif; ?>
			BX.UI.InfoHelper.show('<?= CUtil::JSEscape($tariffSliderCode) ?>', {
				isLimit: true,
				limitAnalyticsLabels: { module: 'note' },
			});
		});
	</script>
	<?php
}
?>
