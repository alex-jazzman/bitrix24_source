/**
 * Terminal codes of the presence wire, spelled once for both halves of signaling. A refusal and a busy
 * side have no signal of their own, so the code carried inside a hangup is what tells them apart from
 * an ordinary one - which makes the same code the reason a refusal is sent with where the schema has no
 * default of its own on the server.
 */
export const DECLINE_CODE: number = 603;

export const BUSY_CODE: number = 486;
