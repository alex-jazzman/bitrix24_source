<?php

namespace Bitrix\CrmMobile\Controller\Action;

use Bitrix\CrmMobile\Controller\Action;
use Bitrix\CrmMobile\Kanban\Entity;
use Bitrix\Main\Result;

class UpdateItemStageAction extends Action
{

	public function run(int $id, int $stageId, string $entityType, array $extra = [])
	{
		$this->checkModules();
		if ($this->hasErrors())
		{
			return $this->showErrors();
		}

		$result = $this->update($id, $stageId, $entityType, $extra);
		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());
		}
	}

	private function update(int $id, int $stageId, string $entityType, array $extra = []): Result
	{
		return (
			Entity::getInstance($entityType)
				->prepare($extra)
				->updateItemStage($id, $stageId)
		);
	}
}
