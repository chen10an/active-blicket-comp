import json
import pandas as pd
import jmespath
import click

@click.command()
@click.option(
    "--experiment_version",
    help="Semantic version of the Mturk experiment without dots between major, minor, and patch numbers, e.g. '100-mturk' for the full sematic version '1.0.0-mturk'.",
)
@click.option(
    "--earliest_datetime",
    help="A UTC datetime with a format that can be parsed by pandas.Timestamp, e.g. 'YYYY-mm-dd' or 'YYYY-mm-dd HH:MM:SS'. This option specifies the earliest (non-inclusive) ending time (when the participant finished the experiment) to consider.",
)
@click.option(
    "--save_path",
    help="Full path for saving a csv.",
)
def main(experiment_version, earliest_datetime, save_path):
    """Join MTurk worker IDs with their experiment data (including their bonus amounts) and 
    output a csv that matches worker IDs to their bonus amounts. 
    (The worker IDs and experiment data are pulled as separate data sets from somata.)
    
    Example usage: python generate_mturk_bonus_csv.py --experiment_version '100-mturk' --earliest_datetime '2020-12-31' --save_path '../ignore/bonus/bonus_100-mturk.csv'
    """
    earliest_datetime = pd.Timestamp(earliest_datetime)

    # load relevant data sets
    with open(f'../ignore/data/data_{experiment_version}.json') as f:
        data_list = json.load(f)
    with open(f'../ignore/data/mturk_worker_ids_{experiment_version}.tsv') as f:
        id_df = pd.read_csv(f, sep='\t')

    # parse json to find relevant score data for calculating bonuses
    end = jmespath.search("[?seq_key=='End'].{sessionId: sessionId, route: route, end_time: timestamp, score: score, max_score: max_score}", data_list)
    end_df = pd.DataFrame(end)
    end_df = end_df[pd.to_datetime(end_df.end_time, unit='ms') > earliest_datetime] 
    end_df.reset_index(inplace=True, drop=True)

    # TODO: in the future, put bonus amount into the experiment data
    if experiment_version == '100-mturk':
        end_df.loc[:, 'condition'] = end_df.route.apply(lambda x: x[-1]).astype(int)
        end_df.loc[:, 'bonus_per_q'] = 0.05
        end_df.loc[end_df.condition > 1, 'bonus_per_q'] = 0.075
        end_df.loc[:, 'total_bonus'] = end_df.apply(lambda x: x.score * x.bonus_per_q, axis=1)

    # join experiment data with mturk ids and extract bonuses
    joined_df = end_df.join(id_df.set_index('session_id'), on='sessionId')
    bonus_df = joined_df[['participant_id', 'total_bonus']]
    bonus_df = bonus_df.rename(columns={'participant_id': 'WorkerId', 'total_bonus': 'BonusAmount'})
    bonus_df.loc[:, 'Reason'] = 'Correctly answering quiz questions about blickets and the blicket machine.'
    bonus_df.loc[:, 'BonusAmount'] = bonus_df.BonusAmount.round(3).astype(str)

    bonus_df.to_csv(save_path, index=False)
    print(f"Successfully saved to {save_path}!")

if __name__ == "__main__":
    main()