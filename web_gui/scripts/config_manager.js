var ros_IP;
var ros;
var launch_run_pub;
var launch_msg;
var launch_kill_pub;

var naoqi= true;
var t_doactivity;
var t_idle;
var t_pause
var t_query_response;

var url = "http://10.42.0.254:4200";
var input   = document.getElementById("input");
var iframe  = document.getElementById("shell");
var output  = document.getElementById("output");
var session = document.getElementById("session");

var video = document.getElementById('video');

let winObj = null;
		
function start_video() {
    console.log('Starting video testing');
    
    var message = JSON.stringify({
				      type : 'input',
				      data : 'roslaunch tobouk_web_gui tobouk_web_config.launch\n'
		});
		
		winObj.postMessage(message, url);
    
    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.on(Hls.Events.MEDIA_ATTACHED, function () {
          console.log('video and hls.js are now bound together');
        });
        hls.on(Hls.Events.MEDIA_PARSED, function (event, data) {
          console.log(
            'Manifest loaded, found ' + data.levels.length + 'quality level'
          );
        });
        hls.attachMedia(video);
        setTimeout(() => {
        hls.loadSource('../hlstest/playlist.m3u8');
        },10000);
    }
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = '../hlstest/playlist.m3u8';
        video.addEventListener('canplay', function () {
        
        });
    }
    video.play();
}
function save_config() {
    video.pause();
    
    var message = JSON.stringify({
		  type : 'input',
		  data : '\u0003'
		});
		
		winObj.postMessage(message, url);
			      
    naoqi = document.getElementById('naoqi_switch').checked;
    sessionStorage.setItem('naoqi', naoqi);
    console.log(sessionStorage.getItem('naoqi'));

    ros_IP = document.getElementById("ros_ip").value;
    sessionStorage.setItem('ros_IP',ros_IP);

    t_doactivity = document.getElementById("doactivity").value;
    sessionStorage.setItem('t_doactivity',t_doactivity);
    
    t_query_response = document.getElementById("query_response").value;
    sessionStorage.setItem('t_query_response',t_query_response);

    t_idle = document.getElementById("idle").value;
    sessionStorage.setItem('t_idle',t_idle);

    t_pause = document.getElementById("pause").value;
    sessionStorage.setItem('t_pause',t_pause);

    console.log('Config features saved: ');
    
    setTimeout(() => {
    var message = JSON.stringify({
				      type : 'input',
				      data : 'roslaunch tobouk_web_gui tobouk_web_gui.launch\n'
	  });
		winObj.postMessage(message, url);
    },5000);
}
//iframe.src = url;

window.onload = function () {
    winObj = window.open(url,'_blank');
    setTimeout(() => {
    var message = JSON.stringify({
				      type : 'input',
				      data : 'toboraspuk\n'
	  });
		winObj.postMessage(message, url);
    },500);
    setTimeout(() => {
    var message = JSON.stringify({
				      type : 'input',
				      data : 'tobo2021\n'
	  });
		winObj.postMessage(message, url);
    },500);
}
