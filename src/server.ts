import { PrismaClient } from "@prisma/client";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";

interface AddressQuery {
  cursor?: string;
  pageSize?: string;
}

interface DeleteParams {
  id: string;
}

interface UpdateParams {
  id: string;
}

interface UpdateBody {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const main = async () => {
  const prisma = new PrismaClient();
  const server = Fastify({ logger: true });
  const port = process.env.PORT || 4001;

  // Register the CORS plugin with wildcard for any origin
  await server.register(fastifyCors, {
    origin: true, // Allows any origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  });

  // Fetch all addresses with cursor-based pagination
  server.get("/addresses", async (request, reply) => {
    const { cursor, pageSize = "10" } = request.query as AddressQuery;
    const take = parseInt(pageSize, 10);

    const addresses = await prisma.address.findMany({
      take: take + 1, // Fetch one more to check if there's a next page
      ...(cursor ? { skip: 1, cursor: { id: parseInt(cursor, 10) } } : {}),
      orderBy: { id: "asc" },
    });

    const hasNextPage = addresses.length > take;
    if (hasNextPage) {
      addresses.pop(); // Remove the extra item
    }

    const nextCursor = hasNextPage ? addresses[addresses.length - 1]?.id : null;

    reply.send({ addresses, nextCursor, hasNextPage });
  });

  // Delete an address by ID
  server.delete("/addresses/:id", async (request, reply) => {
    const { id } = request.params as DeleteParams;
    try {
      await prisma.address.delete({
        where: { id: parseInt(id, 10) },
      });
      reply.send({ message: "Address deleted successfully" });
    } catch (error) {
      reply.status(500).send({ error: "Address not found or deletion failed" });
    }
  });

  // Update an address by ID
  server.put("/addresses/:id", async (request, reply) => {
    const { id } = request.params as UpdateParams;
    const body = request.body as UpdateBody;

    try {
      const updatedAddress = await prisma.address.update({
        where: { id: parseInt(id, 10) },
        data: body,
      });
      reply.send({ message: "Address updated successfully", address: updatedAddress });
    } catch (error) {
      reply.status(500).send({ error: "Address not found or update failed" });
    }
  });

  try {
    await server.listen({ port: Number(port), host: '0.0.0.0' });
  } catch (err) {
    console.error(err);
    await prisma.$disconnect();
  }
};

main();
