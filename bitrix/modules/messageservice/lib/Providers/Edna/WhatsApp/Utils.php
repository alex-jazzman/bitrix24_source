<?php

namespace Bitrix\MessageService\Providers\Edna\WhatsApp;

use Bitrix\ImConnector\Library;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Result;
use Bitrix\Main\Web\HttpClient;
use Bitrix\MessageService\Internal\Entity\MessageTable;
use Bitrix\MessageService\Providers\Edna\WhatsApp;
use Bitrix\MessageService\Providers\OptionManager;

class Utils implements WhatsApp\EdnaRu
{
	protected string $providerId;
	protected OptionManager $optionManager;

	public function __construct(string $providerId, OptionManager $optionManager)
	{
		$this->providerId = $providerId;
		$this->optionManager = $optionManager;
	}

	public function getLineId(): ?int
	{
		if (!Loader::includeModule('imconnector'))
		{
			return null;
		}

		$statuses = \Bitrix\ImConnector\Status::getInstanceAllLine(Library::ID_EDNA_WHATSAPP_CONNECTOR);
		foreach ($statuses as $status)
		{
			if ($status->isConfigured())
			{
				return (int)$status->getLine();
			}
		}

		return null;
	}

	public function testConnection(): Result
	{
		$requestParams = ['types' => 'WHATSAPP'];

		$externalSender =
			new ExternalSender(
				$this->optionManager->getOption(WhatsApp\Constants::API_KEY_OPTION),
				Constants::API_ENDPOINT
			)
		;

		return $externalSender->callExternalMethod('channel-profile', $requestParams, HttpClient::HTTP_GET);
	}

	public function getMessageTemplates(string $subject = ''): Result
	{
		if (defined('WA_EDNA_RU_TEMPLATES_STUB') && WA_EDNA_RU_TEMPLATES_STUB === true)
		{
			return $this->getMessageTemplatesStub();
		}

		$subjectResult = $this->getChannelIdBySubject($subject);
		if (!$subjectResult->isSuccess())
		{
			return $subjectResult;
		}

		$subjectId = $subjectResult->getData()['id'];
		$requestParams = [
			'subjectId' => $subjectId
		];

		$externalSender =
			new ExternalSender(
				$this->optionManager->getOption(WhatsApp\Constants::API_KEY_OPTION),
				Constants::API_ENDPOINT
			)
		;

		$templatesRequestResult =
			$externalSender->callExternalMethod(Constants::GET_TEMPLATES, $requestParams)
		;

		return $this->removeUnsupportedTemplates($templatesRequestResult);
	}

	public function prepareTemplateMessageText(array $message): string
	{
		$latestMessage = '';
		if (isset($message['MESSAGE_HEADERS']['template']['header']['text']))
		{
			$latestMessage .= $message['MESSAGE_HEADERS']['template']['header']['text'] . '#BR#';
		}

		if (isset($message['MESSAGE_HEADERS']['template']['text']))
		{
			$latestMessage .= $message['MESSAGE_HEADERS']['template']['text'] . '#BR#';
		}

		if (isset($message['MESSAGE_HEADERS']['template']['footer']['text']))
		{
			$latestMessage .= $message['MESSAGE_HEADERS']['template']['footer']['text'];
		}

		return $latestMessage;
	}

	public function getSentTemplateMessage(string $from, string $to): string
	{
		$message = MessageTable::getList([
			'select' => ['ID', 'MESSAGE_HEADERS'],
			'filter' => [
				'=SENDER_ID' => $this->providerId,
				'=MESSAGE_FROM' => $from,
				'=MESSAGE_TO' => '+' . $to,
			],
			'limit' => 1,
			'order' => ['ID' => 'DESC'],
		])->fetch();

		if (!$message)
		{
			return '';
		}

		return $this->prepareTemplateMessageText($message);
	}

