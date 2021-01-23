all: data vars plots stats paper

data:
	python save_sessions.py
	python save_quiz_design_matrix.py
	python save_task_design_matrix.py

vars:
	python calc_participation_vars.py
	python make_latex_vars.py

plots:
	python plot_blicket_metrics.py
	python plot_predictions.py
	python plot_interventions.py

stats:
	Rscript -e 'library(rmarkdown); rmarkdown::render("t_tests.Rmd", "rmarkdown::github_document")'
	Rscript -e 'library(rmarkdown); rmarkdown::render("glms.Rmd", "rmarkdown::github_document")'

paper:
	cd ../ignore/paper; latexmk -pdf -cd -outdir=./aux main