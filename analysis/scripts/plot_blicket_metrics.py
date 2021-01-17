import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
SAVE_PATH = '../ignore/paper/imgs/blicket_metrics.pdf'

blicket0_df = helperfuns.get_quiz_df(experiment_version='100-mturk', data_dir_path=DATA_DIR_PATH, q_type='blicket')
blicket1_df = helperfuns.get_quiz_df(experiment_version='101-mturk', data_dir_path=DATA_DIR_PATH, q_type='blicket')

# load valid participant IDs
fid0_df = helperfuns.get_filtered_id_df(experiment_version='100-mturk', data_dir_path=DATA_DIR_PATH)
fid1_df = helperfuns.get_filtered_id_df(experiment_version='101-mturk', data_dir_path=DATA_DIR_PATH)

# get intersection of sessions with activation prediction answers and sessions with valid participant IDs
fblicket0_df = blicket0_df.reset_index().merge(fid0_df, on='session_id', how='inner')
fblicket1_df = blicket1_df.reset_index().merge(fid1_df, on='session_id', how='inner')
# sanity checks
for key, df in {'Filtered 100-mturk Blicket Data': fblicket0_df, 'Filtered 101-mturk Blicket Data': fblicket1_df}.items():
    print(f"{key}:")
    assert all(df.groupby('session_id').condition.nunique() == 1)
    print("Passed: Each session only has 1 experiment condition.")
    assert len(df.participant_id.unique()) == len(df['session_id'].unique())
    print(f"Passed: Unique participant IDs and unique session IDs have the same count ({len(df.participant_id.unique())}).")
    print("\n")

# concat data from both experiment versions
fblicket_df = pd.concat([fblicket0_df, fblicket1_df])
fblicket_df = fblicket_df.set_index(['condition', 'level', 'session_id'])

f, axs = plt.subplots(3, 2, sharey=True, figsize=(7, 7))
groups = [['c1_c2_c3', 'c1_c3', 'd1_d2_c3', 'd1_c3'], ['d1_d2_d3', 'd1_d3', 'c1_c2_d3', 'c1_d3']]
metrics = ['accuracy', 'recall', 'precision']
for i in range(len(groups)):
    for j in range(len(metrics)):
        sns.barplot(x='level', y=metrics[j], hue='condition', data=fblicket_df.loc[groups[i]].reset_index(), ax=axs[j, i])
        # axs[i].set(ylim=(0, 7.9))
        axs[j, i].set(xlabel='Level')
        axs[j, i].legend(loc='lower left')
        if i == 0:
            axs[j, i].set(ylabel=f'Mean Blicket {metrics[j].capitalize()}')
        else:
            axs[j, i].get_yaxis().set_visible(False)

f.tight_layout()
f.savefig(SAVE_PATH)
print(f"Saved to {SAVE_PATH}!")