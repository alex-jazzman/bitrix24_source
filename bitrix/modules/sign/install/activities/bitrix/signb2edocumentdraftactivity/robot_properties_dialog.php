<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\Automation\Helper;
use Bitrix\Main\Loader;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;
use Bitrix\Sign\Type\Bizproc\DraftFileSource;

if (!Loader::includeModule('sign'))
{
	die();
}

/** @var PropertiesDialog $dialog */

$map = $dialog->getMap();
$fileSource = $map[CBPSignB2EDocumentDraftActivity::PARAM_FILE_SOURCE];
$file = $map[CBPSignB2EDocumentDraftActivity::PARAM_FILE];
$fileExpression = $map[CBPSignB2EDocumentDraftActivity::PARAM_FILE_EXPRESSION];
$responsible = $map[CBPSignB2EDocumentDraftActivity::PARAM_RESPONSIBLE];

// without the disk module the canonical control is not rendered at all: it always draws the disk
// radio, no config of it turns that off, so DraftFileSource::FILE is unreachable on such a portal
// and the expression property below is the only source left
$isDiskAvailable = Loader::includeModule('disk');
if ($isDiskAvailable)
{
	// the disk branch of the canonical control opens the legacy disk file dialog
	Extension::load(['file_dialog']);

	$selectedSource = $dialog->getCurrentValue($fileSource['FieldName']);
	$selectedValue = $dialog->getCurrentValue($file['FieldName']);
	$fileSelectorConfig = [
		'type' => $selectedSource,
		'typeInputName' => $fileSource['FieldName'],
		'valueInputName' => $file['FieldName'],
		'multiple' => (bool)($file['Multiple'] ?? false),
		'label' => $file['Name'],
		'labelFile' => $fileSource['Options'][DraftFileSource::FILE->value] ?? '',
		'labelDisk' => $fileSource['Options'][DraftFileSource::DISK->value] ?? '',
		'selected' => $selectedSource === DraftFileSource::DISK->value
			? Helper::prepareDiskAttachments($selectedValue)
			: Helper::prepareFileAttachments($dialog->getDocumentType(), $selectedValue)
		,
	];
	?>
	<div
		class="bizproc-automation-popup-settings"
		data-role="file-selector"
		data-config="<?= htmlspecialcharsbx(Json::encode($fileSelectorConfig)) ?>"
	></div>
	<?php
}
?>
<div class="bizproc-automation-popup-settings">
	<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
		<?= htmlspecialcharsbx((string)$fileExpression['Name']) ?>:
	</span>
	<?= $dialog->renderFieldControl($fileExpression) ?>
</div>
<div class="bizproc-automation-popup-settings">
	<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete">
		<?= htmlspecialcharsbx((string)$responsible['Name']) ?>:
	</span>
	<?= $dialog->renderFieldControl($responsible) ?>
</div>
