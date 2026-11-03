// Решает ровно один вопрос: рисовать ли строку адреса в паспорте ЦРМ. Оба условия обязательны —
// дескрипторная запись (addressRecord: раздел вообще поддерживает адрес на этом шаге) и уже
// резолвленная сервером строка (addressUrl).
//
// Тут нарочно нет своего "resolvePassportAddress": строку тип-гардом уже один раз проверяет
// readSectionUrl() (../read-section-url/read-section-url.ts) при сборке snapshot в app.ts, и
// второй guard над тем же полем был бы дублем той же логики на том же значении, просто на
// шаг ниже по потоку данных. Компонент читает snapshot.intranetCustomSectionUrl инлайново
// (тривиальный typeof-гард на границе своего props) и передаёт сюда готовую строку.
export function hasPassportAddress(addressUrl: string, addressRecord: unknown): boolean
{
	return addressRecord !== null && addressRecord !== undefined && addressUrl !== '';
}
