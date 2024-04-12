var stop_msg;
var launch_msg;
var speech_pub;
var request_pub;
var request_sub;
var launch_run_pub;
var launch_kill_pub;
var ros;
var ok_anxiety;
var child_name;
var planner_log;
var core_log;
var planner_log_name;
var core_log_name;
var nao_behavior_msg;
var downloadTimer;
var requestModalEl = document.getElementById('requestModal');
var requestModal = bootstrap.Modal.getOrCreateInstance(requestModalEl);
var naoipcheckModalEl = document.getElementById('naoipcheckModal');
var naoipcheckModal = bootstrap.Modal.getOrCreateInstance(naoipcheckModalEl);
var r_type;
var p_step;
var org_params;
var stopNaoClient;
var stop_request;
var recordNaoClient;
var record_request;

var ros_IP = sessionStorage.getItem('ros_IP');
var jet_IP = sessionStorage.getItem('jet_IP');
var nao_IP = sessionStorage.getItem('nao_IP');
var jet_name = sessionStorage.getItem('jet_name');
var url = "http://"+ros_IP+":4200/";
var recording_len = sessionStorage.getItem('recording_len');
var file_name = sessionStorage.getItem('child_id');
let winObj = window.parent;

var curr_vol_level;
var new_vol_level;

var saveLogs = function(log_name) {
    const a = document.createElement('a');
    a.href = "../logs/" + log_name;
    a.download = log_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
//saveLogs(planner_log_name)
//saveLogs(core_log_name)
naoipcheckModalEl.addEventListener('show.bs.modal', function (event) {
    document.getElementById("naoip_input").value = sessionStorage.getItem('nao_IP');
})
requestModalEl.addEventListener('show.bs.modal', function (event) {
    var request_msg = document.getElementById('request_msg')
    var btn_opt1 = document.getElementById('opt_1')
    var btn_opt2 = document.getElementById('opt_2')
    btn_opt2.style.display = 'initial'
    var stages = event.relatedTarget
    request_msg.textContent = stages[0]
    if ( stages[1].length == 1){
        btn_opt1.textContent = stages[1][0]
        btn_opt2.style.display = 'none'
    }else{
        btn_opt1.textContent = stages[1][0]
        btn_opt2.textContent = stages[1][1]    
    }
    //console.log(stages[1].length)
})
requestModalEl.addEventListener('hide.bs.modal', function (event) {
    clearInterval(downloadTimer); 
})
function ros_connect() {
    // Init handle for rosbridge_websocket
    ros = new ROSLIB.Ros({
        url: "ws://" + ros_IP + ":9090"
    });
    ros.on('connection', function() {
        document.getElementById("web_status").innerHTML = "<span style='color: green;'>Connected</span>";
    });
    ros.on('error', function(error) {
        document.getElementById("web_status").innerHTML = "<span style='color: red;'>Error</span>";
    });
    
    ros.on('close', function() {
        document.getElementById("web_status").innerHTML = "<span style='color: yellow;'>Closed</span>";
    });
    core_log = new ROSLIB.Param({
        ros : ros,
        name : '/core_log'
    });
    planner_log = new ROSLIB.Param({
        ros : ros,
        name : '/planner_log'
    });
    hospital_name = new ROSLIB.Param({
        ros : ros,
        name : '/hospital_name'
    });
    hospital_name = new ROSLIB.Param({
        ros : ros,
        name : '/hospital_name'
    });
    child_name = new ROSLIB.Param({
        ros : ros,
        name : '/child_name'
    });
    ok_anxiety = new ROSLIB.Param({
        ros : ros,
        name : '/parameters/boolean_vars/okanxiety preprocedure'
    });
    speech_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/animated_speech',
        messageType : 'tobo_planner/action_chain'
    });
    launch_run_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/run',
        messageType : 'std_msgs/String'
    });
    launch_msg = new ROSLIB.Message({
        data: 'tobouk_web_gui tobo_intervention.launch'
    });
    launch_naoqi_msg = new ROSLIB.Message({
        data: 'naoqi_driver naoqi_driver.launch roscore_ip:='+ros_IP+' nao_ip:='+nao_IP
    });
    kill_msg = new ROSLIB.Message({
        data: 'intervention'
    });
    kill_naoqi_msg = new ROSLIB.Message({
        data: 'naoqi'
    });
    launch_kill_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/kill',
        messageType : 'std_msgs/String'
    });
    request_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/request',
        messageType : 'tobo_planner/web_chain'
    });
    request_sub = new ROSLIB.Topic({
        ros : ros,
        name : '/listener_req',
        messageType : 'tobo_planner/web_chain'
    });
    request_sub.subscribe(function(message) {
        console.log('Received message on ' + request_sub.name + ', Request Type: ' + message.request_type + ', Plan Step: ' + message.plan_step);
        r_type = message.request_type
        p_step = message.plan_step
        org_params = message.parameters
        if(message.request_type == 'anxiety test'){
            record_nao(recording_len);
            msg = 'Does the child appear anxious and need additional support?'
            message.parameters = ['No - Continue', 'Yes - Provide support']
        }else if(message.request_type == 'anxiety retest'){
            msg = 'Is the child too anxious about the IV procedure to continue the interaction?'
            message.parameters = ['No - Continue', 'Yes - Quit']
        }else if(message.request_type == 'type preference query'){
            msg = 'Which of the following types of activities does the child prefer?'
            message.parameters = ['Quiet Activities ', 'Song/Dance']
        }else if(message.request_type == 'activity preference query'){
            msg = 'Which of the following activities does the child prefer?'
        }else if(message.request_type == 'engagement test'){
            msg = 'Please select True if the child is engaged, otherwise select False'
        }else if(message.request_type == 'engagement validate'){
            msg = 'Is the child engaging with the robot?'
            message.parameters = ['Yes - Continue','No - Child disengaged']
        }else if(message.request_type == 'procedure complete query'){
            msg = 'Has the procedure finished?'
            message.parameters = ['Yes - Finished','No - Ongoing']
        }else if(message.request_type == 'wait'){
            org_params = ['Ready']
            if(p_step == 0){
                msg = 'Are you ready to begin the intervention?'    
            }else{
                msg = 'Are you ready to begin the IV procedure?'
            }
            message.parameters = ['Yes - Ready']
        }else if(message.request_type == 'site check query'){
            msg = 'When ready for site check press yes. To skip site check press no'
            message.parameters = ['Yes - Ready','No - Skip']
        }else if(message.request_type == 'procedure ended ok query'){
            msg = 'When the procedure has complete press continue. If there are complications, press quit'
            message.parameters = ['Procedure complete - Continue','Complications - Quit']
        }else if(message.request_type == 'disengagement stop query'){
            msg = 'The child is anxious and disengaged - Should the robot stop?'
            message.parameters = ['Yes - Quit','No - Continue']
        }else if(message.request_type == 'site check complete query'){
            msg = 'Has the site check completed?'
            message.parameters = ['Yes - Finished','No - Ongoing']
        }else{
            msg = 'Please select between the following options'
        }
        requestModal.toggle([msg, message.parameters]);
        coundDown(message.duration);
    });
    command_sub = new ROSLIB.Topic({
        ros : ros,
        name : '/listener_com',
        messageType : 'tobo_planner/web_chain'
    });
    command_sub.subscribe(function(message) {
        console.log('Received message on ' + command_sub.name + ', Request Type: ' + message.request_type + ', Plan Step: ' + message.plan_step);
        if (message.request_type == 'stage progression'){
            if (message.parameters == 'goal'){
                document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 100 +"%;");
                document.getElementById("procedure_progress").setAttribute("aria-valuenow",100)
                document.getElementById("procedure_progress").textContent = "<----- Goal ----->"
            }else{
                msg = 'Please select between the following options which corresponds to the current procedure stage'
                var procedure_value = parseInt(document.getElementById("procedure_progress").getAttribute("aria-valuenow")) + 15
                document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ procedure_value +"%;");
                document.getElementById("procedure_progress").setAttribute("aria-valuenow",procedure_value)
                var procedure_chain = document.getElementById("procedure_progress").textContent
                document.getElementById("procedure_progress").textContent = procedure_chain + message.parameters + " ---> "
                console.log('Procedure Value ' + document.getElementById("procedure_progress").getAttribute("aria-valuenow"));
            }
        }
    });
    battery_sub = new ROSLIB.Topic({
        ros : ros,
        name : '/naoqi_driver/BatteryChargeChanged',
        messageType : 'tobo_planner/action_chain'
    });
    battery_sub.subscribe(function(message) {
        console.log('Received message on ' + command_sub.name + ', Reporting Battery Level: ' + message.execution_status.level);
        if (message.execution_status.level >= 80.0){
            document.getElementById("battery").innerHTML = message.execution_status.level + "% <span style='color:green;font-size:36px'>&#xf240;</span>";
        } else if (message.execution_status.level < 80.0  &&  message.execution_status.level >= 60.0) {
            document.getElementById("battery").innerHTML = message.execution_status.level + "% <span style='color:yellow;font-size:36px'>&#xf241;</span>";
        } else if (message.execution_status.level < 60.0  &&  message.execution_status.level >= 40.0){
            document.getElementById("battery").innerHTML = message.execution_status.level + "% <span style='color:orange;font-size:36px'>&#xf242;</span>";
        } else if (message.execution_status.level < 40.0  &&  message.execution_status.level >= 20){
            document.getElementById("battery").innerHTML = message.execution_status.level + "% <span style='color:red;font-size:36px'>&#xf243;</span>";
        } else if (message.execution_status.level < 20.0  &&  message.execution_status.level >= 0){
            document.getElementById("battery").innerHTML = message.execution_status.level + "% <span style='color:red;font-size:36px'>&#xf244;</span>";
        } else{
            console.log('Error with the battery level reported: ' + message.execution_status.level);
        }
    });
    stopNaoClient = new ROSLIB.Service({
        ros : ros,
        name : '/stop_nao',
        serviceType : 'tobo_planner/PlannerMode'
      });
    
    stop_request = new ROSLIB.ServiceRequest({
        planner_mode : 'stop',
        plan_step : 0
    });
    recordNaoClient = new ROSLIB.Service({
        ros : ros,
        name : '/recording_service',
        serviceType : 'std_srvs/Trigger'
      });
    record_request = new ROSLIB.ServiceRequest({
    });
    stopNaoqiClient = new ROSLIB.Service({
        ros : ros,
        name : '/naoqi_driver/set_behavior',
        serviceType : 'naoqi_bridge_msgs/SetString'
      });
    stopqi_request = new ROSLIB.ServiceRequest({
        data : 'stop'
    });
    getNaoqiVolume = new ROSLIB.Service({
        ros : ros,
        name : '/naoqi_driver/get_volume',
        serviceType : 'naoqi_bridge_msgs/GetFloat'
      });
    setNaoqiVolume = new ROSLIB.Service({
        ros : ros,
        name : '/naoqi_driver/set_volume',
        serviceType : 'naoqi_bridge_msgs/SetFloat'
    });
    emptyvol_request = new ROSLIB.ServiceRequest({
    });
}

