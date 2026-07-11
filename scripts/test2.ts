import { UserRole } from "generated/prisma/enums";

const r:Record<string,number>={
    ['hi']:1,
    'hello':2
}

console.log('hii' in r);
