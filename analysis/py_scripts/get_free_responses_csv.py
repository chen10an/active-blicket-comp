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
    """Get all free responses from the experiment data and save as a csv.
    
    Example usage: python get_free_responses_csv.py --experiment_version '100-mturk' --earliest_datetime '2020-12-29 17:12:28' --save_path '../ignore/output/responses_100-mturk.csv'
    """
    earliest_datetime = pd.Timestamp(earliest_datetime)

    # load relevant data sets
    with open(f'../ignore/data/chunks_{experiment_version}.json') as f:
        data_list = json.load(f)
    
    response = jmespath.search("[?seq_key=='End'].{sessionId: sessionId, end_time: timestamp, route: route, score: score, max_score: max_score, level_1_machine: quiz_data.level_1.free_response_0, level_1_strategy: quiz_data.level_1.free_response_1, level_2_machine: quiz_data.level_2.free_response_0, level_2_strategy: quiz_data.level_2.free_response_1, level_3_machine: quiz_data.level_3.free_response_0, level_3_strategy: quiz_data.level_3.free_response_1, feedback: feedback}", data_list)
    response_df = pd.DataFrame(response)
    response_df = response_df[pd.to_datetime(response_df.end_time, unit='ms') > earliest_datetime].reset_index(drop=True)
    response_df.to_csv(save_path, index=False)
    print(f"Successfully saved to {save_path}!")

if __name__ == "__main__":
    main()