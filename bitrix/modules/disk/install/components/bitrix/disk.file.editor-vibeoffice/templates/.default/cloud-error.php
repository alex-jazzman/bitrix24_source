<?php

/** @var $this CBitrixComponentTemplate */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @var CBitrixComponentTemplate $this */
/** @var BaseComponent $component */

use Bitrix\Disk\Internals\BaseComponent;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
Loc::loadLanguageFile(__DIR__ . '/template.php');

/** @var array $arResult */
Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
]);

$containerId = 'cloud-error-' . $this->randString();
$headerText = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_HEADER_MODE_VIEW');

$title = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_CLOUD_ERROR_COMMON_TITLE');
$description = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_CLOUD_ERROR_COMMON_DESCR');
$failureKind = $arResult['OPEN_FAILURE_KIND'] ?? null;
if ($failureKind === 'save_refused')
{
	$title = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVE_REFUSED_TITLE');
	$description = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVE_REFUSED_DESCR');
}
elseif ($failureKind === 'open_operation_expired')
{
	$title = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_OPEN_EXPIRED_TITLE');
	$description = Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_OPEN_EXPIRED_DESCR');
}
$reason = $arResult['SAVE_REFUSAL_REASON'] ?? null;
?>
<div data-id="<?= $containerId ?>-wrapper">
	<div class="disk-fe-office-header">
		<div class="disk-fe-office-header-left">
			<div class="disk-fe-office-header-mode">
				<span class="disk-fe-office-header-mode-text"><?= $headerText ?></span>
			</div>
		</div>
	</div>
	<div data-id="<?= $containerId ?>" style="height: calc(100vh - 70px)">
		<div
			class="disk-fe-vo-cloud-error"
			data-id="<?= $containerId ?>-base"
			data-testid="disk-vibeoffice-error"
		>
			<div class="disk-fe-vo-cloud-error-title"><?= $title ?></div>
			<div class="disk-fe-vo-cloud-error-desc"><?= $description ?></div>
			<?php if ($failureKind === 'save_refused' && is_string($reason) && $reason !== ''): ?>
				<div class="disk-fe-vo-cloud-error-desc">
					<?= Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_SAVE_REFUSED_REASON') ?>:
					<?= htmlspecialcharsbx($reason) ?>
				</div>
			<?php elseif ($failureKind === 'open_operation_expired' && isset($arResult['OPEN_RETRY_URL'])): ?>
				<a href="<?= htmlspecialcharsbx($arResult['OPEN_RETRY_URL']) ?>" data-testid="disk-vibeoffice-open-again">
					<?= Loc::getMessage('DISK_FILE_EDITOR_VIBEOFFICE_OPEN_EXPIRED_RETRY') ?>
				</a>
			<?php endif; ?>
		</div>
	</div>
</div>
