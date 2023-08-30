<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Support;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class TicketMainTest extends BaseTestCase
{
    /**
     * Test get all my orders
     */
    public function testGetAllTickets(): void
    {
        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/support/tickets'
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);

        if(is_array($resultJson['message']['data']) && count($resultJson['message']['data'])) {
            $selectTicket = array_keys($resultJson['message']['data'])[0];
            if($resultJson['message']['data'][$selectTicket]) {
                self::$ticket = (int) $resultJson['message']['data'][$selectTicket]['ID'];
            }
        }
    }
}
