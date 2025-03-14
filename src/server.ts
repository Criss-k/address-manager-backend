import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

const main = async () => {
  const prisma = new PrismaClient();
  const server = Fastify({ logger: true });

  // Register the CORS plugin
  await server.register(fastifyCors, {
    origin: "http://localhost:3000", // Allow only this origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  });

  // Fetch all addresses
  server.get("/addresses", async (_request) => {
    const addresses = await prisma.address.findMany();
    return { addresses };
  });

  // Delete an address by ID
  server.delete<{Params: { id: string }}>("/addresses/:id", async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.address.delete({
        where: { id: parseInt(id, 10) },
      });
      reply.send({ message: "Address deleted successfully" });
    } catch (error) {
      reply.status(500).send({ error: "Address not found or deletion failed" });
    }
  });

  try {
    await server.listen({ port: 4001 });
  } catch (err) {
    console.error(err);
    await prisma.$disconnect();
  }
};

main();
