import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import helperfuns

# load activation prediction answers
pred0_df = helperfuns.get_prediction_df(experiment_version='100-mturk', data_dir_path='../ignore/data/')
pred1_df = helperfuns.get_prediction_df(experiment_version='101-mturk', data_dir_path='../ignore/data/')

# load valid participant IDs
fid0_df = helperfuns.get_filtered_id_df(experiment_version='100-mturk', data_dir_path='../ignore/data/')
fid1_df = helperfuns.get_filtered_id_df(experiment_version='101-mturk', data_dir_path='../ignore/data/')

# get intersection of sessions with activation prediction answers and sessions with valid participant IDs
fpred0_df = pred0_df.reset_index().merge(fid0_df, on='session_id', how='inner')
fpred1_df = pred1_df.reset_index().merge(fid1_df, on='session_id', how='inner')
# sanity checks
for key, df in {'Filtered 100-mturk Prediction Data': fpred0_df, 'Filtered 101-mturk Prediction Data': fpred1_df}.items():
    print(f"{key}:")
    assert all(df.groupby('session_id').condition.nunique() == 1)
    print("Passed: Each session only has 1 experiment condition.")
    assert len(df.participant_id.unique()) == len(df['session_id'].unique())
    print(f"Passed: Unique participant IDs and unique session IDs have the same count ({len(df.participant_id.unique())}).")
    print("\n")

# concat data from both experiment versions
fpred_df = pd.concat([fpred0_df, fpred1_df])
fpred_df = fpred_df.set_index(['condition', 'level', 'session_id'])

# mean_per_q = quiz_df.groupby(level=['condition', 'level'])['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point'].mean()
# mean_per_q

# plot each activation question's score per level and per pairs of conditions

# stack the quiz_df so that that each question becomes a row indexer
stacked_quiz_df = pd.DataFrame(fpred_df[['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point']].stack(), columns=['score'])
stacked_quiz_df.index.set_names('question', level=3, inplace=True)

f, axs = plt.subplots(3, 2, sharex=True, figsize=(12, 6))

groups = [['c1_c2_c3', 'c1_c3' ,'d1_d2_c3', 'd1_c3'], ['d1_d2_d3', 'd1_d3', 'c1_c2_d3', 'c1_d3']]
levels = [1,2,3]
for i in range(len(groups)):
    for j in range(len(levels)):
        # ax_num = i*len(levels) + j
        sns.barplot(x='question', y='score', hue='condition', data=stacked_quiz_df.loc[groups[i]].loc[pd.IndexSlice[:, levels[j], :]].reset_index(), ax=axs[j, i])
        axs[j, i].set(ylim=(0, 1))
        axs[j, i].set(ylabel='Score')
        axs[j, i].set_title(f'Level {levels[j]}')
        axs[j, i].legend(loc='upper right')
        if j == 2:
            axs[j, i].set(xlabel='Quiz Question')
        else:
            axs[j, i].get_xaxis().set_visible(False)

f.tight_layout()
save_path = '../ignore/paper/imgs/per_q_activation_scores.pdf'
f.savefig(save_path)
print(f"Saved to {save_path}!")

# mean_totals = quiz_df.groupby(level=['condition', 'level']).total_points.mean()
# mean_totals = pd.DataFrame(mean_totals)
# mean_totals

# plot each level's activation score per pairs of conditions
f, axs = plt.subplots(1, 2, sharey=True)

groups = [['c1_c2_c3', 'c1_c3' ,'d1_d2_c3', 'd1_c3'], ['d1_d2_d3', 'd1_d3', 'c1_c2_d3', 'c1_d3']]
legend_bbox_to_anchor=(0.47, 1.1)
for i in range(len(groups)):
    sns.barplot(x='level', y='total_points', hue='condition', data=fpred_df.loc[groups[i]].reset_index(), ax=axs[i])
    axs[i].set(ylim=(0, 7.9))
    axs[i].set(xlabel='Level')
    if i == 0:
        axs[i].set(ylabel='Mean Quiz Score')
    elif i == 1:
        axs[i].get_yaxis().set_visible(False)

f.tight_layout()
save_path = '../ignore/paper/imgs/overall_activation_scores.pdf'
f.savefig(save_path)
print("Saved to {save_path}!")