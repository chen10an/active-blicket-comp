# %%
import pandas as pd
import numpy as np
import json
import pickle
import os
import jmespath

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
OUTPUT_DIR_PATH = '../ignore/output/'

with open(os.path.join(OUTPUT_DIR_PATH, 'my_vars.json')) as f:
    my_vars = json.load(f)

with open(os.path.join(OUTPUT_DIR_PATH, 'all_sessions.pickle'), 'rb') as f:
    all_sessions = pickle.load(f)

# %%
# load chunks for both versions
data_list_0, _ = helperfuns.load_data(experiment_version='100-mturk', data_dir_path=DATA_DIR_PATH)
data_list_1, _ = helperfuns.load_data(experiment_version='101-mturk', data_dir_path=DATA_DIR_PATH)

start_df_0 = pd.DataFrame(jmespath.search("[?seq_key=='IntroInstructions'].{sessionId: sessionId, start_time: timestamp, route: route, condition_name: condition_name, is_trouble: is_trouble}", data_list_0)).set_index('sessionId')
start_df_1 = pd.DataFrame(jmespath.search("[?seq_key=='IntroInstructions'].{sessionId: sessionId, start_time: timestamp, route: route, condition_name: condition_name, is_trouble: is_trouble}", data_list_1)).set_index('sessionId')
start_df = pd.concat([start_df_0, start_df_1])

end_df_0 = pd.DataFrame(jmespath.search("[?seq_key=='End'].{sessionId: sessionId, end_time: timestamp, route: route, condition_name: condition_name, is_trouble: is_trouble}", data_list_0)).set_index('sessionId')
end_df_1 = pd.DataFrame(jmespath.search("[?seq_key=='End'].{sessionId: sessionId, end_time: timestamp, route: route, condition_name: condition_name, is_trouble: is_trouble}", data_list_1)).set_index('sessionId')
end_df = pd.concat([end_df_0, end_df_1])

# convert to datetime
start_df.loc[:, 'start_time'] = pd.to_datetime(start_df.start_time, unit='ms')
end_df.loc[:, 'end_time'] = pd.to_datetime(end_df.end_time, unit='ms')

# %%
# filter to sessions that correspond to real participants (e.g. not my tests) we are using the data from
start_df = start_df.loc[start_df.index.get_level_values('sessionId').isin(all_sessions)]
end_df = end_df.loc[end_df.index.get_level_values('sessionId').isin(all_sessions)]

# remove 1 duplicate, probably due to glitchy dispatching for one participant
remove_dex = start_df.index.duplicated(keep='last')  # mark first as duplicate, keep the second
start_df = start_df.loc[~remove_dex]

assert start_df.shape[0] == end_df.shape[0]

# %%
# index on index inner join
joined_df = start_df.join(end_df, how='inner', lsuffix='_end', rsuffix='_start')


# %%
# series of time differences
diff = joined_df.end_time - joined_df.start_time

# mean completion time (end-start) excluding time for reading instructions
mean_completion_min = diff.mean() / pd.Timedelta('1min')
mean_completion_min = np.round(mean_completion_min, 2)  # 2 decimal places
my_vars['completionTime'] = f'{mean_completion_min} minutes'

# %%
save_path = os.path.join(OUTPUT_DIR_PATH, 'my_vars.json')
with open(save_path, 'w') as f:
    json.dump(my_vars, f, indent=4)
# %%
