/* eslint-disable */
declare namespace BX.Booking.Lib {
	class RequestRevisionGuard {
		next(entityId: number): number;
		isActual(entityId: number, revision: number): boolean;
	}
}
