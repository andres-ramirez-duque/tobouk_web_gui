var stop_msg;
var launch_msg;
var speech_pub;
var launch_run_pub;
var launch_kill_pub;
var publishImmidiately = true;
var ros_IP;
var ros;
var proc_stage;
var ok_anxiety;
var nao_state;
var nao_behavior_msg;

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
        name : '/speech',
        messageType : 'std_msgs/String'
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
}

function ros_disconnect() {
    ros.close();
    forEachButton(b => b.setAttribute("disabled","disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");
}
function btn_param(procstage) {
    proc_stage.set(procstage);
}

function pause_nao() {
    nao_state.set('bussy');
    speech_pub.publish(stop_msg);
    console.log('NAO Behavior paused');
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
        data: "^call(ALBehaviorManager.runBehavior('" + nao_behavior + "'))"
    });
    speech_pub.publish(nao_behavior_msg);
    console.log('NAO Behavior Running:' + nao_behavior_msg.data);
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
window.onload = function () {
    forEachButton(b => b.setAttribute("disabled", "disabled"));
    document.getElementById("ros_connect").removeAttribute("disabled");

    document.getElementById("ros_status").innerHTML = " ";
    document.getElementById("web_status").innerHTML = " ";
    
}
