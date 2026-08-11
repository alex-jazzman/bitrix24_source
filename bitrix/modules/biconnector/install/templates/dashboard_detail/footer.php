<?php

use Bitrix\BIConnector\Internal\Integration\AiAssistant\BitrixGptChat;
use Bitrix\Main;
use Bitrix\UI\InfoHelper;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
\CJSCore::Init(['helper']);

$helpWidgetUrl = InfoHelper::getUrl('/widget2/', byLang: true);
$helperInitParams = [
	'frameOpenUrl' => (new Main\Web\Uri($helpWidgetUrl))
		->addParams(['action' => 'open'])
		->getUri(),
	'langId' => LANGUAGE_ID,
	'isNewHelpdesk' => Main\Config\Option::get('intranet', 'isNewHelpdesk', 'N') === 'Y' ? 'Y' : 'N',
];

$bitrixGptIsAvailable = Main\Loader::includeModule('biconnector') && BitrixGptChat::isAvailable();
$bitrixGptInitiallyOpen = false;
$bitrixGptName = '';
if ($bitrixGptIsAvailable)
{
	// Sync open/closed state with the main portal AI chat (aiassistant module's "marta_is_open").
	$bitrixGptInitiallyOpen = \CUserOptions::GetOption('aiassistant', 'marta_is_open', 'N') === 'Y';
	$bitrixGptName = BitrixGptChat::getName();
}

?>
<?php if ($bitrixGptIsAvailable): ?>
	</div><?php /* .dashboard-layout__main */ ?>
	<div id="app__right-panel" class="dashboard-bitrixgpt-panel"></div>
	</div><?php /* .dashboard-layout */ ?>
<?php endif; ?>

<?php $APPLICATION->showBodyScripts(); ?>
<script>
	BX.ready(function() {
		if (BX.Helper && typeof BX.Helper.init === 'function')
		{
			BX.Helper.init(<?= \CUtil::PhpToJSObject($helperInitParams) ?>);
		}
	});
</script>

<?php if ($bitrixGptIsAvailable): ?>
	<script>
		BX.ready(function() {
			var launcher = BX.BIConnector && BX.BIConnector.BitrixGptLauncher;
			if (!launcher || typeof launcher.init !== 'function') {
				return;
			}
			launcher.init({
				panelNode: document.getElementById('app__right-panel'),
				initiallyOpen: <?= $bitrixGptInitiallyOpen ? 'true' : 'false' ?>,
				bitrixGptName: '<?= CUtil::JSEscape($bitrixGptName) ?>',
			});
		});
	</script>
<?php endif; ?>

</body>
</html>
