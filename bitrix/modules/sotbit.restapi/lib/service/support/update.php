<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Support;

class Update extends Base
{
    public function close(string $id, int $userId)
    {
        return $this->supportRepository->closeTicket($id, $userId);
    }

    public function open(string $id, int $userId)
    {
        return $this->supportRepository->openTicket($id, $userId);
    }
}
