<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Order;

class Find extends Base
{
    public function getById(int $orderId, int $userId = null): array
    {
        return $this->orderRepository->getById($orderId, $userId);
    }

    public function getByAccountNumber($accountNumber, int $userId = null): array
    {
        return $this->orderRepository->getByAccountNumber($accountNumber, $userId);
    }

    public function getList(array $params): array
    {
        return $this->orderRepository->getList($params);
    }

    public function getStatus(int $orderId, int $userId = null): string
    {
        return $this->orderRepository->getStatus($orderId, $userId);
    }


    public function getPaySystems(): array
    {
        return $this->orderRepository->getPaySystems();
    }

    public function getDeliveries(): array
    {
        return $this->orderRepository->getDeliveries();
    }

    public function getStatuses(): array
    {
        return $this->orderRepository->getStatuses();
    }

    public function getPersonTypes(): array
    {
        return $this->orderRepository->getPersonTypes();
    }

}
