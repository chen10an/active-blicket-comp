import pandas as pd
import json
import re

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
MY_VARS_PATH = '../ignore/output/my_vars.json'

with open(MY_VARS_PATH) as f:
    my_vars = json.load(f)

quiz_df = helperfuns.get_full_quiz_df(data_dir_path=DATA_DIR_PATH)

total_N = len(quiz_df.index.get_level_values('session_id').unique())
my_vars['totalN'] = total_N

cond_df = quiz_df.reset_index().groupby('condition').session_id.nunique()
for index, val in cond_df.items():
    clean_command = re.sub('\d', '', index).replace('_', '') + 'N'  # remove all underscores and numbers to create a valid latex command
    my_vars[clean_command] = val

# TODO: calculate mean completion time from start and end data for filtered participants only
my_vars['completionTime'] = '10-15min'

with open(MY_VARS_PATH, 'w') as f:
    json.dump(my_vars, f, indent=4)
    
print(f"Saved general participation variables in {MY_VARS_PATH}!")