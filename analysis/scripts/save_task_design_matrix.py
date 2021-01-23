# %%
import pandas as pd
import pickle

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
SAVE_PATH = '../ignore/output/task_design_matrix.csv'
F_SAVE_PATH = '../ignore/output/f_task_design_matrix.csv'

with open('../ignore/output/filtered_sessions.pickle', 'rb') as f:
    filtered_sessions = pickle.load(f)

task_3_df = helperfuns.get_full_df(data_type='task_3', data_dir_path=DATA_DIR_PATH
)

# %%
# group conditions by which functional form they start with
task_3_df.loc[['c1_c2_c3', 'c1_c2_d3'], 'startswith'] = 'c1_c2'
task_3_df.loc[['d1_d2_d3', 'd1_d2_c3'], 'startswith'] = 'd1_d2'
task_3_df.loc[['c1_c3', 'c1_d3'], 'startswith'] = 'c1'
task_3_df.loc[['d1_d3', 'd1_c3'], 'startswith'] = 'd1'
task_3_df.set_index('startswith', append=True, inplace=True)

intervention_df = task_3_df[[f'id_{i}' for i in range(9)]]
num_blocks = intervention_df.apply(sum, axis=1)
first_num_per_session = num_blocks.groupby(level=['startswith', 'condition', 'session_id']).first()

design_df = pd.DataFrame(first_num_per_session, columns=['first_num_blocks'])
design_df.loc[:,'is_singleton'] = (design_df.first_num_blocks == 1).astype(int)
design_df.loc[:, 'startswith_d'] = (design_df.index.get_level_values('startswith').str.startswith('d1')).astype(int)
design_df.loc[:, 'has_phase_2'] = (design_df.index.get_level_values('startswith').str.endswith('2')).astype(int)

# filtered version excluding participants who did not classify any blocks as blickets
f_design_df = design_df.loc[design_df.index.get_level_values('session_id').isin(filtered_sessions)]


# %%
design_df.to_csv(SAVE_PATH)
print(f"Saved the full task design matrix to {SAVE_PATH}!")

# %%

f_design_df.to_csv(F_SAVE_PATH)
print(f"Saved the filtered task design matrix to {F_SAVE_PATH}!")

# %%