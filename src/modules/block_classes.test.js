import {Block, BlockGetter, Combo} from "./block_classes.js"

const COLORS = ["color0", "color1", "color2", "color3", "color4", "color5", "color6", "color7", "color8"];

describe("BlockGetter", () => {
    let getter = new BlockGetter(COLORS);
    
    let blocks_0 = getter.get(0);
    expect(blocks_0.length).toBe(0);  // should be empty array

    let blocks_1 = getter.get(3);
    let blocks_2 = getter.get(6);
    let blocks_3 = getter.get(9);

    it("should assign IDs within the range [prev_largest_id + 1, prev_largest_id + 1 + num_blocks)", () => {
        expect(blocks_1.map(block => block.id).sort((a, b) => a - b)).toStrictEqual([0, 1, 2]);

        expect(blocks_2.map(block => block.id).sort((a, b) => a - b)).toStrictEqual([3, 4, 5, 6, 7, 8]);

        expect(blocks_3.map(block => block.id).sort((a, b) => a - b)).toStrictEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    });

    it("should assign letters alphabetically starting from where it left off from the previous call to get()", () => {
        expect(blocks_1.map(block => block.letter)).toStrictEqual(["A", "B", "C"]);
        
        expect(blocks_2.map(block => block.letter)).toStrictEqual(["D", "E", "F", "G", "H", "I"]);

        expect(blocks_3.map(block => block.letter)).toStrictEqual(["J", "K", "L", "M", "N", "O", "P", "Q", "R"]);
    });

    it("should assign colors without repetition when there are enough unused colors left since the previous get()", () => {
        for (const block of blocks_1) {
            expect(blocks_2.map(block => block.color)).not.toContain(block.color);
        }

        expect([...blocks_1, ...blocks_2].map(block => block.color).sort()).toStrictEqual(COLORS);
    });

    it("should assign colors with repetition when there are **not** enough unused colors left since the previous get()", () => {
        for (const block of blocks_2) {
            expect(blocks_3.map(block => block.color)).toContain(block.color);
        }

        expect(blocks_3.map(block => block.color).sort()).toStrictEqual(COLORS);
    });

    it("should error out when we request more blocks than total colors", () => {
        expect(() => getter.get(10)).toThrow(Error);
    });

    it("should assign positions in the same order as the blocks are created", () => {
        expect(blocks_1.map(block => block.position)).toStrictEqual([0, 1, 2]);
        
        expect(blocks_2.map(block => block.position)).toStrictEqual([0, 1, 2, 3, 4, 5]);

        expect(blocks_3.map(block => block.position)).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });
});

describe("Combo's set_block_states method", () => {
    let blocks = [
        new Block(2, false, "color0", "A", 0),
        new Block(1, false, "color1", "B", 1),
        new Block(0, false, "color2", "C", 2)
    ];

    let threebit_combos = [new Combo("000"), new Combo("001"), new Combo("010"), new Combo("011"), new Combo("100"), new Combo("101"), new Combo("110"), new Combo("111")];

    let expected_threebit_blocks = [
        [new Block(0, false, "color2", "C", 2), new Block(1, false, "color1", "B", 1), new Block(2, false, "color0", "A", 0)],
        [new Block(0, false, "color2", "C", 2), new Block(1, false, "color1", "B", 1), new Block(2, true, "color0", "A", 0)],
        [new Block(0, false, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, false, "color0", "A", 0)],
        [new Block(0, false, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, true, "color0", "A", 0)],
        [new Block(0, true, "color2", "C", 2), new Block(1, false, "color1", "B", 1), new Block(2, false, "color0", "A", 0)],
        [new Block(0, true, "color2", "C", 2), new Block(1, false, "color1", "B", 1), new Block(2, true, "color0", "A", 0)],
        [new Block(0, true, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, false, "color0", "A", 0)],
        [new Block(0, true, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, true, "color0", "A", 0)]
    ]

    let more_blocks = [new Block(4, false, "color3", "D", 3), new Block(3, false, "color4", "E", 4)];
    let morebit_combos = [new Combo("0110"), new Combo("01110")];
    let expected_morebit_blocks = [
        // note that only the relative order of IDs should matter
        [new Block(0, false, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, true, "color0", "A", 0), new Block(4, false, "color3", "D", 3)],
        [new Block(0, false, "color2", "C", 2), new Block(1, true, "color1", "B", 1), new Block(2, true, "color0", "A", 0), new Block(3, true, "color4", "E", 4), new Block(4, false, "color3", "D", 3)],
    ];

    it("should return an array of blocks sorted by their IDs", () => {
        expect(threebit_combos[0].set_block_states(blocks).map(block => block.id)).toStrictEqual([0, 1, 2]);
    });

    it("should return a deep copy of the input block array", () => {
        let ret_blocks = threebit_combos[0].set_block_states(blocks);
        let expected_blocks = expected_threebit_blocks[0];

        for (let i=0; i < expected_blocks.length; i++) {
            expect(ret_blocks[i]).toStrictEqual(expected_blocks[i]);  // same value

            expect(ret_blocks[i]).not.toBe(expected_blocks[i]);  // different reference
        }
    });

    it("should flip block states correctly wrt the bitstring", () => {
        // test 3 bits
        for (let i=0; i < threebit_combos.length; i++) {
            let ret_blocks = threebit_combos[i].set_block_states(blocks);
            let expected_blocks = expected_threebit_blocks[i];

            expect(ret_blocks).toStrictEqual(expected_blocks);
        }

        // test 4 and 5 bits
        for (let i=0; i < morebit_combos.length; i++) {
            blocks.push(more_blocks[i]);
            let ret_blocks = morebit_combos[i].set_block_states(blocks);
            let expected_blocks = expected_morebit_blocks[i];

            expect(ret_blocks).toStrictEqual(expected_blocks);
        }
    });
})
