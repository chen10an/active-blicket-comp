# %%
import pandas as pd
import numpy as np
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

with open(os.path.join(OUTPUT_DIR_PATH, 'nine_combo_sessions.pickle'), 'rb') as f:
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

# %%
end_df_0, _, _= helperfuns.get_end_id_bonus_dfs(experiment_version='100-mturk', data_dir_path=DATA_DIR_PATH)
end_df_1, _, _ = helperfuns.get_end_id_bonus_dfs(experiment_version='101-mturk', data_dir_path=DATA_DIR_PATH)
end_df = pd.concat([end_df_0, end_df_1])

# %%
# filter to real participants (e.g. not my tests) who we use the data for
end_df = end_df[end_df.sessionId.isin(all_sessions)]
mean_bonus = np.round(end_df.total_bonus.mean(), 2)
mean_total_comp = mean_bonus + 1.5
my_vars['totalComp'] = mean_total_comp

# %%
save_path = os.path.join(OUTPUT_DIR_PATH, 'my_vars.json')
with open(save_path, 'w') as f:
    json.dump(my_vars, f, indent=4)
    
print(f"Saved general participation variables in {save_path}!")
# %%
