// code adapted from https://dev.to/pixeline/how-to-deploy-a-sapper-pwa-on-github-pages-47lc

var ghpages = require('gh-pages');

ghpages.publish(
    'public',
    {
        branch: 'gh-pages',
        repo: 'https://github.com/chen10an/active-blicket-comp.git'
    },
    () => {
        console.log('Deploy Complete!')
    }
)