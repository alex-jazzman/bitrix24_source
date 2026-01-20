// Protobuf message models
import '../../../protobuf/protobuf';
import '../../../protobuf/model';

const Response = window.protobuf.roots['push-server'].Response;
const ResponseBatch = window.protobuf.roots['push-server'].ResponseBatch;
const Request = window.protobuf.roots['push-server'].Request;
const RequestBatch = window.protobuf.roots['push-server'].RequestBatch;
const IncomingMessagesRequest = window.protobuf.roots['push-server'].IncomingMessagesRequest;
const IncomingMessage = window.protobuf.roots['push-server'].IncomingMessage;
const Receiver = window.protobuf.roots['push-server'].Receiver;

export {
	Response,
	ResponseBatch,
	Request,
	RequestBatch,
	IncomingMessagesRequest,
	IncomingMessage,
	Receiver,
};
