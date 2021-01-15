import os
import json
import pandas as pd
import jmespath

def get_dfs(experiment_version, data_dir_path):
    """Get useful dataframes from experiment data files.

    Load different experiment data files and join MTurk workerIds with their associated chunks data (including their bonus amounts).

    :param experiment_version: Semantic version of the Mturk experiment without dots between major, minor, and patch numbers, e.g. '100-mturk' for the full sematic version '1.0.0-mturk'."
    :param data_dir_path: path to directory where all chunks and workerId data are stored.

    :return: tuple of (chunks_df, workerid_df, bonus_df)
    """
    # load relevant data sets
    with open(os.path.join(data_dir_path, f'chunks_{experiment_version}.json')) as f:
        data_list = json.load(f)
    with open(os.path.join(data_dir_path, f'd_mturk_worker_ids_{experiment_version}.tsv')) as f:
        id_df = pd.read_csv(f, sep='\t')

    # parse json to find relevant score data for calculating bonuses
    end = jmespath.search("[?seq_key=='End'].{sessionId: sessionId, route: route, condition_name: condition_name, end_time: timestamp, score: score, max_score: max_score, bonus_per_q: bonus_per_q, total_bonus: total_bonus}", data_list)
    end_df = pd.DataFrame(end)
    end_df.reset_index(inplace=True, drop=True)

    if experiment_version == '100-mturk':
        # I did not put bonus amounts into the experiment data yet, so here are the posthoc calculations
        end_df.loc[:, 'condition'] = end_df.route.apply(lambda x: x[-1]).astype(int)
        end_df.loc[:, 'bonus_per_q'] = 0.05
        end_df.loc[end_df.condition > 1, 'bonus_per_q'] = 0.075
        end_df.loc[:, 'total_bonus'] = end_df.apply(lambda x: x.score * x.bonus_per_q, axis=1)

    # join experiment data with mturk ids and extract bonuses
    joined_df = end_df.join(id_df.set_index('session_id'), on='sessionId', how='inner')
    bonus_df = joined_df[['participant_id', 'total_bonus']]
    bonus_df = bonus_df.rename(columns={'participant_id': 'WorkerId', 'total_bonus': 'BonusAmount'})
    bonus_df.loc[:, 'Reason'] = 'Correctly answering quiz questions about blickets and the blicket machine.'

    # round bonus to 2 decimal and turn into string to conform to the mturk API's send_bonus syntax
    bonus_df.loc[:, 'BonusAmount'] = bonus_df.BonusAmount.round(2).astype(str)

    return (end_df, id_df, bonus_df)

def get_mturk_batch_df(batch_dir_path):
    """Return one dataframe from a directory of batch csvs downloaded from MTurk's batch review UI
    """
    batch_file_paths = [os.path.join(batch_dir_path, f) for f in os.listdir(batch_dir_path) if os.path.isfile(os.path.join(batch_dir_path, f))]

    batch_dfs = []
    for f_path in batch_file_paths:
        with open(f_path) as f:
            batch_dfs.append(pd.read_csv(f))

    all_batch_df = pd.concat(batch_dfs)

    # check no repeated workers
    if (len(all_batch_df.WorkerId.unique()) != all_batch_df.shape[0]):
        print("ohno these batches have repeated WorkerIds")

    return all_batch_df