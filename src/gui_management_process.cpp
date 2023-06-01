#include <ros/ros.h>
#include <std_msgs/String.h>
#include <std_msgs/Empty.h>

bool running = false;

void callback_run(std_msgs::String msg){
    
    running = false; //Accept new launch
    ros::V_string nodes;
    if ( ! ros::master::getNodes(nodes) ) {
      return;
    }
    for (ros::V_string::iterator it = nodes.begin() ; it != nodes.end(); it++) {
    std::string node = *it;
        if (node == "/get_an_action_service"){
            running = true; //Refuse new launch
            ROS_INFO("-- running: True");
        }
    }
    
    if(!running){
        std::stringstream ss;
        ss << "roslaunch " << msg.data << " &";
        std::system(ss.str().c_str());
        ROS_INFO_STREAM("-- launched : roslaunch " << msg.data);
    }
    else{
        ROS_ERROR("-- A process is already running.");
    }    
}

void callback_kill(std_msgs::Empty msg){
    
    running = false; //Accept new launch
    ros::V_string nodes;
    if ( ! ros::master::getNodes(nodes) ) {
      return;
    }

    for (ros::V_string::iterator it = nodes.begin() ; it != nodes.end(); it++) {
    std::string node = *it;
        if (node == "/get_an_action_service"){
            running = true; //Refuse new launch
            ROS_INFO("-- running: True");
        }    
    }

    if(running){
        std::stringstream ss;
        ss << "rosnode list | egrep -v 'rosout|rosbridge|rosapi|management' | xargs rosnode kill";
        std::system(ss.str().c_str());
        
        std::cout <<"-- Killing process: " << ss.str().c_str() <<"\n";
        ROS_INFO("Killed process");
    }
    else{
        ROS_INFO("No Process are running.");
    }
}


int main(int argc, char** argv){
    ros::init(argc, argv, "gui_management_process");
    ros::NodeHandle n;
    ros::Subscriber sub_run = n.subscribe("/run",1,callback_run);
    ros::Subscriber sub_kill = n.subscribe("/kill",1,callback_kill);
    ros::spin();
    return 0;
}
