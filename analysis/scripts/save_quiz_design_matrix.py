# %%
import pandas as pd
import pickle

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
SAVE_PATH = '../ignore/output/quiz_design_matrix.csv'
F_SAVE_PATH = '../ignore/output/f_quiz_design_matrix.csv'

with open('../ignore/output/filtered_sessions.pickle', 'rb') as f:
    filtered_sessions = pickle.load(f)

quiz_df = helperfuns.get_full_df(data_dir_path=DATA_DIR_PATH, data_type='quiz')

# %%
# filter to only level 3 and get blicket accuracy and total prediction points
design_df = quiz_df.loc[pd.IndexSlice[:, 3, :]][['accuracy', 'total_points']]

design_df['total_points'] = design_df['total_points'] / 7  # turn points into accuracy (max points is 7)

# match=1 when function in phase 3 matches with functions in previous phases
# match=0 when function in phase 3 does NOT match with functions in previous phases
design_df.loc[['d1_d2_d3', 'c1_c2_c3', 'd1_d3', 'c1_c3'], 'match'] = 1
design_df.loc[['d1_d2_c3', 'c1_c2_d3', 'd1_c3', 'c1_d3'], 'match'] = 0
assert set(design_df.match.unique()) == set([1, 0])  # check that all rows have been filled

# has_phase_2=1 when condition has all phases 1,2,3
# has_phase_2=0 when condition only has phases 1,3
design_df.loc[['d1_d2_d3', 'c1_c2_c3', 'd1_d2_c3', 'c1_c2_d3'], 'has_phase_2'] = 1
design_df.loc[['d1_d3', 'c1_c3', 'd1_c3', 'c1_d3'], 'has_phase_2'] = 0
assert set(design_df.has_phase_2.unique()) == set([1, 0])  # check that all rows have been filled

# is_d3=1 for disjunctive phase 3
# is_d3=0 for conjunctive phases 3
design_df.loc[['d1_d2_d3', 'c1_c2_d3', 'd1_d3', 'c1_d3'], 'is_d3'] = 1
design_df.loc[['c1_c2_c3', 'd1_d2_c3', 'c1_c3', 'd1_c3'], 'is_d3'] = 0
assert set(design_df.is_d3.unique()) == set([1, 0])  # check that all rows have been filled

# filtered version
f_design_df = design_df[design_df.index.get_level_values('session_id').isin(filtered_sessions)]

# %%
design_df.to_csv(SAVE_PATH)
print(f"Saved the full design matrix to {SAVE_PATH}!")

# %%

f_design_df.to_csv(F_SAVE_PATH)
print(f"Saved the filtered design matrix to {F_SAVE_PATH}!")
# %%
