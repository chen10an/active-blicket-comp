library(data.table)
library(magrittr)
library(ggplot2)
library(rscala)
s <- scala(JARs = "~/projects/overhypo_learner/target/scala-2.13/active-overhypothesis-learner_2.13-0.0.0.jar")
s + '
import utils._
import learner._
'

SAVEFILE <- "cache/p2_sigStruct-5-0.1-100-0.1.csv"
PHASE <- 2
PRIORSTR <- 'PriorMaker.makeSigmoidPrior(bgToP, blocksMap(phaseNum), false)'
LEARNERSTR <- "new PhaseLearner(makePrior(phaseNum)) with structInfoGain"

grid <- fread("cache/bias-shape=5-scale=0.1_gain-shape=100-scale=0.1_grid.csv")
# create a lookup table for the joint gamma densities of biases and gains
s + 'var bgToP = Map.empty[(Double, Double),Double]'
s(grid = as.matrix(grid)) * '
bgToP = grid.map(arr => (arr(0), arr(1)) -> arr(2)).toMap
'

phaseDT <- list(fread(file = '../ignore/output/interventions1.csv'),
                fread(file = '../ignore/output/interventions2.csv'),
                fread(file = '../ignore/output/interventions3.csv'))
for (i in 1:length(phaseDT)) {
  phaseDT[[i]]$timestamp = as.POSIXct(phaseDT[[i]]$timestamp/1000, origin="1970-01-01") 
  phaseDT[[i]][, nthIntervention := rowid(session_id)]
}

s + '
val blocksMap = Map[Int, Set[Block]](
 1 -> Set("0", "1", "2").map(Block(_)),
 2 -> Set("0", "1", "2", "3", "4", "5").map(Block(_)),
 3 -> Set("0", "1", "2", "3", "4", "5", "6", "7", "8").map(Block(_))
)

val disj = Fform("disj", (n: Int) => if(n >= 1) 1.0 else 0.0)
val conj = Fform("conj", (n: Int) => if(n >= 2) 1.0 else 0.0)
'

s + sprintf('
def makePrior(phaseNum: Int) = {
  %s
}
', PRIORSTR)

s + sprintf('
def makeLearner(phaseNum: Int) = {
  %s
}
', LEARNERSTR)

s + sprintf('
val learner = makeLearner(%s)
', PHASE)

s + '
// vars for updating in place
var currentCombo: Set[Block] = Set.empty[Block]
var currentOutcome: Boolean = false
var eventsVec: Vector[Event] = Vector.empty[Event]
var currentLearner = learner

// handle R vector with one element (scala string) vs multiple elements (scala array)
def ensureArr(v: Any): Array[String] = v match {
  case v: Array[String] => v
  case v: String => Array(v)
}
'

addFeatures <- function(dt) {
  # reset vars
  s * '
  currentCombo = Set.empty[Block]
  currentOutcome = false
  eventsVec = Vector.empty[Event]
  currentLearner = learner
  '
  
  eventsDT <- copy(dt)
  eventsDT[, c("rank", "prior_entropy", "max_rank") := list(numeric(), numeric(), numeric())]
  for (i in 1:nrow(eventsDT)) {
    row = eventsDT[i]
    # the index-1 corresponds to the block id
    combo <- (which(row[, .(id_0, id_1, id_2)] == 1) - 1) %>% as.character()
    outcome <- row[, .(outcome)][[1]] %>% as.logical()
    
    res <- s(combo = combo, outcome = outcome) * '
    val comboArr = ensureArr(combo)
  
    // mutate/update global vars
    currentCombo = comboArr.toSet.map(Block(_))
    currentOutcome = outcome
  
    Array(currentLearner.hypsDist.entropy, currentLearner.comboRanks(currentCombo).toDouble, currentLearner.comboRanks.values.max.toDouble)
    '
    prior_entropy <- res[1]
    rank <- res[2] %>% as.integer()
    max_rank <- res[3] %>% as.integer()
    
    set(eventsDT, i=i, j='prior_entropy',  value=prior_entropy)
    set(eventsDT, i=i, j='rank',  value=rank)
    set(eventsDT, i=i, j='max_rank',  value=max_rank)
    
    # TODO: optimize so that update only uses one combo
    s * '
    // update global vector of events and update the learner
    eventsVec = eventsVec :+ Event(currentCombo, currentOutcome)
    currentLearner = learner.update(eventsVec)
    '
  }
  
  eventsDT
}

# get a participant for testing
testSess <- 
  # "VXxVPVzjS9RYGBmbcYTNcQULE8P3IqLB"
  # "e35owOBQ990vuvJ5DoL6LdwzJ7nquuhu"
  "0kTJAISnHfG9jyOiEwBe62pKv0FBDUjZ"

# progress bar based on https://stackoverflow.com/questions/38129223/progress-bar-in-data-table-aggregate-action
pb <- txtProgressBar(min = 0, max = length(unique(phaseDT[[PHASE]]$session_id)), style = 3)

# add features for every participant (uniquely identified by session_id)
featDT <- phaseDT[[PHASE]][, {setTxtProgressBar(pb, .GRP); addFeatures(.SD)}, by = session_id]  # (add session_id == testSess to test single participant)
close(pb)

# SAVE!!!
fwrite(featDT, file = SAVEFILE)
print(sprintf("Saved to %s!", SAVEFILE))