<?php

namespace Bitrix\ImConnector\Connectors;

use Bitrix\ImConnector\Output;
use Bitrix\ImConnector\Result;
use Bitrix\ImConnector\Status;
use Bitrix\ImConnector\Connector;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Loader;
use Bitrix\ImOpenLines;

/**
 * Class TelegramBot
 * @package Bitrix\ImConnector\Connectors
 */
class TelegramBot extends Base implements MessengerUrl
{
	private const TELEGRAM_BOT = 'telegrambot';

	public function __construct()
	{
		parent::__construct(self::TELEGRAM_BOT);
	}

	/**
	 * @param array $message
	 * @param int $line
	 * @return Result
	 */
	public function processingInputWelcomeMessage(array $message, int $line): Result
	{
		$result = new Result();

		$telegramUserId = $message['user']['id'];

		$userId = 0;
		$user = $this->getUserByUserCode(['id' => $telegramUserId]);
		if (!$user->isSuccess())
		{
			$addResult = $this->addUser($message['user']);
			if ($addResult->isSuccess())
			{
				$userId = $addResult->getResult();
			}
			else
			{
				$result->addErrors($addResult->getErrors());
			}
		}
		else
		{
			$userId = (int)$user->getResult()['ID'];
		}
		if (!$userId)
		{
			return $result;
		}

		$fullUserCode = "telegrambot|{$line}|{$telegramUserId}|{$userId}";
		$chat = $this->getChat([
			'USER_CODE' => $fullUserCode,
			'USER_ID' => $userId,
			'CONNECTOR' => $message,
		]);
		$chatId = $chat->getData('ID');
		if (!$chatId)
		{
			return $result;
		}

		// CRM expectation
		if (
			!empty($message['ref']['source']) // start parameter
			&& Loader::includeModule('imopenlines')
		)
		{
			$session = new ImOpenLines\Session();
			$session->setChat($chat);

			$hasSession = $session->load([
				'USER_CODE' => $fullUserCode,
				'CONFIG_ID' => $line,
				'USER_ID' => $userId,
				'SOURCE' => self::TELEGRAM_BOT,
				'MODE' => ImOpenLines\Session::MODE_INPUT,
				'SKIP_CRM' => 'Y',// do not create crm objects
			]);
			if ($hasSession)
			{
				/** @var ImOpenLines\Tracker $tracker */
				$tracker = ServiceLocator::getInstance()->get('ImOpenLines.Services.Tracker');
				$tracker->bindExpectationToChat($message['ref']['source'], $chat, $session);
			}
		}

		$connectorOutput = new Output(self::TELEGRAM_BOT, $line);
		$statusData = Status::getInstance(self::TELEGRAM_BOT, $line)->getData();

		$messageToSend = [
			'chatId' => $message['chat']['id'],
			'userId' => $userId,
			'lineId' => $line,
		];
		if (!$statusData['welcome_message'])
		{
			if ($statusData['eshop_url'])
			{
				return $connectorOutput->registerEshop($messageToSend);
			}

			return $result;
		}

		$this->sendWelcomeMessage($statusData['welcome_message'], $chatId);
		$connectorOutput->registerEshop($messageToSend);

		return $result;
	}

	/**
	 * @param array $params
	 * @return ImOpenLines\Chat|null
	 */
	private function getChat(array $params): ?ImOpenLines\Chat
	{
		if (!Loader::includeModule('imopenlines'))
		{
			return null;
		}

		$chat = new ImOpenLines\Chat();
		$chat->load($params);

		return $chat;
	}

	public function sendWelcomeMessage(string $messageText, int $chatId)
	{
		if (empty($messageText))
		{
			return null;
		}

		return $this->sendMessage($messageText, $chatId);
	}

	public function sendAutomaticMessage(string $messageText, string $crmEntityType, int $crmEntityId): ?int
	{
		if (!Loader::includeModule('imopenlines'))
		{
			return null;
		}
		$entityData = ImOpenLines\Crm\Common::get($crmEntityType, $crmEntityId, true);

		$lastTelegramImol = null;
		if (isset($entityData['FM']['IM']['TELEGRAM']) && is_array($entityData['FM']['IM']['TELEGRAM']))
		{
			$lastTelegramImol = end($entityData['FM']['IM']['TELEGRAM']);
		}

		if (!$lastTelegramImol)
		{
			return null;
		}

		$telegramUserCode = mb_substr($lastTelegramImol, 5); //cut "imol|"
		$chat = $this->getChat(['USER_CODE' => $telegramUserCode]);
		$chatId = $chat->getData('ID');
		if (!$chatId)
		{
			return null;
		}

		return $this->sendMessage($messageText, $chatId);
	}

	private function sendMessage(string $messageText, int $chatId)
	{
		if (empty($messageText) || $chatId <= 0)
		{
			return null;
		}

		/** @var ImOpenLines\Services\Message $messenger */
		$messenger = ServiceLocator::getInstance()->get('ImOpenLines.Services.Message');

		return $messenger->addMessage([
			'TO_CHAT_ID' => $chatId,
			'MESSAGE' => $messageText,
			'SYSTEM' => 'Y',
			'IMPORTANT_CONNECTOR' => 'Y',
			'NO_SESSION_OL' => 'Y',
		]);
	}

	/**
	 * Generate url to redirect into messenger app.
	 * @see https://core.telegram.org/api/links#bot-links
	 *
	 * @param int $lineId
	 * @param array|string|null $additional
	 * @return array{web: string, mob: string}
	 */
	public function getMessengerUrl(int $lineId, $additional = null): array
	{
		$result = [];
		$url = null;
		$connectorData = Connector::infoConnectorsLine($lineId);
		if (isset($connectorData[self::TELEGRAM_BOT]))
		{
			$url = $connectorData[self::TELEGRAM_BOT]['url_im'] ?? $connectorData[self::TELEGRAM_BOT]['url'] ?? '';
		}
		else
		{
			$connectorOutput = new Output(self::TELEGRAM_BOT, $lineId);
			$infoConnect = $connectorOutput->infoConnect();

			if ($infoConnect->isSuccess())
			{
				$url = $infoConnect->getData()['url'];
			}
		}

		if ($url)
		{
			$result = [
				'web' => $url,
				'mob' => str_replace('https://t.me/', 'tg://resolve?domain=', $url),
			];

			if (!empty($additional))
			{
				if (is_array($additional))
				{
					$additional = base64_encode(http_build_query($additional));
				}
				$result['web'] .= '?start='. $additional;
				$result['mob'] .= '&start='. $additional;
			}
		}

		return $result;
	}
}