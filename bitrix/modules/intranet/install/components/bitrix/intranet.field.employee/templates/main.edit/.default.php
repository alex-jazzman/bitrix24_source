<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Text\HtmlFilter;

$component = $this->getComponent();
$selectorName = $arResult['selectorName'];

if($arResult['userField']['EDIT_IN_LIST'] === 'Y')
{
	?>

	<div
		id="cont_<?= $selectorName ?>"
		data-has-input="no"
	>
		<div
			id="value_<?= $selectorName ?>"
			style="display: none;"
		>
			<input
				type="hidden"
				name="<?= HtmlFilter::encode($arResult['fieldName']) ?>"
				value=""
			>
		</div>
	</div>

	<script>
		BX.ready(function ()
		{
			new BX.Intranet.UserField.EmployeeEditor({
				selectorName: '<?= $selectorName ?>',
				isMultiple: <?= $arResult['isMultiple'] ? 'true' : 'false' ?>,
				fieldNameJs: '<?= $arResult['fieldNameJs'] ?>',
				selectedItems: <?= \Bitrix\Main\Web\Json::encode($arResult['itemIds']) ?>,
			});
		});
	</script>

	<?php
}
elseif($arResult['value'])
{
	foreach($arResult['value'] as $item)
	{
		$style = null;
		if($item['personalPhoto'])
		{
			$style = 'style="background-image:url(\'' . htmlspecialcharsbx($item['personalPhoto']) . '\'); background-size: 30px;"';
		}
		?>
		<span class="fields employee field-item" data-has-input="no">
			<a
				class="uf-employee-wrap"
				href="<?= $item['href'] ?>"
				target="_blank"
			>
				<span
					class="uf-employee-image"
					<?= ($style ?? '') ?>
				>
				</span>
				<span class="uf-employee-data">
					<span class="uf-employee-name">
						<?= $item['name'] ?>
					</span>
					<span class="uf-employee-position">
						<?= $item['workPosition'] ?>
					</span>
				</span>
			</a>
		</span>
		<?php
	}
}
else
{
	?>
	<span class="fields employee field-wrap" data-has-input="no">
	<?php
	if(is_array($arResult['value']))
	{
		foreach($arResult['value'] as $item)
		{
			$style = null;
			if($item['personalPhoto'])
			{
				$style = 'style="background-image:url(' . $item['personalPhoto'] . '); background-size: 30px;"';
			}
			?>
			<span class="fields employee field-item">
				<a
					class="uf-employee-wrap"
					href="<?= $item['href'] ?>"
					target="_blank"
				>
					<span
						class="uf-employee-image"
						<?= ($style ?? '') ?>
					>
					</span>
					<span class="uf-employee-data">
						<span class="uf-employee-name">
							<?= $item['name'] ?>
						</span>
						<span class="uf-employee-position">
							<?= $item['workPosition'] ?>
						</span>
					</span>
				</a>
			</span>
			<?php
		}
	}
	else
	{
		print Loc::getMessage('EMPLOYEE_FIELD_EMPTY');
	}
	?>
	</span>
	<?php
}
