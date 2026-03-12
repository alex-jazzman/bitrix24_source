<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/**
* @var array $arResult
*/

\Bitrix\Main\UI\Extension::load([
	'ui.buttons',
]);

?>

<div class="biconnector-create-superset-wrapper">
	<div class="biconnector-create-superset-content">
		<div class="biconnector-create-superset-error-svg"></div>
		<div class="biconnector-create-superset-title">
			<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_CREATE_SUPERSET_TITLE_MSGVER_1') ?>
		</div>
	</div>
</div>

<script>
	BX.ready(() => {
		BX.PULL && BX.PULL.extendWatch('superset_dashboard', true);
		BX.Event.EventEmitter.subscribe('onPullEvent-biconnector', (event) => {
			const [eventName] = event.data;
			if (eventName === 'onSupersetStatusUpdated')
			{
				location.reload();
			}
		});
	});
</script>
