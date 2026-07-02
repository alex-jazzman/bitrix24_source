<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

?>
<div class="crm-activity-details-wrapper-error">
	<div class="ui-alert ui-alert-danger">
		<span class="ui-alert-message"><?= Loc::getMessage('CRM_ACTIVITY_DETAILS_WRAPPER_ACCESS_DENIED') ?></span>
	</div>
</div>
