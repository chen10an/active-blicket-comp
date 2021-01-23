# %%
import pandas as pd
import json
import re
import pickle
import os

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
OUTPUT_DIR_PATH = '../ignore/output/'

with open(os.path.join(OUTPUT_DIR_PATH, 'my_vars.json')) as f:
    my_vars = json.load(f)

# %%
# full data set (because all participants have nonempty quiz answers by design)
quiz_df = helperfuns.get_full_df(data_type = 'quiz', data_dir_path=DATA_DIR_PATH)

with open(os.path.join(OUTPUT_DIR_PATH, 'filtered_sessions.pickle'), 'rb') as f:
    filtered_sessions = pickle.load(f)

with open(os.path.join(OUTPUT_DIR_PATH, 'all_sessions.pickle'), 'rb') as f:
    all_sessions = pickle.load(f)

assert all_sessions == set(quiz_df.index.get_level_values('session_id').unique())

# %%
my_vars['totalN'] = len(all_sessions)
my_vars['filteredN'] = len(filtered_sessions)

# per condition participants (total)
cond_df = quiz_df.reset_index().groupby('condition').session_id.nunique()
for index, val in cond_df.items():
    clean_command = re.sub('\d', '', index).replace('_', '') + 'N'  # remove all underscores and numbers to create a valid latex command
    my_vars[clean_command] = val

# per condition participants (filtered)
f_quiz_df = quiz_df.loc[quiz_df.index.get_level_values('session_id').isin(filtered_sessions)]
f_cond_df = f_quiz_df.reset_index().groupby('condition').session_id.nunique()
for index, val in f_cond_df.items():
    clean_command = 'f' + re.sub('\d', '', index).replace('_', '') + 'N'  # remove all underscores and numbers to create a valid latex command
    my_vars[clean_command] = val

# TODO: calculate mean completion time from start and end data for filtered participants only
my_vars['completionTime'] = '10-15min'

# TODO: mean bonus

save_path = os.path.join(OUTPUT_DIR_PATH, 'my_vars.json')
with open(save_path, 'w') as f:
    json.dump(my_vars, f, indent=4)
    
print(f"Saved general participation variables in {save_path}!")
# %%
