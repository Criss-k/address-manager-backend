import { PrismaClient } from "@prisma/client";
import casual from "casual";

const prisma = new PrismaClient();

async function main() {
  for (let id = 1; id < 50; id++) {
    await prisma.address.upsert({
      create: {
        id,
        address: casual.address1,
        country: casual.country,
        zip: casual.zip({ digits: 5 }),
      },
      update: {},
      where: { id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
