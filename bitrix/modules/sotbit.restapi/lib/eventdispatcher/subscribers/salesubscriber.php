<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Subscribers;

use Bitrix\Main;
use Sotbit\RestAPI\Localisation as l;
use Symfony\Contracts\EventDispatcher\Event;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Sotbit\RestAPI\EventDispatcher\Events\OrderEvent;
use Sotbit\RestAPI\Exception\EventException;

/**
 * Class OrderSubscriber
 *
 * @package Sotbit\RestAPI\EventDispatcher\Subscribers
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 09.10.2020
 */
class SaleSubscriber extends BaseSubscriber
{
}