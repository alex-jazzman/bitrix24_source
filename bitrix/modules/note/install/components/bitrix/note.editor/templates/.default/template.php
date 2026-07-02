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
if (($error['REASON'] ?? null) === 'tariff')
{
	Extension::load(['main.sidepanel', 'ui.info-helper']);
	$sliderCode = (string)($error['SLIDER_CODE'] ?? '');
	?>
	<script>
		BX.ready(() => {
			BX.addCustomEvent('SidePanel.Slider:onCloseComplete', () => {
				window.location.replace('/');
			});
			BX.UI.InfoHelper.show('<?= CUtil::JSEscape($sliderCode) ?>', {
				isLimit: true,
				limitAnalyticsLabels: { module: 'note' },
			});
		});
	</script>
	<?php

	return;
}

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

$mountId = 'note-editor-app';
$documentId = (int)($arResult['DOCUMENT_ID'] ?? 0);
$directLink = (string)($arResult['DIRECT_LINK'] ?? 'N');
$initialCollectionsJson = Json::encode($arResult['INITIAL_COLLECTIONS'] ?? null);
$initialSidebarContextJson = Json::encode($arResult['INITIAL_SIDEBAR_CONTEXT'] ?? null);
$initialWelcomeDocId = (int)($arResult['INITIAL_WELCOME_DOC_ID'] ?? 0);
$sidebarOptionsJson = Json::encode($arResult['SIDEBAR_OPTIONS'] ?? null);
$isMobile = !empty($arResult['IS_MOBILE']);
$theme = ($arResult['THEME'] ?? 'light') === 'dark' ? 'dark' : 'light';
$themeContextClass = $theme === 'dark' ? '--ui-context-content-dark' : '--ui-context-content-light';

if ($isMobile)
{
	Asset::getInstance()->addString(
		'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
		true,
	);
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
			initialSidebarContext: <?= $initialSidebarContextJson ?>,
			initialWelcomeDocId: <?= $initialWelcomeDocId ?>,
			sidebarOptions: <?= $sidebarOptionsJson ?>,
			isMobile: <?= $isMobile ? 'true' : 'false' ?>,
			theme: '<?= CUtil::JSEscape($theme) ?>',
		});
	});
</script>
