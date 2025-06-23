<?php

namespace Bitrix\HumanResources\Controller\Structure\Node\Member;

use Bitrix\HumanResources\Command\Structure\Node\SaveNodeChatsCommand;
use Bitrix\HumanResources\Engine\Controller;
use Bitrix\HumanResources\Integration\Im\ChatService;
use Bitrix\HumanResources\Item;
use Bitrix\HumanResources\Service\Container;
use Bitrix\HumanResources\Service\NodeMemberService;
use Bitrix\HumanResources\Exception\CommandException;
use Bitrix\HumanResources\Exception\CommandValidateException;
use Bitrix\Main\Error;
use Bitrix\Main\Request;

class Chat extends Controller
{
	private readonly ChatService $chatService;
	private readonly NodeMemberService $nodeMemberService;
	public function __construct(Request $request = null)
	{
		$this->chatService = Container::getChatService();
		$this->nodeMemberService = Container::getNodeMemberService();
		parent::__construct($request);
	}

	public function saveChatListAction(
		Item\Node $node,
		array $createDefault = [SaveNodeChatsCommand::CHAT_INDEX => false, SaveNodeChatsCommand::CHANNEL_INDEX => false],
		array $ids = [SaveNodeChatsCommand::CHAT_INDEX => [], SaveNodeChatsCommand::CHANNEL_INDEX => []],
	): void
	{
		try
		{
			$commandResult = (new SaveNodeChatsCommand(
				$node,
				$createDefault,
				$ids,
			))->run();

			if (!$commandResult->isSuccess())
			{
				$this->addErrors($commandResult->getErrors());
			}
		}
		catch (CommandException|CommandValidateException $e)
		{
			$this->addError(new Error($e->getMessage()));
		}
	}

	public function getListAction(Item\Node $node): array
	{
		$chatService = Container::getChatService();
		if (!$chatService->isAvailable())
		{
			return [];
		}

		return $this->chatService->getChatsAndChannelsByNodeId($node->id);
	}
}
