library(data.table)
library(magrittr)

source("plotting_helperfuns.R")

quizDT <- fread(file="../ignore/output/quiz_design_matrix.csv")
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")
taskDT <- fread(file = '../ignore/output/task_design_matrix.csv')
ftaskDT <- fread(file = '../ignore/output/f_task_design_matrix.csv')

joinedDT <- copy(taskDT[quizDT, on="session_id", nomatch=0])
fjoinedDT <- copy(ftaskDT[fquizDT, on="session_id", nomatch=0])

# combine (rowwise) full and filtered data sets for the sake of plotting
taskDT[, is_filtered := 0]
ftaskDT[, is_filtered := 1]
allTaskDT <- rbind(ftaskDT, taskDT)

joinedDT[, is_filtered := 0]
fjoinedDT[, is_filtered := 1]
allJoinedDT <- rbind(fjoinedDT, joinedDT)

# Number of Blocks in the First Intervention (Phase 3) -----

# set orders
allTaskDT[, is_filtered := factor(is_filtered, levels = c(0, 1))]
allTaskDT[, startswith := factor(startswith, levels = c("c1_c2", "c1", "d1", "d1_d2"))]
allTaskDT[, startswith_d := factor(startswith_d, levels = c(0, 1))]

numBlocksPlot <- ggplot(allTaskDT,aes(x = startswith, y = first_num_blocks, fill = is_filtered, shape = is_filtered)) +
  geom_boxplot(outlier.shape=NA) + 
  geom_point(position=position_jitterdodge(jitter.width=0.5), size=1) +
  scale_shape_manual(values=c(16,1)) +
  scale_y_continuous(breaks = round(seq(min(allTaskDT$first_num_blocks), max(allTaskDT$first_num_blocks), by = 1), 1)) +
  scale_x_discrete(labels = c("C1 C2", "C1", "D1", "D1 D2")) +
  # scale_color_grey(start = 0, end = 0.5) +
  scale_fill_brewer(palette = "Paired", direction = -1, name = "Data", labels = c("Full", "Filtered")) +
  xlab("Preceding Phases") +
  ylab("Number of Blocks") +
  guides(shape = FALSE) +
  ggtitle("First Intervention in Phase 3") +
  theme_mine()

numBlocksPlot

# Performance (Y) vs. First Intervention (X) -----

# set orders
allJoinedDT[, is_filtered := factor(is_filtered, levels = c(0, 1))]
allJoinedDT[, is_d3 := factor(is_d3, levels = c(1, 0))]

# standard error
se <- function(x) sd(x)/sqrt(length(x))
# calculate mean and standard error used in plot
summDT <- allJoinedDT[, .(total_points = mean(total_points), se_total_points = se(total_points), accuracy = mean(accuracy), se_accuracy = se(accuracy)), by=.(is_singleton, is_d3, is_filtered)]

plotLine <- function(col) {
  se_col <- paste("se", col, sep = "_")
  col <- sym(col)
  se_col <- sym(se_col)
  # for passing col names as a string contained in a variable, see https://stackoverflow.com/questions/22309285/how-to-use-a-variable-to-specify-column-name-in-ggplot
  
  # plotting params
  dodge <- position_dodge(width = 0.5)

  # line plot with error bars, grouped by d3 vs c3 and full vs filtered data
  p <- ggplot(summDT, aes(x = is_singleton, y = !!col, color = is_d3, linetype = is_filtered)) +
  geom_line(position = dodge) +
  scale_linetype_manual(values=c(1,5), name = "Data", labels = c("Full", "Filtered")) +
  geom_point(size=2, position = dodge) +
  geom_errorbar(aes(ymin = !!col-!!se_col, ymax = !!col+!!se_col), position = dodge, width = 0.2) +
  geom_hline(yintercept=0.5, linetype="dotted", color = myGreen, size = 1) +  # chance level
  scale_x_continuous(breaks = c(0, 1), labels=c(">= 2 Blocks", "1 Block"), trans = "reverse") +
  ylim(0.5, 1) +
  scale_colour_manual(values=myColors, name = "Phase 3\nFunction", labels = c("D3", "C3")) +
  xlab("First intervention in Phase 3") +
  ylab("Accuracy") +
  theme_mine()
  
  p
}

blicketPlot <- plotLine("accuracy") + ggtitle("Blicket Classification") + theme(plot.title = element_text(size=11))
predPlot <- plotLine("total_points") + ggtitle("Activation Prediction") + theme(plot.title = element_text(size=11))
numBlocksPlot <- numBlocksPlot

finalPlot <- numBlocksPlot + 
  (blicketPlot / predPlot + plot_layout(guides='collect') & theme(legend.position='right', legend.direction = "vertical", legend.title.align = 0)) + 
  plot_layout(widths = unit(c(14, 4), c('cm', 'cm')), heights = unit(8, "cm")) + 
  plot_annotation(tag_levels = 'a', title = "Interventions and Performance in Phase 3") & theme(plot.tag = element_text(face = 'bold'))

finalPlot

overallDims <- getOverallCms(finalPlot)

ggsave(filename = '../ignore/paper/imgs/patched_interventions.pdf', plot = finalPlot, width = overallDims[1], height = overallDims[2], units = "cm")

# Box Plot Variant of Accuracy Plot ---
# accPlot <- ggplot(allJoinedDT,aes(x = is_singleton, y = accuracy, color = is_d3, linetype = is_filtered)) +
#   geom_boxplot(outlier.shape=NA) +
#   scale_linetype_manual(values=c(1,5)) +
#   # geom_point(position=position_jitterdodge(jitter.width=0.1), size=1) +
#   # scale_shape_manual(values=c(16,1)) +
#   scale_colour_manual(values=myColors)+
#   theme_mine()
# accPlot

