General Linear Models for Predicting Performance and Interventions (with
\>=9 filter)
================

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

## Predict Performance from Match, Length, and Functional Form

### Blicket classification accuracy

``` r
mBlicket <- glm(accuracy ~ match * has_phase_2 + is_d3,
             data = quizDT,
             family = binomial(link = "logit"), 
             weights = rep(9, nrow(quizDT))  # phase 3 has 9 block classification questions, i.e. 9 correct/incorrect trials
)
print.data.frame(getMetrics(mBlicket))
```

    ##                  rn Estimate Std. Error z value Pr(>|z|)
    ## 1       (Intercept)   0.2832     0.1073  2.6408   0.0083
    ## 2             match   0.3629     0.1384  2.6215   0.0088
    ## 3       has_phase_2  -0.0769     0.1334 -0.5763   0.5644
    ## 4             is_d3   0.3845     0.0964  3.9878   0.0001
    ## 5 match:has_phase_2  -0.0890     0.1931 -0.4607   0.6450

### **Filtered** blicket classification accuracy

``` r
fmBlicket <- glm(accuracy ~ match * has_phase_2 + is_d3,
                data = fquizDT,
                family = binomial(link = "logit"), 
                weights = rep(9, nrow(fquizDT))  # phase 3 has 9 block classification questions, i.e. 9 correct/incorrect trials
)
print.data.frame(getMetrics(fmBlicket))
```

    ##                  rn Estimate Std. Error z value Pr(>|z|)
    ## 1       (Intercept)   0.2761     0.1151  2.3994   0.0164
    ## 2             match   0.5080     0.1562  3.2527   0.0011
    ## 3       has_phase_2  -0.0507     0.1438 -0.3526   0.7244
    ## 4             is_d3   0.5105     0.1067  4.7841   0.0000
    ## 5 match:has_phase_2  -0.1951     0.2142 -0.9109   0.3623

### Activation prediction accuracy

``` r
mPred <- glm(total_points ~ match * has_phase_2 + is_d3,
             data = quizDT,
             family = binomial(link = "logit"), 
             weights = rep(7, nrow(quizDT))  # 7 prediction questions
)
print.data.frame(getMetrics(mPred))
```

    ##                  rn Estimate Std. Error z value Pr(>|z|)
    ## 1       (Intercept)   0.6133     0.1277  4.8044   0.0000
    ## 2             match   0.2043     0.1648  1.2399   0.2150
    ## 3       has_phase_2  -0.0981     0.1591 -0.6167   0.5374
    ## 4             is_d3   0.4269     0.1163  3.6715   0.0002
    ## 5 match:has_phase_2   0.2288     0.2332  0.9815   0.3264

### **Filtered** activation prediction accuracy

``` r
fmPred <- glm(total_points ~ match * has_phase_2 + is_d3,
             data = fquizDT,
             family = binomial(link = "logit"), 
             weights = rep(7, nrow(fquizDT))  # 7 prediction questions
)

print.data.frame(getMetrics(fmPred))
```

    ##                  rn Estimate Std. Error z value Pr(>|z|)
    ## 1       (Intercept)   0.5406     0.1361  3.9725   0.0001
    ## 2             match   0.4728     0.1872  2.5250   0.0116
    ## 3       has_phase_2  -0.0539     0.1701 -0.3171   0.7511
    ## 4             is_d3   0.5479     0.1296  4.2273   0.0000
    ## 5 match:has_phase_2   0.0688     0.2600  0.2646   0.7913

## Predict First Intervention from Length and Functional Form

``` r
mCombo <- glm(is_singleton ~ startswith_d * has_phase_2,
             data = taskDT,
             family = binomial(link = "logit")
)

print.data.frame(getMetrics(mCombo))
```

    ##                         rn Estimate Std. Error z value Pr(>|z|)
    ## 1              (Intercept)  -0.2048     0.2872 -0.7130   0.4758
    ## 2             startswith_d   0.6568     0.4005  1.6398   0.1010
    ## 3              has_phase_2  -1.6779     0.4971 -3.3756   0.0007
    ## 4 startswith_d:has_phase_2   3.4877     0.7388  4.7210   0.0000

