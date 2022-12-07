<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Service\Support;

use Sotbit\RestAPI\Exception\SupportException;
use Sotbit\RestAPI\Localisation as l;

class Find extends Base
{
    /**
     * Get all tickets by current user
     *
     * @param  array  $params  Filter
     *
     * @return array
     * @throws SupportException
     */
    public function getTickets(array $params): array
    {
        return $this->supportRepository->getTickets($params);
    }

    /**
     * Get ticket by ID
     *
     * @param  int  $ticketId
     * @param  int  $userId
     *
     * @return array
     * @throws SupportException
     */
    public function getTicket(int $ticketId, int $userId): array
    {
        if(!$ticketId) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        return $this->supportRepository->getTicket($ticketId, $userId);
    }


    /**
     * Get all messages in a ticket
     *
     * @param  int  $ticketId
     * @param  array  $params
     *
     * @return array
     * @throws SupportException
     */
    public function getMessagesTicket(int $ticketId, array $params): array
    {
        if(!$ticketId) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_TICKET_ID'), 400);
        }

        return $this->supportRepository->getMessagesTicket($ticketId, $params);
    }

    /**
     * Get message by ID
     *
     * @param  int  $messageId
     * @param  int  $userId
     *
     * @return array
     * @throws SupportException
     */
    public function getMessage(int $messageId, int $userId, string $routerFile): array
    {
        if(!$messageId) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_MESSAGE_ID'), 400);
        }

        return $this->supportRepository->getMessage($messageId, $userId, $routerFile);
    }

    /**
     * Get settings for create and update ticket
     *
     * @return array
     */
    public function getSettings(): array
    {
        return $this->supportRepository->getDictionary();
    }

    /**
     * Get file from ticket
     *
     * @return array
     */
    public function getFile(string $hash, int $userId)
    {
        if(!$hash || !preg_match('/^[a-z0-9]{32}$/i', $hash)) {
            throw new SupportException(l::get('ERROR_SUPPORT_EMPTY_MESSAGE_ID'), 400);
        }

        return $this->supportRepository->getFile($hash, $userId);
    }


    public function search(string $ticketName): array
    {
        /*return $this->supportRepository->searchSupports($ticketName);*/
    }
}
