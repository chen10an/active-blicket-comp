import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import jmespath

# TODO: refine plots
# TODO: use click

def get_metrics(participant_ans, correct_ans, return_series=False):
    # get accuracy, precision and recall metrics for comparing the participant's blicket answer to the correct answer, where answers are expressed as a bitstring

    pred = np.array(list(participant_ans)).astype(bool)
    true = np.array(list(correct_ans)).astype(bool)
    accuracy = (pred == true).sum()/len(true)

    num_real_positives = true.sum()  # true positives + false positives
    num_guessed_tp = ((pred == true) & true).sum()  # true positives that the participant managed to guess
    num_guessed_positives = pred.sum()  # true positives + false positives

    if num_real_positives == 0:
        recall = None
    else:
        recall = num_guessed_tp/num_real_positives
    
    if num_guessed_positives == 0:
        precision = None
    else:
        precision = num_guessed_tp/num_guessed_positives

    if return_series:
        return pd.Series([accuracy, recall, precision], index=['accuracy', 'recall', 'precision'])
    else:
        return (accuracy, recall, precision)

# some sanity checking unit tests
assert get_metrics(participant_ans='110', correct_ans='100') == (2/3, 1, 1/2)
assert get_metrics(participant_ans='111', correct_ans='100') == (1/3, 1, 1/3)
assert get_metrics(participant_ans='011', correct_ans='100') == (0, 0, 0)
assert get_metrics(participant_ans='000', correct_ans='100') == (2/3, 0, None)
assert get_metrics(participant_ans='000', correct_ans='000') == (1, None, None)

experiment_version = '100-mturk'
earliest_datetime = '2020-12-29 17:12:28'  # timestamp after which real participants start performing the experiment
route_to_condition = {
    '/conditions/0': 'c1_c2_d3',
    '/conditions/1': 'd1_d2_c3',
    '/conditions/2': 'c1_d3',
    '/conditions/3': 'd1_c3'
}

earliest_datetime = pd.Timestamp(earliest_datetime)

# load relevant data sets
with open(f'../ignore/data/data_{experiment_version}.json') as f:
    data_list = json.load(f)

quiz = jmespath.search("[?seq_key=='End'].{sessionId: sessionId, end_time: timestamp, route: route, score: score, max_score: max_score, blicket_answers: quiz_data.*.blicket_answer_combo | [*].bitstring}", data_list)

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
        level_nums.sort()  # important for making sure the index i below matches bitstrings to the correct level number
    for i in range(len(level_nums)):
        level_num = level_nums[i]

        index = (route_to_condition[session['route']], level_num, session['sessionId'])  # (experiment condition, quiz level, session ID)
        reshaped_dict[index] = [session['blicket_answers'][i]]

quiz_df = pd.DataFrame(reshaped_dict).T
quiz_df.index.set_names(['condition', 'level', 'session_id'], inplace=True)
quiz_df.columns = ['blicket_answer']

# put in the correct answers
# level 1
quiz_df.loc[pd.IndexSlice[['d1_d2_c3', 'd1_c3'], 1, :], 'correct_answer'] = '100'  # 1 blicket for disjunctive level 1
quiz_df.loc[pd.IndexSlice[['c1_c2_d3', 'c1_d3'], 1, :], 'correct_answer'] = '110'  # 2 blickets for conjunctive level 1

# level 2
quiz_df.loc[pd.IndexSlice[:, 2, :], 'correct_answer'] = '111000'  # 6 blocks, 3 blickets for both disj and conj

# level 3
quiz_df.loc[pd.IndexSlice[:, 3, :], 'correct_answer'] = '111100000'  # 9 blocks, 4 blickets for both disj and conj

# add metrics into the dataframe
metrics_df = quiz_df.apply(lambda df: get_metrics(participant_ans=df.blicket_answer, correct_ans=df.correct_answer, return_series=True), axis=1)
quiz_df = quiz_df.join(metrics_df)

f, axs = plt.subplots(3, 2, sharey=True, figsize=(7, 7))
groups = [['d1_d2_c3', 'd1_c3'], ['c1_c2_d3', 'c1_d3']]
metrics = ['accuracy', 'recall', 'precision']
for i in range(len(groups)):
    for j in range(len(metrics)):
        sns.barplot(x='level', y=metrics[j], hue='condition', data=quiz_df.loc[groups[i]].reset_index(), ax=axs[j, i])
        # axs[i].set(ylim=(0, 7.9))
        axs[j, i].set(xlabel='Level')
        axs[j, i].legend(loc='lower left')
        if i == 0:
            axs[j, i].set(ylabel=f'Mean Blicket {metrics[j].capitalize()}')
        else:
            axs[j, i].get_yaxis().set_visible(False)

f.tight_layout()
f.savefig('../ignore/paper/imgs/blicket_metrics.pdf')
print("Saved to ../ignore/paper/imgs/blicket_metrics.pdf!")