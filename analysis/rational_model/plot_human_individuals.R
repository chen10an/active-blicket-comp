library(data.table)
library(magrittr)
library(ggplot2)
library(cowplot)
source("../R_plots_and_stats/plotting_helperfuns.R")

phaseDT <- list(fread(file = '../ignore/output/interventions1.csv'),
                fread(file = '../ignore/output/interventions2.csv'),
                fread(file = '../ignore/output/interventions3.csv'))
for (i in 1:length(phaseDT)) {
 phaseDT[[i]]$timestamp = as.POSIXct(phaseDT[[i]]$timestamp/1000, origin="1970-01-01") 
 phaseDT[[i]][, nthIntervention := rowid(session_id)]
}

phaseDT[[2]][, max(nthIntervention), by=session_id]$V1 %>% hist()

# TODO: scale height of graph for different phases
# TODO: if I make outcome into a factor maybe both T/F will be used for fill color even when only one is present in the individual's data

# for each phase, save one plot per participant -----
for (i in 1:length(phaseDT)) {
  pbmax <- length(unique(phaseDT[[i]]$session_id))
  pbi <- 1
  pb <- txtProgressBar(min = 0, max = pbmax, style = 3)

  # get block id cols
  cols <-colnames(phaseDT[[i]])
  block_id_cols <- cols[grep("id_", cols)]

  # save one plot per participant
  for (sess in unique(phaseDT[[i]]$session_id)) {
    sessDT <- phaseDT[[i]][session_id == sess]

    # melt (wide to long) for plotting
    sessDT <- melt(sessDT, measure.vars = block_id_cols, variable.name = "block_id", value.name = "block_state")

    p <- ggplot(data = sessDT, aes(x = nthIntervention, y = block_state, fill = outcome)) +
      geom_col(width = 0.1) +
      scale_fill_brewer(palette = "Dark2", direction = -1) +
      facet_grid("block_id ~ .") +
      theme_pubr() +
      theme(panel.spacing = unit(0, "lines"),
            axis.text.y=element_blank(),
            axis.ticks.y=element_blank())

    save_plot(sprintf("human_intervention_plots/p%i_individuals/%s_%s.png", i, unique(sessDT$phase), sess), plot = p, base_width = 3, base_height = 2)

    setTxtProgressBar(pb, pbi)
    pbi <- pbi + 1
  }
  close(pb)
}

# testing code -----
# get a participant for testing
# testSess <-
#   # "VXxVPVzjS9RYGBmbcYTNcQULE8P3IqLB"
#   # "e35owOBQ990vuvJ5DoL6LdwzJ7nquuhu"
#   "0kTJAISnHfG9jyOiEwBe62pKv0FBDUjZ"
# 
# sessDT <- phaseDT[[1]][session_id == testSess]
# 
# # melt (wide to long) for plotting
# cols <-colnames(phaseDT[[i]])
# old_cols <- cols[grep("id_", cols)]
# new_cols <- gsub("id_", "", old_cols)
# setnames(sessDT, old_cols, new_cols)
# sessDT <- melt(sessDT, measure.vars = new_cols, variable.name = "block_id", value.name = "block_state")
# 
# p <- ggplot(data = sessDT, aes(x = nthIntervention, y = block_state, fill = outcome)) +
#   geom_col(width = 0.1) +
#   scale_fill_manual(values=c("gray50", myGreen)) +
#   facet_grid("block_id ~ .", switch = "y") +
#   # scale_x_continuous(breaks = seq(0, max(sessDT$nthIntervention), by = 5)) +
#   xlab("Nth Intervention") +
#   ylab("Block ID") +
#   theme_mine() +
#   theme(panel.spacing = unit(0, "lines"),
#         axis.text.y=element_blank(),
#         axis.ticks.y=element_blank(),
#         panel.grid.major.y = element_blank(),
#         panel.border = element_blank(),
#         axis.line = element_line(),
#         axis.line.y.right = element_line(),
#         strip.background = element_rect(colour = "black"))
# p
