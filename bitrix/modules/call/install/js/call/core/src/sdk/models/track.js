export class Track
{
	id = null;
	source = '';
	subscribed = false;
	track = {};

	constructor(id, source, track) {
		this.id = id;
		this.source = source;
		this.subscribed = Boolean(track);
		this.track = track;
	}

	setTrack(track) {
		this.track = track;
		this.subscribed = true;
	}
}
