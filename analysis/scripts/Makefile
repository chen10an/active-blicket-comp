all: vars plots paper

vars:
	python calc_participation_vars.py
	python make_latex_vars.py

plots:
	python plot_blicket_metrics.py
	python plot_predictions.py

paper:
	cd ../ignore/paper; latexmk -pdf -cd -outdir=./aux main