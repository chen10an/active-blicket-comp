library(data.table)
library(magrittr)
library(ggplot2)
library(rscala)
source("../R_plots_and_stats/plotting_helperfuns.R")

# featDT <- fread("p1_features.csv")
CSVPATH <- "cache/p2_sigStruct-5-0.1-100-0.1.csv"

featDT <- fread(CSVPATH)
filename <- sub("\\.csv", "", basename(CSVPATH))
savePrefix <- sprintf("mean_rank_plots/%s_mean_rank", filename)
block_cols <- grep("id_", colnames(featDT), value = TRUE)
featDT[, num_blocks := rowSums(.SD), .SDcols = block_cols]

se <- function(x) sd(x, na.rm = TRUE)/sqrt(length(x))
summDT <- featDT[, .(rank_mean = mean(rank, na.rm = TRUE), 
                      rank_se = se(rank),
                      max_rank_mean = mean(max_rank, na.rm = TRUE), 
                      max_rank_se = se(max_rank),
                      prior_entropy_mean = mean(prior_entropy, na.rm = TRUE),
                      prior_entropy_se = se(prior_entropy),
                      num_blocks_mean = mean(num_blocks, na.rm = TRUE),
                      num_blocks_se = se(num_blocks),
                      N = .N),
                  by=c("nthIntervention", "phase")]
# set order such that dx comes before cx
summDT[, phase := factor(phase, levels = sort(unique(phase), decreasing = TRUE))]

# mean rank trend
meanRankP <- ggplot(data = summDT, aes(x = nthIntervention, y = rank_mean, color=phase)) +
  geom_errorbar(aes(ymin = rank_mean-rank_se, ymax = rank_mean+rank_se)) +
  geom_point(aes(size = N)) +
  geom_hline(yintercept=1, color = myGreen) +
  geom_ribbon(aes(ymin = max_rank_mean, ymax = max(summDT$max_rank_mean)), alpha = 0.3, outline.type = "lower") +
  scale_colour_manual(values=myColors, name = "Form", labels = c("D", "C")) +
  xlab("Nth Intervention") +
  ylab("Mean Rank") +
  scale_y_continuous(breaks = seq(1, max(summDT$max_rank_mean), by = 1), trans = "reverse") +
  theme_mine() +
  theme(legend.position = "right", legend.direction = "vertical")
meanRankP

# save both pdf and svg
save_plot(filename = paste0(savePrefix, ".pdf"), plot = meanRankP, base_height = 3, base_width = 5)
save_plot(filename = paste0(savePrefix, ".svg"), plot = meanRankP, base_height = 3, base_width = 5)

# Other summary plots -----
# # hist: y=num participants, x=num phase 1 intervention
# featDT[, .N, by=session_id]$N %>% hist()
# 
# featDT %>% {
#   ggplot(data=. ,aes(x = factor(nthIntervention), y = rank, fill=phase)) +
#     # ideal info maximizing intervention rank is constant at 1
#     geom_hline(yintercept=1, color = "red") +
#     # geom_boxplot(outlier.shape=NA) +
#     geom_violin() +
#     geom_jitter(size=0.5) +
#     scale_y_reverse()
# }
# 
# featDT %>% {
#   ggplot(data=. ,aes(x = factor(nthIntervention), y = num_blocks, fill=phase)) +
#     # geom_boxplot(outlier.shape=NA) +
#     geom_violin() +
#     geom_jitter(size=0.5)
# }
# 
# # mean entropy trend
# ggplot(data = summDT, aes(x = nthIntervention, y = prior_entropy_mean, color=phase)) +
#   geom_point(aes(size = N)) +
#   geom_errorbar(aes(ymin = prior_entropy_mean-prior_entropy_se, ymax = prior_entropy_mean+prior_entropy_se))
# 
# # mean num blocks trend
# ggplot(data = summDT, aes(x = nthIntervention, y = num_blocks_mean,color=phase)) +
#   geom_point(aes(size = N)) +
#   geom_errorbar(aes(ymin = num_blocks_mean-num_blocks_se, ymax = num_blocks_mean+num_blocks_se))