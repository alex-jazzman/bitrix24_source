<?php

use Bitrix\Crm\Decorator\JsonSerializable\ClearNullValues;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Router\Contract\Page;
use Bitrix\Crm\Service\Router\Dto\RouterAnchor;
use Bitrix\Crm\Tour\Base;
use Bitrix\Main\UI\Extension;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CMain $APPLICATION */
/** @var array $arResult */
/** @var Page $page */
/** @var RouterAnchor[] $anchors */

global $APPLICATION;

$page = $arResult['page'];
$isBindAnchors = !$arResult['isIframe'];

/** @see \Bitrix\Crm\Component\Base::addJsRouter() */
$this->getComponent()->addJsRouter($this);

if ($isBindAnchors)
{
	Container::getInstance()->getRouter()->renderBindAnchors();
}

if ($page->title() !== null)
{
	$APPLICATION->SetTitle(htmlspecialcharsbx($page->title()));
}

if ($page->canUseFavoriteStar() !== null)
{
	if ($page->canUseFavoriteStar())
	{
		Toolbar::addFavoriteStar();
	}
	else
	{
		Toolbar::deleteFavoriteStar();
	}
}

$page->render($this->getComponent());
