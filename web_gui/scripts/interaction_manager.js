var stop_msg;
var launch_msg;
var speech_pub;
var request_pub;
var request_sub;
var launch_run_pub;
var launch_kill_pub;
var publishImmidiately = true;
var ros_IP;
var ros;
var proc_stage;
var ok_anxiety;
var nao_state;
var nao_behavior_msg;
var downloadTimer;
var requestModalEl = document.getElementById('requestModal');
var requestModal = bootstrap.Modal.getOrCreateInstance(requestModalEl);
var r_type;
var p_step;
var stopNaoClient;
var stop_request;

requestModalEl.addEventListener('show.bs.modal', function (event) {
    // do something...
    var request_msg = document.getElementById('request_msg')
    var btn_opt1 = document.getElementById('opt_1')
    var btn_opt2 = document.getElementById('opt_2')
    var stages = event.relatedTarget
    request_msg.textContent = stages[0]
    btn_opt1.textContent = stages[1][0]
    btn_opt2.textContent = stages[1][1]
})
requestModalEl.addEventListener('hide.bs.modal', function (event) {
    // do something...
    clearInterval(downloadTimer); 
})
function ros_connect() {
    forEachButton(b => b.removeAttribute("disabled"));
    document.getElementById("ros_connect").setAttribute("disabled","disabled");
    

    ros_IP = document.getElementById("ros_ip").value;
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
    ros.getParams(function(params) {
        console.log(params);
    });
    proc_stage = new ROSLIB.Param({
        ros : ros,
        name : '/parameters/multi_vars/proc_stage'
    });
    nao_state = new ROSLIB.Param({
        ros : ros,
        name : '/nao_state'
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
    stop_msg = new ROSLIB.Message({
        data: '^call(ALBehaviorManager.stopAllBehaviors())'
    });
    launch_run_pub = new ROSLIB.Topic({
        ros : ros,
        name : '/run',
        messageType : 'std_msgs/String'
    });
    launch_msg = new ROSLIB.Message({
        data: 'tobouk_web_gui tobo_intervention.launch run_naoqi_driver:=false'
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
        console.log('Received message on ' + request_sub.name + ', Plan Step: ' + message.plan_step);
        r_type = message.request_type
        p_step = message.plan_step
        if (message.request_type == 'stage progression'){
            msg = 'Please select between the following options which corresponds to the current procedure stage'    
        }else if(message.request_type == 'anxiety test'){
            msg = 'Please select True if the child anxiety level is low, otherwise select False'
        }else{
            msg = 'Please select between the following options'
        }
        requestModal.toggle([msg, message.parameters]);
        coundDown(message.duration);
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
}

function ros_disconnect() {
    ros.close();
    forEachButton(b => b.setAttribute("disabled","disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
    request_sub.unsubscribe();
}
function btn_param(procstage) {
    requestModal.toggle(['Selection',['Introstep','Preprocedure']]);
    coundDown(10);
    proc_stage.set(procstage);
}

function pause_nao() {
    stopNaoClient.callService(stop_request, function(result) {
        console.log('Result for service call on '
          + stopNaoClient.name
          + ': '
          + result.planner_ok);
    });
}

function resume_nao() {
    nao_state.set('available');
    console.log('NAO Behavior resumed');
}
function launch_run() {
    document.getElementById("ros_status").innerHTML = "<span style='color: green;'>Running</span>";
    launch_run_pub.publish(launch_msg);
}
function launch_kill() {
    document.getElementById("ros_status").innerHTML = "<span style='color: red;'>Stopped</span>";
    launch_kill_pub.publish();
}

function behavior_nao(nao_behavior) {
    nao_state.set('bussy');
    nao_behavior_msg = new ROSLIB.Message({
        speech_cmd: "^call(ALBehaviorManager.runBehavior('" + nao_behavior + "'))"
    });
    speech_pub.publish(nao_behavior_msg);
    console.log('NAO Behavior Running:' + nao_behavior_msg.speech_cmd);
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
function onchange_anxiety(anxiety_val) {
    if(anxiety_val<60){
        ok_anxiety.set('true');
        console.log('ok_anxiety set to True');
    }
    else{
        ok_anxiety.set('false');
        console.log('ok_anxiety set to False');
    }
}
function forEachButton(func) {
    let elements = document.getElementsByTagName("button");
    for(let i = 0, len = elements.length; i < len; i++) {
        func(elements[i])
    }
}
//countdown
function coundDown(countdown) {
    console.log("countdown");
    var countdownNumberEl = document.getElementById("timer");
    countdownNumberEl.textContent = countdown;
    downloadTimer = setInterval(function() {
      countdownNumberEl.textContent = countdown;
      countdown--;
      if (countdown < 0) {
        requestModal.hide();
        clearInterval(downloadTimer);   
      }
    }, 1000);
}

window.onload = function () {     
    forEachButton(b => b.setAttribute("disabled", "disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
    document.getElementById("ros_status").innerHTML = " ";
    document.getElementById("web_status").innerHTML = " ";
}
