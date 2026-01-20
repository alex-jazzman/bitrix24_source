<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$APPLICATION->IncludeComponent(
	'bitrix:crm.whats_new',
	'',
	$arParams,
);

?>

<script>
	BX.ready(() => {
		const gridSelector = '<?= \Bitrix\Crm\Tour\Grid\GridImprovements::GRID_SELECTOR ?>';
		const userCellSelector = '<?= \Bitrix\Crm\Tour\Grid\GridImprovements::USER_CELL_SELECTOR ?>';

		const grid = document.querySelector(gridSelector);
		const userCell = document.querySelector(userCellSelector);
		if (BX.Type.isNull(grid) || BX.Type.isNull(userCell))
		{
			return;
		}

		const cellRect = userCell.getBoundingClientRect();
		const gridRect = grid.getBoundingClientRect();
		if (
			cellRect.top < gridRect.top
			|| cellRect.left < gridRect.left
			|| cellRect.bottom > gridRect.bottom
			|| cellRect.right > gridRect.right
		)
		{
			userCell.scrollIntoView({
				behavior: 'smooth',
				block: 'end',
			});
		}

		const eventName = '<?= \Bitrix\Crm\Tour\Grid\GridImprovements::EVENT_NAME ?>';
		const stepId = '<?= \Bitrix\Crm\Tour\Grid\GridImprovements::MAIN_STEP_ID ?>';

		BX.Event.EventEmitter.emit(
			eventName,
			{
				stepId,
				target: userCell,
			},
		);
	});
</script>
