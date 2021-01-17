import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import helperfuns

DATA_DIR_PATH ='../ignore/data/'
Q_SAVE_PATH = '../ignore/paper/imgs/per_q_activation_scores.pdf'
OVERALL_SAVE_PATH = '../ignore/paper/imgs/overall_activation_scores.pdf'

quiz_df = helperfuns.get_full_quiz_df(data_dir_path=DATA_DIR_PATH)

# mean_per_q = quiz_df.groupby(level=['condition', 'level'])['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point'].mean()
# mean_per_q

# plot each activation question's score per level and per pairs of conditions

# stack the quiz_df so that that each question becomes a row indexer
stacked_quiz_df = pd.DataFrame(quiz_df[['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point']].stack(), columns=['score'])
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
f.savefig(Q_SAVE_PATH)
print(f"Saved to {Q_SAVE_PATH}!")

# mean_totals = quiz_df.groupby(level=['condition', 'level']).total_points.mean()
# mean_totals = pd.DataFrame(mean_totals)
# mean_totals

# plot each level's activation score per pairs of conditions
f, axs = plt.subplots(1, 2, sharey=True)

groups = [['c1_c2_c3', 'c1_c3' ,'d1_d2_c3', 'd1_c3'], ['d1_d2_d3', 'd1_d3', 'c1_c2_d3', 'c1_d3']]
legend_bbox_to_anchor=(0.47, 1.1)
for i in range(len(groups)):
    sns.barplot(x='level', y='total_points', hue='condition', data=quiz_df.loc[groups[i]].reset_index(), ax=axs[i])
    axs[i].set(ylim=(0, 7.9))
    axs[i].set(xlabel='Level')
    if i == 0:
        axs[i].set(ylabel='Mean Quiz Score')
    elif i == 1:
        axs[i].get_yaxis().set_visible(False)

f.tight_layout()

f.savefig(OVERALL_SAVE_PATH)
print(f"Saved to {OVERALL_SAVE_PATH}!")