``` r
fmCombo <- glm(is_singleton ~ startswith_d * has_phase_2,
             data = ftaskDT,
             family = binomial(link = "logit")
)

print.data.frame(getMetrics(fmCombo))
```

    ##                         rn Estimate Std. Error z value Pr(>|z|)
    ## 1              (Intercept)   0.0000     0.3015  0.0000   1.0000
    ## 2             startswith_d   0.9808     0.4533  2.1637   0.0305
    ## 3              has_phase_2  -1.6917     0.5100 -3.3171   0.0009
    ## 4 startswith_d:has_phase_2   3.1087     0.8046  3.8637   0.0001

## Predict Performance from First Intervention

``` r
# join quiz and tasks
joinedDT <- taskDT[quizDT, on="session_id", nomatch=0]
fjoinedDT <- ftaskDT[fquizDT, on="session_id", nomatch=0]
```

### Blicket classification accuracy:

``` r
mComboBlicket <- glm(accuracy ~ is_singleton*is_d3,
             data = joinedDT,
             family = binomial(link = "logit"),
             weights = rep(9, nrow(joinedDT))  # 9 block classifications
)

print.data.frame(getMetrics(mComboBlicket))
```

    ##                   rn Estimate Std. Error z value Pr(>|z|)
    ## 1        (Intercept)   0.3976     0.0992  4.0091   0.0001
    ## 2       is_singleton   0.0061     0.1363  0.0450   0.9641
    ## 3              is_d3   0.0814     0.1374  0.5927   0.5534
    ## 4 is_singleton:is_d3   0.6903     0.1960  3.5214   0.0004

### **Filtered** blicket classification accuracy:

``` r
fmComboBlicket <- glm(accuracy ~ is_singleton*is_d3,
             data = fjoinedDT,
             family = binomial(link = "logit"),
             weights = rep(9, nrow(fjoinedDT))  # 9 block classifications
)

print.data.frame(getMetrics(fmComboBlicket))
```

    ##                   rn Estimate Std. Error z value Pr(>|z|)
    ## 1        (Intercept)   0.4837     0.1128  4.2873   0.0000
    ## 2       is_singleton  -0.0800     0.1465 -0.5459   0.5851
    ## 3              is_d3   0.0592     0.1581  0.3744   0.7081
    ## 4 is_singleton:is_d3   0.8528     0.2157  3.9535   0.0001

### Activation Prediction Accuracy

``` r
mComboPred <- glm(total_points ~ is_singleton*is_d3,
             data = joinedDT,
             family = binomial(link = "logit"),
             weights = rep(7, nrow(joinedDT))  # 7 prediction questions
)

print.data.frame(getMetrics(mComboPred))
```

    ##                   rn Estimate Std. Error z value Pr(>|z|)
    ## 1        (Intercept)   0.6750     0.1166  5.7886   0.0000
    ## 2       is_singleton   0.0877     0.1613  0.5439   0.5865
    ## 3              is_d3   0.2013     0.1638  1.2288   0.2192
    ## 4 is_singleton:is_d3   0.5158     0.2363  2.1825   0.0291

### **Filtered** Activation Prediction Accuracy

``` r
fmComboPred <- glm(total_points ~ is_singleton*is_d3,
             data = fjoinedDT,
             family = binomial(link = "logit"),
             weights = rep(7, nrow(fjoinedDT))  # 7 prediction questions
)

print.data.frame(getMetrics(fmComboPred))
```

    ##                   rn Estimate Std. Error z value Pr(>|z|)
    ## 1        (Intercept)   0.7164     0.1323  5.4137   0.0000
    ## 2       is_singleton   0.0463     0.1730  0.2676   0.7890
    ## 3              is_d3   0.1999     0.1883  1.0615   0.2885
    ## 4 is_singleton:is_d3   0.6802     0.2610  2.6062   0.0092
