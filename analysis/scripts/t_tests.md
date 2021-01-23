Unequal Variance Two-Group T-Tests for Performance
================

## Imports and helper function

``` r
library(data.table)
library(magrittr)

quizDT <- fread(file="../ignore/output/quiz_design_matrix.csv")
fquizDT <- fread(file="../ignore/output/f_quiz_design_matrix.csv")

pairs <- list(c('c1_c2_d3', 'd1_d2_d3'), c('c1_d3', 'd1_d3'), c('d1_d2_c3', 'c1_c2_c3'), c('d1_c3', 'c1_c3'))

compare <- function (DT, col) {
  tVals <- c()
  pVals <- c()
  isSignificant <- c()
  for (pair in pairs) {
    mismatched <- DT[condition == pair[1]]
    matched <- DT[condition == pair[2]]
    test <- t.test(mismatched[[col]], matched[[col]], alternative = "two.sided", paired = FALSE, var.equal = FALSE)
    
    tVals <- c(tVals, test$statistic)
    pVals <- c(pVals, test$p.value)
    isSignificant <- c(isSignificant, test$p.value <= 0.05)
  }
  
  data.table(
    pair=sapply(pairs, function (vec) paste(vec, collapse = " <> ")),
    t=tVals,
    p=pVals,
    isSignificant=isSignificant
  )
}
```

## Blicket Accuracy Comparisons

### Full data set

``` r
compare(quizDT, "accuracy")
```

    ##                    pair          t          p isSignificant
    ## 1: c1_c2_d3 <> d1_d2_d3 -2.0019552 0.05097915         FALSE
    ## 2:       c1_d3 <> d1_d3 -1.8019321 0.07761558         FALSE
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.3429994 0.73319372         FALSE
    ## 4:       d1_c3 <> c1_c3 -1.3923400 0.17025701         FALSE

### Filtered data set

``` r
compare(fquizDT, "accuracy")
```

    ##                    pair         t           p isSignificant
    ## 1: c1_c2_d3 <> d1_d2_d3 -3.033162 0.005664762          TRUE
    ## 2:       c1_d3 <> d1_d3 -2.264591 0.031774350          TRUE
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.395912 0.696257881         FALSE
    ## 4:       d1_c3 <> c1_c3 -1.890094 0.071981579         FALSE

## Activation Prediction Accuracy Comparisons

### Full data set

``` r
compare(quizDT, "total_points")
```

    ##                    pair          t          p isSignificant
    ## 1: c1_c2_d3 <> d1_d2_d3 -3.0374279 0.00378581          TRUE
    ## 2:       c1_d3 <> d1_d3 -1.4464876 0.15396207         FALSE
    ## 3: d1_d2_c3 <> c1_c2_c3 -0.6997004 0.48784866         FALSE
    ## 4:       d1_c3 <> c1_c3  0.1238760 0.90193100         FALSE

### Filtered data set

``` r
compare(fquizDT, "total_points")
```

    ##                    pair          t           p isSignificant
    ## 1: c1_c2_d3 <> d1_d2_d3 -2.8505283 0.008350881          TRUE
    ## 2:       c1_d3 <> d1_d3 -1.4631135 0.152896686         FALSE
    ## 3: d1_d2_c3 <> c1_c2_c3  0.2550646 0.801215651         FALSE
    ## 4:       d1_c3 <> c1_c3 -0.1850895 0.854895129         FALSE
