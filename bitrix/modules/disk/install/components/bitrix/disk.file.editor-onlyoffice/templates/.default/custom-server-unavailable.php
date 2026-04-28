<?php
declare(strict_types=1);

use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Extension::load([
	'ui.info-helper',
]);
?>

<script>
	BX.UI.InfoHelper.show('limit_v2_disk_edit_own_server');
</script>
