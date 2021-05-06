library(ggplot2)
library(ggthemes)
library(ggsci)
library(ggpubr)
library(RColorBrewer)
library(cowplot)
library(ggbeeswarm)

myColors <- brewer.pal(n = 8, "Dark2")[2:3]
myGreen <- brewer.pal(n = 8, "Dark2")[1]

theme_mine <- function() {
  theme_few() %+replace%
    theme(
      # plot
      plot.margin = margin(0.1, 0.1, 0.1, 0.1, unit = "cm"),
      plot.title = element_text(size=12, , margin = margin(0, 0, 0.1, 0, unit = "cm"), hjust = 0),
      # axes
      axis.text=element_text(size=9),
      axis.title=element_text(size=10),
      # legend
      legend.position = "bottom",
      legend.direction = "horizontal",
      legend.key.size= unit(0.75, "cm"),
      legend.margin = margin(t = 0, r = 0, b = 0, l = 0, unit = "pt"),
      legend.title = element_text(size=10),
      legend.text = element_text(size=10),
      # grid lines
      panel.grid.major.x = element_blank(),
      panel.grid.major.y = element_line( size=.3, color="light gray") 
    )
}

getOverallCms <- function(patchworkPlot) {
  # return the overall dimensions (in cm) of a patchwork plot that can be used in ggsave
  # code from: https://github.com/thomasp85/patchwork/issues/127
  
  gtab <- patchwork:::plot_table(patchworkPlot, 'auto')
  overall_width <- grid::convertWidth(sum(gtab$widths) + unit(1, "cm"), unitTo = "cm", valueOnly = TRUE)
  overall_height <- grid::convertHeight(sum(gtab$heights) + unit(2, "cm"), unitTo = "cm", valueOnly = TRUE)  # 2 vertical cm to make space for overall patch title
  
  c(overall_width, overall_height)
}

# reverse a visible range of blues
# myBlues = brewer.pal(n = 9, "Blues")[3:7] %>% rev()
# scale_colour_manual(values=myBlues)
