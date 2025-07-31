<?php

use Bitrix\Intranet;
use Bitrix\Main\Web\Uri;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

class IntranetAvatarWidget extends \CBitrixComponent
{
	public function executeComponent()
	{
		$user = new Intranet\User();
		$this->arResult['skeleton'] = (new Intranet\User\Widget())->getSkeletonConfiguration();
		$this->arResult['avatar'] = Uri::urnEncode((new Intranet\User\Widget\Content\Main($user))->getUserPhotoSrc());
		$this->arResult['userRole'] = $user->getUserRole()->value;
		$this->arResult['userId'] = $user->getId();
		$this->arResult['signDocumentsCounter'] = $this->getSignDocumentsCounter();
		$this->arResult['signDocumentsPullEventName'] = Intranet\User\Widget\Content\SignDocuments::getCounterEventName();
		$this->includeComponentTemplate();
	}

	private function getSignDocumentsCounter(): int
	{
		if (!Intranet\User\Widget\Content\SignDocuments::isSignDocumentAvailable())
		{
			return 0;
		}

		return Intranet\User\Widget\Content\SignDocuments::getCount();
	}
}
