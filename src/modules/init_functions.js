const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // letters used for labeling blocks

// color variable names from public/global.css
const BLOCK_COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];
const COOL_COLORS = ["cool0", "cool1", "cool2", "cool3", "cool4", "cool5", "cool6", "cool7", "cool8"];
const WARM_COLORS = ["warm0", "warm1", "warm2", "warm3", "warm4", "warm5", "warm6", "warm7", "warm8"];

function get_rand_features(available_colors, num_blocks) {
    // Randomly initialize n blocks from the input list of available colors, where n=num_blocks
    // Returns an array of block objects with color and letter properties

    let arr = [];  // array of feature objects, which are initialized below
    for (let i=0; i < num_blocks; i++) {
        // randomly assign colors without replacement
        let color_dex = Math.floor(Math.random() * available_colors.length);
        let color = available_colors[color_dex];
        available_colors = available_colors.filter(c => c !== color);  // remove the selected color

        arr.push({
            color: color,  // random
            letter: ALPHABET.charAt(i)  // determined by order of initialization
        });
    }

    return arr;
}

function init_block_dict() {
    // Initialize with blocks for the introductory instructions page and for the captcha
    let dict = {
        intro:
        [{id: -1, state: false, color: "color0", letter: "A"},
        {id: -2, state: false, color: "color1", letter: "B"},
        {id: -3, state: false, color: "color5", letter: "C"}],
    };

    // TODO: ensure at least one warm block and one cool block
    let captcha_blocks = get_rand_features([...WARM_COLORS, ...COOL_COLORS], 9);
    for (let i=0; i < captcha_blocks.length; i++) {
        captcha_blocks[i].state = false;
        captcha_blocks[i].id = -11 - i;
    }

    dict["captcha"] = captcha_blocks;
    return dict;
}

function init_available_features() {
    return get_rand_features([...BLOCK_COLORS], 9);
}

function init_available_ids() {
    return [...Array(BLOCK_COLORS.length).keys()];
}

export {init_block_dict, init_available_features, init_available_ids};