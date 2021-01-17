import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import helperfuns

DATA_DIR_PATH ='../ignore/data/'
SAVE_PATH = '../ignore/paper/imgs/blicket_metrics.pdf'

quiz_df = helperfuns.get_full_quiz_df(data_dir_path=DATA_DIR_PATH)

f, axs = plt.subplots(3, 2, sharey=True, figsize=(7, 7))
groups = [['c1_c2_c3', 'c1_c3', 'd1_d2_c3', 'd1_c3'], ['d1_d2_d3', 'd1_d3', 'c1_c2_d3', 'c1_d3']]
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
f.savefig(SAVE_PATH)
print(f"Saved to {SAVE_PATH}!")