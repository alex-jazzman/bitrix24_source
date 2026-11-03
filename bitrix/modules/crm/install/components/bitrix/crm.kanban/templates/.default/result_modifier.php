<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

// prepare and some for compatibility

$arResult['ITEMS']['dropzones'] = [];

foreach ($arResult['ITEMS']['columns'] as $k => &$column)
{
	if ($column['dropzone'] || $column['alwaysShowInDropzone'])
	{
		 $element = [
			'id' => $column['id'],
			'name' => $column['name'],
			'color' => $column['color'],
			'data' => [
				'type' => $column['type'],
				'blockedIncomingMoving' => ($column['blockedIncomingMoving'] ?? false),
			],
		];

		if ($element['id'] === 'DELETED')
		{
			array_unshift($arResult['ITEMS']['dropzones'], $element);
		}
		else
		{
			$arResult['ITEMS']['dropzones'][] = $element;
		}

		if ($column['dropzone'])
		{
			unset($arResult['ITEMS']['columns'][$k]);
		}
	}

	if (!$column['dropzone'])
	{
		$canSort = (
			$arResult['CONFIG_BY_VIEW_MODE']['accessConfigPerms']
			&& $column['type'] === 'PROGRESS'
		);
		$column = CrmKanbanComponent::prepareColumnForClient($column, $canSort);
	}
}
unset($column);

foreach ($arResult['ITEMS']['items'] as &$item)
{
	$isCountable = ($item['countable'] ?? true);
	$isDroppable = ($item['droppable'] ?? true);
	$isDraggable = ($item['draggable'] ?? true);

	$item = [
		'id' => $item['id'],
		'columnId' => $item['columnId'],
		'data' => $item,
	];

	if (!$isCountable)
	{
		$item['countable'] = false;
	}
	if (!$isDroppable)
	{
		$item['droppable'] = false;
	}
	if (!$isDraggable)
	{
		$item['draggable'] = false;
	}
}
unset($item);
