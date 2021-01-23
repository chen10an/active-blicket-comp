import pandas as pd
import pickle
import os

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
OUTPUT_DIR_PATH = '../ignore/output/'

# full data set (because all participants have nonempty quiz answers by design)
quiz_df = helperfuns.get_full_df(data_type = 'quiz', data_dir_path=DATA_DIR_PATH)
all_sessions = set(quiz_df.index.get_level_values('session_id').unique())

# smaller (by 3 participants) set where participants tested at least one combo in phase 3
task_3_df = helperfuns.get_full_df(data_type='task_3', data_dir_path=DATA_DIR_PATH)
# classified at least one block as blicket
f_task_3_df = task_3_df[task_3_df.blicket_answer != '000000000']
filtered_sessions = set(f_task_3_df.index.get_level_values('session_id').unique())

assert filtered_sessions.issubset(all_sessions)

save_path = os.path.join(OUTPUT_DIR_PATH, 'all_sessions.pickle')
with open(save_path, 'wb') as f:
    pickle.dump(all_sessions, f)
print(f"Saved all sessions to {save_path}!")

save_path = os.path.join(OUTPUT_DIR_PATH, 'filtered_sessions.pickle')
with open(save_path, 'wb') as f:
    pickle.dump(filtered_sessions, f)
print(f"Saved filtered sessions to {save_path}!")