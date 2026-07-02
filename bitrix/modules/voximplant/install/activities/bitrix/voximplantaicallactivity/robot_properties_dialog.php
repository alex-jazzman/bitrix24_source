<?php

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var PropertiesDialog $dialog */
$map = $dialog->getMap();

?>
<div class="bizproc-automation-popup-settings">
	<span class="bizproc-automation-popup-settings-title bizproc-automation-popup-settings-title-autocomplete"><?= Loc::getMessage('BPVAICA_RPD_NUMBER') ?>: </span>
	<?= $dialog->renderFieldControl($map['Number'])?>
</div>
<div class="bizproc-automation-popup-settings">
	<?= $dialog->renderFieldControl($map['Prompt'])?>
</div>
