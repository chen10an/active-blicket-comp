# %%
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import helperfuns
import numpy as np

DATA_DIR_PATH ='../ignore/data/'
F_SAVE_PATH = '../ignore/paper/imgs/f_first_combo.pdf'
SAVE_PATH = '../ignore/paper/imgs/first_combo.pdf'


# %%
task_3_df = helperfuns.get_full_df(data_type='task_3', data_dir_path=DATA_DIR_PATH
)

# group conditions by which functional form they start with
task_3_df.loc[['c1_c2_c3', 'c1_c2_d3'], 'startswith'] = 'c1_c2'
task_3_df.loc[['d1_d2_d3', 'd1_d2_c3'], 'startswith'] = 'd1_d2'
task_3_df.loc[['c1_c3', 'c1_d3'], 'startswith'] = 'c1'
task_3_df.loc[['d1_d3', 'd1_c3'], 'startswith'] = 'd1'
task_3_df.set_index('startswith', append=True, inplace=True)

# filtered version excluding participants who did not classify any blocks as blickets
f_task_3_df = task_3_df[task_3_df.blicket_answer != '000000000']

# %%
# filtered data
intervention_df = f_task_3_df[[f'id_{i}' for i in range(9)]]

num_blocks = intervention_df.apply(sum, axis=1)
first_num_per_session = num_blocks.groupby(level=['startswith', 'session_id']).first()
first_df = pd.DataFrame(first_num_per_session, columns=['num_blocks'])

# box plot
g = sns.catplot(x='startswith', y='num_blocks', data=first_df.reset_index(), kind='box', fliersize=0,  order=['c1_c2', 'c1', 'd1', 'd1_d2'])
sns.stripplot(x='startswith', y='num_blocks', data=first_df.reset_index(), ax=g.ax, color=".3", order=['c1_c2', 'c1', 'd1', 'd1_d2'], jitter=0.3)

g.savefig(F_SAVE_PATH)
print(f"Saved filtered first intervention plot to {F_SAVE_PATH}!")
# %%
# full data
intervention_df = task_3_df[[f'id_{i}' for i in range(9)]]

num_blocks = intervention_df.apply(sum, axis=1)
first_num_per_session = num_blocks.groupby(level=['startswith', 'session_id']).first()
first_df = pd.DataFrame(first_num_per_session, columns=['num_blocks'])

# box plot
g = sns.catplot(x='startswith', y='num_blocks', data=first_df.reset_index(), kind='box', fliersize=0, order=['c1_c2', 'c1', 'd1', 'd1_d2'])
sns.stripplot(x='startswith', y='num_blocks', data=first_df.reset_index(), ax=g.ax, color=".3", order=['c1_c2', 'c1', 'd1', 'd1_d2'], jitter=0.3)

g.savefig(SAVE_PATH)
print(f"Saved full first intervention plot to {SAVE_PATH}!")

# %%
