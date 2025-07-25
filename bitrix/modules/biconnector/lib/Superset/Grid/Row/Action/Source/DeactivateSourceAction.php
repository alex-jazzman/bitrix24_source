<?php

namespace Bitrix\BIConnector\Superset\Grid\Row\Action\Source;

use Bitrix\Main\Grid\Row\Action\BaseAction;
use Bitrix\Main\HttpRequest;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;
use CUtil;

final class DeactivateSourceAction extends BaseAction
{

	public static function getId(): ?string
	{
		return 'deactivate';
	}

	public function processRequest(HttpRequest $request): ?Result
	{
		return null;
	}

	protected function getText(): string
	{
		return Loc::getMessage('BICONNECTOR_SOURCE_GRID_ACTION_DEACTIVATE') ?? '';
	}

	public function getControl(array $rawFields): ?array
	{
		$id = (int)$rawFields['ID'];
		$moduleId = CUtil::JSEscape($rawFields['MODULE']);

		if ($rawFields['ACTIVE'] === 'Y')
		{
			$this->onclick = "BX.BIConnector.ExternalSourceManager.Instance.changeActivitySource({$id}, '{$moduleId}')";

			return parent::getControl($rawFields);
		}

		return null;
	}
}
