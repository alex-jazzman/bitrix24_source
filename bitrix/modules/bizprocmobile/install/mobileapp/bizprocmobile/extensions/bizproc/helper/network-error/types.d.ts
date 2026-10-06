/**
 * Input of the network error helper: a caller passes whatever it holds - a list of errors,
 * a single error or the `BX.ajax` rejection envelope. An absent or empty set is valid input.
 */
type NetworkErrorInput = { code: string }[] | { code: string } | { errors: { code: string }[] };

export { NetworkErrorInput };
