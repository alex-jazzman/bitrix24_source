<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

/**
* @var array $arResult
*/

$isAdmin = $arResult['IS_ADMIN'] ?? false;

$settingsUrl = '';
if (Loader::includeModule('intranet'))
{
	$settingsUrl = \Bitrix\Intranet\Portal::getInstance()->getSettings()->getSettingsUrl() . '?page=tools';
}

$extensions = [
	'ui.buttons',
	'ui.design-tokens',
];

if ($isAdmin)
{
	$extensions[] = 'biconnector.rebind-superset-popup';
}

\Bitrix\Main\UI\Extension::load($extensions);
?>

<div class="biconnector-link-superset-wrapper">
	<div class="biconnector-link-superset-content">
		<div class="biconnector-link-superset-icon"></div>
		<div class="biconnector-link-superset-title">
			<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_REBIND_SUPERSET_TITLE') ?>
		</div>
		<?php
			if ($isAdmin):
		?>
				<div class="biconnector-link-superset-description">
					<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_REBIND_SUPERSET_DESCRIPTION') ?>
				</div>
				<div class="biconnector-link-superset-button-container">
					<button id="rebind-superset-button" class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps">
						<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_REBIND_SUPERSET_BUTTON') ?>
					</button>
				</div>
		<?php
			else:
		?>
				<div class="biconnector-link-superset-description">
					<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_REBIND_SUPERSET_DESCRIPTION_NO_ACCESS') ?>
				</div>
		<?php
			endif;
		?>
	</div>
</div>

<?php
	if ($isAdmin):
?>
		<script>
			BX.ready(() => {
				BX('rebind-superset-button').onclick = () => {
					const popup = new BX.BIConnector.RebindSupersetPopup({
						settingsUrl: <?= \Bitrix\Main\Web\Json::encode($settingsUrl) ?>,
					});
					popup.show();
				};
			});
		</script>
<?php
	endif;
?>