	protected function getMessageTemplatesStub(): Result
	{
		$result = new Result();
		$result->setData([
			'result' => [
				[
					'id' => 242,
					'name' => 'QA_message_matcher_WA_1_opr_name_1',
					'channelType' => 'whatsapp',
					'language' => 'RU',
					'content' => [
						'attachment' => null,
						'action' => null,
						'caption' => null,
						'header' => null,
						'text' => 'QA_message_matcher_WA_1_body_text',
						'footer' => [
							'text' => 'footer text'
						],
						'keyboard' => [
							'rows' => [
								[
									'buttons' => [],
								],
							],
						],
					],
					'category' => 'ACCOUNT_UPDATE',
					'status' => 'APPROVED',
					'locked' => true,
					'type' => 'USER',
					'createdAt' => '2021-07-15T14:16:54.417024Z',
					'updatedAt' => '2021-07-16T13:08:26.275414Z',
				],
				[
					'id' => 267,
					'channelType' => 'whatsapp',
					'language' => 'RU',
					'content' => [
						'attachment' => null,
						'action' => null,
						'caption' => null,
						'header' => null,
						'text' => 'QA_message_matcher_WA_1_body_text',
						'footer' => null,
						'keyboard' => [
							'rows' => [
								[
									'buttons' => [
										[
											'text' => 'red',
											'payload' => '1'
										],
										[
											'text' => 'blue',
											'payload' => '2'
										],
										[
											'text' => 'green',
											'payload' => '3'
										]
									],
								],
							],
						],
					],
					'category' => 'ACCOUNT_UPDATE',
					'status' => 'APPROVED',
					'locked' => false,
					'type' => 'USER',
					'createdAt' => '2021-07-20T09:21:42.444454Z',
					'updatedAt' => '2021-07-20T09:21:42.444454Z',
				],
			],
			'code' => 'ok',
		]);

		return $result;
	}

	private function getChannelIdBySubject(string $subject): Result
	{
		$subjectResult = $this->getChannelList();

		if (!$subjectResult->isSuccess())
		{
			return $subjectResult;
		}

		$channelList = $subjectResult->getData();
		foreach ($channelList as $channel)
		{
			if ($channel['subject'] === $subject)
			{
				$result = new Result();
				$result->setData(['id' => $channel['id']]);

				return $result;
			}
		}

		$result = new Result();
		$result->addError(new Error("There is no channel with this subject = $subject"));

		return $result;
	}

	private function getChannelList(): Result
	{
		$requestParams = [
			'imType' => 'WHATSAPP'
		];

		$externalSender =
			new ExternalSender(
				$this->optionManager->getOption(WhatsApp\Constants::API_KEY_OPTION),
				Constants::API_ENDPOINT
			)
		;
		$requestResult =
			$externalSender->callExternalMethod(Constants::GET_SUBJECTS, $requestParams, 'GET')
		;

		if (!$requestResult->isSuccess())
		{
			return (new Result())->addErrors($requestResult->getErrors());
		}

		$result = new Result();
		$result->setData($requestResult->getData());

		return $result;
	}

	protected function checkForPlaceholders($template): bool
	{
		return
			$this->hasPlaceholder($template['content']['header']['text'] ?? '')
			|| $this->hasPlaceholder($template['content']['text'] ?? '')
			|| $this->hasPlaceholder($template['content']['footer']['text'] ?? '')
			;
	}

	protected function hasPlaceholder(string $text): bool
	{
		$placeholder = '{{1}}';

		return strpos($text, $placeholder) !== false;
	}

	protected function removeUnsupportedTemplates(Result $templates): Result
	{
		if (!$templates->isSuccess())
		{
			return $templates;
		}

		$templatesData = $templates->getData();
		if (!$templatesData['result'])
		{
			return $templates;
		}

		$filteredTemplates = [];
		foreach ($templatesData['result'] as $template)
		{
			if ($this->checkForPlaceholders($template))
			{
				continue;
			}

			$filteredTemplates[] = $template;
		}

		$templatesData['result'] = $filteredTemplates;
		$result = new Result();
		$result->setData($templatesData);

		return $result;
	}
}