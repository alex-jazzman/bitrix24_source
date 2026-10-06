<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;

/** @var array $arResult */
/** @var CBitrixComponentTemplate $this */
/** @var CMain $APPLICATION */
global $APPLICATION;

if (!empty($arResult['ACCESS_DENIED']))
{
	\Bitrix\Main\UI\Extension::load(['main.core', 'ui.system.alert']);
	?>
	<div id="msgsvc-ct-list-access-denied"></div>
	<script>
		BX.ready(() => {
			const { Alert, AlertDesign } = BX.UI.System.Alert;
			const alert = new Alert({
				design: AlertDesign.tintedAlert,
				content: <?= Json::encode((string)Loc::getMessage('MSGSVC_CT_LIST_ACCESS_DENIED')) ?>,
			});
			document.getElementById('msgsvc-ct-list-access-denied').appendChild(alert.render());
		});
	</script>
	<?php

	return;
}

// The grid row delete action calls BX.MessageService.CustomTemplate.List.requestDelete,
// defined in script.es6.js. The component script has no config.php/rel of its own, so
// main.core (needed to parse the script) is loaded here; the delete-only dependencies
// are lazy-loaded inside the delete flow.
\Bitrix\Main\UI\Extension::load(['main.core']);

$messages = Loc::loadLanguageFile(__FILE__);

?>
<script>
	BX.ready(() => {
		BX.message(<?= Json::encode($messages) ?>);
	});
</script>
<?php

$APPLICATION->IncludeComponent('bitrix:main.ui.grid', '', $arResult['GRID'], $this->getComponent());
