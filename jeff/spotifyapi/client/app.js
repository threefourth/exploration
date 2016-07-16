var requestAuth = () => {
  $.ajax
};

var searchSpotify = () => {
  $('#search-spotify').submit(function() {
    var query = $('.search').val();
    $('.search').val('');

    $.ajax({
      url: 'https://api.spotify.com/v1/search',
      data: {
        q: query,
        type: 'album,artist,playlist,track'
      },
      success: function(response) {
        console.log('Successfully retrieved data!', response);
      },
      error: function(response) {
        console.log('Error retrieving data...');
      }
    });
  });
};