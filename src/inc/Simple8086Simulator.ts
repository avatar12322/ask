// 8086 Processor


type Register = "AL" | "CL" | "DL" | "BL" | "AH" | "CH" | "DH" | "BH" |
                "AX" | "CX" | "DX" | "BX" | "SP" | "BP" | "SI" | "DI" |
                "EAX" | "ECX" | "EDX" | "EBX" | "ESP" | "EBP" | "ESI" | "EDI";

const R8: Register[] = ["AL", "CL", "DL", "BL", "AH", "CH", "DH", "BH"];
const R16: Register[] = ["AX", "CX", "DX", "BX", "SP", "BP", "SI", "DI"];
const R32: Register[] = ["EAX", "ECX", "EDX", "EBX", "ESP", "EBP", "ESI", "EDI"];
const MOD: string[] = ["11", "00"];
let LABELS: [string, number][] = [];
let MACHINECODES: string[][] = [];

function checkRegisters(register: Register): RegisterInfo {
    if (R8.includes(register)) {
        return { size: 8, index: R8.indexOf(register) };
    } else if (R16.includes(register)) {
        return { size: 16, index: R16.indexOf(register) };
    } else if (R32.includes(register)) {
        return { size: 32, index: R32.indexOf(register) };
    } else {
        throw new Error('Invalid register'); 
    }
}

function decToBin(number: number): string {
    let value = number.toString(2);
    while (value.length < 3) {
        value = "0" + value;
    }
    return value.slice(-3);
}



function addBlock(reg1: Register, src: string): string[] {
    let regInfo1 = checkRegisters(reg1);
    let machineCode: string[] = [];

    // If src is an immediate value, use the immediate opcode.
    if (/^[0-9A-F]+H$/i.test(src)) {
        // The src is an immediate value, handle it appropriately.
        let immediateValue = src.replace('H', '');
        // Ensure the immediate value is the correct length (zero-padded if necessary)
        while (immediateValue.length < (regInfo1.size / 4)) immediateValue = "0" + immediateValue;
        
        // Use different opcodes depending on the size of the destination register
        let opcode = regInfo1.size === 8 ? "0x80" : "0x81"; // 0x83 for 8-bit sign-extended
        machineCode.push(opcode);

        // The ModR/M byte for a register and an immediate value is different,
        // here assuming the register is the destination (e.g., 11000reg)
        let modRM = "11" + "000" + decToBin(regInfo1.index);
        machineCode.push("0x" + parseInt(modRM, 2).toString(16));
        
        // Add immediate value to machine code (little-endian for x86)
        for (let i = 0; i < regInfo1.size; i += 8) {
            machineCode.push("0x" + immediateValue.substring(immediateValue.length - (i + 2), immediateValue.length - i));
        }
    } else {
        // The src is a register, proceed as before
        let regInfo2 = checkRegisters(src as Register);
        
        if (regInfo1.size !== regInfo2.size) {
            return ["Arguments must be of the same size"];
        }

        let binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        let decValue = parseInt(binaryValue, 2).toString(16);
        let opcode = regInfo1.size === 8 ? "0x00" : "0x01";
        machineCode.push(opcode, "0x" + decValue);
    }

    return machineCode;
}



function subBlock(reg1: Register, src: string): string[] {
    let regInfo1 = checkRegisters(reg1);
    let machineCode: string[] = [];
    
    if (/^[0-9A-F]+H$/i.test(src)) {
        // src is an immediate value
        // ... Handle immediate value
    } else {
        // src is a register
        let regInfo2 = checkRegisters(src as Register);
        
        if (regInfo1.size !== regInfo2.size) {
            return ["Arguments must be of the same size"];
        }

        let opcode = regInfo1.size === 8 ? "0x28" : "0x29";
        machineCode.push(opcode);

        let binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        let decValue = parseInt(binaryValue, 2).toString(16);
        machineCode.push("0x" + decValue);
    }

    return machineCode;
}




