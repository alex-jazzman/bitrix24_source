<?php

use Bitrix\Intranet\CurrentUser;
use Bitrix\Intranet\Entity;
use Bitrix\Intranet\Internal;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

require_once($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php');

\CJSCore::Init();
global $APPLICATION;
$APPLICATION->showHead();

Extension::load([
	'ui.system.typography',
	'ui.alerts',
	'ui.design-tokens.air',
	'intranet.design-tokens',
	'intranet.push-otp.print-recovery-codes',
	'sidepanel',
]);

$currentUser = CurrentUser::get();
$user = new Entity\User((int)$currentUser->getId());
$recoveryCodes = (new Internal\Integration\Security\RecoveryCodes($user))->getList(true, true);
$domain = (new Internal\Integration\Main\Context\DomainProvider())->getDomain();

?>
<div class="intranet-otp-codes-print-page"></div>
<script>
	BX.ready(() => {
		const container = document.querySelector('.intranet-otp-codes-print-page');
		(new BX.Intranet.PushOtp.PrintRecoveryCodes(
			{
				codes: <?= Json::encode($recoveryCodes) ?>,
				domain: '<?= \CUtil::JSEscape($domain) ?>',
			}
		)).renderTo(container);
	});
</script>
<?php

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/epilog_after.php');
