import sys
import yaml

def main (argv):
    if len(argv) == 4:            
        maxdselected = {"parameters":{ 
                        "boolean_vars":{
            "maxdselected bruno":     'false',
            "maxdselected look":     'false',
            "maxdselected bam":     'false',
            "maxdselected shakeit":     'false',
            "maxdselected macarena":     'false',
            "maxdselected armdance":     'false',
            "maxdselected happy":     'false',
            "maxdselected calmdown":     'false',
            "maxdselected babyshark":     'false',
            "maxdselected fivemonkeys":     'false',
            "maxdselected happyandyouknow":     'false',
            "maxdselected saxophone":     'false',
            "maxdselected guitar":     'false',
            "maxdselected asitwas":     'false',
            "maxdselected idontcare":     'false',
            "maxdselected whatdoyoumean":     'false',
            "maxdselected blindinglights":     'false',
            "reward bruno":     'false',
            "reward look":     'false',
            "reward bam":     'false',
            "reward shakeit":     'false',
            "reward macarena":     'false',
            "reward armdance":     'false',
            "reward happy":     'false',
            "reward calmdown":     'false',
            "reward babyshark":     'false',
            "reward fivemonkeys":     'false',
            "reward happyandyouknow":     'false',
            "reward saxophone":     'false',
            "reward guitar":     'false',
            "reward asitwas":     'false',
            "reward idontcare":     'false',
            "reward whatdoyoumean":     'false',
            "reward blindinglights":     'false',
            "age": argv[2],
            "iv": argv[3],
        }},
        "maxsel": argv[0],
        "rewa":  argv[1],
        }
        maxdselected["parameters"]["boolean_vars"]["maxdselected "+argv[0]] = 'true'
        maxdselected["parameters"]["boolean_vars"]["reward "+argv[1]] = 'true'
        
        with open('catkin_ws/src/tobo_planner/planning_service/model0.13/parameters_frames_scenario.yaml', 'w') as file:
          yaml.dump(maxdselected, file)
          file.close()
          
    else:
        print('Error ')

if __name__ == "__main__":
    main(sys.argv[1:])
