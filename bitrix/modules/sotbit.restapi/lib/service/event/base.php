<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Event;

use \Sotbit\RestAPI\Service\BaseService;
use Respect\Validation\Validator as v;
use Symfony\Component\EventDispatcher\EventDispatcher;

abstract class Base extends BaseService
{
    protected $eventDispatcher;

    public function __construct(
        EventDispatcher $eventDispatcher
    ) {
        $this->eventDispatcher = $eventDispatcher;
    }
}