function ros_disconnect() {
    forEachButton(b => b.setAttribute("disabled","disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 0 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",0)
    request_sub.unsubscribe();
    command_sub.unsubscribe();
    ros.close();
}
function stop_nao() {
    stopNaoqiClient.callService(stopqi_request, function(result) {
        console.log('Result for service call on '
          + stopNaoqiClient.name
          + ': '
          + result.success);
    });
}
function record_nao(rec_time) { //record_nao(recording_len); 
    recordNaoClient.callService(record_request, function(result) {
        console.log('recording service toggle on: '
          + result.success);
    });
    document.getElementById("record").setAttribute("disabled","disabled");
    setTimeout(()=> {
    recordNaoClient.callService(record_request, function(result) {
        console.log('recording service toggle off: '
          + result.success);
    });
    document.getElementById("record").removeAttribute("disabled");    
    },rec_time);
}
function behavior_nao(nao_behavior){
    nao_behavior_msg = new ROSLIB.Message({
        speech_cmd: "^call(ALBehaviorManager.runBehavior(\"" + nao_behavior + "\"))"
    });
    speech_pub.publish(nao_behavior_msg);
    console.log('Running Tobo Behaviour: ' + nao_behavior_msg.speech_cmd);
}
function naoipcheck_ok(){
    sessionStorage.setItem('nao_IP',document.getElementById("naoip_input").value);
    sessionStorage.setItem('naoip_checked',true);
    console.log('Nao ip is checked: ' +  (sessionStorage.getItem('naoip_checked') == 'false'));
    console.log('Nao new IP: ' +  sessionStorage.getItem('nao_IP'));
    nao_IP = sessionStorage.getItem('nao_IP');
    launch_naoqi_msg.data = 'naoqi_driver naoqi_driver.launch roscore_ip:='+ros_IP+' nao_ip:='+nao_IP;
    naoipcheckModal.hide();
    launch_naoqi();
}
function launch_naoqi() {
    if(sessionStorage.getItem('naoip_checked') == 'false'){
        document.getElementById("naoipcheck_ok").removeAttribute("disabled");
        console.log('Nao ip is checked: ' +  (sessionStorage.getItem('naoip_checked') == 'false'));
        naoipcheckModal.toggle();
    } else {
    launch_run_pub.publish(launch_naoqi_msg);
    console.log('Launching: ' + launch_naoqi_msg.data);
    setTimeout(()=> {
        forEachButton(b => b.removeAttribute("disabled"));
        document.getElementById("ros_connect").setAttribute("disabled","disabled");
        document.getElementById("robot_status").innerHTML = "<span style='color: green;'>Running</span>";
    },1000);
    document.getElementById("battery").innerHTML = "<span style='color:white;font-size:36px'>&#xf244;</span>";
    }
}
function stop_naoqi() {
    document.getElementById("robot_status").innerHTML = "<span style='color: red;'>Stopped</span>";
    forEachButton(b => b.setAttribute("disabled","disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");

    launch_kill_pub.publish(kill_naoqi_msg);
    console.log('Killing: ' + kill_naoqi_msg.data);
    document.getElementById("battery").innerHTML = "<span style='color:white;font-size:36px'>&#xf244;</span>";
}
function launch_run() {
    document.getElementById("ros_status").innerHTML = "<span style='color: green;'>Running</span>";
    launch_run_pub.publish(launch_msg);
    console.log('Launching: ' + launch_msg.data);
    
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 10 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",10)
    document.getElementById("procedure_progress").textContent = "-----> "
    
    var message = JSON.stringify({
				      type : 'input',
				      data : 'ssh '+jet_name+'@'+jet_IP+'\n'
		});
    winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
    
    setTimeout(()=> {
    var message = JSON.stringify({
				      type : 'input',
				      data : "roslaunch tobo_perception tobo_perception.launch os_display:=false\n"
		});
    winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
    },1000);
    set_personalized_form();
}
function launch_kill() {
    stop_nao();
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 0 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",0)
    document.getElementById("ros_status").innerHTML = "<span style='color: red;'>Stopped</span>";
    launch_kill_pub.publish(kill_msg);
    setTimeout(()=> {
    var message = JSON.stringify({
				      type : 'input',
				      data : "exit\n"
		});
    winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
    saveLogs(planner_log_name);
    saveLogs(core_log_name);
    },3000);
}
function pub_request(msg) {
    requestModal.hide();
    clearInterval(downloadTimer); 
    if (msg == 'option1'){
        var param = org_params[0];//document.getElementById('opt_1').textContent
    } else{
        var param = org_params[1];//document.getElementById('opt_2').textContent
    }
    var requested_msg = new ROSLIB.Message({
        plan_step: parseInt(p_step),
        request_type: String(r_type),//register disengagement
        parameters: [String(param)],
        duration: parseFloat(1.0)
    });
    request_pub.publish(requested_msg);
    console.log('Requested response: ' + requested_msg.parameters);
}
function register_disengagement() {
    var disengagement_msg = new ROSLIB.Message({
        plan_step: parseInt(p_step),
        request_type: 'register disengagement',
        parameters: [],
        duration: parseFloat(1.0)
    });
    request_pub.publish(disengagement_msg);
    console.log('Register disengagement: ' + disengagement_msg.request_type);
}
function forEachButton(func) {
    let elements = document.getElementsByTagName("button");
    for(let i = 0, len = elements.length; i < len; i++) {
        func(elements[i])
    }
}
function change_volume(vol_level){
    getNaoqiVolume.callService(emptyvol_request, function(result) {
        curr_vol_level = result.data;
        console.log(result.message + ': ' + curr_vol_level);
    });
    setTimeout(()=> {
        new_vol_level = curr_vol_level + vol_level;
        vol_request = new ROSLIB.ServiceRequest({
            data : new_vol_level
        });
        setNaoqiVolume.callService(vol_request, function(result) {
            console.log(result.message + ': ' + result.success);
        });
        if (new_vol_level >= 0 && new_vol_level <= 100){
            document.getElementById("nao_volume").innerHTML = new_vol_level;
        }
    },500);
}
function set_personalized_form(){
    child_name.set(sessionStorage.getItem('child_name'));
    hospital_name.set(sessionStorage.getItem('hospital_name'));
}
//countdown
function coundDown(countdown) {
    console.log("countdown Timer set: " + countdown);
    var countdownNumberEl = document.getElementById("timer");
    if (countdown > 0){
        countdownNumberEl.textContent = countdown;
        downloadTimer = setInterval(function() {
        countdownNumberEl.textContent = countdown;
        countdown--;
        if (countdown < 0) {
            requestModal.hide();
            clearInterval(downloadTimer);   
        }
        }, 1000);
    }else{
        countdownNumberEl.textContent = " ";
    }
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
			  
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 0 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",0)     
    forEachButton(b => b.setAttribute("disabled", "disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
    document.getElementById("robot_status").innerHTML = " ";
    document.getElementById("ros_status").innerHTML = " ";
    document.getElementById("web_status").innerHTML = " ";
    ros_connect();
    const date = new Date();
    var logs_prefix = file_name + '-' + date.toLocaleString("sv-SE", {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }) + '-' + date.toLocaleTimeString("en-GB");
    planner_log_name = logs_prefix + '-planner.log';  
    planner_log.set(planner_log_name);
    core_log_name = logs_prefix + '-core.log'; 
    core_log.set(core_log_name);
}
