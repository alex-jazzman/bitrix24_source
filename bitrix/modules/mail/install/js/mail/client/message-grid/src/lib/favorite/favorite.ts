/**
 * Whether the cell of the star carries a star at all. The folder is the word of the server - spam
 * and the bin arrive with `favoriteAvailable` false - and the improvements of the list are the word
 * of the screen. The cell is drawn either way: it holds the width of the column, empty.
 */
export function isFavoriteOffered(favoriteAvailable: boolean, listImprovementsEnabled: boolean): boolean
{
	return listImprovementsEnabled && favoriteAvailable;
}
