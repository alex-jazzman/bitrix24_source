<?php
declare(strict_types=1);

namespace Rarus\Sms4b\RemoteService\Methods\LoadSMS;

use Rarus\Sms4b\RemoteService;

class MethodExecutor extends RemoteService\MethodExecutor\MethodExecutor
{
    /**
     * array keys
     */
    const CHANGES_FROM = 'ChangesFrom';

    /**
     * @var string
     */
    private $dateFormat = 'Ymd H:i:s.v';

    /**
     * {@inheritdoc}
     */
    protected function getMethodName(): string
    {
        return 'LoadSMS';
    }

    /**
     * {@inheritdoc}
     * @throws \Exception
     */
    protected function prepareResponse($rawResponse)
    {
        $response = $rawResponse->{$this->getMethodName() . 'Result'};
        $result = $response->Result;

        $loadSmsCollection = new RemoteService\Dto\LoadSms\Collection();
        if(!empty($response->List)) {
            if (!is_array($response->List->SMSList)) {
                $loadSms = new RemoteService\Dto\LoadSms\LoadSms(
                    $response->List->SMSList->G,
                    $response->List->SMSList->D,
                    $response->List->SMSList->B,
                    $response->List->SMSList->E,
                    $response->List->SMSList->A,
                    $response->List->SMSList->P,
                    new \DateTime($response->List->SMSList->M),
                    new \DateTime($response->List->SMSList->T),
                    $response->List->SMSList->S
                );
                $loadSmsCollection->attach($loadSms);
            } else {
                foreach ($response->List->SMSList as $item) {
                    $loadSms = new RemoteService\Dto\LoadSms\LoadSms(
                        $item->G,
                        $item->D,
                        $item->B,
                        $item->E,
                        $item->A,
                        $item->P,
                        new \DateTime($item->M),
                        new \DateTime($item->T),
                        $item->S
                    );
                    $loadSmsCollection->attach($loadSms);
                }
            }
        }

        return new Response($result, $loadSmsCollection);
    }

    /**
     * @inheritDoc
     */
    protected function prepareRequestArguments(array $requestArguments): array
    {
        $requestArguments[self::CHANGES_FROM] = $this->prepareDateTime($requestArguments[self::CHANGES_FROM]);

        return $requestArguments;
    }


    /**
     * @param \DateTime|null $dateTime
     *
     * @return string
     */
    private function prepareDateTime(?\DateTime $dateTime): string
    {
        if (!$dateTime instanceof \DateTime) {
            return '';
        }

        return $dateTime->format($this->dateFormat);
    }

}