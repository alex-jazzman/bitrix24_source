<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\EventDispatcher\Events;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Symfony\Contracts\EventDispatcher\Event;

class BaseEvent extends Event
{
    public $values;

    public function __construct(&$values)
    {
        $this->values =& $values;
    }

    public function getValues()
    {
        return $this->values;
    }

    public function setValues($values)
    {
        $this->values = $values;
    }
}
