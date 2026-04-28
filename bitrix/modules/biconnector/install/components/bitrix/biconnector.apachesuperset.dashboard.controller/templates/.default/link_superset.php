<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

/**
* @var array $arResult
*/

$extensions = [
	'ui.buttons',
	'ui.design-tokens',
];

$isAdmin = $arResult['IS_ADMIN'] ?? false;
if ($isAdmin)
{
	$extensions[] = 'biconnector.relink-superset-popup';
}

\Bitrix\Main\UI\Extension::load($extensions);
?>

<div class="biconnector-link-superset-wrapper">
	<div class="biconnector-link-superset-content">
		<div class="biconnector-link-superset-icon"></div>
		<div class="biconnector-link-superset-title">
			<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_LINK_SUPERSET_TITLE') ?>
		</div>
		<?php
			if ($isAdmin):
		?>
				<div class="biconnector-link-superset-description">
					<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_LINK_SUPERSET_DESCRIPTION') ?>
				</div>
				<div class="biconnector-link-superset-button-container">
					<button id="link-superset-button" class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps">
						<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_LINK_SUPERSET_BUTTON') ?>
					</button>
				</div>
		<?php
			else:
		?>
				<div class="biconnector-link-superset-description">
					<?= Loc::getMessage('BICONNECTOR_SUPERSET_DASHBOARD_CONTROLLER_LINK_SUPERSET_DESCRIPTION_NO_ACCESS') ?>
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
				BX('link-superset-button').onclick = () => {
					const popup = new BX.BIConnector.RelinkSupersetPopup();
					popup.show();
				};
			});
		</script>
<?php
	endif;
?>
