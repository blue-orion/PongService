import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

function* userGenerator(count = 10) {
    for (let i = 0; i < count; i++) {
        yield {
            username: faker.internet.username(),
            passwd: faker.internet.password(),
        };
    }
}

async function main() {
    // 유저 생성
    const users = [...userGenerator(10)]; // 10명의 유저 생성

    await prisma.user.createMany({ data: users });


    console.log("Seed complete");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
