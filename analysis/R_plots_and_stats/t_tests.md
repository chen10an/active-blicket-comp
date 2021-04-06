Unequal Variance Two-Group T-Tests for Performance
================

## Imports and helper function

``` r
library(data.table)
library(magrittr)

quizDT <- fread(file="../ignore/output/quiz_design_matrix.csv")
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")
taskDT <- fread(file = '../ignore/output/task_design_matrix.csv')
ftaskDT <- fread(file = '../ignore/output/f_task_design_matrix.csv')

# join quiz and tasks
joinedDT <- taskDT[quizDT, on="session_id", nomatch=0]
fjoinedDT <- ftaskDT[fquizDT, on="session_id", nomatch=0]

compare <- function (DT, col) {
  pairs <- list(c('c1_c2_d3', 'd1_d2_d3'), c('c1_d3', 'd1_d3'), c('d1_d2_c3', 'c1_c2_c3'), c('d1_c3', 'c1_c3'))
  
  tVals <- c()
  dfs <- c()
  pVals <- c()
  isSignificant <- c()
  mismatchedMean <- c()
  mismatchedSD <- c()
  matchedMean <- c()
  matchedSD <- c()
  for (pair in pairs) {
    mismatched <- DT[condition == pair[1]]
    matched <- DT[condition == pair[2]]
    test <- t.test(mismatched[[col]], matched[[col]], alternative = "two.sided", paired = FALSE, var.equal = FALSE)
    
    tVals <- c(tVals, test$statistic)
    dfs <- c(dfs, test$parameter[["df"]])
    
    pVals <- c(pVals, test$p.value)
    isSignificant <- c(isSignificant, test$p.value <= 0.05)
    
    mismatchedMean <- c(mismatchedMean, mean(mismatched[[col]]))
    mismatchedSD <- c(mismatchedSD, sd(mismatched[[col]]))
    
    matchedMean <- c(matchedMean, mean(matched[[col]]))
    matchedSD <- c(matchedSD, sd(matched[[col]]))
  }
  
  data.table(
    pair=sapply(pairs, function (vec) paste(vec, collapse = " <> ")),
    tVals=round(tVals, 2),
    dfs=round(dfs, 2),
    pVals=round(pVals, 3),
    isSignificant=isSignificant,
    mismatchedMean=round(mismatchedMean, 2),
    mismatchedSD=round(mismatchedSD, 2),
    matchedMean=round(matchedMean, 2),
    matchedSD=round(matchedSD, 2)
  )
}
```

## Blicket Accuracy Comparisons

### Full data set

``` r
compare(quizDT, "accuracy")
```

    ##                    pair tVals   dfs pVals isSignificant mismatchedMean
    ## 1: c1_c2_d3 <> d1_d2_d3 -2.00 47.82 0.051         FALSE           0.61
    ## 2:       c1_d3 <> d1_d3 -1.80 49.76 0.078         FALSE           0.66
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.34 45.07 0.733         FALSE           0.59
    ## 4:       d1_c3 <> c1_c3 -1.39 47.85 0.170         FALSE           0.57
    ##    mismatchedSD matchedMean matchedSD
    ## 1:         0.17        0.71      0.22
    ## 2:         0.25        0.77      0.21
    ## 3:         0.13        0.61      0.17
    ## 4:         0.11        0.62      0.12

### Filtered data set

``` r
compare(fquizDT, "accuracy")
```

    ##                    pair tVals   dfs pVals isSignificant mismatchedMean
    ## 1: c1_c2_d3 <> d1_d2_d3 -3.03 24.43 0.006          TRUE           0.64
    ## 2:       c1_d3 <> d1_d3 -2.26 27.01 0.032          TRUE           0.74
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.40 20.51 0.696         FALSE           0.63
    ## 4:       d1_c3 <> c1_c3 -1.89 22.02 0.072         FALSE           0.59
    ##    mismatchedSD matchedMean matchedSD
    ## 1:         0.20        0.88      0.22
    ## 2:         0.25        0.90      0.16
    ## 3:         0.18        0.67      0.24
    ## 4:         0.15        0.70      0.14

## Activation Prediction Accuracy Comparisons

### Full data set

``` r
compare(quizDT, "total_points")
```

    ##                    pair tVals   dfs pVals isSignificant mismatchedMean
    ## 1: c1_c2_d3 <> d1_d2_d3 -3.04 50.00 0.004          TRUE           0.70
    ## 2:       c1_d3 <> d1_d3 -1.45 52.70 0.154         FALSE           0.70
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.70 43.39 0.488         FALSE           0.65
    ## 4:       d1_c3 <> c1_c3  0.12 47.97 0.902         FALSE           0.69
    ##    mismatchedSD matchedMean matchedSD
    ## 1:         0.15        0.84      0.19
    ## 2:         0.21        0.79      0.22
    ## 3:         0.11        0.67      0.15
    ## 4:         0.16        0.68      0.16

### Filtered data set

``` r
compare(fquizDT, "total_points")
```

    ##                    pair tVals   dfs pVals isSignificant mismatchedMean
    ## 1: c1_c2_d3 <> d1_d2_d3 -2.85 26.47 0.008          TRUE           0.74
    ## 2:       c1_d3 <> d1_d3 -1.46 33.00 0.153         FALSE           0.75
    ## 3: d1_d2_c3 <> c1_c2_c3  0.26 20.49 0.801         FALSE           0.69
    ## 4:       d1_c3 <> c1_c3 -0.19 21.48 0.855         FALSE           0.67
    ##    mismatchedSD matchedMean matchedSD
    ## 1:         0.15        0.89      0.14
    ## 2:         0.20        0.85      0.21
    ## 3:         0.11        0.68      0.15
    ## 4:         0.20        0.69      0.20

## First intervention after conjunctive training has more blocks than after disjunctive training

``` r
t.test(joinedDT[startswith_d==0]$first_num_blocks, joinedDT[startswith_d==1]$first_num_blocks, alternative = "two.sided")
```

    ## 
    ##  Welch Two Sample t-test
    ## 
    ## data:  joinedDT[startswith_d == 0]$first_num_blocks and joinedDT[startswith_d == 1]$first_num_blocks
    ## t = 4.6172, df = 183.39, p-value = 7.299e-06
    ## alternative hypothesis: true difference in means is not equal to 0
    ## 95 percent confidence interval:
    ##  0.9045777 2.2544841
    ## sample estimates:
    ## mean of x mean of y 
    ##  3.401961  1.822430

``` r
t.test(fjoinedDT[startswith_d==0]$first_num_blocks, fjoinedDT[startswith_d==1]$first_num_blocks, alternative = "two.sided")
```

    ## 
    ##  Welch Two Sample t-test
    ## 
    ## data:  fjoinedDT[startswith_d == 0]$first_num_blocks and fjoinedDT[startswith_d == 1]$first_num_blocks
    ## t = 4.514, df = 91.432, p-value = 1.891e-05
    ## alternative hypothesis: true difference in means is not equal to 0
    ## 95 percent confidence interval:
    ##  1.023404 2.631769
    ## sample estimates:
    ## mean of x mean of y 
    ##  3.275862  1.448276
