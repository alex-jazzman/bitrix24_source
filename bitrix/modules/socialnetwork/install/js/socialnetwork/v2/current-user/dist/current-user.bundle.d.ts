/* eslint-disable */
type CurrentUserSettings = {
	id: number;
	name: string;
	image: {
		src: string;
	} | null;
};

declare namespace BX.Socialnetwork.V2 {
	function getCurrentUserSettings(): CurrentUserSettings;
}
