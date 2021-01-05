import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import jmespath

# TODO: refine plots
# TODO: use click

experiment_version = '100-mturk'
earliest_datetime = '2020-12-29 17:12:28'  # timestamp after which real participants start performing the experiment

earliest_datetime = pd.Timestamp(earliest_datetime)

# load relevant data sets
with open(f'../ignore/data/data_{experiment_version}.json') as f:
    data_list = json.load(f)
with open(f'../ignore/data/mturk_worker_ids_{experiment_version}.tsv') as f:
    id_df = pd.read_csv(f, sep='\t')

quiz = jmespath.search("[?seq_key=='End'].{sessionId: sessionId, end_time: timestamp, route: route, score: score, max_score: max_score, quiz_data: quiz_data}", data_list)

route_to_condition = {
    '/conditions/0': 'c1_c2_d3',
    '/conditions/1': 'd1_d2_c3',
    '/conditions/2': 'c1_d3',
    '/conditions/3': 'd1_c3'
}

# prepare a dict to be converted into a dataframe indexed by (experiment condition, quiz level, session ID)
reshaped_dict = {}
for session in quiz:
    # don't consider sessions before earliest_datetime
    if pd.to_datetime(session['end_time'], unit='ms') <= earliest_datetime:
        continue

    # consider different quiz levels for different experiment conditions
    level_nums = [1, 3]
    if session['route'] == '/conditions/0' or session['route'] == '/conditions/1':
        level_nums.append(2)
        level_nums.sort()

    for i in level_nums:
        level_dict = session['quiz_data'][f'level_{i}']
        activation_score = level_dict['activation_score']
        answered_correctly = np.equal(level_dict['activation_answer_groups'], level_dict['correct_activation_answers'])
        total_correct = np.sum(answered_correctly)
        assert total_correct == level_dict['activation_score']

        index = (route_to_condition[session['route']], i, session['sessionId'])  # (experiment condition, quiz level, session ID)
        cols = np.concatenate([answered_correctly, [total_correct]])
        reshaped_dict[index] = cols

quiz_df = pd.DataFrame(reshaped_dict).T
quiz_df.index.set_names(['condition', 'level', 'session_id'], inplace=True)
quiz_df.columns = ['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point', 'total_points']

# mean_per_q = quiz_df.groupby(level=['condition', 'level'])['q1_point', 'q2_point', 'q3_point', 'q4_point', 'q5_point', 'q6_point', 'q7_point'].mean()
# mean_per_q

# plot each activation question's score per level and per pairs of conditions

# stack the quiz_df so that that each question becomes a row indexer
stacked_quiz_df = pd.DataFrame(quiz_df.drop('total_points', axis=1).stack(), columns=['score'])
stacked_quiz_df.index.set_names('question', level=3, inplace=True)

f, axs = plt.subplots(3, 2, sharex=True, figsize=(12, 6))

groups = [['d1_d2_c3', 'd1_c3'], ['c1_c2_d3', 'c1_d3']]
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
f.savefig('../ignore/paper/imgs/per_q_activation_scores.pdf')
print("Saved to ../ignore/paper/imgs/per_q_activation_scores.pdf!")

# mean_totals = quiz_df.groupby(level=['condition', 'level']).total_points.mean()
# mean_totals = pd.DataFrame(mean_totals)
# mean_totals

# plot each level's activation score per pairs of conditions
f, axs = plt.subplots(1, 2, sharey=True)

groups = [['d1_d2_c3', 'd1_c3'], ['c1_c2_d3', 'c1_d3']]
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
f.savefig('../ignore/paper/imgs/overall_activation_scores.pdf')
print("Saved to ../ignore/paper/imgs/overall_activation_scores.pdf!")