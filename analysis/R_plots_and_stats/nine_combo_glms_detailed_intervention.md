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
fquizDT <- fread(file="../ignore/output/nine_combo_quiz_design_matrix.csv")
taskDT <- fread(file = '../ignore/output/task_design_matrix.csv')
ftaskDT <- fread(file = '../ignore/output/nine_combo_task_design_matrix.csv')
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
mCombo$df.residual
```

    ## [1] 205

``` r
fmCombo <- glm(first_num_blocks ~ startswith_d * has_phase_2,
             data = ftaskDT,
             family = gaussian()
)

print.data.frame(getMetrics(fmCombo))
```

    ##                         rn Estimate Std. Error t value Pr(>|t|)
    ## 1              (Intercept)   2.3636     0.3398  6.9554   0.0000
    ## 2             startswith_d  -0.4773     0.4806 -0.9931   0.3220
    ## 3              has_phase_2   1.7475     0.4779  3.6565   0.0003
    ## 4 startswith_d:has_phase_2  -2.3213     0.6706 -3.4615   0.0007

``` r
fmCombo$df.residual
```

    ## [1] 177

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
    ## 1            (Intercept)   0.4611     0.0995  4.6340   0.0000
    ## 2       first_num_blocks  -0.0104     0.0289 -0.3599   0.7189
    ## 3                  is_d3   0.7323     0.1493  4.9042   0.0000
    ## 4 first_num_blocks:is_d3  -0.0840     0.0415 -2.0238   0.0430

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
    ## 1            (Intercept)   0.7142     0.1179  6.0586   0.0000
    ## 2       first_num_blocks   0.0125     0.0348  0.3588   0.7198
    ## 3                  is_d3   0.7757     0.1810  4.2851   0.0000
    ## 4 first_num_blocks:is_d3  -0.0885     0.0502 -1.7624   0.0780
