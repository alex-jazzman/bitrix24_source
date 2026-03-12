<?php
define('STOP_STATISTICS', true);
define('BX_SECURITY_SHOW_MESSAGE', true);

require_once($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');

use Bitrix\Main\HttpRequest;
use Bitrix\Sender\Entity;
use Bitrix\Sender\Internals\QueryController as Controller;
use Bitrix\Sender\Security;

if (!Bitrix\Main\Loader::includeModule('sender'))
{
	return;
}

$actions = array();
$actions[] = Controller\Action::create('addToBlacklist')->setHandler(
	function (HttpRequest $request, Controller\Response $response)
	{
		if (!Security\Access::getInstance()->canModifyBlacklist())
		{
			Security\AccessChecker::addError(
				$response->initContentJson()->getErrorCollection(),
				Security\AccessChecker::ERR_CODE_EDIT,
			);

			return;
		}

		$entity = new Entity\Contact($request->get('id'));
		$entity->addToBlacklist();
		$response->initContentJson()->getErrorCollection()->add($entity->getErrors());
	}
);
$actions[] = Controller\Action::create('removeFromBlacklist')->setHandler(
	function (HttpRequest $request, Controller\Response $response)
	{
		if (!Security\Access::getInstance()->canModifyBlacklist())
		{
			Security\AccessChecker::addError(
				$response->initContentJson()->getErrorCollection(),
				Security\AccessChecker::ERR_CODE_EDIT,
			);

			return;
		}

		$entity = new Entity\Contact($request->get('id'));
		$entity->removeFromBlacklist();
		$response->initContentJson()->getErrorCollection()->add($entity->getErrors());
	}
);
$actions[] = Controller\Action::create('remove')->setHandler(
	function (HttpRequest $request, Controller\Response $response)
	{
		if (!Security\Access::getInstance()->canModifyClientList())
		{
			Security\AccessChecker::addError(
				$response->initContentJson()->getErrorCollection(),
				Security\AccessChecker::ERR_CODE_EDIT,
			);

			return;
		}

		$entity = new Entity\Contact($request->get('id'));
		$entity->remove();
		$response->initContentJson()->getErrorCollection()->add($entity->getErrors());
	}
);
$actions[] = Controller\Action::create('removeFromList')->setHandler(
	function (HttpRequest $request, Controller\Response $response)
	{
		if (!Security\Access::getInstance()->canModifyClientList())
		{
			Security\AccessChecker::addError(
				$response->initContentJson()->getErrorCollection(),
				Security\AccessChecker::ERR_CODE_EDIT,
			);

			return;
		}

		$entity = new Entity\Contact($request->get('id'));
		$entity->removeFromList($request->get('listId'));
		$response->initContentJson()->getErrorCollection()->add($entity->getErrors());
	}
);

Controller\Listener::create()->setActions($actions)->run();
