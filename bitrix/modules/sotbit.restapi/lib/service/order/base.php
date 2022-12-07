<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Order;

use Sotbit\RestAPI\Exception\Order;
use Sotbit\RestAPI\Repository\OrderRepository;
use Sotbit\RestAPI\Service\BaseService;

abstract class Base extends BaseService
{
    protected $orderRepository;

    public function __construct(
        OrderRepository $orderRepository
    ) {
        $this->orderRepository = $orderRepository;
    }
}
