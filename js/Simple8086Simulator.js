"use strict";
// 8086 Processor
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var R8 = ["AL", "CL", "DL", "BL", "AH", "CH", "DH", "BH"];
var R16 = ["AX", "CX", "DX", "BX", "SP", "BP", "SI", "DI"];
var R32 = ["EAX", "ECX", "EDX", "EBX", "ESP", "EBP", "ESI", "EDI"];
var MOD = ["11", "00"];
var LABELS = [];
var MACHINECODES = [];
function checkRegisters(register) {
    if (R8.includes(register)) {
        return { size: 8, index: R8.indexOf(register) };
    }
    else if (R16.includes(register)) {
        return { size: 16, index: R16.indexOf(register) };
    }
    else if (R32.includes(register)) {
        return { size: 32, index: R32.indexOf(register) };
    }
    else {
        throw new Error('Invalid register');
    }
}
function decToBin(number) {
    var value = number.toString(2);
    while (value.length < 3) {
        value = "0" + value;
    }
    return value.slice(-3);
}
function addBlock(reg1, src) {
    var regInfo1 = checkRegisters(reg1);
    var machineCode = [];
    // If src is an immediate value, use the immediate opcode.
    if (/^[0-9A-F]+H$/i.test(src)) {
        // The src is an immediate value, handle it appropriately.
        var immediateValue = src.replace('H', '');
        // Ensure the immediate value is the correct length (zero-padded if necessary)
        while (immediateValue.length < (regInfo1.size / 4))
            immediateValue = "0" + immediateValue;
        // Use different opcodes depending on the size of the destination register
        var opcode = regInfo1.size === 8 ? "0x80" : "0x81"; // 0x83 for 8-bit sign-extended
        machineCode.push(opcode);
        // The ModR/M byte for a register and an immediate value is different,
        // here assuming the register is the destination (e.g., 11000reg)
        var modRM = "11" + "000" + decToBin(regInfo1.index);
        machineCode.push("0x" + parseInt(modRM, 2).toString(16));
        // Add immediate value to machine code (little-endian for x86)
        for (var i = 0; i < regInfo1.size; i += 8) {
            machineCode.push("0x" + immediateValue.substring(immediateValue.length - (i + 2), immediateValue.length - i));
        }
    }
    else {
        // The src is a register, proceed as before
        var regInfo2 = checkRegisters(src);
        if (regInfo1.size !== regInfo2.size) {
            return ["Arguments must be of the same size"];
        }
        var binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        var decValue = parseInt(binaryValue, 2).toString(16);
        var opcode = regInfo1.size === 8 ? "0x00" : "0x01";
        machineCode.push(opcode, "0x" + decValue);
    }
    return machineCode;
}
function subBlock(reg1, src) {
    var regInfo1 = checkRegisters(reg1);
    var machineCode = [];
    if (/^[0-9A-F]+H$/i.test(src)) {
        // src is an immediate value
        // ... Handle immediate value
    }
    else {
        // src is a register
        var regInfo2 = checkRegisters(src);
        if (regInfo1.size !== regInfo2.size) {
            return ["Arguments must be of the same size"];
        }
        var opcode = regInfo1.size === 8 ? "0x28" : "0x29";
        machineCode.push(opcode);
        var binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        var decValue = parseInt(binaryValue, 2).toString(16);
        machineCode.push("0x" + decValue);
    }
    return machineCode;
}
function andBlock(reg1, reg2) {
    var opcodes = ["0x20", "0x21", "0x22", "0x23"];
    var regInfo1 = checkRegisters(reg1);
    var regInfo2 = checkRegisters(reg2);
    if (regInfo1.size !== regInfo2.size) {
        return ["Arguments must be of the same size"];
    }
    var binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
    var decValue = parseInt(binaryValue, 2).toString(16);
    switch (regInfo1.size) {
        case 8:
            return [opcodes[0], "0x" + decValue];
        case 16:
            return ["0x66", opcodes[1], "0x" + decValue];
        case 32:
            return [opcodes[1], "0x" + decValue];
        default:
            return ["Invalid register size"];
    }
}
function orBlock(reg1, src) {
    var opcodes = ["0x08", "0x09", "0x0A", "0x0B"];
    var regInfo1 = checkRegisters(reg1);
    var machineCode = [];
    if (typeof src === 'string' && !src.endsWith("H")) {
        var regInfo2 = void 0;
        try {
            regInfo2 = checkRegisters(src);
        }
        catch (e) {
            return ["Invalid source register or immediate value"];
        }
        if (regInfo1.size !== regInfo2.size) {
            return ["Source and destination registers must be the same size"];
        }
        var binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        var decValue = parseInt(binaryValue, 2).toString(16);
        switch (regInfo1.size) {
            case 8:
                machineCode = [opcodes[0], "0x" + decValue];
                break;
            case 16:
                machineCode = ["0x66", opcodes[1], "0x" + decValue];
                break;
            case 32:
                machineCode = [opcodes[1], "0x" + decValue];
                break;
            default:
                return ["Invalid register size"];
        }
    }
    else {
    }
    return machineCode;
}
var opcodes = {
    regToReg: "0x89",
    immToReg: {
        8: "0xB0",
        16: "0xB8",
        32: "0xB8"
    }
};
function movBlock(dest, src) {
    var destRegInfo = checkRegisters(dest);
    var machineCode = [];
    if (/^[0-9A-F]+H$/i.test(src)) {
        var immValue = src.replace('H', '');
        while (immValue.length < (destRegInfo.size / 4))
            immValue = "0" + immValue;
        machineCode.push(opcodes.immToReg[destRegInfo.size]);
        for (var i = immValue.length; i > 0; i -= 2) {
            machineCode.push("0x" + immValue.substring(i - 2, i));
        }
    }
    else {
        var srcRegInfo = void 0;
        try {
            srcRegInfo = checkRegisters(src);
        }
        catch (e) {
            return ["Invalid source register"];
        }
        if (destRegInfo.size !== srcRegInfo.size) {
            return ["Source and destination registers must be the same size"];
        }
        machineCode.push(opcodes.regToReg);
        var modRM = "11" + decToBin(srcRegInfo.index) + decToBin(destRegInfo.index);
        machineCode.push("0x" + parseInt(modRM, 2).toString(16));
    }
    return machineCode;
}
function assembler(instruction, counter) {
    var command = instruction[0].toUpperCase();
    var machineCode;
    switch (command) {
        case "MOV":
            machineCode = movBlock(instruction[1], instruction[2]);
            break;
        case "ADD":
            machineCode = addBlock(instruction[1], instruction[2]);
            break;
        case "SUB":
            machineCode = subBlock(instruction[1], instruction[2]);
            break;
        case "AND":
            machineCode = andBlock(instruction[1], instruction[2]);
            break;
        case "OR":
            machineCode = orBlock(instruction[1], instruction[2]);
            break;
        default:
            console.log("Invalid instruction:", instruction);
            return;
    }
    if (machineCode.length > 0) {
        machineCodeHandler(machineCode, counter);
    }
}
function machineCodeHandler(token, counter) {
    if (counter >= COUNTER.length) {
        // Expand the COUNTER array if needed
        COUNTER = __spreadArray(__spreadArray([], COUNTER, true), new Array(10).fill(0), true); // Add 10 more slots, for example
    }
    var mem = COUNTER[counter].toString(16).padStart(4, '0');
    var newCode = __spreadArray([mem], token, true);
    MACHINECODES.push(newCode);
    // Update the next counter value safely
    COUNTER[counter + 1] = (COUNTER[counter] + token.length) || 0;
}
var exampleInstructions = [
    ["MOV", "AX", "BEEFH"], // Move immediate value to AX
    ["MOV", "CL", "DL"], // Move value from DL to CL
    ["MOV", "BH", "00C0H"], // Move immediate value to BH
    ["ADD", "SI", "DI"], // Add DI to SI
    ["OR", "SP", "BP"], // Logical OR SP with BP
    ["AND", "CH", "DH"], // Logical AND CH with DH
    ["SUB", "EAX", "EBX"], // Subtract EBX from EAX
    ["ADD", "AL", "10H"], // Add immediate value to AL
    ["OR", "DX", "1234H"], // Logical OR DX with immediate value
    ["SUB", "BL", "20H"], // Subtract immediate value from BL
    ["AND", "ECX", "EDX"], // Logical AND ECX with EDX
    ["MOV", "DI", "0FF00H"], // Move immediate value to DI
    ["ADD", "BH", "AL"], // Add AL to BH
];
var COUNTER = new Array(exampleInstructions.length).fill(0);
// Processing the instructions
exampleInstructions.forEach(function (instruction, index) {
    assembler(instruction, index);
});
COUNTER = [0];
MACHINECODES = [];
exampleInstructions.forEach(function (instruction, index) {
    assembler(instruction, index);
});
console.log("Machine Codes:", MACHINECODES);
console.log("Counter:", COUNTER);
var Processor8086 = /** @class */ (function () {
    function Processor8086() {
        this.registers = {}; // A mapping of register names to their values
        // Initialize the registers
        this.reset();
    }
    Processor8086.prototype.start = function () {
        console.log('Simulation started');
        // Initialization logic for starting the simulation
    };
    Processor8086.prototype.step = function () {
        console.log('Stepped through an instruction');
        // Logic for stepping through one instruction
    };
    Processor8086.prototype.reset = function () {
        var _this = this;
        // Reset all registers to 0
        R8.concat(R16, R32).forEach(function (reg) {
            _this.registers[reg] = 0;
        });
    };
    Processor8086.prototype.getRegisters = function () {
        return this.registers;
    };
    return Processor8086;
}());
// Export the class if using modules
exports.default = Processor8086;
