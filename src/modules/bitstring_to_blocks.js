export function getBlockCombos(bitstring_arr, block_arr) {
    // Derive and return an array of arrays of block objects from: an array of bit strings (representing block combinations) and an array of block objects.
    // In the returned array, each nested array of block objects is sorted by block id.

    // copy and sort by id such that the ith bit string matches the ith block in block_arr_copy
    let block_arr_copy = [...block_arr];
    block_arr_copy.sort((a, b) => a.id - b.id);

    let block_combos = [];  // array of arrays of (copied) block objects
    for (let i=0; i < bitstring_arr.length; i++) {
        let bitstring = bitstring_arr[i];
        let blocks = [];  // sorted by block id
        for (let j=0; j < bitstring.length; j++) {
            let block_obj_copy = Object.assign({}, block_arr_copy[j]);
            if (bitstring[j] === "1") {
                block_obj_copy.state = true;
            } else {
                block_obj_copy.state = false;
            }
            blocks.push(block_obj_copy);
        }
        block_combos.push(blocks);
    }

    return block_combos;
}