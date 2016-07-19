$(document).ready(() => {
	$("#music-form").on('submit', e => {
		// Prevents page from refreshing upon form submission
		e.preventDefault();

		// Grabs the URL posted by the user
		var link = $('.link').val();

		if (link.indexOf('spotify') !== -1) {
			// Embed Spotify widget
			$('#widget-container').html(`<iframe class="widget" src="https://embed.spotify.com/?uri=${link}" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>`);
		} else if (link.indexOf('youtube') !== -1) {
			// Embed YouTube video
			link = link.slice(32, link.length);
			$('#widget-container').html(`<iframe width="300" height="168" src="https://www.youtube.com/embed/${link}?autoplay=1" frameborder="0" allowfullscreen></iframe>`);
		} else if (link.indexOf('soundcloud') !== -1) {
	    // Embed Soundcloud widget
	    SC.initialize({ client_id: '3c90ccc4687932be44fa9433df91f18c' });

	    SC.oEmbed(link, { auto_play: true }).then(oEmbed => {
	    	var chopped = oEmbed.html.slice(66, oEmbed.html.length - 10);
	    	$('#widget-container').html(`<iframe width="300" height="200" scrolling="no" frameborder="no" ${chopped}></iframe>`);
	    });
		}

		// Clears the input form
		$('.link').val('');
	});
});