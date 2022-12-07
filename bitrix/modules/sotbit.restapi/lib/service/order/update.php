<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Order;

class Update extends Base
{
    public function cancel(string $orderId, string $reason = '', int $userId = null)
    {
        return $this->orderRepository->cancel($orderId, $reason, $userId);
    }
}
