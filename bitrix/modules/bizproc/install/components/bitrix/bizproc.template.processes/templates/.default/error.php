<?php

use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load('ui.alerts');
?>

<?php foreach($this->getComponent()->getErrors() as $error):?>
	<div class="ui-alert ui-alert-danger">
		<span class="ui-alert-message"><?= htmlspecialcharsbx($error->getMessage()) ?></span>
	</div>
<?php endforeach;?>
