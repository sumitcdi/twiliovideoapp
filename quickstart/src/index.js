'use strict';

const {
  isSupported
} = require('twilio-video');

const {
  isMobile
} = require('./browser');
const joinRoom = require('./joinroom');
const micLevel = require('./miclevel');
const selectMedia = require('./selectmedia');
const selectRoom = require('./selectroom');
const showError = require('./showerror');

// For local media controls
const localmediacontrols = require('./localmediacontrols');
const muteYourAudio = localmediacontrols.muteYourAudio;
const muteYourVideo = localmediacontrols.muteYourVideo;
const unmuteYourAudio = localmediacontrols.unmuteYourAudio;
const unmuteYourVideo = localmediacontrols.unmuteYourVideo;
const participantMutedOrUnmutedMedia = localmediacontrols.participantMutedOrUnmutedMedia;

const audioPreview = document.getElementById('audiopreview');
const videoPreview = document.getElementById('videopreview');

// For screenshare
const screenshare = require('./screenshare');
const createScreenTrack = screenshare.createScreenTrack;

// For local video snapshot
var localvideosnapshot = require('./localvideosnapshot');
var displayLocalVideo = localvideosnapshot.displayLocalVideo;
var takeLocalVideoSnapshot = localvideosnapshot.takeLocalVideoSnapshot;

var canvas = document.querySelector('canvas#snapshot');
var takeSnapshot = document.querySelector('button#takesnapshot');
var video = document.querySelector('video#screenpreview');

// added for snapshot
// Set the canvas size to the video size.
function setCanvasSizeToVideo(canvas, video) {
  canvas.style.height = video.clientHeight / 2 + 'px';
}

// Request the default LocalVideoTrack and display it.
displayLocalVideo(video).then(function () {
  // Display a snapshot of the LocalVideoTrack on the canvas.
  takeSnapshot.onclick = function () {
    setCanvasSizeToVideo(canvas, video);
    takeLocalVideoSnapshot(video, canvas);
  };
});

// Resize the canvas to the video size whenever window is resized.
window.onresize = function () {
  setCanvasSizeToVideo(canvas, video);
};


// added for media
(async function () {

  // Muting audio track and video tracks click handlers
  muteAudioBtn.onclick = () => {
    const mute = !muteAudioBtn.classList.contains('muted');
    const activeIcon = document.getElementById('activeIcon');
    const inactiveIcon = document.getElementById('inactiveIcon');

    if (mute) {
      muteYourAudio(room);
      muteAudioBtn.classList.add('muted');
      muteAudioBtn.innerText = 'Unmute Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';

    } else {
      unmuteYourAudio(room);
      muteAudioBtn.classList.remove('muted');
      muteAudioBtn.innerText = 'Mute Audio';
      activeIcon.id = 'inactiveIcon';
      inactiveIcon.id = 'activeIcon';
    }
  }

  muteVideoBtn.onclick = () => {
    const mute = !muteVideoBtn.classList.contains('muted');

    if (mute) {
      muteYourVideo(room);
      muteVideoBtn.classList.add('muted');
      muteVideoBtn.innerText = 'Start Video';
    } else {
      unmuteYourVideo(room);
      muteVideoBtn.classList.remove('muted');
      muteVideoBtn.innerText = 'Stop Video';
    }
  }

  // Starts video upon P2 joining room
  room.on('trackSubscribed', (track => {
    if (track.isEnabled) {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      } else {
        videoPreview.appendChild(track.attach());
      }
    }

    participantMutedOrUnmutedMedia(room, track => {
      track.detach().forEach(element => {
        element.remove();
      });
    }, track => {
      if (track.kind === 'audio') {
        audioPreview.appendChild(track.attach());
      }
      if (track.kind === 'video') {
        videoPreview.appendChild(track.attach());
      }
    });
  }));

  // Disconnect from the Room 
  window.onbeforeunload = () => {
    room.disconnect();
    room.disconnect();
    roomName = null;
  }
}());

// added for screenshare
const captureScreen = document.querySelector('button#capturescreen');
const screenPreview = document.querySelector('video#screenpreview');
const stopScreenCapture = document.querySelector('button#stopscreencapture');

(async function () {
  // Hide the "Stop Capture Screen" button.
  stopScreenCapture.style.display = 'none';

  // The LocalVideoTrack for your screen.
  let screenTrack;

  captureScreen.onclick = async function () {
    try {
      // Create and preview your local screen.
      screenTrack = await createScreenTrack(720, 1280);
      screenTrack.attach(screenPreview);
      // Show the "Capture Screen" button after screen capture stops.
      screenTrack.on('stopped', toggleButtons);
      // Show the "Stop Capture Screen" button.
      toggleButtons();
    } catch (e) {
      alert(e.message);
    }
  };

  stopScreenCapture.onclick = function () {
    // Stop capturing your screen.
    screenTrack.stop();
  }
}());

function toggleButtons() {
  captureScreen.style.display = captureScreen.style.display === 'none' ? '' : 'none';
  stopScreenCapture.style.display = stopScreenCapture.style.display === 'none' ? '' : 'none';
}

// for recording
const recordBtn = document.querySelector('button#recordRoom');

