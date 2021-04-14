## %%
import pandas as pd
import pickle

import helperfuns

DATA_DIR_PATH ='../ignore/data/'

with open('../ignore/output/filtered_sessions.pickle', 'rb') as f:
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
# fill in blicket machine response for each phase
# phase 1: d1 and c1
d1_dex = anon_df1.index.get_level_values('condition').str.startswith('d1')
c1_dex = anon_df1.index.get_level_values('condition').str.startswith('c1')

anon_df1.loc[d1_dex, 'phase'] = 'd1'
anon_df1.loc[d1_dex, 'outcome'] = anon_df1.loc[d1_dex].apply(lambda row: row.id_0 >= 1, axis=1)
anon_df1.loc[c1_dex, 'phase'] = 'c1'
anon_df1.loc[c1_dex, 'outcome'] = anon_df1.loc[c1_dex].apply(lambda row: row.id_0 + row.id_1 >= 2, axis=1)

# phase 2: d2 and c2
d2_dex = anon_df2.index.get_level_values('condition').str.contains('d2')
c2_dex = anon_df2.index.get_level_values('condition').str.contains('c2')

anon_df2.loc[d2_dex, 'phase'] = 'd2'
anon_df2.loc[d2_dex, 'outcome'] = anon_df2.loc[d2_dex].apply(lambda row: row.id_0 + row.id_1 + row.id_2 >= 1, axis=1)
anon_df2.loc[c2_dex, 'phase'] = 'c2'
anon_df2.loc[c2_dex, 'outcome'] = anon_df2.loc[c2_dex].apply(lambda row: row.id_0 + row.id_1 + row.id_2 >= 2, axis=1)

# phase 3: d3 and c3
d3_dex = anon_df3.index.get_level_values('condition').str.endswith('d3')
c3_dex = anon_df3.index.get_level_values('condition').str.endswith('c3')

anon_df3.loc[d3_dex, 'phase'] = 'd3'
anon_df3.loc[d3_dex, 'outcome'] = anon_df3.loc[d3_dex].apply(lambda row: row.id_0 + row.id_1 + row.id_2 + row.id_3 >= 1, axis=1)
anon_df3.loc[c3_dex, 'phase'] = 'c3'
anon_df3.loc[c3_dex, 'outcome'] = anon_df3.loc[c3_dex].apply(lambda row: row.id_0 + row.id_1 + row.id_2 + row.id_3 >= 2, axis=1)

## %%
anon_df1.to_csv('../ignore/output/interventions1.csv')
anon_df2.to_csv('../ignore/output/interventions2.csv')
anon_df3.to_csv('../ignore/output/interventions3.csv')
