## %%
import pandas as pd
import pickle

import helperfuns

DATA_DIR_PATH ='ignore/data/'

with open('ignore/output/filtered_sessions.pickle', 'rb') as f:
    filtered_sessions = pickle.load(f)

task_1_df = helperfuns.get_full_df(data_type='task_1', data_dir_path=DATA_DIR_PATH)
task_2_df = helperfuns.get_full_df(data_type='task_2', data_dir_path=DATA_DIR_PATH)
task_3_df = helperfuns.get_full_df(data_type='task_3', data_dir_path=DATA_DIR_PATH)

## %%
# get only relevant and non-identifiable cols that exist in each task df
anon_cols = set([f'id_{i}' for i in range(9)] + ['experiment_id'])

anon_df1 = task_1_df[(task_1_df.columns) & anon_cols]
anon_df2 = task_2_df[(task_2_df.columns) & anon_cols]
anon_df3 = task_3_df[(task_3_df.columns) & anon_cols]
## %%
anon_df1.to_csv('ignore/output/interventions1.csv')
anon_df2.to_csv('ignore/output/interventions2.csv')
anon_df3.to_csv('ignore/output/interventions3.csv')
