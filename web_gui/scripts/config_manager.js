var ros;
var launch_run_pub;
var launch_msg;
var launch_kill_pub;

var naoqi;
var t_doactivity;
var t_idle;
var t_pause
var t_query_response;

var video = document.getElementById('video');

var ros_IP = sessionStorage.getItem('ros_IP');
var jet_IP = sessionStorage.getItem('jet_IP');
var jet_name = sessionStorage.getItem('jet_name');
var url = "http://"+ros_IP+":4200/";

let winObj = window.parent;
		
function start_video() {
    console.log('Starting video testing');
    
    var message = JSON.stringify({
				      type : 'input',
				      data : 'roslaunch tobouk_web_gui tobouk_web_config.launch rasp_ip:='+ros_IP+' jet_ip:='+jet_IP+' machine_name:='+jet_name+'\n'
		});
		console.log('roslaunch tobouk_web_gui tobouk_web_config.launch rasp_ip:='+ros_IP+' jet_ip:='+jet_IP+' machine_name:='+jet_name+'\n');
		//winObj.postMessage(message, url);
    winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
    
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
        },15000);
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
		
		winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
}

function onChange_config(name_val) {
    
    if (name_val =='switch'){
      naoqi = document.getElementById("naoqi_switch");
      sessionStorage.setItem('naoqi',naoqi.checked);
      console.log('set naoqi: '+ naoqi.checked);
    }
    if (name == 'doactivity'){
      t_doactivity = document.getElementById("doactivity").value;
      sessionStorage.setItem('t_doactivity',t_doactivity);
    }
    if (name_val =='query_response'){
      t_query_response = document.getElementById("query_response").value;
      sessionStorage.setItem('t_query_response',t_query_response);
    }
    if (name_val =='idle'){
      t_idle = document.getElementById("idle").value;
      sessionStorage.setItem('t_idle',t_idle);
    }
    if (name_val =='pause'){
      t_pause = document.getElementById("pause").value;
      sessionStorage.setItem('t_pause',t_pause);
    }
    console.log('Config features saved for: ' + name_val);
}

window.onload = function () {
    var temp_url = winObj.document.getElementById("shell").src; 
    
    if (temp_url !== url){
      winObj.document.getElementById("shell").src = url;
    }
    var message = JSON.stringify({
				    type : 'session'
			  });
		winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
}
