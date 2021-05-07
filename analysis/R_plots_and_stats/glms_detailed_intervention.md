General Linear Models for Detailed First Intervention
================

This file considers the actual number of blocks, instead of just the
is\_singleton indicator, in the first phase 3 intervention.

## Imports and helper function

``` r
library(data.table)
library(magrittr)

getMetrics <- function (glmSumm) {
  metrics <- summary(glmSumm)$coefficients %>% as.data.table(keep.rownames = TRUE)
  metrics[, (2:ncol(metrics)) := lapply(.SD, function(x) round(x, 4)), .SDcols=2:ncol(metrics)]
  metrics
}

quizDT <- fread(file="../ignore/output/quiz_design_matrix.csv")
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")
taskDT <- fread(file = '../ignore/output/task_design_matrix.csv')
ftaskDT <- fread(file = '../ignore/output/f_task_design_matrix.csv')
```

## Predict First Intervention from Length and Functional Form

``` r
mCombo <- glm(first_num_blocks ~ startswith_d * has_phase_2,
             data = taskDT,
             family = gaussian()
)

print.data.frame(getMetrics(mCombo))
```

    ##                         rn Estimate Std. Error t value Pr(>|t|)
    ## 1              (Intercept)   2.5714     0.3406  7.5499   0.0000
    ## 2             startswith_d  -0.3677     0.4704 -0.7817   0.4353
    ## 3              has_phase_2   1.5984     0.4725  3.3829   0.0009
    ## 4 startswith_d:has_phase_2  -2.3681     0.6601 -3.5874   0.0004

``` r
fmCombo <- glm(first_num_blocks ~ startswith_d * has_phase_2,
             data = ftaskDT,
             family = gaussian()
)

print.data.frame(getMetrics(fmCombo))
```

    ##                         rn Estimate Std. Error t value Pr(>|t|)
    ## 1              (Intercept)   2.3571     0.3976  5.9285   0.0000
    ## 2             startswith_d  -0.8259     0.5444 -1.5170   0.1321
    ## 3              has_phase_2   1.7762     0.5528  3.2129   0.0017
    ## 4 startswith_d:has_phase_2  -1.9613     0.7837 -2.5026   0.0138

## Predict Performance from First Intervention

``` r
# join quiz and tasks
joinedDT <- taskDT[quizDT, on="session_id", nomatch=0]
fjoinedDT <- ftaskDT[fquizDT, on="session_id", nomatch=0]
```

### Blicket classification accuracy:

``` r
mComboBlicket <- glm(accuracy ~ first_num_blocks*is_d3,
             data = joinedDT,
             family = binomial(link = "logit"),
             weights = rep(9, nrow(joinedDT))  # 9 block classifications
)

print.data.frame(getMetrics(mComboBlicket))
```

    ##                       rn Estimate Std. Error z value Pr(>|z|)
    ## 1            (Intercept)   0.4592     0.0956  4.8024   0.0000
    ## 2       first_num_blocks  -0.0225     0.0258 -0.8734   0.3824
    ## 3                  is_d3   0.5926     0.1390  4.2641   0.0000
    ## 4 first_num_blocks:is_d3  -0.0634     0.0368 -1.7254   0.0844

### **Filtered** blicket classification accuracy:

``` r
fmComboBlicket <- glm(accuracy ~ first_num_blocks*is_d3,
             data = fjoinedDT,
             family = binomial(link = "logit"),
             weights = rep(9, nrow(fjoinedDT))  # 9 block classifications
)

print.data.frame(getMetrics(fmComboBlicket))
```

    ##                       rn Estimate Std. Error z value Pr(>|z|)
    ## 1            (Intercept)   0.6557     0.1343  4.8811   0.0000
    ## 2       first_num_blocks  -0.0318     0.0407 -0.7800   0.4354
    ## 3                  is_d3   1.0841     0.2020  5.3680   0.0000
    ## 4 first_num_blocks:is_d3  -0.1327     0.0558 -2.3789   0.0174

### Activation Prediction Accuracy

``` r
mComboPred <- glm(total_points ~ first_num_blocks*is_d3,
             data = joinedDT,
             family = binomial(link = "logit"),
             weights = rep(7, nrow(joinedDT))  # 7 prediction questions
)

print.data.frame(getMetrics(mComboPred))
```

    ##                       rn Estimate Std. Error z value Pr(>|z|)
    ## 1            (Intercept)   0.7629     0.1133  6.7358   0.0000
    ## 2       first_num_blocks  -0.0161     0.0304 -0.5289   0.5969
    ## 3                  is_d3   0.5655     0.1675  3.3764   0.0007
    ## 4 first_num_blocks:is_d3  -0.0433     0.0441 -0.9824   0.3259

### **Filtered** Activation Prediction Accuracy

``` r
fmComboPred <- glm(total_points ~ first_num_blocks*is_d3,
             data = fjoinedDT,
             family = binomial(link = "logit"),
             weights = rep(7, nrow(fjoinedDT))  # 7 prediction questions
)

print.data.frame(getMetrics(fmComboPred))
```

    ##                       rn Estimate Std. Error z value Pr(>|z|)
    ## 1            (Intercept)   0.9025     0.1572  5.7406   0.0000
    ## 2       first_num_blocks  -0.0601     0.0465 -1.2933   0.1959
    ## 3                  is_d3   0.6598     0.2325  2.8374   0.0045
    ## 4 first_num_blocks:is_d3  -0.0057     0.0657 -0.0867   0.9309
