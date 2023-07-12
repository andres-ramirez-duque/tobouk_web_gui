import sys
import yaml

def main (argv):
    if len(argv) == 6:
            
        act2behav = { 
          "bruno" : '"bruno/behavior_1"',
          "look" : '"look/behavior_1"',
          "bam" : '"bam/behavior_1"',
          "shakeit" : '"shakeit/behavior_1"',
          "macarena" : '"macarena_2/behavior_1"',
          "armdance" : '"arm_dance/behavior_1"',
          "happy" : '"happy/behavior_1"',
          "calmdown" : '"calmdown/behavior_1"',
          "babyshark" : '"babyshark/behavior_1"',
          "oldmacdonald" : '"oldmacdonald/behavior_1"',
          "fivemonkeys" : '"fivemonkeys/behavior_1"',
          "happyandyouknow" : '"happyandyouknow/behavior_1"',
          "saxophone" : '"saxophone/behavior_1"',
          "guitar" : '"guitar/behavior_1"',
          "belly" : '"breathing/behavior_1"',
          "cookies" : '"cookies/behavior_1"',
          "chocolate" : '"chocolate/behavior_1"',
          "taichi" : '"taichi/taichi"',
          "twinklestar" : '"twinklestar/behavior_1"'
        }            

        actions_yaml = """
        actions:
            leadmeditation:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[0]] +"""))'
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav["belly"] +"""))'
                
            taichi:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[1]] +"""))'
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav["taichi"] +"""))'
            
            magic:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[2]] +"""))'
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav["macarena"] +"""))'
                
            ivdebrief_song:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[3]] +"""))'
                - ' ^runSound(ALBehaviorManager.runBehavior("""+ act2behav["guitar"] +"""))'
                
            dance:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[4]] +"""))'
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav["armdance"] +"""))'
                
            song:
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav[argv[5]] +"""))'
                - ' ^call(ALBehaviorManager.runBehavior("""+ act2behav["saxophone"] +"""))'
        """
        actions = yaml.safe_load(actions_yaml)

        with open('catkin_ws/src/tobouk_core/lib_actions/actions.yaml', 'w') as file:
          yaml.dump(actions, file)
          
    else:
        print('Error ')

if __name__ == "__main__":
    main(sys.argv[1:])
