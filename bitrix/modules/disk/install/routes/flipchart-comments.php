<?php

declare(strict_types=1);

use Bitrix\Disk\Controller\Integration\Flipchart\Comments;
use Bitrix\Main\Engine\Response\Json;
use Bitrix\Main\Routing\RoutingConfigurator;

return static function (RoutingConfigurator $routes): void {
	$methodNotAllowed = static function (string $allow): \Closure {
		return static function () use ($allow): Json {
			$response = new Json([
				'code' => 'method_not_allowed',
				'message' => 'Method is not allowed.',
			]);
			$response->setStatus(405);
			$response->addHeader('Allow', $allow);

			return $response;
		};
	};

	$routes
		->prefix('api/disk/flipchart/comments/v1')
		->group(static function (RoutingConfigurator $routes) use ($methodNotAllowed): void {
			// every path is declared twice: the cloud web server answers 404 itself to a path with neither an
			// extension nor a trailing slash, so callers move to the slash form while the bare form keeps working
			$routes->any('attachments/{attachmentId}', [Comments::class, 'getCommentAttachment'])->methods(['GET']);
			$routes->any('attachments/{attachmentId}/', [Comments::class, 'getCommentAttachment'])->methods(['GET']);
			$routes->any('attachments/{attachmentId}', $methodNotAllowed('GET'));
			$routes->any('attachments/{attachmentId}/', $methodNotAllowed('GET'));

			// the upload belongs to no thread: the board and the user come from the token alone
			$routes->any('attachments', [Comments::class, 'uploadCommentAttachment'])->methods(['POST']);
			$routes->any('attachments/', [Comments::class, 'uploadCommentAttachment'])->methods(['POST']);
			$routes->any('attachments', $methodNotAllowed('POST'));
			$routes->any('attachments/', $methodNotAllowed('POST'));

			// the read state of a whole board is addressed by the document, not by a thread
			$routes->any('flips/{documentId}/read-all', [Comments::class, 'isFlipReadAll'])->methods(['GET']);
			$routes->any('flips/{documentId}/read-all/', [Comments::class, 'isFlipReadAll'])->methods(['GET']);
			$routes->any('flips/{documentId}/read-all', $methodNotAllowed('GET'));
			$routes->any('flips/{documentId}/read-all/', $methodNotAllowed('GET'));

			$routes->any('flips/{documentId}/read', [Comments::class, 'markAllThreadsAsRead'])->methods(['POST']);
			$routes->any('flips/{documentId}/read/', [Comments::class, 'markAllThreadsAsRead'])->methods(['POST']);
			$routes->any('flips/{documentId}/read', $methodNotAllowed('POST'));
			$routes->any('flips/{documentId}/read/', $methodNotAllowed('POST'));

			$routes->any('read-statuses/query', [Comments::class, 'getReadStatuses'])->methods(['POST']);
			$routes->any('read-statuses/query/', [Comments::class, 'getReadStatuses'])->methods(['POST']);
			$routes->any('read-statuses/query', $methodNotAllowed('POST'));
			$routes->any('read-statuses/query/', $methodNotAllowed('POST'));

			// the feed of the reader spans the whole board, so it hangs off no thread
			$routes->any('mentions', [Comments::class, 'getMentions'])->methods(['GET']);
			$routes->any('mentions/', [Comments::class, 'getMentions'])->methods(['GET']);
			$routes->any('mentions', $methodNotAllowed('GET'));
			$routes->any('mentions/', $methodNotAllowed('GET'));

			$routes->any('threads/{threadId}/flags/important', [Comments::class, 'setThreadImportant'])->methods(['PUT']);
			$routes->any('threads/{threadId}/flags/important/', [Comments::class, 'setThreadImportant'])->methods(['PUT']);
			$routes->any('threads/{threadId}/flags/important', $methodNotAllowed('PUT'));
			$routes->any('threads/{threadId}/flags/important/', $methodNotAllowed('PUT'));
			$routes->any('threads/{threadId}/flags/pinned', [Comments::class, 'setThreadPinned'])->methods(['PUT']);
			$routes->any('threads/{threadId}/flags/pinned/', [Comments::class, 'setThreadPinned'])->methods(['PUT']);
			$routes->any('threads/{threadId}/flags/pinned', $methodNotAllowed('PUT'));
			$routes->any('threads/{threadId}/flags/pinned/', $methodNotAllowed('PUT'));

			$routes->any('threads', [Comments::class, 'getThreadsByFilter'])->methods(['GET']);
			$routes->any('threads/', [Comments::class, 'getThreadsByFilter'])->methods(['GET']);
			$routes->any('threads', [Comments::class, 'addThread'])->methods(['POST']);
			$routes->any('threads/', [Comments::class, 'addThread'])->methods(['POST']);
			$routes->any('threads', $methodNotAllowed('GET, POST'));
			$routes->any('threads/', $methodNotAllowed('GET, POST'));

			// static segments go before the addressed comment, or {commentId} would swallow them
			$routes->any('threads/{threadId}/comments/count', [Comments::class, 'countCommentsInThread'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/count/', [Comments::class, 'countCommentsInThread'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/count', $methodNotAllowed('GET'));
			$routes->any('threads/{threadId}/comments/count/', $methodNotAllowed('GET'));

			$routes->any('threads/{threadId}/comments/max-id', [Comments::class, 'getMaxCommentId'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/max-id/', [Comments::class, 'getMaxCommentId'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/max-id', $methodNotAllowed('GET'));
			$routes->any('threads/{threadId}/comments/max-id/', $methodNotAllowed('GET'));

			$routes->any('threads/{threadId}/comments', [Comments::class, 'getThreadComments'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/', [Comments::class, 'getThreadComments'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments', [Comments::class, 'addComment'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments/', [Comments::class, 'addComment'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments', $methodNotAllowed('GET, POST'));
			$routes->any('threads/{threadId}/comments/', $methodNotAllowed('GET, POST'));

			$routes->any('threads/{threadId}/comments/{commentId}/recover', [Comments::class, 'recoverComment'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments/{commentId}/recover/', [Comments::class, 'recoverComment'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments/{commentId}/recover', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/comments/{commentId}/recover/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}/comments/{commentId}/reactions', [Comments::class, 'addReaction'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments/{commentId}/reactions/', [Comments::class, 'addReaction'])->methods(['POST']);
			$routes->any('threads/{threadId}/comments/{commentId}/reactions', [Comments::class, 'removeReaction'])->methods(['DELETE']);
			$routes->any('threads/{threadId}/comments/{commentId}/reactions/', [Comments::class, 'removeReaction'])->methods(['DELETE']);
			$routes->any('threads/{threadId}/comments/{commentId}/reactions', $methodNotAllowed('POST, DELETE'));
			$routes->any('threads/{threadId}/comments/{commentId}/reactions/', $methodNotAllowed('POST, DELETE'));

			$routes->any('threads/{threadId}/comments/{commentId}', [Comments::class, 'getComment'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/{commentId}/', [Comments::class, 'getComment'])->methods(['GET']);
			$routes->any('threads/{threadId}/comments/{commentId}', [Comments::class, 'updateComment'])->methods(['PATCH']);
			$routes->any('threads/{threadId}/comments/{commentId}/', [Comments::class, 'updateComment'])->methods(['PATCH']);
			$routes->any('threads/{threadId}/comments/{commentId}', [Comments::class, 'deleteComment'])->methods(['DELETE']);
			$routes->any('threads/{threadId}/comments/{commentId}/', [Comments::class, 'deleteComment'])->methods(['DELETE']);
			$routes->any('threads/{threadId}/comments/{commentId}', $methodNotAllowed('GET, PATCH, DELETE'));
			$routes->any('threads/{threadId}/comments/{commentId}/', $methodNotAllowed('GET, PATCH, DELETE'));

			$routes->any('threads/{threadId}/restore', [Comments::class, 'restoreThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/restore/', [Comments::class, 'restoreThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/restore', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/restore/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}/resolve', [Comments::class, 'resolveThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/resolve/', [Comments::class, 'resolveThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/resolve', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/resolve/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}/unresolve', [Comments::class, 'unresolveThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/unresolve/', [Comments::class, 'unresolveThread'])->methods(['POST']);
			$routes->any('threads/{threadId}/unresolve', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/unresolve/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}/read', [Comments::class, 'markCommentsAsRead'])->methods(['POST']);
			$routes->any('threads/{threadId}/read/', [Comments::class, 'markCommentsAsRead'])->methods(['POST']);
			$routes->any('threads/{threadId}/read', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/read/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}/unread', [Comments::class, 'markThreadAsUnread'])->methods(['POST']);
			$routes->any('threads/{threadId}/unread/', [Comments::class, 'markThreadAsUnread'])->methods(['POST']);
			$routes->any('threads/{threadId}/unread', $methodNotAllowed('POST'));
			$routes->any('threads/{threadId}/unread/', $methodNotAllowed('POST'));

			$routes->any('threads/{threadId}', [Comments::class, 'getThreadMeta'])->methods(['GET']);
			$routes->any('threads/{threadId}/', [Comments::class, 'getThreadMeta'])->methods(['GET']);
			$routes->any('threads/{threadId}', [Comments::class, 'updateThreadCoordinates'])->methods(['PATCH']);
			$routes->any('threads/{threadId}/', [Comments::class, 'updateThreadCoordinates'])->methods(['PATCH']);
			$routes->any('threads/{threadId}', [Comments::class, 'deleteThread'])->methods(['DELETE']);
			$routes->any('threads/{threadId}/', [Comments::class, 'deleteThread'])->methods(['DELETE']);
			$routes->any('threads/{threadId}', $methodNotAllowed('GET, PATCH, DELETE'));
			$routes->any('threads/{threadId}/', $methodNotAllowed('GET, PATCH, DELETE'));
		})
	;
};
