<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Support;

use Sotbit\RestAPI\Exception\Support as SupportException;
use Sotbit\RestAPI\Localisation as l;

class Create extends Base
{
    public function createTicket(array $input, int $userId): int
    {
        // Bitrix returns errors
        return $this->supportRepository->createTicket($input, $userId);
    }

    public function createMessage(int $ticketId, array $data, int $userId): int
    {
        if(!$ticketId) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        return $this->supportRepository->createMessage($ticketId, $data, $userId);
    }
}
