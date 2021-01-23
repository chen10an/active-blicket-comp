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
design_df = pd.read_csv('../ignore/output/task_design_matrix.csv', index_col=['startswith', 'condition', 'session_id'])

# filtered version excluding participants who did not classify any blocks as blickets
f_design_df = pd.read_csv('../ignore/output/f_task_design_matrix.csv', index_col=['startswith', 'condition', 'session_id'])

# %%
# filtered data
g = sns.catplot(x='startswith', y='first_num_blocks', data=f_design_df.reset_index(), kind='box', fliersize=0,  order=['c1_c2', 'c1', 'd1', 'd1_d2'])
sns.stripplot(x='startswith', y='first_num_blocks', data=f_design_df.reset_index(), ax=g.ax, color=".3", order=['c1_c2', 'c1', 'd1', 'd1_d2'], jitter=0.3)

# %%
g.savefig(F_SAVE_PATH)
print(f"Saved filtered first intervention plot to {F_SAVE_PATH}!")
# %%
# full data
g = sns.catplot(x='startswith', y='first_num_blocks', data=design_df.reset_index(), kind='box', fliersize=0,  order=['c1_c2', 'c1', 'd1', 'd1_d2'])
sns.stripplot(x='startswith', y='first_num_blocks', data=design_df.reset_index(), ax=g.ax, color=".3", order=['c1_c2', 'c1', 'd1', 'd1_d2'], jitter=0.3)

# %%
g.savefig(SAVE_PATH)
print(f"Saved full first intervention plot to {SAVE_PATH}!")

# %%
