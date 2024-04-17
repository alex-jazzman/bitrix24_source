<?php

namespace Bitrix\Im\V2\Call;

use Bitrix\Main\Result;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Service\MicroService\BaseSender;

class ControllerClient extends BaseSender
{
	protected ?string $endpoint = null;

	protected ?string $customEndpoint = null;

	public function __construct(string $endpoint = null)
	{
		parent::__construct();

		if ($endpoint)
		{
			$this->customEndpoint = $endpoint;
		}
	}

	/**
	 * @return string
	 */
	protected function getEndpoint(): string
	{
		if (is_null($this->endpoint))
		{
			$endpoint = Option::get('im', 'call_server_url');

			if (!empty($endpoint))
			{
				if (!(mb_strpos($endpoint, 'https://') === 0 || mb_strpos($endpoint, 'http://') === 0))
				{
					$endpoint = 'https://' . $endpoint;
				}
				$this->endpoint = $endpoint;
			}
		}

		return $this->endpoint;
	}

	/**
	 * Returns API endpoint for the service.
	 *
	 * @return string
	 */
	protected function getServiceUrl(): string
	{
		return $this->getEndpoint();
	}

	/**
	 * @see \Bitrix\CallController\Controller\InternalApi::createCallAction
	 * @param string $callUuid
	 * @param string $secretKey
	 * @param int $initiatorId
	 * @param int $callId
	 * @return Result
	 */
	public function createCall(string $callUuid, string $secretKey, int $initiatorId, int $callId): Result
	{
		return $this->performRequest(
			'callcontroller.Controller.InternalApi.createCall',
			[
				'uuid' => $callUuid,
				'secretKey' => $secretKey,
				'initiatorUserId' => $initiatorId,
				'callId' => $callId,
			]
		);
	}
}