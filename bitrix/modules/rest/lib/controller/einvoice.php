<?php

namespace Bitrix\Rest\Controller;

use Bitrix\Bitrix24\CurrentUser;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Error;
use Bitrix\Main\Web\HttpClient;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Rest\AppTable;

class EInvoice extends Controller
{
	public function saveAction(array $settings, string $handler): AjaxJson
	{
		$formData = $settings;

		$uri = new Uri($handler);
		$httpClient = new HttpClient();
		$result = $httpClient->post($uri, $formData);
		try
		{
			$responseData = Json::decode($result);
			if ($httpClient->getStatus() !== 200)
			{
				$errors = $responseData['errors'] ?? [];
				foreach ($errors as $error)
				{
					$this->errorCollection->setError(
						new Error($error['message'] ?? '', customData: ['fieldName' => $error['field'] ?? 'unknown'])
					);
				}
			}
		}
		catch (ArgumentException $e)
		{
			$this->errorCollection->setError(new Error($e->getMessage()));
		}

		if ($this->errorCollection->count() > 0)
		{
			return AjaxJson::createError($this->errorCollection);
		}

		return AjaxJson::createSuccess();
	}

	public function configureActions(): array
	{
		$configureActions = [];
		$configureActions['save'] = [
			'+prefilters' => [
				new ActionFilter\Authentication(),
				new ActionFilter\Scope(ActionFilter\Scope::NOT_REST),
			],
		];

		return $configureActions;
	}
}