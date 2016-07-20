// NOTE: Unless Chrome Cast extension is installed, Chrome 
// will constantly return a 'failed to load resource' error, 
// which is caused by Chrome automatically trying to execute 
// Chrome Cast scripts even if the extension isn't installed.
// See: http://stackoverflow.com/questions/25814914/chrome-youtube-cast-sender-js-console-error
// This bug was supposedly fixed in Chrome 49 but many users,
// including myself, are continuing to experience it. (Currently
// using Chrome 51). There's no effect on our page except 
// the annoying console error message.

// Below code was taken from YouTube's iframe API.
// See: https://developers.google.com/youtube/iframe_api_reference
// I commented out the code that was under onPlayerStateChange.
// Chrome's Chrome Cast bug was causing this function to fire,
// which then caused the player to stop after six seconds.

var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: 'PYGODWJgR-c',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  event.target.mute();
}

var done = false;
function onPlayerStateChange(event) {
  // if (event.data == YT.PlayerState.PLAYING && !done) {
  //   setTimeout(stopVideo, 6000);
  //   done = true;
  // }
}

function stopVideo() {
  player.stopVideo();
}

// <iframe width="640" height="360" src="https://www.youtube.com/embed/PYGODWJgR-c" frameborder="0" volume="0" allowfullscreen></iframe>