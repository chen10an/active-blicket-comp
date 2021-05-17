library(data.table)
library(magrittr)
library(ggplot2)
library(cowplot)
source("../R_plots_and_stats/plotting_helperfuns.R")

CSVPATH <- "cache/p1_sigStruct-5-0.1-100-0.1.csv"
phaseDT <- fread(CSVPATH)
filename <- sub("\\.csv", "", basename(CSVPATH))
savePrefix <- sprintf("human_intervention_plots/%s/", filename)
if (!dir.exists(savePrefix)) {
  dir.create(savePrefix)
}

# TODO: scale height of graph for different phases
# TODO: if I make outcome into a factor maybe both T/F will be used for fill color even when only one is present in the individual's data

# rename cols
cols <- colnames(phaseDT)
old_cols <- cols[grep("id_", cols)]
new_cols <- gsub("id_", "", old_cols)
setnames(phaseDT, old_cols, new_cols)

pbmax <- length(unique(phaseDT$session_id))
pbi <- 1
pb <- txtProgressBar(min = 0, max = pbmax, style = 3)
# save one plot per participant
for (sess in unique(phaseDT$session_id)) {
  sessDT <- phaseDT[session_id == sess]
  # melt (wide to long) for plotting
  sessDT <- melt(sessDT, measure.vars = new_cols, variable.name = "block_id", value.name = "block_state")
  
  blockP <- ggplot(data = sessDT, aes(x = nthIntervention, y = block_state, fill = outcome)) +
    geom_col(width = 0.1) +
    scale_fill_manual(values=c(myGray, myGreen), name = "Activated", labels = c("N", "Y")) +
    facet_grid("block_id ~ .", switch = "y") +
    scale_x_continuous(breaks = seq(0, max(sessDT$nthIntervention), by = 2)) +
    xlab(NULL) +
    ylab("Block ID") +
    theme_mine() +
    theme(panel.spacing = unit(0, "lines"),
          axis.text.y=element_blank(),
          axis.ticks.y=element_blank(),
          panel.grid.major.y = element_blank(),
          panel.border = element_blank(),
          axis.line = element_line(),
          axis.line.y.right = element_line(),
          strip.background = element_rect(colour = "black"),
          legend.position = "top")
  
  rankP <- ggplot(data = sessDT, aes(x = nthIntervention, y = rank)) +
    geom_hline(yintercept=1, color = brewer.pal(8, "Dark2")[6], size = 0.7) +
    geom_line(size = 0.7) +
    geom_ribbon(aes(ymin = max_rank, ymax = max(max_rank)), alpha = 0.3, outline.type = "lower") +
    scale_y_continuous(breaks = seq(0, max(sessDT$max_rank), by = 10), trans = "reverse") +
    scale_x_continuous(breaks = seq(0, max(sessDT$nthIntervention), by = 2)) +
    xlab("Nth Intervention") +
    ylab("Rank") +
    theme_mine()
  
  finalPlot <- plot_grid(blockP, rankP, align = 'v', axis = 'l', ncol = 1, rel_heights = c(0.7, 0.3))
  
  # save both pdf and svg
  save_plot(paste0(savePrefix, sprintf("%s_%s.pdf", unique(sessDT$phase), sess)), plot = finalPlot, base_width = 5, base_height = 3)
  save_plot(paste0(savePrefix, sprintf("%s_%s.svg", unique(sessDT$phase), sess)), plot = finalPlot, base_width = 5, base_height = 3)
  
  setTxtProgressBar(pb, pbi)
  pbi <- pbi + 1
}
close(pb)

# testing code -----
# get a participant for testing
# testSess <-
#   # "VXxVPVzjS9RYGBmbcYTNcQULE8P3IqLB"
#   # "e35owOBQ990vuvJ5DoL6LdwzJ7nquuhu"
#   "0kTJAISnHfG9jyOiEwBe62pKv0FBDUjZ"
# 
# sessDT <- phaseDT[session_id == testSess]
#
# melt (wide to long) for plotting
# cols <- colnames(phaseDT)
# old_cols <- cols[grep("id_", cols)]
# new_cols <- gsub("id_", "", old_cols)
# setnames(sessDT, old_cols, new_cols)
# sessDT <- melt(sessDT, measure.vars = new_cols, variable.name = "block_id", value.name = "block_state")
# 
# blockP <- ggplot(data = sessDT, aes(x = nthIntervention, y = block_state, fill = outcome)) +
#   geom_col(width = 0.1) +
#   scale_fill_manual(values=c(myGray, myGreen)) +
#   facet_grid("block_id ~ .", switch = "y") +
#   scale_x_continuous(breaks = seq(0, max(sessDT$nthIntervention), by = 2)) +
#   xlab(NULL) +
#   ylab("Block ID") +
#   theme_mine() +
#   theme(panel.spacing = unit(0, "lines"),
#         axis.text.y=element_blank(),
#         axis.ticks.y=element_blank(),
#         panel.grid.major.y = element_blank(),
#         panel.border = element_blank(),
#         axis.line = element_line(),
#         axis.line.y.right = element_line(),
#         strip.background = element_rect(colour = "black"),
#         legend.position = "top")
# blockP
# 
# rankP <- ggplot(data = sessDT, aes(x = nthIntervention, y = rank)) +
#   geom_hline(yintercept=1, color = brewer.pal(8, "Dark2")[6]) +
#   geom_line(size = 1) +
#   geom_ribbon(aes(ymin = max_rank, ymax = max(max_rank)), alpha = 0.3, outline.type = "lower") +
#   scale_y_continuous(breaks = seq(0, max(sessDT$max_rank), by = 5), trans = "reverse") +
#   scale_x_continuous(breaks = seq(0, max(sessDT$nthIntervention), by = 2)) +
#   xlab("Nth Intervention") +
#   theme_mine()
# rankP
# 
# finalPlot <- plot_grid(blockP, rankP, align = 'v', axis = 'l', ncol = 1, rel_heights = c(0.7, 0.3))