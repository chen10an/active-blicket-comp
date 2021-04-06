import json

WRITE_PATH ='../ignore/paper/my_vars.tex'
MY_VARS_PATH = '../ignore/output/my_vars.json'

with open(MY_VARS_PATH) as f:
    my_vars = json.load(f)

with open(WRITE_PATH, 'w') as f:
    # num participants: total and per condition
    for index, val in my_vars.items():
        f.write(f"\\newcommand{{\{index}}}{{{val}}}\n")

print(f"Saved all vars from {MY_VARS_PATH} as custom latex commands in {WRITE_PATH}!")