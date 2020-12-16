class Block {
    constructor(id, state, color, letter) {
        this.id = id;
        this.state = state;
        this.color = color;
        this.letter = letter;
    }

    on() {
        this.state = true;
    }

    off() {
        this.state = false;
    }

    flip() {
        // reverse the state
        this.state = !this.state;
    }
};

// TODO: add position on grid as a property
class BlockGetter {
    // In a single instance of BlockGetter, each call to `get` dynamically gives out an array of blocks where:
    // the first N available integers are randomly assigned as block IDs without repetition,
    // available letters are alphabetically assigned without repetition,
    // available colors are randomly assigned with the possibility of repeating colors when there are not enough remaining colors

    constructor(available_colors) {
        this.available_colors = available_colors;

        // store the initial list of colors so that they can be reused when we don't have enough
        this.init_available_colors = available_colors;

        // track which integer ids are available
        this.used_ids_lessthan = 0;

        // start with the entire alphabet as the available letters
        this.available_letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    }

    get(num_blocks) {
        if (this.available_letters.length < num_blocks) {
            throw new Error(`Not enough remaining letters (${this.available_letters.length}) to create ${num_blocks} more blocks.`)
        } else if (this.init_available_colors.length < num_blocks){
            throw new Error(`Not enough total colors (${this.init_available_colors.length}) to create ${num_blocks} more blocks.`)
        }

        if (this.available_colors.length < num_blocks) {
            // reset the available colors to the initial full set of available colors
            this.available_colors = this.init_available_colors;
        }

        // initialize an array of block objects to be returned
        let blocks = [];

        // get the first N available integers as block ids, where N=num_blocks
        let id_arr = [...Array(num_blocks).keys()].map(x => x+this.used_ids_lessthan);
        this.used_ids_lessthan += num_blocks;
        for (let i=0; i < num_blocks; i++) {
            // randomly assign the ids in id_arr without replacement
            // this id corresponds to the relative argument position for the detector's `activation` function
            let id_dex = Math.floor(Math.random() * id_arr.length);
            let id = id_arr[id_dex];
            id_arr = id_arr.filter(x => x !== id);  // remove the selected id

            // randomly assign a color
            let color_dex = Math.floor(Math.random() * this.available_colors.length);
            let color = this.available_colors[color_dex];
            this.available_colors = this.available_colors.filter(c => c !== color);  // remove the selected color

            blocks.push(new Block(
                id,  // random id
                false,  // init state to false
                color,  // random color
                this.available_letters.shift()  // pop letter from the front
            ));
        }

        return blocks;
    }
};

class Combo {
    // Represent a combination as a bitstring with a timestamp, where the ith bit corresponds to the ith block from an array of blocks sorted by id

    constructor(bitstring) {
        if (typeof bitstring !== "string") {
            throw new Error("The input should be a bit-**string**.")
        }

        this.bitstring = bitstring;
        this.timestamp = Date.now();
    }

    set_block_states(blocks) {
        // Return a sorted (by ID) copy of the input blocks array where each block's state is set according to the bitstring

        if (!Array.isArray(blocks)) {
            throw new Error("Input should be an array of block objects.")
        }

        if (blocks.length !== this.bitstring.length) {
            throw new Error(`The length of the input block array (${blocks.length}) should be the same as the number of bits in this combo's bitstring (${this.bitstring.length}).`)
        }

        // (shallow) copy and sort by id such that the ith bit matches the ith block in blocks_copy
        let blocks_copy = [...blocks];
        blocks_copy.sort((a, b) => a.id - b.id);

        let ret_blocks = []  // sorted by id
        for (let i=0; i < this.bitstring.length; i++) {
            // deep copy
            let block_obj_copy = Object.assign(Object.create(Object.getPrototypeOf(blocks_copy[i])), blocks_copy[i]);
            if (this.bitstring[i] === "1") {
                block_obj_copy.on();
            } else {
                block_obj_copy.off();
            }
            ret_blocks.push(block_obj_copy);
        }

        return ret_blocks;
    }
}

export {Block, BlockGetter, Combo}