function andBlock(reg1: Register, reg2: Register): string[] {
    const opcodes = ["0x20", "0x21", "0x22", "0x23"];
    let regInfo1 = checkRegisters(reg1);
    let regInfo2 = checkRegisters(reg2);

    if (regInfo1.size !== regInfo2.size) {
        return ["Arguments must be of the same size"];
    }

    let binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
    let decValue = parseInt(binaryValue, 2).toString(16);

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

function orBlock(reg1: Register, src: any): string[] {
    const opcodes = ["0x08", "0x09", "0x0A", "0x0B"];
    let regInfo1 = checkRegisters(reg1);
    let machineCode: string[] = [];

    if (typeof src === 'string' && !src.endsWith("H")) {
        let regInfo2: RegisterInfo;
        try {
            regInfo2 = checkRegisters(src as Register);
        } catch (e) {
            return ["Invalid source register or immediate value"];
        }

        if (regInfo1.size !== regInfo2.size) {
            return ["Source and destination registers must be the same size"];
        }

        let binaryValue = MOD[0] + decToBin(regInfo2.index) + decToBin(regInfo1.index);
        let decValue = parseInt(binaryValue, 2).toString(16);

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
    } else {
    }

    return machineCode;
}


type RegisterSize = 8 | 16 | 32;

type RegisterInfo = {
    size: RegisterSize;
    index: number;
}

type Opcodes = {
    regToReg: string;
    immToReg: Record<RegisterSize, string>;
};

const opcodes: Opcodes = {
    regToReg: "0x89",
    immToReg: {
        8: "0xB0",
        16: "0xB8",
        32: "0xB8"
    }
};

function movBlock(dest: Register, src: string): string[] {
    let destRegInfo = checkRegisters(dest);
    let machineCode: string[] = [];

    if (/^[0-9A-F]+H$/i.test(src)) {
        let immValue = src.replace('H', '');
        while (immValue.length < (destRegInfo.size / 4)) immValue = "0" + immValue;
        machineCode.push(opcodes.immToReg[destRegInfo.size]);
        for (let i = immValue.length; i > 0; i -= 2) {
            machineCode.push("0x" + immValue.substring(i - 2, i));
        }
    }
    else {
        let srcRegInfo: RegisterInfo;
        try {
            srcRegInfo = checkRegisters(src as Register);
        } catch (e) {
            return ["Invalid source register"];
        }
        
        if (destRegInfo.size !== srcRegInfo.size) {
            return ["Source and destination registers must be the same size"];
        }
        machineCode.push(opcodes.regToReg);
        let modRM = "11" + decToBin(srcRegInfo.index) + decToBin(destRegInfo.index);
        machineCode.push("0x" + parseInt(modRM, 2).toString(16));
    }

    return machineCode;
}




function assembler(instruction: string[], counter: number): void {
    const command = instruction[0].toUpperCase();
    let machineCode: string[];

    switch (command) {
        case "MOV":
            machineCode = movBlock(instruction[1] as Register, instruction[2]);
            break;
        case "ADD":
            machineCode = addBlock(instruction[1] as Register, instruction[2] as Register);
            break;
        case "SUB":
            machineCode = subBlock(instruction[1] as Register, instruction[2] as Register);
            break;
        case "AND":
            machineCode = andBlock(instruction[1] as Register, instruction[2] as Register);
            break;
        case "OR":
            machineCode = orBlock(instruction[1] as Register, instruction[2] as Register);
            break;
        default:
            console.log("Invalid instruction:", instruction);
            return;

            
    }
    if (machineCode.length > 0) {
        machineCodeHandler(machineCode, counter);
    }
}

function machineCodeHandler(token: string[], counter: number): void {
    if (counter >= COUNTER.length) {
        // Expand the COUNTER array if needed
        COUNTER = [...COUNTER, ...new Array(10).fill(0)]; // Add 10 more slots, for example
    }

    let mem = COUNTER[counter].toString(16).padStart(4, '0');
    let newCode = [mem, ...token];
    MACHINECODES.push(newCode);

    // Update the next counter value safely
    COUNTER[counter + 1] = (COUNTER[counter] + token.length) || 0;
}

const exampleInstructions: string[][] = [
    ["MOV", "AX", "BEEFH"],    // Move immediate value to AX
    ["MOV", "CL", "DL"],       // Move value from DL to CL
    ["MOV", "BH", "00C0H"],    // Move immediate value to BH
    ["ADD", "SI", "DI"],       // Add DI to SI
    ["OR", "SP", "BP"],        // Logical OR SP with BP
    ["AND", "CH", "DH"],       // Logical AND CH with DH
    ["SUB", "EAX", "EBX"],     // Subtract EBX from EAX
    ["ADD", "AL", "10H"],      // Add immediate value to AL
    ["OR", "DX", "1234H"],     // Logical OR DX with immediate value
    ["SUB", "BL", "20H"],      // Subtract immediate value from BL
    ["AND", "ECX", "EDX"],     // Logical AND ECX with EDX
    ["MOV", "DI", "0FF00H"],   // Move immediate value to DI
    ["ADD", "BH", "AL"],       // Add AL to BH
];

let COUNTER: number[] = new Array(exampleInstructions.length).fill(0);

// Processing the instructions
exampleInstructions.forEach((instruction, index) => {
    assembler(instruction, index);
});





COUNTER = [0];
MACHINECODES = [];

exampleInstructions.forEach((instruction, index) => {
    assembler(instruction, index);
});


console.log("Machine Codes:", MACHINECODES);
console.log("Counter:", COUNTER);

class Processor8086 {
    [x: string]: any;
    private registers: { [key in Register]?: number } = {}; // A mapping of register names to their values

    constructor() {
        // Initialize the registers
        this.reset();
    }

    public start() {
        console.log('Simulation started');
        // Process each instruction in exampleInstructions
        exampleInstructions.forEach((instruction, index) => {
          assembler(instruction, index);
        });
        // After processing instructions, update the display, etc.
      }

    public step() {
        console.log('Stepped through an instruction');
        // Logic for stepping through one instruction
    }

    public reset() {
        // Reset all registers to 0
        R8.concat(R16, R32).forEach(reg => {
            this.registers[reg] = 0;
        });
    }

    public getRegisters() {
        return this.registers;
    }
    

    // Additional methods to handle simulation logic
}

// Export the class if using modules
export default Processor8086;