(async function () {
  recordBtn.onclick = function () {
    $.post({
      url: 'https://video.twilio.com/v1/Rooms',
      headers: {
        "Authorization": "Basic " + btoa('ACd25f92b9d8fba705bac34e29130c2e57' + ":" + 'b63df145c96cbf714877f70ce1b53d95')
      },
      data: {
        RecordParticipantsOnConnect: true,
        StatusCallback: 'http://www.mysite.com/twilio/video',
        Type: 'group',
        UniqueName: 'sumitVideoRoom'
      }
    }).done(function () {
      alert('Started recording...');
    }).fail(function () {
      alert('Failed')
    })
  }
}());

const $modals = $('#modals');
const $selectMicModal = $('#select-mic', $modals);
const $selectCameraModal = $('#select-camera', $modals);
const $showErrorModal = $('#show-error', $modals);
const $joinRoomModal = $('#join-room', $modals);

// ConnectOptions settings for a video web application.
const connectOptions = {
  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  bandwidthProfile: {
    video: {
      dominantSpeakerPriority: 'high',
      mode: 'collaboration',
      renderDimensions: {
        high: {
          height: 720,
          width: 1280
        },
        standard: {
          height: 90,
          width: 160
        }
      }
    }
  },

  // Available only in Small Group or Group Rooms only. Please set "Room Type"
  // to "Group" or "Small Group" in your Twilio Console:
  // https://www.twilio.com/console/video/configure
  dominantSpeaker: true,

  // Comment this line to disable verbose logging.
  logLevel: 'debug',

  // Comment this line if you are playing music.
  maxAudioBitrate: 16000,

  // VP8 simulcast enables the media server in a Small Group or Group Room
  // to adapt your encoded video quality for each RemoteParticipant based on
  // their individual bandwidth constraints. This has no utility if you are
  // using Peer-to-Peer Rooms, so you can comment this line.
  preferredVideoCodecs: [{
    codec: 'VP8',
    simulcast: true
  }],

  // Capture 720p video @ 24 fps.
  video: {
    height: 720,
    frameRate: 24,
    width: 1280
  }
};

// For mobile browsers, limit the maximum incoming video bitrate to 2.5 Mbps.
if (isMobile) {
  connectOptions
    .bandwidthProfile
    .video
    .maxSubscriptionBitrate = 2500000;
}

// On mobile browsers, there is the possibility of not getting any media even
// after the user has given permission, most likely due to some other app reserving
// the media device. So, we make sure users always test their media devices before
// joining the Room. For more best practices, please refer to the following guide:
// https://www.twilio.com/docs/video/build-js-video-application-recommendations-and-best-practices
const deviceIds = {
  audio: isMobile ? null : localStorage.getItem('audioDeviceId'),
  video: isMobile ? null : localStorage.getItem('videoDeviceId')
};

/**
 * Select your Room name, your screen name and join.
 * @param [error=null] - Error from the previous Room session, if any
 */
async function selectAndJoinRoom(error = null) {
  const formData = await selectRoom($joinRoomModal, error);
  if (!formData) {
    // User wants to change the camera and microphone.
    // So, show them the microphone selection modal.
    deviceIds.audio = null;
    deviceIds.video = null;
    return selectMicrophone();
  }
  const {
    identity,
    roomName
  } = formData;

  try {
    // Fetch an AccessToken to join the Room.
    const response = await fetch(`/token?identity=${identity}`);

    // Extract the AccessToken from the Response.
    const token = await response.text();

    // Add the specified audio device ID to ConnectOptions.
    connectOptions.audio = {
      deviceId: {
        exact: deviceIds.audio
      }
    };

    // Add the specified Room name to ConnectOptions.
    connectOptions.name = roomName;

    // Add the specified video device ID to ConnectOptions.
    connectOptions.video.deviceId = {
      exact: deviceIds.video
    };

    // Join the Room.
    await joinRoom(token, connectOptions);

    // After the video session, display the room selection modal.
    return selectAndJoinRoom();
  } catch (error) {
    return selectAndJoinRoom(error);
  }
}

/**
 * Select your camera.
 */
async function selectCamera() {
  if (deviceIds.video === null) {
    try {
      deviceIds.video = await selectMedia('video', $selectCameraModal, stream => {
        const $video = $('video', $selectCameraModal);
        $video.get(0).srcObject = stream;
      });
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectAndJoinRoom();
}

/**
 * Select your microphone.
 */
async function selectMicrophone() {
  if (deviceIds.audio === null) {
    try {
      deviceIds.audio = await selectMedia('audio', $selectMicModal, stream => {
        const $levelIndicator = $('svg rect', $selectMicModal);
        const maxLevel = Number($levelIndicator.attr('height'));
        micLevel(stream, maxLevel, level => $levelIndicator.attr('y', maxLevel - level));
      });
    } catch (error) {
      showError($showErrorModal, error);
      return;
    }
  }
  return selectCamera();
}

// If the current browser is not supported by twilio-video.js, show an error
// message. Otherwise, start the application.
window.addEventListener('load', isSupported ? selectMicrophone : () => {
  showError($showErrorModal, new Error('This browser is not supported.'));
});