import pandas as pd
import json
import re

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
MY_VARS_PATH = '../ignore/output/my_vars.json'

with open(MY_VARS_PATH) as f:
    my_vars = json.load(f)

# full data set (because all participants have nonempty quiz answers by design)
quiz_df = helperfuns.get_full_df(data_type = 'quiz', data_dir_path=DATA_DIR_PATH)
all_sessions = set(quiz_df.index.get_level_values('session_id').unique())

# smaller (by 3 participants) set where participants tested at least one combo in phase 3
task_3_df = helperfuns.get_full_df(data_type='task_3', data_dir_path=DATA_DIR_PATH)
# classified at least one block as blicket
f_task_3_df = task_3_df[task_3_df.blicket_answer != '000000000']
filtered_sessions = set(f_task_3_df.index.get_level_values('session_id').unique())

assert filtered_sessions.issubset(all_sessions)

my_vars['totalN'] = len(all_sessions)
my_vars['filteredN'] = len(filtered_sessions)

# per condition participants (total)
cond_df = quiz_df.reset_index().groupby('condition').session_id.nunique()
for index, val in cond_df.items():
    clean_command = re.sub('\d', '', index).replace('_', '') + 'N'  # remove all underscores and numbers to create a valid latex command
    my_vars[clean_command] = val

# per condition participants (filtered)
f_cond_df = f_task_3_df.reset_index().groupby('condition').session_id.nunique()
for index, val in f_cond_df.items():
    clean_command = 'f' + re.sub('\d', '', index).replace('_', '') + 'N'  # remove all underscores and numbers to create a valid latex command
    my_vars[clean_command] = val

# TODO: calculate mean completion time from start and end data for filtered participants only
my_vars['completionTime'] = '10-15min'

# TODO: mean bonus

with open(MY_VARS_PATH, 'w') as f:
    json.dump(my_vars, f, indent=4)
    
print(f"Saved general participation variables in {MY_VARS_PATH}!")