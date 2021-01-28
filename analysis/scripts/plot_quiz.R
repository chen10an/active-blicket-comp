library(data.table)
library(magrittr)

source("plotting_helperfuns.R")

quizDT <- fread(file="../ignore/output/quiz_design_matrix.csv")
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")

# combine (rowwise) full and filtered data sets for the sake of plotting
quizDT[, is_filtered := 0]
fquizDT[, is_filtered := 1]
allQuizDT <- rbind(quizDT, fquizDT)

# make factors
allQuizDT[, is_filtered := factor(is_filtered, levels = c(0, 1))]
allQuizDT[, is_d3 := factor(is_d3, levels = c(1, 0))]

# standard error
se <- function(x) sd(x)/sqrt(length(x))
# calculate mean and standard error used in plot
summDT <- allQuizDT[, .(total_points = mean(total_points), se_total_points = se(total_points), accuracy = mean(accuracy), se_accuracy = se(accuracy)), by=.(match, is_d3, has_phase_2, is_filtered)]

# names for faceting on has_phase_2
facetLabs <- c("Short", "Long")
names(facetLabs) <- c("0", "1")

plotLine <- function(col) {
  se_col <- paste("se", col, sep = "_")
  col <- sym(col)
  se_col <- sym(se_col)
  # for passing col names as a string contained in a variable, see https://stackoverflow.com/questions/22309285/how-to-use-a-variable-to-specify-column-name-in-ggplot
  
  # plotting params
  dodge <- position_dodge(width = 0.5)
  
  # line plot with error bars, grouped by d3 vs c3, short (no phase 2) vs long, full vs filtered data
  p <- ggplot(summDT,aes(x = match, y = !!col, color = is_d3, linetype = is_filtered)) +
    geom_line(position = dodge) +
    scale_linetype_manual(values=c(1,5), name = "Data", labels = c("Full", "Filtered")) +
    geom_point(size=2, position = dodge) +
    geom_errorbar(aes(ymin = !!col-!!se_col, ymax = !!col+!!se_col), position = dodge, width = 0.2) +
    facet_grid(. ~ has_phase_2, labeller = labeller(has_phase_2 = facetLabs)) +
    geom_hline(yintercept=0.5, linetype="dotted", color = myGreen, size = 1) +  # chance level
    scale_x_continuous(breaks = c(0,1), name = "Match of Functional Form", labels = c("Different", "Same")) +
    ylim(0.5, 1) +
    ylab("Accuracy") +
    scale_colour_manual(values=myColors, name = "Phase 3 Function", labels = c("D3", "C3"))+
    theme_mine()
  
  p
}

predPlot <- plotLine("total_points") + ggtitle("Activation Prediction")
blicketPlot <- plotLine("accuracy") + ggtitle("Blicket Classification")

finalPlot <- blicketPlot + predPlot + 
  plot_layout(guides='collect', widths = unit(9, 'cm'), heights = unit(4, 'cm')) + 
  plot_annotation(tag_levels = 'a', title = "Match of Functional Form and Performance in Phase 3") & 
  theme(legend.position='bottom', plot.tag = element_text(face = 'bold'))

finalPlot

overallDims <- getOverallCms(finalPlot)

ggsave(filename = '../ignore/paper/imgs/patched_quiz.pdf', plot = finalPlot, width = overallDims[1], height = overallDims[2], units = "cm")

# Violin Variant -----
# temp <- copy(allQuizDT)
# temp[, match := as.factor(match)]
# tempSummDT <- temp[, .(total_points = mean(total_points), se_total_points = se(total_points)), by=.(match, is_d3, has_phase_2, is_filtered)]
# 
# dodge <- position_dodge(width = 1)
# ggplot(temp, aes(x = match, y = total_points, color = is_d3, linetype = is_filtered)) + 
#   facet_grid(. ~ has_phase_2) +
#   geom_violin(position = dodge, adjust = 0.5) +
#   geom_point(data = tempSummDT, size=2, position = dodge) +
#   geom_errorbar(data = tempSummDT, aes(ymin = total_points-se_total_points, ymax = total_points+se_total_points), position = dodge, width = 0.2) +
#   scale_colour_manual(values=myColors)+
#   theme_mine()
