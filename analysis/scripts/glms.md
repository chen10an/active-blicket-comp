General Linear Models for Predicting Performance and Interventions
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
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")
taskDT <- fread(file = '../ignore/output/task_design_matrix.csv')
ftaskDT <- fread(file = '../ignore/output/f_task_design_matrix.csv')
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
    ## 1       (Intercept)   0.3378     0.1468  2.3005   0.0214
    ## 2             match   0.7990     0.2088  3.8273   0.0001
    ## 3       has_phase_2  -0.1706     0.1809 -0.9435   0.3454
    ## 4             is_d3   0.7164     0.1427  5.0203   0.0000
    ## 5 match:has_phase_2  -0.0503     0.2936 -0.1713   0.8640

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
    ## 1       (Intercept)   0.5926     0.1713  3.4591   0.0005
    ## 2             match   0.3582     0.2305  1.5543   0.1201
    ## 3       has_phase_2   0.0024     0.2153  0.0110   0.9912
    ## 4             is_d3   0.6283     0.1646  3.8164   0.0001
    ## 5 match:has_phase_2   0.0649     0.3342  0.1943   0.8459

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
    ## 1              (Intercept)   0.0000     0.3780  0.0000   1.0000
    ## 2             startswith_d   1.4663     0.5899  2.4857   0.0129
    ## 3              has_phase_2  -2.6391     0.8238 -3.2037   0.0014
    ## 4 startswith_d:has_phase_2   3.6576     1.1939  3.0636   0.0022

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
    ## 1        (Intercept)   0.6669     0.1615  4.1290   0.0000
    ## 2       is_singleton  -0.1312     0.2037 -0.6441   0.5195
    ## 3              is_d3  -0.0059     0.2051 -0.0287   0.9771
    ## 4 is_singleton:is_d3   1.6155     0.3021  5.3469   0.0000

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
    ## 1        (Intercept)   0.7044     0.1843  3.8225   0.0001
    ## 2       is_singleton   0.1015     0.2357  0.4306   0.6668
    ## 3              is_d3   0.4003     0.2421  1.6535   0.0982
    ## 4 is_singleton:is_d3   0.4889     0.3337  1.4650   0.1429
