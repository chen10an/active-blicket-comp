import pandas as pd
import re

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
WRITE_PATH = '../ignore/paper/my_vars.tex'

quiz_df = helperfuns.get_full_quiz_df(data_dir_path=DATA_DIR_PATH)

total_N = len(quiz_df.index.get_level_values('session_id').unique())
cond_df = quiz_df.reset_index().groupby('condition').session_id.nunique()
with open(WRITE_PATH, 'w') as f:
    # num participants: total and per condition
    f.write(f"\\newcommand{{\\totalN}}{{{total_N}}}\n")
    for index, val in cond_df.items():
        clean_command = re.sub('\d', '', index).replace('_', '')  # remove all underscores and numbers to create a valid latex command
        f.write(f"\\newcommand{{\{clean_command + 'N'}}}{{{val}}}\n")

    # TODO: calculate mean completion time from start and end data for filtered participants only
    f.write(f"\\newcommand{{\completionTime}}{{10-15min}}\n")

print(f"Saved all vars as custom latex commands in {WRITE_PATH}!")