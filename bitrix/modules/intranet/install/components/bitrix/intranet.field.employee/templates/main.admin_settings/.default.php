<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Extension::load('intranet.userfield.employee.employee-selector');

/**
 * @var array $arResult
 * @var array $additionalParameters
 */
$additionalParameters = $arResult['additionalParameters'];

$defaultValueName = "{$additionalParameters['NAME']}[DEFAULT_VALUE]";

$preselectedUserIds = $arResult['values']['defaultValue'];
$preselectedUserIds = Json::encode($preselectedUserIds);
?>

<tr>
	<td><?= Loc::getMessage('EMPLOYEE_FIELD_DEFAULT_VALUE_TITLE') ?></td>
	<td>
		<div class="intranet-default-user-selector"></div>
		<script>
			BX.ready(() => {
				void BX
					.Runtime
					.loadExtension('intranet.userfield.employee.employee-selector')
					.then(({ EmployeeSelector }) => {
						const multipleInput = document.querySelector("input[name='MULTIPLE']");

						let selector = null;
						const createUserSelector = () => {
							selector = new EmployeeSelector({
								fieldName: '<?= CUtil::JSEscape($defaultValueName) ?>',
								container: document.querySelector('.intranet-default-user-selector'),
								isMultiple: multipleInput.checked,
								preselectedUserIds: <?= $preselectedUserIds ?>,
								useIteratorInMultipleFieldHiddenInput: true,
							});
						};

						multipleInput.onchange = () => {
							selector.destroy();
							createUserSelector();
						};

						createUserSelector();
					})
			});
		</script>
	</td>
</tr>
