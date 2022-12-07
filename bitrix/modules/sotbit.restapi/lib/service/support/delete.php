<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Support;

class Delete extends Base
{
    public function delete(int $supportId): void
    {
        $this->getOneFromDb($supportId);
        $this->supportRepository->deleteSupport($supportId);
    }
}
