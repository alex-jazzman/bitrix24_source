<?php

namespace Bitrix\Crm\Service\Operation\Action;

use Bitrix\Crm\Item;
use Bitrix\Crm\RepeatSale\Log\Controller\RepeatSaleLogController;
use Bitrix\Crm\Service\Operation\Action;
use Bitrix\Main\Result;

class UpdateRepeatSaleLog extends Action
{
	public function process(Item $item): Result
	{
		$result = new Result();
		$entityTypeId = $item->getEntityTypeId();

		// @todo temporary only deals
		if ($entityTypeId !== \CCrmOwnerType::Deal)
		{
			return $result;
		}

		$stageSemanticId = $item->getStageSemanticId();

		$repeatSaleController = RepeatSaleLogController::getInstance();
		$repeatSaleController->updateStageSemanticId($stageSemanticId, $item->getId(), $entityTypeId);

		return $result;
	}
}
