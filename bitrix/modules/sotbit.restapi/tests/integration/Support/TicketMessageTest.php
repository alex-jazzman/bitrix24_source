<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Tests\integration\Support;

use Sotbit\RestAPI\Tests\integration\BaseTestCase;

class TicketMessageTest extends BaseTestCase
{
    /**
     * Test get all
     */
    public function testGetAllMessages(): void
    {
        if(!self::$ticket) {
            $this->expectNotToPerformAssertions();
        }

        // request
        $response = $this->runApp(
            'GET',
            '/'.self::VERSION_API.'/support/messages/ticket/'.self::$ticket
        );

        // headers
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals('application/json', $response->getHeaderLine('Content-Type'));

        // body
        $resultJson = $this->getJson($response);
        $this->assertEquals('success', $resultJson['status']);
        $this->assertArrayHasKey('message', $resultJson);
    }
}
