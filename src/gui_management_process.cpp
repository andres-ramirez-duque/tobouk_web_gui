#include <ros/ros.h>
#include <std_msgs/String.h>
#include <std_msgs/Empty.h>

bool running = false;

void callback_run(std_msgs::String msg){
    if(!running){
        std::stringstream ss;
        ss << "roslaunch " << msg.data << " &";
        std::system(ss.str().c_str());
        running = true; //Refuse new launch
        ROS_INFO_STREAM("launched : roslaunch" << msg.data);
    }
    else{
        ROS_ERROR("A process is already running.");
    }
}

void callback_kill(std_msgs::Empty msg){
    if(running){
        std::stringstream ss;
        ss << "rosnode list | egrep -v 'rosout|rosbridge|rosapi|management' | xargs rosnode kill";
        std::system(ss.str().c_str());
        running = false;  //accept a new launch
        ROS_INFO("Killed process");
    }
    else{
        ROS_ERROR("No Process are running.");
    }
}


int main(int argc, char** argv){
    ros::init(argc, argv, "gui_management_process");
    ros::NodeHandle n;
    ros::Subscriber sub_run = n.subscribe("/run",100,callback_run);
    ros::Subscriber sub_kill = n.subscribe("/kill",100,callback_kill);
    ros::spin();
    return 0;
}
