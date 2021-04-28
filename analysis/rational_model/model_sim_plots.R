library(data.table)
library(magrittr)
library(rscala)
source("../R_plots_and_stats/plotting_helperfuns.R")
s <- scala(JARs = "~/projects/overhypo_learner/target/scala-2.13/active-overhypothesis-learner_2.13-0.0.0.jar")
s + '
import utils._
import learner._
'

MODELNAME <- "simpPragMarg-0.9"
PHASES <- c("d3")
s + '
// prior
val ss1 = SimpleSpace(0.9, Set("0", "1", "2").map(Block(_)), true)
val ss2 = SimpleSpace(0.9, Set("0", "1", "2", "3", "4", "5").map(Block(_)), true)
val ss3 = SimpleSpace(0.9, Set("0", "1", "2", "3", "4", "5", "6", "7", "8").map(Block(_)), true)

val p1Learner = new PhaseLearner(ss1.hypsDist) with structInfoGain
val p2Learner = new PhaseLearner(ss2.hypsDist) with structInfoGain
val p3Learner = new PhaseLearner(ss3.hypsDist) with structInfoGain

val d1sim = Simulator(p1Learner, Set("0").map(Block(_)), ss1.disj)
val c1sim = Simulator(p1Learner, Set("0", "1").map(Block(_)), ss1.conj)

val d2sim = Simulator(p2Learner, Set("0", "1", "2").map(Block(_)), ss2.disj)
val c2sim = Simulator(p2Learner, Set("0", "1", "2").map(Block(_)), ss2.conj)

val d3sim = Simulator(p3Learner, Set("0", "1", "2", "3").map(Block(_)), ss3.disj)
val c3sim = Simulator(p3Learner, Set("0", "1", "2", "3").map(Block(_)), ss3.conj)

var simResults = Array.empty[Array[(Event, Double)]]
var allBlocks = Set.empty[Block]
'

# check all phases are formatted correctly
stopifnot(all(grepl("[cd]{1}[123]{1}", PHASES)))

for (phase in PHASES) {
  simstring <- sprintf('
simResults = %ssim.run(30, 20)
allBlocks = ss%s.allBlocks
', phase, substr(phase, 2,2))
  
  print(simstring)
  
  s + simstring
  
  comboMat <- s * '
// intervention matrix
simResults.map(_.map(_._1.blocks.map(_.name).mkString(",")))
'
  comboDT <- data.table(comboMat)
  
  outcomeMat <- s * '
// corresponding outcome (T/F) matrix
simResults.map(_.map(_._1.outcome))
'
  
  simDT <- data.table(simID = numeric(),
                      nthIntervention = numeric(),
                      outcome = logical())
  allIdCols <- s * 'allBlocks.map("id_" + _.name).toArray'
  allIdCols <- sort(allIdCols)
  
  dtList <- list()
  counter <- 1
  for (simN in 1:nrow(comboMat)) {
    for (comboN in 1:ncol(comboMat)) {
      combo <- comboMat[simN, comboN]
      outcome <- outcomeMat[simN, comboN]
      
      onIdCols <- strsplit(combo, ",") %>% unlist()
      if (onIdCols[1] == "STOP") {
        break
      }
      
      rowDT <- data.table(simID = simN,
                          nthIntervention = comboN,
                          outcome = outcome)
      rowDT[, (allIdCols) := 0]
      onIdCols <- paste0("id_", onIdCols)
      rowDT[, (onIdCols) := 1]
      
      dtList[[counter]] <- rowDT
      counter <- counter + 1
    }
  }
  
  simDT <- rbindlist(dtList)
  simDT
  
  pbi <- 1
  pbmax <- length(unique(simDT$simID))
  pb <- txtProgressBar(min = 0, max = pbmax, style = 3)
  # save one plot per sim
  for (id in unique(simDT$simID)) {
    sessDT <- simDT[simID == id]
    
    # melt (wide to long) for plotting
    sessDT <- melt(sessDT, measure.vars = allIdCols, variable.name = "block_id", value.name = "block_state")
    
    p <- ggplot(data = sessDT, aes(x = nthIntervention, y = block_state, fill = outcome)) +
      geom_col(width = 0.1) +
      scale_fill_brewer(palette = "Dark2", direction = -1) +
      facet_grid("block_id ~ .") +
      theme_pubr() +
      theme(panel.spacing = unit(0, "lines"),
            axis.text.y=element_blank(),
            axis.ticks.y=element_blank())
    
    # TODO: indicate space/prior, phase and form
    save_plot(sprintf("model_intervention_plots/%s/%s/%s_%s.png", MODELNAME, phase, phase, id), plot = p, base_width = 3, base_height = 2)
    
    setTxtProgressBar(pb, pbi)
    pbi <- pbi + 1
  }
  close(pb)
  
}
