<?php
declare(strict_types=1);

namespace Rarus\Sms4b\Incoming;

use Rarus\Sms4b\DateTimeConverter;
use Bitrix\Main\UI\PageNavigation;
use Rarus\Sms4b\Tables\IncomingTable;
use Rarus\Sms4b\Exceptions\Sms4bRepositoryException;

class Repository
{
    use DateTimeConverter;
    /**
     * @param Incoming $incoming
     *
     * @throws Sms4bRepositoryException
     */
    public function save(Incoming $incoming): void
    {
        try {
            $arIncoming = $this->prepareEntityForDb($incoming);
            $result = IncomingTable::add($arIncoming);
            $incoming->setId($result->getId());
        } catch (\Exception $e) {
            throw new Sms4bRepositoryException($e->getMessage(), $e->getCode(), $e);
        }
    }

    /**
     * @param Incoming $incoming
     *
     * @return array
     */
    private function prepareEntityForDb(Incoming $incoming): array
    {
        return [
            IncomingTable::GUID        => $incoming->getGuid(),
            IncomingTable::DESTINATION => $incoming->getDestination(),
            IncomingTable::TEXT        => $incoming->getBody(),
            IncomingTable::ENCODING    => $incoming->getEncoding(),
            IncomingTable::TOTAL       => $incoming->getAllPartsCount(),
            IncomingTable::PART        => $incoming->getPartNumber(),
            IncomingTable::MOMENT      => self::phpDateTimeToBitrixDateTime($incoming->getMoment()),
            IncomingTable::TIME        => self::phpDateTimeToBitrixDateTime($incoming->getTime()),
            IncomingTable::SOURCE      => $incoming->getSource()
        ];
    }

    /**
     * @param array               $filter
     * @param PageNavigation|null $nav
     * @param array               $order
     *
     * @return Collection
     * @throws Sms4bRepositoryException
     */
    public function getByFilter(array $filter, ?PageNavigation $nav = null, array $order = []): Collection
    {
        $arParams = [
            'select' => [
                IncomingTable::ID,
                IncomingTable::GUID,
                IncomingTable::DESTINATION,
                IncomingTable::TEXT,
                IncomingTable::ENCODING,
                IncomingTable::TOTAL,
                IncomingTable::PART,
                IncomingTable::MOMENT,
                IncomingTable::TIME,
                IncomingTable::SOURCE
            ],
            'filter' => $filter,
            'order'  => $order
        ];

        if ($nav instanceof PageNavigation) {
            $arParams['count_total'] = true;
            $arParams['limit'] = $nav->getLimit();
            $arParams['offset'] = $nav->getOffset();
        }

        $incoming = new Collection();
        try {
            $result = IncomingTable::getList($arParams);
            while ($arIncoming = $result->fetch()) {
                $incoming->attach($this->createEntityFromArray($arIncoming));
            }

            $incoming->rewind();

            if ($nav instanceof PageNavigation) {
                $nav->setRecordCount($result->getCount());
            }

        } catch (\Exception $e) {
            throw new Sms4bRepositoryException($e->getMessage(), $e->getCode(), $e);
        }
        return $incoming;
    }

    /**
     * @param array $arIncoming
     *
     * @return Incoming
     * @throws \Exception
     */
    private function createEntityFromArray(array $arIncoming): Incoming
    {
        return new Incoming(
            (int)$arIncoming[IncomingTable::ID],
            $arIncoming[IncomingTable::GUID],
            $arIncoming[IncomingTable::DESTINATION],
            $arIncoming[IncomingTable::TEXT],
            (int)$arIncoming[IncomingTable::ENCODING],
            (int)$arIncoming[IncomingTable::TOTAL],
            (int)$arIncoming[IncomingTable::PART],
            self::bitrixDateTimeToPhpDateTime($arIncoming[IncomingTable::MOMENT]),
            self::bitrixDateTimeToPhpDateTime($arIncoming[IncomingTable::TIME]),
            $arIncoming[IncomingTable::SOURCE]
        );
    }

}