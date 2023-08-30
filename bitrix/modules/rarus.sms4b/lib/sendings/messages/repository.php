<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Sendings\Messages;

use Bitrix\Main\Localization\Loc;
use Rarus\Sms4b\DateTimeConverter;
use Rarus\Sms4b\Tables\MessagesTable;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;

/**
 * Выборка guid для загрузки статусов
 */
class Repository
{
    use DateTimeConverter;

    /**
     * @param Collection $messages
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function save(Collection $messages): Collection
    {
        foreach ($messages as $message) {
            $this->saveOnce($message);
        }

        return $messages;
    }

    /**
     * @param Message $message
     *
     * @return Message
     * @throws Sms4bRepositoryException
     */
    public function saveOnce(Message $message): Message
    {
        try {
            $arMessage = $this->messageToArray($message);
            if ($message->getId() === null) {
                $result = MessagesTable::add($arMessage);
                $message->setId($result->getId());
            } else {
                MessagesTable::update($message->getId(), $arMessage);
            }

        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_MESSAGE_REP_ERROR'), $e->getCode(), $e);
        }
        return $message;
    }

    /**
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function getWithoutFinalStatus(): Collection
    {
        $filter = [
            '=' . MessagesTable::STATUS => Status::IN_PROCESS
        ];

        $nav = new PageNavigation('nav-auth');
        $nav->setPageSize(100);

        $order = [
            MessagesTable::LAST_MODIFIED => 'asc'
        ];

        return $this->getByFilter($filter, $nav, $order);

    }

    /**
     * @param int    $sendingId
     * @param string $guid
     *
     * @return Message
     * @throws Sms4bRepositoryException
     */
    public function getMessageBySendingIdAndGuid(int $sendingId, string $guid): Message
    {
        $filter = [
            '=' . MessagesTable::SENDING_ID => $sendingId,
            '=' . MessagesTable::GUID       => $guid
        ];

        return $this->getByFilter($filter)->current();

    }

    /**
     * @param array               $filter
     * @param PageNavigation|null $nav
     * @param array|null          $order
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    private function getByFilter(array $filter, ?PageNavigation $nav = null, array $order = []): Collection
    {

        $arParams = [
            'select' => [
                MessagesTable::ID,
                MessagesTable::SENDING_ID,
                MessagesTable::STATUS,
                MessagesTable::DESTINATION,
                MessagesTable::TEXT,
                MessagesTable::GUID,
                MessagesTable::ENCODING,
                MessagesTable::LAST_MODIFIED,
                MessagesTable::RESULT,
                MessagesTable::ENTITY_ID,
            ],
            'filter' => $filter,
            'order'  => $order
        ];
        if ($nav instanceof PageNavigation) {
            $arParams['count_total'] = true;
            $arParams['limit'] = $nav->getLimit();
            $arParams['offset'] = $nav->getOffset();
        }

        $messages = new Collection();
        try {
            $result = MessagesTable::getList($arParams);
            while ($arMessage = $result->fetch()) {
                $message = $this->createEntityFromArray($arMessage);
                $messages->attach($message);
            }
            $messages->rewind();

            if ($nav instanceof PageNavigation) {
                $nav->setRecordCount($result->getCount());
            }

        } catch (\Exception $e) {
            throw new Sms4bRepositoryException(Loc::getMessage('SMS4B_SENDING_SAVE_MESSAGE_ERROR'), $e->getCode(), $e);
        }
        return $messages;
    }

    /**
     * @param array $arMessage
     *
     * @return Message
     * @throws \Exception
     */
    private function createEntityFromArray(array $arMessage): Message
    {
        $message = new Message(
            $arMessage[MessagesTable::DESTINATION],
            $arMessage[MessagesTable::GUID],
            $arMessage[MessagesTable::TEXT],
            new Status((int)$arMessage[MessagesTable::STATUS]),
            (int)$arMessage[MessagesTable::ENCODING],
            (int)$arMessage[MessagesTable::ENTITY_ID],
            self::bitrixDateTimeToPhpDateTime($arMessage[MessagesTable::LAST_MODIFIED])
        );
        $message->setId((int)$arMessage[MessagesTable::ID]);
        $message->setSendingId((int)$arMessage[MessagesTable::SENDING_ID]);
        $message->setResult($arMessage[MessagesTable::RESULT]);

        return $message;
    }

    /**
     * @param Message $message
     *
     * @return array
     * @throws \Exception
     */
    private function messageToArray(Message $message): array
    {
        return [
            MessagesTable::ID            => $message->getId(),
            MessagesTable::SENDING_ID    => $message->getSendingId(),
            MessagesTable::STATUS        => $message->getStatus()->getStatus(),
            MessagesTable::DESTINATION   => $message->getDestination(),
            MessagesTable::TEXT          => $message->getText(),
            MessagesTable::GUID          => $message->getGuid(),
            MessagesTable::ENCODING      => $message->getEncoding(),
            MessagesTable::LAST_MODIFIED => self::phpDateTimeToBitrixDateTime($message->getLastModified()),
            MessagesTable::RESULT        => $message->getResult(),
            MessagesTable::ENTITY_ID     => $message->getEntityId()
        ];
    }
}