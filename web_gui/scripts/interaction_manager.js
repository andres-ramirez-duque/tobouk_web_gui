var stop_msg;
var launch_msg;
var speech_pub;
var request_pub;
var request_sub;
var launch_run_pub;
var launch_kill_pub;
var run_naoqi_driver = 'true';
var ros;
var proc_stage;
var ok_anxiety;
var child_name;
var child_gender;
var child_color;
var is_younger_child;
var doactivity;
var query_response;
var pause;
var idle;
var nao_behavior_msg;
var downloadTimer;
var requestModalEl = document.getElementById('requestModal');
var requestModal = bootstrap.Modal.getOrCreateInstance(requestModalEl);
var r_type;
var p_step;
var stopNaoClient;
var stop_request;
var recordNaoClient;
var record_request;

var ros_IP = sessionStorage.getItem('ros_IP');
var jet_IP = sessionStorage.getItem('jet_IP');
var jet_name = sessionStorage.getItem('jet_name');
var url = "http://"+ros_IP+":4200/";
var recording_len = sessionStorage.getItem('recording_len');
let winObj = window.parent;

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
    forEachButton(b => b.removeAttribute("disabled"));
    document.getElementById("ros_connect").setAttribute("disabled","disabled");
    
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
    child_name = new ROSLIB.Param({
        ros : ros,
        name : '/child_name'
    });
    child_gender = new ROSLIB.Param({
        ros : ros,
        name : '/child_gender'
    });
    child_color = new ROSLIB.Param({
        ros : ros,
        name : '/child_color'
    });
    is_younger_child = new ROSLIB.Param({
        ros : ros,
        name : '/isyoungerchild'
    });
    doactivity = new ROSLIB.Param({
        ros : ros,
        name : '/timeouts/doactivity'
    });
    query_response = new ROSLIB.Param({
        ros : ros,
        name : '/timeouts/query_response'
    });
    idle = new ROSLIB.Param({
        ros : ros,
        name : '/timeouts/idle'
    });
    pause = new ROSLIB.Param({
        ros : ros,
        name : '/timeouts/pause'
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
        data: 'tobouk_web_gui tobo_intervention.launch run_naoqi_driver:='+sessionStorage.getItem('naoqi')
    });
    launch_kill_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/kill',
        messageType : 'std_msgs/Empty'
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
        if(message.request_type == 'anxiety test'){
            msg = 'Please select True if the child anxiety level is low, otherwise select False'
        }else if(message.request_type == 'type preference query'){
            msg = 'Which of the following types of activities do you prefer?'
        }else if(message.request_type == 'activity preference query'){
            msg = 'Which of the following activities do you prefer?'
        }else if(message.request_type == 'engagement test'){
            msg = 'Please select True if the child is engaged, otherwise select False'
        }else if(message.request_type == 'procedure complete query'){
            msg = 'Has the procedure already finished?'
        }else if(message.request_type == 'wait'){
            message.parameters = ['Ready']
            msg = 'Are you ready to progress?'
        }else if(message.request_type == 'site check query'){
            msg = 'Select True if site check will be performed, otherwise select False'
        }else if(message.request_type == 'procedure ended ok query'){
            msg = 'select True if the procedure is going well, otherwise select False'
        }else{
            msg = 'Please select between the following options'
        }
        console.log(message.parameters.length)
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
    stopNaoClient.callService(stop_request, function(result) {
        console.log('Result for service call on '
          + stopNaoClient.name
          + ': '
          + result.planner_ok);
    });
}
function record_nao() {
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
    },recording_len);
    /*nao_behavior_msg = new ROSLIB.Message({
        speech_cmd: "^call(ALBehaviorManager.runBehavior(\"" + nao_behavior + "\"))"
    });*/
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
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 0 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",0)
    document.getElementById("ros_status").innerHTML = "<span style='color: red;'>Stopped</span>";
    launch_kill_pub.publish();
    setTimeout(()=> {
    var message = JSON.stringify({
				      type : 'input',
				      data : "exit\n"
		});
    winObj.document.getElementById("shell").contentWindow.postMessage(message, url);
    },2000);
}
function pub_request(msg) {
    requestModal.hide();
    clearInterval(downloadTimer); 
    if (msg == 'option1'){
        var param = document.getElementById('opt_1').textContent
    } else{
        var param = document.getElementById('opt_2').textContent
    }
    var requested_msg = new ROSLIB.Message({
        plan_step: parseInt(p_step),
        request_type: String(r_type),
        parameters: [String(param)],
        duration: parseFloat(1.0)
    });
    request_pub.publish(requested_msg);
    console.log('Requested response: ' + requested_msg.parameters);
}
function forEachButton(func) {
    let elements = document.getElementsByTagName("button");
    for(let i = 0, len = elements.length; i < len; i++) {
        func(elements[i])
    }
}
function set_personalized_form(){
    child_name.set(sessionStorage.getItem('child_name'));
    child_gender.set(sessionStorage.getItem('child_gender'));
    child_color.set(sessionStorage.getItem('child_color'));
    is_younger_child.set(sessionStorage.getItem('is_younger_child'));

    doactivity.set(parseInt(sessionStorage.getItem('t_doactivity')));
    query_response.set(parseInt(sessionStorage.getItem('t_query_response')));
    idle.set(parseInt(sessionStorage.getItem('t_idle')));
    pause.set(parseInt(sessionStorage.getItem('t_pause')));
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
    
    document.getElementById("procedure_progress").setAttribute("style","font-size:large; width: "+ 0 +"%;");
    document.getElementById("procedure_progress").setAttribute("aria-valuenow",0)     
    forEachButton(b => b.setAttribute("disabled", "disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
    document.getElementById("ros_status").innerHTML = " ";
    document.getElementById("web_status").innerHTML = " ";
}
