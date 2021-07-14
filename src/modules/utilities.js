export function roundMoney(x) {
    // round a monetary value to a consistent number of decimal places (2) for avoiding precision errors and for displaying to the participant
    // returns a string
    
    if (typeof x !== "number") {
        throw new Error("The input should be a number.")
    }

    return x.toFixed(2);
}

export function removePrecError(x) {
    // remove precision error from a number by rounding it to a string and then converting back to a number
    // returns a number

    if (typeof x !== "number") {
        throw new Error("The input should be a number.")
    }

    return +(x).toFixed(5);   // unary + to turn string back to number to shave off unnecessary decimals
}
